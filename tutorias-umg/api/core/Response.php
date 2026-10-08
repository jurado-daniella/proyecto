<?php

/**
 * Error controlado de la aplicación. Los modelos lo lanzan y el controlador
 * lo convierte en respuesta JSON; así el modelo no decide nada de HTTP.
 */
class ApiException extends Exception
{
    public int $httpCode;

    public function __construct(string $message, int $code, int $httpCode = 400)
    {
        parent::__construct($message, $code);
        $this->httpCode = $httpCode;
    }
}

class Response
{
    static function success($message, $data = [], $code = 1, $httpCode = 200)
    {
        http_response_code($httpCode);
        header("Content-Type: application/json; charset=utf-8");
        exit(json_encode([
            "code" => $code,
            "message" => $message,
            "data" => $data,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    static function error($message, $code, $httpCode = 400)
    {
        http_response_code($httpCode);
        header("Content-Type: application/json; charset=utf-8");
        exit(json_encode([
            "code" => $code,
            "message" => $message,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Manejo común de excepciones en los controladores.
     * Errores controlados se devuelven tal cual; cualquier otro se oculta.
     */
    static function fromException(Throwable $th, $genericMessage, $genericCode)
    {
        if ($th instanceof ApiException) {
            self::error($th->getMessage(), $th->getCode(), $th->httpCode);
        }
        error_log($th->getMessage());   // queda en el log de Apache, no en la respuesta
        self::error($genericMessage, $genericCode, 500);
    }
}
