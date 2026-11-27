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

export const PIN_THEMES: Record<
  PinState,
  {
    bgGradient: string
    border: string
    glow: string
    starFill: string
    buildingColor: string
    pulseColor: string
    label: string
  }
> = {
  AVAILABLE: {
    bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    border: '#047857',
    glow: 'rgba(16, 185, 129, 0.55)',
    starFill: '#FFFFFF',
    buildingColor: '#064E3B',
    pulseColor: '#34D399',
    label: 'Available',
  },
  COMING_SOON: {
    bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    border: '#B45309',
    glow: 'rgba(245, 158, 11, 0.55)',
    starFill: '#FFFFFF',
    buildingColor: '#78350F',
    pulseColor: '#FBBF24',
    label: 'Coming Soon',
  },
  UNAVAILABLE: {
    bgGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    border: '#991B1B',
    glow: 'rgba(239, 68, 68, 0.55)',
    starFill: '#FFFFFF',
    buildingColor: '#7F1D1D',
    pulseColor: '#F87171',
    label: 'Unavailable',
  },
}

/**
 * Creates a circular Mapstar Star + Building Pin Element.
 * Specifications:
 * 1. Fixed Real-World Positioning: Anchors precisely at [longitude, latitude] by its bottom needle point.
 * 2. Round Design: Modern circular disc badge with luminous outer ring.
 * 3. Inscribed Star: A golden or crisp white 5-point star inscribed in the circle.
 * 4. Transparent Buildings Showing Through: Architectural residential building silhouette
 *    elegantly visible within the star geometry.
 */
export function buildStarPinElement({
  status,
  featured = false,
  selected = false,
  title = '',
}: {
  status: string
  annualRent?: number
  featured?: boolean
  selected?: boolean
  title?: string
}): HTMLElement {
  const pinState = getPinState(status)
  const theme = PIN_THEMES[pinState]

  const container = document.createElement('div')
  container.className = 'mapstar-star-listing-pin'
  container.style.cssText = `
    position: relative;
    cursor: pointer;
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: bottom center;
    ${selected ? 'transform: scale(1.3); z-index: 9999;' : 'z-index: 10;'}
  `

  const ringStyle = featured
    ? `box-shadow: 0 0 0 3px #FDE047, 0 0 16px rgba(250, 204, 21, 0.9), 0 4px 14px ${theme.glow};`
    : selected
    ? `box-shadow: 0 0 0 3px #FFFFFF, 0 0 20px ${theme.pulseColor}, 0 6px 18px rgba(0,0,0,0.5);`
    : `box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35), 0 1px 4px ${theme.glow};`

  // 36px Round Disc containing:
  // - Outer round badge in theme gradient
  // - 5-point Inscribed Star with subtle inner depth
  // - Building silhouette showing through inside the star
  container.innerHTML = `
    <!-- Round Head Disc -->
    <div style="
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${theme.bgGradient};
      border: 2px solid ${theme.border};
      display: flex;
      align-items: center;
      justify-content: center;
      ${ringStyle}
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    ">
      <svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Star Clip Path so the buildings show through the star -->
          <clipPath id="star-clip-${pinState}">
            <path d="M16 2 L20.2 11.2 L30.2 12.1 L22.8 18.7 L24.9 28.5 L16 23.3 L7.1 28.5 L9.2 18.7 L1.8 12.1 L11.8 11.2 Z" />
          </clipPath>
        </defs>

        <!-- Star Base Outline / Fill -->
        <path
          d="M16 2 L20.2 11.2 L30.2 12.1 L22.8 18.7 L24.9 28.5 L16 23.3 L7.1 28.5 L9.2 18.7 L1.8 12.1 L11.8 11.2 Z"
          fill="#FFFFFF"
          stroke="rgba(0,0,0,0.12)"
          stroke-width="0.8"
        />

        <!-- Buildings Showing Through Inside the Star Silhouette -->
        <g clip-path="url(#star-clip-${pinState})">
          <!-- Back taller building -->
          <rect x="15" y="11" width="7" height="18" fill="${theme.buildingColor}" opacity="0.9" />
          <line x1="17" y1="13" x2="17" y2="24" stroke="#FFFFFF" stroke-width="0.75" opacity="0.7" stroke-dasharray="1 1.5" />
          <line x1="20" y1="13" x2="20" y2="24" stroke="#FFFFFF" stroke-width="0.75" opacity="0.7" stroke-dasharray="1 1.5" />

          <!-- Main center residential lodge building -->
          <rect x="10" y="14" width="8" height="15" fill="${theme.buildingColor}" opacity="0.96" />
          <!-- Windows grid -->
          <rect x="11.5" y="16" width="1.5" height="1.8" fill="#FFFFFF" opacity="0.85" />
          <rect x="14.5" y="16" width="1.5" height="1.8" fill="#FFFFFF" opacity="0.85" />
          <rect x="11.5" y="19" width="1.5" height="1.8" fill="#FFFFFF" opacity="0.85" />
          <rect x="14.5" y="19" width="1.5" height="1.8" fill="#FFFFFF" opacity="0.85" />
          <rect x="11.5" y="22" width="1.5" height="1.8" fill="#FFFFFF" opacity="0.85" />
          <rect x="14.5" y="22" width="1.5" height="1.8" fill="#FFFFFF" opacity="0.85" />

          <!-- Entrance door -->
          <rect x="13" y="25" width="2" height="4" fill="#FFFFFF" opacity="0.9" />
        </g>
      </svg>
    </div>

    <!-- Signpost Pointer Tip (Anchors precisely to physical GPS coordinates) -->
    <div style="
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 7px solid ${theme.border};
      margin-top: -2px;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
    "></div>

    <!-- Precise Contact Point Shadow -->
    <div style="
      width: 6px;
      height: 3px;
      border-radius: 50%;
      background: rgba(0,0,0,0.45);
      margin-top: 1px;
    "></div>
  `

  return container
}
