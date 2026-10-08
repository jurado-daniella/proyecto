import { useState } from 'react'
import { Ban, ChevronLeft, ChevronRight, CircleCheck, CircleX, Eye, FileText, RefreshCw, Search, Video } from 'lucide-react'
import { api, qs } from '../api.js'
import { Badge, Box, Loading, Window, useApi, useMessage } from '../components/ui.jsx'

const ESTADOS = ['pendiente', 'aceptada', 'rechazada', 'cancelada', 'atendida']
const ddmmyyyy = (iso) => iso.split('-').reverse().join('/')

export default function Solicitudes({ user }) {
  const isStudent = user.role === 'estudiante'
  const [form, setForm] = useState({ texto: '', tutoria: '', estado: '' })   // lo que se escribe
  const [filters, setFilters] = useState({ tutoria: '', estado: '' })        // lo que se busca al presionar "Buscar"
  const { data, loading, error, reload } = useApi(`solicitudes.php?${qs(filters)}`)
  const tutorias = useApi('tutorias.php')
  const [selected, setSelected] = useState(null)
  const { run, view, setMessage } = useMessage()

  // Búsqueda por nombre en el navegador (la API filtra por estado y tutoría)
  const texto = filters.texto?.toLowerCase() ?? ''
  const rows = data.filter((s) => !texto || `${s.estudiante} ${s.carne} ${s.tutor}`.toLowerCase().includes(texto))
  const current = rows.find((s) => s.codigo === selected)

  const buscar = (e) => {
    e.preventDefault()
    setSelected(null)
    setFilters({ ...form })
  }

  const cancelar = () => {
    if (!current) return setMessage({ error: 'Seleccione una solicitud de la tabla' })
    if (!['pendiente', 'aceptada'].includes(current.estado)) return setMessage({ error: 'Esa solicitud ya no se puede cancelar' })
    if (!window.confirm('¿Seguro que desea cancelar la solicitud seleccionada?')) return
    run(() => api(`solicitudes.php?id=${current.codigo}&accion=cancelar`, { method: 'PUT' }), reload)
  }

  const footer = (
    <>
      {!isStudent && <button className="btn btn-lg" type="button"><CircleCheck className="ok" aria-hidden="true" /> Aceptar solicitud</button>}
      {!isStudent && <button className="btn btn-lg" type="button"><CircleX className="no" aria-hidden="true" /> Rechazar solicitud</button>}
      {isStudent && <button className="btn btn-lg" onClick={cancelar}><Ban className="no" aria-hidden="true" /> Cancelar solicitud</button>}
      <button className="btn btn-lg" type="button"><Eye aria-hidden="true" /> Ver solicitud</button>
      <button className="btn btn-lg" onClick={() => { setSelected(null); reload() }}><RefreshCw className="ok" aria-hidden="true" /> Actualizar</button>
    </>
  )

  return (
    <Window title={isStudent ? 'Mis solicitudes de tutoría' : 'Solicitudes de Tutorías'} icon={FileText} footer={footer}>
      <div className="stack">{view}</div>

      <div className="split">
        <div>
          <Box title="Filtros de búsqueda">
            <form className="filters" onSubmit={buscar}>
              <label>{isStudent ? 'Catedrático:' : 'Estudiante:'}
                <input value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} />
              </label>
              <label>Tutoría:
                <select value={form.tutoria} onChange={(e) => setForm({ ...form, tutoria: e.target.value })}>
                  <option value="">Todas</option>
                  {tutorias.data.map((t) => <option key={t.codigo} value={t.codigo}>{t.curso}</option>)}
                </select>
              </label>
              <label>Estado:
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                  <option value="">Todas</option>
                  {ESTADOS.map((e) => <option key={e} value={e}>{e[0].toUpperCase() + e.slice(1)}</option>)}
                </select>
              </label>
              <button className="btn btn-blue"><Search size={18} aria-hidden="true" /> Buscar</button>
            </form>
          </Box>

          <Loading show={loading} error={error} empty={!rows.length} emptyText="No se encontraron solicitudes.">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No.</th>
                    {!isStudent && <th>Estudiante</th>}
                    <th>Materia</th>
                    {user.role !== 'tutor' && <th>Catedrático</th>}
                    <th>Fecha</th><th>Hora</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s, i) => (
                    <tr key={s.codigo} className={selected === s.codigo ? 'selected' : ''} onClick={() => setSelected(s.codigo)} style={{ cursor: 'pointer' }}>
                      <td className="num">{i + 1}</td>
                      {!isStudent && <td>{s.estudiante}</td>}
                      <td>{s.tutoria}</td>
                      {user.role !== 'tutor' && <td>{s.tutor}</td>}
                      <td>{ddmmyyyy(s.fecha)}</td>
                      <td>{s.hora_inicio} - {s.hora_fin}</td>
                      <td><Badge value={s.estado} /></td>
                      <td className="actions">
                        {s.enlace && <a className="icon-btn" href={s.enlace} target="_blank" rel="noopener noreferrer" title="Unirse a la reunión" onClick={(e) => e.stopPropagation()}><Video color="#315b8a" /></a>}
                        {/* Fase 4: el catedrático acepta o rechaza */}
                        {!isStudent && s.estado === 'pendiente' && (
                          <>
                            <button className="icon-btn" type="button"><CircleCheck color="#1f8a4c" /></button>
                            <button className="icon-btn" type="button"><CircleX color="#c9232c" /></button>
                          </>
                        )}
                        {s.estado !== 'pendiente' && !s.enlace && <FileText size={20} color="#888" aria-label="Sin acciones" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="table-note">Haga clic en una fila para seleccionarla. {rows.length} registro(s).</p>
          </Loading>
        </div>

        <Calendario rows={data} />
      </div>
    </Window>
  )
}

/** Calendario del mes con un punto por cada solicitud del día. */
function Calendario({ rows }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const todayIso = new Date().toLocaleDateString('en-CA')
  const offset = (month.getDay() + 6) % 7                                  // lunes = 0
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - offset)
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  const move = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  const color = (estado) => ({ pendiente: 'c-pendiente', aceptada: 'c-aceptada', atendida: 'c-aceptada', cancelada: 'c-cancelada', rechazada: 'c-cancelada' }[estado] ?? 'c-otro')

  return (
    <Box title="Calendario de tutorías" className="calendar">
      <div className="calendar-head">
        <button onClick={() => move(-1)} aria-label="Mes anterior"><ChevronLeft size={18} /></button>
        <strong>{(() => { const t = month.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }).replace(' de ', ' '); return t[0].toUpperCase() + t.slice(1) })()}</strong>
        <button onClick={() => move(1)} aria-label="Mes siguiente"><ChevronRight size={18} /></button>
      </div>
      <div className="calendar-grid">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span className="dow" key={i}>{d}</span>)}
        {days.map((d) => {
          const iso = d.toLocaleDateString('en-CA')
          const items = rows.filter((r) => r.fecha === iso)
          const cls = ['cal-day', d.getMonth() !== month.getMonth() && 'out', iso === todayIso && 'today'].filter(Boolean).join(' ')
          return (
            <span key={iso} className={cls} title={items.map((r) => `${r.hora_inicio} ${r.tutoria} (${r.estado})`).join('\n') || undefined}>
              {d.getDate()}
              {items.length > 0 && <span className="dots">{items.slice(0, 4).map((r) => <i key={r.codigo} className={color(r.estado)} />)}</span>}
            </span>
          )
        })}
      </div>
      <div className="legend">
        <span><i className="c-pendiente" /> Pendiente</span>
        <span><i className="c-aceptada" /> Confirmada</span>
        <span><i className="c-cancelada" /> Cancelada / rechazada</span>
      </div>
    </Box>
  )
}
