import { db } from '../firebase'
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { Match } from '../types'

const REGISTRY_REF = doc(db, 'tournament', 'registry_v1')

export const listenFixtures = (cb: (fixtures: Match[]) => void) => {
  return onSnapshot(REGISTRY_REF, snap => {
    if (!snap.exists()) return cb([])
    cb(snap.data().fixtures || [])
  })
}

export const updateScore = async (
  matchId: string,
  scoreA: number,
  scoreB: number
) => {
  const snap = await getDoc(REGISTRY_REF)
  if (!snap.exists()) return

  const fixtures: Match[] = snap.data().fixtures || []

  const updated = fixtures.map(m =>
    m.id === matchId
      ? { ...m, scoreA, scoreB, status: 'played' }
      : m
  )

  await updateDoc(REGISTRY_REF, {
    fixtures: updated
  })
}
