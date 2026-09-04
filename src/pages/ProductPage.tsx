import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PriceChart } from '../components/PriceChart'
import {
  categoryLabel,
  formatPrice,
  getDeal,
  kindLabel,
} from '../data/deals'
import { addWatch, type WatchItem } from '../lib/watchlist'

export function ProductPage() {
  const { id = '' } = useParams()
  const deal = getDeal(id)
  const [target, setTarget] = useState('')
  const [email, setEmail] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const suggested = useMemo(() => {
    if (!deal) return ''
    if (deal.isFree) return '0'
    return Math.max(0, Math.round(deal.minPrice6m * 0.98 * 100) / 100).toString()
  }, [deal])

  if (!deal) {
    return (
      <div className="detail-page">
        <Link to="/" className="back-link">
          ← Torna al radar
        </Link>
        <h1>Prodotto non trovato</h1>
        <p>Questo segnale non è più nel radar demo.</p>
      </div>
    )
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const price = Number(target || suggested)
    const item: WatchItem = {
      id: deal.id,
      title: deal.title,
      targetPrice: price,
      email: email.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
    addWatch(item)
    setToast(
      price === 0
        ? 'Alert attivo: ti avvisiamo quando torna gratis o a 0 €.'
        : `Alert attivo sotto ${formatPrice(price, deal.currency)}.`,
    )
  }

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">
        ← Torna al radar
      </Link>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="deal-tags">
            <span className="tag tag--signal">{kindLabel[deal.kind]}</span>
            <span className="tag">{categoryLabel[deal.category]}</span>
            {deal.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>

          <h1>{deal.title}</h1>
          <p>{deal.subtitle}</p>

          <div className="price-board">
            <div className={`price-board__now${deal.isFree ? ' free' : ''}`}>
              {formatPrice(deal.currentPrice, deal.currency)}
            </div>
            <div className="price-stat">
              Prezzo normale
              <strong>{formatPrice(deal.normalPrice, deal.currency)}</strong>
            </div>
            <div className="price-stat">
              Media recente
              <strong>{formatPrice(deal.avgPrice, deal.currency)}</strong>
            </div>
            <div className="price-stat">
              Minimo 6 mesi
              <strong>{formatPrice(deal.minPrice6m, deal.currency)}</strong>
            </div>
          </div>

          <PriceChart history={deal.history} avgPrice={deal.avgPrice} currency={deal.currency} />

          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Confronta i negozi</h2>
          <div className="merchants">
            {deal.merchants.map((m) => (
              <div key={m.name} className="merchant-row">
                <div>
                  <strong>{m.name}</strong>
                  {m.shipping ? <span> · {m.shipping}</span> : null}
                </div>
                <div className="merchant-row__price">
                  {formatPrice(m.price, deal.currency)}
                </div>
                <a className="btn btn-ghost" href={m.url}>
                  Vai all’offerta
                </a>
              </div>
            ))}
          </div>
        </div>

        <aside className="detail-side">
          <form className="alert-card" onSubmit={onSubmit}>
            <h2>Alert al prezzo giusto</h2>
            <p>
              Dimmi il target. Ti avvisiamo solo quando scende lì — non a ogni piccola oscillazione.
            </p>
            <label htmlFor="target">Prezzo target (€)</label>
            <input
              id="target"
              type="number"
              min={0}
              step="0.01"
              placeholder={suggested}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <label htmlFor="email">Email o Telegram (opzionale)</label>
            <input
              id="email"
              type="text"
              placeholder="tu@email.it oppure @username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Attiva monitoraggio
            </button>
            {toast ? <div className="toast">{toast}</div> : null}
          </form>
        </aside>
      </div>
    </div>
  )
}
