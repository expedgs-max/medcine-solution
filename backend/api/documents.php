<?php
// backend/api/documents.php
// Documents médicaux, imageries et analyses des patients

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetDocuments($db);
        break;
    case 'POST':
        handleSaveDocument($db);
        break;
    case 'DELETE':
        handleDeleteDocument($db);
        break;
    default:
        sendResponse('error', null, 'Méthode non autorisée', 405);
        break;
}

function handleGetDocuments($db) {
    try {
        $patientId = $_GET['patient_id'] ?? null;
        $params = [];
        $where = "";

        if ($patientId) {
            $where = "WHERE d.patient_id = :pid";
            $params[':pid'] = (int)$patientId;
        }

        $stmt = $db->prepare("
            SELECT 
                d.*,
                CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
                p.file_number
            FROM medical_documents d
            LEFT JOIN patients p ON p.id = d.patient_id
            $where
            ORDER BY d.doc_date DESC, d.created_at DESC, d.id DESC
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? '127.0.0.1:8000';
        $baseUrl = $scheme . '://' . $host;

        $data = array_map(function ($row) use ($baseUrl) {
            $rawPath = $row['file_path'];
            $fileUrl = null;

            if (!empty($rawPath)) {
                if (str_starts_with($rawPath, 'data:') || str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://')) {
                    $fileUrl = $rawPath;
                } else {
                    // Chemin relatif serveur (ex: uploads/documents/doc_...)
                    $fileUrl = $baseUrl . '/' . ltrim($rawPath, '/');
                }
            }

            return [
                'id' => (int)$row['id'],
                'patientId' => (int)$row['patient_id'],
                'consultationId' => !empty($row['consultation_id']) ? (int)$row['consultation_id'] : null,
                'patientName' => $row['patient_name'] ?? 'Patient',
                'title' => $row['title'],
                'category' => $row['category'],
                'date' => $row['doc_date'],
                'author' => $row['author'] ?? 'Dr N. BELBACHIR OULD HENNIA',
                'filePath' => $fileUrl ?? $rawPath,
                'fileDataUrl' => $fileUrl ?? $rawPath,
                'fileSize' => $row['file_size'] ?? '250 Ko',
                'fileType' => $row['file_type'] ?? 'PDF',
                'status' => $row['status'] ?? 'Validé',
                'createdAt' => $row['created_at'],
            ];
        }, $rows);

        sendResponse('success', $data, 'Documents médicaux récupérés avec succès');
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur lors de la récupération des documents : ' . $e->getMessage(), 500);
    }
}

function handleSaveDocument($db) {
    $input = getRequestBody();

    if (empty($input['title']) || empty($input['patientId'])) {
        sendResponse('error', null, 'Titre et patient obligatoires', 400);
    }

    try {
        $patientId = (int)$input['patientId'];
        $consultationId = !empty($input['consultationId']) ? (int)$input['consultationId'] : null;
        $title = trim($input['title']);
        $category = $input['category'] ?? 'Autre';
        $docDate = $input['date'] ?? date('Y-m-d');
        $author = $input['author'] ?? 'Dr N. BELBACHIR OULD HENNIA';
        $filePath = $input['filePath'] ?? ($input['previewUrl'] ?? ($input['fileDataUrl'] ?? null));
        $fileSize = $input['fileSize'] ?? '1.2 Mo';
        $fileType = $input['fileType'] ?? ($input['type'] ?? 'PDF');
        $status = $input['status'] ?? 'Validé';

        // Si le fichier est envoyé au format base64 data URL, le sauvegarder physiquement sur le disque
        if (!empty($filePath) && preg_match('/^data:([^;]+);base64,(.*)$/s', $filePath, $matches)) {
            $mimeType = $matches[1];
            $base64Data = $matches[2];
            $binaryData = base64_decode($base64Data);

            if ($binaryData !== false) {
                $ext = 'bin';
                if (stripos($mimeType, 'png') !== false) $ext = 'png';
                elseif (stripos($mimeType, 'jpeg') !== false || stripos($mimeType, 'jpg') !== false) $ext = 'jpg';
                elseif (stripos($mimeType, 'webp') !== false) $ext = 'webp';
                elseif (stripos($mimeType, 'gif') !== false) $ext = 'gif';
                elseif (stripos($mimeType, 'pdf') !== false) $ext = 'pdf';
                elseif (stripos($mimeType, 'word') !== false || stripos($mimeType, 'docx') !== false) $ext = 'docx';

                $uploadDir = __DIR__ . '/../uploads/documents';
                if (!is_dir($uploadDir)) {
                    @mkdir($uploadDir, 0777, true);
                }

                $fileName = 'doc_' . $patientId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                $targetFile = $uploadDir . '/' . $fileName;

                if (@file_put_contents($targetFile, $binaryData) !== false) {
                    $filePath = 'uploads/documents/' . $fileName;
                }
            }
        }

        $stmt = $db->prepare("
            INSERT INTO medical_documents (
                patient_id, consultation_id, title, category,
                doc_date, author, file_path, file_size, file_type, status
            ) VALUES (
                :patientId, :consultationId, :title, :category,
                :docDate, :author, :filePath, :fileSize, :fileType, :status
            )
        ");

        $stmt->execute([
            ':patientId' => $patientId,
            ':consultationId' => $consultationId,
            ':title' => $title,
            ':category' => $category,
            ':docDate' => $docDate,
            ':author' => $author,
            ':filePath' => $filePath,
            ':fileSize' => $fileSize,
            ':fileType' => $fileType,
            ':status' => $status,
        ]);

        $newId = (int)$db->lastInsertId();
        sendResponse('success', ['id' => $newId, 'title' => $title, 'filePath' => $filePath], 'Document enregistré avec succès', 201);
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur enregistrement document : ' . $e->getMessage(), 500);
    }
}

function handleDeleteDocument($db) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $input = getRequestBody();
        $id = $input['id'] ?? null;
    }

    if (!$id) {
        sendResponse('error', null, 'Identifiant document manquant', 400);
    }

    try {
        // Supprimer le fichier physique s'il existe sur le serveur
        $stmtGet = $db->prepare("SELECT file_path FROM medical_documents WHERE id = :id");
        $stmtGet->execute([':id' => (int)$id]);
        $docRow = $stmtGet->fetch();
        if ($docRow && !empty($docRow['file_path']) && str_starts_with($docRow['file_path'], 'uploads/documents/')) {
            $physicalPath = __DIR__ . '/../' . $docRow['file_path'];
            if (file_exists($physicalPath)) {
                @unlink($physicalPath);
            }
        }

        $stmt = $db->prepare("DELETE FROM medical_documents WHERE id = :id");
        $stmt->execute([':id' => (int)$id]);
        sendResponse('success', null, 'Document supprimé avec succès');
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur lors de la suppression du document : ' . $e->getMessage(), 500);
    }
}
