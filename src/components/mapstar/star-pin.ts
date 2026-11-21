import L from 'leaflet'

/**
 * Mapstar custom star-shaped pin.
 *
 * The star is the brand signature — every pin on the map is a star,
 * colored by listing status:
 *   🟢 green  = AVAILABLE (now)
 *   🟠 orange = COMING_SOON
 *   🔵 blue   = UNDER_INSPECTION
 *   ⚪ grey   = RECENTLY_LET
 *   🔴 red    = VERIFIED (physically visited by Mapstar rep)
 *   💎 ring   = FEATURED (paid boost) — adds an electric/cyan halo around the star
 */
export type PinColor = 'green' | 'orange' | 'blue' | 'grey' | 'red'

const COLOR_HEX: Record<PinColor, string> = {
  green: '#10B981',
  orange: '#F59E0B',
  blue: '#3B82F6',
  grey: '#64748B',
  red: '#F43F5E',
}

const COLOR_DARK: Record<PinColor, string> = {
  green: '#064E3B',
  orange: '#78350F',
  blue: '#1E3A8A',
  grey: '#334155',
  red: '#881337',
}

export function createStarIcon(
  color: PinColor,
  opts: { featured?: boolean; selected?: boolean; size?: number } = {}
): L.DivIcon {
  const size = opts.size ?? 32
  const fill = COLOR_HEX[color]
  const stroke = COLOR_DARK[color]
  const ringStroke = opts.featured ? '#38BDF8' : 'none'
  const ringWidth = opts.featured ? 3.5 : 0
  const scale = opts.selected ? 1.3 : 1
  const dim = size * scale
  const glow = opts.selected
    ? `filter: drop-shadow(0 0 10px #3B82F6) drop-shadow(0 0 16px rgba(59, 130, 246, 0.7)); z-index: 999;`
    : opts.featured
    ? `filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.7));`
    : `filter: drop-shadow(0 2px 6px rgba(0,0,0,0.8));`

  // 5-point star SVG path, centered in a 32x32 viewBox
  const starPath =
    'M16 2 L19.6 12.2 L30.4 12.5 L21.7 19.0 L24.7 29.3 L16 23.2 L7.3 29.3 L10.3 19.0 L1.6 12.5 L12.4 12.2 Z'

  const html = `
<div style="
  width: ${dim}px;
  height: ${dim}px;
  ${glow}
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
">
  <svg width="${dim}" height="${dim}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    ${opts.featured ? `<circle cx="16" cy="16" r="14.5" fill="none" stroke="${ringStroke}" stroke-width="${ringWidth}" opacity="0.95"/>` : ''}
    ${opts.selected ? `<circle cx="16" cy="16" r="15" fill="rgba(59, 130, 246, 0.35)" stroke="#60A5FA" stroke-width="1.8"/>` : ''}
    <path d="${starPath}"
      fill="${fill}"
      stroke="${stroke}"
      stroke-width="1.2"
      stroke-linejoin="round"
    />
    <circle cx="16" cy="16" r="2.4" fill="#ffffff" opacity="0.95"/>
  </svg>
</div>
`.trim()

  return L.divIcon({
    html,
    className: 'mapstar-star-pin',
    iconSize: [dim, dim],
    iconAnchor: [dim / 2, dim / 2],
    popupAnchor: [0, -dim / 2],
  })
}

export function statusToColor(status: string): PinColor {
  switch (status) {
    case 'AVAILABLE':
      return 'green'
    case 'COMING_SOON':
      return 'orange'
    case 'UNDER_INSPECTION':
      return 'blue'
    case 'RECENTLY_LET':
      return 'grey'
    case 'VERIFIED':
      return 'red'
    default:
      return 'green'
  }
}
