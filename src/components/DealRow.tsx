import { Link } from 'react-router-dom'
import {
  type Deal,
  categoryLabel,
  formatPrice,
  kindLabel,
} from '../data/deals'

function thumbLabel(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

type Props = {
  deal: Deal
  compact?: boolean
}

export function DealRow({ deal }: Props) {
  return (
    <Link to={`/prodotto/${deal.id}`} className="deal-row">
      <div className="deal-thumb" style={{ background: deal.imageTone }}>
        {thumbLabel(deal.title)}
      </div>
      <div className="deal-meta">
        <h3>{deal.title}</h3>
        <p>{deal.subtitle}</p>
        <div className="deal-tags">
          <span
            className={`tag${
              deal.kind === 'gratis' || deal.kind === 'listino'
                ? ' tag--signal'
                : deal.kind === 'errore' || deal.kind === 'scade'
                  ? ' tag--alert'
                  : ''
            }`}
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
        {deal.discountPct > 0 ? (
          <>
            <div className="deal-price__was">{formatPrice(deal.normalPrice, deal.currency)}</div>
            <div className="deal-price__delta">
              {deal.isFree ? '100% risparmio' : `−${deal.discountPct}%`}
            </div>
          </>
        ) : (
          <div className="deal-price__delta">prezzo di mercato</div>
        )}
      </div>
    </Link>
  )
}
