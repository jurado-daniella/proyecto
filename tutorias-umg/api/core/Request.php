<?php

/**
 * Lectura y validación de los datos que envía el cliente.
 * React envía JSON, por eso se lee php://input ($_POST llega vacío con JSON).
 */
class Request
{
    static function body(): array
    {
        $data = json_decode(file_get_contents("php://input"), true);
        return is_array($data) ? $data : [];
    }

    /** Devuelve los campos obligatorios ya recortados o lanza error 422. */
    static function required(array $data, array $fields): array
    {
        $clean = [];
        $missing = [];
        foreach ($fields as $field) {
            $value = isset($data[$field]) && is_scalar($data[$field]) ? trim((string) $data[$field]) : '';
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
        return $value ?: null;
    }

    static function param(string $name): ?string
    {
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
