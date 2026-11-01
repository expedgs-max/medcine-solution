<?php
// backend/api/documents.php
// Documents médicaux, imageries et analyses des patients

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'unread_count') {
            handleGetUnreadCount($db);
        } elseif ($action === 'mark_read') {
            handleMarkRead($db);
        } else {
            handleGetDocuments($db);
        }
        break;
    case 'POST':
        if ($action === 'mark_read') {
            handleMarkRead($db);
        } else {
            handleSaveDocument($db);
        }
        break;
    case 'PUT':
        handleMarkRead($db);
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
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
        $scriptDir = dirname(dirname($scriptName));
        $backendPrefix = ($scriptDir === '/' || $scriptDir === '\\' || $scriptDir === '.') ? '' : $scriptDir;
        $baseUrl = $scheme . '://' . $host . $backendPrefix;

        $data = array_map(function ($row) use ($baseUrl, $backendPrefix) {
            $rawPath = $row['file_path'];
            $fileUrl = null;

            if (!empty($rawPath)) {
                if (str_starts_with($rawPath, 'data:') || str_starts_with($rawPath, 'blob:')) {
                    $fileUrl = $rawPath;
                } elseif (str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://')) {
                    if (!empty($backendPrefix) && strpos($rawPath, '/uploads/') !== false && strpos($rawPath, $backendPrefix . '/uploads/') === false) {
                        $fileUrl = str_replace('/uploads/', $backendPrefix . '/uploads/', $rawPath);
                    } else {
                        $fileUrl = $rawPath;
                    }
                } else {
                    // Chemin relatif serveur (ex: uploads/documents/doc_...)
                    $fileUrl = rtrim($baseUrl, '/') . '/' . ltrim($rawPath, '/');
                }
            }

            return [
                'id' => (int)$row['id'],
                'patientId' => (int)$row['patient_id'],
                'consultationId' => !empty($row['consultation_id']) ? (int)$row['consultation_id'] : null,
                'patientName' => $row['patient_name'] ?? 'Patient',
                'title' => $row['title'],
                'notes' => $row['notes'] ?? '',
                'category' => $row['category'],
                'date' => $row['doc_date'],
                'author' => $row['author'] ?? 'Dr N. BELBACHIR OULD HENNIA',
                'filePath' => $fileUrl ?? $rawPath,
                'fileDataUrl' => $fileUrl ?? $rawPath,
                'fileSize' => $row['file_size'] ?? '250 Ko',
                'fileType' => $row['file_type'] ?? 'PDF',
                'status' => $row['status'] ?? 'Validé',
                'isRead' => (int)($row['is_read'] ?? 0) === 1,
                'is_read' => (int)($row['is_read'] ?? 0),
                'createdAt' => $row['created_at'],
            ];
        }, $rows);

        sendResponse('success', $data, 'Documents médicaux récupérés avec succès');
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur lors de la récupération des documents : ' . $e->getMessage(), 500);
    }
}

function handleGetUnreadCount($db) {
    try {
        $patientId = $_GET['patient_id'] ?? null;
        $where = "WHERE (is_read = 0 OR is_read IS NULL) AND (author LIKE 'Patient%' OR status = 'Transmis par le patient' OR file_type IN ('TEXTE', 'NOTE'))";
        $params = [];
        if ($patientId) {
            $where .= " AND patient_id = :pid";
            $params[':pid'] = (int)$patientId;
        }

        $stmt = $db->prepare("SELECT COUNT(*) AS unread_count FROM medical_documents $where");
        $stmt->execute($params);
        $row = $stmt->fetch();
        sendResponse('success', ['count' => (int)($row['unread_count'] ?? 0)], 'Compteur de transmissions non lues');
    } catch (PDOException $e) {
        sendResponse('error', null, $e->getMessage(), 500);
    }
}

function handleMarkRead($db) {
    $input = getRequestBody();
    $id = $_GET['id'] ?? ($input['id'] ?? null);
    if (!$id) {
        sendResponse('error', null, 'Identifiant document manquant', 400);
    }

    try {
        $stmt = $db->prepare("UPDATE medical_documents SET is_read = 1, status = 'Lu par le médecin' WHERE id = :id");
        $stmt->execute([':id' => (int)$id]);
        sendResponse('success', ['id' => (int)$id, 'isRead' => true, 'status' => 'Lu par le médecin'], 'Document marqué comme lu');
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur mise à jour document : ' . $e->getMessage(), 500);
    }
}

function handleSaveDocument($db) {
    // S'assurer de la présence des colonnes 'notes' et 'is_read'
    try {
        $db->exec("ALTER TABLE medical_documents ADD COLUMN IF NOT EXISTS notes LONGTEXT NULL AFTER title");
    } catch (Exception $e) {}
    try {
        $db->exec("ALTER TABLE medical_documents ADD COLUMN IF NOT EXISTS is_read TINYINT(1) NOT NULL DEFAULT 0 AFTER status");
    } catch (Exception $e) {}

    $input = getRequestBody();

    $patientId = !empty($input['patientId']) ? (int)$input['patientId'] : null;
    if (!$patientId) {
        sendResponse('error', null, 'Identifiant patient obligatoire', 400);
    }

    $notes = !empty($input['notes']) ? trim($input['notes']) : (!empty($input['text']) ? trim($input['text']) : null);
    $filePath = $input['filePath'] ?? ($input['previewUrl'] ?? ($input['fileDataUrl'] ?? null));

    // Si le titre n'est pas fourni, déduire un titre clair à partir du texte ou du type
    $title = !empty($input['title']) ? trim($input['title']) : '';
    if (empty($title)) {
        if (!empty($notes)) {
            $title = mb_strlen($notes) > 40 ? mb_substr($notes, 0, 40) . '...' : $notes;
        } elseif (!empty($filePath)) {
            $title = 'Document déposé par le patient';
        } else {
            sendResponse('error', null, 'Veuillez saisir un texte ou joindre un document', 400);
        }
    }

    try {
        $consultationId = !empty($input['consultationId']) ? (int)$input['consultationId'] : null;
        
        $validCategories = ['Analyses de laboratoire', 'Imagerie & Radiologie', 'Certificats médicaux', 'Comptes rendus spécialistes', 'Autre'];
        $rawCategory = $input['category'] ?? 'Autre';
        $category = in_array($rawCategory, $validCategories) ? $rawCategory : 'Autre';

        $docDate = $input['date'] ?? date('Y-m-d');
        $author = $input['author'] ?? 'Patient';
        $fileSize = $input['fileSize'] ?? null;
        $fileType = $input['fileType'] ?? ($input['type'] ?? null);
        $status = $input['status'] ?? 'Transmis par le patient';

        // Si un fichier est envoyé au format base64 data URL, le sauvegarder physiquement sur le disque
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
                elseif (stripos($mimeType, 'text/plain') !== false) $ext = 'txt';

                $uploadDir = __DIR__ . '/../uploads/documents';
                if (!is_dir($uploadDir)) {
                    @mkdir($uploadDir, 0777, true);
                }

                $fileName = 'doc_' . $patientId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
                $targetFile = $uploadDir . '/' . $fileName;

                if (@file_put_contents($targetFile, $binaryData) !== false) {
                    $filePath = 'uploads/documents/' . $fileName;
                    if (!$fileSize) {
                        $bytes = strlen($binaryData);
                        $fileSize = $bytes > 1048576 ? round($bytes / 1048576, 1) . ' Mo' : round($bytes / 1024) . ' Ko';
                    }
                    if (!$fileType) {
                        $fileType = strtoupper($ext);
                    }
                }
            }
        } elseif (empty($filePath) && !empty($notes)) {
            // Document texte seulement : enregistrer physiquement une note texte pour téléchargement/visualisation
            $uploadDir = __DIR__ . '/../uploads/documents';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0777, true);
            }
            $fileName = 'note_' . $patientId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.txt';
            $targetFile = $uploadDir . '/' . $fileName;
            if (@file_put_contents($targetFile, $notes) !== false) {
                $filePath = 'uploads/documents/' . $fileName;
            }
            if (!$fileType) $fileType = 'TEXTE';
            if (!$fileSize) $fileSize = mb_strlen($notes) . ' caractères';
        }

        if (!$fileType) $fileType = 'DOCUMENT';
        if (!$fileSize) $fileSize = '1.0 Ko';

        $isPatientUpload = (stripos($author, 'Patient') !== false) || ($status === 'Transmis par le patient');
        $isRead = $isPatientUpload ? 0 : 1;

        try {
            $stmt = $db->prepare("
                INSERT INTO medical_documents (
                    patient_id, consultation_id, title, notes, category,
                    doc_date, author, file_path, file_size, file_type, status, is_read
                ) VALUES (
                    :patientId, :consultationId, :title, :notes, :category,
                    :docDate, :author, :filePath, :fileSize, :fileType, :status, :isRead
                )
            ");

            $stmt->execute([
                ':patientId' => $patientId,
                ':consultationId' => $consultationId,
                ':title' => $title,
                ':notes' => $notes,
                ':category' => $category,
                ':docDate' => $docDate,
                ':author' => $author,
                ':filePath' => $filePath,
                ':fileSize' => $fileSize,
                ':fileType' => $fileType,
                ':status' => $status,
                ':isRead' => $isRead,
            ]);
        } catch (PDOException $ex) {
            // Repli de secours si la colonne notes n'est pas encore créée
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
        }

        $newId = (int)$db->lastInsertId();
        sendResponse('success', [
            'id' => $newId,
            'title' => $title,
            'notes' => $notes,
            'category' => $category,
            'filePath' => $filePath,
            'fileType' => $fileType,
            'fileSize' => $fileSize,
            'status' => $status
        ], 'Document/message enregistré avec succès', 201);
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
