import { useParams } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { Window } from '../components/ui.jsx'

// Módulos planificados que todavía no se implementan
const PLANES = {
  reportes: ['Reportes', ['Solicitudes por estado y por mes', 'Catedráticos más solicitados', 'Tutorías atendidas por curso', 'Exportar a PDF / Excel']],
  historial: ['Historial', ['Tutorías atendidas con notas de la sesión', 'Filtro por curso y catedrático', 'Constancia de asistencia']],
  perfil: ['Mi perfil', ['Cambiar contraseña', 'Foto de perfil', 'Datos de contacto']],
  ayuda: ['Ayuda', ['Preguntas frecuentes', 'Manual de uso por rol', 'Contacto con la coordinación']],
}

export default function EnConstruccion() {
  const { modulo } = useParams()
  const [title, items] = PLANES[modulo] ?? ['Módulo', []]

  return (
    <Window title={title} icon={Construction}>
      <div className="wip">
        <Construction aria-hidden="true" />
        <div>
          <h2 style={{ fontSize: '1.2rem' }}>Módulo en construcción</h2>
          <p className="muted">Esta sección está planificada para las siguientes fases del proyecto. Incluirá:</p>
          <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
      </div>
    </Window>
  )
}
