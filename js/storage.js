const Storage = (() => {

  // Detecta si estamos en local o en producción
  const isLocal = () => {
    var h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
  };

  const getBase = () => {
    if (window.APP_CONFIG && window.APP_CONFIG.apiUrl) {
      return window.APP_CONFIG.apiUrl;
    }
    return isLocal() ? '/Proyecto_Final/api.php' : '/api.php';
  };

  // ── Construye la URL usando query params en producción ──────
  // Local (con PATH_INFO):   /api.php/recipes/1
  // Producción (query params): /api.php?resource=recipes&id=1
  const buildUrl = (resource, id, queryParams) => {
    var BASE = getBase();
    id          = id          || null;
    queryParams = queryParams || null;

    if (isLocal()) {
      // En local mantenemos PATH_INFO (funciona con .htaccess)
      var url = BASE + '/' + resource;
      if (id) url += '/' + id;
      if (queryParams) {
        var qs = Object.keys(queryParams)
          .map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(queryParams[k]); })
          .join('&');
        url += '?' + qs;
      }
      return url;
    } else {
      // En producción (Render) usamos query params
      var params = { resource: resource };
      if (id) params.id = id;
      if (queryParams) {
        Object.keys(queryParams).forEach(function(k){ params[k] = queryParams[k]; });
      }
      var qs = Object.keys(params)
        .map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
        .join('&');
      return BASE + '?' + qs;
    }
  };

  // ── Petición genérica ────────────────────────────────────────
  const api = async (resource, method, data, id, queryParams) => {
    method      = method      || 'GET';
    data        = data        || null;
    id          = id          || null;
    queryParams = queryParams || null;

    var url = buildUrl(resource, id, queryParams);
    var options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);

    try {
      var response = await fetch(url, options);
      var text = await response.text();
      if (!text || text.trim() === '') {
        console.error('API returned empty response for:', url);
        return { success: false, error: 'Respuesta vacía del servidor' };
      }
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.error('JSON parse error for:', url, '| Body:', text.substring(0, 200));
        return { success: false, error: 'Respuesta inválida del servidor' };
      }
    } catch (error) {
      console.error('API Error:', error, 'URL:', url);
      return { success: false, error: 'Error de conexion' };
    }
  };

  // ── Auth para el endpoint especial /auth ─────────────────────
  const apiAuth = async (data) => {
    var BASE = getBase();
    var url  = isLocal() ? BASE + '/auth' : BASE + '?resource=auth';
    var options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
    try {
      var response = await fetch(url, options);
      var text = await response.text();
      if (!text || text.trim() === '') return { success: false, error: 'Respuesta vacía del servidor' };
      return JSON.parse(text);
    } catch (error) {
      console.error('Auth API Error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  // ── Upload especial (multipart) ───────────────────────────────
  const apiUpload = async (formData) => {
    var BASE = getBase();
    var url  = isLocal() ? BASE + '/upload' : BASE + '?resource=upload';
    try {
      var response = await fetch(url, { method: 'POST', body: formData });
      var text = await response.text();
      if (!text || text.trim() === '') return { success: false, error: 'Respuesta vacía' };
      return JSON.parse(text);
    } catch (error) {
      console.error('Upload Error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  // ── Sesión ────────────────────────────────────────────────────
  var getSession   = function() { var s = localStorage.getItem('fogon_session'); return s ? JSON.parse(s) : null; };
  var setSession   = function(userId) { localStorage.setItem('fogon_session', JSON.stringify({ userId: userId, loginAt: new Date().toISOString() })); };
  var clearSession = function() { localStorage.removeItem('fogon_session'); };
  var getCurrentUser = async function() { var session = getSession(); if (!session) return null; return await getUserById(session.userId); };

  var normalizeId = function(id) {
    if (id === null || id === undefined) return null;
    var num = Number(id);
    return isNaN(num) ? null : num;
  };

  // ── Usuarios ──────────────────────────────────────────────────
  var getUsers = async function() {
    var r = await api('users');
    return Array.isArray(r) ? r : [];
  };

  var getUserById = async function(id) {
    var nid = normalizeId(id);
    if (nid === null) return null;
    var r = await api('users', 'GET', null, nid);
    return (r && !r.error) ? r : null;
  };

  var getUserByEmail = async function(email) {
    var users = await getUsers();
    return users.find(function(u){ return u.email.toLowerCase() === email.toLowerCase(); }) || null;
  };

  var getUserByUsername = async function(username) {
    var users = await getUsers();
    return users.find(function(u){ return u.username === username; }) || null;
  };

  var createUser = async function(d) {
    var result = await api('users', 'POST', d);
    if (result && result.success) { setSession(result.user.id); return result.user; }
    throw new Error((result && result.error) || 'Error al crear usuario');
  };

  // ── Recetas ───────────────────────────────────────────────────
  var getRecipes = async function() {
    var r = await api('recipes');
    return Array.isArray(r) ? r : [];
  };

  var getRecipeById = async function(id) {
    var nid = normalizeId(id);
    if (nid === null) return null;
    var result = await api('recipes', 'GET', null, nid);
    if (Array.isArray(result)) return result.find(function(r){ return Number(r.id) === nid; }) || null;
    return (result && !result.error) ? result : null;
  };

  var createRecipe = async function(data) {
    var result = await api('recipes', 'POST', data);
    if (result && result.success) return result.recipe;
    throw new Error((result && result.error) || 'Error al crear receta');
  };

  var updateRecipe = async function(id, data) {
    var d = Object.assign({}, data, { id: id });
    var result = await api('recipes', 'PUT', d, id);
    if (result && result.success) return result.recipe;
    throw new Error((result && result.error) || 'Error al actualizar receta');
  };

  var deleteRecipe = async function(id) {
    var nid = normalizeId(id);
    if (nid === null) return false;
    var result = await api('recipes', 'DELETE', null, nid);
    return result && result.success;
  };

  // ── Comentarios ───────────────────────────────────────────────
  var getComments = async function() {
    var r = await api('comments');
    return Array.isArray(r) ? r : [];
  };

  var getCommentsByRecipe = async function(recipeId) {
    var nid = normalizeId(recipeId);
    if (nid === null) return [];
    var r = await api('comments', 'GET', null, null, { recipeId: nid });
    return Array.isArray(r) ? r : [];
  };

  var addComment = async function(d) {
    var nRid = normalizeId(d.recipeId), nAid = normalizeId(d.authorId);
    if (nRid === null || nAid === null) return { success: false, error: 'IDs invalidos' };
    var result = await api('comments', 'POST', { recipeId: nRid, authorId: nAid, text: d.text });
    return (result && result.success) ? result.comment : { success: false, error: (result && result.error) };
  };

  var deleteComment = async function(id) {
    var nid = normalizeId(id);
    if (nid === null) return false;
    var result = await api('comments', 'DELETE', null, nid);
    return result && result.success;
  };

  // ── Calificaciones ────────────────────────────────────────────
  var getRatings = async function() {
    var r = await api('ratings');
    return Array.isArray(r) ? r : [];
  };

  var getUserRating = async function(recipeId, userId) {
    var nr = normalizeId(recipeId), nu = normalizeId(userId);
    if (nr === null || nu === null) return null;
    var r = await api('ratings', 'GET', null, null, { recipeId: nr, userId: nu });
    return (r && !r.error) ? r : null;
  };

  var getAverageRating = async function(recipeId) {
    var nid = normalizeId(recipeId);
    if (nid === null) return { avg: 0, count: 0 };
    var all = await getRatings();
    var ratings = all.filter(function(rt){ return Number(rt.recipe_id) === nid; });
    if (!ratings.length) return { avg: 0, count: 0 };
    var avg = ratings.reduce(function(s, r){ return s + Number(r.value); }, 0) / ratings.length;
    return { avg: Math.round(avg * 10) / 10, count: ratings.length };
  };

  var setRating = async function(d) {
    var nr = normalizeId(d.recipeId), nu = normalizeId(d.userId);
    if (nr === null || nu === null) return { success: false, error: 'IDs invalidos' };
    return await api('ratings', 'POST', { recipeId: nr, userId: nu, value: d.value });
  };

  // ── Seed (solo local) ─────────────────────────────────────────
  var seedIfEmpty = async function() {
    if (isLocal()) {
      try {
        var users = await getUsers();
        if (users.length === 0) {
          await createUser({ name: 'Chef Demo', username: 'chefdemo', email: 'demo@fogon.com', password: 'demo123' });
        }
      } catch(e) { console.log('Seed error:', e); }
    }
  };

  // Exponer apiAuth y apiUpload para usarlos desde auth.js y ui.js
  return {
    getUsers, getUserById, getUserByEmail, getUserByUsername, createUser,
    getSession, setSession, clearSession, getCurrentUser,
    getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe,
    getComments, getCommentsByRecipe, addComment, deleteComment,
    getRatings, getUserRating, getAverageRating, setRating,
    seedIfEmpty,
    // helpers para otros módulos
    apiAuth, apiUpload
  };
})();