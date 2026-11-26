import L from 'leaflet'
import { formatNaira } from '@/lib/mock-data'

/**
 * Creative Mapstar Signature Pin Design:
 * A distinctive fusion of a Nigerian real estate listing sign (lollipop pill badge
 * with clean price tag and pin stem) crowned with the Mapstar Star Emblem.
 *
 * Color Scheme:
 *   🟢 Green (#10B981)  = AVAILABLE (Active & ready for inspection)
 *   🟠 Orange (#F59E0B) = COMING_SOON (Pre-listing or upcoming lodge)
 *   🔴 Red (#EF4444)    = UNAVAILABLE (Delisted, recently let, or placed on hold by Admin)
 */

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

const PIN_THEMES: Record<
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

export function createMapstarListingIcon({
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
}): L.DivIcon {
  const pinState = getPinState(status)
  const theme = PIN_THEMES[pinState]
  const formattedRent = formatNaira(annualRent).replace('₦', '₦')

  // Dimensions
  const scale = selected ? 1.15 : 1
  const width = Math.round(92 * scale)
  const height = Math.round(48 * scale)

  const ringStyle = featured
    ? `box-shadow: 0 0 0 3px #FDE047, 0 0 16px rgba(250, 204, 21, 0.8), 0 4px 14px ${theme.glow};`
    : selected
    ? `box-shadow: 0 0 0 3px #FFFFFF, 0 0 20px ${theme.pulseColor}, 0 6px 18px rgba(0,0,0,0.4); transform: scale(1.12);`
    : `box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3), 0 1px 4px ${theme.glow};`

  // Star SVG Path
  const starPath =
    'M12 2 L14.7 8.2 L21.4 8.7 L16.3 13.1 L17.9 19.6 L12 16.1 L6.1 19.6 L7.7 13.1 L2.6 8.7 L9.3 8.2 Z'

  const html = `
<div class="mapstar-creative-pin group" style="
  position: relative;
  width: ${width}px;
  height: ${height}px;
  cursor: pointer;
  user-select: none;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
">
  <!-- Listing Pill Card (Star Emblem + Price Tag) -->
  <div style="
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 6px 3px 4px;
    border-radius: 9999px;
    background: ${theme.bgGradient};
    border: 1.5px solid ${theme.border};
    color: #ffffff;
    ${ringStyle}
    white-space: nowrap;
  ">
    <!-- Crowned Star Emblem Inside Pin Head -->
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.22);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      backdrop-filter: blur(4px);
    ">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="${theme.starFill}">
        <path d="${starPath}" />
      </svg>
    </div>

    <!-- Listing Sign Price / Info -->
    <div style="display: flex; flex-direction: column; line-height: 1; padding-right: 2px;">
      <span style="
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 10px;
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
        opacity: 0.92;
        margin-top: 1px;
      ">${theme.label}</span>
    </div>
  </div>

  <!-- Signpost Pin Needle / Arrow Tail -->
  <div style="
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 6px solid ${theme.border};
    margin-top: -1px;
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
  "></div>

  <!-- Ground Contact Dot -->
  <div style="
    width: 5px;
    height: 3px;
    border-radius: 50%;
    background: rgba(0,0,0,0.35);
    margin-top: 1px;
  "></div>
</div>
`.trim()

  return L.divIcon({
    html,
    className: 'mapstar-custom-pin-container',
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
  })
}
