<?php
// backend/api/waiting_room.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetWaitingRoom($db);
        break;
    case 'POST':
        handleCreateArrival($db);
        break;
    case 'PUT':
        handleUpdateStatus($db);
        break;
    case 'DELETE':
        handleRemoveFromWaitingRoom($db);
        break;
    default:
        sendResponse("error", null, "Méthode non autorisée", 405);
}

function calculateWaitingTicketNumber($timeStr) {
    if (empty($timeStr)) return 1;
    $slots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];
    $norm = str_pad(substr(trim($timeStr), 0, 5), 5, "0", STR_PAD_LEFT);
    $idx = array_search($norm, $slots);
    if ($idx !== false) {
        return $idx + 1;
    }
    $parts = explode(':', $timeStr);
    $h = intval($parts[0] ?? 0);
    $m = intval($parts[1] ?? 0);
    $diff = ($h * 60 + $m) - (9 * 60);
    if ($diff >= 0) {
        return floor($diff / 30) + 1;
    }
    return 1;
}

function handleGetWaitingRoom($db) {
    try {
        // Auto-réparation automatique : Si des entrées ont id = 0, leur réassigner un ID valide
        try {
            $zeroW = $db->query("SELECT COUNT(*) FROM waiting_room WHERE id = 0");
            if ($zeroW && intval($zeroW->fetchColumn()) > 0) {
                $db->exec("SET @new_wid = (SELECT COALESCE(MAX(id), 20) FROM waiting_room WHERE id > 0); UPDATE waiting_room SET id = (@new_wid := @new_wid + 1) WHERE id = 0;");
            }
        } catch (Exception $e) {}

        $sql = "SELECT w.*, 
                       COALESCE(NULLIF(TRIM(w.patient_name), ''), NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), ''), 'Patient') AS patient_name,
                       p.dob AS patient_dob,
                       p.file_number AS patient_file_number,
                       COALESCE(NULLIF(TRIM(w.patient_phone), ''), NULLIF(TRIM(p.phone), ''), '') AS patient_phone,
                       a.notes AS appointment_notes,
                       a.appointment_time AS apt_time
                FROM waiting_room w
                LEFT JOIN patients p ON w.patient_id = p.id
                LEFT JOIN appointments a ON w.appointment_id = a.id
                WHERE w.status != 'Terminé'
                  AND (w.patient_id NOT IN (2, 3) OR w.patient_id IS NULL)
                  AND (w.patient_name NOT IN ('Sophie Bernard', 'Marc Lemoine') OR w.patient_name IS NULL)
                ORDER BY w.created_at DESC, w.arrival_time DESC, w.id DESC";

        $stmt = $db->query($sql);
        $rows = $stmt->fetchAll();

        $list = [];
        foreach ($rows as $r) {
            $age = null;
            if (!empty($r['patient_dob'])) {
                $dob = new DateTime($r['patient_dob']);
                $age = (new DateTime())->diff($dob)->y;
            }

            $ticketNumber = !empty($r['ticket_number']) ? intval($r['ticket_number']) : null;
            if (!$ticketNumber && !empty($r['appointment_notes']) && preg_match('/\[Ticket N°\s*(\d+)\]/i', $r['appointment_notes'], $m)) {
                $ticketNumber = intval($m[1]);
            }
            if (!$ticketNumber) {
                $refTime = !empty($r['appointment_time']) ? $r['appointment_time'] : (!empty($r['apt_time']) ? $r['apt_time'] : null);
                if ($refTime) {
                    $ticketNumber = calculateWaitingTicketNumber($refTime);
                }
            }
            if (!$ticketNumber) {
                $ticketNumber = 1;
            }

            $list[] = [
                "id" => intval($r['id']),
                "ticketNumber" => $ticketNumber,
                "appointmentId" => !empty($r['appointment_id']) ? intval($r['appointment_id']) : null,
                "patientId" => !empty($r['patient_id']) ? intval($r['patient_id']) : null,
                "patientName" => $r['patient_name'],
                "fileNumber" => $r['patient_file_number'] ?: "EN LIGNE",
                "age" => $age,
                "phone" => $r['patient_phone'],
                "appointmentTime" => substr($r['appointment_time'] ?: "10:00", 0, 5),
                "arrivalTime" => substr($r['arrival_time'], 0, 5),
                "waitTime" => intval($r['wait_time_minutes']),
                "reason" => $r['reason'] ?: "Consultation générale",
                "status" => $r['status']
            ];
        }

        sendResponse("success", $list, "Salle d'attente récupérée avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur salle d'attente : " . $e->getMessage(), 500);
    }
}

function handleCreateArrival($db) {
    $body = getRequestBody();

    $patientId = !empty($body['patientId']) ? intval($body['patientId']) : null;
    $patientName = trim($body['patientName'] ?? '');
    $patientPhone = trim($body['patientPhone'] ?? ($body['phone'] ?? ''));

    if (!$patientId && empty($patientName)) {
        sendResponse("error", null, "patientId ou patientName est requis", 400);
    }

    try {
        $appId = !empty($body['appointmentId']) ? intval($body['appointmentId']) : null;
        $appTime = $body['appointmentTime'] ?? date('H:i:s');
        $arrTime = $body['arrivalTime'] ?? date('H:i:s');
        $reason = $body['reason'] ?? "Consultation générale";

        if ($appId) {
            $chk = $db->prepare("SELECT id FROM waiting_room WHERE appointment_id = :aid AND status != 'Terminé' LIMIT 1");
            $chk->execute([':aid' => $appId]);
            $existing = $chk->fetchColumn();
            if ($existing) {
                sendResponse("success", ["id" => intval($existing)], "Patient déjà en salle d'attente");
                return;
            }
        }

        $ticketNumber = !empty($body['ticketNumber']) ? intval($body['ticketNumber']) : null;
        if (!$ticketNumber && $appId) {
            $stmtNotes = $db->prepare("SELECT notes, appointment_time FROM appointments WHERE id = :aid");
            $stmtNotes->execute([':aid' => $appId]);
            $apt = $stmtNotes->fetch();
            if ($apt) {
                if (!empty($apt['notes']) && preg_match('/\[Ticket N°\s*(\d+)\]/i', $apt['notes'], $m)) {
                    $ticketNumber = intval($m[1]);
                } else if (!empty($apt['appointment_time'])) {
                    $ticketNumber = calculateWaitingTicketNumber($apt['appointment_time']);
                }
            }
        }
        if (!$ticketNumber && !empty($appTime)) {
            $ticketNumber = calculateWaitingTicketNumber($appTime);
        }

        // Calculer l'ID automatiquement pour garantir un ID unique même si AUTO_INCREMENT est manquant
        $maxWidStmt = $db->query("SELECT COALESCE(MAX(id), 20) + 1 FROM waiting_room WHERE id > 0");
        $nextWaitId = intval($maxWidStmt->fetchColumn() ?: 21);

        $sql = "INSERT INTO waiting_room (id, patient_id, patient_name, patient_phone, appointment_id, ticket_number, appointment_time, arrival_time, reason, status) 
                VALUES (:id, :pid, :pname, :pphone, :aid, :tnum, :atime, :artime, :reason, 'En attente')";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':id' => $nextWaitId,
            ':pid' => $patientId,
            ':pname' => $patientName ?: null,
            ':pphone' => $patientPhone ?: null,
            ':aid' => $appId,
            ':tnum' => $ticketNumber,
            ':atime' => strlen($appTime) === 5 ? ($appTime . ":00") : $appTime,
            ':artime' => strlen($arrTime) === 5 ? ($arrTime . ":00") : $arrTime,
            ':reason' => $reason
        ]);

        sendResponse("success", ["id" => $nextWaitId, "ticketNumber" => $ticketNumber], "Arrivée enregistrée avec succès", 201);
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur enregistrement arrivée : " . $e->getMessage(), 500);
    }
}

function handleUpdateStatus($db) {
    $body = getRequestBody();
    $id = isset($_GET['id']) ? intval($_GET['id']) : ($body['id'] ?? null);
    $status = $body['status'] ?? null;

    if (!$id || !$status) {
        sendResponse("error", null, "ID et status requis", 400);
    }

    try {
        $stmt = $db->prepare("UPDATE waiting_room SET status = :status WHERE id = :id");
        $stmt->execute([':status' => $status, ':id' => $id]);
        sendResponse("success", null, "Statut mis à jour avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur mise à jour statut : " . $e->getMessage(), 500);
    }
}

function handleRemoveFromWaitingRoom($db) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        $body = getRequestBody();
        $id = $body['id'] ?? null;
    }
    if (!$id) {
        sendResponse("error", null, "ID requis", 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM waiting_room WHERE id = :id");
        $stmt->execute([':id' => (int)$id]);
        sendResponse("success", null, "Patient supprimé de la base de données");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur suppression : " . $e->getMessage(), 500);
    }
}
