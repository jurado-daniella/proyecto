USE tutorias_umg;
CREATE TABLE IF NOT EXISTS password_resets (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL,
 token_hash CHAR(64) NOT NULL UNIQUE,
 credential CHAR(64) NOT NULL,
 expires_at DATETIME NOT NULL,
 used_at DATETIME NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES usuarios(id),
 INDEX idx_reset_expiry (expires_at)
);
