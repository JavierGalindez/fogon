const App = (() => {
  let currentPage = 'home';
  let currentRecipeId = null;
 
  // Router
  const navigate = async (page, param) => {
    param = param !== undefined ? param : null;
    currentPage = page;
    currentRecipeId = param ? Number(param) : null;
    await UI.renderNavAuth();
    const root = document.getElementById('app-root');
    switch (page) {
      case 'home':    root.innerHTML = await renderHome(); break;
      case 'recipes': root.innerHTML = await renderRecipes(); break;
      case 'detail':  root.innerHTML = await renderDetail(param); break;
      case 'profile': root.innerHTML = await renderProfile(); break;
      default:        root.innerHTML = await renderHome();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
 
  // HOME PAGE
  const renderHome = async () => {
    const allRecipes  = await Storage.getRecipes();
    const allUsers    = await Storage.getUsers();
    const allComments = await Storage.getComments();
    const featured    = allRecipes.slice(0, 6);
    const user        = await Storage.getCurrentUser();
 
    const createBtn = user
      ? '<button class="btn btn-ghost btn-lg" style="color:#fff;border-color:rgba(255,255,255,.35)" onclick="UI.openRecipeForm(0)">✨ Crear receta</button>'
      : '<button class="btn btn-ghost btn-lg" style="color:#fff;border-color:rgba(255,255,255,.35)" onclick="UI.openRegisterModal()">Únete gratis</button>';
 
    const gridOrEmpty = featured.length
      ? '<div class="recipe-grid">' + featured.map(r => UI.recipeCard(r)).join('') + '</div>'
      : '<div class="empty-state">'
          + '<div class="empty-state-icon">🍳</div>'
          + '<h3>¡Sin recetas aún!</h3>'
          + (user
              ? '<p>Sé el primero en publicar una receta.</p><button class="btn btn-primary" onclick="UI.openRecipeForm(0)">Crear primera receta</button>'
              : '<p>Regístrate y sé el primero en publicar.</p><button class="btn btn-primary" onclick="UI.openRegisterModal()">Únete</button>')
          + '</div>';
 
    return '<div class="hero">'
      + '<div class="hero-badge">🇨🇴 Sabores de Colombia y el mundo</div>'
      + '<h1>LA COCINA QUE <em>INSPIRA</em>, EL SABOR QUE NOS UNE</h1>'
      + '<p class="hero-sub">Explora, inspira y disfruta recetas únicas que conectan tradición y creatividad.</p>'
      + '<div class="hero-cta">'
      + '<button class="btn btn-primary btn-lg" onclick="navigateTo(\'recipes\')">🍽️ Ver recetas</button>'
      + createBtn
      + '</div>'
      + '<div class="hero-stats">'
      + '<div class="hero-stat"><div class="hero-stat-num">' + allRecipes.length + '</div><div class="hero-stat-label">Recetas</div></div>'
      + '<div class="hero-stat"><div class="hero-stat-num">' + allUsers.length + '</div><div class="hero-stat-label">Chefs</div></div>'
      + '<div class="hero-stat"><div class="hero-stat-num">' + allComments.length + '</div><div class="hero-stat-label">Comentarios</div></div>'
      + '</div></div>'
      + '<div class="section">'
      + '<div class="section-header">'
      + '<div><div class="section-label">Destacadas</div><h2>Recetas recientes</h2></div>'
      + '<button class="btn btn-ghost btn-sm" onclick="navigateTo(\'recipes\')">Ver todas →</button>'
      + '</div>'
      + gridOrEmpty
      + '</div>';
  };
 
  // RECIPES PAGE
  const renderRecipes = async (query, category) => {
    query    = query    !== undefined ? query    : '';
    category = category !== undefined ? category : 'Todas';
    const results = await Recipes.search(query, category);
    const user    = await Storage.getCurrentUser();
    const catOpts = Recipes.CATEGORIES.map(c =>
      '<option value="' + c + '"' + (c === category ? ' selected' : '') + '>' + c + '</option>'
    ).join('');
 
    return '<div class="section">'
      + '<div class="section-header">'
      + '<div><div class="section-label">Catálogo</div><h2>Todas las recetas</h2></div>'
      + (user ? '<button class="btn btn-primary" onclick="UI.openRecipeForm(0)">+ Nueva receta</button>' : '')
      + '</div>'
      + '<div class="search-bar">'
      + '<div class="search-input-wrap">'
      + '<span class="icon">🔍</span>'
      + '<input type="text" id="search-q" class="search-input" placeholder="Buscar por nombre o ingrediente…" value="' + UI.escapeHTML(query) + '" oninput="App.filterRecipes()" onkeyup="App.filterRecipes()">'
      + '</div>'
      + '<select id="search-cat" class="filter-select" onchange="App.filterRecipes()">' + catOpts + '</select>'
      + '</div>'
      + '<div id="recipe-grid-container">' + await renderRecipeGrid(results) + '</div>'
      + '</div>';
  };
 
  const renderRecipeGrid = async (results) => {
    if (!results.length) {
      return '<div class="empty-state">'
        + '<div class="empty-state-icon">🔍</div>'
        + '<h3>Sin resultados</h3>'
        + '<p>Prueba con otro término o categoría.</p>'
        + '</div>';
    }
    return '<div class="recipe-grid">' + results.map(r => UI.recipeCard(r)).join('') + '</div>';
  };
 
  const filterRecipes = async () => {
    const q   = document.getElementById('search-q') ? document.getElementById('search-q').value : '';
    const cat = document.getElementById('search-cat') ? document.getElementById('search-cat').value : 'Todas';
    const results   = await Recipes.search(q, cat);
    const container = document.getElementById('recipe-grid-container');
    if (container) container.innerHTML = await renderRecipeGrid(results);
  };
 
  // DETAIL PAGE
  const renderDetail = async (recipeId) => {
    const numericId = recipeId ? Number(recipeId) : null;
    const notFound  = '<div class="section"><div class="empty-state">'
      + '<div class="empty-state-icon">😕</div>'
      + '<h3>Receta no encontrada</h3>'
      + '<button class="btn btn-primary" onclick="navigateTo(\'recipes\')">Volver</button>'
      + '</div></div>';
 
    if (isNaN(numericId) || numericId === null) return notFound;
 
    const recipe = await Storage.getRecipeById(numericId);
    if (!recipe) return notFound;
 
    const author      = await Storage.getUserById(recipe.author_id);
    const currentUser = await Storage.getCurrentUser();
    const ratingData  = await Storage.getAverageRating(numericId);
    const avg         = ratingData.avg;
    const count       = ratingData.count;
    const isOwner     = currentUser && Number(recipe.author_id) === Number(currentUser.id);
    const userRating  = currentUser ? await Storage.getUserRating(numericId, currentUser.id) : null;
 
    const imgHTML = recipe.image
      ? `<img class="detail-img" 
            src="${UI.escapeHTML(recipe.image.replace('http:', 'https:'))}" 
            alt="${UI.escapeHTML(recipe.title)}"
            crossorigin="anonymous"
            onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\'detail-img-placeholder\'>${UI.categoryIcon(recipe.category)}</div>'">`
      : `<div class="detail-img-placeholder">${UI.categoryIcon(recipe.category)}</div>`;
    
    let ingredients = [];
    let steps = [];
    try {
      ingredients = recipe.ingredients ? (typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients) : [];
      steps       = recipe.steps       ? (typeof recipe.steps       === 'string' ? JSON.parse(recipe.steps)       : recipe.steps)       : [];
    } catch(e) { console.error(e); }
 
    const ingredientsHTML = ingredients.filter(i => i.trim()).map(i => '<li>' + UI.escapeHTML(i) + '</li>').join('');
    const stepsHTML       = steps.filter(s => s.trim()).map(function(s, i) {
      return '<li class="step-item"><span class="step-num">' + (i + 1) + '</span><span class="step-text">' + UI.escapeHTML(s) + '</span></li>';
    }).join('');
 
    var actionsHTML;
    if (currentUser) {
      var starsHTML = '';
      for (var n = 1; n <= 5; n++) {
        var isActive = (userRating && Number(userRating.value) >= n) ? ' active' : '';
        starsHTML += '<button class="star-btn' + isActive + '" onclick="App.rateRecipe(' + numericId + ',' + n + ')" title="' + n + ' estrella' + (n > 1 ? 's' : '') + '">★</button>';
      }
      var ownerBtns = '';
      if (isOwner) {
        ownerBtns = '<button class="btn btn-ghost btn-sm" onclick="UI.openRecipeForm(' + parseInt(recipe.id, 10) + ')">✏️ Editar</button>'
          + '<button class="btn btn-danger btn-sm" onclick="App.confirmDeleteRecipe(' + parseInt(recipe.id, 10) + ')">🗑️ Eliminar</button>';
      }
      actionsHTML = '<div class="detail-actions">'
        + '<span class="label">Tu calificación:</span>'
        + '<div class="star-rating" id="rating-stars-' + numericId + '">' + starsHTML + '</div>'
        + '<span style="flex:1"></span>'
        + ownerBtns
        + '</div>';
    } else {
      actionsHTML = '<div class="detail-actions">'
        + '<span class="label">Calificación:</span>'
        + '<div>' + UI.starsHTML(avg, count) + '</div>'
        + '<span style="flex:1"></span>'
        + '<button class="btn btn-ghost btn-sm" onclick="UI.openLoginModal()">Inicia sesión para calificar</button>'
        + '</div>';
    }
 
    const authorName = author ? author.name : 'Anónimo';
 
    return '<div class="detail-hero">'
      + '<div class="detail-hero-inner">'
      + '<button class="back-btn" onclick="navigateTo(\'recipes\')">← Volver</button>'
      + '<h1 class="detail-title">' + UI.escapeHTML(recipe.title) + '</h1>'
      + '<div class="detail-meta">'
      + '<span>por <span class="detail-author-name">' + UI.escapeHTML(authorName) + '</span></span>'
      + '<span class="detail-meta-sep">·</span>'
      + '<span>' + UI.formatDate(recipe.created_at) + '</span>'
      + '<span class="detail-meta-sep">·</span>'
      + '<span>' + UI.escapeHTML(recipe.category || 'Receta') + '</span>'
      + '<span class="detail-meta-sep">·</span>'
      + UI.starsHTML(avg, count)
      + '</div></div></div>'
      + '<div class="detail-body">'
      + imgHTML
      + actionsHTML
      + '<p class="detail-description">' + UI.escapeHTML(recipe.description) + '</p>'
      + '<h2 class="detail-section-title">Ingredientes</h2>'
      + '<ul class="ingredients-list">' + ingredientsHTML + '</ul>'
      + '<h2 class="detail-section-title">Preparación</h2>'
      + '<ol class="steps-list">' + stepsHTML + '</ol>'
      + '<h2 class="detail-section-title">Comentarios</h2>'
      + '<div class="comments-section">'
      + (await renderCommentForm(numericId))
      + '<div id="comments-list-' + numericId + '">' + (await renderCommentsList(numericId)) + '</div>'
      + '</div></div>';
  };
 
  const renderCommentForm = async (recipeId) => {
    const user = await Storage.getCurrentUser();
    if (!user) {
      return '<div class="login-prompt-box">'
        + '<h4>¿Quieres comentar?</h4>'
        + '<p>Inicia sesión o crea una cuenta para dejar tu opinión.</p>'
        + '<button class="btn btn-primary btn-sm" onclick="UI.openLoginModal()">Iniciar sesión</button>'
        + '<button class="btn btn-ghost btn-sm" onclick="UI.openRegisterModal()">Crear cuenta</button>'
        + '</div>';
    }
    return '<div class="comment-form">'
      + '<div class="comment-avatar" style="display:inline-flex;margin-bottom:.5rem">' + user.name.charAt(0).toUpperCase() + '</div>'
      + '<textarea id="comment-text-' + recipeId + '" placeholder="Escribe tu comentario…"></textarea>'
      + '<div class="comment-form-footer">'
      + '<button class="btn btn-primary btn-sm" onclick="App.submitComment(' + recipeId + ')">Publicar</button>'
      + '</div></div>';
  };
 
  const renderCommentsList = async (recipeId) => {
    const comments    = await Storage.getCommentsByRecipe(recipeId);
    const currentUser = await Storage.getCurrentUser();
    if (!comments.length) return '<p class="no-comments">Sin comentarios aún. ¡Sé el primero!</p>';
    return '<div class="comment-list">'
      + comments.map(c => UI.commentItem(c, currentUser ? currentUser.id : null)).join('')
      + '</div>';
  };
 
  // PROFILE PAGE
  const renderProfile = async () => {
    const user = await Storage.getCurrentUser();
    if (!user) { navigate('home'); return ''; }
 
    const allRecipes  = await Storage.getRecipes();
    const allComments = await Storage.getComments();
    const myRecipes   = allRecipes.filter(r => r.author_id == user.id);
    const myComments  = allComments.filter(c => c.author_id == user.id);
    const recipeMap   = {};
    allRecipes.forEach(r => { recipeMap[r.id] = r; });
 
    const commentsHTML = myComments.map(function(c) {
      const recipe = recipeMap[c.recipe_id];
      return '<div class="comment-item fade-up">'
        + '<div class="comment-avatar">' + user.name.charAt(0).toUpperCase() + '</div>'
        + '<div class="comment-body">'
        + '<div class="comment-header">'
        + '<span class="comment-author">En: <span style="cursor:pointer;color:var(--brown-dark)" onclick="navigateTo(\'detail\',' + c.recipe_id + ')">'
        + UI.escapeHTML(recipe ? recipe.title : 'Receta eliminada') + '</span></span>'
        + '<span class="comment-date">' + UI.formatDate(c.created_at) + '</span>'
        + '<button class="comment-delete" onclick="App.deleteComment(' + c.id + ')">✕ Eliminar</button>'
        + '</div>'
        + '<p class="comment-text">' + UI.escapeHTML(c.text) + '</p>'
        + '</div></div>';
    }).join('');
 
    return '<div class="profile-header">'
      + '<div class="profile-header-inner">'
      + '<div class="profile-avatar-lg">' + user.name.charAt(0).toUpperCase() + '</div>'
      + '<div class="profile-info">'
      + '<h2>' + UI.escapeHTML(user.name) + '</h2>'
      + '<p>@' + UI.escapeHTML(user.username) + ' · ' + UI.escapeHTML(user.email) + '</p>'
      + '<p style="margin-top:.4rem;color:rgba(255,255,255,.5);font-size:.82rem">Miembro desde ' + UI.formatDate(user.created_at) + '</p>'
      + '</div></div></div>'
      + '<div class="section">'
      + '<div class="tabs">'
      + '<button class="tab-btn active" id="tab-recipes" onclick="App.switchTab(\'recipes\')">🍽️ Mis recetas (' + myRecipes.length + ')</button>'
      + '<button class="tab-btn" id="tab-comments" onclick="App.switchTab(\'comments\')">💬 Mis comentarios (' + myComments.length + ')</button>'
      + '</div>'
      + '<div id="tab-recipes-panel">'
      + (myRecipes.length
          ? '<div style="margin-bottom:1rem;text-align:right"><button class="btn btn-primary btn-sm" onclick="UI.openRecipeForm(0)">+ Nueva receta</button></div>'
            + '<div class="recipe-grid">' + myRecipes.map(r => UI.recipeCard(r)).join('') + '</div>'
          : '<div class="empty-state"><div class="empty-state-icon">📝</div><h3>Aún no tienes recetas</h3><p>¡Publica tu primera receta!</p><button class="btn btn-primary" onclick="UI.openRecipeForm(0)">Crear receta</button></div>')
      + '</div>'
      + '<div id="tab-comments-panel" style="display:none">'
      + (myComments.length
          ? '<div class="comment-list">' + commentsHTML + '</div>'
          : '<div class="empty-state"><div class="empty-state-icon">💬</div><h3>Sin comentarios</h3><p>Comenta en alguna receta.</p></div>')
      + '</div></div>';
  };
 
  const switchTab = (tab) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('tab-recipes-panel').style.display  = tab === 'recipes'  ? '' : 'none';
    document.getElementById('tab-comments-panel').style.display = tab === 'comments' ? '' : 'none';
  };
 
  // AUTH HANDLERS
  const handleLogin = async () => {
    const email    = document.getElementById('login-email') ? document.getElementById('login-email').value : '';
    const password = document.getElementById('login-pass')  ? document.getElementById('login-pass').value  : '';
    UI.clearErrors('login-email-err', 'login-pass-err', 'login-general-err');
    const result = await Auth.login({ email, password });
    if (result.success) {
      UI.closeModal();
      UI.toast('¡Bienvenido/a, ' + result.user.name + '!', 'success');
      await navigate('home');
    } else {
      UI.showError('login-general-err', result.error);
    }
  };
 
  const handleRegister = async () => {
    const name     = document.getElementById('reg-name')     ? document.getElementById('reg-name').value     : '';
    const username = document.getElementById('reg-username') ? document.getElementById('reg-username').value : '';
    const email    = document.getElementById('reg-email')    ? document.getElementById('reg-email').value    : '';
    const password = document.getElementById('reg-pass')     ? document.getElementById('reg-pass').value     : '';
    UI.clearErrors('reg-name-err', 'reg-username-err', 'reg-email-err', 'reg-pass-err', 'reg-general-err');
    const result = await Auth.register({ name, username, email, password });
    if (result.success) {
      UI.closeModal();
      UI.toast('¡Cuenta creada! Bienvenido/a, ' + result.user.name + '!', 'success');
      await navigate('home');
    } else {
      if (result.errors) {
        if (result.errors.name)     UI.showError('reg-name-err',     result.errors.name);
        if (result.errors.username) UI.showError('reg-username-err', result.errors.username);
        if (result.errors.email)    UI.showError('reg-email-err',    result.errors.email);
        if (result.errors.password) UI.showError('reg-pass-err',     result.errors.password);
      } else {
        UI.showError('reg-general-err', result.error || 'Error al registrar.');
      }
    }
  };
 
  const logout = () => {
    Auth.logout();
    UI.toast('Sesión cerrada.', 'info');
    navigate('home');
  };
 
  // RECIPE HANDLERS
  const handleSaveRecipe = async (recipeId) => {
    const isEdit  = recipeId && recipeId !== 0 && recipeId !== 'null' && recipeId !== '';
    const cleanId = isEdit ? parseInt(recipeId, 10) : null;
 
    const title       = document.getElementById('rf-title')    ? document.getElementById('rf-title').value    : '';
    const description = document.getElementById('rf-desc')     ? document.getElementById('rf-desc').value     : '';
    const category    = document.getElementById('rf-category') ? document.getElementById('rf-category').value : '';
    const imgPreview  = document.getElementById('rf-img-preview');
 
    const ingredients = Array.from(document.querySelectorAll('.ing-input')).map(i => i.value.trim()).filter(Boolean);
    const steps       = Array.from(document.querySelectorAll('.stp-input')).map(i => i.value.trim()).filter(Boolean);
 
    UI.clearErrors('rf-title-err', 'rf-desc-err', 'rf-ings-err', 'rf-stps-err');
 
    let imageData = null;
    if (isEdit) {
      const existingRecipe = await Storage.getRecipeById(cleanId);
      imageData = existingRecipe ? existingRecipe.image || null : null;
    }
    // Usar la URL del servidor guardada por UI.previewImage(), nunca base64
    if (imgPreview && imgPreview.dataset && imgPreview.dataset.serverUrl) {
      imageData = imgPreview.dataset.serverUrl;
    }
 
    const data   = { title, description, category, ingredients, steps, image: imageData };
    const result = isEdit ? await Recipes.update(cleanId, data) : await Recipes.create(data);
 
    if (result.success) {
      UI.closeModal();
      UI.toast(isEdit ? '✅ Receta actualizada.' : '✅ ¡Receta publicada!', 'success');
      await navigate('detail', result.recipe.id);
    } else {
      if (result.errors) {
        if (result.errors.title)       UI.showError('rf-title-err', result.errors.title);
        if (result.errors.description) UI.showError('rf-desc-err',  result.errors.description);
        if (result.errors.ingredients) UI.showError('rf-ings-err',  result.errors.ingredients);
        if (result.errors.steps)       UI.showError('rf-stps-err',  result.errors.steps);
      } else {
        UI.toast(result.error || 'Error al guardar.', 'error');
      }
    }
  };
 
  const confirmDeleteRecipe = async (id) => {
    const numericId = parseInt(id, 10);
    UI.confirmDialog('¿Eliminar esta receta? Esta acción no se puede deshacer.', async () => {
      const result = await Recipes.remove(numericId);
      if (result.success) {
        UI.toast('🗑️ Receta eliminada.', 'info');
        await navigate('recipes');
      } else {
        UI.toast(result.error || 'Error al eliminar.', 'error');
      }
    });
  };
 
  const showDetail = (id) => navigate('detail', id);
 
  // RATING HANDLER
  const rateRecipe = async (recipeId, value) => {
    const result = await Recipes.rate(Number(recipeId), value);
    if (result.success) {
      const container = document.getElementById('rating-stars-' + recipeId);
      if (container) {
        container.querySelectorAll('.star-btn').forEach(function(btn, i) {
          if (i < value) { btn.classList.add('active'); } else { btn.classList.remove('active'); }
        });
      }
      UI.toast('⭐ Calificación: ' + value + '/5', 'success');
    } else {
      UI.toast(result.error, 'error');
    }
  };
 
  // COMMENT HANDLERS
  const submitComment = async (recipeId) => {
    const textarea = document.getElementById('comment-text-' + recipeId);
    if (!textarea) return;
    const text   = textarea.value;
    const result = await Comments.add(Number(recipeId), text);
    if (result.success) {
      textarea.value = '';
      const listEl = document.getElementById('comments-list-' + recipeId);
      if (listEl) listEl.innerHTML = await renderCommentsList(Number(recipeId));
      UI.toast('💬 Comentario publicado.', 'success');
    } else {
      UI.toast(result.error, 'error');
    }
  };
 
  const deleteComment = async (commentId) => {
    const result = await Comments.remove(Number(commentId));
    if (result.success) {
      if (currentRecipeId) {
        const listEl = document.getElementById('comments-list-' + currentRecipeId);
        if (listEl) listEl.innerHTML = await renderCommentsList(Number(currentRecipeId));
      } else if (currentPage === 'profile') {
        await navigate('profile');
      }
      UI.toast('🗑️ Comentario eliminado.', 'info');
    } else {
      UI.toast(result.error, 'error');
    }
  };
 
  // INIT
  const init = async () => {
    await Storage.seedIfEmpty();
    await navigate('home');
  };
 
  return {
    navigate, filterRecipes, switchTab,
    handleLogin, handleRegister, logout,
    handleSaveRecipe, confirmDeleteRecipe, showDetail,
    rateRecipe, submitComment, deleteComment,
    init
  };
})();
 
function navigateTo(page, param) { App.navigate(page, param); }
 
document.addEventListener('DOMContentLoaded', function() { App.init(); });