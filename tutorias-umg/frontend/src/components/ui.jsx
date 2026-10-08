import { useCallback, useEffect, useState } from 'react'
import { CircleCheck, CircleAlert, Inbox, Minus, Square, X } from 'lucide-react'
import { api } from '../api.js'

/** Carga datos de la API y expone reload() para refrescar tras un cambio. */
export function useApi(path) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!path) return
    setLoading(true)
    setError('')
    try {
      const json = await api(path)
      setData(json.data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => { reload() }, [reload])
  return { data, loading, error, reload }
}

/** Mensaje de éxito o error; aria-live para lectores de pantalla. */
export function Alert({ type = 'error', children, onClose }) {
  if (!children) return null
  const Icon = type === 'success' ? CircleCheck : CircleAlert
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'} aria-live="polite">
      <Icon aria-hidden="true" />
      <span>{children}</span>
      {onClose && <button type="button" className="close" onClick={onClose} aria-label="Cerrar mensaje"><X size={16} /></button>}
    </div>
  )
}

/** Hook para los mensajes de cada pantalla y para envolver acciones que llaman a la API. */
export function useMessage() {
  const [message, setMessage] = useState({})
  const run = async (request, onOk) => {
    setMessage({})
    try {
      const json = await request()
      setMessage({ ok: json.message })
      onOk?.(json)
      return true
    } catch (err) {
      setMessage({ error: err.message })
      return false
    }
  }
  const view = (
    <>
      <Alert type="success" onClose={() => setMessage({})}>{message.ok}</Alert>
      <Alert onClose={() => setMessage({})}>{message.error}</Alert>
    </>
  )
  return { run, view, setMessage }
}

export function Badge({ value }) {
  const labels = { 1: 'Activo', 0: 'Inactivo' }
  return <span className={`badge badge-${value}`}>{labels[value] ?? value}</span>
}

export function Loading({ show, error, empty, emptyText = 'No hay registros con esos filtros.', children }) {
  if (show) return <p className="muted">Cargando…</p>
  if (error) return <Alert>{error}</Alert>
  if (empty) return <div className="empty"><Inbox aria-hidden="true" /><p>{emptyText}</p></div>
  return children
}

/** Foto de perfil o iniciales si el usuario no tiene foto. */
export function Avatar({ src, name = '', size = '', dark = false }) {
  const initials = name.replace(/^(Ing|Inga|Lic|Licda|Dr|Dra)\.\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')
  const cls = `avatar ${size} ${dark ? 'dark' : ''}`
  return src ? <img className={cls} src={src} alt="" /> : <span className={cls} aria-hidden="true">{initials.toUpperCase()}</span>
}

const toDate = (iso) => new Date(iso + 'T00:00:00')

/** 2026-10-09 → "vie 09/10/2026" */
export const formatDate = (iso) =>
  toDate(iso).toLocaleDateString('es-GT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })

/** 2026-10-09 → "9 oct" */
export const shortDate = (iso) => toDate(iso).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })

export const DAYS = [['1', 'Lun'], ['2', 'Mar'], ['3', 'Mié'], ['4', 'Jue'], ['5', 'Vie'], ['6', 'Sáb'], ['7', 'Dom']]

/** "1,2,3,4,5" → "Lun a Vie";  "1,3,5" → "Lun, Mié, Vie" */
export function daysText(days = '') {
  const list = String(days).split(',').filter(Boolean)
  if (list.length === 7) return 'Todos los días'
  const names = list.map((d) => DAYS[d - 1][1])
  const consecutive = list.every((d, i) => i === 0 || Number(d) === Number(list[i - 1]) + 1)
  return consecutive && list.length > 2 ? `${names[0]} a ${names.at(-1)}` : names.join(', ')
}

export const today = () => new Date().toLocaleDateString('en-CA')   // YYYY-MM-DD en hora local

/** Panel con barra de título, al estilo de una ventana de programa de escritorio. */
export function Window({ title, icon: Icon, children, footer }) {
  return (
    <section className="window">
      <header className="window-bar">
        {Icon && <Icon aria-hidden="true" />}
        <h1 style={{ color: '#fff', fontSize: 'inherit', fontWeight: 400 }}>{title}</h1>
        <span className="controls" aria-hidden="true"><Minus size={16} /><Square size={14} /><X size={16} /></span>
      </header>
      <div className="window-body">{children}</div>
      {footer && <div className="window-foot">{footer}</div>}
    </section>
  )
}

/** Recuadro con título (fieldset). */
export const Box = ({ title, children, className = '' }) => (
  <fieldset className={`box ${className}`}><legend>{title}</legend>{children}</fieldset>
)
