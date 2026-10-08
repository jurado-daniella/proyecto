-- =========================================================
--  Datos de prueba. Contraseña de TODOS los usuarios: Umg2026!
-- =========================================================
SET NAMES utf8mb4;
USE tutorias_umg;

INSERT INTO usuarios (id, username, name, email, password, role, avatar) VALUES
(1, 'admin', 'Coordinación Académica', 'admin@umg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'admin', NULL),
(2, 'cmorales', 'Ing. Carlos Morales', 'cmorales@umg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'tutor', 'assets/personajes/tutor-01.jpg'),
(3, 'aperez', 'Inga. Ana Lucía Pérez', 'aperez@umg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'tutor', 'assets/personajes/tutora-01.jpg'),
(4, 'jlopez', 'Ing. José López', 'jlopez@umg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'tutor', 'assets/personajes/tutor-02.jpg'),
(5, '5190-22-1001', 'María Fernanda García', 'mgarcia@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(6, '5190-22-1002', 'Diego Hernández', 'dhernandez@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(7, '5190-23-1003', 'Sofía Ramírez', 'sramirez@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(8, '5190-23-1004', 'Luis Castillo', 'lcastillo@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(9, 'mrodas', 'Licda. Marta Rodas', 'mrodas@umg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'tutor', 'assets/personajes/tutora-02.jpg');

-- Cursos de referencia (pensum Ingeniería en Sistemas UMG).
INSERT INTO cursos (code, name, cycle) VALUES
('090006', 'Precálculo', 2),
('090007', 'Álgebra Lineal', 2),
('090008', 'Algoritmos', 2),
('090010', 'Matemática Discreta', 2),
('090011', 'Física I', 3),
('090012', 'Programación I', 3),
('090013', 'Cálculo I', 3),
('090015', 'Derecho Informático', 3),
('090036', 'Desarrollo Web', 8),
('090037', 'Análisis de Sistemas II', 8),
('090038', 'Redes de Computadoras I', 8),
('090040', 'Arquitectura de Computadoras II', 8);

-- Rangos relativos a la fecha de importación para que siempre estén vigentes.
INSERT INTO tutorias (id, course_id, title, description, start_date, end_date, start_time, end_time, days, created_by) VALUES
(1, 6, 'Refuerzo de Programación I', 'Estructuras de control, funciones y arreglos.', CURDATE(), CURDATE() + INTERVAL 30 DAY, '08:00', '20:00', '1,2,3,4,5,6,7', 1),
(2, 7, 'Asesoría de Cálculo I', 'Límites, derivadas y aplicaciones.', CURDATE(), CURDATE() + INTERVAL 21 DAY, '13:00', '19:00', '1,2,3,4,5,6,7', 1),
(3, 9, 'Desarrollo Web: PHP y MySQL', 'CRUD, sesiones y consumo de APIs.', CURDATE(), CURDATE() + INTERVAL 30 DAY, '08:00', '21:00', '1,2,3,4,5,6,7', 1),
(4, 4, 'Matemática Discreta: lógica y conjuntos', 'Proposiciones, tablas de verdad y teoría de conjuntos.', CURDATE() + INTERVAL 1 DAY, CURDATE() + INTERVAL 15 DAY, '14:00', '18:00', '1,2,3,4,5', 1);

INSERT INTO tutoria_tutor (tutoria_id, tutor_id) VALUES
(1, 2), (1, 3), (2, 4), (2, 9), (3, 2), (3, 3), (4, 9), (4, 4);

-- Fechas relativas al día de importación para que siempre estén vigentes.
INSERT INTO bloques (id, tutoria_id, tutor_id, date, start_time, end_time, link, status) VALUES
(1, 1, 2, CURDATE() + INTERVAL 1 DAY, '14:00', '15:00', 'https://meet.google.com/abc-defg-hij', 'disponible'),
(2, 1, 2, CURDATE() + INTERVAL 1 DAY, '15:00', '16:30', 'https://meet.google.com/abc-defg-hij', 'disponible'),
(3, 1, 3, CURDATE() + INTERVAL 2 DAY, '09:00', '10:00', 'https://teams.microsoft.com/l/ejemplo', 'reservado'),
(4, 2, 4, CURDATE() + INTERVAL 2 DAY, '17:00', '18:00', 'https://zoom.us/j/1234567890', 'disponible'),
(5, 3, 2, CURDATE() + INTERVAL 3 DAY, '18:00', '19:30', 'https://meet.google.com/xyz-uvwx-rst', 'disponible'),
(6, 3, 3, CURDATE() + INTERVAL 4 DAY, '10:00', '11:00', 'https://teams.microsoft.com/l/ejemplo2', 'disponible');

INSERT INTO solicitudes (block_id, student_id, status) VALUES
(1, 5, 'pendiente'),
(1, 6, 'pendiente'),
(3, 7, 'aceptada'),
(5, 8, 'pendiente');
