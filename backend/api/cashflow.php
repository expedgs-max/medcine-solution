<?php
// backend/api/cashflow.php
// Journal de Caisse & Comptabilité (Recettes, Dépenses, Solde, Catégories)

require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetCashflow($db);
        break;
    case 'POST':
        handlePostCashflow($db);
        break;
    case 'PUT':
        handleUpdateCashflow($db);
        break;
    case 'DELETE':
        handleDeleteCashflow($db);
        break;
    default:
        sendResponse('error', null, 'Méthode non autorisée', 405);
        break;
}

function handleGetCashflow($db) {
    $action = $_GET['action'] ?? 'all';

    try {
        if ($action === 'categories') {
            $categories = getCategoriesList($db);
            sendResponse('success', $categories, 'Catégories récupérées');
            return;
        }

        // 1. Récupérer toutes les écritures de caisse
        $stmt = $db->query("SELECT * FROM cash_entries ORDER BY entry_date DESC, created_at DESC, id DESC");
        $rows = $stmt->fetchAll();

        $entries = array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'type' => $r['type'],
                'reference' => $r['reference'],
                'partyName' => $r['party_name'],
                'partyPhone' => $r['party_phone'] ?? '',
                'category' => $r['category'],
                'amount' => (float)$r['amount'],
                'entryDate' => $r['entry_date'],
                'paymentMethod' => $r['payment_method'] ?? 'Espèces',
                'notes' => $r['notes'] ?? '',
                'attachmentPath' => $r['attachment_path'] ?? null,
                'attachmentName' => $r['attachment_name'] ?? null,
                'operator' => $r['operator'] ?? 'Dr N. BELBACHIR OULD HENNIA',
                'createdAt' => $r['created_at'],
            ];
        }, $rows);

        // 2. Récupérer les catégories
        $categories = getCategoriesList($db);

        // 3. Calculer les statistiques du résumé (KPIs)
        $today = date('Y-m-d');
        $thisMonth = date('Y-m');

        $totalRecettes = 0;
        $totalDepenses = 0;
        $todayRecettes = 0;
        $todayDepenses = 0;
        $monthRecettes = 0;
        $monthDepenses = 0;

        foreach ($entries as $e) {
            $amt = $e['amount'];
            $isToday = ($e['entryDate'] === $today);
            $isThisMonth = (substr($e['entryDate'], 0, 7) === $thisMonth);

            if ($e['type'] === 'RECETTE') {
                $totalRecettes += $amt;
                if ($isToday) $todayRecettes += $amt;
                if ($isThisMonth) $monthRecettes += $amt;
            } else {
                $totalDepenses += $amt;
                if ($isToday) $todayDepenses += $amt;
                if ($isThisMonth) $monthDepenses += $amt;
            }
        }

        $soldeCaisse = $totalRecettes - $totalDepenses;
        $beneficeJour = $todayRecettes - $todayDepenses;

        $summary = [
            'totalRecettes' => $totalRecettes,
            'totalDepenses' => $totalDepenses,
            'soldeCaisse' => $soldeCaisse,
            'todayRecettes' => $todayRecettes,
            'todayDepenses' => $todayDepenses,
            'beneficeJour' => $beneficeJour,
            'monthRecettes' => $monthRecettes,
            'monthDepenses' => $monthDepenses,
            'totalEntries' => count($entries),
        ];

        sendResponse('success', [
            'entries' => $entries,
            'categories' => $categories,
            'summary' => $summary,
        ], 'Journal de caisse récupéré avec succès');

    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur lors du chargement de la caisse : ' . $e->getMessage(), 500);
    }
}

function getCategoriesList($db) {
    $stmt = $db->query("SELECT * FROM cash_categories ORDER BY type DESC, name ASC");
    $all = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $recettes = [];
    $depenses = [];

    foreach ($all as $c) {
        $item = [
            'id' => (int)$c['id'],
            'type' => $c['type'],
            'name' => $c['name'],
            'color' => $c['color'] ?? '#1e60d5',
        ];
        if ($c['type'] === 'RECETTE') {
            $recettes[] = $item;
        } else {
            $depenses[] = $item;
        }
    }

    return [
        'all' => $all,
        'recettes' => $recettes,
        'depenses' => $depenses,
    ];
}

function handlePostCashflow($db) {
    $input = getRequestBody();
    $action = $_GET['action'] ?? ($input['action'] ?? 'entry');

    try {
        if ($action === 'category' || $action === 'save_category') {
            $id = !empty($input['id']) ? (int)$input['id'] : null;
            $type = strtoupper($input['type'] ?? 'RECETTE');
            $name = trim($input['name'] ?? '');

            if (empty($name)) {
                sendResponse('error', null, 'Le nom de la catégorie est obligatoire', 400);
            }

            if ($id) {
                // Récupérer l'ancien nom de catégorie pour mettre à jour les écritures associées
                $oldStmt = $db->prepare("SELECT name, type FROM cash_categories WHERE id = :id");
                $oldStmt->execute([':id' => $id]);
                $oldCat = $oldStmt->fetch();
                $oldName = $oldCat ? $oldCat['name'] : null;

                $stmt = $db->prepare("UPDATE cash_categories SET name = :name, type = :type WHERE id = :id");
                $stmt->execute([':name' => $name, ':type' => $type, ':id' => $id]);

                if ($oldName && $oldName !== $name) {
                    $upEntries = $db->prepare("UPDATE cash_entries SET category = :newName WHERE category = :oldName AND type = :type");
                    $upEntries->execute([':newName' => $name, ':oldName' => $oldName, ':type' => $type]);
                }

                sendResponse('success', ['id' => $id, 'name' => $name, 'type' => $type], 'Catégorie modifiée avec succès');
                return;
            } else {
                $stmt = $db->prepare("INSERT INTO cash_categories (type, name) VALUES (:type, :name)");
                $stmt->execute([':type' => $type, ':name' => $name]);
                $newId = $db->lastInsertId();

                sendResponse('success', ['id' => (int)$newId, 'name' => $name, 'type' => $type], 'Catégorie ajoutée avec succès', 201);
                return;
            }
        }

        // Création ou Mise à jour d'une écriture comptable
        $id = !empty($input['id']) ? (int)$input['id'] : null;
        $type = strtoupper($input['type'] ?? 'RECETTE');
        if (!in_array($type, ['RECETTE', 'DEPENSE'])) {
            $type = 'RECETTE';
        }

        $partyName = trim($input['partyName'] ?? ($input['client'] ?? 'Client / Fournisseur'));
        $partyPhone = trim($input['partyPhone'] ?? ($input['phone'] ?? ''));
        $category = trim($input['category'] ?? ($type === 'RECETTE' ? 'CONSULTATION MÉDICALE' : 'AUTRE DÉPENSE'));
        $amount = isset($input['amount']) ? (float)$input['amount'] : 0.0;
        $entryDate = !empty($input['entryDate']) ? $input['entryDate'] : (!empty($input['date']) ? $input['date'] : date('Y-m-d'));
        $paymentMethod = $input['paymentMethod'] ?? ($input['method'] ?? 'Espèces');
        $notes = $input['notes'] ?? ($input['description'] ?? '');
        $attachmentPath = $input['attachmentPath'] ?? ($input['attachmentData'] ?? null);
        $attachmentName = $input['attachmentName'] ?? null;
        $operator = $input['operator'] ?? 'Dr N. BELBACHIR OULD HENNIA';

        if ($amount <= 0) {
            sendResponse('error', null, 'Le montant doit être supérieur à zéro', 400);
        }

        if ($id) {
            // Mise à jour
            $stmt = $db->prepare("
                UPDATE cash_entries SET
                    type = :type,
                    party_name = :partyName,
                    party_phone = :partyPhone,
                    category = :category,
                    amount = :amount,
                    entry_date = :entryDate,
                    payment_method = :paymentMethod,
                    notes = :notes,
                    attachment_path = COALESCE(:attachmentPath, attachment_path),
                    attachment_name = COALESCE(:attachmentName, attachment_name)
                WHERE id = :id
            ");
            $stmt->execute([
                ':type' => $type,
                ':partyName' => $partyName,
                ':partyPhone' => $partyPhone,
                ':category' => $category,
                ':amount' => $amount,
                ':entryDate' => $entryDate,
                ':paymentMethod' => $paymentMethod,
                ':notes' => $notes,
                ':attachmentPath' => $attachmentPath,
                ':attachmentName' => $attachmentName,
                ':id' => $id,
            ]);

            sendResponse('success', ['id' => $id], 'Écriture comptable mise à jour');
        } else {
            // Nouvelle écriture
            $prefix = ($type === 'RECETTE') ? 'REC' : 'DEP';
            $reference = $input['reference'] ?? ($prefix . '-' . date('Ymd-His'));

            $stmt = $db->prepare("
                INSERT INTO cash_entries (
                    type, reference, party_name, party_phone, category,
                    amount, entry_date, payment_method, notes,
                    attachment_path, attachment_name, operator
                ) VALUES (
                    :type, :reference, :partyName, :partyPhone, :category,
                    :amount, :entry_date, :paymentMethod, :notes,
                    :attachmentPath, :attachmentName, :operator
                )
            ");
            $stmt->execute([
                ':type' => $type,
                ':reference' => $reference,
                ':partyName' => $partyName,
                ':partyPhone' => $partyPhone,
                ':category' => $category,
                ':amount' => $amount,
                ':entry_date' => $entryDate,
                ':paymentMethod' => $paymentMethod,
                ':notes' => $notes,
                ':attachmentPath' => $attachmentPath,
                ':attachmentName' => $attachmentName,
                ':operator' => $operator,
            ]);

            $newId = (int)$db->lastInsertId();
            sendResponse('success', ['id' => $newId, 'reference' => $reference], 'Écriture de caisse enregistrée avec succès', 201);
        }

    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur lors de l\'enregistrement : ' . $e->getMessage(), 500);
    }
}

function handleUpdateCashflow($db) {
    handlePostCashflow($db);
}

function handleDeleteCashflow($db) {
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? 'entry';

    if (!$id) {
        sendResponse('error', null, 'Identifiant obligatoire', 400);
    }

    try {
        if ($action === 'category' || $action === 'delete_category') {
            $stmt = $db->prepare("DELETE FROM cash_categories WHERE id = :id");
            $stmt->execute([':id' => (int)$id]);
            sendResponse('success', null, 'Catégorie supprimée avec succès');
            return;
        }

        $stmt = $db->prepare("DELETE FROM cash_entries WHERE id = :id");
        $stmt->execute([':id' => (int)$id]);
        sendResponse('success', null, 'Écriture supprimée avec succès');
    } catch (PDOException $e) {
        sendResponse('error', null, 'Erreur lors de la suppression : ' . $e->getMessage(), 500);
    }
}
