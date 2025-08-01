import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility per combinare classi CSS con Tailwind
 * Unisce clsx e tailwind-merge per evitare conflitti tra classi
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatta numeri XP in formato leggibile (1.2K, 2.5M)
 * @param xp - Numero di XP da formattare
 * @param locale - Locale per la formattazione numerica
 */
export function formatXP(xp: number, locale = 'it-IT'): string {
  const formatter = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1
  })
  return formatter.format(xp)
}

/**
 * Formatta durata in minuti in formato ore/minuti localizzato
 * @param minutes - Minuti da formattare
 * @param locale - Locale per la formattazione
 */
export function formatDuration(minutes: number, locale = 'it-IT'): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  const rtf = new Intl.RelativeTimeFormat(locale)
  
  if (hours > 0) {
    return `${hours}h ${mins}m` // Questo potrebbe essere internazionalizzato
  }
  return `${mins}m`
}

/**
 * Restituisce la chiave per il saluto basata sull'ora corrente
 * Ritorna la chiave da usare nei file di traduzione
 */
export function getGreetingKey(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

/**
 * Calcola percentuale di progresso per il livello
 * @param currentXP - XP attuali
 * @param xpToNext - XP necessari per il prossimo livello
 */
export function calculateLevelProgress(currentXP: number, xpToNext: number): number {
  const totalXPForLevel = currentXP + xpToNext
  return Math.round((currentXP / totalXPForLevel) * 100)
}

/**
 * Formatta data usando Intl.DateTimeFormat
 * @param date - Data da formattare
 * @param locale - Locale per la formattazione
 * @param options - Opzioni di formattazione personalizzate
 */
export function formatDate(
  date: string | Date, 
  locale = 'it-IT',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date))
}

/**
 * Formatta tempo relativo (es: "2 giorni fa", "tra 3 ore")
 * @param date - Data di riferimento
 * @param locale - Locale per la formattazione
 */
export function formatRelativeTime(date: string | Date, locale = 'it-IT'): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const now = new Date()
  const targetDate = new Date(date)
  const diffInDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  return rtf.format(diffInDays, 'day')
}

/**
 * Converte un valore in percentuale sicura (0-100)
 * @param value - Valore da convertire
 * @param max - Valore massimo
 */
export function toPercentage(value: number, max: number): number {
  if (max === 0) return 0
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)))
}

/**
 * Debounce function per ottimizzare chiamate API
 * @param func - Funzione da debounceare
 * @param wait - Millisecondi di attesa
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}

/**
 * Genera colore consistente basato su stringa (per avatar, badge, etc)
 * @param str - Stringa da cui generare il colore
 */
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = hash % 360
  return `hsl(${hue}, 70%, 60%)`
}

/**
 * Tronca testo preservando le parole
 * @param text - Testo da troncare
 * @param maxLength - Lunghezza massima
 * @param suffix - Suffisso da aggiungere (default: "...")
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text
  
  const truncated = text.substring(0, maxLength - suffix.length)
  const lastSpaceIndex = truncated.lastIndexOf(' ')
  
  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + suffix
  }
  
  return truncated + suffix
}

/**
 * Verifica se un valore è un URL valido
 * @param string - Stringa da verificare
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

/**
 * Converte bytes in formato leggibile
 * @param bytes - Numero di bytes
 * @param decimals - Numero di decimali
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Genera initials da nome completo
 * @param name - Nome completo
 * @param maxInitials - Numero massimo di iniziali (default: 2)
 */
export function getInitials(name: string, maxInitials = 2): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, maxInitials)
    .join('')
}

/**
 * Sleep function per async/await
 * @param ms - Millisecondi di attesa
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Copia testo negli appunti
 * @param text - Testo da copiare
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

/**
 * Genera un ID univoco
 * @param prefix - Prefisso opzionale
 */
export function generateId(prefix?: string): string {
  const id = Math.random().toString(36).substring(2, 15) + 
            Math.random().toString(36).substring(2, 15)
  return prefix ? `${prefix}_${id}` : id
}
