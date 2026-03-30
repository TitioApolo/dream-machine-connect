export function LogoLeao({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="58" fill="none" stroke="#FFC300" strokeWidth="2" opacity="0.3" />
      
      {/* Mane - upper left */}
      <path
        d="M 40 50 Q 35 45 32 50 Q 28 55 32 62 Q 38 60 40 50"
        fill="#FFC300"
      />
      
      {/* Mane - upper center left */}
      <path
        d="M 50 35 Q 45 32 42 38 Q 40 45 48 50 Q 52 42 50 35"
        fill="#FFC300"
      />
      
      {/* Mane - top center */}
      <path
        d="M 60 28 Q 55 25 52 32 Q 50 42 60 48 Q 70 42 68 32 Q 65 25 60 28"
        fill="#FFC300"
      />
      
      {/* Mane - upper center right */}
      <path
        d="M 70 35 Q 75 32 78 38 Q 80 45 72 50 Q 68 42 70 35"
        fill="#FFC300"
      />
      
      {/* Mane - upper right */}
      <path
        d="M 80 50 Q 85 45 88 50 Q 92 55 88 62 Q 82 60 80 50"
        fill="#FFC300"
      />
      
      {/* Side mane - left */}
      <path
        d="M 32 60 Q 26 62 28 72 Q 32 75 38 70"
        fill="#FFC300"
      />
      
      {/* Side mane - right */}
      <path
        d="M 88 60 Q 94 62 92 72 Q 88 75 82 70"
        fill="#FFC300"
      />
      
      {/* Head circle */}
      <circle cx="60" cy="65" r="30" fill="#FFC300" />
      
      {/* Left eye background */}
      <circle cx="50" cy="60" r="8" fill="#0A0A0A" />
      
      {/* Right eye background */}
      <circle cx="70" cy="60" r="8" fill="#0A0A0A" />
      
      {/* Left eye - highlight */}
      <circle cx="50" cy="58" r="4" fill="#FFC300" />
      
      {/* Right eye - highlight */}
      <circle cx="70" cy="58" r="4" fill="#FFC300" />
      
      {/* Nose */}
      <ellipse cx="60" cy="75" rx="6" ry="8" fill="#0A0A0A" />
      
      {/* Mouth */}
      <path
        d="M 60 75 Q 55 82 52 80"
        stroke="#0A0A0A"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 60 75 Q 65 82 68 80"
        stroke="#0A0A0A"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Left whisker 1 */}
      <line x1="40" y1="65" x2="20" y2="62" stroke="#FFC300" strokeWidth="2" strokeLinecap="round" />
      
      {/* Left whisker 2 */}
      <line x1="38" y1="70" x2="15" y2="75" stroke="#FFC300" strokeWidth="2" strokeLinecap="round" />
      
      {/* Left whisker 3 */}
      <line x1="40" y1="75" x2="18" y2="85" stroke="#FFC300" strokeWidth="2" strokeLinecap="round" />
      
      {/* Right whisker 1 */}
      <line x1="80" y1="65" x2="100" y2="62" stroke="#FFC300" strokeWidth="2" strokeLinecap="round" />
      
      {/* Right whisker 2 */}
      <line x1="82" y1="70" x2="105" y2="75" stroke="#FFC300" strokeWidth="2" strokeLinecap="round" />
      
      {/* Right whisker 3 */}
      <line x1="80" y1="75" x2="102" y2="85" stroke="#FFC300" strokeWidth="2" strokeLinecap="round" />
      
      {/* Ears - left */}
      <path
        d="M 42 40 L 38 25 L 45 35 Z"
        fill="#FFC300"
      />
      
      {/* Ears - right */}
      <path
        d="M 78 40 L 82 25 L 75 35 Z"
        fill="#FFC300"
      />
    </svg>
  );
}
