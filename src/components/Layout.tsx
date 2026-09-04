import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

function BrandMark() {
  return (
    <span className="brand__mark" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="#9ef01a" strokeWidth="1.4" opacity="0.4" />
        <circle cx="12" cy="12" r="4.5" stroke="#9ef01a" strokeWidth="1.4" opacity="0.7" />
        <circle cx="12" cy="12" r="1.6" fill="#9ef01a" />
        <path d="M12 12L18.5 5.5" stroke="#9ef01a" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="site-header__inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <BrandMark />
          Cercatrova
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={open}
          aria-label="Apri menu"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>

        <nav className={`nav-links${open ? ' open' : ''}`} aria-label="Principale">
          <NavLink to="/" end onClick={() => setOpen(false)}>
            Radar
          </NavLink>
          <NavLink to="/monitora" onClick={() => setOpen(false)}>
            Monitora
          </NavLink>
          <a href="/#come-funziona" onClick={() => setOpen(false)}>
            Come funziona
          </a>
        </nav>

        <Link to="/monitora" className="nav-cta">
          <span className="nav-cta__dot" aria-hidden />
          Imposta alert
        </Link>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <strong>Cercatrova</strong>
          <p>Confronto prezzi + storico + alert. Solo il segnale utile.</p>
        </div>
        <p>Demo pubblica · dati di esempio · affiliate-ready</p>
      </div>
    </footer>
  )
}
