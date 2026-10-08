import { useState } from 'react'
import { CalendarDays, Clock, GraduationCap, Pencil, Plus, Power, Printer, RefreshCw, Users } from 'lucide-react'
import { api, qs } from '../api.js'
import { Box, Window, Avatar, Badge, DAYS, Loading, daysText, shortDate, today, useApi, useMessage } from '../components/ui.jsx'

const EMPTY = { curso: '', titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '', hora_inicio: '08:00', hora_fin: '18:00', dias: ['1', '2', '3', '4', '5'] }

export default function Tutorias() {
  const [filters, setFilters] = useState({ buscar: '', curso: '' })
  const { data, loading, error, reload } = useApi(`tutorias.php?${qs(filters)}`)
  const courses = useApi('tutorias.php?accion=cursos')
  const tutors = useApi('usuarios.php?rol=tutor&estado=1')
  const [form, setForm] = useState(null)
  const [assign, setAssign] = useState(null)    // { codigo, titulo, tutores: [ids] }
  const { run, view } = useMessage()

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const toggleDay = (d) => setForm({ ...form, dias: form.dias.includes(d) ? form.dias.filter((x) => x !== d) : [...form.dias, d] })

  const save = (e) => {
    e.preventDefault()
    run(() => form.codigo
      ? api(`tutorias.php?id=${form.codigo}`, { method: 'PUT', body: form })
      : api('tutorias.php', { method: 'POST', body: form }),
    () => { setForm(null); reload() })
  }

  const edit = (t) => {
    setAssign(null)
    setForm({
      codigo: t.codigo, curso: t.curso_codigo, titulo: t.titulo, descripcion: t.descripcion ?? '',
      fecha_inicio: t.fecha_inicio, fecha_fin: t.fecha_fin, hora_inicio: t.hora_inicio, hora_fin: t.hora_fin, dias: t.dias.split(','),
    })
  }

  const openAssign = async (t) => {
    setForm(null)
    const json = await api(`tutorias.php?id=${t.codigo}`)
    setAssign({ codigo: t.codigo, titulo: t.titulo, tutores: json.data.tutores.map((x) => x.codigo) })
  }

  const toggleTutor = (id) => setAssign({
    ...assign,
    tutores: assign.tutores.includes(id) ? assign.tutores.filter((x) => x !== id) : [...assign.tutores, id],
  })

  const saveAssign = (e) => {
    e.preventDefault()
    run(() => api(`tutorias.php?id=${assign.codigo}&accion=tutores`, { method: 'PUT', body: { tutores: assign.tutores } }),
      () => { setAssign(null); reload() })
  }

  return (
    <Window title="Tutorías del ciclo" icon={GraduationCap} footer={
      <>
        <button className="btn btn-lg" onClick={() => { setAssign(null); setForm({ ...EMPTY, fecha_inicio: today() }) }}><Plus className="ok" aria-hidden="true" /> Nueva tutoría</button>
        <button className="btn btn-lg" type="button"><Printer aria-hidden="true" /> Imprimir listado</button>
        <button className="btn btn-lg" onClick={reload}><RefreshCw className="ok" aria-hidden="true" /> Actualizar</button>
      </>
    }>
      <div className="stack">{view}</div>

      {form && (
        <form onSubmit={save}>
          <Box title={form.codigo ? 'Editar tutoría' : 'Nueva tutoría'}>
          <div className="form-grid">
            <label className="field">Curso del pensum
              <select name="curso" value={form.curso} onChange={change} required>
                <option value="">Seleccione…</option>
                {courses.data.map((c) => <option key={c.codigo} value={c.codigo}>{c.clave} · {c.nombre} (ciclo {c.ciclo})</option>)}
              </select>
            </label>
            <label className="field">Título<input name="titulo" value={form.titulo} onChange={change} required maxLength={150} /></label>
            <label className="field full">Descripción <small>opcional</small><textarea name="descripcion" rows="2" value={form.descripcion} onChange={change} /></label>

            <label className="field">Desde<input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={change} required /></label>
            <label className="field">Hasta<input name="fecha_fin" type="date" min={form.fecha_inicio} value={form.fecha_fin} onChange={change} required /></label>
            <label className="field">Franja: hora de inicio<input name="hora_inicio" type="time" value={form.hora_inicio} onChange={change} required /></label>
            <label className="field">Franja: hora de fin<input name="hora_fin" type="time" value={form.hora_fin} onChange={change} required /></label>

            <fieldset className="days full">
              <legend>Días en que se imparte</legend>
              {DAYS.map(([value, label]) => (
                <label className="day" key={value}>
                  <input type="checkbox" checked={form.dias.includes(value)} onChange={() => toggleDay(value)} />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>

            <div className="form-actions">
              <button className="btn btn-navy">Guardar</button>
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancelar</button>
            </div>
          </div>
          </Box>
        </form>
      )}

      {assign && (
        <form onSubmit={saveAssign}>
          <Box title={`Catedráticos de “${assign.titulo}”`}>
          <fieldset className="checks">
            <legend className="sr-only">Catedráticos</legend>
            {tutors.data.map((t) => (
              <label key={t.codigo} className="check">
                <input type="checkbox" checked={assign.tutores.includes(t.codigo)} onChange={() => toggleTutor(t.codigo)} />
                <Avatar src={t.avatar} name={t.nombre} />
                {t.nombre}
              </label>
            ))}
          </fieldset>
          <div className="form-actions">
            <button className="btn btn-navy">Guardar asignación</button>
            <button type="button" className="btn" onClick={() => setAssign(null)}>Cancelar</button>
          </div>
          </Box>
        </form>
      )}

      <Box title="Filtros de búsqueda">
        <div className="filters">
          <label>Buscar:<input type="search" placeholder="Título o curso" value={filters.buscar}
            onChange={(e) => setFilters({ ...filters, buscar: e.target.value })} /></label>
          <label>Curso:
            <select value={filters.curso} onChange={(e) => setFilters({ ...filters, curso: e.target.value })}>
              <option value="">Todos</option>
              {courses.data.map((c) => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
            </select>
          </label>
        </div>
      </Box>

        <Loading show={loading} error={error} empty={!data.length}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>No.</th><th>Tutoría</th><th>Rango</th><th>Catedráticos</th><th>Horarios libres</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>
                {data.map((t, i) => (
                  <tr key={t.codigo}>
                    <td className="num">{i + 1}</td>
                    <td><strong>{t.titulo}</strong><small className="code" style={{ display: 'block' }}>{t.curso_clave} · {t.curso}</small></td>
                    <td>
                      <div className="meta" style={{ display: 'grid', gap: '.2rem' }}>
                        <span><CalendarDays aria-hidden="true" /> {shortDate(t.fecha_inicio)} – {shortDate(t.fecha_fin)}</span>
                        <span><Clock aria-hidden="true" /> {t.hora_inicio} – {t.hora_fin} · {daysText(t.dias)}</span>
                      </div>
                    </td>
                    <td>{t.total_tutores}</td>
                    <td>{t.bloques_disponibles}</td>
                    <td><Badge value={t.estado} /></td>
                    <td className="actions">
                      <button className="btn btn-sm" onClick={() => edit(t)}><Pencil aria-hidden="true" /> Editar</button>
                      <button className="btn btn-sm" onClick={() => openAssign(t)}><Users aria-hidden="true" /> Catedráticos</button>
                      <button className="btn btn-sm" aria-label={t.estado ? 'Desactivar' : 'Activar'} title={t.estado ? 'Desactivar' : 'Activar'}
                        onClick={() => run(() => api(`tutorias.php?id=${t.codigo}&accion=estado`, { method: 'PUT', body: { estado: t.estado ? 0 : 1 } }), reload)}>
                        <Power aria-hidden="true" />
                      </button>
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
