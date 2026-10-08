import { useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Clock, GraduationCap, RefreshCw, Search, Users } from 'lucide-react'
import { api, qs } from '../api.js'
import { Avatar, Box, Loading, Window, daysText, formatDate, shortDate, useApi, useMessage } from '../components/ui.jsx'

/** Flujo del estudiante: elige tutoría → elige catedrático → solicita un horario. */
export default function Explorar() {
  const [filters, setFilters] = useState({ buscar: '', curso: '' })
  const tutorias = useApi(`tutorias.php?${qs(filters)}`)
  const courses = useApi('tutorias.php?accion=cursos')
  const [selected, setSelected] = useState(null)

  if (selected) return <Detalle tutoria={selected} onBack={() => { setSelected(null); tutorias.reload() }} />

  return (
    <Window title="Buscar tutorías" icon={Search}>
      <Box title="Filtros de búsqueda">
        <div className="filters">
          <label>Curso o tema:<input type="search" value={filters.buscar} onChange={(e) => setFilters({ ...filters, buscar: e.target.value })} /></label>
          <label>Curso:
            <select value={filters.curso} onChange={(e) => setFilters({ ...filters, curso: e.target.value })}>
              <option value="">Todos</option>
              {courses.data.map((c) => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
            </select>
          </label>
        </div>
      </Box>

      <Loading show={tutorias.loading} error={tutorias.error} empty={!tutorias.data.length} emptyText="No hay tutorías con esos filtros.">
        <div className="tutoria-grid">
          {tutorias.data.map((t) => (
            <article key={t.codigo} className="tutoria-card">
              <span className="code">{t.curso_clave} · Ciclo {t.ciclo}</span>
              <h3>{t.titulo}</h3>
              {t.descripcion && <p>{t.descripcion}</p>}
              <div className="meta">
                <span><CalendarDays aria-hidden="true" /> {shortDate(t.fecha_inicio)} – {shortDate(t.fecha_fin)}</span>
                <span><Clock aria-hidden="true" /> {daysText(t.dias)}</span>
                <span><Users aria-hidden="true" /> {t.total_tutores} catedrático(s)</span>
              </div>
              <button className="btn btn-sm btn-navy" onClick={() => setSelected(t)}>
                Ver horarios ({t.bloques_disponibles}) <ArrowRight size={16} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      </Loading>
    </Window>
  )
}

function Detalle({ tutoria, onBack }) {
  const [tutor, setTutor] = useState('')
  const detail = useApi(`tutorias.php?id=${tutoria.codigo}`)
  const blocks = useApi(`bloques.php?${qs({ tutoria: tutoria.codigo, tutor })}`)
  const { run, view } = useMessage()

  const request = (b) => run(() => api('solicitudes.php', { method: 'POST', body: { bloque: b.codigo } }), blocks.reload)
  const tutores = detail.data.tutores ?? []

  return (
    <Window title={tutoria.titulo} icon={GraduationCap} footer={
      <>
        <button className="btn btn-lg" onClick={onBack}><ArrowLeft aria-hidden="true" /> Regresar</button>
        <button className="btn btn-lg" onClick={blocks.reload}><RefreshCw className="ok" aria-hidden="true" /> Actualizar</button>
      </>
    }>
      <p className="muted" style={{ marginBottom: '1rem' }}>
        {tutoria.curso_clave} · {tutoria.curso} — del {shortDate(tutoria.fecha_inicio)} al {shortDate(tutoria.fecha_fin)}, {daysText(tutoria.dias)} de {tutoria.hora_inicio} a {tutoria.hora_fin}
      </p>

      <div className="stack">{view}</div>

      <Box title="1. Elija el catedrático">
        <div className="tutor-pick">
          <button aria-pressed={tutor === ''} onClick={() => setTutor('')}>
            <span className="avatar lg"><Users size={18} aria-hidden="true" /></span>
            <div><strong>Todos</strong><span>Ver todos</span></div>
          </button>
          {tutores.map((t) => (
            <button key={t.codigo} aria-pressed={String(tutor) === String(t.codigo)} onClick={() => setTutor(t.codigo)}>
              <Avatar src={t.avatar} name={t.nombre} size="lg" />
              <div><strong>{t.nombre}</strong><span>Catedrático</span></div>
            </button>
          ))}
        </div>
      </Box>

      <Box title="2. Elija el horario">
        <Loading show={blocks.loading} error={blocks.error} empty={!blocks.data.length} emptyText="No hay horarios disponibles por el momento.">
          <div className="table-wrap">
            <table>
              <thead><tr><th>No.</th><th>Fecha</th><th>Hora</th><th>Catedrático</th><th>Aplicando</th><th>Acción</th></tr></thead>
              <tbody>
                {blocks.data.map((b, i) => (
                  <tr key={b.codigo}>
                    <td className="num">{i + 1}</td>
                    <td>{formatDate(b.fecha)}</td>
                    <td>{b.hora_inicio} - {b.hora_fin}</td>
                    <td><div className="person"><Avatar src={b.tutor_avatar} name={b.tutor} />{b.tutor}</div></td>
                    <td>{b.aplicantes} estudiante(s)</td>
                    <td>
                      {b.mi_solicitud && b.mi_solicitud !== 'cancelada'
                        ? <span className={`badge badge-${b.mi_solicitud}`}>Tu solicitud: {b.mi_solicitud}</span>
                        : <button className="btn btn-sm btn-red" onClick={() => request(b)}>Solicitar</button>}
                    </td>
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
