<?php
// backend/api/prescriptions.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetPrescriptions($db);
        break;
    case 'POST':
        handleCreatePrescription($db);
        break;
    case 'DELETE':
        handleDeletePrescription($db);
        break;
    default:
        sendResponse("error", null, "Méthode non autorisée", 405);
}

function handleGetPrescriptions($db) {
    try {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        $patientId = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : null;

        $sql = "SELECT pr.*, 
                       COALESCE(CONCAT(p.first_name, ' ', p.last_name), pr.patient_name, 'Patient sans compte') AS patient_name,
                       p.dob AS patient_dob,
                       p.file_number AS patient_file_number
                FROM prescriptions pr
                LEFT JOIN patients p ON pr.patient_id = p.id ";

        $params = [];
        if ($id) {
            $sql .= " WHERE pr.id = :id ";
            $params[':id'] = $id;
        } elseif ($patientId) {
            $sql .= " WHERE pr.patient_id = :pid ";
            $params[':pid'] = $patientId;
        }

        $sql .= " ORDER BY pr.prescription_date DESC, pr.created_at DESC, pr.id DESC ";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $prescriptions = [];
        foreach ($rows as $r) {
            $itStmt = $db->prepare("SELECT medication, dosage, form, posology, duration, instructions, renewable FROM prescription_items WHERE prescription_id = :pid");
            $itStmt->execute([':pid' => $r['id']]);
            $items = $itStmt->fetchAll();

            $isGuest = empty($r['patient_id']);

            $prescriptions[] = [
                "id" => intval($r['id']),
                "prescriptionNumber" => $r['prescription_number'],
                "patientId" => !empty($r['patient_id']) ? intval($r['patient_id']) : null,
                "isGuest" => $isGuest,
                "patientName" => $r['patient_name'],
                "patientDetails" => [
                    "dob" => $r['patient_dob'] ?? "-",
                    "fileNumber" => $r['patient_file_number'] ?? ($isGuest ? "SANS DOSSIER" : "-")
                ],
                "date" => $r['prescription_date'],
                "validity" => $r['validity'],
                "ald" => boolval($r['ald']),
                "doctorName" => $r['doctor_name'],
                "items" => $items,
                "notes" => $r['notes'],
                "validated" => boolval($r['validated'])
            ];
        }

        sendResponse("success", $prescriptions, "Ordonnances récupérées avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur récupération ordonnances : " . $e->getMessage(), 500);
    }
}

function handleCreatePrescription($db) {
    $body = getRequestBody();

    $patientId = !empty($body['patientId']) ? intval($body['patientId']) : null;
    $patientName = !empty($body['patientName']) ? trim($body['patientName']) : null;

    if (empty($patientId) && empty($patientName)) {
        sendResponse("error", null, "Patient ou nom requis", 400);
    }

    try {
        $db->beginTransaction();

        $date = !empty($body['date']) ? $body['date'] : date('Y-m-d');
        $year = date('Y', strtotime($date));
        $count = $db->query("SELECT COUNT(*) FROM prescriptions")->fetchColumn() + 1;
        $num = !empty($body['prescriptionNumber']) ? $body['prescriptionNumber'] : sprintf("ORD-%s-%04d", $year, $count);
        $doc = !empty($body['doctorName']) ? $body['doctorName'] : "Dr N. BELBACHIR OULD HENNIA";

        $sql = "INSERT INTO prescriptions 
                    (prescription_number, patient_id, patient_name, doctor_name, prescription_date, validity, ald, notes, validated)
                VALUES 
                    (:num, :pid, :pname, :dname, :pdate, :val, :ald, :notes, 1)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':num' => $num,
            ':pid' => $patientId,
            ':pname' => $patientName,
            ':dname' => $doc,
            ':pdate' => $date,
            ':val' => $body['validity'] ?? '3 mois',
            ':ald' => !empty($body['ald']) ? 1 : 0,
            ':notes' => $body['notes'] ?? 'Respecter la posologie.'
        ]);

        $prescId = intval($db->lastInsertId());

        $items = $body['items'] ?? [];
        if (is_array($items) && count($items) > 0) {
            $itStmt = $db->prepare("INSERT INTO prescription_items (prescription_id, medication, dosage, form, posology, duration, instructions, renewable) VALUES (:pid, :med, :dos, :form, :pos, :dur, :inst, :ren)");
            foreach ($items as $it) {
                if (!empty(trim($it['medication'] ?? ''))) {
                    $formVal = !empty($it['form']) ? trim($it['form']) : null;
                    $itStmt->execute([
                        ':pid' => $prescId,
                        ':med' => trim($it['medication']),
                        ':dos' => $it['dosage'] ?? null,
                        ':form' => $formVal,
                        ':pos' => !empty($it['posology']) ? trim($it['posology']) : '',
                        ':dur' => !empty($it['duration']) ? trim($it['duration']) : '',
                        ':inst' => !empty($it['instructions']) ? trim($it['instructions']) : (!empty($it['mealTiming']) ? trim($it['mealTiming']) : ''),
                        ':ren' => $it['renewable'] ?? 'Non renouvelable'
                    ]);
                    try { 
                        $mName = trim($it['medication']); 
                        $chkMed = $db->prepare("SELECT id FROM medications WHERE LOWER(name) = LOWER(:name) LIMIT 1"); 
                        $chkMed->execute([':name' => $mName]); 
                        if (!$chkMed->fetch()) { 
                            $db->prepare("INSERT INTO medications (name, dosage, form, default_posology, default_duration) VALUES (:name, :dos, :form, :pos, :dur)")->execute([':name' => $mName, ':dos' => $it['dosage'] ?? null, ':form' => $formVal, ':pos' => $it['posology'] ?? '1 comprimé par jour', ':dur' => $it['duration'] ?? '5 jours']); 
                        } 
                    } catch (Exception $e) {}
                }
            }
        }

        $db->commit();
        sendResponse("success", [
            "id" => $prescId,
            "prescriptionNumber" => $num,
            "patientId" => $patientId,
            "patientName" => $patientName,
            "date" => $date
        ], "Ordonnance enregistrée avec succès", 201);
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse("error", null, "Erreur création ordonnance : " . $e->getMessage(), 500);
    }
}

function handleDeletePrescription($db) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        $body = getRequestBody();
        $id = isset($body['id']) ? intval($body['id']) : null;
    }

    if (!$id) {
        sendResponse("error", null, "ID requis", 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM prescriptions WHERE id = :id");
        $stmt->execute([':id' => $id]);
        sendResponse("success", null, "Ordonnance supprimée");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur suppression : " . $e->getMessage(), 500);
    }
}
