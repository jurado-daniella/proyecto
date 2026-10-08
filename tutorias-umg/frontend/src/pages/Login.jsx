import { useState } from 'react'
import { api } from '../api.js'
import { Alert } from '../components/ui.jsx'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ usuario: '', clave: '' })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      const json = await api('sesion.php?accion=login', { method: 'POST', body: form })
      onLogin(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="login-page">
      <form className="card login-card" onSubmit={submit}>
        <span className="brand-mark big" aria-hidden="true">UMG</span>
        <h1>Tutorías Académicas</h1>
        <p className="muted">Facultad de Ingeniería en Sistemas</p>

        <Alert>{error}</Alert>

        <label>
          Usuario, carné o correo
          <input name="usuario" value={form.usuario} onChange={change} autoComplete="username" required autoFocus />
        </label>
        <label>
          Contraseña
          <input name="clave" type="password" value={form.clave} onChange={change} autoComplete="current-password" required />
        </label>
        <button className="btn btn-primary" disabled={sending}>{sending ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </main>
  )
}
