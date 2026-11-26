'use client'

import * as React from 'react'

interface MapstarAppIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  size?: number | string
}

export function MapstarAppIcon({
  className = 'h-8 w-8',
  size,
  ...props
}: MapstarAppIconProps) {
  const id = React.useId().replace(/:/g, '')
  const bgGradId = `mapstar-brown-bg-${id}`
  const goldChainId = `mapstar-gold-chain-${id}`
  const pendantFillId = `mapstar-pendant-fill-${id}`
  const starShadowId = `star-soft-shadow-${id}`
  const pendantShadowId = `pendant-drop-shadow-${id}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <defs>
        {/* Rich Furniture Brown Gradient Background */}
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#854D0E" />
          <stop offset="35%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>

        {/* Warm Amber Gold Gradient for Necklace Chain & Pin Trim */}
        <linearGradient id={goldChainId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Furniture Brown Gradient for Location Pendant */}
        <linearGradient id={pendantFillId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#854D0E" />
          <stop offset="100%" stopColor="#5C2607" />
        </linearGradient>

        {/* Soft Ambient Shadow for White Star */}
        <filter id={starShadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#241002" floodOpacity="0.55" />
        </filter>

        {/* Drop Shadow for Location Pendant on the Star */}
        <filter id={pendantShadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="0.8" floodColor="#3D1804" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* 1. Brown Background: Furniture Brown Rounded Squircle Shield */}
      <rect width="64" height="64" rx="15" fill={`url(#${bgGradId})`} />
      {/* Delicate Warm Amber Rim Accent */}
      <rect
        x="0.75"
        y="0.75"
        width="62.5"
        height="62.5"
        rx="14.25"
        stroke="#F59E0B"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        fill="none"
      />

      {/* 2. Pure White Star */}
      <g filter={`url(#${starShadowId})`}>
        <path
          d="M 32 9.5
             L 38.2 25.5
             L 54.8 26.5
             L 42.0 37.0
             L 46.0 53.0
             L 32 44.0
             L 18.0 53.0
             L 22.0 37.0
             L 9.2 26.5
             L 25.8 25.5 Z"
          fill="#FFFFFF"
          stroke="#FAF7F2"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </g>

      {/* 3. Necklace: Draped Around the Star's Head (Neck) */}
      <path
        d="M 24.5 24.2 C 26.8 32.2, 37.2 32.2, 39.5 24.2"
        fill="none"
        stroke={`url(#${goldChainId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Necklace Jewel Beads */}
      <circle cx="26.2" cy="26.8" r="1.1" fill="#FEF08A" />
      <circle cx="37.8" cy="26.8" r="1.1" fill="#FEF08A" />
      {/* Pendant Bail Ring */}
      <circle
        cx="32"
        cy="29.2"
        r="1.5"
        fill="none"
        stroke={`url(#${goldChainId})`}
        strokeWidth="1.3"
      />

      {/* 4. Location Sign (Map Pin) Worn as a Necklace Pendant */}
      <g filter={`url(#${pendantShadowId})`}>
        {/* Location Pin Body (Teardrop pointer resting in star center) */}
        <path
          d="M 32 44.0
             L 26.8 36.2
             A 6.0 6.0 0 1 1 37.2 36.2
             Z"
          fill={`url(#${pendantFillId})`}
          stroke={`url(#${goldChainId})`}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Location Pin Inner Circle (White Accent Hole) */}
        <circle cx="32" cy="33.8" r="2.2" fill="#FFFFFF" />
      </g>
    </svg>
  )
}

export default MapstarAppIcon
