<?php
// === CONFIGURACIÓN INICIAL PARA EVITAR ERRORES ===
header('Content-Type: application/json');

// Manejar errores de PHP
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error interno del servidor',
        'details' => $errstr,
        'file' => basename($errfile),
        'line' => $errline
    ]);
    exit;
});

// Manejar excepciones
set_exception_handler(function($exception) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error interno del servidor',
        'details' => $exception->getMessage(),
        'file' => basename($exception->getFile()),
        'line' => $exception->getLine()
    ]);
    exit;
});

// Cargar configuración de la base de datos
require_once 'db.php';

// === PARSEO DE RUTA ===
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';
$path = trim($path, '/');
$parts = explode('/', $path);
$resource = $parts[0] ?? '';
$id = $parts[1] ?? null;

// === RUTEO ===
switch ($resource) {
    case 'recipes':  handleRecipes($method, $id); break;
    case 'users':    handleUsers($method, $id); break;
    case 'comments': handleComments($method, $id); break;
    case 'ratings':  handleRatings($method, $id); break;
    case 'auth':     handleAuth($method); break;
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Recurso no encontrado. Ejemplo: /api.php/recipes']);
        exit;
}

// === HANDLERS ===
function handleRecipes($method, $id) {
    global $db;
    switch ($method) {
        case 'GET':
            if ($id) {
                $recipe = $db->query("SELECT * FROM recipes WHERE id = ?", [$id])->fetch_assoc();
                if ($recipe) {
                    $recipe['author'] = $db->query("SELECT id, name, username FROM users WHERE id = ?", [$recipe['author_id']])->fetch_assoc();
                    $ratings = $db->query("SELECT AVG(value) as avg, COUNT(*) as count FROM ratings WHERE recipe_id = ?", [$id])->fetch_assoc();
                    $recipe['average_rating'] = round($ratings['avg'] ?? 0, 1);
                    $recipe['rating_count'] = $ratings['count'] ?? 0;
                    $recipe['comments'] = $db->query("SELECT c.*, u.name, u.username FROM comments c JOIN users u ON c.author_id = u.id WHERE c.recipe_id = ? ORDER BY c.created_at DESC", [$id])->fetch_all(MYSQLI_ASSOC);
                }
                echo json_encode($recipe);
            } else {
                $recipes = $db->query("SELECT * FROM recipes ORDER BY created_at DESC")->fetch_all(MYSQLI_ASSOC);
                foreach ($recipes as &$r) {
                    $r['author'] = $db->query("SELECT id, name, username FROM users WHERE id = ?", [$r['author_id']])->fetch_assoc();
                    $comments = $db->query("SELECT COUNT(*) as count FROM comments WHERE recipe_id = ?", [$r['id']])->fetch_assoc();
                    $r['comments_count'] = $comments['count'];
                    $ratings = $db->query("SELECT AVG(value) as avg, COUNT(*) as count FROM ratings WHERE recipe_id = ?", [$r['id']])->fetch_assoc();
                    $r['average_rating'] = round($ratings['avg'] ?? 0, 1);
                    $r['rating_count'] = $ratings['count'] ?? 0;
                }
                echo json_encode($recipes);
            }
            break;
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos inválidos']);
                exit;
            }
            $db->execute("INSERT INTO recipes (title, description, category, ingredients, steps, image, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [$data['title'], $data['description'], $data['category'], json_encode($data['ingredients']), json_encode($data['steps']), $data['image'] ?? '', $data['authorId']]);
            $recipeId = $db->getLastInsertId();
            $recipe = $db->query("SELECT * FROM recipes WHERE id = ?", [$recipeId])->fetch_assoc();
            echo json_encode(['success' => true, 'recipe' => $recipe]);
            break;
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos inválidos']);
                exit;
            }
            $db->execute("UPDATE recipes SET title = ?, description = ?, category = ?, ingredients = ?, steps = ?, image = ? WHERE id = ?",
                [$data['title'], $data['description'], $data['category'], json_encode($data['ingredients']), json_encode($data['steps']), $data['image'] ?? '', $id]);
            $recipe = $db->query("SELECT * FROM recipes WHERE id = ?", [$id])->fetch_assoc();
            echo json_encode(['success' => true, 'recipe' => $recipe]);
            break;
        case 'DELETE':
            $db->execute("DELETE FROM recipes WHERE id = ?", [$id]);
            $db->execute("DELETE FROM comments WHERE recipe_id = ?", [$id]);
            $db->execute("DELETE FROM ratings WHERE recipe_id = ?", [$id]);
            echo json_encode(['success' => true]);
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