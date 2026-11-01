<?php
// backend/api/appointments.php
// Gestion des rendez-vous et de l'agenda médical synchronisé MySQL

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetAppointments($db);
        break;
    case 'POST':
        handleCreateAppointment($db);
        break;
    case 'PUT':
        handleUpdateAppointment($db);
        break;
    case 'DELETE':
        handleDeleteAppointment($db);
        break;
    default:
        sendResponse("error", null, "Méthode non autorisée", 405);
}

function calculateTicketNumber($timeStr) {
    if (empty($timeStr)) return 1;
    $timeClean = substr(trim($timeStr), 0, 5);
    $allSlots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
        "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
        "17:00", "17:30"
    ];
    $idx = array_search($timeClean, $allSlots);
    if ($idx !== false) {
        return $idx + 1;
    }
    $parts = explode(':', $timeClean);
    $h = intval($parts[0] ?? 9);
    $m = intval($parts[1] ?? 0);
    $totalMinutes = $h * 60 + $m;
    $diff = $totalMinutes - (9 * 60);
    if ($diff >= 0) {
        return floor($diff / 30) + 1;
    }
    return 1;
}

function handleGetAppointments($db) {
    try {
        // Auto-réparation automatique : Si des rendez-vous ont id = 0, leur attribuer immédiatement un ID valide
        try {
            $zeroCheck = $db->query("SELECT COUNT(*) FROM appointments WHERE id = 0");
            if ($zeroCheck && intval($zeroCheck->fetchColumn()) > 0) {
                $db->exec("SET @new_id = (SELECT COALESCE(MAX(id), 20) FROM appointments WHERE id > 0); UPDATE appointments SET id = (@new_id := @new_id + 1) WHERE id = 0;");
            }
        } catch (Exception $e) {}

        $date = $_GET['date'] ?? null;
        $params = [];
        $where = "";

        if ($date) {
            $where = "WHERE a.appointment_date = :adate";
            $params[':adate'] = $date;
        }

        $sql = "SELECT a.*, 
                       a.patient_name AS raw_patient_name,
                       a.patient_phone AS raw_patient_phone,
                       p.first_name AS p_first_name,
                       p.last_name AS p_last_name,
                       p.phone AS p_phone,
                       COALESCE(NULLIF(TRIM(p.email), ''), NULLIF(TRIM(a.patient_email), ''), '') AS patient_email
                FROM appointments a
                LEFT JOIN patients p ON a.patient_id = p.id
                $where
                ORDER BY a.appointment_date ASC, a.appointment_time ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $appointments = [];
        foreach ($rows as $r) {
            $timeShort = substr($r['appointment_time'], 0, 5);
            $enteredName = trim($r['raw_patient_name'] ?? '');
            $enteredPhone = trim($r['raw_patient_phone'] ?? '');

            // Si le nom saisi ne contient que des chiffres et que le téléphone contient des lettres, rétablir l'ordre
            if ($enteredName !== '' && preg_match('/^[0-9+\s().-]+$/', $enteredName) && $enteredPhone !== '' && preg_match('/[a-zA-Z]/', $enteredPhone)) {
                $tmp = $enteredName;
                $enteredName = $enteredPhone;
                $enteredPhone = $tmp;
            }

            $dbFullName = trim(($r['p_first_name'] ?? '') . ' ' . ($r['p_last_name'] ?? ''));
            $finalPatientName = $enteredName !== '' ? $enteredName : ($dbFullName !== '' ? $dbFullName : 'Patient');
            $finalPhone = $enteredPhone !== '' ? $enteredPhone : trim($r['p_phone'] ?? '');

            $appointments[] = [
                "id" => intval($r['id']),
                "ticketNumber" => calculateTicketNumber($timeShort),
                "patientId" => !empty($r['patient_id']) ? intval($r['patient_id']) : null,
                "patientName" => $finalPatientName,
                "firstName" => $enteredName !== '' ? $enteredName : ($r['p_first_name'] ?? ''),
                "lastName" => $enteredName !== '' ? '' : ($r['p_last_name'] ?? ''),
                "phone" => $finalPhone,
                "email" => $r['patient_email'],
                "date" => $r['appointment_date'],
                "time" => $timeShort,
                "duration" => $r['duration'],
                "reason" => $r['reason'],
                "consultationType" => $r['consultation_type'] ?? 'Consultation générale',
                "price" => isset($r['price']) ? (float)$r['price'] : 2500.0,
                "status" => $r['status'],
                "notes" => $r['notes']
            ];
        }

        sendResponse("success", $appointments, "Rendez-vous récupérés avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur rendez-vous : " . $e->getMessage(), 500);
    }
}

function handleCreateAppointment($db) {
    $body = getRequestBody();

    $date = $body['date'] ?? null;
    $time = $body['time'] ?? null;

    if (empty($date) || empty($time)) {
        sendResponse("error", null, "Date et heure sont requis", 400);
    }

    try {
        $patientId = (!empty($body['patientId']) && $body['patientId'] !== 'sans_compte') ? intval($body['patientId']) : null;
        $patientName = trim($body['patientName'] ?? '');
        $patientPhone = trim($body['patientPhone'] ?? ($body['phone'] ?? ''));
        $patientEmail = trim($body['patientEmail'] ?? ($body['email'] ?? ''));

        // Si le nom saisi ne contient que des chiffres et que le téléphone contient des lettres, rétablir l'ordre
        if ($patientName !== '' && preg_match('/^[0-9+\s().-]+$/', $patientName) && $patientPhone !== '' && preg_match('/[a-zA-Z]/', $patientPhone)) {
            $tmp = $patientName;
            $patientName = $patientPhone;
            $patientPhone = $tmp;
        }

        // Si un patientId est fourni mais que patientName est vide, récupérer le nom depuis la table patients
        if ($patientId && empty($patientName)) {
            $find = $db->prepare("SELECT CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) AS full_name FROM patients WHERE id = :id LIMIT 1");
            $find->execute([':id' => $patientId]);
            $existing = $find->fetch(PDO::FETCH_ASSOC);
            if ($existing && !empty(trim($existing['full_name']))) {
                $patientName = trim($existing['full_name']);
            }
        }

        $consultationType = $body['consultationType'] ?? ($body['consultation_type'] ?? ($body['reason'] ?? 'Consultation générale'));
        $price = isset($body['price']) ? (float)$body['price'] : 2500.0;
        $reason = $body['reason'] ?? $consultationType;

        // Calculer l'ID automatiquement pour garantir un ID unique même si AUTO_INCREMENT est manquant dans la table
        $maxStmt = $db->query("SELECT COALESCE(MAX(id), 20) + 1 FROM appointments WHERE id > 0");
        $nextId = intval($maxStmt->fetchColumn() ?: 21);

        $sql = "INSERT INTO appointments (id, patient_id, patient_name, patient_phone, patient_email, doctor_id, appointment_date, appointment_time, duration, reason, consultation_type, price, status, notes)
                VALUES (:id, :pid, :pname, :pphone, :pemail, 1, :adate, :atime, :dur, :reason, :ctype, :price, :status, :notes)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':id' => $nextId,
            ':pid' => $patientId,
            ':pname' => !empty($patientName) ? $patientName : null,
            ':pphone' => !empty($patientPhone) ? $patientPhone : null,
            ':pemail' => !empty($patientEmail) ? $patientEmail : null,
            ':adate' => $date,
            ':atime' => strlen($time) === 5 ? ($time . ":00") : $time,
            ':dur' => $body['duration'] ?? '20 min',
            ':reason' => $reason,
            ':ctype' => $consultationType,
            ':price' => $price,
            ':status' => $body['status'] ?? 'Confirmé',
            ':notes' => $body['notes'] ?? null
        ]);

        $newId = $nextId;
        $ticketNo = calculateTicketNumber($time);

        // Si créé avec le statut Arrivé
        if (($body['status'] ?? '') === 'Arrivé') {
            $insWait = $db->prepare("
                INSERT INTO waiting_room (patient_id, patient_name, patient_phone, appointment_id, appointment_time, arrival_time, reason, status)
                VALUES (:pid, :pname, :pphone, :aid, :atime, CURTIME(), :reason, 'En attente')
            ");
            $insWait->execute([
                ':pid' => $patientId ?: null,
                ':pname' => $patientName ?: null,
                ':pphone' => $patientPhone ?: null,
                ':aid' => $newId,
                ':atime' => strlen($time) === 5 ? ($time . ":00") : $time,
                ':reason' => $body['reason'] ?? 'Consultation générale'
            ]);
        }

        sendResponse("success", [
            "id" => $newId,
            "ticketNumber" => $ticketNo,
            "patientId" => $patientId,
            "patientName" => $patientName,
            "phone" => $patientPhone,
            "email" => $patientEmail,
            "date" => $date,
            "time" => substr($time, 0, 5),
            "status" => $body['status'] ?? 'Confirmé'
        ], "Rendez-vous créé avec succès dans MySQL", 201);
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur création rendez-vous : " . $e->getMessage(), 500);
    }
}

function handleUpdateAppointment($db) {
    $body = getRequestBody();
    $rawId = $body['id'] ?? $_GET['id'] ?? $_REQUEST['id'] ?? null;

    if ($rawId === null || $rawId === '') {
        sendResponse("error", null, "Identifiant rendez-vous manquant", 400);
    }

    $id = 0;
    if (is_numeric($rawId)) {
        $id = (int)$rawId;
    } elseif (is_string($rawId) && preg_match('/(\d+)/', $rawId, $matches)) {
        $id = (int)$matches[1];
    }

    // Si l'id reçu est 0, lui réassigner un vrai ID unique en base au lieu d'échouer avec 400
    if ($id <= 0 && ($rawId === 0 || $rawId === '0' || $rawId === 'RDV-0')) {
        $maxQ = $db->query("SELECT COALESCE(MAX(id), 20) + 1 FROM appointments WHERE id > 0");
        $assignedId = intval($maxQ->fetchColumn() ?: 21);
        $db->prepare("UPDATE appointments SET id = :new_id WHERE id = 0 LIMIT 1")->execute([':new_id' => $assignedId]);
        $id = $assignedId;
    }

    if ($id <= 0) {
        sendResponse("error", null, "Identifiant rendez-vous invalide : " . json_encode($rawId), 400);
    }

    try {
        $fields = [];
        $params = [':id' => $id];

        if (isset($body['status'])) {
            $fields[] = "status = :status";
            $params[':status'] = $body['status'];
        }
        if (isset($body['date']) || isset($body['appointment_date']) || isset($body['appointmentDate'])) {
            $fields[] = "appointment_date = :adate";
            $params[':adate'] = $body['date'] ?? ($body['appointment_date'] ?? $body['appointmentDate']);
        }
        if (isset($body['time']) || isset($body['appointment_time']) || isset($body['appointmentTime'])) {
            $tVal = $body['time'] ?? ($body['appointment_time'] ?? $body['appointmentTime']);
            $fields[] = "appointment_time = :atime";
            $params[':atime'] = strlen($tVal) === 5 ? ($tVal . ":00") : $tVal;
        }
        if (isset($body['duration'])) {
            $fields[] = "duration = :dur";
            $params[':dur'] = $body['duration'];
        }
        if (isset($body['reason'])) {
            $fields[] = "reason = :reason";
            $params[':reason'] = $body['reason'];
        }
        if (isset($body['consultationType']) || isset($body['consultation_type'])) {
            $fields[] = "consultation_type = :ctype";
            $params[':ctype'] = $body['consultationType'] ?? $body['consultation_type'];
        }
        if (isset($body['price'])) {
            $fields[] = "price = :price";
            $params[':price'] = (float)$body['price'];
        }
        if (isset($body['patientPhone']) || isset($body['patient_phone']) || isset($body['phone'])) {
            $fields[] = "patient_phone = :pphone";
            $params[':pphone'] = trim($body['patientPhone'] ?? ($body['patient_phone'] ?? $body['phone']));
        }
        if (isset($body['patientEmail']) || isset($body['patient_email']) || isset($body['email'])) {
            $fields[] = "patient_email = :pemail";
            $params[':pemail'] = trim($body['patientEmail'] ?? ($body['patient_email'] ?? $body['email']));
        }
        if (array_key_exists('patientId', $body) || array_key_exists('patient_id', $body)) {
            $pidVal = $body['patientId'] ?? ($body['patient_id'] ?? null);
            $fields[] = "patient_id = :pid";
            $params[':pid'] = (!empty($pidVal) && $pidVal !== 'sans_compte') ? intval($pidVal) : null;
        }
        if (isset($body['patientName']) || isset($body['patient_name'])) {
            $fields[] = "patient_name = :pname";
            $params[':pname'] = trim($body['patientName'] ?? $body['patient_name']);
        }
        if (isset($body['notes'])) {
            $fields[] = "notes = :notes";
            $params[':notes'] = $body['notes'];
        }

        if (empty($fields)) {
            sendResponse("success", ["id" => $id], "Aucun champ à modifier", 200);
        }

        $sql = "UPDATE appointments SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Si le statut passe à Arrivé, synchroniser automatiquement avec la salle d'attente MySQL
        if (isset($body['status']) && $body['status'] === 'Arrivé') {
            $chkWait = $db->prepare("SELECT id FROM waiting_room WHERE appointment_id = :aid AND status != 'Terminé' LIMIT 1");
            $chkWait->execute([':aid' => $id]);
            if (!$chkWait->fetchColumn()) {
                $aptQ = $db->prepare("
                    SELECT a.patient_id, a.patient_name, a.patient_phone, a.appointment_time, a.reason,
                           p.first_name, p.last_name, p.phone
                    FROM appointments a
                    LEFT JOIN patients p ON a.patient_id = p.id
                    WHERE a.id = :id
                ");
                $aptQ->execute([':id' => $id]);
                $aptRow = $aptQ->fetch(PDO::FETCH_ASSOC);
                if ($aptRow) {
                    $pName = trim($aptRow['patient_name'] ?? '');
                    if (empty($pName)) {
                        $pName = trim(($aptRow['first_name'] ?? '') . ' ' . ($aptRow['last_name'] ?? '')) ?: 'Patient';
                    }
                    $pPhone = $aptRow['patient_phone'] ?: ($aptRow['phone'] ?: null);

                    $insWait = $db->prepare("
                        INSERT INTO waiting_room (patient_id, patient_name, patient_phone, appointment_id, appointment_time, arrival_time, reason, status)
                        VALUES (:pid, :pname, :pphone, :aid, :atime, CURTIME(), :reason, 'En attente')
                    ");
                    $insWait->execute([
                        ':pid' => $aptRow['patient_id'] ?: null,
                        ':pname' => $pName,
                        ':pphone' => $pPhone,
                        ':aid' => $id,
                        ':atime' => $aptRow['appointment_time'] ?: date('H:i:s'),
                        ':reason' => $aptRow['reason'] ?: 'Consultation générale'
                    ]);
                }
            }
        } elseif (isset($body['status']) && $body['status'] === 'En consultation') {
            $db->prepare("UPDATE waiting_room SET status = 'En consultation' WHERE appointment_id = :aid AND status = 'En attente'")
               ->execute([':aid' => $id]);
        } elseif (isset($body['status']) && in_array($body['status'], ['Terminé', 'Absent', 'Annulé'])) {
            $db->prepare("UPDATE waiting_room SET status = 'Terminé' WHERE appointment_id = :aid AND status != 'Terminé'")
               ->execute([':aid' => $id]);
        }

        sendResponse("success", ["id" => $id], "Rendez-vous mis à jour avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur modification rendez-vous : " . $e->getMessage(), 500);
    }
}

function handleDeleteAppointment($db) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $body = getRequestBody();
        $id = $body['id'] ?? null;
    }

    if (!$id) {
        sendResponse("error", null, "Identifiant rendez-vous manquant", 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM appointments WHERE id = :id");
        $stmt->execute([':id' => (int)$id]);
        sendResponse("success", null, "Rendez-vous annulé et supprimé de MySQL");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur suppression rendez-vous : " . $e->getMessage(), 500);
    }
}
