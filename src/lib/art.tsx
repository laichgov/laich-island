export const LEAF = 'M50 4 L58 22 L72 16 L68 40 L92 32 L83 52 L97 58 L68 79 L72 90 L54 85 L54 99 L46 99 L46 85 L28 90 L32 79 L3 58 L17 52 L8 32 L32 40 L28 16 L42 22 Z'

export function Flag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 200" className={className} role="img" aria-label="National flag of the Commonwealth of Laich Island">
      <rect width="300" height="200" fill="#fff" />
      <path d="M0 0L300 200M300 0L0 200" stroke="#1F8A5B" strokeWidth="30" />
      <circle cx="150" cy="100" r="52" fill="#1E6FD9" stroke="#fff" strokeWidth="4" />
      <path d={LEAF} fill="#fff" transform="translate(120 70) scale(.6)" />
    </svg>
  )
}

export function Ensign({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 200" className={className} role="img" aria-label="Eco-Defense and Coast Guard ensign">
      <rect width="300" height="200" fill="#fff" />
      <rect x="128" width="44" height="200" fill="#1F8A5B" />
      <rect y="78" width="300" height="44" fill="#1F8A5B" />
      <circle cx="150" cy="100" r="44" fill="#fff" />
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={i} cx="150" cy="60" rx="5" ry="11" fill="#708238" transform={`rotate(${i * (360 / 14)} 150 100)`} />
      ))}
      <circle cx="150" cy="100" r="22" fill="#1F8A5B" />
    </svg>
  )
}
