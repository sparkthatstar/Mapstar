import { formatNaira } from '@/lib/mock-data'

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
    textBadgeBg: string
    pulseColor: string
    label: string
  }
> = {
  AVAILABLE: {
    bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    border: '#047857',
    glow: 'rgba(16, 185, 129, 0.45)',
    starFill: '#FFFFFF',
    textBadgeBg: '#064E3B',
    pulseColor: '#34D399',
    label: 'Available',
  },
  COMING_SOON: {
    bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    border: '#B45309',
    glow: 'rgba(245, 158, 11, 0.45)',
    starFill: '#FFFFFF',
    textBadgeBg: '#78350F',
    pulseColor: '#FBBF24',
    label: 'Coming Soon',
  },
  UNAVAILABLE: {
    bgGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    border: '#991B1B',
    glow: 'rgba(239, 68, 68, 0.45)',
    starFill: '#FFFFFF',
    textBadgeBg: '#7F1D1D',
    pulseColor: '#F87171',
    label: 'Unavailable',
  },
}

/**
 * Creates a DOM element representation of the creative Mapstar Star + Listing Sign
 * for Google Maps AdvancedMarkerElement or Custom Overlay.
 */
export function buildStarPinElement({
  status,
  annualRent,
  featured = false,
  selected = false,
  title = '',
}: {
  status: string
  annualRent: number
  featured?: boolean
  selected?: boolean
  title?: string
}): HTMLElement {
  const pinState = getPinState(status)
  const theme = PIN_THEMES[pinState]
  const formattedRent = formatNaira(annualRent).replace('₦', '₦')

  const container = document.createElement('div')
  container.className = 'mapstar-creative-pin-el'
  container.style.cssText = `
    position: relative;
    cursor: pointer;
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: bottom center;
    ${selected ? 'transform: scale(1.15); z-index: 9999;' : 'z-index: 10;'}
  `

  const ringStyle = featured
    ? `box-shadow: 0 0 0 3px #FDE047, 0 0 16px rgba(250, 204, 21, 0.8), 0 4px 14px ${theme.glow};`
    : selected
    ? `box-shadow: 0 0 0 3px #FFFFFF, 0 0 20px ${theme.pulseColor}, 0 6px 18px rgba(0,0,0,0.4);`
    : `box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35), 0 1px 4px ${theme.glow};`

  const starPath =
    'M12 2 L14.7 8.2 L21.4 8.7 L16.3 13.1 L17.9 19.6 L12 16.1 L6.1 19.6 L7.7 13.1 L2.6 8.7 L9.3 8.2 Z'

  container.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3px 7px 3px 4px;
      border-radius: 9999px;
      background: ${theme.bgGradient};
      border: 1.5px solid ${theme.border};
      color: #ffffff;
      ${ringStyle}
      white-space: nowrap;
    ">
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="${theme.starFill}">
          <path d="${starPath}" />
        </svg>
      </div>

      <div style="display: flex; flex-direction: column; line-height: 1; padding-right: 2px;">
        <span style="
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: -0.2px;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
        ">${formattedRent}</span>
        <span style="
          font-size: 7.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          opacity: 0.95;
          margin-top: 1px;
        ">${theme.label}</span>
      </div>
    </div>

    <!-- Arrow Needle / Signpost Tip -->
    <div style="
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid ${theme.border};
      margin-top: -1px;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
    "></div>

    <!-- Contact Shadow -->
    <div style="
      width: 6px;
      height: 3px;
      border-radius: 50%;
      background: rgba(0,0,0,0.35);
      margin-top: 1px;
    "></div>
  `

  return container
}
