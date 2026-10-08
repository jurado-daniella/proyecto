import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { CalendarDays, ChartColumn, CircleHelp, FileText, GraduationCap, History, House, LogOut, Search, User, Users } from 'lucide-react'
import { api, setCsrf } from './api.js'
import { Avatar } from './components/ui.jsx'
import Landing from './pages/Landing.jsx'
import Acceso from './pages/Acceso.jsx'
import Inicio from './pages/Inicio.jsx'
import Usuarios from './pages/Usuarios.jsx'
import Tutorias from './pages/Tutorias.jsx'
import Bloques from './pages/Bloques.jsx'
import Explorar from './pages/Explorar.jsx'
import Solicitudes from './pages/Solicitudes.jsx'

// Menú por rol. El servidor vuelve a validar el rol en cada petición;
// esto solo decide qué pantallas mostrar. Los marcados con 'soon' todavía no tienen pantalla.
const MENU = {
  admin: [
    ['/', 'Inicio', House], ['/usuarios', 'Usuarios', Users], ['/tutorias', 'Tutorías', GraduationCap],
    ['/solicitudes', 'Solicitudes', FileText], ['reportes', 'Reportes', ChartColumn, 'soon'],
    ['ayuda', 'Ayuda', CircleHelp, 'soon'],
  ],
  tutor: [
    ['/', 'Inicio', House], ['/bloques', 'Disponibilidad', CalendarDays], ['/solicitudes', 'Solicitudes', FileText],
    ['historial', 'Historial', History, 'soon'], ['ayuda', 'Ayuda', CircleHelp, 'soon'],
  ],
  estudiante: [
    ['/', 'Inicio', House], ['/explorar', 'Buscar tutorías', Search], ['/solicitudes', 'Mis solicitudes', FileText],
    ['historial', 'Historial', History, 'soon'], ['perfil', 'Mi perfil', User, 'soon'],
    ['ayuda', 'Ayuda', CircleHelp, 'soon'],
  ],
}

export const ROLE_LABEL = { admin: 'Coordinación', tutor: 'Catedrático', estudiante: 'Estudiante' }

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  // Al recargar la página se pregunta al servidor si la sesión sigue activa
  useEffect(() => {
    api('sesion.php')
      .then((json) => { setCsrf(json.data.csrf); setUser(json.data.usuario) })
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [])

  const onLogin = (data) => { setCsrf(data.csrf); setUser(data.usuario) }

  const logout = async () => {
    try { await api('sesion.php?accion=logout', { method: 'POST' }) } catch { /* la sesión ya no existía */ }
    setCsrf('')
    setUser(null)
  }

  if (checking) return null

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Acceso mode="login" onLogin={onLogin} />} />
        <Route path="/registro" element={<Acceso mode="registro" onLogin={onLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return <Shell user={user} logout={logout} />
}

const PANEL = { admin: 'Panel de Administrador', tutor: 'Panel del Catedrático', estudiante: 'Panel del Estudiante' }

function Shell({ user, logout }) {
  return (
    <div className="shell">
      <header className="app-header">
        <div className="inner">
          <span className="logo"><img src="assets/logo/dam-logo-horizontal.png" alt="DAM Tutorías y Asesorías Académicas" /></span>
          <div className="app-title">
            <strong>Sistema de Tutorías y Asesorías Académicas</strong>
            <span>{PANEL[user.role]}</span>
          </div>
          <div className="app-user">
            <Avatar src={user.avatar} name={user.name} size="lg" />
            <div className="who">
              <strong>{user.name}</strong>
              <span>{user.role === 'estudiante' ? `Carné ${user.username}` : ROLE_LABEL[user.role]}</span>
            </div>
            <button className="logout" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <div className="toolbar">
        <nav aria-label="Menú principal">
          {MENU[user.role].map(([to, label, Icon, soon]) => soon
            ? <button key={to} type="button"><Icon aria-hidden="true" /> {label}</button>
            : <NavLink key={to} to={to} end={to === '/'}><Icon aria-hidden="true" /> {label}</NavLink>
          )}
        </nav>
      </div>

      <main className="main">
        <Routes>
          <Route path="/" element={<Inicio user={user} />} />
          {user.role === 'admin' && <Route path="/usuarios" element={<Usuarios currentUser={user} />} />}
          {user.role === 'admin' && <Route path="/tutorias" element={<Tutorias />} />}
          {user.role === 'tutor' && <Route path="/bloques" element={<Bloques user={user} />} />}
          {user.role === 'estudiante' && <Route path="/explorar" element={<Explorar />} />}
          <Route path="/solicitudes" element={<Solicitudes user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
