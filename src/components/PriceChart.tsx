import type { PricePoint } from '../data/deals'

type Props = {
  history: PricePoint[]
  avgPrice: number
  currency?: string
}

export function PriceChart({ history, avgPrice, currency = '€' }: Props) {
  if (history.length < 2) return null

  const prices = history.map((p) => p.price)
  const min = Math.min(...prices, avgPrice) * 0.92
  const max = Math.max(...prices, avgPrice) * 1.05
  const w = 640
  const h = 220
  const padX = 12
  const padY = 18

  const xAt = (i: number) => padX + (i / (history.length - 1)) * (w - padX * 2)
  const yAt = (price: number) =>
    padY + (1 - (price - min) / (max - min || 1)) * (h - padY * 2)

  const line = history
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p.price).toFixed(1)}`)
    .join(' ')

  const area = `${line} L ${xAt(history.length - 1).toFixed(1)} ${h - padY} L ${padX} ${h - padY} Z`
  const avgY = yAt(avgPrice)
  const first = history[0]
  const last = history[history.length - 1]

  return (
    <div className="chart-wrap">
      <h2>Storico prezzi (6 mesi)</h2>
      <svg className="chart-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Grafico storico prezzi">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(226,61,43,0.28)" />
            <stop offset="100%" stopColor="rgba(226,61,43,0)" />
          </linearGradient>
        </defs>
        <line className="chart-avg" x1={padX} x2={w - padX} y1={avgY} y2={avgY} />
        <path className="chart-area" d={area} />
        <path className="chart-line" d={line} />
        <text x={padX} y={14} fill="#7a6a58" fontSize="11">
          Media {currency}
          {avgPrice.toFixed(2)}
        </text>
        <text x={padX} y={h - 4} fill="#7a6a58" fontSize="11">
          {first.date}
        </text>
        <text x={w - padX} y={h - 4} fill="#7a6a58" fontSize="11" textAnchor="end">
          {last.date}
        </text>
      </svg>
    </div>
  )
}
