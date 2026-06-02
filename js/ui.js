/**
 * ui.js — Componentes de interfaz reutilizables
 */
 
const UI = (() => {
 
  // ── Toast Notifications ───────────────────────────
  let toastTimeout;
  const toast = (message, type = 'info') => {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.className = `toast ${type} show`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { el.className = 'toast'; }, 3200);
  };
 
  // ── Modal ─────────────────────────────────────────
  const openModal = (html) => {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    container.innerHTML = html;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };
 
  const closeModal = () => {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    document.getElementById('modal-container').innerHTML = '';
    document.body.style.overflow = '';
  };
 
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
 
  // ── Stars Display ─────────────────────────────────
  const starsHTML = (avg, count = null) => {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span class="star ${i <= Math.round(avg) ? 'filled' : ''}">★</span>`;
    }
    const countHTML = count !== null ? `<span class="star-count">(${count})</span>` : '';
    return `<div class="star-display">${stars}${countHTML}</div>`;
  };
 
  // ── Recipe Card ───────────────────────────────────
  const recipeCard = (recipe) => {
    const imgHTML = recipe.image
      ? `<img class="recipe-card-img" src="${escapeHTML(recipe.image)}" alt="${escapeHTML(recipe.title)}" loading="lazy">`
      : `<div class="recipe-card-img-placeholder">${categoryIcon(recipe.category)}</div>`;
 
    return `
      <article class="recipe-card fade-up" onclick="App.showDetail(${parseInt(recipe.id, 10)})">
        ${imgHTML}
        <div class="recipe-card-body">
          <div class="recipe-card-meta">
            <span class="recipe-author">por ${escapeHTML(recipe.author ? recipe.author.name : 'Anónimo')}</span>
            ${starsHTML(recipe.average_rating || 0, recipe.rating_count || 0)}
          </div>
          <h3 class="recipe-card-title">${escapeHTML(recipe.title)}</h3>
          <p class="recipe-card-desc">${escapeHTML(recipe.description)}</p>
          <div class="recipe-card-footer">
            <span class="recipe-tag">${escapeHTML(recipe.category || 'Receta')}</span>
            <span class="comment-count">💬 ${recipe.comments_count || 0}</span>
          </div>
        </div>
      </article>`;
  };
 
  // ── Comment Item ──────────────────────────────────
  const commentItem = (comment, currentUserId) => {
    if (!comment) return '';
    const authorName = comment.name || 'Usuario';
    const initial = authorName.charAt(0).toUpperCase();
    const canDelete = currentUserId && comment.author_id == currentUserId;
 
    return `
      <div class="comment-item fade-up" id="comment-${comment.id}">
        <div class="comment-avatar">${initial}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-author">${escapeHTML(authorName)}</span>
            <span class="comment-date">${formatDate(comment.created_at || '')}</span>
            ${canDelete ? `<button class="comment-delete" onclick="App.deleteComment(${parseInt(comment.id, 10)})">✕ Eliminar</button>` : ''}
          </div>
          <p class="comment-text">${escapeHTML(comment.text || '')}</p>
        </div>
      </div>`;
  };
 
  // ── Login Modal ───────────────────────────────────
  const loginModal = () => {
    return `
      <div class="modal-header">
        <h3>Iniciar sesión</h3>
        <button class="modal-close" onclick="UI.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input id="login-email" type="email" class="form-input" placeholder="tu@email.com">
          <div id="login-email-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input id="login-pass" type="password" class="form-input" placeholder="••••••••">
          <div id="login-pass-err" class="form-error"></div>
        </div>
        <div id="login-general-err" class="form-error"></div>
        <div class="form-footer">
          <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="App.handleLogin()">Entrar</button>
        </div>
        <div class="form-divider">o</div>
        <div class="form-link-row">¿No tienes cuenta? <span class="form-link" onclick="UI.openRegisterModal()">Regístrate gratis</span></div>
      </div>`;
  };
 
  const openLoginModal = () => openModal(loginModal());
 
  // ── Register Modal ────────────────────────────────
  const registerModal = () => {
    return `
      <div class="modal-header">
        <h3>Crear cuenta</h3>
        <button class="modal-close" onclick="UI.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Nombre completo</label>
          <input id="reg-name" type="text" class="form-input" placeholder="Tu nombre">
          <div id="reg-name-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Nombre de usuario</label>
          <input id="reg-username" type="text" class="form-input" placeholder="chef_colombiano">
          <div id="reg-username-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input id="reg-email" type="email" class="form-input" placeholder="tu@email.com">
          <div id="reg-email-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <input id="reg-pass" type="password" class="form-input" placeholder="Mínimo 6 caracteres">
          <div id="reg-pass-err" class="form-error"></div>
        </div>
        <div id="reg-general-err" class="form-error"></div>
        <div class="form-footer">
          <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="App.handleRegister()">Crear cuenta</button>
        </div>
        <div class="form-divider">o</div>
        <div class="form-link-row">¿Ya tienes cuenta? <span class="form-link" onclick="UI.openLoginModal()">Inicia sesión</span></div>
      </div>`;
  };
 
  const openRegisterModal = () => openModal(registerModal());
 
  // ── Recipe Form Modal ─────────────────────────────
  const recipeFormModal = (recipe) => {
    const isEdit = !!(recipe && recipe.id);
    const modalTitle = isEdit ? 'Editar receta' : 'Nueva receta';
    const btnLabel  = isEdit ? '💾 Guardar cambios' : '✨ Publicar receta';
 
    const ings = (isEdit && recipe.ingredients && recipe.ingredients.length)
      ? recipe.ingredients : [''];
 
    const stps = (isEdit && recipe.steps && recipe.steps.length)
      ? recipe.steps : [''];
 
    const ingsHTML = ings.map(function(v, i) {
      return '<div class="ingredient-row" id="ing-row-' + i + '">'
        + '<input type="text" class="form-input ing-input" value="' + escapeHTML(v) + '" placeholder="Ej: 2 tazas de harina">'
        + '<button class="remove-row-btn" onclick="UI.removeRow(this)" title="Quitar">✕</button>'
        + '</div>';
    }).join('');
 
    const stpsHTML = stps.map(function(v, i) {
      return '<div class="ingredient-row" id="stp-row-' + i + '">'
        + '<input type="text" class="form-input stp-input" value="' + escapeHTML(v) + '" placeholder="Ej: Mezclar los ingredientes secos">'
        + '<button class="remove-row-btn" onclick="UI.removeRow(this)" title="Quitar">✕</button>'
        + '</div>';
    }).join('');
 
    const catOpts = Recipes.CATEGORIES.filter(function(c) { return c !== 'Todas'; })
      .map(function(c) {
        var sel = (isEdit && recipe.category === c) ? ' selected' : '';
        return '<option value="' + c + '"' + sel + '>' + c + '</option>';
      }).join('');
 
    var recipeIdValue = isEdit ? parseInt(recipe.id, 10) : 0;
    var imgSrc   = (isEdit && recipe.image) ? escapeHTML(recipe.image) : '';
    var imgShow  = (isEdit && recipe.image) ? ' show' : '';
    var titleVal = isEdit ? escapeHTML(recipe.title) : '';
    var descVal  = isEdit ? escapeHTML(recipe.description) : '';
 
    var html = '<div class="modal-header">'
      + '<h3>' + modalTitle + '</h3>'
      + '<button class="modal-close" onclick="UI.closeModal()">✕</button>'
      + '</div>'
      + '<div class="modal-body">'
      + '<div class="form-group">'
      + '<label class="form-label">Título *</label>'
      + '<input id="rf-title" type="text" class="form-input" value="' + titleVal + '" placeholder="Nombre de tu receta">'
      + '<div id="rf-title-err" class="form-error"></div>'
      + '</div>'
      + '<div class="form-group">'
      + '<label class="form-label">Categoría</label>'
      + '<select id="rf-category" class="form-input form-select">' + catOpts + '</select>'
      + '</div>'
      + '<div class="form-group">'
      + '<label class="form-label">Descripción *</label>'
      + '<textarea id="rf-desc" class="form-input form-textarea" placeholder="Describe tu receta…">' + descVal + '</textarea>'
      + '<div id="rf-desc-err" class="form-error"></div>'
      + '</div>'
      + '<div class="form-group">'
      + '<label class="form-label">Imagen</label>'
      + '<label class="file-input-label">'
      + '<span class="file-input-btn">📷 Elegir imagen</span>'
      + '<span class="file-input-name" id="rf-file-name">Sin archivo</span>'
      + '<input type="file" id="rf-image" accept="image/*" onchange="UI.previewImage(this)">'
      + '</label>'
      + '<img id="rf-img-preview" class="img-preview' + imgShow + '" src="' + imgSrc + '">'
      + '</div>'
      + '<div class="form-group">'
      + '<label class="form-label">Ingredientes *</label>'
      + '<div id="ings-list">' + ingsHTML + '</div>'
      + '<button class="add-row-btn" onclick="UI.addIngredientRow()">+ Agregar ingrediente</button>'
      + '<div id="rf-ings-err" class="form-error"></div>'
      + '</div>'
      + '<div class="form-group">'
      + '<label class="form-label">Pasos de preparación *</label>'
      + '<div id="stps-list">' + stpsHTML + '</div>'
      + '<button class="add-row-btn" onclick="UI.addStepRow()">+ Agregar paso</button>'
      + '<div id="rf-stps-err" class="form-error"></div>'
      + '</div>'
      + '<div class="form-footer">'
      + '<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>'
      + '<button class="btn btn-primary" onclick="App.handleSaveRecipe(' + recipeIdValue + ')">' + btnLabel + '</button>'
      + '</div>'
      + '</div>';
 
    return html;
  };
 
  const openRecipeForm = async (recipeId) => {
    let recipe = null;
    if (recipeId && recipeId !== 0) {
      recipe = await Storage.getRecipeById(recipeId);
      if (recipe) {
        if (typeof recipe.ingredients === 'string') {
          try { recipe.ingredients = JSON.parse(recipe.ingredients); } catch(e) { recipe.ingredients = []; }
        }
        if (typeof recipe.steps === 'string') {
          try { recipe.steps = JSON.parse(recipe.steps); } catch(e) { recipe.steps = []; }
        }
      }
    }
    openModal(recipeFormModal(recipe));
  };
 
  // ── Dynamic rows ──────────────────────────────────
  const addIngredientRow = () => {
    const list = document.getElementById('ings-list');
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    div.innerHTML = '<input type="text" class="form-input ing-input" placeholder="Ej: 1 taza de azúcar">'
      + '<button class="remove-row-btn" onclick="UI.removeRow(this)" title="Quitar">✕</button>';
    list.appendChild(div);
    div.querySelector('input').focus();
  };
 
  const addStepRow = () => {
    const list = document.getElementById('stps-list');
    const div = document.createElement('div');
    div.className = 'ingredient-row';
    div.innerHTML = '<input type="text" class="form-input stp-input" placeholder="Ej: Hornear por 30 min a 180°C">'
      + '<button class="remove-row-btn" onclick="UI.removeRow(this)" title="Quitar">✕</button>';
    list.appendChild(div);
    div.querySelector('input').focus();
  };
 
  const removeRow = (btn) => {
    const row = btn.closest('.ingredient-row');
    const parent = row.parentElement;
    if (parent.querySelectorAll('.ingredient-row').length > 1) {
      row.remove();
    } else {
      toast('Debe haber al menos uno.', 'error');
    }
  };
 
  // ── Image upload → servidor ───────────────────────
  const previewImage = async (input) => {
    const preview = document.getElementById('rf-img-preview');
    const nameEl  = document.getElementById('rf-file-name');
    if (!input.files || !input.files[0]) return;
 
    const file = input.files[0];
    nameEl.textContent = '⏳ Subiendo...';
 
    // Mostrar preview local inmediato mientras sube
    const reader = new FileReader();
    reader.onload = (e) => { preview.src = e.target.result; preview.classList.add('show'); };
    reader.readAsDataURL(file);
 
    // Subir al servidor
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/Proyecto_Final/api.php/upload', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        // Guardar la URL del servidor en el preview para que app.js la use
        preview.dataset.serverUrl = result.url;
        nameEl.textContent = '✅ ' + file.name;
      } else {
        nameEl.textContent = '❌ ' + (result.error || 'Error al subir');
        toast('Error al subir imagen: ' + (result.error || ''), 'error');
      }
    } catch(e) {
      nameEl.textContent = '❌ Error de conexión';
      toast('No se pudo subir la imagen.', 'error');
    }
  };
 
  // ── Confirm Modal ─────────────────────────────────
  const confirmDialog = (message, onConfirm) => {
    window._pendingConfirm = onConfirm;
    openModal(
      '<div class="modal-header">'
      + '<h3>Confirmar acción</h3>'
      + '<button class="modal-close" onclick="UI.closeModal()">✕</button>'
      + '</div>'
      + '<div class="confirm-body">'
      + '<p>' + message + '</p>'
      + '<div class="confirm-actions">'
      + '<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>'
      + '<button class="btn btn-danger" onclick="window._pendingConfirm(); UI.closeModal();">Confirmar</button>'
      + '</div></div>'
    );
  };
 
  // ── Nav Auth Area ─────────────────────────────────
  const renderNavAuth = async () => {
    try {
      const user = await Storage.getCurrentUser();
      const area = document.getElementById('nav-auth-area');
      if (!area) return;
 
      if (user && user.name) {
        const initial = user.name.charAt(0).toUpperCase();
        area.innerHTML = '<div class="nav-user-badge">'
          + '<div class="nav-avatar" title="' + escapeHTML(user.name) + '">' + initial + '</div>'
          + '<a href="#" onclick="navigateTo(\'profile\')" class="nav-user-name">' + escapeHTML(user.name) + '</a>'
          + '<button class="nav-btn-salir" onclick="App.logout()">Salir</button>'
          + '</div>';
      } else {
        area.innerHTML = '<button class="nav-btn outline" onclick="UI.openLoginModal()">Entrar</button>'
          + '<button class="nav-btn solid" onclick="UI.openRegisterModal()">Registrarse</button>';
      }
    } catch (error) {
      console.error('Error en renderNavAuth:', error);
      const area = document.getElementById('nav-auth-area');
      if (area) {
        area.innerHTML = '<button class="nav-btn outline" onclick="UI.openLoginModal()">Entrar</button>'
          + '<button class="nav-btn solid" onclick="UI.openRegisterModal()">Registrarse</button>';
      }
    }
  };
 
  // ── Helpers ───────────────────────────────────────
  const escapeHTML = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
 
  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch(e) { return ''; }
  };
 
  const categoryIcon = (cat) => {
    const icons = {
      'Sopas': '🍲', 'Platos fuertes': '🍽️', 'Entradas': '🥗',
      'Postres': '🍮', 'Bebidas': '🥤', 'Panadería': '🍞',
      'Ensaladas': '🥬', 'Salsas': '🫙'
    };
    return icons[cat] || '🍳';
  };
 
  const showError = (id, msg) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add('show'); }
  };
 
  const clearErrors = (...ids) => {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.remove('show'); }
    });
  };
 
  return {
    toast, openModal, closeModal,
    starsHTML, recipeCard, commentItem,
    openLoginModal, openRegisterModal, openRecipeForm,
    addIngredientRow, addStepRow, removeRow, previewImage,
    confirmDialog, renderNavAuth,
    escapeHTML, formatDate, categoryIcon,
    showError, clearErrors
  };
})();
 
window.UI = UI;