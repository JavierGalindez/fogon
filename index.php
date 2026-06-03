<?php
header('Content-Type: text/html; charset=UTF-8');

// Detecta si estamos en local (XAMPP) o en producción (Render)
$isLocal = (
    isset($_SERVER['HTTP_HOST']) &&
    (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
     strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false)
);
$base = $isLocal ? '/Proyecto_Final' : '';
$v = '4.0';
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="description" content="Fogón - Plataforma de recetas colombianas y del mundo. Explora, inspira y disfruta recetas únicas."/>
  <meta name="keywords" content="recetas, cocina colombiana, comida, platillos, postres, Fogón"/>
  <meta name="author" content="Fogón"/>
  <meta property="og:title" content="Fogón — Plataforma de Recetas"/>
  <meta property="og:description" content="Explora, inspira y disfruta recetas únicas que conectan tradición y creatividad."/>
  <meta property="og:type" content="website"/>
  <title>Fogón — Plataforma de Recetas</title>
  <link rel="stylesheet" href="<?= $base ?>/css/styles.css?v=<?= $v ?>">
</head>
<body>

  <div id="toast" class="toast"></div>

  <div id="modal-overlay" class="modal-overlay hidden">
    <div id="modal-container" class="modal-container"></div>
  </div>

  <header class="site-header">
    <div class="header-inner">
      <div class="logo" onclick="navigateTo('home')">
        <span class="logo-icon">🍳</span>
        <div class="logo-text">
          <span class="logo-name">Fogón</span>
          <span class="logo-tagline">Cocina &amp; Comunidad</span>
        </div>
      </div>
      <nav class="main-nav">
        <a href="#" onclick="navigateTo('home')" class="nav-link">Inicio</a>
        <a href="#" onclick="navigateTo('recipes')" class="nav-link">Recetas</a>
        <span id="nav-auth-area"></span>
      </nav>
    </div>
  </header>

  <main id="app-root"></main>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand"><span class="logo-icon">🍳</span><strong>Fogón</strong></div>
      <p class="footer-copy">Hecho con amor y mucho picante · <?php echo date('Y'); ?></p>
    </div>
  </footer>

  <script>
    window.APP_CONFIG = {
      apiUrl: '<?= $base ?>/api.php',
      base:   '<?= $base ?>'
    };
  </script>
  <script src="<?= $base ?>/js/storage.js?v=<?= $v ?>"></script>
  <script src="<?= $base ?>/js/auth.js?v=<?= $v ?>"></script>
  <script src="<?= $base ?>/js/recipes.js?v=<?= $v ?>"></script>
  <script src="<?= $base ?>/js/comments.js?v=<?= $v ?>"></script>
  <script src="<?= $base ?>/js/ui.js?v=<?= $v ?>"></script>
  <script src="<?= $base ?>/js/app.js?v=<?= $v ?>"></script>
</body>
</html>