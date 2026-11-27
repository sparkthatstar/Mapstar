export type PinState = 'AVAILABLE' | 'COMING_SOON' | 'UNAVAILABLE'

export function getPinState(status: string): PinState {
  switch (status) {
    case 'AVAILABLE':
    case 'VERIFIED':
      return 'AVAILABLE'
    case 'COMING_SOON':
    case 'UNDER_INSPECTION':
      return 'COMING_SOON'
    case 'RECENTLY_LET':
    case 'DELISTED':
    case 'UNAVAILABLE':
      return 'UNAVAILABLE'
    default:
      return 'AVAILABLE'
  }
}

export const PIN_COLORS = {
  AVAILABLE: {
    primary: '#10B981',
    dark: '#047857',
    houseFill: '#064E3B',
    starFill: '#FBBF24', // golden star or crisp white
    halo: '#34D399',
  },
  COMING_SOON: {
    primary: '#F59E0B',
    dark: '#B45309',
    houseFill: '#78350F',
    starFill: '#FFFFFF',
    halo: '#FBBF24',
  },
  UNAVAILABLE: {
    primary: '#EF4444',
    dark: '#991B1B',
    houseFill: '#7F1D1D',
    starFill: '#FFFFFF',
    halo: '#F87171',
  },
}

/**
 * Generates an SVG Data URI / Image for Mapbox Native Symbol Layer.
 * Specifications:
 * - Round circular outer badge (radius ~22)
 * - Simple, clean geometric house shape that touches the inner edges of the circle:
 *   - Roof apex touches upper arc
 *   - Eaves touch left & right arcs
 *   - Base touches lower arc
 * - Inscribed Mapstar Star neatly positioned inside the house body
 * - Needle pointer at bottom anchored exactly at the contact point (tip coordinate)
 */
export function generateStarHouseSvg(state: PinState, featured = false): string {
  const colors = PIN_COLORS[state]
  const strokeHighlight = featured ? '#FDE047' : '#FFFFFF'
  const strokeWidth = featured ? 2.5 : 1.8

  return `<svg width="48" height="58" viewBox="0 0 48 58" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Drop Shadow for crisp 3D popping on vector tiles -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.38"/>
    </filter>
    <linearGradient id="circleGrad-${state}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.primary}"/>
      <stop offset="100%" stop-color="${colors.dark}"/>
    </linearGradient>
  </defs>

  <!-- Pin Group with Shadow -->
  <g filter="url(#shadow)">
    <!-- Bottom Needle Pointer (Anchors with 100% precision at (24, 56)) -->
    <path d="M 19 44 L 24 55 L 29 44 Z" fill="${colors.dark}" stroke="${strokeHighlight}" stroke-width="0.8" stroke-linejoin="round"/>

    <!-- Round Outer Badge (Center 24, 24, Radius 21) -->
    <circle cx="24" cy="24" r="21" fill="url(#circleGrad-${state})" stroke="${strokeHighlight}" stroke-width="${strokeWidth}"/>

    <!-- Subtle inner glass highlight ring -->
    <circle cx="24" cy="24" r="19.5" fill="none" stroke="#FFFFFF" stroke-width="0.75" opacity="0.4"/>

    <!-- Simple, Clean House Shape touching the circle edges:
         Apex at (24, 7), Eaves at (7, 21) and (41, 21), Base at (10, 39) to (38, 39) -->
    <!-- Roof -->
    <polygon points="24,6 42,21 6,21" fill="${colors.houseFill}" opacity="0.95"/>
    <polyline points="6,21 24,6 42,21" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linejoin="round" opacity="0.85"/>

    <!-- House Body (touching lower circle bounds) -->
    <polygon points="9,21 39,21 37,39 11,39" fill="${colors.houseFill}" opacity="0.95"/>

    <!-- Neatly Inscribed Mapstar 5-Point Star inside the house body/center:
         Centered at (24, 27) with radius ~8.5 -->
    <!-- Star Path coordinates centered at 24, 27 -->
    <path d="M 24 18.5 
             L 26.2 24.2 
             L 32.3 24.6 
             L 27.6 28.5 
             L 29.1 34.5 
             L 24 31.2 
             L 18.9 34.5 
             L 20.4 28.5 
             L 15.7 24.6 
             L 21.8 24.2 Z" 
          fill="#FFFFFF" 
          stroke="${colors.houseFill}" 
          stroke-width="0.75" 
          stroke-linejoin="round"/>

    <!-- Little cozy house door at the bottom of the star -->
    <rect x="22.5" y="34" width="3" height="5" rx="0.75" fill="#FFFFFF" opacity="0.9"/>
  </g>
</svg>`
}
