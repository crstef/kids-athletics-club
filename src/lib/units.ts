import type { Result } from './types'

export type CanonicalUnit =
  | 'seconds'
  | 'minutesSeconds'
  | 'meters'
  | 'metersCentimeters'
  | 'points'
  | 'custom'

const unitAliasMatchers: Array<{ canonical: CanonicalUnit; test: (raw: string) => boolean }> = [
  { canonical: 'seconds', test: (raw) => /sec(ond|unde)?/.test(raw) && !/min/.test(raw) },
  { canonical: 'minutesSeconds', test: (raw) => /min/.test(raw) || /minute/.test(raw) },
  { canonical: 'metersCentimeters', test: (raw) => /metri/.test(raw) && /centi/.test(raw) },
  { canonical: 'meters', test: (raw) => /met(ers|ri)/.test(raw) },
  { canonical: 'points', test: (raw) => /punct|point/.test(raw) },
]

export function normalizeUnit(unit?: Result['unit'] | string | null): CanonicalUnit {
  if (!unit) return 'custom'
  const normalized = String(unit).trim().toLowerCase()
  const matcher = unitAliasMatchers.find(({ test }) => test(normalized))
  return matcher ? matcher.canonical : 'custom'
}

export function getUnitDisplayLabel(unit?: Result['unit'] | string | null): string {
  const canonical = normalizeUnit(unit)
  switch (canonical) {
    case 'seconds':
      return 'secunde'
    case 'minutesSeconds':
      return 'minute + secunde'
    case 'meters':
      return 'metri'
    case 'metersCentimeters':
      return 'metri + centimetri'
    case 'points':
      return 'puncte'
    default:
      return unit ? String(unit) : 'unitate'
  }
}

export function formatResultValue(value: number, unit?: Result['unit'] | string | null): string {
  const canonical = normalizeUnit(unit)
  const romanian = (num: number, fractionDigits = 2) => num.toFixed(fractionDigits).replace('.', ',')

  switch (canonical) {
    case 'seconds': {
      if (value >= 60) {
        const minutes = Math.floor(value / 60)
        const seconds = value - minutes * 60
        return `${minutes}m ${romanian(seconds, seconds % 1 === 0 ? 0 : 2)}s`
      }
      return `${romanian(value)} sec`
    }
    case 'minutesSeconds': {
      const minutes = Math.floor(value / 60)
      const seconds = value - minutes * 60
      const secondsFormatted = romanian(seconds, seconds % 1 === 0 ? 0 : 2)
      return `${minutes}m ${secondsFormatted}s`
    }
    case 'meters':
      return `${romanian(value)} m`
    case 'metersCentimeters': {
  const meters = Math.floor(value)
  const centimeters = Math.round((value - meters) * 100)
      if (centimeters === 100) {
        return `${meters + 1}m 00cm`
      }
      const padded = String(centimeters).padStart(2, '0')
      return `${meters}m ${padded}cm`
    }
    case 'points':
      return `${romanian(value, 0)} pct`
    default:
      return `${romanian(value)} ${unit ?? ''}`.trim()
  }
}

export function preferLowerValues(unit?: Result['unit'] | string | null): boolean {
  const canonical = normalizeUnit(unit)
  return canonical === 'seconds' || canonical === 'minutesSeconds'
}

export function splitValueForInputs(value: number, unit?: Result['unit'] | string | null): { primary: string; secondary?: string } {
  const canonical = normalizeUnit(unit)
  switch (canonical) {
    case 'minutesSeconds': {
      const minutes = Math.floor(value / 60)
      const seconds = value - minutes * 60
      return {
        primary: String(minutes),
        secondary: seconds > 0 ? seconds.toFixed(2).replace(/\.00$/, '') : '0',
      }
    }
    case 'metersCentimeters': {
  const meters = Math.floor(value)
  const centimeters = Math.round((value - meters) * 100)
      if (centimeters === 100) {
        return {
          primary: String(meters + 1),
          secondary: '0',
        }
      }
      return {
        primary: String(meters),
        secondary: String(centimeters),
      }
    }
    default:
      return { primary: value ? value.toString() : '' }
  }
}

export function buildValueFromInputs(primary: string, secondary: string | undefined, unit?: Result['unit'] | string | null): number | null {
  const canonical = normalizeUnit(unit)
  const toNumber = (val: string) => {
    const trimmed = val.trim().replace(',', '.')
    if (!trimmed) return 0
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : NaN
  }

  switch (canonical) {
    case 'minutesSeconds': {
      const minutes = toNumber(primary)
      const seconds = toNumber(secondary ?? '0')
      if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null
      return minutes * 60 + seconds
    }
    case 'metersCentimeters': {
      const meters = toNumber(primary)
      const centimeters = toNumber(secondary ?? '0')
      if (Number.isNaN(meters) || Number.isNaN(centimeters)) return null
      return meters + centimeters / 100
    }
    default: {
      const value = toNumber(primary)
      return Number.isNaN(value) ? null : value
    }
  }
}

export function getUnitPlaceholders(unit?: Result['unit'] | string | null): { primary: string; secondary?: string } {
  const canonical = normalizeUnit(unit)
  switch (canonical) {
    case 'seconds':
      return { primary: 'ex: 12.45' }
    case 'minutesSeconds':
      return { primary: 'minute (ex: 2)', secondary: 'secunde (ex: 35.20)' }
    case 'meters':
      return { primary: 'ex: 5.25' }
    case 'metersCentimeters':
      return { primary: 'metri (ex: 5)', secondary: 'centimetri (ex: 35)' }
    case 'points':
      return { primary: 'ex: 850' }
    default:
      return { primary: unit ? `ex: valoare în ${unit}` : 'ex: 10' }
  }
}
