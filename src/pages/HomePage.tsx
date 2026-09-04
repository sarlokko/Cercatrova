import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DealRow } from '../components/DealRow'
import { type Category, deals } from '../data/deals'
import { searchDeals } from '../lib/search'

const filters: Array<{ id: 'all' | Category; label: string }> = [
  { id: 'all', label: 'Tutto il radar' },
  { id: 'software', label: 'Software free' },
  { id: 'nas', label: 'NAS / Storage' },
  { id: 'gaming', label: 'Gaming free' },
]

export function HomePage() {
  const [filter, setFilter] = useState<'all' | Category>('all')
  const [query, setQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const deferredQuery = useDeferredValue(query)

  const visible = useMemo(() => {
    const max = maxPrice.trim() === '' ? null : Number(maxPrice)
    return searchDeals({
      query: deferredQuery,
      mode: deferredQuery.trim().split(/\s+/).length >= 3 ? 'specifico' : 'generico',
      category: filter,
      maxPrice: max != null && Number.isFinite(max) ? max : null,
      onlyFree: false,
    })
  }, [filter, deferredQuery, maxPrice])

  return (
    <>
      <section className="hero" aria-label="Hero">
        <div className="hero__radar" aria-hidden>
          <div className="hero__radar-ring" />
          <div className="hero__radar-ring" />
          <div className="hero__radar-ring" />
          <div className="hero__radar-ring" />
          <div className="hero__sweep" />
          <span className="hero__blip hero__blip--1" />
          <span className="hero__blip hero__blip--2" />
          <span className="hero__blip hero__blip--3" />
        </div>

        <div className="hero__content">
          <p className="hero__brand">
            <span>Cercatrova</span>
          </p>
          <h1 className="hero__headline">Ti avviso solo quando il prezzo è quello giusto.</h1>
          <p className="hero__lead">
            Cerca in modo generico o specifico, metti un limite di prezzo e ricevi l’alert su
            Telegram.
          </p>
          <div className="hero__actions">
            <a className="btn btn-primary" href="#radar">
              Cerca nel radar
            </a>
            <Link className="btn btn-ghost" to="/cerca">
              Alert Telegram
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="radar">
        <div className="section__head">
          <h2>Deal Radar</h2>
          <p>
            Filtra per testo, categoria e prezzo massimo. Poi salva la ricerca con notifica
            Telegram dalla pagina Cerca.
          </p>
        </div>

        <div className="radar-search">
          <label className="sr-only" htmlFor="radar-q">
            Cerca offerte
          </label>
          <input
            id="radar-q"
            className="radar-search__input"
            placeholder="Cerca: HDD NAS, Synology, lifetime, gratis…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            list="radar-suggestions"
          />
          <datalist id="radar-suggestions">
            {deals.map((d) => (
              <option key={d.id} value={d.title} />
            ))}
          </datalist>
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
          {visible.length} risultat{visible.length === 1 ? 'o' : 'i'}
        </p>

        <div className="deal-list">
          {visible.length === 0 ? (
            <p className="watch-empty">Nessun risultato con questi filtri.</p>
          ) : (
            visible.map((deal) => <DealRow key={deal.id} deal={deal} />)
          )}
        </div>

        <div className="inline-cta">
          <p>Vuoi essere avvisato su Telegram quando scende sotto il tuo budget?</p>
          <Link className="btn btn-primary" to="/cerca">
            Imposta ricerca + Telegram
          </Link>
        </div>
      </section>

      <section className="section" id="come-funziona">
        <div className="section__head">
          <h2>Come funziona</h2>
          <p>
            Unisce Trovaprezzi e CamelCamelCamel: cerchi (generico o specifico), confronti i
            negozi, imposti il limite e ricevi solo il segnale utile.
          </p>
        </div>
        <div className="steps">
          <article className="step">
            <div className="step__n">01</div>
            <h3>Cerchi</h3>
            <p>
              Generico (“HDD 12TB per NAS”) o specifico (“WD Red Plus 12TB”), con categoria e
              prezzo massimo.
            </p>
          </article>
          <article className="step">
            <div className="step__n">02</div>
            <h3>Confronti</h3>
            <p>
              Vedi merchant, media e minimo a 6 mesi. Capisci subito se è un affare o rumore.
            </p>
          </article>
          <article className="step">
            <div className="step__n">03</div>
            <h3>Ti avvisiamo</h3>
            <p>
              Alert Telegram (o in-app) solo quando scende sotto il tuo limite, diventa gratis o
              batte il minimo storico.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="split">
          <div className="section__head" style={{ marginBottom: 0 }}>
            <h2>Il filtro, non la categoria</h2>
            <p>
              Non un altro canale di offerte random. Tu definisci cosa cerchi e il tetto di spesa:
              il radar elimina il rumore.
            </p>
          </div>
          <div className="split__visual" aria-hidden>
            <div className="bubble bubble--1">
              <strong>Generico</strong>
              <span>HDD NAS sotto 180 €</span>
            </div>
            <div className="bubble bubble--2">
              <strong>Specifico</strong>
              <span>WD Red Plus 12TB</span>
            </div>
            <div className="bubble bubble--3">
              <strong>Telegram</strong>
              <span>Solo al prezzo giusto</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
