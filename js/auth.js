const Auth = (() => {
  const validate = {
    name: (v) => v?.trim().length >= 2 ? null : 'El nombre debe tener al menos 2 caracteres.',
    username: (v) => /^[a-z0-9_]{3,20}$/i.test(v) ? null : 'Usuario: 3-20 chars (letras, números, _).',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Email inválido.',
    password: (v) => v?.length >= 6 ? null : 'La contraseña debe tener al menos 6 caracteres.'
  };

  const register = async ({ name, username, email, password }) => {
    const errors = {};
    if (validate.name(name)) errors.name = validate.name(name);
    if (validate.username(username)) errors.username = validate.username(username);
    else {
      const existing = await Storage.getUserByUsername(username);
      if (existing) errors.username = 'Usuario ya existe.';
    }
    if (validate.email(email)) errors.email = validate.email(email);
    else {
      const existing = await Storage.getUserByEmail(email);
      if (existing) errors.email = 'Email ya registrado.';
    }
    if (validate.password(password)) errors.password = validate.password(password);
    if (Object.keys(errors).length) return { success: false, errors };

    try {
      const user = await Storage.createUser({ name, username, email, password });
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async ({ email, password }) => {
    if (!email || !password) return { success: false, error: 'Completa todos los campos.' };
    try {
      const API_BASE = window.APP_CONFIG?.apiUrl || '/api.php';
      const response = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });
      const result = await response.json();
      if (result.success) {
        Storage.setSession(result.user.id);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error || 'Error al iniciar sesión' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = () => Storage.clearSession();

  return { register, login, logout };
})();