const Storage = (() => {

  const getBase = () => {
    if (window.APP_CONFIG && window.APP_CONFIG.apiUrl) {
      return window.APP_CONFIG.apiUrl;
    }
    var h = window.location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') {
      return '/Proyecto_Final/api.php';
    }
    return '/api.php';
  };

  const api = async (endpoint, method, data) => {
    method = method || 'GET';
    data   = data   || null;
    var BASE = getBase();
    var url  = BASE + '/' + endpoint;
    var options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    try {
      var response = await fetch(url, options);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: 'Error de conexion' };
    }
  };

  var getSession   = function() { var s = localStorage.getItem('fogon_session'); return s ? JSON.parse(s) : null; };
  var setSession   = function(userId) { localStorage.setItem('fogon_session', JSON.stringify({ userId: userId, loginAt: new Date().toISOString() })); };
  var clearSession = function() { localStorage.removeItem('fogon_session'); };
  var getCurrentUser = async function() { var session = getSession(); if (!session) return null; return await getUserById(session.userId); };

  var normalizeId = function(id) {
    if (id === null || id === undefined) return null;
    var num = Number(id);
    return isNaN(num) ? null : num;
  };

  var getUsers          = async function() { var r = await api('users'); return Array.isArray(r) ? r : []; };
  var getUserById       = async function(id) { var nid = normalizeId(id); if (nid === null) return null; return await api('users/' + nid); };
  var getUserByEmail    = async function(email) { var users = await getUsers(); return users.find(function(u){ return u.email.toLowerCase() === email.toLowerCase(); }) || null; };
  var getUserByUsername = async function(username) { var users = await getUsers(); return users.find(function(u){ return u.username === username; }) || null; };
  var createUser = async function(d) {
    var result = await api('users', 'POST', d);
    if (result && result.success) { setSession(result.user.id); return result.user; }
    throw new Error((result && result.error) || 'Error al crear usuario');
  };

  var getRecipes = async function() { var r = await api('recipes'); return Array.isArray(r) ? r : []; };
  var getRecipeById = async function(id) {
    var nid = normalizeId(id);
    if (nid === null) return null;
    var result = await api('recipes/' + nid);
    if (Array.isArray(result)) return result.find(function(r){ return Number(r.id) === nid; }) || null;
    return result || null;
  };
  var createRecipe = async function(data) {
    var result = await api('recipes', 'POST', data);
    if (result && result.success) return result.recipe;
    throw new Error((result && result.error) || 'Error al crear receta');
  };
  var updateRecipe = async function(id, data) {
    var d = Object.assign({}, data, { id: id });
    var result = await api('recipes/' + id, 'PUT', d);
    if (result && result.success) return result.recipe;
    throw new Error((result && result.error) || 'Error al actualizar receta');
  };
  var deleteRecipe = async function(id) {
    var nid = normalizeId(id);
    if (nid === null) return false;
    var result = await api('recipes/' + nid, 'DELETE');
    return result && result.success;
  };

  var getComments         = async function() { var r = await api('comments'); return Array.isArray(r) ? r : []; };
  var getCommentsByRecipe = async function(recipeId) {
    var nid = normalizeId(recipeId);
    if (nid === null) return [];
    var r = await api('comments?recipeId=' + nid);
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
    var result = await api('comments/' + nid, 'DELETE');
    return result && result.success;
  };

  var getRatings = async function() { var r = await api('ratings'); return Array.isArray(r) ? r : []; };
  var getUserRating = async function(recipeId, userId) {
    var nr = normalizeId(recipeId), nu = normalizeId(userId);
    if (nr === null || nu === null) return null;
    return await api('ratings?recipeId=' + nr + '&userId=' + nu);
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

  var seedIfEmpty = async function() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        var users = await getUsers();
        if (users.length === 0) {
          await createUser({ name: 'Chef Demo', username: 'chefdemo', email: 'demo@fogon.com', password: 'demo123' });
        }
      } catch(e) { console.log('Seed error:', e); }
    }
  };

  return {
    getUsers, getUserById, getUserByEmail, getUserByUsername, createUser,
    getSession, setSession, clearSession, getCurrentUser,
    getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe,
    getComments, getCommentsByRecipe, addComment, deleteComment,
    getRatings, getUserRating, getAverageRating, setRating,
    seedIfEmpty
  };
})();