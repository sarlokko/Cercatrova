import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BrandMark, BRAND_NAME } from './BrandMark'

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
          <BrandMark size={34} />
          <span className="brand__text">
            <span className="brand__il">Il</span> Cerca-Trova
          </span>
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
          <NavLink to="/cerca" onClick={() => setOpen(false)}>
            Cerca
          </NavLink>
          <a href={`${import.meta.env.BASE_URL}#come-funziona`} onClick={() => setOpen(false)}>
            Come funziona
          </a>
        </nav>

        <Link to="/cerca" className="nav-cta">
          <span className="nav-cta__dot" aria-hidden />
          Cerca + Telegram
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
          <strong>{BRAND_NAME}</strong>
          <p>Cerca anche fuori offerta: NAS, Steam, Android e iOS. Poi l’alert.</p>
        </div>
        <p>Demo · prezzi hardware allineati ai listini pubblici (sett. 2026), non in tempo reale.</p>
      </div>
    </footer>
  )
}
