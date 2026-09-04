import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { deals, formatPrice } from '../data/deals'
import {
  addWatch,
  listWatches,
  removeWatch,
  type WatchItem,
} from '../lib/watchlist'

export function MonitorPage() {
  const [watches, setWatches] = useState<WatchItem[]>(() => listWatches())
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('nas')
  const [target, setTarget] = useState('')
  const [contact, setContact] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const refresh = () => setWatches(listWatches())

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const name = title.trim() || url.trim() || 'Prodotto da monitorare'
    const price = Number(target) || 0
    addWatch({
      id: `custom-${Date.now()}`,
      title: name,
      targetPrice: price,
      email: contact.trim() || undefined,
      createdAt: new Date().toISOString(),
      note: `${category}${url ? ` · ${url}` : ''}`,
    })
    setTitle('')
    setUrl('')
    setTarget('')
    setToast('Monitoraggio aggiunto. Ti avviseremo al prezzo target.')
    refresh()
  }

  return (
    <div className="section" style={{ paddingTop: '2rem' }}>
      <div className="section__head">
        <h2>Monitora un prodotto</h2>
        <p>
          Stile CamelCamelCamel: scegli NAS, HDD, SSD, RAM o un software. Imposta budget e
          ricevi il segnale solo quando il prezzo è quello giusto.
        </p>
      </div>

      <div className="track-panel">
        <form className="track-form" onSubmit={onSubmit}>
          <label htmlFor="product-title">Cosa stai cercando?</label>
          <input
            id="product-title"
            placeholder="Es. WD Red Plus 12TB, Synology DS224+, CleanMyMac…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            list="deal-suggestions"
          />
          <datalist id="deal-suggestions">
            {deals.map((d) => (
              <option key={d.id} value={d.title} />
            ))}
          </datalist>

          <label htmlFor="product-url">Link prodotto (opzionale)</label>
          <input
            id="product-url"
            placeholder="https://www.amazon.it/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div className="field-row">
            <div>
              <label htmlFor="category">Categoria</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="software">Software / SaaS / AI</option>
                <option value="nas">NAS + HDD + SSD + RAM</option>
                <option value="gaming">Gaming free (≥20 €)</option>
              </select>
            </div>
            <div>
              <label htmlFor="budget">Budget / prezzo target (€)</label>
              <input
                id="budget"
                type="number"
                min={0}
                step="0.01"
                placeholder="179.90"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
              />
            </div>
          </div>

          <label htmlFor="contact">Dove vuoi l’alert?</label>
          <input
            id="contact"
            placeholder="Email oppure @telegram"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />

          <button className="btn btn-primary" type="submit">
            Attiva alert
          </button>
          {toast ? <div className="toast">{toast}</div> : null}
        </form>

        <div className="watch-box">
          <h3>I tuoi monitoraggi</h3>
          {watches.length === 0 ? (
            <p className="watch-empty">
              Nessun alert ancora. Parti dal radar oppure aggiungi un prodotto qui. I dati restano
              in questo browser (demo locale).
            </p>
          ) : (
            watches.map((w) => (
              <div key={`${w.id}-${w.createdAt}`} className="watch-item">
                <div>
                  <strong>
                    {deals.some((d) => d.id === w.id) ? (
                      <Link to={`/prodotto/${w.id}`}>{w.title}</Link>
                    ) : (
                      w.title
                    )}
                  </strong>
                  <span>
                    {w.note ? `${w.note} · ` : ''}
                    creato {new Date(w.createdAt).toLocaleDateString('it-IT')}
                    {w.email ? ` · ${w.email}` : ''}
                  </span>
                </div>
                <div>
                  <div className="watch-item__target">{formatPrice(w.targetPrice)}</div>
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
    </div>
  )
}
