<?php
// backend/api/invoices.php
// Gestion des factures médicales et feuilles de soins

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetInvoices($db);
        break;
    case 'POST':
        handleSaveInvoice($db);
        break;
    case 'DELETE':
        handleDeleteInvoice($db);
        break;
    default:
        sendResponse('error', null, 'Méthode non autorisée', 405);
        break;
}

function generateInvoicePatientPassword($lastName, $firstName, $phone) {
    $cleanLast = trim($lastName ?? '');
    $cleanFirst = trim($firstName ?? '');

    if (function_exists('iconv')) {
        $cleanLast = @iconv('UTF-8', 'ASCII//TRANSLIT', $cleanLast) ?: $cleanLast;
        $cleanFirst = @iconv('UTF-8', 'ASCII//TRANSLIT', $cleanFirst) ?: $cleanFirst;
    }

    $cleanLast = preg_replace('/[^a-zA-Z]/', '', $cleanLast);
    $cleanFirst = preg_replace('/[^a-zA-Z]/', '', $cleanFirst);

    $lastInitial = !empty($cleanLast) ? strtolower(substr($cleanLast, 0, 1)) : 'p';
    $firstInitial = !empty($cleanFirst) ? strtolower(substr($cleanFirst, 0, 1)) : 'a';

    $digits = preg_replace('/\D/', '', $phone ?? '');
    $last3 = strlen($digits) >= 3 ? substr($digits, -3) : str_pad($digits, 3, '0', STR_PAD_LEFT);

    return strtolower($lastInitial . $firstInitial . $last3);
}

function handleGetInvoices($db) {
    try {
        $patientId = $_GET['patient_id'] ?? null;
        $params = [];
        $where = "";

        if ($patientId) {
            $where = "WHERE i.patient_id = :pid";
            $params[':pid'] = (int)$patientId;
        }

        $stmt = $db->prepare("
            SELECT 
                i.*,
                COALESCE(CONCAT(p.first_name, ' ', p.last_name), i.patient_name, 'Patient sans compte') AS patient_name,
                p.first_name,
                p.last_name,
                p.file_number,
                p.phone AS patient_phone,
                p.password AS patient_password
            FROM invoices i
            LEFT JOIN patients p ON p.id = i.patient_id
            $where
            ORDER BY i.invoice_date DESC, i.created_at DESC, i.id DESC
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $data = array_map(function ($row) {
            $isGuest = empty($row['patient_id']) || (!empty($row['patient_name']) && (stripos($row['patient_name'], '(sc)') !== false || stripos($row['patient_name'], 'sans compte') !== false));
            $pwd = '';
            if (!$isGuest) {
                $pwd = !empty($row['patient_password']) ? $row['patient_password'] : '';
                if (empty($pwd)) {
                    $pwd = generateInvoicePatientPassword($row['last_name'] ?? '', $row['first_name'] ?? '', $row['patient_phone'] ?? '');
                }
            }
            return [
                'id' => (int)$row['id'],
                'invoiceNumber' => $row['invoice_number'],
                'patientId' => !empty($row['patient_id']) ? (int)$row['patient_id'] : null,
                'isGuest' => $isGuest,
                'consultationId' => !empty($row['consultation_id']) ? (int)$row['consultation_id'] : null,
                'patientName' => $row['patient_name'] ?? 'Patient sans compte',
                'patientPhone' => $row['patient_phone'] ?? '',
                'patientPassword' => $pwd,
                'fileNumber' => $row['file_number'] ?? '',
                'date' => $row['invoice_date'],
                'time' => !empty($row['created_at']) ? date('H:i', strtotime($row['created_at'])) : '',
                'actDescription' => $row['act_description'],
                'amount' => (float)$row['amount'],
                'coveredAmo' => (float)$row['covered_amo'],
                'coveredAmc' => (float)$row['covered_amc'],
                'patientRemaining' => (float)$row['patient_remaining'],
                'paymentMethod' => $row['payment_method'] ?? 'Espèces',
                'status' => $row['status'],
                'createdAt' => $row['created_at'],
            ];
        }, $rows);

        sendResponse('success', $data, 'Factures récupérées avec succès');
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur lors de la récupération des factures : ' . $e->getMessage(), 500);
    }
}

function handleSaveInvoice($db) {
    $input = getRequestBody();

    $patientId = !empty($input['patientId']) ? (int)$input['patientId'] : null;
    $patientName = !empty($input['patientName']) ? trim($input['patientName']) : null;

    if (empty($patientId) && empty($patientName)) {
        sendResponse('error', null, 'Patient ou nom obligatoire', 400);
    }
    if (empty($input['amount'])) {
        sendResponse('error', null, 'Montant obligatoire', 400);
    }

    try {
        $count = $db->query("SELECT COUNT(*) FROM invoices")->fetchColumn();
        $invoiceNumber = $input['invoiceNumber'] ?? ('FAC-' . date('Y') . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT));

        $consultationId = !empty($input['consultationId']) ? (int)$input['consultationId'] : null;
        $invoiceDate = $input['date'] ?? date('Y-m-d');
        $actDescription = $input['actDescription'] ?? 'Consultation médicale';
        $amount = (float)$input['amount'];
        $coveredAmo = (float)($input['coveredAmo'] ?? 0);
        $coveredAmc = (float)($input['coveredAmc'] ?? 0);
        $patientRemaining = (float)($input['patientRemaining'] ?? $amount);
        $paymentMethod = $input['paymentMethod'] ?? 'Espèces';
        $status = $input['status'] ?? 'Payée';

        $stmt = $db->prepare("
            INSERT INTO invoices (
                invoice_number, patient_id, patient_name, consultation_id, invoice_date,
                act_description, amount, covered_amo, covered_amc,
                patient_remaining, payment_method, status
            ) VALUES (
                :invoiceNumber, :patientId, :patientName, :consultationId, :invoiceDate,
                :actDescription, :amount, :coveredAmo, :coveredAmc,
                :patientRemaining, :paymentMethod, :status
            )
        ");

        $stmt->execute([
            ':invoiceNumber' => $invoiceNumber,
            ':patientId' => $patientId,
            ':patientName' => $patientName,
            ':consultationId' => $consultationId,
            ':invoiceDate' => $invoiceDate,
            ':actDescription' => $actDescription,
            ':amount' => $amount,
            ':coveredAmo' => $coveredAmo,
            ':coveredAmc' => $coveredAmc,
            ':patientRemaining' => $patientRemaining,
            ':paymentMethod' => $paymentMethod,
            ':status' => $status,
        ]);

        $newId = $db->lastInsertId();
        sendResponse('success', ['id' => (int)$newId, 'invoiceNumber' => $invoiceNumber], 'Facture enregistrée avec succès', 201);
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur enregistrement facture : ' . $e->getMessage(), 500);
    }
}

function handleDeleteInvoice($db) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $input = getRequestBody();
        $id = $input['id'] ?? null;
    }

    if (!$id) {
        sendResponse('error', null, 'Identifiant facture manquant', 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM invoices WHERE id = :id");
        $stmt->execute([':id' => (int)$id]);
        sendResponse('success', null, 'Facture supprimée');
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur lors de la suppression de la facture : ' . $e->getMessage(), 500);
    }
}
