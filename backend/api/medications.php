<?php
// backend/api/medications.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetMedications($db);
        break;
    case 'POST':
        handleCreateOrUpdateMedication($db);
        break;
    case 'DELETE':
        handleDeleteMedication($db);
        break;
    default:
        sendResponse("error", null, "Méthode non autorisée", 405);
}

function handleGetMedications($db) {
    try {
        $q = isset($_GET['q']) ? trim($_GET['q']) : '';
        $sql = "SELECT * FROM medications";
        $params = [];
        if (!empty($q)) {
            $sql .= " WHERE name LIKE :q OR category LIKE :q OR default_posology LIKE :q";
            $params[':q'] = "%$q%";
        }
        $sql .= " ORDER BY name ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $medications = [];
        foreach ($rows as $r) {
            $medications[] = [
                "id" => intval($r['id']),
                "name" => $r['name'],
                "dosage" => $r['dosage'] ?: '',
                "form" => $r['form'] ?: '',
                "defaultPosology" => $r['default_posology'] ?: '',
                "defaultDuration" => $r['default_duration'] ?: '',
                "category" => $r['category'] ?: '',
                "createdAt" => $r['created_at']
            ];
        }

        sendResponse("success", $medications, "Liste des médicaments récupérée");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur lors de la récupération des médicaments : " . $e->getMessage(), 500);
    }
}

function handleCreateOrUpdateMedication($db) {
    $body = getRequestBody();

    if (empty($body['name'])) {
        sendResponse("error", null, "Le nom du médicament est requis", 400);
    }

    try {
        $id = !empty($body['id']) ? intval($body['id']) : null;
        $name = trim($body['name']);
        $dosage = !empty($body['dosage']) ? trim($body['dosage']) : null;
        $form = !empty($body['form']) ? trim($body['form']) : 'Comprimé';
        $posology = !empty($body['defaultPosology']) ? trim($body['defaultPosology']) : (!empty($body['posology']) ? trim($body['posology']) : null);
        $duration = !empty($body['defaultDuration']) ? trim($body['defaultDuration']) : (!empty($body['duration']) ? trim($body['duration']) : null);
        $category = !empty($body['category']) ? trim($body['category']) : null;

        if ($id) {
            $stmt = $db->prepare("UPDATE medications SET name = :name, dosage = :dosage, form = :form, default_posology = :pos, default_duration = :dur, category = :cat WHERE id = :id");
            $stmt->execute([
                ':name' => $name,
                ':dosage' => $dosage,
                ':form' => $form,
                ':pos' => $posology,
                ':dur' => $duration,
                ':cat' => $category,
                ':id' => $id
            ]);
            $medId = $id;
        } else {
            $stmt = $db->prepare("INSERT INTO medications (name, dosage, form, default_posology, default_duration, category) VALUES (:name, :dosage, :form, :pos, :dur, :cat)");
            $stmt->execute([
                ':name' => $name,
                ':dosage' => $dosage,
                ':form' => $form,
                ':pos' => $posology,
                ':dur' => $duration,
                ':cat' => $category
            ]);
            $medId = intval($db->lastInsertId());
        }

        sendResponse("success", [
            "id" => $medId,
            "name" => $name,
            "dosage" => $dosage ?: '',
            "form" => $form ?: '',
            "defaultPosology" => $posology ?: '',
            "defaultDuration" => $duration ?: '',
            "category" => $category ?: ''
        ], "Médicament enregistré avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur enregistrement médicament : " . $e->getMessage(), 500);
    }
}

function handleDeleteMedication($db) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        $body = getRequestBody();
        $id = !empty($body['id']) ? intval($body['id']) : null;
    }

    if (!$id) {
        sendResponse("error", null, "ID requis", 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM medications WHERE id = :id");
        $stmt->execute([':id' => $id]);
        sendResponse("success", ["id" => $id], "Médicament supprimé");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur suppression médicament : " . $e->getMessage(), 500);
    }
}
