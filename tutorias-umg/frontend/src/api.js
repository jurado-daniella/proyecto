// Cliente HTTP único: todas las pantallas consumen la API PHP desde aquí.
const BASE = import.meta.env.VITE_API_URL || '../api/controllers'

let csrfToken = ''
export const setCsrf = (token) => { csrfToken = token || '' }

export async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE}/${path}`, {
    method,
    credentials: 'same-origin',              // envía la cookie de sesión
    headers: {
      'Content-Type': 'application/json',
      ...(method !== 'GET' && { 'X-CSRF-Token': csrfToken }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  let json
  try {
    json = await response.json()
  } catch {
    throw new Error('El servidor no respondió correctamente. ¿Está encendido XAMPP?')
  }
  if (!response.ok) {
    const error = new Error(json.message || 'Error inesperado')
    error.status = response.status
    throw error
  }
  return json
}

/** Convierte un objeto de filtros en query string ignorando los vacíos. */
export const qs = (params) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString()
