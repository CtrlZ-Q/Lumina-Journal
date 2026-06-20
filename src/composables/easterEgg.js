import { loadState, saveState } from './useStorage'

const EASTER_KEY = 'dino-easter-eggs'

function getClaims() {
  return loadState(EASTER_KEY) || {}
}

export function isEasterClaimed(eventId, year, month, day) {
  const key = `${eventId}_${year}_${month}_${day}`
  return !!getClaims()[key]
}

export function markEasterClaimed(eventId, year, month, day) {
  const key = `${eventId}_${year}_${month}_${day}`
  const claims = getClaims()
  claims[key] = true
  saveState(claims, EASTER_KEY)
}
