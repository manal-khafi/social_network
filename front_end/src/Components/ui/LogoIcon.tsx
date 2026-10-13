/** The ANMOUGAR mark: stylized network nodes. */
export function LogoIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="5" fill="#18534f" />
      <circle cx="8" cy="12" r="4" fill="#226d68" />
      <circle cx="32" cy="12" r="4" fill="#226d68" />
      <circle cx="8" cy="28" r="4" fill="#d6955b" />
      <circle cx="32" cy="28" r="4" fill="#d6955b" />
      <line x1="20" y1="20" x2="8" y2="12" stroke="#226d68" strokeWidth="2" />
      <line x1="20" y1="20" x2="32" y2="12" stroke="#226d68" strokeWidth="2" />
      <line x1="20" y1="20" x2="8" y2="28" stroke="#d6955b" strokeWidth="2" />
      <line x1="20" y1="20" x2="32" y2="28" stroke="#d6955b" strokeWidth="2" />
    </svg>
  );
}
