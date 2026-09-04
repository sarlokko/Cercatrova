import type { Verdict } from '../data/deals'

export function VerdictCard({ verdict }: { verdict: Verdict }) {
  return (
    <aside className={`verdict verdict--${verdict.kind}`} aria-label="Giudizio Cercatrova">
      <p className="verdict__q">{verdict.question}</p>
      <strong className="verdict__label">{verdict.label}</strong>
      <p className="verdict__detail">{verdict.detail}</p>
    </aside>
  )
}
