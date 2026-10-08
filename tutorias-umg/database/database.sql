-- =========================================================
--  Sistema de Gestión de Tutorías - UMG
--  Script de creación de la base de datos (MySQL 8 / MariaDB 10.4+)
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
