import React from 'react';
import { useApp } from '../context/AppContext';

export default function BrandLogo({ compact = false }) {
  const { language } = useApp();

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      {/* Original VenderSathi SVG Mark: Street Cart Wheel + Fresh Leaf Canopy */}
      <svg
        width="38"
        height="38"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="40" height="40" rx="11" fill="#15803D" />
        {/* Canopy */}
        <path
          d="M8 15C8 11.6863 10.6863 9 14 9H26C29.3137 9 32 11.6863 32 15H8Z"
          fill="#F97316"
        />
        <path d="M13 9V15M20 9V15M27 9V15" stroke="#FFFBEB" strokeWidth="1.6" />
        {/* Cart tray */}
        <path
          d="M9 19H29L27.2 25.5C26.9 26.5 26 27.2 24.9 27.2H12.8C11.7 27.2 10.8 26.5 10.5 25.5L9 19Z"
          fill="#DCFCE7"
        />
        {/* Fresh leaf sprout */}
        <path
          d="M20 19C20 16.5 22.2 15.2 24.5 15.5C24.2 17.8 22.5 19 20 19Z"
          fill="#4ADE80"
        />
        {/* Cart wheel & handle */}
        <circle cx="15" cy="30.5" r="2.7" stroke="#FFFBEB" strokeWidth="2" fill="#15803D" />
        <circle cx="24.5" cy="30.5" r="2.7" stroke="#FFFBEB" strokeWidth="2" fill="#15803D" />
        <path d="M29 19L32.5 17" stroke="#FFFBEB" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {!compact && (
        <div className="leading-tight">
          <div className="font-extrabold text-lg tracking-tight text-stone-900 flex items-center gap-1.5">
            <span>VenderSathi</span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
              {language === 'kn' ? 'ಸ್ಥಳೀಯ' : 'ವೆಂಡರ್ ಸಾಥಿ'}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 hidden sm:block">
            {language === 'kn'
              ? 'ಬೀದಿ ವ್ಯಾಪಾರಿಗಳಿಂದ ನೇರ ಮನೆ ಬಾಗಿಲಿಗೆ'
              : 'Neighborhood Street Vendors'}
          </p>
        </div>
      )}
    </div>
  );
}
