<?php

/**
 * Lectura y validación de los datos que envía el cliente.
 * El JavaScript del navegador envía JSON, por eso se lee php://input ($_POST llega vacío con JSON).
 */
class Request
{
    static function body(): array
    {
        if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 65536) throw new ApiException("Petición demasiado grande", 1002, 413);
        $raw = file_get_contents("php://input");
        if ($raw === '') return [];
        $data = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data) || substr(ltrim($raw), 0, 1) !== '{') throw new ApiException("Se esperaba un objeto JSON válido", 1002, 400);
        return $data;
    }

    /** Devuelve los campos obligatorios ya recortados o lanza error 422. */
    static function required(array $data, array $fields): array
    {
        $clean = [];
        $missing = [];
        foreach ($fields as $field) {
            $value = isset($data[$field]) && is_scalar($data[$field]) ? (in_array($field, ['clave', 'confirmacion', 'actual', 'nueva'], true) ? (string) $data[$field] : trim((string) $data[$field])) : '';
            if ($value === '') {
                $missing[] = $field;
            }
            $clean[$field] = $value;
        }
        if ($missing) {
            throw new ApiException("Campos obligatorios: " . implode(", ", $missing), 1002, 422);
        }
        return $clean;
    }

    /** Entero positivo desde la URL (?id=) o null. */
    static function intParam(string $name): ?int
    {
        $value = filter_input(INPUT_GET, $name, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
        if (isset($_GET[$name]) && !$value) throw new ApiException("Identificador inválido", 1002, 422);
        return $value ?: null;
    }

    static function param(string $name): ?string
    {
        if (isset($_GET[$name]) && !is_string($_GET[$name])) throw new ApiException('Filtro inválido', 1002, 422);
        $value = trim($_GET[$name] ?? '');
        return $value === '' ? null : $value;
    }

    static function validDate(string $value): bool
    {
        $date = DateTime::createFromFormat('Y-m-d', $value);
        return $date && $date->format('Y-m-d') === $value;
    }

    static function validTime(string $value): bool
    {
        return (bool) preg_match('/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $value);
    }
}
