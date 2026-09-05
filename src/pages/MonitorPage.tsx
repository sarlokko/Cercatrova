import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DealRow } from '../components/DealRow'
import { type Category, type Deal, categoryLabel, formatPrice } from '../data/deals'
import {
  apiAddWatch,
  apiMe,
  apiRemoveWatch,
  apiSearch,
  apiTelegramLink,
  apiUnlockPlus,
  apiWatches,
  type Me,
  type WatchDto,
} from '../lib/api'
import { genericSuggestions, type SearchMode } from '../lib/search'
import { getTelegramPrefs, normalizeTelegramUser, saveTelegramPrefs } from '../lib/watchlist'

export function MonitorPage() {
  const prefs = getTelegramPrefs()
  const [watches, setWatches] = useState<WatchDto[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [mode, setMode] = useState<SearchMode>('generico')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | Category>('all')
  const [maxPrice, setMaxPrice] = useState('')
  const [onlyFree, setOnlyFree] = useState(false)
  const [wantTelegram, setWantTelegram] = useState(Boolean(prefs?.username))
  const [telegram, setTelegram] = useState(prefs?.username ?? '')
  const [toast, setToast] = useState<string | null>(null)
  const [results, setResults] = useState<Deal[]>([])
  const [searching, setSearching] = useState(false)
  const [plusKey, setPlusKey] = useState('')

  const maxPriceNum = maxPrice.trim() === '' ? null : Number(maxPrice)

  const refreshMe = async () => {
    const [nextMe, nextWatches] = await Promise.all([apiMe(), apiWatches()])
    setMe(nextMe)
    setWatches(nextWatches)
  }

  useEffect(() => {
    refreshMe()
  }, [])

  useEffect(() => {
    let cancelled = false
    setSearching(true)
    apiSearch({
      query,
      mode,
      category,
      maxPrice: Number.isFinite(maxPriceNum as number) ? maxPriceNum : null,
      onlyFree,
    }).then((rows) => {
      if (!cancelled) {
        setResults(rows)
        setSearching(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [query, mode, category, maxPriceNum, onlyFree])

  const onSaveAlert = async (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q && category === 'all' && !onlyFree) {
      setToast('Scrivi cosa cerchi oppure scegli una categoria.')
      return
    }
    if (maxPrice.trim() !== '' && (maxPriceNum == null || Number.isNaN(maxPriceNum))) {
      setToast('Limite prezzo non valido.')
      return
    }
    const target = maxPriceNum == null || Number.isNaN(maxPriceNum) ? 0 : maxPriceNum
    if (wantTelegram && !telegram.trim()) {
      setToast('Inserisci @username oppure collega il bot.')
      return
    }
    const tg = wantTelegram ? normalizeTelegramUser(telegram) : ''
    if (tg) saveTelegramPrefs({ username: tg, linkedAt: new Date().toISOString() })
    const label = q || (category !== 'all' ? categoryLabel[category] : onlyFree ? 'Solo gratis' : 'Ricerca')
    try {
      await apiAddWatch({
        productId: results[0]?.id,
        title: label,
        query: q || undefined,
        category,
        targetPrice: target,
        telegram: tg || undefined,
        notify: wantTelegram ? 'telegram' : 'none',
      })
      setToast('Monitoraggio salvato sul server.')
      await refreshMe()
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Limite raggiunto.')
    }
  }

  const openTelegramBot = async () => {
    const tg = normalizeTelegramUser(telegram)
    if (tg) saveTelegramPrefs({ username: tg, linkedAt: new Date().toISOString() })
    try {
      const link = await apiTelegramLink()
      window.open(link.url, '_blank', 'noopener,noreferrer')
      setWantTelegram(true)
      setToast(
        link.configured
          ? 'Apri il bot e premi Avvia: da quel momento gli alert partono dal server.'
          : 'Manca TELEGRAM_BOT_TOKEN sul NAS. Il watch è comunque nel database.',
      )
    } catch {
      setToast('Link Telegram non disponibile.')
    }
  }

  const unlock = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await apiUnlockPlus(plusKey.trim())
      setToast('Cercatrova Plus attivo su questo dispositivo.')
      await refreshMe()
    } catch {
      setToast('Codice Plus non valido.')
    }
  }

  return (
    <div className="section" style={{ paddingTop: '2rem' }}>
      <div className="section__head">
        <h2>Monitora</h2>
        <p>
          La cerca guidata sta in home. Qui salvi l’alert sul server:{' '}
          {me ? `${me.used}/${me.limit}` : '…'} slot
          {me?.telegram?.linked ? ' · Telegram collegato' : ''}.
        </p>
      </div>

      <form className="search-panel" onSubmit={onSaveAlert}>
        <div className="mode-toggle" role="group" aria-label="Tipo di ricerca">
          <button
            type="button"
            className={`mode-btn${mode === 'generico' ? ' active' : ''}`}
            onClick={() => setMode('generico')}
          >
            Generica
            <span>Categoria / bisogno</span>
          </button>
          <button
            type="button"
            className={`mode-btn${mode === 'specifico' ? ' active' : ''}`}
            onClick={() => setMode('specifico')}
          >
            Specifica
            <span>prodotto / modello</span>
          </button>
        </div>

        <label htmlFor="search-query">
          {mode === 'generico' ? 'Cosa ti serve?' : 'Prodotto esatto'}
        </label>
        <input
          id="search-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            mode === 'generico'
              ? 'Es. nas 2 bay, gta vi, giochi android…'
              : 'Es. UGREEN DXP2800, Stardew Valley…'
          }
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        {mode === 'generico' ? (
          <div className="suggest-row" aria-label="Suggerimenti">
            {genericSuggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                className="suggest-chip"
                onClick={() => {
                  setQuery(s.query)
                  setCategory(s.category)
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="field-row field-row--3">
          <div>
            <label htmlFor="search-category">Categoria</label>
            <select
              id="search-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as 'all' | Category)}
            >
              <option value="all">Tutte</option>
              <option value="nas">NAS / Storage</option>
              <option value="pc">Componenti PC</option>
              <option value="software">Software</option>
              <option value="steam">Giochi (Steam / PS / Xbox)</option>
              <option value="android">Android (Play Store)</option>
              <option value="ios">iOS (App Store)</option>
            </select>
          </div>
          <div>
            <label htmlFor="search-max">Limite prezzo (€, vuoto = nessuno)</label>
            <input
              id="search-max"
              type="number"
              min={0}
              step="0.01"
              placeholder="es. 299"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <div className="check-field">
            <label className="check-label" htmlFor="only-free">
              <input
                id="only-free"
                type="checkbox"
                checked={onlyFree}
                onChange={(e) => setOnlyFree(e.target.checked)}
              />
              Solo gratis / 0 €
            </label>
          </div>
        </div>

        <div className="telegram-box">
          <label className="check-label" htmlFor="want-tg">
            <input
              id="want-tg"
              type="checkbox"
              checked={wantTelegram}
              onChange={(e) => setWantTelegram(e.target.checked)}
            />
            Telegram: target e prezzo eccezionale (media −15%)
          </label>
          {wantTelegram ? (
            <div className="telegram-row">
              <input
                aria-label="Username Telegram"
                placeholder="@username"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
              />
              <button type="button" className="btn btn-ghost" onClick={openTelegramBot}>
                Collega bot
              </button>
            </div>
          ) : null}
          <p className="field-hint">
            {me?.telegram?.configured
              ? 'Il bot è configurato sul server. Premi Avvia in Telegram per associare la chat.'
              : 'Imposta TELEGRAM_BOT_TOKEN nel compose del NAS per le notifiche vere.'}
          </p>
        </div>

        <div className="search-actions">
          <button className="btn btn-primary" type="submit">
            Salva monitoraggio
          </button>
          <p className="results-count">
            {searching
              ? 'Cerco…'
              : `${results.length} risultat${results.length === 1 ? 'o' : 'i'} · ${me ? `${me.used}/${me.limit} slot` : ''}`}
          </p>
        </div>
        {toast ? <div className="toast">{toast}</div> : null}
      </form>

      <div className="plus-box">
        <div>
          <strong>Cercatrova Plus · 2,99 €/mese</strong>
          <p>
            20 monitoraggi, Telegram, storico e alert “prezzo eccezionale”. La cerca resta gratis.
            Pagamento in-app arriva dopo: sul NAS sblocchi con PLUS_KEY.
          </p>
        </div>
        <form onSubmit={unlock} className="plus-form">
          <input
            placeholder="Codice Plus"
            value={plusKey}
            onChange={(e) => setPlusKey(e.target.value)}
            aria-label="Codice Plus"
          />
          <button className="btn btn-ghost" type="submit">
            Sblocca
          </button>
        </form>
      </div>

      <div className="search-results">
        <h3>Risultati</h3>
        {results.length === 0 && !searching ? (
          <p className="watch-empty">Nessun match. Togli “solo gratis” o allarga la query.</p>
        ) : (
          <div className="deal-list">
            {results.map((deal) => (
              <DealRow key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>

      <div className="watch-box" style={{ marginTop: '1.5rem' }}>
        <h3>Monitoraggi sul server</h3>
        {watches.length === 0 ? (
          <p className="watch-empty">
            Nessun alert ancora. Non sta più solo nel browser: chiudi la scheda e il motore continua.
          </p>
        ) : (
          watches.map((w) => (
            <div key={w.id} className="watch-item">
              <div>
                <strong>
                  {w.productId ? <Link to={`/prodotto/${encodeURIComponent(w.productId)}`}>{w.title}</Link> : w.title}
                </strong>
                <span>
                  {w.query ? `${w.query} · ` : ''}
                  {w.notify === 'telegram' ? `Telegram ${w.telegram || 'in collegamento'}` : 'senza canale'}
                  {' · '}
                  {new Date(w.createdAt).toLocaleDateString('it-IT')}
                </span>
              </div>
              <div>
                <div className="watch-item__target">≤ {formatPrice(w.targetPrice)}</div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: '0.4rem', padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                  onClick={async () => {
                    await apiRemoveWatch(w.id)
                    await refreshMe()
                  }}
                >
                  Rimuovi
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MonitorPage
