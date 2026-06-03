const Storage = (() => {
  const API_BASE = '/Proyecto_Final/api.php';

  const api = async (endpoint, method = 'GET', data = null) => {
    const url = `${API_BASE}/${endpoint}`;
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);

    try {
      const response = await fetch(url, options);

      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Respuesta NO es JSON. URL:', url, '| Contenido:', text.substring(0, 200));
        return { success: false, error: `El servidor devolvió: ${text.substring(0, 100)}...` };
      }

      const json = await response.json();
      return json;
    } catch (error) {
      console.error('❌ Error de red en API:', error);
      return { success: false, error: 'No se pudo conectar al servidor.' };
    }
  };

  // Sesión (localStorage para mantener compatibilidad)
  const getSession = () => {
    const session = localStorage.getItem('fogon_session');
    return session ? JSON.parse(session) : null;
  };
  const setSession = (userId) => {
    localStorage.setItem('fogon_session', JSON.stringify({ userId, loginAt: new Date().toISOString() }));
  };
  const clearSession = () => localStorage.removeItem('fogon_session');
  const getCurrentUser = async () => {
    const session = getSession();
    if (!session) return null;
    return await getUserById(session.userId);
  };

  // Helper para normalizar IDs a números
  const normalizeId = (id) => {
    if (id === null || id === undefined) return null;
    const num = Number(id);
    return isNaN(num) ? null : num;
  };

  // Usuarios
  const getUsers = async () => (await api('users')) || [];
  const getUserById = async (id) => {
    const normalizedId = normalizeId(id);
    if (normalizedId === null) return null;
    return await api(`users/${normalizedId}`);
  };
  const getUserByEmail = async (email) => {
    const users = await getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  };
  const getUserByUsername = async (username) => {
    const users = await getUsers();
    return users.find(u => u.username === username) || null;
  };
  const createUser = async ({ name, username, email, password }) => {
    const result = await api('users', 'POST', { name, username, email, password });
    if (result.success) { setSession(result.user.id); return result.user; }
    throw new Error(result.error || 'Error al crear usuario');
  };

  // Recetas
  const getRecipes = async () => (await api('recipes')) || [];

  const getRecipeById = async (id) => {
    const normalizedId = normalizeId(id);
    if (normalizedId === null) {
      console.error('ID inválido en getRecipeById:', id);
      return null;
    }

    const result = await api(`recipes/${normalizedId}`);

    // Si el backend devuelve un array (error), buscar la receta con el ID correcto
    if (Array.isArray(result)) {
      console.warn('El backend devolvió un array en lugar de un objeto. Buscando receta con ID:', normalizedId);
      return result.find(r => Number(r.id) === normalizedId) || null;
    }

    return result || null;
  };

  const createRecipe = async (data) => {
    const result = await api('recipes', 'POST', data);
    if (result && result.success) return result.recipe;
    throw new Error(result?.error || 'Error al crear receta');
  };

  const updateRecipe = async (id, data) => {
    const result = await api(`recipes/${id}`, 'PUT', { ...data, id });
    if (result && result.success) return result.recipe;
    throw new Error(result?.error || 'Error al actualizar receta');
  };
  const deleteRecipe = async (id) => {
    const normalizedId = normalizeId(id);
    if (normalizedId === null) {
      return false;
    }
    const result = await api(`recipes/${normalizedId}`, 'DELETE');
    return result.success;
  };

  // Comentarios
  const getComments = async () => (await api('comments')) || [];
  const getCommentsByRecipe = async (recipeId) => {
    const normalizedId = normalizeId(recipeId);
    if (normalizedId === null) return [];
    return (await api(`comments?recipeId=${normalizedId}`)) || [];
  };
  const addComment = async ({ recipeId, authorId, text }) => {
    const normalizedRecipeId = normalizeId(recipeId);
    const normalizedAuthorId = normalizeId(authorId);
    if (normalizedRecipeId === null || normalizedAuthorId === null) {
      return { success: false, error: 'IDs inválidos' };
    }
    const result = await api('comments', 'POST', { recipeId: normalizedRecipeId, authorId: normalizedAuthorId, text });
    return result.success ? result.comment : { success: false, error: result.error };
  };
  const deleteComment = async (id) => {
    const normalizedId = normalizeId(id);
    if (normalizedId === null) return false;
    const result = await api(`comments/${normalizedId}`, 'DELETE');
    return result.success;
  };

  // Calificaciones
  const getRatings = async () => (await api('ratings')) || [];
  const getUserRating = async (recipeId, userId) => {
    const normalizedRecipeId = normalizeId(recipeId);
    const normalizedUserId = normalizeId(userId);
    if (normalizedRecipeId === null || normalizedUserId === null) return null;
    return await api(`ratings?recipeId=${normalizedRecipeId}&userId=${normalizedUserId}`);
  };
  const getAverageRating = async (recipeId) => {
    const normalizedId = normalizeId(recipeId);
    if (normalizedId === null) return { avg: 0, count: 0 };
    const ratings = await getRatings().then(r => r.filter(rt => Number(rt.recipe_id) === normalizedId));
    if (!ratings.length) return { avg: 0, count: 0 };
    const avg = ratings.reduce((s, r) => s + Number(r.value), 0) / ratings.length;
    return { avg: Math.round(avg * 10) / 10, count: ratings.length };
  };
  const setRating = async ({ recipeId, userId, value }) => {
    const normalizedRecipeId = normalizeId(recipeId);
    const normalizedUserId = normalizeId(userId);
    if (normalizedRecipeId === null || normalizedUserId === null) {
      return { success: false, error: 'IDs inválidos' };
    }
    return await api('ratings', 'POST', { recipeId: normalizedRecipeId, userId: normalizedUserId, value });
  };

  // Seed para desarrollo local
  const seedIfEmpty = async () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const users = await getUsers();
        if (users.length === 0) {
          await createUser({ name: 'Chef Demo', username: 'chefdemo', email: 'demo@fogon.com', password: 'demo123' });
        }
      } catch (e) { console.log('Seed error:', e); }
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