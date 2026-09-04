import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PriceChart } from '../components/PriceChart'
import {
  categoryLabel,
  formatPrice,
  getDeal,
  kindLabel,
} from '../data/deals'
import { merchantOfferUrl } from '../lib/offers'
import {
  addWatch,
  getTelegramPrefs,
  normalizeTelegramUser,
  saveTelegramPrefs,
  telegramBotStartUrl,
  type WatchItem,
} from '../lib/watchlist'

export function ProductPage() {
  const { id = '' } = useParams()
  const deal = getDeal(id)
  const prefs = getTelegramPrefs()
  const [target, setTarget] = useState('')
  const [wantTelegram, setWantTelegram] = useState(Boolean(prefs?.username))
  const [telegram, setTelegram] = useState(prefs?.username ?? '')
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
    if (wantTelegram && !telegram.trim()) {
      setToast('Inserisci il tuo @username Telegram.')
      return
    }
    const tg = wantTelegram ? normalizeTelegramUser(telegram) : ''
    if (tg) saveTelegramPrefs({ username: tg, linkedAt: new Date().toISOString() })

    const item: WatchItem = {
      id: deal.id,
      title: deal.title,
      targetPrice: price,
      telegram: tg || undefined,
      notify: wantTelegram ? 'telegram' : 'none',
      mode: 'specifico',
      category: deal.category,
      query: deal.title,
      createdAt: new Date().toISOString(),
      note: 'Prodotto specifico',
    }
    addWatch(item)
    setToast(
      wantTelegram
        ? `Alert Telegram attivo sotto ${formatPrice(price, deal.currency)} → ${tg}`
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
                <a
                  className="btn btn-ghost"
                  href={merchantOfferUrl(m, deal)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
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
              Limite di prezzo + opzione Telegram. Ti avvisiamo solo quando scende lì.
            </p>
            <label htmlFor="target">Limite prezzo (€)</label>
            <input
              id="target"
              type="number"
              min={0}
              step="0.01"
              placeholder={suggested}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <label className="check-label check-label--light" htmlFor="tg-product">
              <input
                id="tg-product"
                type="checkbox"
                checked={wantTelegram}
                onChange={(e) => setWantTelegram(e.target.checked)}
              />
              Notifica Telegram
            </label>
            {wantTelegram ? (
              <>
                <label htmlFor="tg-user">Username Telegram</label>
                <input
                  id="tg-user"
                  type="text"
                  placeholder="@username"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ width: '100%', marginBottom: '0.85rem', color: '#eefae6', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)' }}
                  onClick={() => {
                    const tg = normalizeTelegramUser(telegram)
                    if (tg) saveTelegramPrefs({ username: tg, linkedAt: new Date().toISOString() })
                    window.open(telegramBotStartUrl(`p_${deal.id}`), '_blank', 'noopener,noreferrer')
                  }}
                >
                  Collega bot Telegram
                </button>
              </>
            ) : null}
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
