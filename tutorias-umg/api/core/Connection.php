<?php
require_once(__DIR__ . "/Configuration.php");
require_once(__DIR__ . "/Response.php");

class Connection extends PDO
{
    public function __construct()
    {
        try {
            $dsn = "mysql:host=" . HOST_DB . ";port=" . PORT_DB . ";dbname=" . DATABASE . ";charset=" . CHARSET;
            parent::__construct($dsn, USER_DB, PASSWORD_DB, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            // Mensaje según el código de MySQL, sin exponer credenciales
            preg_match('/\[(\d{4})\]/', $e->getMessage(), $match);
            $reasons = [
                '1049' => "La base de datos '" . DATABASE . "' no existe: importe database/database.sql en phpMyAdmin",
                '1045' => "Usuario o contraseña de MySQL incorrectos: revise DATABASE_USER y DATABASE_PSSW en api/.env",
                '2002' => "MySQL no responde en " . HOST_DB . ":" . PORT_DB . ": encienda MySQL en XAMPP o revise DATABASE_PORT en api/.env",
            ];
            $message = $reasons[$match[1] ?? ''] ?? "No se pudo conectar a la base de datos. Revise el archivo api/.env";
            Response::error($message, -1001, 500);
        }
    }
}
