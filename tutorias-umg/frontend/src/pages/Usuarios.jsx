import { useState } from 'react'
import { Pencil, Plus, Power, RefreshCw, Users } from 'lucide-react'
import { api, qs } from '../api.js'
import { Avatar, Badge, Box, Loading, Window, useApi, useMessage } from '../components/ui.jsx'

const EMPTY = { usuario: '', nombre: '', correo: '', clave: '', rol: 'tutor' }
const ROLES = { admin: 'Coordinación', tutor: 'Catedrático', estudiante: 'Estudiante' }

export default function Usuarios({ currentUser }) {
  const [filters, setFilters] = useState({ rol: '', buscar: '' })
  const { data, loading, error, reload } = useApi(`usuarios.php?${qs(filters)}`)
  const [form, setForm] = useState(null)        // null = formulario cerrado
  const { run, view } = useMessage()

  const edit = (u) => setForm({ codigo: u.codigo, usuario: u.usuario, nombre: u.nombre, correo: u.correo, clave: '', rol: u.rol })
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const save = (e) => {
    e.preventDefault()
    run(() => form.codigo
      ? api(`usuarios.php?id=${form.codigo}`, { method: 'PUT', body: form })
      : api('usuarios.php', { method: 'POST', body: form }),
    () => { setForm(null); reload() })
  }

  const toggle = (u) => run(() => api(`usuarios.php?id=${u.codigo}&accion=estado`, { method: 'PUT', body: { estado: u.estado ? 0 : 1 } }), reload)

  return (
    <Window title="Administración de usuarios" icon={Users} footer={
      <>
        <button className="btn btn-lg" onClick={() => setForm({ ...EMPTY })}><Plus className="ok" aria-hidden="true" /> Nuevo usuario</button>
        <button className="btn btn-lg" onClick={reload}><RefreshCw className="ok" aria-hidden="true" /> Actualizar</button>
      </>
    }>
      <div className="stack">{view}</div>

      {form && (
        <form onSubmit={save}>
          <Box title={form.codigo ? 'Editar usuario' : 'Nuevo usuario'}>
          <div className="form-grid">
            <label className="field">Nombre completo<input name="nombre" value={form.nombre} onChange={change} required maxLength={120} /></label>
            <label className="field">Usuario o carné<input name="usuario" value={form.usuario} onChange={change} required maxLength={50} /></label>
            <label className="field">Correo<input name="correo" type="email" value={form.correo} onChange={change} required /></label>
            <label className="field">
              {form.codigo ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              <input name="clave" type="password" value={form.clave} onChange={change} minLength={8} required={!form.codigo} autoComplete="new-password" />
            </label>
            <label className="field">Rol
              <select name="rol" value={form.rol} onChange={change}>
                {Object.entries(ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
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
          <label>Buscar:<input type="search" placeholder="Nombre, carné o correo" value={filters.buscar}
            onChange={(e) => setFilters({ ...filters, buscar: e.target.value })} /></label>
          <label>Rol:
            <select value={filters.rol} onChange={(e) => setFilters({ ...filters, rol: e.target.value })}>
              <option value="">Todos</option>
              {Object.entries(ROLES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </Box>

        <Loading show={loading} error={error} empty={!data.length}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>No.</th><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>
                {data.map((u, i) => (
                  <tr key={u.codigo}>
                    <td className="num">{i + 1}</td>
                    <td><div className="person"><Avatar src={u.avatar} name={u.nombre} /><div>{u.nombre}<small>{u.correo}</small></div></div></td>
                    <td>{u.usuario}</td>
                    <td>{ROLES[u.rol]}</td>
                    <td><Badge value={u.estado} /></td>
                    <td className="actions">
                      <button className="btn btn-sm" onClick={() => edit(u)}><Pencil aria-hidden="true" /> Editar</button>
                      {u.codigo !== currentUser.id && (
                        <button className="btn btn-sm" onClick={() => toggle(u)}><Power aria-hidden="true" /> {u.estado ? 'Desactivar' : 'Activar'}</button>
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
