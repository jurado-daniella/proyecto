import { Link } from 'react-router-dom'
import { CalendarDays, FileText, House, Search, Users, Video } from 'lucide-react'
import { Box, Loading, Window, formatDate, useApi } from '../components/ui.jsx'

const isFuture = (s) => new Date(`${s.fecha}T${s.hora_inicio}`) >= new Date()

const ACCESOS = {
  admin: [['/usuarios', 'Registrar catedrático', Users], ['/tutorias', 'Nueva tutoría', CalendarDays], ['/solicitudes', 'Ver solicitudes', FileText]],
  tutor: [['/bloques', 'Publicar horario', CalendarDays], ['/solicitudes', 'Ver solicitudes', FileText]],
  estudiante: [['/explorar', 'Buscar tutoría', Search], ['/solicitudes', 'Mis solicitudes', FileText]],
}

export default function Inicio({ user }) {
  const requests = useApi('solicitudes.php')
  const upcoming = requests.data
    .filter((s) => isFuture(s) && ['pendiente', 'aceptada'].includes(s.estado))
    .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio))
    .slice(0, 6)

  return (
    <Window title={`Bienvenido(a), ${user.name}`} icon={House}>
      <Box title="Accesos rápidos">
        <div className="quick">
          {ACCESOS[user.role].map(([to, label, Icon]) => (
            <Link key={to} to={to} className="btn btn-lg"><Icon aria-hidden="true" /> {label}</Link>
          ))}
        </div>
      </Box>


      <Box title="Próximas tutorías">
        <Loading show={requests.loading} error={requests.error} empty={!upcoming.length} emptyText="No hay tutorías próximas.">
          <div className="table-wrap">
            <table>
              <thead><tr><th>No.</th><th>Fecha</th><th>Hora</th><th>Tutoría</th><th>{user.role === 'estudiante' ? 'Catedrático' : 'Estudiante'}</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {upcoming.map((s, i) => (
                  <tr key={s.codigo}>
                    <td className="num">{i + 1}</td>
                    <td>{formatDate(s.fecha)}</td>
                    <td>{s.hora_inicio} - {s.hora_fin}</td>
                    <td>{s.tutoria}</td>
                    <td>{user.role === 'estudiante' ? s.tutor : s.estudiante}</td>
                    <td><span className={`badge badge-${s.estado}`}>{s.estado}</span></td>
                    <td>{s.enlace && <a className="btn btn-sm btn-navy" href={s.enlace} target="_blank" rel="noopener noreferrer"><Video size={15} aria-hidden="true" /> Unirse</a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Loading>
      </Box>
    </Window>
  )
}
