import type { ItemCategory } from '../data/community'

const swatch: Record<string, string> = {
  Blue: '#4f7fd6', Red: '#d4574a', Green: '#4f9a72', Black: '#2b2f33', Grey: '#9aa1a6', White: '#f1f1ee', Yellow: '#e8c547', Pink: '#e79ab8', Purple: '#8b6cc7', Brown: '#8a6248', Orange: '#e08a3c', Silver: '#c6cbd0',
}

/** Simple illustration used when a report has no photo. Labelled as such. */
export function ItemArt({ category, colours, photo, alt, size = 'md' }: { category: ItemCategory; colours: string[]; photo?: string | null; alt: string; size?: 'sm' | 'md' | 'lg' }) {
  const c = swatch[colours[0]] ?? '#9aa1a6'
  const c2 = swatch[colours[1]] ?? 'rgba(255,255,255,.55)'
  if (photo) return <img className={`item-art item-art-${size}`} src={photo} alt={alt} />
  const shapes: Record<ItemCategory, React.ReactNode> = {
    bottle: (
      <>
        <rect x="40" y="18" width="20" height="10" rx="3" fill={c2} />
        <rect x="32" y="26" width="36" height="58" rx="12" fill={c} />
        <rect x="38" y="44" width="10" height="10" rx="5" fill={c2} />
      </>
    ),
    bag: (
      <>
        <path d="M36 30a14 14 0 0 1 28 0" fill="none" stroke={c} strokeWidth="5" />
        <rect x="24" y="30" width="52" height="54" rx="12" fill={c} />
        <rect x="34" y="56" width="32" height="18" rx="5" fill={c2} />
      </>
    ),
    notebook: (
      <>
        <rect x="28" y="18" width="46" height="64" rx="5" fill={c} />
        <rect x="28" y="18" width="8" height="64" fill="rgba(0,0,0,.18)" />
        <rect x="44" y="32" width="22" height="8" rx="2" fill={c2} />
      </>
    ),
    clothing: <path d="M38 22h24l16 12-8 12-6-4v38H36V42l-6 4-8-12z" fill={c} />,
    stationery: (
      <>
        <rect x="22" y="38" width="56" height="30" rx="6" fill={c} />
        <path d="M30 46h40" stroke={c2} strokeWidth="4" strokeLinecap="round" />
      </>
    ),
    lunchbox: (
      <>
        <rect x="24" y="34" width="52" height="40" rx="10" fill={c} />
        <rect x="24" y="44" width="52" height="5" fill={c2} />
      </>
    ),
    sports: (
      <>
        <circle cx="50" cy="52" r="26" fill={c} />
        <path d="M50 26v52M24 52h52" stroke={c2} strokeWidth="3" />
      </>
    ),
    electronics: (
      <>
        <rect x="32" y="20" width="36" height="60" rx="6" fill={c} />
        <rect x="38" y="27" width="24" height="12" rx="2" fill={c2} />
      </>
    ),
    id: (
      <>
        <path d="M50 10v18" stroke={c} strokeWidth="4" />
        <rect x="28" y="28" width="44" height="56" rx="6" fill="#f4f1e8" stroke={c} strokeWidth="3" />
        <circle cx="50" cy="48" r="8" fill="#cfd4d8" />
        <rect x="36" y="62" width="28" height="5" rx="2" fill="#cfd4d8" />
      </>
    ),
    other: <rect x="28" y="28" width="44" height="44" rx="14" fill={c} />,
  }
  return (
    <svg className={`item-art item-art-${size}`} viewBox="0 0 100 100" role="img" aria-label={`${alt} (illustration, no photo)`}>
      <rect width="100" height="100" fill="var(--bg-sunk)" />
      {shapes[category]}
    </svg>
  )
}
