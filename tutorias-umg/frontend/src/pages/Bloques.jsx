import { useState } from 'react'
import { Ban, CalendarDays, Info, Pencil, Plus, Printer, RefreshCw } from 'lucide-react'
import { api, qs } from '../api.js'
import { Box, Window, Badge, Loading, daysText, formatDate, shortDate, today, useApi, useMessage } from '../components/ui.jsx'

const EMPTY = { tutoria: '', fecha: '', hora_inicio: '', hora_fin: '', enlace: '' }

export default function Bloques({ user }) {
  const [filters, setFilters] = useState({ estado: '', desde: today(), hasta: '' })
  const { data, loading, error, reload } = useApi(`bloques.php?${qs(filters)}`)
  const myTutorias = useApi(`tutorias.php?tutor=${user.id}`)
  const [form, setForm] = useState(null)
  const { run, view, setMessage } = useMessage()

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  // Rango que definió la coordinación para la tutoría elegida
  const range = myTutorias.data.find((t) => String(t.codigo) === String(form?.tutoria))

  const save = (e) => {
    e.preventDefault()
    if (form.hora_fin <= form.hora_inicio) {
      setMessage({ error: 'La hora de fin debe ser posterior a la de inicio' })   // el servidor también lo valida
      return
    }
    run(() => form.codigo
      ? api(`bloques.php?id=${form.codigo}`, { method: 'PUT', body: form })
      : api('bloques.php', { method: 'POST', body: form }),
    () => { setForm(null); reload() })
  }

  const cancel = (b) => {
    if (!window.confirm(`¿Cancelar el bloque del ${formatDate(b.fecha)} a las ${b.hora_inicio}? Las solicitudes pendientes se rechazarán.`)) return
    run(() => api(`bloques.php?id=${b.codigo}`, { method: 'DELETE' }), reload)
  }

  return (
    <Window title="Mi disponibilidad" icon={CalendarDays} footer={
      <>
        <button className="btn btn-lg" onClick={() => setForm({ ...EMPTY })}><Plus className="ok" aria-hidden="true" /> Publicar horario</button>
        <button className="btn btn-lg" type="button"><Printer aria-hidden="true" /> Imprimir agenda</button>
        <button className="btn btn-lg" onClick={reload}><RefreshCw className="ok" aria-hidden="true" /> Actualizar</button>
      </>
    }>

      <div className="stack">{view}</div>

      {form && (
        <form onSubmit={save}>
          <Box title={form.codigo ? 'Editar horario' : 'Nuevo horario'}>
          <div className="form-grid">
            <label className="field full">Tutoría
              <select name="tutoria" value={form.tutoria} onChange={change} required>
                <option value="">Seleccione…</option>
                {myTutorias.data.map((t) => <option key={t.codigo} value={t.codigo}>{t.titulo}</option>)}
              </select>
            </label>
            {range && (
              <div className="alert alert-info full range-hint">
                <Info aria-hidden="true" />
                <span>Disponible del <b>{shortDate(range.fecha_inicio)}</b> al <b>{shortDate(range.fecha_fin)}</b>, de <b>{range.hora_inicio}</b> a <b>{range.hora_fin}</b> · {daysText(range.dias)}</span>
              </div>
            )}
            <label className="field">Fecha
              <input name="fecha" type="date" value={form.fecha} onChange={change} required
                min={range ? [range.fecha_inicio, today()].sort().at(-1) : today()} max={range?.fecha_fin} />
            </label>
            <label className="field">Hora de inicio<input name="hora_inicio" type="time" value={form.hora_inicio} onChange={change} min={range?.hora_inicio} max={range?.hora_fin} required /></label>
            <label className="field">Hora de fin<input name="hora_fin" type="time" value={form.hora_fin} onChange={change} min={range?.hora_inicio} max={range?.hora_fin} required /></label>
            <label className="field full">Enlace de la reunión
              <input name="enlace" type="url" placeholder="https://meet.google.com/..." value={form.enlace} onChange={change} required />
            </label>
            <div className="form-actions">
              <button className="btn btn-navy">Guardar</button>
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancelar</button>
            </div>
          </div>
          </Box>
        </form>
      )}

      <Box title="Filtros de búsqueda">
        <div className="filters">
          <label>Estado:
            <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
              <option value="">Todos</option>
              <option value="disponible">Disponible</option>
              <option value="reservado">Reservado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>
          <label>Desde:<input type="date" value={filters.desde} onChange={(e) => setFilters({ ...filters, desde: e.target.value })} /></label>
          <label>Hasta:<input type="date" value={filters.hasta} onChange={(e) => setFilters({ ...filters, hasta: e.target.value })} /></label>
        </div>
      </Box>

        <Loading show={loading} error={error} empty={!data.length} emptyText="Aún no tienes horarios publicados en esas fechas.">
          <div className="table-wrap">
            <table>
              <thead><tr><th>No.</th><th>Fecha</th><th>Horario</th><th>Tutoría</th><th>Aplicando</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>
                {data.map((b, i) => (
                  <tr key={b.codigo}>
                    <td className="num">{i + 1}</td>
                    <td>{formatDate(b.fecha)}</td>
                    <td>{b.hora_inicio} – {b.hora_fin}</td>
                    <td>{b.tutoria}</td>
                    <td>{b.aplicantes} estudiante{b.aplicantes === 1 ? '' : 's'}</td>
                    <td><Badge value={b.estado} /></td>
                    <td className="actions">
                      {b.estado === 'disponible' && (
                        <>
                          <button className="btn btn-sm" onClick={() => setForm({ codigo: b.codigo, tutoria: b.tutoria_codigo, fecha: b.fecha, hora_inicio: b.hora_inicio, hora_fin: b.hora_fin, enlace: b.enlace })}><Pencil aria-hidden="true" /> Editar</button>
                          <button className="btn btn-sm" onClick={() => cancel(b)}><Ban aria-hidden="true" /> Cancelar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Loading>
    </Window>
  )
}
