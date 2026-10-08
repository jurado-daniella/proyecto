import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BookOpen, CalendarDays, CircleCheck, FileText, GraduationCap, Menu, Search, Target, TrendingUp, User, Users, X,
} from 'lucide-react'
import { useApi } from '../components/ui.jsx'

const FEATURES = [
  [Users, 'Conecta', 'con catedráticos de tu curso.'],
  [CalendarDays, 'Organiza', 'tu tiempo con horarios claros.'],
  [TrendingUp, 'Mejora', 'tu rendimiento académico.'],
  [Target, 'Alcanza', 'tus metas de cada ciclo.'],
]

const STEPS = [
  [Search, 'Busca tu tutoría', 'Filtra por curso del pensum o por tema.'],
  [User, 'Elige catedrático', 'Mira quién la imparte y sus horarios.'],
  [FileText, 'Envía tu solicitud', 'Ves cuántos compañeros aplicaron al mismo horario.'],
  [CircleCheck, 'Recibe respuesta', 'El catedrático acepta y te llega el enlace.'],
]

export default function Landing() {
  const { data } = useApi('inicio.php')
  const stats = data.indicadores ?? {}
  const tutors = data.tutores ?? []
  const [menu, setMenu] = useState(false)

  return (
    <>
      <header className="site-nav">
        <div className="container">
          <a className="logo"><img src="assets/logo/dam-logo-horizontal.png" alt="DAM Tutorías y Asesorías Académicas" /></a>
          <nav aria-label="Secciones">
            <ul className="site-links" style={menu ? { display: 'grid', position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', padding: '1rem 16px', gap: '.5rem', borderBottom: '1px solid var(--line)' } : undefined}>
              <li><a className="active" onClick={() => setMenu(false)}>Inicio</a></li>
              <li><a onClick={() => setMenu(false)}>¿Cómo funciona?</a></li>
              <li><a onClick={() => setMenu(false)}>Beneficios</a></li>
              <li><a onClick={() => setMenu(false)}>Catedráticos</a></li>
            </ul>
          </nav>
          <div className="site-actions">
            <Link to="/login" className="btn btn-outline">Iniciar sesión</Link>
            <Link to="/registro" className="btn btn-red">Crear cuenta</Link>
            <button className="nav-toggle" onClick={() => setMenu(!menu)} aria-label="Menú" aria-expanded={menu}>{menu ? <X /> : <Menu />}</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <img className="hero-img" src="assets/personajes/estudiante-02.jpg" alt="Estudiante de la UMG revisando su tutoría en la laptop" />
          <div className="container">
            <div className="hero-copy">
              <span className="eyebrow dark"><GraduationCap size={18} aria-hidden="true" /> Facultad de Ingeniería en Sistemas</span>
              <h1>Tu conocimiento, <span>más cerca</span></h1>
              <p>Encuentra al catedrático indicado para el curso que se te complica, aparta un horario y recibe la tutoría desde donde estés.</p>
              <div className="hero-actions">
                <Link to="/registro" className="btn btn-red">Comenzar ahora <ArrowRight aria-hidden="true" /></Link>
                <a className="btn btn-outline">Conoce más</a>
              </div>
            </div>
          </div>
        </section>

        <section className="features" aria-label="Lo que ofrece DAM">
          <div className="container">
            {FEATURES.map(([Icon, title, text], i) => (
              <div className="feature" key={title}>
                <span className={`icon-circle ${i % 2 ? 'blue' : ''}`}><Icon aria-hidden="true" /></span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="section alt" id="como-funciona">
          <div className="container how">
            <div className="how-intro">
              <span className="eyebrow">¿Cómo funciona?</span>
              <div className="rule" />
              <h2>Cuatro pasos y listo</h2>
              <p className="section-lead" style={{ marginTop: '1rem' }}>La coordinación publica las tutorías del ciclo, cada catedrático marca sus horas libres y tú eliges la que te quede.</p>
              <Link to="/registro" className="btn btn-red">Crear mi cuenta <ArrowRight aria-hidden="true" /></Link>
            </div>
            <ol className="steps">
              {STEPS.map(([Icon, title, text], i) => (
                <li className="step" key={title}>
                  <span className={`icon-circle ${i % 2 ? 'blue' : ''}`}><Icon aria-hidden="true" /></span>
                  <span className="num" aria-hidden="true">{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="why" id="beneficios">
          <div className="why-copy">
            <div>
              <span className="eyebrow">¿Por qué DAM?</span>
              <div className="rule" />
              <h2>Apoyo académico cuando lo necesitas</h2>
              <p className="section-lead" style={{ marginTop: '1rem' }}>Desarrollo, Aprendizaje y Mejora: todas las tutorías de la facultad en un solo lugar, sin mensajes perdidos ni horarios cruzados.</p>
              <Link to="/registro" className="btn btn-red">Empezar <ArrowRight aria-hidden="true" /></Link>
            </div>
            {/* Cifras reales, calculadas en la base de datos */}
            <div className="stats">
              <div className="stat"><span className="icon-circle blue sm"><GraduationCap aria-hidden="true" /></span><div><strong>{stats.estudiantes ?? '–'}</strong><span>Estudiantes registrados</span></div></div>
              <div className="stat"><span className="icon-circle blue sm"><Users aria-hidden="true" /></span><div><strong>{stats.tutores ?? '–'}</strong><span>Catedráticos</span></div></div>
              <div className="stat"><span className="icon-circle blue sm"><BookOpen aria-hidden="true" /></span><div><strong>{stats.tutorias ?? '–'}</strong><span>Tutorías abiertas</span></div></div>
            </div>
          </div>
          <img className="why-img" src="assets/personajes/grupo-estudiantes.jpg" alt="Tres estudiantes de la UMG estudiando juntos frente a una laptop" />
        </section>

        {tutors.length > 0 && (
          <section className="section" id="catedraticos">
            <div className="container">
              <span className="eyebrow">Nuestro equipo</span>
              <div className="rule" />
              <h2>Catedráticos que te acompañan</h2>
              <div className="team">
                {tutors.map((t) => (
                  <article className="tutor-card" key={t.nombre}>
                    {t.avatar ? <img src={t.avatar} alt="" /> : null}
                    <div><h3>{t.nombre}</h3><p>{t.cursos}</p></div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="container">
          <div className="cta">
            <div className="cta-text">
              <GraduationCap aria-hidden="true" />
              <div><h2>¿Listo para tu próxima tutoría?</h2><p>Crea tu cuenta con tu carné y tu correo @miumg.edu.gt.</p></div>
            </div>
            <div className="cta-actions">
              <Link to="/registro" className="btn btn-red">Crear cuenta</Link>
              <Link to="/login" className="btn btn-outline-white">Iniciar sesión</Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <img src="assets/logo/dam-logo-horizontal-white.png" alt="DAM Tutorías y Asesorías Académicas" />
              <p style={{ marginTop: '1rem', maxWidth: 300 }}>Desarrollo, Aprendizaje y Mejora. Sistema de tutorías de la Universidad Mariano Gálvez de Guatemala.</p>
            </div>
            <div>
              <h4>Navegación</h4>
              <ul><li><a>Inicio</a></li><li><a>¿Cómo funciona?</a></li><li><a>Beneficios</a></li></ul>
            </div>
            <div>
              <h4>Acceso</h4>
              <ul><li><Link to="/login">Iniciar sesión</Link></li><li><Link to="/registro">Crear cuenta</Link></li></ul>
            </div>
            <div>
              <h4>Facultad</h4>
              <ul><li>Ingeniería en Sistemas de Información y Ciencias de la Computación</li></ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} DAM · Proyecto del curso Desarrollo Web, UMG.</span>
            <span>Formación que trasciende</span>
          </div>
        </div>
      </footer>
    </>
  )
}
