import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../firebase'

const CARDS_COLLECTION = 'cards'

export function useCards() {
  const [cards, setCards] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  const fetchCards = useCallback(async () => {
    try {
      setError(null)
      const querySnapshot = await getDocs(collection(db, CARDS_COLLECTION))
      const data = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      setCards(data)
    } catch (e) {
      console.error('Firestore 읽기 오류:', e)
      setError(e.message)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  const addCard = useCallback(async (card) => {
    try {
      const data = {
        name: card.name ?? '',
        variant: card.variant ?? '',
        purchasePrice: card.purchasePrice ?? 0,
        purchaseDate: card.purchaseDate ?? new Date().toISOString().slice(0, 10),
        condition: card.condition ?? '새상품',
        grade: card.grade ?? null,
        imageUrl: card.imageUrl ?? '',
        notes: card.notes ?? '',
      }
      const docRef = await addDoc(collection(db, CARDS_COLLECTION), data)
      setCards((prev) => [...prev, { id: docRef.id, ...data }])
    } catch (e) {
      console.error('Firestore 추가 오류:', e)
      setError(e.message)
    }
  }, [])

  const updateCard = useCallback(async (id, updates) => {
    try {
      await updateDoc(doc(db, CARDS_COLLECTION, id), updates)
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      )
    } catch (e) {
      console.error('Firestore 수정 오류:', e)
      setError(e.message)
    }
  }, [])

  const deleteCard = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, CARDS_COLLECTION, id))
      setCards((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      console.error('Firestore 삭제 오류:', e)
      setError(e.message)
    }
  }, [])

  return {
    cards,
    loaded,
    error,
    addCard,
    updateCard,
    deleteCard,
    refetch: fetchCards,
  }
}
