/** Simbolo Il Cerca-Trova: lente + scintilla “trovato”. */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span className={className ?? 'brand__mark'} aria-hidden style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="12" fill="#102a27" />
        {/* soft glow */}
        <circle cx="17" cy="17" r="11" fill="#1a3f38" />
        {/* lens */}
        <circle cx="17" cy="17" r="8.2" stroke="#9ef01a" strokeWidth="2.2" />
        <circle cx="17" cy="17" r="8.2" fill="rgba(158,240,26,0.08)" />
        {/* handle */}
        <path
          d="M23.2 23.2 L30.4 30.4"
          stroke="#9ef01a"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* found spark */}
        <path
          d="M17 11.2 L18.1 15.1 L22 16.2 L18.1 17.3 L17 21.2 L15.9 17.3 L12 16.2 L15.9 15.1 Z"
          fill="#9ef01a"
        />
        {/* tiny companion spark */}
        <path
          d="M25.5 11 L26 12.4 L27.4 12.9 L26 13.4 L25.5 14.8 L25 13.4 L23.6 12.9 L25 12.4 Z"
          fill="#c8f56a"
          opacity="0.95"
        />
      </svg>
    </span>
  )
}

export const BRAND_NAME = 'Il Cerca-Trova'
export const BRAND_SHORT = 'Cerca-Trova'
