import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore'
import { db, auth, initAuth, onAuthStateChanged } from '../firebase'

// Firestore 경로: users/{userId}/collections/{collectionId}
//              users/{userId}/items/{itemId}

function collectionsRef(userId) {
  return collection(db, 'users', userId, 'collections')
}

function itemsRef(userId) {
  return collection(db, 'users', userId, 'items')
}

function collectionDoc(userId, collectionId) {
  return doc(db, 'users', userId, 'collections', collectionId)
}

function itemDoc(userId, itemId) {
  return doc(db, 'users', userId, 'items', itemId)
}

export function useCollectionData() {
  const [userId, setUserId] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [collections, setCollections] = useState({})
  const [items, setItems] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
        try {
          await initAuth()
        } catch (e) {
          console.error('Auth 초기화 실패:', e)
          setError(e.message)
          setAuthReady(true)
        }
      }
      setAuthReady(true)
    })
    return () => unsubscribe()
  }, [])

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      setError(null)
      const [colSnap, itemsSnap] = await Promise.all([
        getDocs(collectionsRef(userId)),
        getDocs(itemsRef(userId)),
      ])
      const cols = {}
      colSnap.docs.forEach((d) => {
        cols[d.id] = { id: d.id, ...d.data() }
      })
      const its = {}
      itemsSnap.docs.forEach((d) => {
        its[d.id] = { id: d.id, ...d.data() }
      })
      setCollections(cols)
      setItems(its)
    } catch (e) {
      console.error('Firestore 읽기 오류:', e)
      setError(e.message)
    } finally {
      setLoaded(true)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchData()
    else if (authReady && !userId) setLoaded(true)
  }, [userId, authReady, fetchData])

  const updateCollection = useCallback(
    async (collectionId, data) => {
      if (!userId) return
      try {
        const { id, ...rest } = data
        await updateDoc(collectionDoc(userId, collectionId), rest)
        setCollections((prev) => ({
          ...prev,
          [collectionId]: { ...prev[collectionId], ...rest },
        }))
      } catch (e) {
        console.error('컬렉션 수정 오류:', e)
        setError(e.message)
      }
    },
    [userId]
  )

  const deleteCollection = useCallback(
    async (collectionId) => {
      if (!userId) return
      try {
        const col = collections[collectionId]
        if (!col) return

        const batch = writeBatch(db)
        const itemIdsToDelete = new Set(col.items || [])

        // 재귀적으로 하위 컬렉션의 아이템도 수집
        const collectItems = (cid) => {
          const c = collections[cid]
          if (!c) return
          ;(c.items || []).forEach((iid) => itemIdsToDelete.add(iid))
          ;(c.children || []).forEach(collectItems)
        }
        ;(col.children || []).forEach(collectItems)

        itemIdsToDelete.forEach((itemId) => {
          batch.delete(itemDoc(userId, itemId))
        })

        const deleteColRecursive = (cid) => {
          const c = collections[cid]
          if (!c) return
          ;(c.children || []).forEach(deleteColRecursive)
          batch.delete(collectionDoc(userId, cid))
        }
        deleteColRecursive(collectionId)

        if (col.parentId) {
          const newChildren = (collections[col.parentId]?.children || []).filter(
            (id) => id !== collectionId
          )
          batch.update(collectionDoc(userId, col.parentId), { children: newChildren })
        }

        await batch.commit()

        setItems((prev) => {
          const next = { ...prev }
          itemIdsToDelete.forEach((id) => delete next[id])
          return next
        })
        setCollections((prev) => {
          const next = { ...prev }
          const removeRecursive = (cid) => {
            const c = next[cid]
            if (!c) return
            ;(c.children || []).forEach(removeRecursive)
            delete next[cid]
          }
          removeRecursive(collectionId)
          if (col.parentId && next[col.parentId]) {
            next[col.parentId] = {
              ...next[col.parentId],
              children: (next[col.parentId].children || []).filter((id) => id !== collectionId),
            }
          }
          return next
        })
      } catch (e) {
        console.error('컬렉션 삭제 오류:', e)
        setError(e.message)
      }
    },
    [userId, collections]
  )

  const addCollection = useCallback(
    async (configOrName, parentIdArg) => {
      if (!userId) return null
      try {
        const isObj = typeof configOrName === 'object'
        const config = isObj ? configOrName : { name: configOrName, parentId: parentIdArg }
        const {
          name,
          parentId = config.parentId,
          thumbnail = '',
          thumbnailType = 'icon',
          iconId = 'folder',
          tag = '기타',
          memo = '',
          itemFields = [],
        } = config
        const pid = parentId || null
        const newCol = {
          name,
          thumbnail: thumbnail || '',
          thumbnailType: thumbnailType || 'icon',
          iconId: iconId || 'folder',
          tag: tag || '기타',
          memo: memo || '',
          itemFields: itemFields || [],
          parentId: pid,
          children: [],
          items: [],
        }
        const docRef = await addDoc(collectionsRef(userId), newCol)
        const id = docRef.id
        setCollections((prev) => ({
          ...prev,
          [id]: { id, ...newCol },
        }))
        if (pid) {
          await updateDoc(collectionDoc(userId, pid), {
            children: [...(collections[pid]?.children || []), id],
          })
          setCollections((prev) => ({
            ...prev,
            [pid]: {
              ...prev[pid],
              children: [...(prev[pid]?.children || []), id],
            },
          }))
        }
        return id
      } catch (e) {
        console.error('컬렉션 추가 오류:', e)
        setError(e.message)
        return null
      }
    },
    [userId, collections]
  )

  const addItem = useCallback(
    async (item, collectionId) => {
      if (!userId) return null
      try {
        const { id, ...data } = item
        const docRef = await addDoc(itemsRef(userId), data)
        const newId = docRef.id
        setItems((prev) => ({ ...prev, [newId]: { id: newId, ...data } }))
        await updateDoc(collectionDoc(userId, collectionId), {
          items: [...(collections[collectionId]?.items || []), newId],
        })
        setCollections((prev) => ({
          ...prev,
          [collectionId]: {
            ...prev[collectionId],
            items: [...(prev[collectionId]?.items || []), newId],
          },
        }))
        return newId
      } catch (e) {
        console.error('아이템 추가 오류:', e)
        setError(e.message)
        return null
      }
    },
    [userId, collections]
  )

  const updateItem = useCallback(
    async (item) => {
      if (!userId) return
      try {
        const { id, ...data } = item
        await updateDoc(itemDoc(userId, id), data)
        setItems((prev) => ({ ...prev, [id]: item }))
      } catch (e) {
        console.error('아이템 수정 오류:', e)
        setError(e.message)
      }
    },
    [userId]
  )

  const deleteItem = useCallback(
    async (itemId, collectionId) => {
      if (!userId) return
      try {
        await deleteDoc(itemDoc(userId, itemId))
        const newItems = (collections[collectionId]?.items || []).filter(
          (id) => id !== itemId
        )
        await updateDoc(collectionDoc(userId, collectionId), { items: newItems })
        setItems((prev) => {
          const next = { ...prev }
          delete next[itemId]
          return next
        })
        setCollections((prev) => ({
          ...prev,
          [collectionId]: { ...prev[collectionId], items: newItems },
        }))
      } catch (e) {
        console.error('아이템 삭제 오류:', e)
        setError(e.message)
      }
    },
    [userId, collections]
  )

  return {
    userId,
    authReady,
    collections,
    items,
    loaded,
    error,
    addCollection,
    updateCollection,
    deleteCollection,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchData,
  }
}
