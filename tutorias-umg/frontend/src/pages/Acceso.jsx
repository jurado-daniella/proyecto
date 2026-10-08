import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, IdCard, Lock, Mail, User } from 'lucide-react'
import { api } from '../api.js'
import { Alert } from '../components/ui.jsx'

const EMPTY = { usuario: '', clave: '', nombre: '', carne: '', correo: '', confirmacion: '' }

/** Login y registro de estudiantes comparten el mismo diseño de dos columnas. */
export default function Acceso({ mode, onLogin }) {
  const isLogin = mode === 'login'
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isLogin && form.clave !== form.confirmacion) {
      setError('Las contraseñas no coinciden')
      return
    }
    setSending(true)
    try {
      const body = isLogin
        ? { usuario: form.usuario, clave: form.clave }
        : { nombre: form.nombre, carne: form.carne, correo: form.correo, clave: form.clave, confirmacion: form.confirmacion }
      const json = await api(`sesion.php?accion=${isLogin ? 'login' : 'registro'}`, { method: 'POST', body })
      onLogin(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="auth">
      <aside className="auth-side">
        <img src={isLogin ? 'assets/personajes/tutor-01.jpg' : 'assets/personajes/estudiante-04.jpg'} alt="" />
        <Link to="/" className="brand"><img src="assets/logo/dam-logo-horizontal-white.png" alt="DAM, volver al inicio" /></Link>
        <blockquote>
          <p>{isLogin ? 'Tus tutorías, tus horarios y tus catedráticos en un solo lugar.' : 'Pide ayuda a tiempo: un buen tutor cambia todo el ciclo.'}</p>
          <small>Facultad de Ingeniería en Sistemas · UMG</small>
        </blockquote>
      </aside>

      <main className="auth-main">
        <form className="auth-form" onSubmit={submit}>
          <Link to="/" className="back"><ArrowLeft aria-hidden="true" /> Volver al inicio</Link>
          <div>
            <span className="eyebrow">{isLogin ? 'Bienvenido de nuevo' : 'Solo para estudiantes'}</span>
            <h1 style={{ marginTop: '.5rem' }}>{isLogin ? 'Inicia sesión' : 'Crea tu cuenta'}</h1>
          </div>

          <Alert>{error}</Alert>

          {isLogin ? (
            <>
              <label className="field">Carné, usuario o correo
                <span className="input-icon"><User aria-hidden="true" /><input name="usuario" value={form.usuario} onChange={change} autoComplete="username" required autoFocus /></span>
              </label>
              <label className="field">Contraseña
                <span className="input-icon"><Lock aria-hidden="true" /><input name="clave" type="password" value={form.clave} onChange={change} autoComplete="current-password" required /></span>
              </label>
            </>
          ) : (
            <>
              <label className="field">Nombre completo
                <span className="input-icon"><User aria-hidden="true" /><input name="nombre" value={form.nombre} onChange={change} autoComplete="name" required maxLength={120} autoFocus /></span>
              </label>
              <label className="field">Carné <small>Ej. 5190-24-1234</small>
                <span className="input-icon"><IdCard aria-hidden="true" /><input name="carne" value={form.carne} onChange={change} pattern="\d{4}-\d{2}-\d{1,6}" title="Formato 0000-00-0000" required /></span>
              </label>
              <label className="field">Correo institucional
                <span className="input-icon"><Mail aria-hidden="true" /><input name="correo" type="email" value={form.correo} onChange={change} placeholder="usuario@miumg.edu.gt" pattern=".+@miumg\.edu\.gt" title="Debe terminar en @miumg.edu.gt" autoComplete="email" required /></span>
              </label>
              <label className="field">Contraseña <small>Mínimo 8 caracteres</small>
                <span className="input-icon"><Lock aria-hidden="true" /><input name="clave" type="password" value={form.clave} onChange={change} minLength={8} autoComplete="new-password" required /></span>
              </label>
              <label className="field">Confirmar contraseña
                <span className="input-icon"><Lock aria-hidden="true" /><input name="confirmacion" type="password" value={form.confirmacion} onChange={change} minLength={8} autoComplete="new-password" required /></span>
              </label>
            </>
          )}

          <button className="btn btn-red" disabled={sending}>
            {sending ? 'Un momento…' : isLogin ? 'Ingresar' : 'Crear cuenta'}
          </button>

          <p className="auth-switch">
            {isLogin ? <>¿Eres estudiante y no tienes cuenta? <Link to="/registro">Regístrate</Link></> : <>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></>}
          </p>
        </form>
      </main>
    </div>
  )
}
