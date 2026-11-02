<?php
// backend/api/staff.php
// Gestion du personnel médical, secrétaires et comptes d'accès

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetStaff($db);
        break;
    case 'POST':
        handleSaveStaff($db);
        break;
    case 'PUT':
        handleUpdateStaff($db);
        break;
    case 'DELETE':
        handleDeleteStaff($db);
        break;
    default:
        sendResponse('error', null, 'Méthode non autorisée', 405);
        break;
}

function handleGetStaff($db) {
    try {
        $stmt = $db->query("
            SELECT u.*, 
                   COALESCE(r.name, u.role) AS resolved_role_name,
                   COALESCE(r.badge_color, '#1e60d5') AS role_badge_color
            FROM staff_users u
            LEFT JOIN staff_roles r ON r.id = u.role_id
            ORDER BY u.id ASC
        ");
        $rows = $stmt->fetchAll();

        $data = array_map(function ($row) {
            $roleId = !empty($row['role_id']) ? $row['role_id'] : (($row['type'] === 'doctor') ? 'role-superadmin' : 'role-secretary');
            return [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'username' => $row['username'] ?? ($row['type'] === 'doctor' ? 'admin' : 'secretaire'),
                'email' => $row['email'],
                'phone' => $row['phone'] ?? '',
                'role' => $row['resolved_role_name'] ?? $row['role'],
                'roleId' => $roleId,
                'roleName' => $row['resolved_role_name'] ?? $row['role'],
                'badgeColor' => $row['role_badge_color'] ?? '#1e60d5',
                'type' => $row['type'],
                'status' => $row['status'],
                'accessLevel' => $row['access_level'] ?? '',
                'permissions' => [
                    'agenda' => $row['permission_agenda'],
                    'medicalRecords' => $row['permission_medical_records'],
                    'prescriptions' => $row['permission_prescriptions'],
                    'billing' => $row['permission_billing'],
                    'settings' => $row['permission_settings'],
                ],
                'lastLogin' => $row['last_login'],
                'createdAt' => $row['created_at'],
            ];
        }, $rows);

        sendResponse('success', $data, 'Membres du personnel récupérés avec succès');
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur lors de la récupération du personnel : ' . $e->getMessage(), 500);
    }
}

function handleSaveStaff($db) {
    $input = getRequestBody();

    if (empty($input['name']) || empty($input['email'])) {
        sendResponse('error', null, 'Nom et adresse email obligatoires', 400);
    }

    try {
        $name = trim($input['name']);
        $email = trim($input['email']);
        $username = !empty($input['username']) ? trim($input['username']) : ($input['type'] === 'doctor' ? 'admin' : null);
        $phone = $input['phone'] ?? '';
        $type = $input['type'] ?? 'secretary';
        $status = $input['status'] ?? 'Actif';
        $accessLevel = $input['accessLevel'] ?? 'Accueil & Gestion Administrative';
        $password = !empty($input['password']) ? password_hash($input['password'], PASSWORD_DEFAULT) : null;

        $roleId = !empty($input['roleId']) ? trim($input['roleId']) : (!empty($input['role_id']) ? trim($input['role_id']) : null);
        $role = $input['role'] ?? ($input['roleName'] ?? null);

        if ($roleId && empty($role)) {
            $stmtR = $db->prepare("SELECT name FROM staff_roles WHERE id = :rid");
            $stmtR->execute([':rid' => $roleId]);
            $role = $stmtR->fetchColumn();
        }
        if (empty($role)) {
            $role = ($type === 'doctor') ? 'Médecin Titulaire (Super Admin)' : 'Secrétaire Médicale';
        }
        if (empty($roleId)) {
            $roleId = ($type === 'doctor') ? 'role-superadmin' : 'role-secretary';
        }

        // 1. Chercher si l'utilisateur existe déjà par ID, par Email ou premier compte médecin
        $existingId = null;
        if (!empty($input['id']) && is_numeric($input['id'])) {
            $stmtCheck = $db->prepare("SELECT id FROM staff_users WHERE id = :id");
            $stmtCheck->execute([':id' => (int)$input['id']]);
            $existingId = $stmtCheck->fetchColumn();
        }
        if (!$existingId && !empty($email)) {
            $stmtCheck = $db->prepare("SELECT id FROM staff_users WHERE email = :email");
            $stmtCheck->execute([':email' => $email]);
            $existingId = $stmtCheck->fetchColumn();
        }
        if (!$existingId && ($type === 'doctor' || (!empty($input['username']) && $input['username'] === 'admin'))) {
            $stmtCheck = $db->prepare("SELECT id FROM staff_users WHERE type = 'doctor' ORDER BY id ASC LIMIT 1");
            $stmtCheck->execute();
            $existingId = $stmtCheck->fetchColumn();
        }

        // 2. Mise à jour (UPDATE) ou Création (INSERT)
        if ($existingId) {
            $sql = "UPDATE staff_users SET
                        name = :name,
                        email = :email,
                        username = COALESCE(:username, username),
                        phone = :phone,
                        role_id = :role_id,
                        role = :role,
                        type = :type,
                        status = :status,
                        access_level = :access_level" . ($password ? ", password_hash = :pwd" : "") . "
                    WHERE id = :id";
            $params = [
                ':name' => $name,
                ':email' => $email,
                ':username' => $username,
                ':phone' => $phone,
                ':role_id' => $roleId,
                ':role' => $role,
                ':type' => $type,
                ':status' => $status,
                ':access_level' => $accessLevel,
                ':id' => (int)$existingId
            ];
            if ($password) $params[':pwd'] = $password;
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // Synchroniser également le médecin dans cabinet_info si applicable
            if ($type === 'doctor') {
                try {
                    $stmtCab = $db->prepare("
                        UPDATE cabinet_info 
                        SET doctor_name = :name, email = :email, phone = :phone 
                        WHERE id = (SELECT id FROM (SELECT id FROM cabinet_info ORDER BY id ASC LIMIT 1) AS tmp)
                    ");
                    $stmtCab->execute([
                        ':name' => $name,
                        ':email' => $email,
                        ':phone' => $phone
                    ]);
                } catch (Exception $e) {
                    // cabinet_info optionnel si non initialisé
                }
            }
        } else {
            // Insertion d'un nouveau compte
            $pwdHash = $password ?: password_hash('123456', PASSWORD_DEFAULT);
            $stmt = $db->prepare("
                INSERT INTO staff_users (
                    name, email, username, password_hash, phone, role_id, role, type, status, access_level
                ) VALUES (
                    :name, :email, :username, :pwd, :phone, :role_id, :role, :type, :status, :access_level
                )
            ");
            $stmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':username' => $username,
                ':pwd' => $pwdHash,
                ':phone' => $phone,
                ':role_id' => $roleId,
                ':role' => $role,
                ':type' => $type,
                ':status' => $status,
                ':access_level' => $accessLevel
            ]);
        }

        handleGetStaff($db);
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur enregistrement membre du personnel : ' . $e->getMessage(), 500);
    }
}

function handleUpdateStaff($db) {
    handleSaveStaff($db);
}

function handleDeleteStaff($db) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $input = getRequestBody();
        $id = $input['id'] ?? null;
    }

    if (!$id) {
        sendResponse('error', null, 'Identifiant membre manquant', 400);
    }

    if ((int)$id === 1) {
        sendResponse('error', null, 'Impossible de supprimer le médecin titulaire principal', 403);
    }

    try {
        $stmt = $db->prepare("DELETE FROM staff_users WHERE id = :id");
        $stmt->execute([':id' => (int)$id]);
        sendResponse('success', null, 'Membre du personnel supprimé avec succès');
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur lors de la suppression : ' . $e->getMessage(), 500);
    }
}
