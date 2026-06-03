<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once 'db.php';
 
$path = $_SERVER['PATH_INFO'] ?? '';
$path = trim($path, '/');
$parts = explode('/', $path);
$resource = $parts[0] ?? '';
$id = $parts[1] ?? null;
$method = $_SERVER['REQUEST_METHOD'];
 
switch ($resource) {
    case 'recipes':  handleRecipes($method, $id); break;
    case 'users':    handleUsers($method, $id); break;
    case 'comments': handleComments($method, $id); break;
    case 'ratings':  handleRatings($method, $id); break;
    case 'auth':     handleAuth($method); break;
    case 'upload':   handleUpload(); break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Recurso no encontrado']);
}
 
// ── UPLOAD DE IMAGEN ──────────────────────────────────────────
function handleUpload() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
 
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        $errorMsg = isset($_FILES['image']) ? 'Error código: ' . $_FILES['image']['error'] : 'No se recibió archivo';
        echo json_encode(['success' => false, 'error' => $errorMsg]);
        return;
    }
 
    $file     = $_FILES['image'];
    $allowed  = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $mimeType = mime_content_type($file['tmp_name']);
 
    if (!in_array($mimeType, $allowed)) {
        echo json_encode(['success' => false, 'error' => 'Formato no permitido. Usa JPG, PNG, GIF o WEBP.']);
        return;
    }
 
    if ($file['size'] > 5 * 1024 * 1024) {
        echo json_encode(['success' => false, 'error' => 'La imagen no puede superar 5MB.']);
        return;
    }
 
    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
 
    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('img_', true) . '.' . strtolower($ext);
    $destPath = $uploadDir . $filename;
 
    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        echo json_encode(['success' => false, 'error' => 'Error al mover el archivo.']);
        return;
    }
 
    $url = '/Proyecto_Final/uploads/' . $filename;
    echo json_encode(['success' => true, 'url' => $url]);
}
 
// ── RECIPES ───────────────────────────────────────────────────
function handleRecipes($method, $id) {
    global $db;
    switch ($method) {
        case 'GET':
            if ($id) {
                $numericId = intval($id);
                $recipe = $db->query("SELECT * FROM recipes WHERE id = ?", [$numericId])->fetch_assoc();
                if ($recipe) {
                    $recipe['author']         = $db->query("SELECT id, name, username FROM users WHERE id = ?", [$recipe['author_id']])->fetch_assoc();
                    $ratings                  = $db->query("SELECT AVG(value) as avg, COUNT(*) as count FROM ratings WHERE recipe_id = ?", [$numericId])->fetch_assoc();
                    $recipe['average_rating'] = round($ratings['avg'] ?? 0, 1);
                    $recipe['rating_count']   = $ratings['count'] ?? 0;
                    $recipe['comments']       = $db->query("SELECT c.*, u.name, u.username FROM comments c JOIN users u ON c.author_id = u.id WHERE c.recipe_id = ? ORDER BY c.created_at DESC", [$numericId])->fetch_all(MYSQLI_ASSOC);
                }
                echo json_encode($recipe);
            } else {
                $recipes = $db->query("SELECT * FROM recipes ORDER BY created_at DESC")->fetch_all(MYSQLI_ASSOC);
                foreach ($recipes as &$r) {
                    $r['author']         = $db->query("SELECT id, name, username FROM users WHERE id = ?", [$r['author_id']])->fetch_assoc();
                    $comments            = $db->query("SELECT COUNT(*) as count FROM comments WHERE recipe_id = ?", [$r['id']])->fetch_assoc();
                    $r['comments_count'] = $comments['count'];
                    $ratings             = $db->query("SELECT AVG(value) as avg, COUNT(*) as count FROM ratings WHERE recipe_id = ?", [$r['id']])->fetch_assoc();
                    $r['average_rating'] = round($ratings['avg'] ?? 0, 1);
                    $r['rating_count']   = $ratings['count'] ?? 0;
                }
                echo json_encode($recipes);
            }
            break;
 
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $db->execute(
                "INSERT INTO recipes (title, description, category, ingredients, steps, image, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [$data['title'], $data['description'], $data['category'],
                 json_encode($data['ingredients']), json_encode($data['steps']),
                 $data['image'] ?? '', $data['authorId']]
            );
            $recipeId = $db->getLastInsertId();
            echo json_encode(['success' => true, 'recipe' => $db->query("SELECT * FROM recipes WHERE id = ?", [$recipeId])->fetch_assoc()]);
            break;
 
        case 'PUT':
            $data    = json_decode(file_get_contents('php://input'), true);
            $idParam = $id ? intval($id) : intval($data['id'] ?? 0);
            $db->execute(
                "UPDATE recipes SET title = ?, description = ?, category = ?, ingredients = ?, steps = ?, image = ? WHERE id = ?",
                [$data['title'], $data['description'], $data['category'],
                 json_encode($data['ingredients']), json_encode($data['steps']),
                 $data['image'] ?? '', $idParam]
            );
            echo json_encode(['success' => true, 'recipe' => $db->query("SELECT * FROM recipes WHERE id = ?", [$idParam])->fetch_assoc()]);
            break;
 
        case 'DELETE':
            $numericId = intval($id);
            $db->execute("DELETE FROM recipes  WHERE id = ?",         [$numericId]);
            $db->execute("DELETE FROM comments WHERE recipe_id = ?",  [$numericId]);
            $db->execute("DELETE FROM ratings  WHERE recipe_id = ?",  [$numericId]);
            echo json_encode(['success' => true]);
            break;
    }
}
 
// ── USERS ─────────────────────────────────────────────────────
function handleUsers($method, $id) {
    global $db;
    switch ($method) {
        case 'GET':
            if ($id) {
                $numericId = intval($id);
                echo json_encode($db->query("SELECT id, name, username, email, created_at FROM users WHERE id = ?", [$numericId])->fetch_assoc());
            } else {
                echo json_encode($db->query("SELECT id, name, username, email, created_at FROM users")->fetch_all(MYSQLI_ASSOC));
            }
            break;
        case 'POST':
            $data         = json_decode(file_get_contents('php://input'), true);
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            $db->execute("INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)",
                [$data['name'], $data['username'], $data['email'], $passwordHash]);
            $userId = $db->getLastInsertId();
            echo json_encode(['success' => true, 'user' => $db->query("SELECT id, name, username, email, created_at FROM users WHERE id = ?", [$userId])->fetch_assoc()]);
            break;
    }
}
 
// ── COMMENTS ──────────────────────────────────────────────────
function handleComments($method, $id) {
    global $db;
    switch ($method) {
        case 'GET':
            $recipeId = $_GET['recipeId'] ?? null;
            if ($recipeId) {
                $numericId = intval($recipeId);
                echo json_encode($db->query("SELECT c.*, u.name, u.username FROM comments c JOIN users u ON c.author_id = u.id WHERE c.recipe_id = ? ORDER BY c.created_at DESC", [$numericId])->fetch_all(MYSQLI_ASSOC));
            } else {
                echo json_encode($db->query("SELECT c.*, u.name, u.username FROM comments c JOIN users u ON c.author_id = u.id ORDER BY c.created_at DESC")->fetch_all(MYSQLI_ASSOC));
            }
            break;
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $db->execute("INSERT INTO comments (recipe_id, author_id, text) VALUES (?, ?, ?)",
                [intval($data['recipeId']), intval($data['authorId']), $data['text']]);
            $commentId = $db->getLastInsertId();
            echo json_encode(['success' => true, 'comment' => $db->query("SELECT c.*, u.name, u.username FROM comments c JOIN users u ON c.author_id = u.id WHERE c.id = ?", [$commentId])->fetch_assoc()]);
            break;
        case 'DELETE':
            $numericId = intval($id);
            $db->execute("DELETE FROM comments WHERE id = ?", [$numericId]);
            echo json_encode(['success' => true]);
            break;
    }
}
 
// ── RATINGS ───────────────────────────────────────────────────
function handleRatings($method, $id) {
    global $db;
    switch ($method) {
        case 'GET':
            $recipeId = $_GET['recipeId'] ?? null;
            $userId   = $_GET['userId']   ?? null;
            if ($recipeId && $userId) {
                echo json_encode($db->query("SELECT * FROM ratings WHERE recipe_id = ? AND user_id = ?", [intval($recipeId), intval($userId)])->fetch_assoc());
            } elseif ($recipeId) {
                echo json_encode($db->query("SELECT * FROM ratings WHERE recipe_id = ?", [intval($recipeId)])->fetch_all(MYSQLI_ASSOC));
            } else {
                echo json_encode($db->query("SELECT * FROM ratings")->fetch_all(MYSQLI_ASSOC));
            }
            break;
        case 'POST':
            $data            = json_decode(file_get_contents('php://input'), true);
            $numericRecipeId = intval($data['recipeId']);
            $numericUserId   = intval($data['userId']);
            $existing        = $db->query("SELECT id FROM ratings WHERE recipe_id = ? AND user_id = ?", [$numericRecipeId, $numericUserId])->fetch_assoc();
            if ($existing) {
                $db->execute("UPDATE ratings SET value = ? WHERE id = ?", [$data['value'], $existing['id']]);
            } else {
                $db->execute("INSERT INTO ratings (recipe_id, user_id, value) VALUES (?, ?, ?)", [$numericRecipeId, $numericUserId, $data['value']]);
            }
            $ratings = $db->query("SELECT AVG(value) as avg, COUNT(*) as count FROM ratings WHERE recipe_id = ?", [$numericRecipeId])->fetch_assoc();
            echo json_encode(['success' => true, 'average' => round($ratings['avg'], 1), 'count' => $ratings['count']]);
            break;
    }
}
 
// ── AUTH ──────────────────────────────────────────────────────
function handleAuth($method) {
    global $db;
    if ($method !== 'POST') return;
    $data   = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';
 
    if ($action === 'login') {
        $user = $db->query("SELECT * FROM users WHERE email = ?", [$data['email']])->fetch_assoc();
        if (!$user || !password_verify($data['password'], $user['password'])) {
            echo json_encode(['success' => false, 'error' => 'Credenciales inválidas']);
            return;
        }
        echo json_encode(['success' => true, 'user' => ['id' => $user['id'], 'name' => $user['name'], 'username' => $user['username'], 'email' => $user['email']]]);
 
    } elseif ($action === 'register') {
        $errors = [];
        if (strlen($data['name']) < 2)                              $errors['name']     = 'El nombre debe tener al menos 2 caracteres.';
        if (!preg_match('/^[a-z0-9_]{3,20}$/i', $data['username'])) $errors['username'] = 'Usuario inválido (3-20 chars).';
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL))     $errors['email']    = 'Email inválido.';
        if (strlen($data['password']) < 6)                          $errors['password'] = 'La contraseña debe tener al menos 6 caracteres.';
        if (!empty($errors)) { echo json_encode(['success' => false, 'errors' => $errors]); return; }
 
        $existing = $db->query("SELECT id FROM users WHERE username = ? OR email = ?", [$data['username'], $data['email']])->fetch_assoc();
        if ($existing) { echo json_encode(['success' => false, 'error' => 'Usuario o email ya existen']); return; }
 
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        $db->execute("INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)",
            [$data['name'], $data['username'], $data['email'], $passwordHash]);
        $userId = $db->getLastInsertId();
        $user   = $db->query("SELECT id, name, username, email FROM users WHERE id = ?", [$userId])->fetch_assoc();
        echo json_encode(['success' => true, 'user' => $user]);
    }
}
?>