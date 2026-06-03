<?php
header('Content-Type: text/html; charset=UTF-8');
$isLocal = (
    isset($_SERVER['HTTP_HOST']) &&
    (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
     strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false)
);
$base    = $isLocal ? '/Proyecto_Final' : '';
$siteUrl = 'https://fogon.onrender.com';
$v       = '5.0';
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

  <!-- ══ SEO BÁSICO ══════════════════════════════════════════ -->
  <title>Fogón — Recetas Colombianas y del Mundo</title>
  <meta name="description"        content="Fogón es la plataforma de recetas colombianas más completa. Encuentra bandeja paisa, ajiaco, sancocho, postres y mucho más. Comparte tus propias recetas."/>
  <meta name="keywords"           content="recetas colombianas, cocina colombiana, bandeja paisa, ajiaco bogotano, sancocho, lechona, arepas, buñuelos, natilla, recetas tradicionales, comida colombiana, fogón"/>
  <meta name="author"             content="Fogón — Cocina y Comunidad"/>
  <meta name="robots"             content="index, follow"/>
  <meta name="theme-color"        content="#2E1A0E"/>
  <link rel="canonical"           href="<?= $siteUrl ?>"/>

  <!-- ══ OPEN GRAPH (Facebook / WhatsApp) ═══════════════════ -->
  <meta property="og:type"        content="website"/>
  <meta property="og:site_name"   content="Fogón"/>
  <meta property="og:title"       content="Fogón — Recetas Colombianas y del Mundo"/>
  <meta property="og:description" content="Explora, inspira y disfruta recetas únicas que conectan tradición y creatividad. Bandeja paisa, ajiaco, sancocho y mucho más."/>
  <meta property="og:url"         content="<?= $siteUrl ?>"/>
  <meta property="og:image"       content="<?= $siteUrl ?>/images/og-image.jpg"/>
  <meta property="og:locale"      content="es_CO"/>

  <!-- ══ TWITTER CARD ════════════════════════════════════════ -->
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="Fogón — Recetas Colombianas y del Mundo"/>
  <meta name="twitter:description" content="Explora recetas colombianas tradicionales: bandeja paisa, ajiaco, sancocho y más. Únete a la comunidad Fogón."/>
  <meta name="twitter:image"       content="<?= $siteUrl ?>/images/og-image.jpg"/>

  <!-- ══ DATOS ESTRUCTURADOS (Google entiende el contenido) ══ -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Fogón",
    "alternateName": "Fogón — Cocina y Comunidad",
    "url": "<?= $siteUrl ?>",
    "description": "Plataforma de recetas colombianas y del mundo. Explora, comparte y disfruta recetas únicas.",
    "inLanguage": "es-CO",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "<?= $siteUrl ?>/?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Fogón",
    "url": "<?= $siteUrl ?>",
    "logo": "<?= $siteUrl ?>/images/logo.png",
    "description": "Comunidad de recetas colombianas y del mundo",
    "foundingLocation": {
      "@type": "Place",
      "name": "Colombia"
    }
  }
  </script>

  <!-- ══ PERFORMANCE ══════════════════════════════════════════ -->
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>

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
          <span class="logo-tagline">Cocina & Comunidad</span>
        </div>
      </div>
      <nav class="main-nav" aria-label="Navegación principal">
        <a href="#" onclick="navigateTo('home')"    class="nav-link">Inicio</a>
        <a href="#" onclick="navigateTo('recipes')" class="nav-link">Recetas</a>
        <span id="nav-auth-area"></span>
      </nav>
    </div>
  </header>

  <main id="app-root" role="main"></main>

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="logo-icon">🍳</span>
        <strong>Fogón</strong>
      </div>
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