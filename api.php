<?php
// ── Headers primero, ANTES de cualquier output ────────────────
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Capturar cualquier error PHP y devolverlo como JSON válido
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // Limpiar cualquier output previo
    if (ob_get_level()) ob_clean();
    echo json_encode([
        'success' => false,
        'error'   => "PHP Error [$errno]: $errstr en $errfile:$errline"
    ]);
    exit;
});

// Capturar excepciones no atrapadas
set_exception_handler(function($e) {
    if (ob_get_level()) ob_clean();
    echo json_encode([
        'success' => false,
        'error'   => "Exception: " . $e->getMessage()
    ]);
    exit;
});

// OPTIONS preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Cargar DB (sin headers duplicados) ───────────────────────
require_once 'db_only.php';

// ── Routing: PATH_INFO (local) o query params (producción) ───
$path = isset($_SERVER['PATH_INFO']) ? trim($_SERVER['PATH_INFO'], '/') : '';

if ($path !== '') {
    $parts    = explode('/', $path);
    $resource = $parts[0] ?? '';
    $id       = isset($parts[1]) ? $parts[1] : null;
} else {
    $resource = isset($_GET['resource']) ? $_GET['resource'] : '';
    $id       = isset($_GET['id'])       ? $_GET['id']       : null;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($resource) {
    case 'recipes':  handleRecipes($method, $id);  break;
    case 'users':    handleUsers($method, $id);    break;
    case 'comments': handleComments($method, $id); break;
    case 'ratings':  handleRatings($method, $id);  break;
    case 'auth':     handleAuth($method);           break;
    case 'upload':   handleUpload();                break;
    default:
        http_response_code(404);
        echo json_encode([
            'error'    => 'Recurso no encontrado',
            'resource' => $resource,
            'path'     => $path,
            'get'      => $_GET
        ]);
}

// ── UPLOAD ────────────────────────────────────────────────────
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
        echo json_encode(['success' => false, 'error' => 'Formato no permitido.']);
        return;
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        echo json_encode(['success' => false, 'error' => 'La imagen no puede superar 5MB.']);
        return;
    }
    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('img_', true) . '.' . strtolower($ext);
    if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
        echo json_encode(['success' => false, 'error' => 'Error al mover el archivo.']);
        return;
    }
    echo json_encode(['success' => true, 'url' => '/uploads/' . $filename]);
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
                    $recipe['average_rating'] = round(floatval($ratings['avg'] ?? 0), 1);
                    $recipe['rating_count']   = intval($ratings['count'] ?? 0);
                    $recipe['comments']       = $db->query("SELECT c.*, u.name, u.username FROM comments c JOIN users u ON c.author_id = u.id WHERE c.recipe_id = ? ORDER BY c.created_at DESC", [$numericId])->fetch_all(MYSQLI_ASSOC);
                }
                echo json_encode($recipe);
            } else {
                $recipes = $db->query("SELECT * FROM recipes ORDER BY created_at DESC")->fetch_all(MYSQLI_ASSOC);
                foreach ($recipes as &$r) {
                    $r['author']         = $db->query("SELECT id, name, username FROM users WHERE id = ?", [$r['author_id']])->fetch_assoc();
                    $comments            = $db->query("SELECT COUNT(*) as count FROM comments WHERE recipe_id = ?", [$r['id']])->fetch_assoc();
                    $r['comments_count'] = intval($comments['count']);
                    $ratings             = $db->query("SELECT AVG(value) as avg, COUNT(*) as count FROM ratings WHERE recipe_id = ?", [$r['id']])->fetch_assoc();
                    $r['average_rating'] = round(floatval($ratings['avg'] ?? 0), 1);
                    $r['rating_count']   = intval($ratings['count'] ?? 0);
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
            $db->execute("DELETE FROM recipes  WHERE id = ?",        [$numericId]);
            $db->execute("DELETE FROM comments WHERE recipe_id = ?", [$numericId]);
            $db->execute("DELETE FROM ratings  WHERE recipe_id = ?", [$numericId]);
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
            $recipeId = isset($_GET['recipeId']) ? $_GET['recipeId'] : null;
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
            $recipeId = isset($_GET['recipeId']) ? $_GET['recipeId'] : null;
            $userId   = isset($_GET['userId'])   ? $_GET['userId']   : null;
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
            echo json_encode(['success' => true, 'average' => round(floatval($ratings['avg']), 1), 'count' => intval($ratings['count'])]);
            break;
    }
}

// ── AUTH ──────────────────────────────────────────────────────
function handleAuth($method) {
    global $db;
    if ($method !== 'POST') {
        echo json_encode(['success' => false, 'error' => 'Método no permitido']);
        return;
    }
    $data   = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'login') {
        $user = $db->query("SELECT * FROM users WHERE email = ?", [$data['email']])->fetch_assoc();
        if (!$user || !password_verify($data['password'], $user['password'])) {
            echo json_encode(['success' => false, 'error' => 'Credenciales inválidas']);
            return;
        }
        echo json_encode(['success' => true, 'user' => [
            'id'       => $user['id'],
            'name'     => $user['name'],
            'username' => $user['username'],
            'email'    => $user['email']
        ]]);

    } elseif ($action === 'register') {
        $errors = [];
        if (strlen($data['name'] ?? '') < 2)                              $errors['name']     = 'El nombre debe tener al menos 2 caracteres.';
        if (!preg_match('/^[a-z0-9_]{3,20}$/i', $data['username'] ?? '')) $errors['username'] = 'Usuario inválido (3-20 chars).';
        if (!filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL))     $errors['email']    = 'Email inválido.';
        if (strlen($data['password'] ?? '') < 6)                          $errors['password'] = 'La contraseña debe tener al menos 6 caracteres.';
        if (!empty($errors)) { echo json_encode(['success' => false, 'errors' => $errors]); return; }

        $existing = $db->query("SELECT id FROM users WHERE username = ? OR email = ?", [$data['username'], $data['email']])->fetch_assoc();
        if ($existing) { echo json_encode(['success' => false, 'error' => 'Usuario o email ya existen']); return; }

        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        $db->execute("INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)",
            [$data['name'], $data['username'], $data['email'], $passwordHash]);
        $userId = $db->getLastInsertId();
        $user   = $db->query("SELECT id, name, username, email FROM users WHERE id = ?", [$userId])->fetch_assoc();
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Acción desconocida']);
    }
}
?>