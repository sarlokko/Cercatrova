import { useDeferredValue, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { DealRow } from '../components/DealRow'
import { type Category, type Deal } from '../data/deals'
import { apiSearch } from '../lib/api'

const filters: Array<{ id: 'all' | Category; label: string }> = [
  { id: 'all', label: 'Tutto' },
  { id: 'nas', label: 'NAS / Storage' },
  { id: 'software', label: 'Software' },
  { id: 'steam', label: 'Steam / PC' },
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
]

export function HomePage() {
  const [filter, setFilter] = useState<'all' | Category>('all')
  const [query, setQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [visible, setVisible] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const max = maxPrice.trim() === '' ? null : Number(maxPrice)
    let cancelled = false
    setLoading(true)
    apiSearch({
      query: deferredQuery,
      mode: 'generico',
      category: filter,
      maxPrice: max != null && Number.isFinite(max) ? max : null,
      onlyFree: false,
    }).then((rows) => {
      if (!cancelled) {
        setVisible(rows)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [filter, deferredQuery, maxPrice])

  return (
    <>
      <section className="hero" aria-label="Hero">
        <div className="hero__content">
          <div className="hero__brand-row">
            <BrandMark size={52} className="hero__mark" />
            <p className="hero__brand">
              Il <em>Cerca-Trova</em>
            </p>
          </div>
          <h1 className="hero__headline">È questo il momento giusto per comprarlo?</h1>
          <p className="hero__lead">
            Non un altro Trovaprezzi. Cerchi il prodotto — anche a listino — e Cercatrova ti dice
            se conviene adesso, o se aspettare l’alert.
          </p>
          <div className="hero__actions">
            <a className="btn btn-primary" href="#radar">
              Cerca ora
            </a>
            <Link className="btn btn-ghost" to="/cerca">
              Monitora + Telegram
            </Link>
          </div>
        </div>

        <aside className="hero__ticket" aria-hidden>
          <div className="ticket">
            <span className="ticket__stamp">Conviene?</span>
            <p>UGREEN DXP2800</p>
            <strong>Abbastanza</strong>
            <small>Prezzo vs storico · non “dove costa meno”</small>
          </div>
        </aside>
      </section>

      <section className="section" id="radar">
        <div className="section__head">
          <h2>Cerca ora</h2>
          <p>
            Interroga Steam e, quando risponde, Amazon. Se il prezzo non è leggibile resta
            “non disponibile” — mai una cifra inventata.
          </p>
        </div>

        <p className="price-honesty">
          Trovaprezzi chiede dove costa meno. Cercatrova chiede se è il momento di comprarlo.
        </p>

        <div className="radar-search">
          <label className="sr-only" htmlFor="radar-q">
            Cerca
          </label>
          <input
            id="radar-q"
            className="radar-search__input"
            placeholder="Es. ugreen 2800, stardew, forest android…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <label className="sr-only" htmlFor="radar-max">
            Prezzo massimo
          </label>
          <input
            id="radar-max"
            className="radar-search__max"
            type="number"
            min={0}
            step="0.01"
            placeholder="Max €"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <div className="filters" role="tablist" aria-label="Categorie">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`filter-chip${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="results-count" style={{ marginBottom: '0.85rem' }}>
          {loading ? 'Cerco nei negozi…' : `${visible.length} risultat${visible.length === 1 ? 'o' : 'i'}`}
        </p>

        <div className="deal-list">
          {!loading && visible.length === 0 ? (
            <p className="watch-empty">Nessun risultato con questi filtri.</p>
          ) : (
            visible.map((deal) => <DealRow key={deal.id} deal={deal} />)
          )}
        </div>

        <div className="inline-cta">
          <p>Tre monitoraggi gratis. Poi Cercatrova Plus a 2,99 €/mese.</p>
          <Link className="btn btn-primary" to="/cerca">
            Imposta monitoraggio
          </Link>
        </div>
      </section>

      <section className="section" id="come-funziona">
        <div className="section__head">
          <h2>Come funziona</h2>
          <p>
            Cerchi ora, confronti col passato, monitori. L’alert arriva solo quando conviene — al
            tuo prezzo o a un prezzo eccezionale.
          </p>
        </div>
        <div className="steps">
          <article className="step">
            <div className="step__n">01</div>
            <h3>Cerchi ora</h3>
            <p>
              Generico o specifico. Steam risponde dal negozio. Amazon e il sito ufficiale quando
              il buybox è leggibile.
            </p>
          </article>
          <article className="step">
            <div className="step__n">02</div>
            <h3>Giudizio</h3>
            <p>
              Prezzo attuale, media, minimo, variazione. Cercatrova dice eccezionale, abbastanza o
              aspetta — non “il più basso di oggi”.
            </p>
          </article>
          <article className="step">
            <div className="step__n">03</div>
            <h3>Monitori</h3>
            <p>
              Alert Telegram vero, sul server. Sotto il tuo limite, o quando il prezzo è
              eccezionale rispetto allo storico.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="split">
          <div className="section__head" style={{ marginBottom: 0 }}>
            <h2>Non un altro canale di offerte</h2>
            <p>
              La ricerca è gratis. Il valore è il monitoraggio: 3 prodotti nel piano free, 20 con
              Plus. Affiliate sui “compra”, non paywall sulla cerca.
            </p>
          </div>
          <div className="split__visual" aria-hidden>
            <div className="bubble bubble--1">
              <strong>Cerca ora</strong>
              <span>Amazon · Steam · ufficiale</span>
            </div>
            <div className="bubble bubble--2">
              <strong>Conviene?</strong>
              <span>vs media e minimo</span>
            </div>
            <div className="bubble bubble--3">
              <strong>Telegram</strong>
              <span>Solo al momento giusto</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
