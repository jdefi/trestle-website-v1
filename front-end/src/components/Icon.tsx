export default function Icon({ name, size = 24, className = "" }) {
  const icons = {
    logo: (
      <svg viewBox="0 0 256 256" fill="none" className={className} style={{ width: size, height: size }}>
        <defs>
          <linearGradient id="icon-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669"/>
            <stop offset="100%" stopColor="#047857"/>
          </linearGradient>
        </defs>
        <circle cx="128" cy="128" r="124" fill="url(#icon-bg)"/>
        <rect x="48" y="168" width="160" height="28" rx="6" fill="white" opacity="0.95"/>
        <rect x="72" y="120" width="112" height="24" rx="5" fill="white" opacity="0.85"/>
        <rect x="96" y="72" width="64" height="20" rx="4" fill="white" opacity="0.95"/>
      </svg>
    ),
    spinner: (
      <svg viewBox="0 0 32 32" className={className} style={{ width: size, height: size }}>
        <circle cx="16" cy="16" r="12" fill="none" stroke="#059669" strokeWidth="3" strokeDasharray="70 30" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="1s" repeatCount="indefinite"/>
        </circle>
      </svg>
    ),
    discord: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: size, height: size }}>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.198.024.283.088.177.128.248.348.2.562l-.573 2.723c-.042.188-.19.32-.38.375-.09.024-.18.014-.26-.024l-.008.001-.055-.024-1.516-.69c-.116-.053-.236-.01-.297.097-.053.096-.026.235.08.316l2.11 1.53c.08.06.13.16.14.27v4.46c0 .18-.1.34-.25.41-.15.07-.32.04-.44-.07l-1.98-2.38a.45.45 0 0 1-.07-.22v-4.5l.01-.01-2.1-1.52a.57.57 0 0 1-.2-.68c.05-.1.14-.16.24-.17h.06z"/>
      </svg>
    ),
    telegram: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: size, height: size }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
      </svg>
    ),
    github: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: size, height: size }}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    "globe": (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: size, height: size }}>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
        <ellipse cx="12" cy="12" rx="5" ry="10" fill="none" stroke="currentColor" strokeWidth="2"/>
        <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    email: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: size, height: size }}>
        <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M22 4L12 13 2 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    x: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={{ width: size, height: size }}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/>
      </svg>
    ),
  };
  return icons[name] || null;
}