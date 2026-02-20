import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth, initAuth, onAuthStateChanged } from '../firebase'

// Firestore 경로: users/{userId}/collections/{collectionId}
//              users/{userId}/items/{itemId}
//              users/{userId}/groups/{groupId}

function collectionsRef(userId) {
  return collection(db, 'users', userId, 'collections')
}

function itemsRef(userId) {
  return collection(db, 'users', userId, 'items')
}

function groupsRef(userId) {
  return collection(db, 'users', userId, 'groups')
}

function collectionDoc(userId, collectionId) {
  return doc(db, 'users', userId, 'collections', collectionId)
}

function itemDoc(userId, itemId) {
  return doc(db, 'users', userId, 'items', itemId)
}

function groupDoc(userId, groupId) {
  return doc(db, 'users', userId, 'groups', groupId)
}

function userProfileDoc(userId) {
  return doc(db, 'users', userId)
}

export function useCollectionData() {
  const [userId, setUserId] = useState(null)
  const [user, setUser] = useState(null) // 사용자 정보 (이메일, 프로필 사진 등)
  const [userProfile, setUserProfile] = useState(null) // Firestore users/{uid} 문서
  const [authReady, setAuthReady] = useState(false)
  const [collections, setCollections] = useState({})
  const [items, setItems] = useState({})
  const [groups, setGroups] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  // 사용자 프로필을 Firestore에 저장/업데이트
  const saveUserProfile = useCallback(async (user) => {
    if (!user) return
    
    try {
      const userRef = doc(db, 'users', user.uid)
      
      const userData = {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        isAnonymous: user.isAnonymous || false,
        updatedAt: serverTimestamp(),
      }
      
      // setDoc with merge 옵션으로 생성/업데이트를 한 번에 처리
      // 이렇게 하면 getDoc 호출을 줄일 수 있고 권한 문제도 줄어듭니다
      await setDoc(userRef, {
        ...userData,
        createdAt: userData.createdAt || serverTimestamp(),
      }, { merge: true })
      
      console.log('✅ 사용자 프로필 저장 완료:', user.uid)
    } catch (error) {
      // 권한 오류는 무시 (이미 생성된 경우 등)
      if (error.code === 'permission-denied') {
        console.warn('⚠️ 사용자 프로필 저장 권한 없음 (이미 존재할 수 있음):', user.uid)
      } else {
        console.error('사용자 프로필 저장 실패:', error)
      }
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('✅ 인증 성공:', {
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          email: user.email,
          displayName: user.displayName,
        })
        
        // Firestore에 사용자 프로필 저장/업데이트
        await saveUserProfile(user)
        
        setUserId(user.uid)
        setUser(user)
      } else {
        // 로그아웃 상태 - 자동 익명 로그인 하지 않음
        console.log('🔓 로그아웃 상태')
        setUserId(null)
        setUser(null)
      }
      setAuthReady(true)
    })
    return () => unsubscribe()
  }, [saveUserProfile])

  const fetchData = useCallback(async () => {
    if (!userId) return
    try {
      setError(null)
      const [colSnap, itemsSnap, groupsSnap, profileSnap] = await Promise.all([
        getDocs(collectionsRef(userId)),
        getDocs(itemsRef(userId)),
        getDocs(groupsRef(userId)),
        getDoc(userProfileDoc(userId)),
      ])
      const cols = {}
      colSnap.docs.forEach((d) => {
        cols[d.id] = { id: d.id, ...d.data() }
      })
      const its = {}
      itemsSnap.docs.forEach((d) => {
        its[d.id] = { id: d.id, ...d.data() }
      })
      const grps = {}
      groupsSnap.docs.forEach((d) => {
        grps[d.id] = { id: d.id, ...d.data() }
      })
      setCollections(cols)
      setItems(its)
      setGroups(grps)
      setUserProfile(profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } : null)
    } catch (e) {
      console.error('Firestore 읽기 오류:', e)
      setError(e.message)
    } finally {
      setLoaded(true)
    }
  }, [userId])

  const updateUserProfile = useCallback(
    async (data) => {
      if (!userId) return
      try {
        const { id, uid, createdAt, ...rest } = data || {}
        await setDoc(
          userProfileDoc(userId),
          {
            ...rest,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
        setUserProfile((prev) => ({
          ...(prev || { uid: userId }),
          ...rest,
        }))
      } catch (e) {
        console.error('사용자 프로필 업데이트 오류:', e)
        setError(e.message)
      }
    },
    [userId]
  )

  useEffect(() => {
    if (userId) fetchData()
    else if (authReady && !userId) setLoaded(true)
  }, [userId, authReady, fetchData])

  const updateCollection = useCallback(
    async (collectionId, data) => {
      if (!userId) return
      try {
        const { id, ...rest } = data
        const updateData = {
          ...rest,
          updatedAt: new Date(),
        }
        await updateDoc(collectionDoc(userId, collectionId), updateData)
        setCollections((prev) => ({
          ...prev,
          [collectionId]: { ...prev[collectionId], ...updateData },
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
          groupId = config.groupId,
          thumbnail = '',
          thumbnailType = 'icon',
          iconId = 'folder',
          tag = '기타',
          memo = '',
          itemFields = [],
        } = config
        const gid = groupId || null
        const newCol = {
          name,
          thumbnail: thumbnail || '',
          thumbnailType: thumbnailType || 'icon',
          iconId: iconId || 'folder',
          tag: tag || '기타',
          memo: memo || '',
          itemFields: itemFields || [],
          groupId: gid,
          items: [],
          ownerUid: userId,
          visibility: 'private',
          updatedAt: new Date(),
        }
        const docRef = await addDoc(collectionsRef(userId), newCol)
        const id = docRef.id
        setCollections((prev) => ({
          ...prev,
          [id]: { id, ...newCol },
        }))
        if (gid) {
          // 그룹의 collections 배열에 추가
          const group = groups[gid]
          if (group) {
            await updateDoc(groupDoc(userId, gid), {
              collections: [...(group.collections || []), id],
            })
            setGroups((prev) => ({
              ...prev,
              [gid]: {
                ...prev[gid],
                collections: [...(prev[gid]?.collections || []), id],
              },
            }))
          }
        }
        return id
      } catch (e) {
        console.error('컬렉션 추가 오류:', e)
        setError(e.message)
        return null
      }
    },
    [userId, groups]
  )

  const addItem = useCallback(
    async (item, collectionId) => {
      if (!userId) {
        console.error('❌ 아이템 추가 실패: userId가 없습니다')
        return null
      }
      try {
        const { id, ...data } = item
        const now = serverTimestamp()
        
        // createdAt과 updatedAt 추가
        const itemData = {
          ...data,
          createdAt: now,
          updatedAt: now,
        }
        
        // 즉시 로컬 state 업데이트 (낙관적 업데이트)
        // 임시 ID로 먼저 추가하여 즉시 UI에 반영
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const tempItem = { id: tempId, ...itemData, createdAt: new Date(), updatedAt: new Date() }
        
        setItems((prev) => ({ ...prev, [tempId]: tempItem }))
        setCollections((prev) => ({
          ...prev,
          [collectionId]: {
            ...prev[collectionId],
            items: [...(prev[collectionId]?.items || []), tempId],
          },
        }))
        
        // Firestore에 실제 저장
        const docRef = await addDoc(itemsRef(userId), itemData)
        const newId = docRef.id
        
        // 실제 ID로 교체
        setItems((prev) => {
          const next = { ...prev }
          if (next[tempId]) {
            next[newId] = { id: newId, ...itemData }
            delete next[tempId]
          }
          return next
        })
        
        // 컬렉션의 items 배열 업데이트 (await 없이 백그라운드 처리)
        const currentItems = collections[collectionId]?.items || []
        updateDoc(collectionDoc(userId, collectionId), {
          items: [...currentItems.filter(id => id !== tempId), newId],
        }).catch((e) => {
          console.error('컬렉션 업데이트 오류:', e)
        })
        
        setCollections((prev) => ({
          ...prev,
          [collectionId]: {
            ...prev[collectionId],
            items: [...(prev[collectionId]?.items || []).filter(id => id !== tempId), newId],
          },
        }))
        
        return newId
      } catch (e) {
        console.error('❌ 아이템 추가 오류:', e)
        setError(e.message || '아이템 추가에 실패했습니다')
        
        // 실패 시 낙관적 업데이트 롤백
        setItems((prev) => {
          const next = { ...prev }
          Object.keys(next).forEach(id => {
            if (id.startsWith('temp_')) delete next[id]
          })
          return next
        })
        setCollections((prev) => ({
          ...prev,
          [collectionId]: {
            ...prev[collectionId],
            items: (prev[collectionId]?.items || []).filter(id => !id.startsWith('temp_')),
          },
        }))
        
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
        const itemData = {
          ...data,
          updatedAt: serverTimestamp(),
        }
        await updateDoc(itemDoc(userId, id), itemData)
        setItems((prev) => ({ ...prev, [id]: { ...item, updatedAt: new Date() } }))
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

  // 모든 사용자 데이터 삭제 (회원탈퇴용)
  const deleteAllUserData = useCallback(
    async () => {
      if (!userId) return
      try {
        // 모든 개인 컬렉션과 아이템 삭제
        const [colSnap, itemsSnap] = await Promise.all([
          getDocs(collectionsRef(userId)),
          getDocs(itemsRef(userId)),
        ])

        const batch = writeBatch(db)
        
        // 모든 아이템 삭제
        itemsSnap.docs.forEach((doc) => {
          batch.delete(doc.ref)
        })

        // 모든 컬렉션 삭제
        colSnap.docs.forEach((doc) => {
          batch.delete(doc.ref)
        })

        // 모든 그룹 삭제
        const groupsSnap = await getDocs(groupsRef(userId))
        groupsSnap.docs.forEach((doc) => {
          batch.delete(doc.ref)
        })

        // 사용자 프로필 삭제
        const userRef = doc(db, 'users', userId)
        batch.delete(userRef)

        await batch.commit()

        // 로컬 상태 초기화
        setCollections({})
        setItems({})
        setGroups({})

        console.log('✅ 모든 사용자 데이터 삭제 완료')
      } catch (e) {
        console.error('사용자 데이터 삭제 오류:', e)
        throw e
      }
    },
    [userId]
  )

  // 그룹 관리 함수들
  const addGroup = useCallback(
    async (name, color) => {
      if (!userId) return null
      try {
        const newGroup = {
          name: name || '새 그룹',
          color: color || '#3b82f6',
          collections: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        const docRef = await addDoc(groupsRef(userId), newGroup)
        const id = docRef.id
        setGroups((prev) => ({
          ...prev,
          [id]: { id, ...newGroup },
        }))
        return id
      } catch (e) {
        console.error('그룹 추가 오류:', e)
        setError(e.message)
        return null
      }
    },
    [userId]
  )

  const updateGroup = useCallback(
    async (groupId, data) => {
      if (!userId) return
      try {
        const { id, ...rest } = data
        const updateData = {
          ...rest,
          updatedAt: new Date(),
        }
        await updateDoc(groupDoc(userId, groupId), updateData)
        setGroups((prev) => ({
          ...prev,
          [groupId]: { ...prev[groupId], ...updateData },
        }))
      } catch (e) {
        console.error('그룹 수정 오류:', e)
        setError(e.message)
      }
    },
    [userId]
  )

  const deleteGroup = useCallback(
    async (groupId) => {
      if (!userId) return
      try {
        const group = groups[groupId]
        if (!group) return

        const batch = writeBatch(db)

        // 그룹에 속한 컬렉션들의 groupId를 null로 변경
        if (group.collections && group.collections.length > 0) {
          group.collections.forEach((collectionId) => {
            batch.update(collectionDoc(userId, collectionId), { groupId: null })
          })
          // 컬렉션 상태 업데이트
          setCollections((prev) => {
            const next = { ...prev }
            group.collections.forEach((collectionId) => {
              if (next[collectionId]) {
                next[collectionId] = { ...next[collectionId], groupId: null }
              }
            })
            return next
          })
        }

        // 그룹 삭제
        batch.delete(groupDoc(userId, groupId))

        await batch.commit()

        setGroups((prev) => {
          const next = { ...prev }
          delete next[groupId]
          return next
        })
      } catch (e) {
        console.error('그룹 삭제 오류:', e)
        setError(e.message)
      }
    },
    [userId, groups, collections]
  )

  return {
    userId,
    user,
    userProfile,
    authReady,
    collections,
    items,
    groups,
    loaded,
    error,
    addCollection,
    updateCollection,
    deleteCollection,
    addItem,
    updateItem,
    deleteItem,
    addGroup,
    updateGroup,
    deleteGroup,
    updateUserProfile,
    deleteAllUserData,
    refetch: fetchData,
  }
}
