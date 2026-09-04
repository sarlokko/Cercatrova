import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  type Category,
  categoryLabel,
  deals,
  formatPrice,
  kindLabel,
} from '../data/deals'

const filters: Array<{ id: 'all' | Category; label: string }> = [
  { id: 'all', label: 'Tutto il radar' },
  { id: 'software', label: 'Software free' },
  { id: 'nas', label: 'NAS / Storage' },
  { id: 'gaming', label: 'Gaming free' },
]

function thumbLabel(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function HomePage() {
  const [filter, setFilter] = useState<'all' | Category>('all')

  const visible = useMemo(() => {
    const list = filter === 'all' ? deals : deals.filter((d) => d.category === filter)
    return [...list].sort((a, b) => b.discountPct - a.discountPct)
  }, [filter])

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
            Confronto negozi + storico prezzi + alert intelligenti. Niente rumore: solo gratis,
            minimi storici e cali veri.
          </p>
          <div className="hero__actions">
            <a className="btn btn-primary" href="#radar">
              Apri il radar
            </a>
            <Link className="btn btn-ghost" to="/monitora">
              Monitora un prodotto
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="radar">
        <div className="section__head">
          <h2>Deal Radar</h2>
          <p>
            Un unico motore che filtra internet per segnale: software che diventa gratis, NAS e
            storage al prezzo target, giochi gratis che valgono davvero.
          </p>
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

        <div className="deal-list">
          {visible.map((deal) => (
            <Link key={deal.id} to={`/prodotto/${deal.id}`} className="deal-row">
              <div className="deal-thumb" style={{ background: deal.imageTone }}>
                {thumbLabel(deal.title)}
              </div>
              <div className="deal-meta">
                <h3>{deal.title}</h3>
                <p>{deal.subtitle}</p>
                <div className="deal-tags">
                  <span
                    className={`tag${deal.kind === 'gratis' || deal.kind === 'errore' ? (deal.kind === 'errore' ? ' tag--alert' : ' tag--signal') : deal.kind === 'scade' ? ' tag--alert' : ''}`}
                  >
                    {kindLabel[deal.kind]}
                  </span>
                  <span className="tag">{categoryLabel[deal.category]}</span>
                  {deal.expiresAt ? <span className="tag">Scade {deal.expiresAt}</span> : null}
                </div>
              </div>
              <div className="deal-price">
                <div className={`deal-price__now${deal.isFree ? ' free' : ''}`}>
                  {formatPrice(deal.currentPrice, deal.currency)}
                </div>
                {!deal.isFree ? (
                  <div className="deal-price__was">
                    {formatPrice(deal.normalPrice, deal.currency)}
                  </div>
                ) : (
                  <div className="deal-price__was">
                    di solito {formatPrice(deal.normalPrice, deal.currency)}
                  </div>
                )}
                <div className="deal-price__delta">
                  {deal.isFree ? '100% risparmio' : `−${deal.discountPct}%`}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="come-funziona">
        <div className="section__head">
          <h2>Come funziona</h2>
          <p>
            Unisce ciò che fai con Trovaprezzi e CamelCamelCamel: confronti i negozi, leggi lo
            storico, imposti il prezzo target. Il resto lo fa il radar.
          </p>
        </div>
        <div className="steps">
          <article className="step">
            <div className="step__n">01</div>
            <h3>Cerchi o segui</h3>
            <p>
              Incolli un link Amazon/negozio oppure sfogli il radar per categoria: software free,
              NAS/HDD/SSD/RAM, gaming free.
            </p>
          </article>
          <article className="step">
            <div className="step__n">02</div>
            <h3>Confronti e storicizzi</h3>
            <p>
              Vedi i prezzi tra merchant, la media e il minimo a 6 mesi. Capisci subito se è un
              affare o rumore.
            </p>
          </article>
          <article className="step">
            <div className="step__n">03</div>
            <h3>Ricevi solo il segnale</h3>
            <p>
              Alert quando scende al tuo target, diventa gratis, batte il minimo storico o sta per
              scadere. Niente spam di offerte qualunque.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="split">
          <div className="section__head" style={{ marginBottom: 0 }}>
            <h2>Il filtro, non la categoria</h2>
            <p>
              Non siamo un altro canale hardware o AI news. Cerchiamo cose che diventano gratis,
              calano dell’80%+, errori di prezzo, coupon nascosti e minimi storici — e te lo
              diciamo solo allora.
            </p>
          </div>
          <div className="split__visual" aria-hidden>
            <div className="bubble bubble--1">
              <strong>Gratis</strong>
              <span>Software da 49 € → 0 €</span>
            </div>
            <div className="bubble bubble--2">
              <strong>Minimo 6 mesi</strong>
              <span>WD Red Plus 12TB €179,90</span>
            </div>
            <div className="bubble bubble--3">
              <strong>Scade oggi</strong>
              <span>−80% o più, solo se vale</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
