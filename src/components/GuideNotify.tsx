import { useState, type FormEvent } from 'react'
import { type Category, formatPrice } from '../data/deals'
import { apiAddWatch, apiMe, apiTelegramLink } from '../lib/api'
import { getTelegramPrefs, normalizeTelegramUser, saveTelegramPrefs } from '../lib/watchlist'

type Props = {
  title: string
  query: string
  category: 'all' | Category
  productId?: string
  targetPrice: number
}

export function GuideNotify({ title, query, category, productId, targetPrice }: Props) {
  const prefs = getTelegramPrefs()
  const [wantTelegram, setWantTelegram] = useState(Boolean(prefs?.username))
  const [telegram, setTelegram] = useState(prefs?.username ?? '')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (wantTelegram && !telegram.trim()) {
      setToast('Inserisci @username oppure collega il bot.')
      return
    }
    const tg = wantTelegram ? normalizeTelegramUser(telegram) : ''
    if (tg) saveTelegramPrefs({ username: tg, linkedAt: new Date().toISOString() })
    setBusy(true)
    try {
      await apiAddWatch({
        productId,
        title,
        query: query || undefined,
        category,
        targetPrice,
        telegram: tg || undefined,
        notify: wantTelegram ? 'telegram' : 'none',
      })
      const me = await apiMe()
      setDone(true)
      setToast(
        me
          ? `Fatto. ${me.used}/${me.limit} monitoraggi. Ti avviso quando conviene.`
          : 'Fatto. Ti avviso quando conviene.',
      )
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Limite raggiunto. Vai su Monitora.')
    } finally {
      setBusy(false)
    }
  }

  const connectBot = async () => {
    const tg = normalizeTelegramUser(telegram)
    if (tg) saveTelegramPrefs({ username: tg, linkedAt: new Date().toISOString() })
    try {
      const link = await apiTelegramLink()
      window.open(link.url, '_blank', 'noopener,noreferrer')
      setWantTelegram(true)
      setToast(
        link.configured
          ? 'Apri Telegram e premi Avvia: da lì partono gli alert.'
          : 'Bot non configurato sul NAS. Il monitoraggio si salva lo stesso.',
      )
    } catch {
      setToast('Link Telegram non disponibile.')
    }
  }

  if (done) {
    return (
      <div className="guide-notify guide-notify--done" role="status">
        <strong>Ci penso io.</strong>
        <p>{toast || 'Ti avviso quando sarà il momento di comprarlo.'}</p>
      </div>
    )
  }

  return (
    <form className="guide-notify" onSubmit={onSubmit}>
      <strong>Vuoi che ti avvisi?</strong>
      <p>
        Ci sono, però non conviene comprarli adesso. Attiva una notifica: quando scende o diventa
        eccezionale, te lo dico.
        {targetPrice > 0 ? ` Limite suggerito ${formatPrice(targetPrice)}.` : ''}
      </p>
      <label className="check-label check-label--light" htmlFor="guide-tg">
        <input
          id="guide-tg"
          type="checkbox"
          checked={wantTelegram}
          onChange={(e) => setWantTelegram(e.target.checked)}
        />
        Telegram, quando sarà il momento
      </label>
      {wantTelegram ? (
        <div className="guide-notify__row">
          <input
            aria-label="Username Telegram"
            placeholder="@username"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
          />
          <button type="button" className="btn btn-ghost" onClick={connectBot}>
            Collega bot
          </button>
        </div>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? 'Salvo…' : 'Avvisami quando sarà il momento'}
      </button>
      {toast ? <div className="toast">{toast}</div> : null}
    </form>
  )
}
