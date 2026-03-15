interface AvatarProps {
  name?: string | null
  size?: 'sm' | 'md'
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'
  return <div className={`avatar ${size === 'sm' ? 'sm' : ''}`}>{initials}</div>
}
