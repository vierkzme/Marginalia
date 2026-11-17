import React from 'react';

export interface MarginaliaLogoProps {
  className?: string;
}

/**
 * Custom Marginalia SVG brand mark following the Tactile Neo-Brutalist & Bauhaus style:
 * an open book forming a geometric "M" with a sentence-mining highlight and margin note.
 */
export const MarginaliaLogo: React.FC<MarginaliaLogoProps> = ({
  className = 'w-9 h-9',
}) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Hard Neo-Brutalist Offset Shadow */}
      <rect
        x="4"
        y="4"
        width="34"
        height="34"
        rx="10"
        className="fill-[#141413] dark:fill-[#050505]"
      />
      {/* Primary Electric Violet Badge */}
      <rect
        x="2"
        y="2"
        width="34"
        height="34"
        rx="10"
        fill="#5B2DF5"
        strokeWidth="2.5"
        className="stroke-[#141413] dark:stroke-[#3A3E4C]"
      />
      {/* Open Book Spread Forming Geometric 'M' */}
      <path
        d="M8 10.5L19 16L30 10.5V27.5L19 23.5L8 27.5V10.5Z"
        fill="#FDFBF7"
        stroke="#141413"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Central Book Spine */}
      <line
        x1="19"
        y1="16"
        x2="19"
        y2="23.5"
        stroke="#141413"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Left Page: Amber Sentence-Mining Highlight */}
      <rect
        x="10.8"
        y="16.5"
        width="5.4"
        height="3"
        rx="1"
        fill="#FDD835"
        stroke="#141413"
        strokeWidth="1.2"
      />
      <line
        x1="11"
        y1="22.3"
        x2="16"
        y2="21.1"
        stroke="#141413"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Right Page: Bauhaus Crimson Margin Note */}
      <circle
        cx="24.5"
        cy="17.5"
        r="2.1"
        fill="#E53935"
        stroke="#141413"
        strokeWidth="1.2"
      />
      <line
        x1="22"
        y1="21.2"
        x2="27"
        y2="22.4"
        stroke="#141413"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};
