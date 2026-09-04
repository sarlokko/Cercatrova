import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DealRow } from '../components/DealRow'
import { type Category, categoryLabel, formatPrice, getDeal } from '../data/deals'
import {
  genericSuggestions,
  searchDeals,
  type SearchMode,
} from '../lib/search'
import {
  addWatch,
  getTelegramPrefs,
  listWatches,
  normalizeTelegramUser,
  removeWatch,
  saveTelegramPrefs,
  telegramBotStartUrl,
  type WatchItem,
} from '../lib/watchlist'

export function MonitorPage() {
  const prefs = getTelegramPrefs()
  const [watches, setWatches] = useState<WatchItem[]>(() => listWatches())
  const [mode, setMode] = useState<SearchMode>('generico')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | Category>('all')
  const [maxPrice, setMaxPrice] = useState('')
  const [onlyFree, setOnlyFree] = useState(false)
  const [wantTelegram, setWantTelegram] = useState(Boolean(prefs?.username))
  const [telegram, setTelegram] = useState(prefs?.username ?? '')
  const [toast, setToast] = useState<string | null>(null)

  const maxPriceNum = maxPrice.trim() === '' ? null : Number(maxPrice)

  const results = useMemo(
    () =>
      searchDeals({
        query,
        mode,
        category,
        maxPrice: Number.isFinite(maxPriceNum as number) ? maxPriceNum : null,
        onlyFree,
      }),
    [query, mode, category, maxPriceNum, onlyFree],
  )

  const refresh = () => setWatches(listWatches())

  const onSaveAlert = (e: FormEvent) => {
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
      setToast('Inserisci il tuo @username Telegram.')
      return
    }

    const tg = wantTelegram ? normalizeTelegramUser(telegram) : ''
    if (tg) {
      saveTelegramPrefs({ username: tg, linkedAt: new Date().toISOString() })
    }

    const label =
      q ||
      (category !== 'all' ? categoryLabel[category] : onlyFree ? 'Solo gratis' : 'Ricerca')

    addWatch({
      id: `search-${Date.now()}`,
      title: label,
      targetPrice: target,
      query: q || undefined,
      mode,
      category,
      telegram: tg || undefined,
      notify: wantTelegram ? 'telegram' : 'none',
      createdAt: new Date().toISOString(),
      note: [
        mode === 'generico' ? 'Ricerca generica' : 'Ricerca specifica',
        category !== 'all' ? categoryLabel[category] : null,
        onlyFree ? 'solo gratis' : null,
        target > 0 ? `max ${formatPrice(target)}` : 'senza tetto',
      ]
        .filter(Boolean)
        .join(' · '),
    })

    setToast(
      wantTelegram
        ? `Alert salvato. Notifiche Telegram su ${tg}${target > 0 ? ` sotto ${formatPrice(target)}` : ''}.`
        : `Alert salvato${target > 0 ? ` sotto ${formatPrice(target)}` : ''}.`,
    )
    refresh()
  }

  const openTelegramBot = () => {
    const tg = normalizeTelegramUser(telegram)
    if (tg) saveTelegramPrefs({ username: tg, linkedAt: new Date().toISOString() })
    const payload = `alert_${Date.now().toString(36)}`
    window.open(telegramBotStartUrl(payload), '_blank', 'noopener,noreferrer')
    setWantTelegram(true)
    setToast('Apri il bot su Telegram e premi Avvia per collegare le notifiche (demo).')
  }

  return (
    <div className="section" style={{ paddingTop: '2rem' }}>
      <div className="section__head">
        <h2>Cerca e filtra</h2>
        <p>
          Non solo i prodotti già nel radar. Scrivi “ugreen 2800” o un gioco Steam: se non è in
          offerta lo apriamo comunque nei negozi e puoi metterlo in alert.
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
              ? 'Es. nas 2 bay, giochi steam, app android…'
              : 'Es. UGREEN DXP2800, Stardew Valley, Forest…'
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
              <option value="software">Software</option>
              <option value="steam">Steam / Epic / GOG</option>
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
              placeholder="es. 400"
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
            Notifica su Telegram quando scende sotto il limite
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
            Demo: salva l’alert in locale e apre il bot Telegram. In produzione il backend invia il
            messaggio via Bot API.
          </p>
        </div>

        <div className="search-actions">
          <button className="btn btn-primary" type="submit">
            Salva ricerca + alert
          </button>
          <p className="results-count">
            {results.length} risultat{results.length === 1 ? 'o' : 'i'} sotto il filtro
          </p>
        </div>
        {toast ? <div className="toast">{toast}</div> : null}
      </form>

      <div className="search-results">
        <h3>Risultati filtrati</h3>
        {results.length === 0 ? (
          <p className="watch-empty">
            Nessun match. Togli “solo gratis” o alza il limite: anche senza offerta apriamo i
            negozi per la tua query.
          </p>
        ) : (
          <div className="deal-list">
            {results.map((deal) => (
              <DealRow key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>

      <div className="watch-box" style={{ marginTop: '1.5rem' }}>
        <h3>Le tue ricerche monitorate</h3>
        {watches.length === 0 ? (
          <p className="watch-empty">
            Nessun alert ancora. Salva una ricerca qui sopra: riceverai il segnale solo sotto il
            tuo limite.
          </p>
        ) : (
          watches.map((w) => (
            <div key={`${w.id}-${w.createdAt}`} className="watch-item">
              <div>
                <strong>
                  {getDeal(w.id) ? (
                    <Link to={`/prodotto/${w.id}`}>{w.title}</Link>
                  ) : (
                    w.title
                  )}
                </strong>
                <span>
                  {w.note ? `${w.note} · ` : ''}
                  {w.notify === 'telegram' && w.telegram
                    ? `Telegram ${w.telegram}`
                    : w.email
                      ? w.email
                      : 'senza canale'}
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
                  onClick={() => {
                    removeWatch(w.id, w.createdAt)
                    refresh()
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
