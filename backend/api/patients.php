<?php
// backend/api/patients.php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetPatients($db);
        break;
    case 'POST':
        if ((isset($_GET['action']) && $_GET['action'] === 'upload_photo')) {
            handleUploadPatientPhoto($db);
        } else {
            $rawPost = getRequestBody();
            if (isset($rawPost['action']) && $rawPost['action'] === 'upload_photo') {
                handleUploadPatientPhoto($db);
            } else {
                handleCreatePatient($db);
            }
        }
        break;
    case 'PUT':
        handleUpdatePatient($db);
        break;
    case 'DELETE':
        handleDeletePatient($db);
        break;
    default:
        sendResponse("error", null, "Méthode non autorisée", 405);
}

function generatePatientPassword($lastName, $firstName, $phone) {
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

function formatPhotoUrl($rawPhoto) {
    if (empty($rawPhoto)) return null;
    if (str_starts_with($rawPhoto, 'data:') || str_starts_with($rawPhoto, 'http://') || str_starts_with($rawPhoto, 'https://')) {
        return $rawPhoto;
    }
    $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? '127.0.0.1:8000';
    $baseUrl = $scheme . '://' . $host;
    return $baseUrl . '/' . ltrim($rawPhoto, '/');
}

function handleUploadPatientPhoto($db) {
    $body = getRequestBody();
    $patientId = isset($_POST['id']) ? intval($_POST['id']) : (isset($body['id']) ? intval($body['id']) : (isset($_GET['id']) ? intval($_GET['id']) : null));

    if (!$patientId) {
        sendResponse("error", null, "ID patient manquant", 400);
    }

    $photoValue = null;

    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/avatars/';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }
        $ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION)) ?: 'jpg';
        $filename = 'patient_' . $patientId . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . $filename;
        if (move_uploaded_file($_FILES['photo']['tmp_name'], $destPath)) {
            $photoValue = 'uploads/avatars/' . $filename;
        }
    } elseif (!empty($body['photo']) || !empty($_POST['photo'])) {
        $dataUrl = !empty($body['photo']) ? $body['photo'] : $_POST['photo'];
        if (preg_match('/^data:image\/(\w+);base64,/', $dataUrl, $type)) {
            $uploadDir = __DIR__ . '/../uploads/avatars/';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0777, true);
            }
            $ext = strtolower($type[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
            $data = substr($dataUrl, strpos($dataUrl, ',') + 1);
            $decoded = base64_decode($data);
            if ($decoded !== false) {
                $filename = 'patient_' . $patientId . '_' . time() . '.' . $ext;
                $destPath = $uploadDir . $filename;
                if (@file_put_contents($destPath, $decoded)) {
                    $photoValue = 'uploads/avatars/' . $filename;
                } else {
                    $photoValue = $dataUrl;
                }
            } else {
                $photoValue = $dataUrl;
            }
        } else {
            $photoValue = $dataUrl;
        }
    }

    if ($photoValue === null) {
        sendResponse("error", null, "Aucune photo fournie", 400);
    }

    try {
        $stmt = $db->prepare("UPDATE patients SET photo = :photo WHERE id = :id");
        $stmt->execute([':photo' => $photoValue, ':id' => $patientId]);

        $formattedUrl = formatPhotoUrl($photoValue);
        sendResponse("success", [
            "id" => $patientId,
            "photo" => $formattedUrl
        ], "Photo de profil mise à jour avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur enregistrement photo : " . $e->getMessage(), 500);
    }
}

function handleGetPatients($db) {
    try {
        // Auto-réparation automatique : Si des patients ont id = 0, leur réassigner un ID valide
        try {
            $zeroP = $db->query("SELECT COUNT(*) FROM patients WHERE id = 0");
            if ($zeroP && intval($zeroP->fetchColumn()) > 0) {
                $db->exec("SET @new_pid = (SELECT COALESCE(MAX(id), 20) FROM patients WHERE id > 0); UPDATE patients SET id = (@new_pid := @new_pid + 1) WHERE id = 0;");
            }
        } catch (Exception $e) {}

        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        $search = isset($_GET['search']) ? trim($_GET['search']) : null;

        $sql = "SELECT * FROM patients ";
        $params = [];

        if ($id) {
            $sql .= " WHERE id = :id ";
            $params[':id'] = $id;
        } elseif ($search) {
            $sql .= " WHERE first_name LIKE :s OR last_name LIKE :s OR file_number LIKE :s OR phone LIKE :s ";
            $params[':s'] = "%" . $search . "%";
        }

        $sql .= " ORDER BY created_at DESC, id DESC ";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $patients = [];
        foreach ($rows as $r) {
            // Récupérer allergies
            $aStmt = $db->prepare("SELECT allergy FROM patient_allergies WHERE patient_id = :pid");
            $aStmt->execute([':pid' => $r['id']]);
            $allergies = $aStmt->fetchAll(PDO::FETCH_COLUMN);

            // Récupérer maladies chroniques
            $dStmt = $db->prepare("SELECT disease FROM patient_chronic_diseases WHERE patient_id = :pid");
            $dStmt->execute([':pid' => $r['id']]);
            $diseases = $dStmt->fetchAll(PDO::FETCH_COLUMN);

            // Récupérer traitements habituels
            $tStmt = $db->prepare("SELECT treatment FROM patient_regular_treatments WHERE patient_id = :pid");
            $tStmt->execute([':pid' => $r['id']]);
            $treatments = $tStmt->fetchAll(PDO::FETCH_COLUMN);

            // Calculer l'âge exact
            $calculatedAge = $r['age'];
            if (!empty($r['dob'])) {
                $dob = new DateTime($r['dob']);
                $today = new DateTime();
                $calculatedAge = $today->diff($dob)->y;
            }

            // Calculer le nombre réel de consultations enregistrées
            $cStmt = $db->prepare("SELECT COUNT(*) FROM consultations WHERE patient_id = :pid");
            $cStmt->execute([':pid' => $r['id']]);
            $consultationsCount = intval($cStmt->fetchColumn());

            // Récupérer la dernière visite réelle si non renseignée
            $latestVisit = $r['last_visit'];
            if (empty($latestVisit)) {
                $lvStmt = $db->prepare("SELECT consultation_date FROM consultations WHERE patient_id = :pid ORDER BY consultation_date DESC, id DESC LIMIT 1");
                $lvStmt->execute([':pid' => $r['id']]);
                $latestVisit = $lvStmt->fetchColumn() ?: null;
            }

            $pwd = !empty($r['password']) ? $r['password'] : generatePatientPassword($r['last_name'], $r['first_name'], $r['phone']);

            $patients[] = [
                "id" => intval($r['id']),
                "fileNumber" => $r['file_number'],
                "firstName" => $r['first_name'],
                "lastName" => $r['last_name'],
                "dob" => $r['dob'],
                "age" => $calculatedAge,
                "gender" => $r['gender'],
                "phone" => $r['phone'],
                "email" => $r['email'],
                "password" => $pwd,
                "address" => $r['address'],
                "secuNumber" => $r['secu_number'],
                "bloodGroup" => $r['blood_group'],
                "allergies" => $allergies ?: ["Aucune allergie connue"],
                "chronicDiseases" => $diseases ?: [],
                "regularTreatments" => $treatments ?: [],
                "gravida" => intval($r['gravida'] ?? 0),
                "para" => intval($r['para'] ?? 0),
                "cesarean" => intval($r['cesarean'] ?? 0),
                "livingChildren" => intval($r['living_children'] ?? 0),
                "lastVisit" => $latestVisit,
                "consultationsCount" => $consultationsCount,
                "photo" => formatPhotoUrl($r['photo'] ?? null),
                "status" => $r['status']
            ];
        }

        sendResponse("success", $patients, "Patients récupérés avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur récupération patients : " . $e->getMessage(), 500);
    }
}

function handleCreatePatient($db) {
    $body = getRequestBody();

    if (empty($body['firstName']) || empty($body['lastName'])) {
        sendResponse("error", null, "Le prénom et le nom sont requis", 400);
    }

    try {
        $year = date('Y');
        $maxStmt = $db->query("SELECT COALESCE(MAX(id), 0) + 1 FROM patients");
        $nextNum = $maxStmt->fetchColumn();
        $fileNumber = !empty($body['fileNumber']) ? $body['fileNumber'] : sprintf("DOS-%s-%03d", $year, $nextNum);

        $dob = !empty($body['dob']) ? $body['dob'] : null;
        $age = null;
        if ($dob) {
            $dobDate = new DateTime($dob);
            $age = (new DateTime())->diff($dobDate)->y;
        } elseif (!empty($body['age'])) {
            $age = intval($body['age']);
        }

        $password = !empty($body['password']) 
            ? trim($body['password']) 
            : generatePatientPassword($body['lastName'], $body['firstName'], $body['phone'] ?? '');

        // Calculer l'ID automatiquement pour garantir un ID unique même si AUTO_INCREMENT est manquant
        $maxPidStmt = $db->query("SELECT COALESCE(MAX(id), 20) + 1 FROM patients WHERE id > 0");
        $nextPatientId = intval($maxPidStmt->fetchColumn() ?: 21);

        $sql = "INSERT INTO patients 
                    (id, file_number, first_name, last_name, dob, age, gender, phone, email, password, address, secu_number, blood_group, status)
                VALUES 
                    (:id, :fn, :fname, :lname, :dob, :age, :gender, :phone, :email, :pwd, :addr, :secu, :bg, 'Actif')";

        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':id' => $nextPatientId,
            ':fn' => $fileNumber,
            ':fname' => trim($body['firstName']),
            ':lname' => trim($body['lastName']),
            ':dob' => $dob,
            ':age' => $age,
            ':gender' => $body['gender'] ?? 'Féminin',
            ':phone' => $body['phone'] ?? null,
            ':email' => $body['email'] ?? null,
            ':pwd' => $password,
            ':addr' => $body['address'] ?? null,
            ':secu' => $body['secuNumber'] ?? null,
            ':bg' => $body['bloodGroup'] ?? 'O+'
        ]);

        $newId = $nextPatientId;

        // Sauvegarder allergies si spécifiées
        if (!empty($body['allergies']) && is_array($body['allergies'])) {
            $aStmt = $db->prepare("INSERT INTO patient_allergies (patient_id, allergy) VALUES (:pid, :allergy)");
            foreach ($body['allergies'] as $allergy) {
                if (trim($allergy) && trim($allergy) !== 'Aucune allergie connue') {
                    $aStmt->execute([':pid' => $newId, ':allergy' => trim($allergy)]);
                }
            }
        }

        // Sauvegarder antécédents / maladies chroniques
        if (!empty($body['chronicDiseases']) && is_array($body['chronicDiseases'])) {
            $dStmt = $db->prepare("INSERT INTO patient_chronic_diseases (patient_id, disease) VALUES (:pid, :disease)");
            foreach ($body['chronicDiseases'] as $disease) {
                if (trim($disease)) {
                    $dStmt->execute([':pid' => $newId, ':disease' => trim($disease)]);
                }
            }
        }

        sendResponse("success", [
            "id" => $newId,
            "fileNumber" => $fileNumber,
            "firstName" => trim($body['firstName']),
            "lastName" => trim($body['lastName']),
            "dob" => $dob,
            "age" => $age,
            "gender" => $body['gender'] ?? 'Féminin',
            "phone" => $body['phone'] ?? null,
            "email" => $body['email'] ?? null,
            "password" => $password,
            "address" => $body['address'] ?? null,
            "secuNumber" => $body['secuNumber'] ?? null,
            "bloodGroup" => $body['bloodGroup'] ?? 'O+',
            "allergies" => $body['allergies'] ?? ["Aucune allergie connue"],
            "chronicDiseases" => $body['chronicDiseases'] ?? [],
            "regularTreatments" => [],
            "lastVisit" => null,
            "status" => "Actif"
        ], "Patient créé avec succès dans MySQL", 201);
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur création patient : " . $e->getMessage(), 500);
    }
}

function handleUpdatePatient($db) {
    $body = getRequestBody();
    $id = isset($_GET['id']) ? intval($_GET['id']) : (isset($body['id']) ? intval($body['id']) : null);

    if (!$id) {
        sendResponse("error", null, "ID patient requis pour la mise à jour", 400);
    }

    try {
        $dob = !empty($body['dob']) ? $body['dob'] : null;
        $age = null;
        if ($dob) {
            $dobDate = new DateTime($dob);
            $age = (new DateTime())->diff($dobDate)->y;
        } elseif (!empty($body['age'])) {
            $age = intval($body['age']);
        }

        $pwd = !empty($body['password']) ? trim($body['password']) : null;
        $pwdSql = $pwd ? ", password = :pwd" : "";

        $hasPhoto = array_key_exists('photo', $body);
        $photoSql = $hasPhoto ? ", photo = :photo" : "";

        $sql = "UPDATE patients SET 
                    first_name = :fname,
                    last_name = :lname,
                    dob = :dob,
                    age = :age,
                    gender = :gender,
                    phone = :phone,
                    email = :email,
                    address = :addr,
                    secu_number = :secu,
                    blood_group = :bg
                    $pwdSql
                    $photoSql
                WHERE id = :id";
        $stmt = $db->prepare($sql);
        $params = [
            ':fname' => trim($body['firstName']),
            ':lname' => trim($body['lastName']),
            ':dob' => $dob,
            ':age' => $age,
            ':gender' => $body['gender'] ?? 'Féminin',
            ':phone' => $body['phone'] ?? null,
            ':email' => $body['email'] ?? null,
            ':addr' => $body['address'] ?? null,
            ':secu' => $body['secuNumber'] ?? null,
            ':bg' => $body['bloodGroup'] ?? null,
            ':id' => $id
        ];
        if ($pwd) {
            $params[':pwd'] = $pwd;
        }
        if ($hasPhoto) {
            $params[':photo'] = $body['photo'] ?: null;
        }
        $stmt->execute($params);

        sendResponse("success", [
            "id" => $id,
            "firstName" => trim($body['firstName']),
            "lastName" => trim($body['lastName']),
            "dob" => $dob,
            "age" => $age,
            "gender" => $body['gender'] ?? 'Féminin',
            "phone" => $body['phone'] ?? null,
            "email" => $body['email'] ?? null,
            "password" => $pwd,
            "address" => $body['address'] ?? null,
            "secuNumber" => $body['secuNumber'] ?? null,
            "bloodGroup" => $body['bloodGroup'] ?? null
        ], "Patient mis à jour avec succès");
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur mise à jour patient : " . $e->getMessage(), 500);
    }
}

function handleDeletePatient($db) {
    $body = getRequestBody();
    $id = isset($_GET['id']) ? intval($_GET['id']) : (isset($body['id']) ? intval($body['id']) : null);

    if (!$id) {
        sendResponse("error", null, "ID patient requis pour la suppression", 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM patients WHERE id = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() > 0) {
            sendResponse("success", ["id" => $id], "Patient supprimé de la base de données");
        } else {
            sendResponse("error", null, "Patient introuvable ou déjà supprimé", 404);
        }
    } catch (Exception $e) {
        sendResponse("error", null, "Erreur suppression patient : " . $e->getMessage(), 500);
    }
}
