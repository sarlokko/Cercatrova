/** Simbolo Il Cerca-Trova: lente + scintilla “trovato”. */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span className={className ?? 'brand__mark'} aria-hidden style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="11" fill="#1a120c" />
        <circle cx="17" cy="17" r="8.2" stroke="#f2c14e" strokeWidth="2.2" />
        <circle cx="17" cy="17" r="8.2" fill="rgba(242,193,78,0.1)" />
        <path d="M23.2 23.2 L30.2 30.2" stroke="#f2c14e" strokeWidth="2.8" strokeLinecap="round" />
        <path
          d="M17 11.2 L18.1 15.1 L22 16.2 L18.1 17.3 L17 21.2 L15.9 17.3 L12 16.2 L15.9 15.1 Z"
          fill="#f2c14e"
        />
        <circle cx="28.5" cy="11.5" r="1.6" fill="#e23d2b" />
      </svg>
    </span>
  )
}

export const BRAND_NAME = 'Il Cerca-Trova'
export const BRAND_SHORT = 'Cerca-Trova'
