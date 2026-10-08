<?php
require_once(__DIR__ . "/Env.php");
Env::load(__DIR__ . "/../.env");

date_default_timezone_set("America/Guatemala");

#   SECURITY & SESSIONS
#   cookie_secure solo si hay HTTPS: con XAMPP (http) la cookie no se enviaría.
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', '1');
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    ini_set('session.cookie_secure', '1');
}

session_name(Env::get('SESSION_NAME', 'tutorias_umg_session'));
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

#   ENVIRONMENT DEFINITIONS
define("HOST_DB", Env::get('DATABASE_URL', '127.0.0.1'));
define("PORT_DB", Env::get('DATABASE_PORT', '3306'));
define("USER_DB", Env::get('DATABASE_USER', 'root'));
define("PASSWORD_DB", Env::get('DATABASE_PSSW', ''));
define("DATABASE", Env::get('DATABASE_NAME', 'tutorias_umg'));
define("CHARSET", Env::get('DATABASE_CHARSET', 'utf8mb4'));
