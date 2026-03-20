import React from "react";

const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="102"
    height="103"
    viewBox="0 0 102 103"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-labelledby="logoTitle"
    {...props}
  >
    <title id="logoTitle">Logo</title>
    <g filter="url(#filter0_di_0_1)">
      <rect x="1" width="100" height="100" rx="26" fill="white" />
      <rect
        x="1.05"
        y="0.05"
        width="99.9"
        height="99.9"
        rx="25.95"
        stroke="black"
        strokeWidth="0.1"
      />
    </g>
    <path
      d="M12.1485 57.4263C12.1485 57.4263 19.9144 2.67276 42.6661 48.6C64.1649 91.9981 66.5916 41.6124 66.5916 41.6124"
      stroke="black"
      strokeWidth="2"
      strokeDasharray="4 4"
    />
    <path
      d="M69.7903 41.6403L88.8287 48.597C89.6304 48.8903 89.607 50.032 88.7937 50.2937L80.0803 53.082L77.292 61.7953C77.032 62.6086 75.8887 62.632 75.5953 61.8303L68.6403 42.7903C68.3787 42.0737 69.0737 41.3787 69.7903 41.6403Z"
      fill="#565656"
      fillOpacity="0.3"
    />
    <path
      d="M69.7903 41.6403L88.8287 48.597C89.6304 48.8903 89.607 50.032 88.7937 50.2937L80.0803 53.082L77.292 61.7953C77.032 62.6086 75.8887 62.632 75.5953 61.8303L68.6403 42.7903C68.3787 42.0737 69.0737 41.3787 69.7903 41.6403Z"
      stroke="#313131"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <filter
        id="filter0_di_0_1"
        x="0"
        y="0"
        width="102"
        height="103"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="2" />
        <feGaussianBlur stdDeviation="0.5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_0_1"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_0_1"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="2" />
        <feGaussianBlur stdDeviation="0.5" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
        />
        <feBlend mode="normal" in2="shape" result="effect2_innerShadow_0_1" />
      </filter>
    </defs>
  </svg>
);

export default Logo;
