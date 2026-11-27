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
    pulseColor: string
    label: string
  }
> = {
  AVAILABLE: {
    bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    border: '#047857',
    glow: 'rgba(16, 185, 129, 0.5)',
    starFill: '#FFFFFF',
    pulseColor: '#34D399',
    label: 'Available',
  },
  COMING_SOON: {
    bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    border: '#B45309',
    glow: 'rgba(245, 158, 11, 0.5)',
    starFill: '#FFFFFF',
    pulseColor: '#FBBF24',
    label: 'Coming Soon',
  },
  UNAVAILABLE: {
    bgGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    border: '#991B1B',
    glow: 'rgba(239, 68, 68, 0.5)',
    starFill: '#FFFFFF',
    pulseColor: '#F87171',
    label: 'Unavailable',
  },
}

/**
 * Creates a clean, elegant Mapstar Star Listing Pin.
 * - Pure visual icon: Crowned Mapstar Star with a signpost stem pointing to the ground.
 * - Color-coded: 🟢 Green for Available, 🟠 Orange for Coming Soon, 🔴 Red for Unavailable.
 * - Price and text labels removed for a minimalist, ultra-fast and uncluttered map view.
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
    ${selected ? 'transform: scale(1.28); z-index: 9999;' : 'z-index: 10;'}
  `

  const ringStyle = featured
    ? `box-shadow: 0 0 0 3px #FDE047, 0 0 16px rgba(250, 204, 21, 0.85), 0 4px 14px ${theme.glow};`
    : selected
    ? `box-shadow: 0 0 0 3px #FFFFFF, 0 0 20px ${theme.pulseColor}, 0 6px 18px rgba(0,0,0,0.5);`
    : `box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35), 0 1px 4px ${theme.glow};`

  // 5-point Star SVG Path
  const starPath =
    'M12 2 L14.7 8.2 L21.4 8.7 L16.3 13.1 L17.9 19.6 L12 16.1 L6.1 19.6 L7.7 13.1 L2.6 8.7 L9.3 8.2 Z'

  container.innerHTML = `
    <!-- Star Head Circle -->
    <div style="
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${theme.bgGradient};
      border: 2px solid ${theme.border};
      display: flex;
      align-items: center;
      justify-content: center;
      ${ringStyle}
      transition: all 0.2s ease;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${theme.starFill}">
        <path d="${starPath}" />
      </svg>
    </div>

    <!-- Signpost Pointer Needle -->
    <div style="
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 7px solid ${theme.border};
      margin-top: -2px;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
    "></div>

    <!-- Contact Shadow Dot on Ground -->
    <div style="
      width: 6px;
      height: 3px;
      border-radius: 50%;
      background: rgba(0,0,0,0.4);
      margin-top: 1px;
    "></div>
  `

  return container
}
