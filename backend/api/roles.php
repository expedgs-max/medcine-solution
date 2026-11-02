<?php
// backend/api/roles.php
// API CRUD pour la gestion des rôles et habilitations d'accès en Base de Données

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetRoles($db);
        break;
    case 'POST':
        handleSaveRole($db);
        break;
    case 'PUT':
        handleSaveRole($db);
        break;
    case 'DELETE':
        handleDeleteRole($db);
        break;
    default:
        sendResponse('error', null, 'Méthode non autorisée', 405);
        break;
}

function handleGetRoles($db) {
    try {
        $stmt = $db->query("
            SELECT r.*, 
                   COUNT(u.id) AS users_count
            FROM staff_roles r
            LEFT JOIN staff_users u ON u.role_id = r.id
            GROUP BY r.id
            ORDER BY r.is_system DESC, r.created_at ASC
        ");
        $rows = $stmt->fetchAll();

        $roles = array_map(function ($row) {
            $pages = [];
            if (!empty($row['pages_json'])) {
                $decoded = json_decode($row['pages_json'], true);
                if (is_array($decoded)) {
                    $pages = $decoded;
                }
            }

            return [
                'id' => $row['id'],
                'name' => $row['name'],
                'description' => $row['description'] ?? '',
                'badgeColor' => $row['badge_color'] ?? '#1e60d5',
                'isSystem' => (int)$row['is_system'] === 1,
                'pages' => $pages,
                'usersCount' => (int)($row['users_count'] ?? 0),
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at'],
            ];
        }, $rows);

        sendResponse('success', $roles, 'Rôles récupérés avec succès depuis MySQL');
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur récupération des rôles : ' . $e->getMessage(), 500);
    }
}

function handleSaveRole($db) {

    $input = getRequestBody();

    $name = trim($input['name'] ?? '');
    if (empty($name)) {
        sendResponse('error', null, 'Le nom du rôle est obligatoire', 400);
    }

    $id = !empty($input['id']) ? trim($input['id']) : ('role-' . time() . '-' . rand(100, 999));
    $description = trim($input['description'] ?? '');
    $badgeColor = trim($input['badgeColor'] ?? ($input['badge_color'] ?? '#1e60d5'));
    $isSystem = !empty($input['isSystem']) ? 1 : 0;
    
    $pages = $input['pages'] ?? [];
    if (!is_array($pages)) {
        $pages = [];
    }
    $pagesJson = json_encode($pages, JSON_UNESCAPED_UNICODE);

    try {
        // Vérifier si le rôle existe déjà
        $stmtCheck = $db->prepare("SELECT id, is_system FROM staff_roles WHERE id = :id");
        $stmtCheck->execute([':id' => $id]);
        $existing = $stmtCheck->fetch();

        if ($existing) {
            // Mise à jour
            $stmt = $db->prepare("
                UPDATE staff_roles 
                SET name = :name,
                    description = :description,
                    badge_color = :badge_color,
                    pages_json = :pages_json,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $stmt->execute([
                ':name' => $name,
                ':description' => $description,
                ':badge_color' => $badgeColor,
                ':pages_json' => $pagesJson,
                ':id' => $id,
            ]);

            // Mettre à jour le libellé du rôle dans les comptes staff associés
            $stmtUpdateStaff = $db->prepare("UPDATE staff_users SET role = :name WHERE role_id = :id");
            $stmtUpdateStaff->execute([':name' => $name, ':id' => $id]);

            sendResponse('success', [
                'id' => $id,
                'name' => $name,
                'description' => $description,
                'badgeColor' => $badgeColor,
                'isSystem' => (int)$existing['is_system'] === 1,
                'pages' => $pages,
            ], 'Rôle mis à jour avec succès dans la base de données');
        } else {
            // Création
            $stmt = $db->prepare("
                INSERT INTO staff_roles (id, name, description, badge_color, is_system, pages_json)
                VALUES (:id, :name, :description, :badge_color, :is_system, :pages_json)
            ");
            $stmt->execute([
                ':id' => $id,
                ':name' => $name,
                ':description' => $description,
                ':badge_color' => $badgeColor,
                ':is_system' => $isSystem,
                ':pages_json' => $pagesJson,
            ]);

            sendResponse('success', [
                'id' => $id,
                'name' => $name,
                'description' => $description,
                'badgeColor' => $badgeColor,
                'isSystem' => $isSystem === 1,
                'pages' => $pages,
            ], 'Rôle enregistré avec succès dans la base de données', 201);
        }
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur enregistrement rôle en BDD : ' . $e->getMessage(), 500);
    }
}

function handleDeleteRole($db) {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $body = getRequestBody();
        $id = $body['id'] ?? null;
    }

    if (!$id) {
        sendResponse('error', null, 'Identifiant du rôle manquant', 400);
    }

    if ($id === 'role-superadmin') {
        sendResponse('error', null, 'Le rôle Super Administrateur est protégé et ne peut être supprimé', 403);
    }

    try {
        // 1. Vérifier si des utilisateurs ont ce rôle
        $stmtCheck = $db->prepare("SELECT COUNT(*) FROM staff_users WHERE role_id = :id");
        $stmtCheck->execute([':id' => $id]);
        $usersCount = (int)$stmtCheck->fetchColumn();

        if ($usersCount > 0) {
            sendResponse('error', null, "Impossible de supprimer ce rôle car il est attribué à $usersCount utilisateur(s). Veuillez d'abord réassigner leurs comptes.", 400);
        }

        // 2. Supprimer de la table
        $stmt = $db->prepare("DELETE FROM staff_roles WHERE id = :id AND is_system = 0");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() > 0) {
            sendResponse('success', ['id' => $id], 'Rôle supprimé avec succès de la base de données');
        } else {
            sendResponse('error', null, 'Rôle introuvable ou protégé par le système', 404);
        }
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur suppression rôle en BDD : ' . $e->getMessage(), 500);
    }
}

