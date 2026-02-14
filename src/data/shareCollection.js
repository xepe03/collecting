import { collection, doc, addDoc, getDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

const SHARE_EXPIRY_DAYS = 30

/**
 * Firestore shared 컬렉션에 읽기전용 데이터 저장 후 링크 반환 (30일 후 만료)
 * @param {string} userId
 * @param {object} collectionData
 * @param {object[]} items
 * @returns {Promise<{ token: string, url: string }>}
 */
export async function createShare(userId, collectionData, items) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SHARE_EXPIRY_DAYS)

  const payload = {
    collectionName: collectionData?.name || '',
    itemFields: collectionData?.itemFields || [],
    items: (items || []).map(({ name, image, fields }) => ({
      name: name || '',
      image: image || '',
      fields: fields || {},
    })),
    ownerId: userId,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
  }
  const ref = await addDoc(collection(db, 'shared'), payload)
  const token = ref.id
  const url = `${window.location.origin}/share/${token}`
  return { token, url }
}

/**
 * Firestore에서 공유 컬렉션 조회
 * @param {string} token
 * @returns {Promise<{ collection: object, items: object[] } | null>}
 */
export async function getSharedCollection(token) {
  const ref = doc(db, 'shared', token)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const d = snap.data()
  const expiresAt = d.expiresAt
  if (expiresAt && expiresAt.toMillis && expiresAt.toMillis() < Date.now()) {
    try {
      await deleteDoc(ref)
    } catch {}
    return null
  }
  const collection = {
    name: d.collectionName || '',
    itemFields: d.itemFields || [],
  }
  const items = (d.items || []).map((it, idx) => ({
    id: `item-${idx}`,
    name: it.name || '',
    image: it.image || '',
    fields: it.fields || {},
  }))
  return { collection, items }
}
