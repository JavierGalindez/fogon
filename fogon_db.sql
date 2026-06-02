-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de recetas
CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    ingredients JSON NOT NULL,
    steps JSON NOT NULL,
    image VARCHAR(500),
    author_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de comentarios
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    author_id INT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de calificaciones
CREATE TABLE IF NOT EXISTS ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    user_id INT NOT NULL,
    value TINYINT NOT NULL CHECK (value BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY (recipe_id, user_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Datos iniciales: Usuarios
INSERT IGNORE INTO users (name, username, email, password) VALUES
('Chef Demo', 'chefdemo', 'demo@fogon.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Ana María', 'ana_maria', 'ana@fogon.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Carlos Gómez', 'carlosg', 'carlos@fogon.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Luisa Fernández', 'luisa_f', 'luisa@fogon.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Datos iniciales: Recetas (15 recetas colombianas)
INSERT IGNORE INTO recipes (title, description, category, ingredients, steps, image, author_id) VALUES
-- Bandeja Paisa
('Bandeja Paisa', 'Plato típico de Antioquia que incluye arroz, frijoles, carne molida, chicharrón, huevo, plátano y arepa.', 'Platos fuertes', '["1 taza de arroz", "1 taza de frijoles", "200g de carne molida", "100g de chicharrón", "2 huevos", "1 plátano maduro", "2 arepas", "1 aguacate"]', '["Cocinar el arroz con sal", "Preparar los frijoles con tocino", "Freír el chicharrón hasta que esté dorado", "Freír los huevos", "Freír el plátano en rodajas", "Calentar las arepas", "Servir todo en una bandeja grande"]', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', 1),

-- Ajiaco Santafereño
('Ajiaco Santafereño', 'Sopa tradicional de Bogotá hecha con tres tipos de papa, pollo, mazorca y guascas.', 'Sopas', '["500g de pechuga de pollo", "3 tipos de papa (sabanera, pastusa, criolla)", "1 mazorca de maíz", "1/2 taza de guascas", "1 cebolla", "2 dientes de ajo", "1 ramita de cilantro", "Crema de leche y alcaparras para servir"]', '["Cocinar el pollo con cebolla, ajo y sal", "Agregar las papas y la mazorca", "Añadir las guascas al final", "Servir con crema de leche, alcaparras y aguacate"]', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500', 1),

-- Sancocho
('Sancocho', 'Sopa espesa típica de la región costera colombiana, hecha con carne de res, pollo, yuca y plátano.', 'Sopas', '["300g de carne de res", "300g de pollo", "2 yucas", "2 plátanos verdes", "1 mazorca de maíz", "1 cebolla", "2 dientes de ajo", "1 pimentón", "Cilantro al gusto"]', '["Cocinar las carnes con cebolla, ajo y sal", "Agregar yuca, plátano y mazorca", "Cocinar hasta que las verduras estén tiernas", "Servir caliente"]', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500', 2),

-- Lechona Tolimense
('Lechona Tolimense', 'Plato típico del Tolima, consistente en un cerdo relleno de arroz, carne de cerdo y especias.', 'Platos fuertes', '["1 cerdo pequeño (10-12 kg)", "2 tazas de arroz", "500g de carne de cerdo picada", "1 cebolla", "2 dientes de ajo", "1 pimentón", "1 cucharadita de comino", "1 cucharadita de pimienta", "Sal al gusto"]', '["Preparar el adobo con especias", "Rellenar el cerdo con arroz y carne", "Cocinar en horno a baja temperatura por varias horas", "Servir en porciones"]', 'https://images.unsplash.com/photo-1544025162-d76978e8e5e5?w=500', 2),

-- Arepas
('Arepas', 'Pan de maíz típico de Colombia, se puede comer solo o relleno.', 'Panadería', '["2 tazas de harina de maíz precocida", "2 tazas de agua tibia", "1 cucharadita de sal", "1 cucharada de mantequilla", "Queso, huevo o carne para rellenar (opcional)"]', '["Mezclar harina, agua y sal hasta obtener una masa suave", "Formar bolitas y aplanarlas", "Cocinar en sartén con mantequilla hasta dorar", "Rellenar si se desea"]', 'https://images.unsplash.com/photo-1578241691580-cee540053599?w=500', 3),

-- Buñuelos
('Buñuelos', 'Bolitas de masa de maíz fritas, típicas de la Navidad colombiana.', 'Postres', '["2 tazas de harina de maíz", "1 taza de queso costeño rallado", "1 huevo", "1/2 taza de leche", "1 cucharadita de sal", "Aceite para freír"]', '["Mezclar todos los ingredientes hasta obtener una masa", "Formar bolitas pequeñas", "Freír en aceite caliente hasta que estén doradas", "Escurrir y servir"]', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', 3),

-- Natilla
('Natilla', 'Postre tradicional navideño hecho con leche, panela y canela.', 'Postres', '["4 tazas de leche", "1 taza de panela rallada", "1 ramita de canela", "4 yemas de huevo", "1 cucharadita de vainilla"]', '["Disolver la panela en la leche con canela", "Agregar las yemas batidas", "Cocinar a fuego lento hasta que espese", "Dejar enfriar y servir frío"]', 'https://images.unsplash.com/photo-1571197119297-4c9c3d6e8f8e?w=500', 1),

-- Empanadas
('Empanadas', 'Masa de maíz rellena de carne, típicas de Colombia.', 'Entradas', '["2 tazas de harina de maíz", "1 taza de agua", "1 cucharadita de sal", "200g de carne molida", "1 cebolla picada", "1 diente de ajo", "1 pimentón picado", "Aceite para freír"]', '["Preparar la masa con harina, agua y sal", "Preparar el relleno con carne, cebolla, ajo y pimentón", "Formar las empanadas y freír", "Servir calientes"]', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', 2),

-- Changua
('Changua', 'Sopa tradicional de la región de Boyacá, hecha con leche, huevo y pan.', 'Sopas', '["4 tazas de leche", "2 huevos", "2 rebanadas de pan", "1 cebolla en rodajas", "1 diente de ajo", "Sal y pimienta al gusto", "Cilantro picado"]', '["Hervir la leche con cebolla y ajo", "Agregar el pan y los huevos crudos", "Cocinar hasta que los huevos estén cuajados", "Servir con cilantro"]', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500', 3),

-- Tamal
('Tamal', 'Masa de maíz rellena de carne, pollo, huevo y verduras, envuelta en hoja de plátano.', 'Platos fuertes', '["4 tazas de harina de maíz", "2 tazas de caldo de pollo", "200g de carne de cerdo", "200g de pollo", "2 huevos duros", "1 zanahoria", "1 arveja", "Hojas de plátano para envolver"]', '["Preparar la masa con harina y caldo", "Preparar el relleno con carne, pollo y verduras", "Envolver en hojas de plátano y cocinar al vapor", "Servir caliente"]', 'https://images.unsplash.com/photo-1544025162-d76978e8e5e5?w=500', 1),

-- Cuchuco de Trigo
('Cuchuco de Trigo', 'Sopa de trigo con espinacas, típica de Boyacá.', 'Sopas', '["2 tazas de trigo partido", "200g de espinacas", "1 cebolla", "2 dientes de ajo", "1 pimentón", "1 tomate", "1 papa", "Sal al gusto"]', '["Cocinar el trigo hasta que esté tierno", "Agregar cebolla, ajo, pimentón y tomate", "Añadir espinacas y papa", "Cocinar hasta que todo esté listo"]', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', 2),

-- Pandebono
('Pandebono', 'Pan de queso y yuca típico de Valle del Cauca.', 'Panadería', '["2 tazas de harina de yuca (almidón)", "1 taza de queso costeño rallado", "2 huevos", "1/2 taza de leche", "1 cucharadita de sal"]', '["Mezclar todos los ingredientes hasta obtener una masa", "Formar bolitas y aplanarlas ligeramente", "Hornear a 180°C hasta que estén dorados", "Servir calientes"]', 'https://images.unsplash.com/photo-1578241691580-cee540053599?w=500', 3),

-- Lulada
('Lulada', 'Bebida típica del Valle del Cauca hecha con lulo, agua y azúcar.', 'Bebidas', '["4 lulos maduros", "4 tazas de agua", "Azúcar al gusto", "Hielo al servir"]', '["Pelar y licuar los lulos con agua", "Colar y endulzar al gusto", "Servir con hielo"]', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500', 1),

-- Champús
('Champús', 'Bebida típica del Valle del Cauca hecha con maíz, piña, lulo y canela.', 'Bebidas', '["2 tazas de maíz", "1 piña madura", "2 lulos", "1 ramita de canela", "Azúcar al gusto", "Hielo"]', '["Cocinar el maíz hasta que esté tierno", "Licuar con piña, lulo y canela", "Endulzar y servir con hielo"]', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500', 2),

-- Obleas con Arequipe
('Obleas con Arequipe', 'Postre típico de Colombia, obleas rellenas de arequipe.', 'Postres', '["1 paquete de obleas", "1 taza de arequipe", "1 taza de queso rallado (opcional)"]', '["Untar arequipe entre dos obleas", "Espolvorear queso si se desea", "Servir"]', 'https://images.unsplash.com/photo-1571197119297-4c9c3d6e8f8e?w=500', 3),

-- Sopa de Mondongo
('Sopa de Mondongo', 'Sopa hecha con callos de res, típica de varias regiones de Colombia.', 'Sopas', '["500g de mondongo (callos) limpio", "1 cebolla", "2 dientes de ajo", "1 pimentón", "1 tomate", "1 yuca", "1 plátano verde", "Cilantro al gusto"]', '["Cocinar el mondongo hasta que esté tierno", "Agregar cebolla, ajo, pimentón y tomate", "Añadir yuca y plátano", "Cocinar hasta que todo esté listo"]', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500', 1);

-- Comentarios de ejemplo
INSERT IGNORE INTO comments (recipe_id, author_id, text) VALUES
(1, 2, '¡Deliciosa bandeja paisa! Me encanta cómo queda todo junto.'),
(1, 3, 'El secreto está en el chicharrón bien dorado.'),
(2, 1, 'El ajiaco es mi sopa favorita, especialmente en días fríos.'),
(3, 3, 'La sancocho de mi abuela es la mejor, esta receta me la recordó.'),
(4, 2, 'Nunca había probado la lechona, pero después de esta receta, ¡me enamoré!'),
(5, 1, 'Las arepas son mi desayuno favorito, las como todos los días.'),
(6, 2, 'Los buñuelos son infaltables en Navidad, ¡gracias por la receta!'),
(7, 3, 'La natilla de mi mamá es la mejor, pero esta receta le hace competencia.'),
(8, 1, 'Las empanadas colombianas son únicas, ¡no hay otras iguales!'),
(9, 2, 'La changua es una sopa muy reconfortante, ideal para el desayuno.');

-- Calificaciones de ejemplo
INSERT IGNORE INTO ratings (recipe_id, user_id, value) VALUES
(1, 2, 5), (1, 3, 4), (2, 1, 5), (2, 3, 5), (3, 2, 4), (3, 1, 5),
(4, 3, 5), (4, 2, 4), (5, 1, 5), (5, 3, 5), (6, 2, 4), (6, 1, 5),
(7, 3, 5), (7, 2, 5), (8, 1, 4), (8, 3, 5);