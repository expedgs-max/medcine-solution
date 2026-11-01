<?php
// backend/api/consultations.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetConsultations($db);
        break;
    case 'POST':
        handleCreateConsultation($db);
        break;
    case 'DELETE':
        handleDeleteConsultation($db);
        break;
    default:
        sendResponse("error", null, "Méthode HTTP non autorisée", 405);
}

function handleGetConsultations($db) {
    try {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        $patientId = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : null;

        $sql = "SELECT c.*, 
                       COALESCE(CONCAT(p.first_name, ' ', p.last_name), c.patient_name, 'Patient sans compte') AS patient_name,
                       p.first_name AS patient_first_name,
                       p.last_name AS patient_last_name,
                       p.dob AS patient_dob,
                       p.file_number AS patient_file_number,
                       p.blood_group AS patient_blood_group,
                       p.phone AS patient_phone
                FROM consultations c
                LEFT JOIN patients p ON c.patient_id = p.id ";

        $params = [];
        if ($id) {
            $sql .= " WHERE c.id = :id ";
            $params[':id'] = $id;
        } elseif ($patientId) {
            $sql .= " WHERE c.patient_id = :patient_id ";
            $params[':patient_id'] = $patientId;
        }

        $sql .= " ORDER BY c.consultation_date DESC, c.consultation_time DESC, c.created_at DESC, c.id DESC ";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $consultations = [];
        foreach ($rows as $r) {
            // Calculer l'âge
            $age = null;
            if (!empty($r['patient_dob'])) {
                $dobDate = new DateTime($r['patient_dob']);
                $today = new DateTime();
                $age = $today->diff($dobDate)->y;
            }

            // Récupérer les médicaments si une ordonnance existe
            $prescriptionData = null;
            if (!empty($r['prescription_id'])) {
                $pStmt = $db->prepare("SELECT * FROM prescriptions WHERE id = :pid");
                $pStmt->execute([':pid' => $r['prescription_id']]);
                $presc = $pStmt->fetch();

                if ($presc) {
                    $itemsStmt = $db->prepare("SELECT medication, dosage, posology, duration, renewable FROM prescription_items WHERE prescription_id = :pid");
                    $itemsStmt->execute([':pid' => $presc['id']]);
                    $items = $itemsStmt->fetchAll();

                    $prescriptionData = [
                        "id" => intval($presc['id']),
                        "prescriptionNumber" => $presc['prescription_number'],
                        "patientId" => !empty($presc['patient_id']) ? intval($presc['patient_id']) : null,
                        "patientName" => $r['patient_name'],
                        "date" => $presc['prescription_date'],
                        "validity" => $presc['validity'],
                        "ald" => boolval($presc['ald']),
                        "doctorName" => $presc['doctor_name'],
                        "items" => $items,
                        "notes" => $presc['notes'],
                        "validated" => boolval($presc['validated'])
                    ];
                }
            }

            // Récupérer le compte-rendu d'échographie spécialisé si existant
            $echoReport = null;
            $echoStmt = $db->prepare("SELECT * FROM ultrasound_reports WHERE consultation_id = :cid LIMIT 1");
            $echoStmt->execute([':cid' => $r['id']]);
            $echoRow = $echoStmt->fetch();
            if ($echoRow) {
                if (!empty($echoRow['morphology_details']) && is_string($echoRow['morphology_details'])) {
                    $echoRow['morphology_details'] = json_decode($echoRow['morphology_details'], true);
                }
                $echoReport = $echoRow;
            }

            // Récupérer les documents rattachés à cette consultation
            $docStmt = $db->prepare("SELECT id, title, category, doc_date as date, file_path as filePath, file_size as fileSize, file_type as fileType, status FROM medical_documents WHERE consultation_id = :cid ORDER BY id DESC");
            $docStmt->execute([':cid' => $r['id']]);
            $attachedDocs = $docStmt->fetchAll(PDO::FETCH_ASSOC);

            $isGuest = empty($r['patient_id']);

            $consultations[] = [
                "id" => intval($r['id']),
                "consultationNumber" => $r['consultation_number'],
                "patientId" => !empty($r['patient_id']) ? intval($r['patient_id']) : null,
                "isGuest" => $isGuest,
                "patientName" => $r['patient_name'],
                "date" => $r['consultation_date'],
                "time" => substr($r['consultation_time'], 0, 5),
                "reason" => $r['reason'],
                "billingCode" => $r['billing_code'],
                "vitals" => [
                    "bp" => $r['bp'] ?: "-",
                    "weight" => $r['weight'] ? strval($r['weight']) : "-",
                    "temperature" => $r['temperature'] ? strval($r['temperature']) : "-",
                    "heartRate" => $r['heart_rate'] ? strval($r['heart_rate']) : "-",
                    "ddr" => $r['ddr'] ?: "-",
                    "terme" => $r['terme'] ?: "-"
                ],
                "examFindings" => $r['exam_findings'],
                "diagnosis" => $r['diagnosis'],
                "recommendations" => $r['recommendations'],
                "echoFindings" => $r['echo_findings'],
                "echoConclusion" => $r['echo_conclusion'],
                "echoType" => $r['echo_type'],
                "echoData" => $echoReport['morphology_details'] ?? null,
                "prescriptionCreated" => boolval($r['prescription_created']),
                "prescriptionId" => $r['prescription_id'] ? intval($r['prescription_id']) : null,
                "prescriptionData" => $prescriptionData,
                "ultrasoundReport" => $echoReport,
                "documents" => $attachedDocs,
                "patientDetails" => [
                    "nom" => !empty($r['patient_last_name']) ? $r['patient_last_name'] : $r['patient_name'],
                    "prenom" => $r['patient_first_name'] ?? "",
                    "dob" => $r['patient_dob'] ?? "-",
                    "age" => $age ? ($age . " ans") : "",
                    "fileNumber" => !empty($r['patient_file_number']) ? $r['patient_file_number'] : "SANS DOSSIER",
                    "bloodGroup" => $r['patient_blood_group'] ?? "-",
                    "phone" => $r['patient_phone'] ?? ""
                ],
                "status" => $r['status']
            ];
        }

        sendResponse("success", $consultations, "Consultations récupérées avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur lors de la récupération : " . $e->getMessage(), 500);
    }
}

function handleCreateConsultation($db) {
    $body = getRequestBody();

    $patientId = !empty($body['patientId']) ? intval($body['patientId']) : null;
    $patientName = !empty($body['patientName']) ? trim($body['patientName']) : null;

    if (empty($patientId) && empty($patientName)) {
        sendResponse("error", null, "Le patient ou son nom est requis", 400);
    }

    try {
        $db->beginTransaction();

        $date = !empty($body['date']) ? $body['date'] : date('Y-m-d');
        $time = !empty($body['time']) ? $body['time'] : date('H:i:s');
        $reason = !empty($body['reason']) ? trim($body['reason']) : "Consultation médicale";
        if (!empty($body['billingCode'])) {
            $billingCode = $body['billingCode'];
        } else {
            $setStmt = $db->query("SELECT default_consultation_type, consultation_price FROM settings ORDER BY id ASC LIMIT 1");
            $setRow = $setStmt ? $setStmt->fetch() : null;
            if ($setRow && !empty($setRow['default_consultation_type'])) {
                $pr = isset($setRow['consultation_price']) ? number_format((float)$setRow['consultation_price'], 0, '', ' ') : '3 000';
                $billingCode = $setRow['default_consultation_type'] . " (" . $pr . " DA)";
            } else {
                $billingCode = "Consultation générale (2 500 DA)";
            }
        }

        // Générer le numéro de consultation séquentiel unique
        $year = date('Y', strtotime($date));
        $countStmt = $db->query("SELECT COALESCE(MAX(id), 0) FROM consultations");
        $count = $countStmt->fetchColumn() + 1;
        $consultNumber = !empty($body['consultationNumber'])
            ? $body['consultationNumber']
            : sprintf("CS-%s-%04d", $year, $count);
        $chkCNum = $db->prepare("SELECT COUNT(*) FROM consultations WHERE consultation_number = :num");
        $chkCNum->execute([':num' => $consultNumber]);
        if ($chkCNum->fetchColumn() > 0) {
            $consultNumber = sprintf("CS-%s-%04d-%d", $year, $count, rand(10, 99));
        }

        $vitals = isset($body['vitals']) && is_array($body['vitals']) ? $body['vitals'] : [];
        $bp = $vitals['bp'] ?? ($body['bp'] ?? null);
        $weight = isset($vitals['weight']) && is_numeric($vitals['weight']) ? floatval($vitals['weight']) : (isset($body['weight']) && is_numeric($body['weight']) ? floatval($body['weight']) : null);
        $temperature = isset($vitals['temperature']) && is_numeric($vitals['temperature']) ? floatval($vitals['temperature']) : (isset($body['temperature']) && is_numeric($body['temperature']) ? floatval($body['temperature']) : null);
        $heartRate = isset($vitals['heartRate']) && is_numeric($vitals['heartRate']) ? intval($vitals['heartRate']) : (isset($body['heartRate']) && is_numeric($body['heartRate']) ? intval($body['heartRate']) : null);
        $ddr = $vitals['ddr'] ?? ($body['ddr'] ?? null);
        $terme = $vitals['terme'] ?? ($body['terme'] ?? null);

        $symptoms = $body['symptoms'] ?? null;
        $examFindings = $body['examFindings'] ?? null;
        $diagnosis = $body['diagnosis'] ?? "Bilan médical normal";
        $recommendations = $body['recommendations'] ?? null;
        $examType = $body['examType'] ?? null;
        $echoType = $body['echoType'] ?? (!empty($examType) ? ("Échographie " . strtoupper($examType)) : null);
        $echoFindings = $body['echoFindings'] ?? ($body['conclusion'] ?? null);
        $echoConclusion = $body['echoConclusion'] ?? ($body['conclusionText'] ?? ($body['diagnosis'] ?? null));

        // Insertion dans la table consultations
        $cSql = "INSERT INTO consultations 
                    (consultation_number, patient_id, patient_name, doctor_id, consultation_date, consultation_time, 
                     reason, bp, weight, temperature, heart_rate, ddr, terme, symptoms, exam_findings, 
                     echo_type, echo_findings, echo_conclusion, diagnosis, recommendations, billing_code, status)
                 VALUES 
                    (:num, :pid, :pname, 1, :cdate, :ctime, :reason, :bp, :weight, :temp, :hr, :ddr, :terme, 
                     :symptoms, :exam, :etype, :efind, :econcl, :diag, :recom, :bcode, 'Clôturée')";

        $cStmt = $db->prepare($cSql);
        $cStmt->execute([
            ':num' => $consultNumber,
            ':pid' => $patientId,
            ':pname' => $patientName,
            ':cdate' => $date,
            ':ctime' => strlen($time) === 5 ? ($time . ":00") : $time,
            ':reason' => $reason,
            ':bp' => $bp,
            ':weight' => $weight,
            ':temp' => $temperature,
            ':hr' => $heartRate,
            ':ddr' => (!empty($ddr) && $ddr !== '-') ? $ddr : null,
            ':terme' => $terme,
            ':symptoms' => $symptoms,
            ':exam' => $examFindings,
            ':etype' => $echoType,
            ':efind' => $echoFindings,
            ':econcl' => $echoConclusion,
            ':diag' => $diagnosis,
            ':recom' => $recommendations,
            ':bcode' => $billingCode
        ]);

        $consultationId = intval($db->lastInsertId());

        // 1. Gestion de l'Ordonnance Médicale
        $prescriptionId = null;
        $prescriptionData = null;
        $hasPrescription = false;

        $prescPayload = $body['prescriptionData'] ?? null;
        $rawItems = $body['prescriptionItems'] ?? ($prescPayload['items'] ?? []);

        if (is_array($rawItems) && count($rawItems) > 0) {
            $validItems = array_filter($rawItems, function($i) {
                return !empty(trim($i['medication'] ?? ''));
            });

            if (count($validItems) > 0) {
                $hasPrescription = true;
                $prescCount = $db->query("SELECT COALESCE(MAX(id), 0) FROM prescriptions")->fetchColumn() + 1;
                $prescNumber = $prescPayload['prescriptionNumber'] ?? sprintf("ORD-%s-%04d", $year, $prescCount);
                $chkPNum = $db->prepare("SELECT COUNT(*) FROM prescriptions WHERE prescription_number = :num");
                $chkPNum->execute([':num' => $prescNumber]);
                if ($chkPNum->fetchColumn() > 0) {
                    $prescNumber = sprintf("ORD-%s-%04d-%d", $year, $prescCount, rand(10, 99));
                }
                $docName = $prescPayload['doctorName'] ?? "Dr N. BELBACHIR OULD HENNIA";

                $pSql = "INSERT INTO prescriptions 
                            (prescription_number, consultation_id, patient_id, patient_name, doctor_name, prescription_date, validity, ald, notes, validated)
                         VALUES 
                            (:pnum, :cid, :pid, :pname, :dname, :pdate, '3 mois', 0, :notes, 1)";
                $pStmt = $db->prepare($pSql);
                $pStmt->execute([
                    ':pnum' => $prescNumber,
                    ':cid' => $consultationId,
                    ':pid' => $patientId,
                    ':pname' => $patientName,
                    ':dname' => $docName,
                    ':pdate' => $date,
                    ':notes' => $recommendations ?: "Respecter la posologie prescrite."
                ]);

                $prescriptionId = intval($db->lastInsertId());

                // Insertion des médicaments
                $itSql = "INSERT INTO prescription_items 
                            (prescription_id, medication, dosage, posology, duration, renewable)
                          VALUES 
                            (:pid, :med, :dos, :pos, :dur, :ren)";
                $itStmt = $db->prepare($itSql);

                foreach ($validItems as $it) {
                    $itStmt->execute([
                        ':pid' => $prescriptionId,
                        ':med' => trim($it['medication']),
                        ':dos' => $it['dosage'] ?? null,
                        ':pos' => $it['posology'] ?? '1 comprimé par jour',
                        ':dur' => $it['duration'] ?? '5 jours',
                        ':ren' => $it['renewable'] ?? 'Non renouvelable'
                    ]);
                }

                // Mettre à jour la consultation avec la prescription liée et ajouter au catalogue si nouveau
                foreach ($validItems as $it) {
                    try {
                        $mName = trim($it['medication']);
                        $chkMed = $db->prepare("SELECT id FROM medications WHERE LOWER(name) = LOWER(:name) LIMIT 1");
                        $chkMed->execute([':name' => $mName]);
                        if (!$chkMed->fetch()) {
                            $insMed = $db->prepare("INSERT INTO medications (name, dosage, default_posology, default_duration) VALUES (:name, :dos, :pos, :dur)");
                            $insMed->execute([
                                ':name' => $mName,
                                ':dos' => $it['dosage'] ?? null,
                                ':pos' => $it['posology'] ?? '1 comprimé par jour',
                                ':dur' => $it['duration'] ?? '5 jours'
                            ]);
                        }
                    } catch (Exception $e) {}
                }
                $upStmt = $db->prepare("UPDATE consultations SET prescription_created = 1, prescription_id = :prid WHERE id = :cid");
                $upStmt->execute([':prid' => $prescriptionId, ':cid' => $consultationId]);

                $prescriptionData = [
                    "id" => $prescriptionId,
                    "prescriptionNumber" => $prescNumber,
                    "patientId" => $patientId,
                    "date" => $date,
                    "doctorName" => $docName,
                    "items" => array_values($validItems),
                    "validated" => true
                ];

                // Enregistrer dans medical_documents UNIQUEMENT si le patient est enregistré avec dossier
                if (!empty($patientId)) {
                    try {
                        $docSql = "INSERT INTO medical_documents 
                                    (patient_id, consultation_id, title, category, doc_date, author, file_size, file_type, status)
                                   VALUES 
                                    (:pid, :cid, :title, 'Autre', :ddate, :author, 'Ordonnance', 'Prescription', 'Validée')";
                        $db->prepare($docSql)->execute([
                            ':pid' => $patientId,
                            ':cid' => $consultationId,
                            ':title' => "Ordonnance Médicale #" . $prescNumber,
                            ':ddate' => $date,
                            ':author' => $docName
                        ]);
                    } catch (Exception $e) {}
                }
            }
        }

        // 2. Gestion du Compte-Rendu Échographique Spécialisé (si applicable)
        $hasEcho = !empty($examType) || !empty($body['echoData']) || !empty($echoType) || !empty($echoFindings);
        if ($hasEcho) {
            $echoCount = $db->query("SELECT COALESCE(MAX(id), 0) FROM ultrasound_reports")->fetchColumn() + 1;
            $reportNumber = sprintf("CR-ECHO-%s-%04d-%d", $year, $echoCount, rand(10, 99));

            $calc = $body['calculated'] ?? [];
            $echoData = $body['echoData'] ?? [];

            $repSql = "INSERT INTO ultrasound_reports 
                        (report_number, consultation_id, patient_id, patient_name, exam_type, exam_date, indication, 
                         ddr, terme_sa, bip_mm, pc_mm, ca_mm, lf_mm, lcc_mm, cn_mm, epf_hadlock_g, 
                         morphology_details, findings, conclusion)
                       VALUES 
                        (:rnum, :cid, :pid, :pname, :etype, :edate, :indic, :ddr, :terme, 
                         :bip, :pc, :ca, :lf, :lcc, :cn, :epf, :morpho, :find, :concl)";

            $repStmt = $db->prepare($repSql);
            $repStmt->execute([
                ':rnum' => $reportNumber,
                ':cid' => $consultationId,
                ':pid' => $patientId,
                ':pname' => $patientName,
                ':etype' => in_array($examType, ['ob1','ob2','ob3','gyn','ggt1','ggt23']) ? $examType : 'ob2',
                ':edate' => $date,
                ':indic' => $reason,
                ':ddr' => (!empty($ddr) && $ddr !== '-') ? $ddr : null,
                ':terme' => $terme,
                ':bip' => isset($echoData['ob2_bip']) && is_numeric($echoData['ob2_bip']) ? floatval($echoData['ob2_bip']) : null,
                ':pc' => isset($echoData['ob2_pc']) && is_numeric($echoData['ob2_pc']) ? floatval($echoData['ob2_pc']) : null,
                ':ca' => isset($echoData['ob2_ca']) && is_numeric($echoData['ob2_ca']) ? floatval($echoData['ob2_ca']) : null,
                ':lf' => isset($echoData['ob2_lf']) && is_numeric($echoData['ob2_lf']) ? floatval($echoData['ob2_lf']) : null,
                ':lcc' => isset($echoData['ob1_lcc']) && is_numeric($echoData['ob1_lcc']) ? floatval($echoData['ob1_lcc']) : null,
                ':cn' => isset($echoData['ob1_cn']) && is_numeric($echoData['ob1_cn']) ? floatval($echoData['ob1_cn']) : null,
                ':epf' => isset($calc['ob2Poids']) ? intval($calc['ob2Poids']) : (isset($calc['ob3Poids']) ? intval($calc['ob3Poids']) : null),
                ':morpho' => json_encode($echoData, JSON_UNESCAPED_UNICODE),
                ':find' => $echoFindings ?: $examFindings,
                ':concl' => $echoConclusion ?: $diagnosis
            ]);

            // Enregistrer dans medical_documents UNIQUEMENT si le patient a un dossier
            if (!empty($patientId)) {
                try {
                    $docSql = "INSERT INTO medical_documents 
                                (patient_id, consultation_id, title, category, doc_date, author, file_size, file_type, status)
                               VALUES 
                                (:pid, :cid, :title, 'Imagerie & Radiologie', :ddate, 'Dr N. BELBACHIR OULD HENNIA', 'Compte-rendu officiel', 'Échographie', 'Archivé')";
                    $db->prepare($docSql)->execute([
                        ':pid' => $patientId,
                        ':cid' => $consultationId,
                        ':title' => "Compte-Rendu Échographique (" . ($echoType ?: "Échographie") . ")",
                        ':ddate' => $date
                    ]);
                } catch (Exception $e) {}
            }
        }

        // 3. Enregistrer automatiquement la facture et l'entrée dans le Journal de Caisse
        try {
            $invCount = $db->query("SELECT COALESCE(MAX(id), 0) FROM invoices")->fetchColumn() + 1;
            $invNumber = sprintf("FAC-%s-%04d-%d", $year, $invCount, rand(10, 99));

            // Calcul automatique du montant selon la cotation
            $amount = 2500.00;
            if (!empty($billingCode) && preg_match('/\(([^)]*?)DA\)/i', $billingCode, $m)) {
                $clean = preg_replace('/[^\d.]/', '', $m[1]);
                if (is_numeric($clean) && floatval($clean) > 0) {
                    $amount = floatval($clean);
                }
            } elseif ($hasEcho) {
                $amount = 4000.00;
            }

            $actDesc = !empty($billingCode) ? $billingCode : ($reason ?: "Consultation médicale");

            // Récupérer le nom et le téléphone pour la facture et la caisse
            $partyName = !empty($patientName) ? $patientName : "Patient";
            $partyPhone = "";
            if (!empty($patientId)) {
                $patInfoStmt = $db->prepare("SELECT CONCAT(first_name, ' ', last_name) AS full_name, phone FROM patients WHERE id = :pid LIMIT 1");
                $patInfoStmt->execute([':pid' => $patientId]);
                $patInfo = $patInfoStmt->fetch();
                if ($patInfo) {
                    $partyName = $patInfo['full_name'];
                    $partyPhone = $patInfo['phone'] ?? "";
                }
            }

            // 3b. Journal de Caisse (cash_entries)
            try {
                $isEchoAct = $hasEcho || stripos($reason, 'écho') !== false || stripos($reason, 'echo') !== false || stripos($billingCode, 'écho') !== false || stripos($billingCode, 'echo') !== false;
                $cashCategory = $isEchoAct ? 'ÉCHOGRAPHIE & DIAGNOSTIC' : 'CONSULTATION MÉDICALE';
                $cashRef = sprintf("REC-%s-%04d", str_replace('-', '', $date), $consultationId);
                $cashNotes = ($reason ?: "Consultation médicale") . " — Réf: " . $consultNumber;

                $maxCashStmt = $db->query("SELECT COALESCE(MAX(id), 0) + 1 FROM cash_entries WHERE id > 0");
                $nextCashId = intval($maxCashStmt->fetchColumn() ?: 1);

                $cashSql = "INSERT INTO cash_entries 
                                (id, type, reference, party_name, party_phone, category, amount, entry_date, payment_method, notes, operator)
                            VALUES 
                                (:id, 'RECETTE', :ref, :pname, :pphone, :cat, :amt, :edate, 'Espèces', :notes, 'Dr N. BELBACHIR OULD HENNIA')";
                $db->prepare($cashSql)->execute([
                    ':id' => $nextCashId,
                    ':ref' => $cashRef,
                    ':pname' => $partyName,
                    ':pphone' => $partyPhone,
                    ':cat' => $cashCategory,
                    ':amt' => $amount,
                    ':edate' => $date,
                    ':notes' => $cashNotes
                ]);
            } catch (Exception $e) {}

            $maxInvStmt = $db->query("SELECT COALESCE(MAX(id), 0) + 1 FROM invoices WHERE id > 0");
            $nextInvId = intval($maxInvStmt->fetchColumn() ?: 1);

            $invSql = "INSERT INTO invoices 
                        (id, invoice_number, patient_id, patient_name, consultation_id, invoice_date, act_description, amount, covered_amo, covered_amc, patient_remaining, payment_method, status)
                       VALUES 
                        (:id, :invNum, :pid, :pname, :cid, :idate, :actDesc, :amt, 0.00, 0.00, :rem, 'Espèces', 'Payée')";
            $db->prepare($invSql)->execute([
                ':id' => $nextInvId,
                ':invNum' => $invNumber,
                ':pid' => $patientId,
                ':pname' => $partyName,
                ':cid' => $consultationId,
                ':idate' => $date,
                ':actDesc' => $actDesc,
                ':amt' => $amount,
                ':rem' => $amount
            ]);
        } catch (Exception $e) {}

        // Mettre à jour la fiche patient UNIQUEMENT si le patient a un compte/dossier
        if (!empty($patientId)) {
            try {
                $patUpdates = ["last_visit = :lvisit"];
                $patParams = [':lvisit' => $date, ':pid' => $patientId];
                if (!empty($body['atcd']) && is_array($body['atcd'])) {
                    $atcd = $body['atcd'];
                    if (isset($atcd['gestite']) && is_numeric($atcd['gestite'])) {
                        $patUpdates[] = "gravida = :grav";
                        $patParams[':grav'] = intval($atcd['gestite']);
                    }
                    if (isset($atcd['parite']) && is_numeric($atcd['parite'])) {
                        $patUpdates[] = "para = :para";
                        $patParams[':para'] = intval($atcd['parite']);
                    }
                    if (isset($atcd['cesarienne']) && is_numeric($atcd['cesarienne'])) {
                        $patUpdates[] = "cesarean = :cesar";
                        $patParams[':cesar'] = intval($atcd['cesarienne']);
                    }
                    if (isset($atcd['faussesCouches']) && is_numeric($atcd['faussesCouches'])) {
                        $patUpdates[] = "abortions = :abort";
                        $patParams[':abort'] = intval($atcd['faussesCouches']);
                    }
                }
                $db->prepare("UPDATE patients SET " . implode(", ", $patUpdates) . " WHERE id = :pid")->execute($patParams);
            } catch (Exception $e) {}
        }

        // Enregistrer les pièces jointes dans medical_documents UNIQUEMENT si le patient a un dossier
        if (!empty($patientId) && !empty($body['documents']) && is_array($body['documents'])) {
            foreach ($body['documents'] as $doc) {
                $docPath = $doc['filePath'] ?? ($doc['dataUrl'] ?? null);
                if (!empty($docPath)) {
                    $docTitle = !empty($doc['title']) ? trim($doc['title']) : (!empty($doc['name']) ? trim($doc['name']) : 'Fichier Consultation');
                    $docCategory = $doc['category'] ?? 'Imagerie & Radiologie';
                    $docDate = $doc['date'] ?? $date;
                    $docAuthor = $doc['author'] ?? 'Dr N. BELBACHIR OULD HENNIA';
                    $docSize = $doc['fileSize'] ?? ($doc['size'] ?? '1.5 Mo');
                    $docType = $doc['fileType'] ?? ($doc['extension'] ?? 'Fichier');

                    try {
                        $docSql = "INSERT INTO medical_documents 
                                    (patient_id, consultation_id, title, category, doc_date, author, file_path, file_size, file_type, status)
                                   VALUES 
                                    (:pid, :cid, :title, :cat, :ddate, :author, :fpath, :fsize, :ftype, 'Validé')";
                        $db->prepare($docSql)->execute([
                            ':pid' => $patientId,
                            ':cid' => $consultationId,
                            ':title' => $docTitle,
                            ':cat' => $docCategory,
                            ':ddate' => $docDate,
                            ':author' => $docAuthor,
                            ':fpath' => $docPath,
                            ':fsize' => $docSize,
                            ':ftype' => $docType
                        ]);
                    } catch (Exception $e) {}
                }
            }
        }

        // Si le patient était dans la salle d'attente, mettre à jour son statut à 'Terminé'
        if (!empty($patientId)) {
            $upWait = $db->prepare("UPDATE waiting_room SET status = 'Terminé' WHERE patient_id = :pid AND status IN ('Attente', 'Appelé', 'En consultation')");
            $upWait->execute([':pid' => $patientId]);
        } elseif (!empty($patientName)) {
            $cleanPName = trim(preg_replace('/\s*\(sc\)\s*/i', '', $patientName));
            $upWait = $db->prepare("UPDATE waiting_room SET status = 'Terminé' WHERE (patient_name LIKE :pname1 OR patient_name LIKE :pname2) AND status IN ('Attente', 'Appelé', 'En consultation')");
            $upWait->execute([':pname1' => "%$cleanPName%", ':pname2' => "%$patientName%"]);
        }

        $db->commit();

        sendResponse("success", [
            "id" => $consultationId,
            "consultationNumber" => $consultNumber,
            "patientId" => $patientId,
            "isGuest" => empty($patientId),
            "patientName" => $patientName,
            "date" => $date,
            "time" => substr($time, 0, 5),
            "reason" => $reason,
            "billingCode" => $billingCode,
            "prescriptionCreated" => $hasPrescription,
            "prescriptionData" => $prescriptionData
        ], "Consultation enregistrée avec succès", 201);

    } catch (Exception $e) {
        $db->rollBack();
        sendResponse("error", null, "Erreur lors de l'enregistrement : " . $e->getMessage(), 500);
    }
}

function handleDeleteConsultation($db) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        sendResponse("error", null, "ID requis", 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM consultations WHERE id = :id");
        $stmt->execute([':id' => $id]);
        sendResponse("success", null, "Consultation supprimée avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur suppression : " . $e->getMessage(), 500);
    }
}
