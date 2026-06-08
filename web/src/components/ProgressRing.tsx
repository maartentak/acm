interface Props {
  progress: number
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  label?: boolean
  labelColor?: string
}

export default function ProgressRing({
  progress,
  size = 40,
  stroke = 5,
  color = '#F97316',
  trackColor = 'rgba(237,231,223,0.18)',
  label = false,
  labelColor = '#EDE7DF',
}: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, progress))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {label && (
        <span className="absolute text-[10px] font-semibold" style={{ color: labelColor }}>
          {Math.round(clamped * 100)}
        </span>
      )}
    </div>
  )
}
