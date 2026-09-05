import { useEffect, useMemo, useState } from 'react'
import { DealRow } from './DealRow'
import { GuideNotify } from './GuideNotify'
import { type Deal } from '../data/deals'
import { apiSearch } from '../lib/api'
import {
  GUIDE_ROOT,
  buildCategory,
  buildQuery,
  walkStep,
  type GuideChoice,
} from '../lib/guide'
import { splitByTiming, suggestedWatchTarget } from '../lib/timing'

export function GuideSearch() {
  const [path, setPath] = useState<GuideChoice[]>([])
  const [typed, setTyped] = useState('')
  const [results, setResults] = useState<Deal[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const step = walkStep(GUIDE_ROOT, path)
  const last = path[path.length - 1]
  const leaf = Boolean(last && !last.next)
  const needsType = Boolean(last && !last.query && !last.next)
  const query = useMemo(() => buildQuery(path, typed), [path, typed])
  const category = useMemo(() => buildCategory(path), [path])

  useEffect(() => {
    if ((!leaf && typed.trim().length < 2) || (needsType && typed.trim().length < 2)) {
      setResults([])
      setSearched(false)
      return
    }
    const q = query
    if (q.length < 2) return
    let cancelled = false
    setLoading(true)
    setSearched(true)
    apiSearch({
      query: q,
      mode: 'generico',
      category,
      maxPrice: null,
      onlyFree: false,
    }).then((rows) => {
      if (!cancelled) {
        setResults(rows)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [leaf, query, category, typed, path])

  const pick = (choice: GuideChoice) => {
    setTyped('')
    setPath((p) => [...p, choice])
  }

  const back = () => {
    setTyped('')
    setSearched(false)
    setResults([])
    setPath((p) => p.slice(0, -1))
  }

  const reset = () => {
    setPath([])
    setTyped('')
    setResults([])
    setSearched(false)
  }

  const { now, wait } = useMemo(() => splitByTiming(results), [results])
  const watchTitle =
    path.length > 0
      ? path.map((c) => c.label).join(' · ')
      : typed.trim() || 'Ricerca guidata'
  const watchTarget = suggestedWatchTarget(wait.length ? wait : now)
  const watchProduct = (wait[0] ?? now[0])?.id

  const closer = !searched
    ? leaf
      ? `Ottimo. Ti trovo la più adatta per ${path.map((c) => c.label).join(' · ').toLowerCase()}.`
      : typed.trim()
        ? `Cerco “${typed.trim()}”.`
        : step.aside
    : loading
      ? 'Guardo nei negozi…'
      : now.length > 0
        ? 'Sì: adesso vale la pena. Queste sono nel momento giusto.'
        : wait.length > 0
          ? 'Ci sono, però non conviene comprarli adesso.'
          : step.aside

  return (
    <section className="guide" aria-label="Guida alla ricerca">
      <p className="guide__kicker">Il Cerca-Trova</p>
      <h1 className="guide__q" key={step.id}>
        {step.question}
      </h1>
      <p className="guide__aside">{closer}</p>

      {path.length > 0 ? (
        <div className="guide__crumbs">
          <button type="button" className="guide__back" onClick={back}>
            ← Indietro
          </button>
          <ol>
            {path.map((c, i) => (
              <li key={`${c.id}-${i}`}>
                {i > 0 ? <span aria-hidden>›</span> : null}
                {c.label}
              </li>
            ))}
          </ol>
          <button type="button" className="guide__reset" onClick={reset}>
            Riparti
          </button>
        </div>
      ) : null}

      {!leaf ? (
        <div className="guide__grid" role="list">
          {step.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className="guide-tile"
              onClick={() => pick(choice)}
            >
              <span className="guide-tile__mark" aria-hidden>
                {choice.label.slice(0, 1)}
              </span>
              <span className="guide-tile__text">
                <strong>{choice.label}</strong>
                {choice.hint ? <em>{choice.hint}</em> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="guide__type">
        <label htmlFor="guide-free">
          {leaf ? 'Vuoi precisare il modello?' : step.freeLabel || 'Oppure scrivi tu'}
        </label>
        <input
          id="guide-free"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={leaf ? 'Es. 36 GB, DXP2800…' : 'Es. UGREEN 2800, Stardew, Forest…'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {searched ? (
        <div className="guide__results" id="risultati">
          {loading ? (
            <div className="guide__found">
              <span className="guide__stamp">Cerco</span>
              <p>Guardo nei negozi se adesso conviene…</p>
            </div>
          ) : results.length === 0 ? (
            <div className="guide__found">
              <span className="guide__stamp">Vuoto</span>
              <p>Niente di pulito con queste scelte. Prova un’altra via o scrivi il modello.</p>
            </div>
          ) : now.length > 0 ? (
            <>
              <div className="guide__found">
                <span className="guide__stamp">Conviene</span>
                <p>
                  {now.length === 1
                    ? 'Questa vale la pena adesso. Aprila e compra, se ti torna.'
                    : `${now.length} scelte che vale la pena fare adesso.`}
                </p>
              </div>
              <div className="deal-list">
                {now.map((deal) => (
                  <DealRow key={deal.id} deal={deal} tone="now" />
                ))}
              </div>
              {wait.length > 0 ? (
                <div className="guide-split">
                  <div className="guide__found">
                    <span className="guide__stamp guide__stamp--wait">Aspetta</span>
                    <p>
                      Ci sono anche questi, però non conviene comprarli adesso. Se vuoi, ti avviso
                      quando sarà il momento.
                    </p>
                  </div>
                  <div className="deal-list">
                    {wait.map((deal) => (
                      <DealRow key={deal.id} deal={deal} tone="wait" />
                    ))}
                  </div>
                  <GuideNotify
                    title={watchTitle}
                    query={query}
                    category={category}
                    productId={wait[0]?.id}
                    targetPrice={suggestedWatchTarget(wait)}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="guide__found">
                <span className="guide__stamp guide__stamp--wait">Aspetta</span>
                <p>
                  Ci sono questi, però non conviene comprarli adesso. Se vuoi, attiva una notifica:
                  ti avviso quando sarà il momento.
                </p>
              </div>
              <div className="deal-list">
                {wait.map((deal) => (
                  <DealRow key={deal.id} deal={deal} tone="wait" />
                ))}
              </div>
              <GuideNotify
                title={watchTitle}
                query={query}
                category={category}
                productId={watchProduct}
                targetPrice={watchTarget}
              />
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}
