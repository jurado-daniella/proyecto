-- =========================================================
--  DAM · Sistema de Tutorías y Asesorías Académicas - UMG
--  Script ÚNICO: estructura + datos de prueba (MySQL 8 / MariaDB 10.4+)
--  Reemplaza a database.sql, datos-prueba.sql y las migraciones.
--  Contraseña de TODOS los usuarios de prueba: Umg2026!
-- =========================================================

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS tutorias_umg;
CREATE DATABASE tutorias_umg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tutorias_umg;

-- Usuarios del sistema. El rol define los permisos (admin, tutor, estudiante).
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,      -- carné para estudiantes
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,            -- password_hash()
    role ENUM('admin', 'tutor', 'estudiante') NOT NULL,
    status TINYINT(1) NOT NULL DEFAULT 1,      -- 1 activo, 0 inactivo
    avatar VARCHAR(120) NULL,                  -- ruta de la foto de perfil
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuarios_role (role)
);

-- Catálogo de referencia tomado del pensum de Ingeniería en Sistemas UMG.
CREATE TABLE cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    cycle TINYINT NOT NULL
);

-- Tutoría creada por el administrador para un curso, con el rango
-- (período, franja horaria y días) dentro del cual los catedráticos publican bloques.
CREATE TABLE tutorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days SET('1','2','3','4','5','6','7') NOT NULL DEFAULT '1,2,3,4,5',   -- 1 = lunes ... 7 = domingo
    status TINYINT(1) NOT NULL DEFAULT 1,
    created_by INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date >= start_date),
    CHECK (end_time > start_time),
    FOREIGN KEY (course_id) REFERENCES cursos(id),
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Catedráticos asignados a cada tutoría.
CREATE TABLE tutoria_tutor (
    tutoria_id INT NOT NULL,
    tutor_id INT NOT NULL,
    PRIMARY KEY (tutoria_id, tutor_id),
    FOREIGN KEY (tutoria_id) REFERENCES tutorias(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES usuarios(id)
);

-- Bloques de disponibilidad. La FK compuesta garantiza que el tutor
-- esté asignado a la tutoría para la que publica el bloque.
CREATE TABLE bloques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tutoria_id INT NOT NULL,
    tutor_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    link VARCHAR(255) NOT NULL,
    status ENUM('disponible', 'reservado', 'cancelado') NOT NULL DEFAULT 'disponible',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time),
    FOREIGN KEY (tutoria_id, tutor_id) REFERENCES tutoria_tutor(tutoria_id, tutor_id),
    INDEX idx_bloques_tutor_fecha (tutor_id, date),
    INDEX idx_bloques_status (status)
);

-- Solicitudes de los estudiantes. Un estudiante solo puede aplicar una vez
-- a cada bloque (si cancela y vuelve a aplicar se reactiva la misma fila).
CREATE TABLE solicitudes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    block_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('pendiente', 'aceptada', 'rechazada', 'cancelada', 'atendida') NOT NULL DEFAULT 'pendiente',
    notes TEXT NULL,                           -- registro de la atención
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_solicitud (block_id, student_id),
    FOREIGN KEY (block_id) REFERENCES bloques(id),
    FOREIGN KEY (student_id) REFERENCES usuarios(id),
    INDEX idx_solicitudes_status (status)
);

-- Solicitudes de recuperación de contraseña que atiende el administrador.
CREATE TABLE recuperaciones_admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    estado ENUM('pendiente', 'resuelta') NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    resolved_by INT NULL,
    FOREIGN KEY (user_id) REFERENCES usuarios(id),
    FOREIGN KEY (resolved_by) REFERENCES usuarios(id)
);

-- Bitácora de auditoría: quién hizo qué, sobre qué registro y con qué resultado.
CREATE TABLE bitacora (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    usuario_nombre VARCHAR(120) NULL,
    recurso VARCHAR(60) NOT NULL,
    accion VARCHAR(60) NOT NULL,
    metodo VARCHAR(10) NOT NULL,
    registro_id INT NULL,
    resultado ENUM('correcto', 'rechazado') NOT NULL,
    http_status SMALLINT NOT NULL,
    solicitud_id CHAR(32) NULL,
    ip_origen VARCHAR(45) NULL,
    detalle TEXT NULL,
    cambios LONGTEXT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_bitacora_fecha (fecha),
    INDEX idx_bitacora_usuario (usuario_id)
);

-- =========================================================
--  DATOS DE PRUEBA
-- =========================================================
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

-- ---------------------------------------------------------
--  DATOS ADICIONALES (ciclo en curso, con historial)
-- ---------------------------------------------------------
INSERT INTO usuarios (id, username, name, email, password, role, avatar) VALUES
(10, 'rgonzalez', 'Ing. Roberto González', 'rgonzalez@umg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'tutor', NULL),
(11, 'lcifuentes', 'Licda. Lucía Cifuentes', 'lcifuentes@umg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'tutor', NULL),
(12, 'emendez', 'Ing. Estuardo Méndez', 'emendez@umg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'tutor', NULL),
(13, '5190-22-1005', 'Andrea Morales', 'amorales@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(14, '5190-23-1006', 'Kevin Ajú', 'kaju@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(15, '5190-24-1007', 'Gabriela Reyes', 'greyes@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(16, '5190-25-1008', 'José Pablo Xicará', 'jxicara@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(17, '5190-22-1009', 'Daniela Juárez', 'djuarez@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(18, '5190-23-1010', 'Fernando Batz', 'fbatz@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(19, '5190-24-1011', 'Valeria Ortiz', 'vortiz@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(20, '5190-25-1012', 'Carlos Chávez', 'cchavez@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(21, '5190-22-1013', 'Mónica Pérez', 'mperez@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(22, '5190-23-1014', 'Javier Sican', 'jsican@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(23, '5190-24-1015', 'Alejandra López', 'alopez@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(24, '5190-25-1016', 'Bryan Monterroso', 'bmonterroso@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(25, '5190-22-1017', 'Paola Gómez', 'pgomez@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(26, '5190-23-1018', 'Rodrigo Tzul', 'rtzul@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(27, '5190-24-1019', 'Ximena Herrera', 'xherrera@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL),
(28, '5190-25-1020', 'Wilson Coyoy', 'wcoyoy@miumg.edu.gt', '$2y$10$FWENiP15OYPzgJ.Opvq8aeVusXWZrLfwv63FkXF29AHISsGQCIDkS', 'estudiante', NULL);

-- La tutoría 9 empieza en unos días y aún no tiene horarios; la 12 ya terminó (inactiva).
INSERT INTO tutorias (id, course_id, title, description, start_date, end_date, start_time, end_time, days, status, created_by) VALUES
(5, 1, 'Precálculo: funciones y desigualdades', 'Repaso de álgebra, funciones y desigualdades para el primer parcial.', CURDATE() - INTERVAL 21 DAY, CURDATE() + INTERVAL 14 DAY, '07:00', '12:00', '1,2,3,4,5,6,7', 1, 1),
(6, 2, 'Álgebra Lineal: matrices y sistemas', 'Operaciones con matrices, determinantes y método de Gauss-Jordan.', CURDATE() - INTERVAL 14 DAY, CURDATE() + INTERVAL 21 DAY, '13:00', '18:00', '1,2,3,4,5,6,7', 1, 1),
(7, 3, 'Algoritmos: diagramas de flujo y pseudocódigo', 'Resolución de problemas con diagramas de flujo y PSeInt.', CURDATE() - INTERVAL 21 DAY, CURDATE() + INTERVAL 28 DAY, '08:00', '20:00', '1,2,3,4,5,6,7', 1, 1),
(8, 5, 'Física I: cinemática', 'Movimiento rectilíneo, caída libre y tiro parabólico.', CURDATE() - INTERVAL 2 DAY, CURDATE() + INTERVAL 30 DAY, '14:00', '19:00', '1,2,3,4,5,6,7', 1, 1),
(9, 8, 'Derecho Informático: delitos informáticos', 'Marco legal guatemalteco y casos prácticos.', CURDATE() + INTERVAL 3 DAY, CURDATE() + INTERVAL 30 DAY, '18:00', '21:00', '2,4', 1, 1),
(10, 10, 'Análisis de Sistemas II: diagramas UML', 'Casos de uso, diagramas de clases y de secuencia.', CURDATE() - INTERVAL 10 DAY, CURDATE() + INTERVAL 20 DAY, '17:00', '21:00', '1,2,3,4,5,6,7', 1, 1),
(11, 11, 'Redes I: subnetting', 'Direccionamiento IPv4, máscaras y subredes.', CURDATE(), CURDATE() + INTERVAL 25 DAY, '08:00', '12:00', '1,2,3,4,5,6,7', 1, 1),
(12, 12, 'Arquitectura II: ensamblador 8086', 'Registros, interrupciones y programas en ensamblador.', CURDATE() - INTERVAL 40 DAY, CURDATE() - INTERVAL 15 DAY, '08:00', '12:00', '1,2,3,4,5,6,7', 0, 1);

INSERT INTO tutoria_tutor (tutoria_id, tutor_id) VALUES
(5, 10), (5, 4), (6, 4), (6, 11), (7, 2), (7, 12), (8, 10), (9, 11), (10, 12), (10, 3), (11, 2), (12, 3);

-- Bloques pasados (atendidos) y futuros. Un bloque reservado tiene exactamente una solicitud aceptada o atendida.
INSERT INTO bloques (id, tutoria_id, tutor_id, date, start_time, end_time, link, status) VALUES
(7, 5, 10, CURDATE() - INTERVAL 14 DAY, '08:00', '09:00', 'https://teams.microsoft.com/l/dam-1007', 'reservado'),
(8, 5, 4, CURDATE() - INTERVAL 13 DAY, '10:00', '11:00', 'https://zoom.us/j/90301008', 'reservado'),
(9, 6, 11, CURDATE() - INTERVAL 10 DAY, '14:00', '15:30', 'https://meet.google.com/dam-tut-1009', 'reservado'),
(10, 7, 2, CURDATE() - INTERVAL 7 DAY, '09:00', '10:00', 'https://teams.microsoft.com/l/dam-1010', 'reservado'),
(11, 7, 12, CURDATE() - INTERVAL 6 DAY, '16:00', '17:00', 'https://zoom.us/j/90301011', 'reservado'),
(12, 10, 12, CURDATE() - INTERVAL 5 DAY, '18:00', '19:00', 'https://meet.google.com/dam-tut-1012', 'reservado'),
(13, 10, 3, CURDATE() - INTERVAL 3 DAY, '17:00', '18:30', 'https://teams.microsoft.com/l/dam-1013', 'cancelado'),
(14, 6, 4, CURDATE() - INTERVAL 2 DAY, '15:00', '16:00', 'https://zoom.us/j/90301014', 'disponible'),
(15, 5, 10, CURDATE() - INTERVAL 1 DAY, '07:00', '08:00', 'https://meet.google.com/dam-tut-1015', 'reservado'),
(16, 5, 10, CURDATE() + INTERVAL 2 DAY, '07:30', '08:30', 'https://teams.microsoft.com/l/dam-1016', 'disponible'),
(17, 5, 4, CURDATE() + INTERVAL 3 DAY, '09:00', '10:00', 'https://zoom.us/j/90301017', 'reservado'),
(18, 6, 11, CURDATE() + INTERVAL 2 DAY, '14:00', '15:00', 'https://meet.google.com/dam-tut-1018', 'disponible'),
(19, 6, 4, CURDATE() + INTERVAL 5 DAY, '16:00', '17:30', 'https://teams.microsoft.com/l/dam-1019', 'disponible'),
(20, 7, 12, CURDATE() + INTERVAL 1 DAY, '18:00', '19:00', 'https://zoom.us/j/90301020', 'reservado'),
(21, 7, 2, CURDATE() + INTERVAL 6 DAY, '10:00', '11:30', 'https://meet.google.com/dam-tut-1021', 'disponible'),
(22, 8, 10, CURDATE() + INTERVAL 4 DAY, '15:00', '16:00', 'https://teams.microsoft.com/l/dam-1022', 'disponible'),
(23, 8, 10, CURDATE() + INTERVAL 4 DAY, '16:00', '17:00', 'https://zoom.us/j/90301023', 'disponible'),
(24, 10, 3, CURDATE() + INTERVAL 2 DAY, '19:00', '20:00', 'https://meet.google.com/dam-tut-1024', 'disponible'),
(25, 10, 12, CURDATE() + INTERVAL 3 DAY, '17:00', '18:00', 'https://teams.microsoft.com/l/dam-1025', 'reservado'),
(26, 11, 2, CURDATE() + INTERVAL 7 DAY, '08:00', '09:00', 'https://zoom.us/j/90301026', 'cancelado'),
(27, 11, 2, CURDATE() + INTERVAL 7 DAY, '09:00', '10:00', 'https://meet.google.com/dam-tut-1027', 'disponible'),
(28, 3, 2, CURDATE() + INTERVAL 5 DAY, '19:00', '20:30', 'https://teams.microsoft.com/l/dam-1028', 'disponible'),
(29, 1, 3, CURDATE() + INTERVAL 3 DAY, '11:00', '12:00', 'https://zoom.us/j/90301029', 'reservado'),
(30, 2, 9, CURDATE() + INTERVAL 4 DAY, '13:00', '14:00', 'https://meet.google.com/dam-tut-1030', 'disponible'),
(31, 2, 9, CURDATE() + INTERVAL 6 DAY, '17:00', '18:00', 'https://teams.microsoft.com/l/dam-1031', 'disponible'),
(32, 12, 3, CURDATE() - INTERVAL 18 DAY, '10:00', '11:00', 'https://zoom.us/j/90301032', 'reservado');

-- Al aceptar una solicitud, las demás del mismo bloque quedan rechazadas.
INSERT INTO solicitudes (block_id, student_id, status, notes) VALUES
(7, 13, 'atendida', 'Se repasaron funciones lineales y cuadráticas; quedó de practicar la guía 2.'),
(8, 14, 'atendida', 'Dudas de desigualdades con valor absoluto resueltas. Se recomendó hacer ejercicios del libro.'),
(8, 15, 'rechazada', NULL),
(9, 16, 'atendida', 'Se resolvieron 3 sistemas por Gauss-Jordan. Necesita reforzar determinantes.'),
(10, 5, 'atendida', 'Revisión de diagramas de flujo del laboratorio 3; se corrigieron ciclos anidados.'),
(11, 17, 'atendida', 'Pseudocódigo de arreglos y ordenamiento burbuja. Buen avance.'),
(11, 18, 'rechazada', NULL),
(12, 19, 'atendida', 'Diagrama de casos de uso del proyecto; se definieron actores y relaciones.'),
(13, 20, 'rechazada', NULL),
(15, 21, 'atendida', 'Repaso para el parcial: dominio y rango de funciones.'),
(15, 22, 'cancelada', NULL),
(16, 13, 'pendiente', NULL),
(16, 23, 'pendiente', NULL),
(17, 24, 'aceptada', NULL),
(17, 25, 'rechazada', NULL),
(18, 16, 'pendiente', NULL),
(18, 26, 'pendiente', NULL),
(18, 27, 'pendiente', NULL),
(20, 6, 'aceptada', NULL),
(20, 28, 'rechazada', NULL),
(21, 7, 'pendiente', NULL),
(21, 14, 'cancelada', NULL),
(22, 15, 'pendiente', NULL),
(24, 19, 'pendiente', NULL),
(24, 20, 'pendiente', NULL),
(25, 17, 'aceptada', NULL),
(26, 26, 'rechazada', NULL),
(27, 26, 'pendiente', NULL),
(28, 28, 'pendiente', NULL),
(28, 8, 'pendiente', NULL),
(29, 18, 'aceptada', NULL),
(30, 21, 'pendiente', NULL),
(31, 22, 'pendiente', NULL),
(31, 23, 'pendiente', NULL),
(32, 27, 'atendida', 'Programa de suma en ensamblador 8086 con interrupción 21h funcionando.');

INSERT INTO recuperaciones_admin (user_id, estado, created_at, resolved_at, resolved_by) VALUES
(14, 'resuelta', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 5 DAY, 1),
(25, 'pendiente', NOW() - INTERVAL 1 DAY, NULL, NULL);

INSERT INTO bitacora (usuario_id, usuario_nombre, recurso, accion, metodo, registro_id, resultado, http_status, ip_origen, detalle, fecha) VALUES
(1, 'Coordinación Académica', 'sesion', 'login', 'POST', NULL, 'correcto', 200, '127.0.0.1', NULL, NOW() - INTERVAL 3 DAY),
(1, 'Coordinación Académica', 'tutorias', 'crear', 'POST', 8, 'correcto', 201, '127.0.0.1', NULL, NOW() - INTERVAL 3 DAY),
(1, 'Coordinación Académica', 'tutorias', 'asignar_tutores', 'PUT', 8, 'correcto', 200, '127.0.0.1', NULL, NOW() - INTERVAL 3 DAY),
(10, 'Ing. Roberto González', 'sesion', 'login', 'POST', NULL, 'correcto', 200, '127.0.0.1', NULL, NOW() - INTERVAL 2 DAY),
(10, 'Ing. Roberto González', 'bloques', 'crear', 'POST', 22, 'correcto', 201, '127.0.0.1', NULL, NOW() - INTERVAL 2 DAY),
(10, 'Ing. Roberto González', 'bloques', 'crear', 'POST', NULL, 'rechazado', 409, '127.0.0.1', 'Ya tiene un bloque que se traslapa con ese horario', NOW() - INTERVAL 2 DAY),
(19, 'Mónica Pérez', 'sesion', 'login', 'POST', NULL, 'correcto', 200, '127.0.0.1', NULL, NOW() - INTERVAL 1 DAY),
(19, 'Mónica Pérez', 'solicitudes', 'crear', 'POST', NULL, 'correcto', 201, '127.0.0.1', NULL, NOW() - INTERVAL 1 DAY),
(NULL, NULL, 'sesion', 'login', 'POST', NULL, 'rechazado', 401, '127.0.0.1', 'Usuario o contraseña incorrectos', NOW() - INTERVAL 1 DAY),
(22, 'Valeria Ortiz', 'solicitudes', 'cancelar', 'PUT', NULL, 'correcto', 200, '127.0.0.1', NULL, NOW() - INTERVAL 0 DAY);
