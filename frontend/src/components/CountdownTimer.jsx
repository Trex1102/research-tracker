import { useState, useEffect } from 'react'
import { isPast, parseISO } from 'date-fns'
import { formatCountdown, getUrgency, URGENCY_COLORS } from '../lib/utils'

export default function CountdownTimer({ dateStr, label, compact = false }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!dateStr) return
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [dateStr])

  if (!dateStr) return null

  const date = parseISO(dateStr)
  const urgency = getUrgency(date)
  const countdown = formatCountdown(date)
  const colorClass = URGENCY_COLORS[urgency]

  if (compact) {
    return (
      <span className={`text-xs font-medium rounded px-1.5 py-0.5 ${colorClass}`}>
        {countdown}
      </span>
    )
  }

  return (
    <div className={`rounded-lg px-3 py-2 ${colorClass}`}>
      {label && <p className="text-xs opacity-75 mb-0.5">{label}</p>}
      <p className="font-semibold text-sm">{countdown}</p>
    </div>
  )
}
