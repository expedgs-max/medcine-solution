<?php
// backend/api/auth.php
// Authentification du personnel médical et vérification des mots de passe directement depuis MySQL (staff_users)

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleAuthAction($db);
        break;
    case 'GET':
        handleCheckSession($db);
        break;
    default:
        sendResponse('error', null, 'Méthode non autorisée', 405);
        break;
}

function handleAuthAction($db) {
    $input = getRequestBody();
    $action = $input['action'] ?? 'login';

    if ($action === 'change_password') {
        handleChangePassword($db, $input);
        return;
    }

    // Connexion normale
    handleLogin($db, $input);
}

function handleLogin($db, $input) {
    $username = trim($input['username'] ?? ($input['email'] ?? ''));
    $password = trim($input['password'] ?? '');

    if (empty($username) || empty($password)) {
        sendResponse('error', null, "Veuillez saisir votre identifiant et votre mot de passe.", 400);
    }

    try {
        // Recherche dans staff_users par nom d'utilisateur, email ou alias
        $stmt = $db->prepare("
            SELECT * FROM staff_users 
            WHERE LOWER(COALESCE(username, '')) = :u1 
               OR LOWER(email) = :u2
               OR (type = 'doctor' AND :u3 IN ('admin', 'dr.belbachir', 'doctor', 'docteur', 'belbachir'))
               OR (type = 'secretary' AND :u4 IN ('secretaire', 'secretariat'))
            LIMIT 1
        ");
        $uLower = strtolower($username);
        $stmt->execute([
            ':u1' => $uLower,
            ':u2' => $uLower,
            ':u3' => $uLower,
            ':u4' => $uLower,
        ]);
        $user = $stmt->fetch();

        if (!$user) {
            sendResponse('error', null, "Identifiant ou adresse email introuvable dans la base de données.", 401);
        }

        if ($user['status'] !== 'Actif') {
            sendResponse('error', null, "Ce compte utilisateur est actuellement désactivé ou suspendu.", 403);
        }

        // Vérification sécurisée du mot de passe avec le hash stocké en base de données
        $passwordHash = $user['password_hash'] ?? '';
        $isValid = false;

        if (!empty($passwordHash)) {
            if (password_verify($password, $passwordHash)) {
                $isValid = true;
            }
        }

        if (!$isValid) {
            sendResponse('error', null, "Mot de passe incorrect.", 401);
        }

        // Mettre à jour la date de dernière connexion
        $stmtUpdate = $db->prepare("UPDATE staff_users SET last_login = NOW() WHERE id = :id");
        $stmtUpdate->execute([':id' => $user['id']]);

        // Générer un jeton de session
        $token = bin2hex(random_bytes(32));

        // Récupérer le rôle et ses habilitations de pages depuis staff_roles
        $roleId = $user['role_id'] ?? ($user['type'] === 'doctor' ? 'role-superadmin' : 'role-secretary');
        $pages = [];
        $badgeColor = '#1e60d5';

        try {
            $stmtRole = $db->prepare("SELECT * FROM staff_roles WHERE id = :rid LIMIT 1");
            $stmtRole->execute([':rid' => $roleId]);
            $roleData = $stmtRole->fetch();
            if ($roleData) {
                $badgeColor = $roleData['badge_color'] ?? '#1e60d5';
                if (!empty($roleData['pages_json'])) {
                    $pages = json_decode($roleData['pages_json'], true) ?: [];
                }
            }
        } catch (Exception $e) {}

        if ($user['type'] === 'doctor' || $roleId === 'role-superadmin') {
            $pages['*'] = true;
        }

        $sessionUser = [
            'id' => (int)$user['id'],
            'username' => $user['username'] ?? ($user['type'] === 'doctor' ? 'admin' : 'secretaire'),
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'] ?? '',
            'role' => $user['role'],
            'roleId' => $roleId,
            'roleName' => $user['role'],
            'badgeColor' => $badgeColor,
            'type' => $user['type'],
            'accessLevel' => $user['access_level'] ?? '',
            'pages' => $pages,
            'permissions' => [
                'agenda' => $user['permission_agenda'] ?? 'Plein accès',
                'medicalRecords' => $user['permission_medical_records'] ?? 'Plein accès',
                'prescriptions' => $user['permission_prescriptions'] ?? 'Plein accès',
                'billing' => $user['permission_billing'] ?? 'Plein accès',
                'settings' => $user['permission_settings'] ?? 'Plein accès',
            ],
            'token' => $token,
            'loginTime' => date('c'),
        ];

        sendResponse('success', $sessionUser, "Connexion réussie");
    } catch (PDOException $e) {
        sendResponse('error', null, "Erreur lors de la vérification des identifiants : " . $e->getMessage(), 500);
    }
}

function handleChangePassword($db, $input) {
    $userId = (int)($input['userId'] ?? ($input['id'] ?? 1));
    $newPassword = trim($input['newPassword'] ?? ($input['password'] ?? ''));

    if (empty($newPassword) || strlen($newPassword) < 3) {
        sendResponse('error', null, "Le nouveau mot de passe doit comporter au moins 3 caractères.", 400);
    }

    try {
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE staff_users SET password_hash = :hash, updated_at = NOW() WHERE id = :id");
        $stmt->execute([':hash' => $hash, ':id' => $userId]);

        sendResponse('success', ['id' => $userId], "Mot de passe mis à jour avec succès dans la base de données");
    } catch (PDOException $e) {
        sendResponse('error', null, "Erreur mise à jour mot de passe : " . $e->getMessage(), 500);
    }
}

function handleCheckSession($db) {
    sendResponse('success', ['status' => 'online'], "Service d'authentification opérationnel");
}
