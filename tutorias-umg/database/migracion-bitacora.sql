USE tutorias_umg;
CREATE TABLE IF NOT EXISTS bitacora (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT NULL,
 usuario_nombre VARCHAR(120) NULL,
 recurso VARCHAR(60) NOT NULL,
 accion VARCHAR(60) NOT NULL,
 metodo VARCHAR(10) NOT NULL,
 registro_id INT NULL,
 resultado ENUM('correcto','rechazado') NOT NULL,
 http_status SMALLINT NOT NULL,
 fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
 INDEX idx_bitacora_fecha(fecha), INDEX idx_bitacora_usuario(usuario_id)
);
