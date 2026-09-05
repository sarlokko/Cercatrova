import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PriceChart } from '../components/PriceChart'
import { VerdictCard } from '../components/VerdictCard'
import {
  categoryLabel,
  type Deal,
  formatCheckedAt,
  formatDealPrice,
  formatMerchantPrice,
  formatPrice,
  isPreorderDeal,
  kindLabel,
} from '../data/deals'
import { apiAddWatch, apiMe, apiProduct, apiRefresh, apiTelegramLink } from '../lib/api'
import { merchantOfferUrl } from '../lib/offers'
import { getTelegramPrefs, normalizeTelegramUser, saveTelegramPrefs } from '../lib/watchlist'

export function ProductPage() {
  const { id: rawId = '' } = useParams()
  const id = (() => {
    try {
      return decodeURIComponent(rawId).trim()
    } catch {
      return rawId.trim()
    }
  })()
  const prefs = getTelegramPrefs()
  const [deal, setDeal] = useState<Deal | undefined>()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [target, setTarget] = useState('')
  const [wantTelegram, setWantTelegram] = useState(Boolean(prefs?.username))
  const [telegram, setTelegram] = useState(prefs?.username ?? '')
  const [toast, setToast] = useState<string | null>(null)
  const [planNote, setPlanNote] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiProduct(id).then((p) => {
      if (!cancelled) {
        setDeal(p)
        setLoading(false)
      }
    })
    apiMe().then((me) => {
      if (me && !cancelled) {
        setPlanNote(`${me.used}/${me.limit} monitoraggi (${me.plan === 'plus' ? 'Plus' : 'gratis'})`)
      }
    })
    return () => {
      cancelled = true
    }
  }, [id])

  const suggested = useMemo(() => {
    if (!deal) return ''
    if (deal.isFree || deal.category === 'android' || deal.category === 'ios') return '0'
    if (deal.priceUnknown) return ''
    if (deal.minPrice6m > 0) {
      return Math.max(0, Math.round(deal.minPrice6m * 0.98 * 100) / 100).toString()
    }
    return deal.currentPrice > 0 ? String(deal.currentPrice) : ''
  }, [deal])

  if (loading) {
    return (
      <div className="detail-page">
        <Link to="/" className="back-link">
          ← Torna alla cerca
        </Link>
        <p>Leggo i negozi…</p>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="detail-page">
        <Link to="/" className="back-link">
          ← Torna alla cerca
        </Link>
        <h1>Prodotto non trovato</h1>
        <p>Torna alla ricerca e scrivi il modello.</p>
      </div>
    )
  }

  const onRefresh = async () => {
    setRefreshing(true)
    const next = await apiRefresh(deal.id)
    if (next) setDeal(next)
    setRefreshing(false)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const price = Number(target || suggested || 0)
    if (wantTelegram && !telegram.trim()) {
      setToast('Inserisci il tuo @username Telegram oppure collega il bot.')
      return
    }
    const tg = wantTelegram ? normalizeTelegramUser(telegram) : ''
    if (tg) saveTelegramPrefs({ username: tg, linkedAt: new Date().toISOString() })
    try {
      await apiAddWatch({
        productId: deal.id,
        title: deal.title,
        query: deal.title,
        category: deal.category,
        targetPrice: price,
        telegram: tg || undefined,
        notify: wantTelegram ? 'telegram' : 'none',
      })
      setToast(
        wantTelegram
          ? `Monitoraggio sul server sotto ${formatPrice(price, deal.currency)}. Collega il bot se non l’hai già fatto.`
          : `Monitoraggio sul server sotto ${formatPrice(price, deal.currency)}.`,
      )
      const me = await apiMe()
      if (me) setPlanNote(`${me.used}/${me.limit} monitoraggi`)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Limite raggiunto.')
    }
  }

  const connectBot = async () => {
    const tg = normalizeTelegramUser(telegram)
    if (tg) saveTelegramPrefs({ username: tg, linkedAt: new Date().toISOString() })
    try {
      const link = await apiTelegramLink()
      window.open(link.url, '_blank', 'noopener,noreferrer')
      setToast(
        link.configured
          ? 'Apri Telegram e premi Avvia: la chat si collega al server.'
          : 'Bot non configurato sul server (manca TELEGRAM_BOT_TOKEN). Il monitoraggio è comunque salvato.',
      )
    } catch {
      setToast('Impossibile creare il link Telegram.')
    }
  }

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">
        ← Torna alla cerca
      </Link>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="deal-tags">
            <span className="tag tag--signal">{deal.verdict?.label ?? kindLabel[deal.kind]}</span>
            <span className="tag">{categoryLabel[deal.category]}</span>
            {deal.live ? <span className="tag">live</span> : null}
            {deal.tags.slice(0, 4).map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>

          <h1>{deal.title}</h1>
          <p>{deal.subtitle}</p>
          <p className="field-hint" style={{ marginBottom: '1rem' }}>
            {deal.priceUnknown
              ? 'Prezzo non disponibile: meglio nessuna cifra che un numero fermo nel repo.'
              : `Ultimo rilievo ${formatCheckedAt(deal.checkedAt.slice(0, 10))}. Il totale in cassa è del negozio.`}
          </p>

          {deal.verdict ? <VerdictCard verdict={deal.verdict} /> : null}

          <div className="price-board">
            <div
              className={`price-board__now${deal.isFree ? ' free' : ''}${deal.priceUnknown ? ' unknown' : ''}`}
            >
              {formatDealPrice(deal)}
            </div>
            {deal.normalPrice > 0 && !deal.priceUnknown ? (
              <div className="price-stat">
                Listino / normale
                <strong>{formatPrice(deal.normalPrice, deal.currency)}</strong>
              </div>
            ) : null}
            {!deal.priceUnknown && deal.avgPrice > 0 ? (
              <div className="price-stat">
                Media osservata
                <strong>{formatPrice(deal.avgPrice, deal.currency)}</strong>
              </div>
            ) : null}
            {!deal.priceUnknown && deal.minPrice6m > 0 ? (
              <div className="price-stat">
                Minimo osservato
                <strong>{formatPrice(deal.minPrice6m, deal.currency)}</strong>
              </div>
            ) : null}
          </div>

          <div className="chart-head-row">
            <PriceChart history={deal.history} avgPrice={deal.avgPrice} currency={deal.currency} />
            {deal.history.length < 2 ? (
              <p className="field-hint">
                Il grafico si riempie con i rilevamenti veri. Un punto solo = storico in costruzione.
              </p>
            ) : null}
          </div>

          <div className="merchant-head">
            <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Negozi</h2>
            <button type="button" className="btn btn-ghost" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? 'Aggiorno…' : 'Aggiorna prezzi'}
            </button>
          </div>
          <div className="merchants">
            {deal.merchants.map((m) => (
              <div key={m.name} className="merchant-row">
                <div>
                  <strong>{m.name}</strong>
                  {m.shipping ? <span> · {m.shipping}</span> : null}
                </div>
                <div className="merchant-row__price">{formatMerchantPrice(deal, m)}</div>
                <a
                  className="btn btn-ghost"
                  href={merchantOfferUrl(m, deal)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {isPreorderDeal(deal) && /xbox|playstation/i.test(m.name) ? 'Preordina' : 'Compra'}
                </a>
              </div>
            ))}
          </div>
        </div>

        <aside className="detail-side">
          <form className="alert-card" onSubmit={onSubmit}>
            <h2>Monitora</h2>
            <p>
              Salvato sul server, non solo nel browser. {planNote || '3 monitoraggi nel piano gratis.'}
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
              Notifica Telegram (target + prezzo eccezionale)
            </label>
            {wantTelegram ? (
              <>
                <label htmlFor="tg-user">Username Telegram (facoltativo)</label>
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
                  style={{
                    width: '100%',
                    marginBottom: '0.85rem',
                    color: '#eefae6',
                    borderColor: 'rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                  onClick={connectBot}
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
