const Storage = (() => {
  // Usa la base definida en index.php, o detecta automáticamente
  const BASE = (window.APP_CONFIG && window.APP_CONFIG.apiUrl)
    ? window.APP_CONFIG.apiUrl
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '/Proyecto_Final/api.php'
        : '/api.php');

  const api = async (endpoint, method, data) => {
    method = method || 'GET';
    data   = data   || null;
    const url     = BASE + '/' + endpoint;
    const options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    try {
      const response = await fetch(url, options);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Sesión
  const getSession   = () => { var s = localStorage.getItem('fogon_session'); return s ? JSON.parse(s) : null; };
  const setSession   = (userId) => { localStorage.setItem('fogon_session', JSON.stringify({ userId: userId, loginAt: new Date().toISOString() })); };
  const clearSession = () => localStorage.removeItem('fogon_session');
  const getCurrentUser = async () => { var session = getSession(); if (!session) return null; return await getUserById(session.userId); };

  const normalizeId = (id) => {
    if (id === null || id === undefined) return null;
    var num = Number(id);
    return isNaN(num) ? null : num;
  };

  // Usuarios
  const getUsers         = async () => (await api('users')) || [];
  const getUserById      = async (id) => { var nid = normalizeId(id); if (nid === null) return null; return await api('users/' + nid); };
  const getUserByEmail   = async (email)    => { var users = await getUsers(); return users.find(function(u){ return u.email.toLowerCase() === email.toLowerCase(); }) || null; };
  const getUserByUsername= async (username) => { var users = await getUsers(); return users.find(function(u){ return u.username === username; }) || null; };
  const createUser = async (d) => {
    var result = await api('users', 'POST', d);
    if (result.success) { setSession(result.user.id); return result.user; }
    throw new Error(result.error || 'Error al crear usuario');
  };

  // Recetas
  const getRecipes = async () => (await api('recipes')) || [];
  const getRecipeById = async (id) => {
    var nid = normalizeId(id);
    if (nid === null) return null;
    var result = await api('recipes/' + nid);
    if (Array.isArray(result)) return result.find(function(r){ return Number(r.id) === nid; }) || null;
    return result || null;
  };
  const createRecipe = async (data) => {
    var result = await api('recipes', 'POST', data);
    if (result && result.success) return result.recipe;
    throw new Error((result && result.error) || 'Error al crear receta');
  };
  const updateRecipe = async (id, data) => {
    var result = await api('recipes/' + id, 'PUT', Object.assign({}, data, { id: id }));
    if (result && result.success) return result.recipe;
    throw new Error((result && result.error) || 'Error al actualizar receta');
  };
  const deleteRecipe = async (id) => {
    var nid = normalizeId(id);
    if (nid === null) return false;
    var result = await api('recipes/' + nid, 'DELETE');
    return result.success;
  };

  // Comentarios
  const getComments          = async () => (await api('comments')) || [];
  const getCommentsByRecipe  = async (recipeId) => { var nid = normalizeId(recipeId); if (nid === null) return []; return (await api('comments?recipeId=' + nid)) || []; };
  const addComment = async (d) => {
    var nRid = normalizeId(d.recipeId), nAid = normalizeId(d.authorId);
    if (nRid === null || nAid === null) return { success: false, error: 'IDs inválidos' };
    var result = await api('comments', 'POST', { recipeId: nRid, authorId: nAid, text: d.text });
    return result.success ? result.comment : { success: false, error: result.error };
  };
  const deleteComment = async (id) => { var nid = normalizeId(id); if (nid === null) return false; var r = await api('comments/' + nid, 'DELETE'); return r.success; };

  // Calificaciones
  const getRatings     = async () => (await api('ratings')) || [];
  const getUserRating  = async (recipeId, userId) => {
    var nr = normalizeId(recipeId), nu = normalizeId(userId);
    if (nr === null || nu === null) return null;
    return await api('ratings?recipeId=' + nr + '&userId=' + nu);
  };
  const getAverageRating = async (recipeId) => {
    var nid = normalizeId(recipeId);
    if (nid === null) return { avg: 0, count: 0 };
    var ratings = (await getRatings()).filter(function(rt){ return Number(rt.recipe_id) === nid; });
    if (!ratings.length) return { avg: 0, count: 0 };
    var avg = ratings.reduce(function(s, r){ return s + Number(r.value); }, 0) / ratings.length;
    return { avg: Math.round(avg * 10) / 10, count: ratings.length };
  };
  const setRating = async (d) => {
    var nr = normalizeId(d.recipeId), nu = normalizeId(d.userId);
    if (nr === null || nu === null) return { success: false, error: 'IDs inválidos' };
    return await api('ratings', 'POST', { recipeId: nr, userId: nu, value: d.value });
  };

  // Seed solo en local
  const seedIfEmpty = async () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        var users = await getUsers();
        if (users.length === 0) await createUser({ name: 'Chef Demo', username: 'chefdemo', email: 'demo@fogon.com', password: 'demo123' });
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