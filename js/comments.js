const Comments = (() => {
  const add = async (recipeId, text) => {
    const currentUser = await Storage.getCurrentUser();
    if (!currentUser) return { success: false, error: 'Debes iniciar sesión.' };
    if (!text?.trim() || text.trim().length < 2) return { success: false, error: 'El comentario es muy corto.' };
    if (text.trim().length > 500) return { success: false, error: 'Máximo 500 caracteres.' };
    try {
      const comment = await Storage.addComment({ recipeId, authorId: currentUser.id, text: text.trim() });
      return { success: true, comment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const remove = async (commentId) => {
    const currentUser = await Storage.getCurrentUser();
    if (!currentUser) return { success: false, error: 'Debes iniciar sesión.' };
    const comments = await Storage.getComments();
    const comment = comments.find(c => c.id == commentId);
    if (!comment) return { success: false, error: 'Comentario no encontrado.' };
    if (comment.author_id != currentUser.id) return { success: false, error: 'Solo puedes eliminar tus comentarios.' };
    try {
      await Storage.deleteComment(commentId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return { add, remove };
})();