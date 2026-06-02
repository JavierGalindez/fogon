const Recipes = (() => {
  const CATEGORIES = ['Todas', 'Sopas', 'Platos fuertes', 'Entradas', 'Postres', 'Bebidas', 'Panadería', 'Ensaladas', 'Salsas'];

  const search = async (query = '', category = 'Todas') => {
    let list = await Storage.getRecipes();
    if (category && category !== 'Todas') list = list.filter(r => r.category === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.ingredients || []).some(i => i.toLowerCase().includes(q))
      );
    }
    return list;
  };

  const create = async (data) => {
    const currentUser = await Storage.getCurrentUser();
    if (!currentUser) return { success: false, error: 'Debes iniciar sesión.' };
    const errors = validateRecipeData(data);
    if (Object.keys(errors).length) return { success: false, errors };
    try {
      const recipe = await Storage.createRecipe({ ...data, authorId: currentUser.id });
      return { success: true, recipe };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const update = async (id, data) => {
    const currentUser = await Storage.getCurrentUser();
    if (!currentUser) return { success: false, error: 'Debes iniciar sesión.' };
    const recipe = await Storage.getRecipeById(id);
    if (!recipe) return { success: false, error: 'Receta no encontrada.' };
    if (Number(recipe.author_id) !== Number(currentUser.id)) return { success: false, error: 'Solo puedes editar tus recetas.' };
    const errors = validateRecipeData(data);
    if (Object.keys(errors).length) return { success: false, errors };
    try {
      const updated = await Storage.updateRecipe(id, data);
      return { success: true, recipe: updated };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const remove = async (id) => {
    const numericId = parseInt(id, 10);
    if (!numericId || numericId <= 0) {
      return { success: false, error: 'ID de receta inválido.' };
    }

    const currentUser = await Storage.getCurrentUser();
    if (!currentUser) return { success: false, error: 'Debes iniciar sesión.' };

    const recipe = await Storage.getRecipeById(numericId);
    if (!recipe) return { success: false, error: 'Receta no encontrada.' };

    if (Number(recipe.author_id) !== Number(currentUser.id)) {
      return { success: false, error: 'Solo puedes eliminar tus propias recetas.' };
    }

    try {
      await Storage.deleteRecipe(numericId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const rate = async (recipeId, value) => {
    const currentUser = await Storage.getCurrentUser();
    if (!currentUser) return { success: false, error: 'Debes iniciar sesión.' };
    if (value < 1 || value > 5) return { success: false, error: 'Calificación inválida.' };
    try {
      await Storage.setRating({ recipeId, userId: currentUser.id, value });
      return { success: true, rating: await Storage.getAverageRating(recipeId) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const validateRecipeData = ({ title, description, ingredients, steps }) => {
    const errors = {};
    if (!title?.trim() || title.trim().length < 3) errors.title = 'El título debe tener al menos 3 caracteres.';
    if (!description?.trim() || description.trim().length < 10) errors.description = 'La descripción debe tener al menos 10 caracteres.';
    if ((ingredients || []).filter(i => i.trim()).length < 1) errors.ingredients = 'Agrega al menos un ingrediente.';
    if ((steps || []).filter(s => s.trim()).length < 1) errors.steps = 'Agrega al menos un paso.';
    return errors;
  };

  return { search, create, update, remove, rate, CATEGORIES };
})();