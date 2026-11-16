import React from 'react';

export type BauhausVariant = 'folk' | 'mondrian' | 'dataviz' | 'constructivist';

export interface BauhausHeaderArtProps {
  variant?: BauhausVariant;
  className?: string;
}

export function getBauhausVariant(index: number, sourceType?: string): BauhausVariant {
  if (sourceType === 'SRT_FILE') return 'folk';
  if (sourceType === 'URL') {
    const variants: BauhausVariant[] = ['mondrian', 'dataviz', 'folk', 'constructivist'];
    return variants[index % variants.length];
  }
  const order: BauhausVariant[] = ['folk', 'mondrian', 'dataviz', 'constructivist'];
  return order[index % order.length];
}

export const BauhausHeaderArt: React.FC<BauhausHeaderArtProps> = ({
  variant = 'mondrian',
  className = 'w-full h-40',
}) => {
  if (variant === 'folk') {
    return (
      <svg
        viewBox="0 0 400 180"
        className={className}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="400" height="180" fill="#FDFBF7" />
        {/* Far-left violet accent bar */}
        <rect x="0" y="0" width="8" height="180" fill="#5B2DF5" />
        {/* Top-left red quarter/semicircle */}
        <path d="M 35 0 A 45 45 0 0 0 125 0 Z" fill="#E53935" />
        {/* Blue triangle */}
        <polygon points="35,98 68,42 104,98" fill="#1E88E5" />
        {/* Yellow sunburst */}
        <g transform="translate(88, 134)">
          {Array.from({ length: 12 }).map((_, i) => (
            <polygon
              key={i}
              points="0,-38 6,-22 -6,-22"
              fill="#FDD835"
              transform={`rotate(${i * 30})`}
            />
          ))}
          <circle cx="0" cy="0" r="21" fill="#FDD835" />
          <circle cx="0" cy="0" r="9" fill="#FB8C00" />
        </g>
        {/* Top-middle sky crescent */}
        <path d="M 135 0 C 140 30, 175 40, 200 18 L 200 0 Z" fill="#29B6F6" />
        {/* Green arch */}
        <path d="M 142 180 L 142 108 A 34 34 0 0 1 210 108 L 210 180 Z" fill="#1E8E3E" />
        <path d="M 164 180 L 164 114 A 12 12 0 0 1 188 114 L 188 180 Z" fill="#FDFBF7" />
        {/* Middle-top gold sun circle */}
        <circle cx="222" cy="40" r="22" fill="#FBC02D" />
        <path d="M 222 18 A 22 22 0 0 1 244 40 L 222 40 Z" fill="#FB8C00" />
        {/* Red curved leaf top-right */}
        <path d="M 260 0 C 260 40, 315 55, 315 15 C 315 0, 290 0, 260 0 Z" fill="#D84315" />
        {/* Cobalt blue guitar/amphora silhouette */}
        <path
          d="M 252 60 L 266 60 L 266 105 C 278 109, 282 122, 276 135 C 283 145, 282 165, 272 174 L 246 174 C 236 165, 235 145, 242 135 C 236 122, 240 109, 252 105 Z"
          fill="#1565C0"
        />
        <circle cx="259" cy="144" r="6" fill="#0B253A" />
        {/* Far-right stacked domes */}
        <path d="M 308 180 L 308 148 A 32 32 0 0 1 372 148 L 372 180 Z" fill="#D84315" />
        <path d="M 314 146 L 314 128 A 26 26 0 0 1 366 128 L 366 146 Z" fill="#FDD835" />
        <path d="M 318 126 A 22 22 0 0 1 362 126 Z" fill="#1E88E5" />
        {/* Top-right leaf */}
        <path d="M 355 58 C 338 35, 348 12, 368 4 C 378 24, 372 48, 355 58 Z" fill="#1565C0" />
      </svg>
    );
  }

  if (variant === 'dataviz') {
    return (
      <svg
        viewBox="0 0 400 180"
        className={className}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="400" height="180" fill="#0B253A" />
        {/* Faint geometric network grid */}
        <g stroke="#1E4D6B" strokeWidth="1" opacity="0.7">
          <line x1="20" y1="30" x2="110" y2="65" />
          <line x1="110" y1="65" x2="180" y2="22" />
          <line x1="180" y1="22" x2="275" y2="48" />
          <line x1="275" y1="48" x2="365" y2="25" />
          <line x1="55" y1="125" x2="110" y2="65" />
          <line x1="220" y1="95" x2="275" y2="48" />
          <line x1="145" y1="150" x2="220" y2="95" />
        </g>
        <g fill="#4FC3F7" opacity="0.65">
          <circle cx="20" cy="30" r="2.5" />
          <circle cx="110" cy="65" r="3" />
          <circle cx="180" cy="22" r="2.5" />
          <circle cx="275" cy="48" r="3" />
          <circle cx="365" cy="25" r="2.5" />
        </g>
        {/* Glowing vertical bars */}
        <rect x="38" y="132" width="16" height="48" fill="#1E88E5" />
        <rect x="64" y="108" width="16" height="72" fill="#FB8C00" />
        <rect x="90" y="122" width="16" height="58" fill="#4FC3F7" />
        <rect x="116" y="72" width="16" height="108" fill="#1E88E5" />
        <rect x="142" y="96" width="16" height="84" fill="#29B6F6" />
        <rect x="168" y="42" width="16" height="138" fill="#1976D2" />
        <rect x="194" y="64" width="16" height="116" fill="#00ACC1" />
        <rect x="220" y="90" width="16" height="90" fill="#FB8C00" />
        {/* Segmented donut chart on right */}
        <g transform="translate(306, 102)">
          <circle cx="0" cy="0" r="46" fill="none" stroke="#1E88E5" strokeWidth="22" strokeDasharray="195 290" transform="rotate(-110)" />
          <circle cx="0" cy="0" r="46" fill="none" stroke="#FB8C00" strokeWidth="22" strokeDasharray="78 290" transform="rotate(140)" />
          <circle cx="0" cy="0" r="46" fill="none" stroke="#4FC3F7" strokeWidth="22" strokeDasharray="24 290" transform="rotate(242)" />
        </g>
      </svg>
    );
  }

  if (variant === 'constructivist') {
    return (
      <svg
        viewBox="0 0 400 180"
        className={className}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="400" height="180" fill="#FBF9F4" />
        {/* Constructivist grid */}
        <rect x="28" y="20" width="108" height="62" fill="#5B2DF5" />
        <circle cx="288" cy="54" r="44" fill="#FDD835" />
        <rect x="168" y="20" width="52" height="140" fill="#141413" />
        <polygon points="40,165 135,96 155,165" fill="#E53935" />
        <path d="M 244 180 A 58 58 0 0 1 360 180 Z" fill="#1565C0" />
        <circle cx="288" cy="54" r="14" fill="#141413" />
        {/* Crisp frame lines */}
        <line x1="152" y1="0" x2="152" y2="180" stroke="#141413" strokeWidth="5" />
        <line x1="0" y1="90" x2="400" y2="90" stroke="#141413" strokeWidth="5" />
      </svg>
    );
  }

  // Default: 'mondrian' (matches Screen 2 & Screen 3 Mastering Typography card)
  return (
    <svg
      viewBox="0 0 400 180"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="400" height="180" fill="#FDFBF7" />
      {/* Left column blocks */}
      <rect x="34" y="0" width="104" height="72" fill="#E53935" />
      <rect x="34" y="72" width="104" height="36" fill="#141413" />
      <rect x="34" y="108" width="90" height="32" fill="#FDD835" />
      {/* Right top cobalt blue circle */}
      <circle cx="268" cy="48" r="54" fill="#1565C0" />
      {/* Right bottom red triangle with white cutout */}
      <polygon points="184,180 264,100 344,180" fill="#E53935" />
      <circle cx="284" cy="148" r="14" fill="#FDFBF7" />
      {/* Bold black Mondrian grid bars */}
      <line x1="34" y1="0" x2="34" y2="180" stroke="#141413" strokeWidth="6" />
      <line x1="176" y1="0" x2="176" y2="180" stroke="#141413" strokeWidth="6" />
      <line x1="346" y1="0" x2="346" y2="180" stroke="#141413" strokeWidth="6" />
      <line x1="34" y1="92" x2="346" y2="92" stroke="#141413" strokeWidth="6" />
      <line x1="142" y1="72" x2="142" y2="180" stroke="#141413" strokeWidth="6" />
    </svg>
  );
};
