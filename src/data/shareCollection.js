import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  query,
  getDocs,
  where,
  deleteDoc
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * 공유 컬렉션 생성 (실시간 동기화)
 * 개인 컬렉션을 collections/{collectionId}로 복사하고 visibility를 public으로 설정
 * @param {string} userId
 * @param {string} privateCollectionId - 개인 컬렉션 ID (users/{userId}/collections/{id})
 * @param {object} collectionData
 * @param {object[]} items
 * @returns {Promise<{ collectionId: string, url: string }>}
 */
export async function createShare(userId, privateCollectionId, collectionData, items) {
  if (!userId) {
    throw new Error('로그인이 필요합니다')
  }
  
  console.log('🔗 공유 컬렉션 생성 시도:', { userId, privateCollectionId })
  
  try {
    // 기존 공유 컬렉션 ID 확인 (개인 컬렉션에 저장된 shareCollectionId 사용)
    let shareCollectionId = collectionData?.shareCollectionId
    
    // 기존 공유 컬렉션이 있는지 확인
    if (shareCollectionId) {
      const existingShareRef = doc(db, 'collections', shareCollectionId)
      const existingSnap = await getDoc(existingShareRef)
      
      if (existingSnap.exists()) {
        const existingData = existingSnap.data()
        // 오너가 맞고 public이면 기존 링크 재사용
        if (existingData.ownerUid === userId && existingData.visibility === 'public') {
          console.log('♻️ 기존 공유 링크 재사용:', shareCollectionId)
          // 기존 공유 컬렉션 업데이트 (최신 데이터로)
          await updateSharedCollection(shareCollectionId, collectionData, items)
          const url = `${window.location.origin}/share/${shareCollectionId}`
          return { collectionId: shareCollectionId, url }
        }
      }
    }
    
    // 새로운 공유 컬렉션 ID 생성
    shareCollectionId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('✨ 새로운 공유 링크 생성:', shareCollectionId)
    
    // 먼저 컬렉션 문서 생성 (setDoc 사용 - create로 처리됨)
    const shareCollectionRef = doc(db, 'collections', shareCollectionId)
    const itemIds = []
    
    // 아이템 ID 목록 먼저 생성
    items.forEach((item) => {
      const itemId = item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      itemIds.push(itemId)
    })
    
    const collectionDataToSave = {
      ownerUid: userId,
      visibility: 'public',
      name: collectionData?.name || '',
      thumbnail: collectionData?.thumbnail || '',
      thumbnailType: collectionData?.thumbnailType || 'icon',
      iconId: collectionData?.iconId || 'folder',
      tag: collectionData?.tag || '기타',
      memo: collectionData?.memo || '',
      itemFields: collectionData?.itemFields || [],
      fieldVisibility: collectionData?.fieldVisibility || {}, // 필드별 열람 권한
      parentId: null,
      children: [],
      items: itemIds,
      updatedAt: serverTimestamp(),
    }
    
    console.log('📝 저장할 컬렉션 데이터:', { ...collectionDataToSave, updatedAt: '[serverTimestamp]' })
    console.log('🔐 ownerUid 확인:', collectionDataToSave.ownerUid, '===', userId, '?', collectionDataToSave.ownerUid === userId)
    
    // 컬렉션 문서 생성
    await setDoc(shareCollectionRef, collectionDataToSave)
    
    console.log('✅ 공유 컬렉션 생성 완료')
    
    // 아이템들을 배치로 생성
    if (items.length > 0) {
      const batch = writeBatch(db)
      items.forEach((item, index) => {
        const itemId = itemIds[index]
        const shareItemRef = doc(db, 'collections', shareCollectionId, 'items', itemId)
        batch.set(shareItemRef, {
          name: item.name || '',
          image: item.image || '',
          fields: item.fields || {},
        })
      })
      
      await batch.commit()
      console.log('✅ 공유 아이템 생성 완료:', itemIds.length, '개')
    }
    
    // 개인 컬렉션에 shareCollectionId 저장 (다음에 재사용하기 위해)
    // 이 부분은 useCollectionData에서 처리하도록 하거나, 여기서 직접 업데이트
    // 일단 shareCollectionId를 반환하고, 호출하는 쪽에서 저장하도록 함
    
    const url = `${window.location.origin}/share/${shareCollectionId}`
    return { collectionId: shareCollectionId, url }
  } catch (error) {
    console.error('❌ 공유 컬렉션 생성 실패:', error)
    console.error('오류 상세:', {
      code: error.code,
      message: error.message,
      userId,
      shareCollectionId,
    })
    throw error
  }
}

/**
 * 기존 공유 컬렉션 업데이트 (최신 데이터로 동기화)
 */
async function updateSharedCollection(shareCollectionId, collectionData, items) {
  const shareCollectionRef = doc(db, 'collections', shareCollectionId)
  const itemIds = []
  
  // 아이템 ID 목록 생성
  items.forEach((item) => {
    const itemId = item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    itemIds.push(itemId)
  })
  
  // 컬렉션 데이터 업데이트
  await updateDoc(shareCollectionRef, {
    name: collectionData?.name || '',
    thumbnail: collectionData?.thumbnail || '',
    thumbnailType: collectionData?.thumbnailType || 'icon',
    iconId: collectionData?.iconId || 'folder',
    tag: collectionData?.tag || '기타',
    memo: collectionData?.memo || '',
    itemFields: collectionData?.itemFields || [],
    fieldVisibility: collectionData?.fieldVisibility || {}, // 필드별 열람 권한
    items: itemIds,
    updatedAt: serverTimestamp(),
  })
  
  // 기존 아이템들 조회
  const itemsRef = collection(db, 'collections', shareCollectionId, 'items')
  const existingItemsSnap = await getDocs(itemsRef)
  const existingItemIds = new Set(existingItemsSnap.docs.map(d => d.id))
  const newItemIds = new Set(itemIds)
  
  // 삭제할 아이템들 (기존에 있지만 새 목록에 없는 것)
  const batch = writeBatch(db)
  existingItemsSnap.docs.forEach((docSnap) => {
    if (!newItemIds.has(docSnap.id)) {
      batch.delete(docSnap.ref)
    }
  })
  
  // 새 아이템들 추가/업데이트
  items.forEach((item, index) => {
    const itemId = itemIds[index]
    const shareItemRef = doc(db, 'collections', shareCollectionId, 'items', itemId)
    batch.set(shareItemRef, {
      name: item.name || '',
      image: item.image || '',
      fields: item.fields || {},
    })
  })
  
  await batch.commit()
  console.log('✅ 공유 컬렉션 업데이트 완료')
}

/**
 * 공유 컬렉션의 visibility를 private으로 변경 (공유 해제)
 * @param {string} userId
 * @param {string} collectionId
 */
export async function unshareCollection(userId, collectionId) {
  const shareCollectionRef = doc(db, 'collections', collectionId)
  const snap = await getDoc(shareCollectionRef)
  
  if (!snap.exists()) {
    throw new Error('컬렉션을 찾을 수 없습니다')
  }
  
  const data = snap.data()
  if (data.ownerUid !== userId) {
    throw new Error('권한이 없습니다')
  }
  
  // visibility를 private으로 변경
  await setDoc(shareCollectionRef, {
    ...data,
    visibility: 'private',
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

/**
 * 공유 컬렉션 실시간 구독 (컬렉션 + 아이템들)
 * @param {string} collectionId
 * @param {function} callback - ({ collection, items }) => void
 * @returns {function} unsubscribe 함수
 */
export function subscribeSharedCollection(collectionId, callback) {
  const collectionRef = doc(db, 'collections', collectionId)
  const itemsRef = collection(db, 'collections', collectionId, 'items')
  
  let collectionData = null
  let itemsData = {}
  
  const unsubscribeCollection = onSnapshot(collectionRef, (snap) => {
    if (!snap.exists()) {
      callback({ collection: null, items: [] })
      return
    }
    
    const data = snap.data()
    // public이 아니면 접근 불가
    if (data.visibility !== 'public') {
      callback({ collection: null, items: [] })
      return
    }
    
    collectionData = {
      id: snap.id,
      ...data,
    }
    
    // 아이템 데이터가 있으면 콜백 호출
    if (Object.keys(itemsData).length > 0 || collectionData.items?.length === 0) {
      const items = collectionData.items
        ?.map((itemId) => itemsData[itemId])
        .filter(Boolean) || []
      callback({ collection: collectionData, items })
    }
  })
  
  const unsubscribeItems = onSnapshot(itemsRef, (snap) => {
    itemsData = {}
    snap.docs.forEach((doc) => {
      itemsData[doc.id] = {
        id: doc.id,
        ...doc.data(),
      }
    })
    
    // 컬렉션 데이터가 있으면 콜백 호출
    if (collectionData) {
      const items = collectionData.items
        ?.map((itemId) => itemsData[itemId])
        .filter(Boolean) || []
      callback({ collection: collectionData, items })
    }
  })
  
  // unsubscribe 함수 반환
  return () => {
    unsubscribeCollection()
    unsubscribeItems()
  }
}

/**
 * 공유 컬렉션 일회성 조회 (호환성 유지)
 * @param {string} collectionId
 * @returns {Promise<{ collection: object, items: object[] } | null>}
 */
export async function getSharedCollection(collectionId) {
  const collectionRef = doc(db, 'collections', collectionId)
  const snap = await getDoc(collectionRef)
  
  if (!snap.exists()) {
    return null
  }
  
  const data = snap.data()
  
  // public이 아니면 접근 불가
  if (data.visibility !== 'public') {
    return null
  }
  
  // 아이템들 조회
  const itemsSnap = await getDocs(collection(db, 'collections', collectionId, 'items'))
  const items = itemsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
  
  return {
    collection: {
      id: snap.id,
      ...data,
    },
    items,
  }
}

/**
 * 사용자가 소유한 모든 공유 컬렉션 삭제
 * @param {string} userId
 */
export async function deleteAllSharedCollections(userId) {
  if (!userId) {
    throw new Error('사용자 ID가 필요합니다')
  }

  try {
    // 사용자가 소유한 모든 공유 컬렉션 조회
    const collectionsRef = collection(db, 'collections')
    const q = query(collectionsRef, where('ownerUid', '==', userId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log('삭제할 공유 컬렉션이 없습니다')
      return
    }

    console.log(`삭제할 공유 컬렉션 ${querySnapshot.size}개 발견`)

    // 각 공유 컬렉션과 그 아이템들을 삭제
    const batch = writeBatch(db)
    const deletePromises = []

    querySnapshot.docs.forEach((docSnap) => {
      const collectionId = docSnap.id
      
      // 컬렉션 문서 삭제
      batch.delete(docSnap.ref)
      
      // 컬렉션의 아이템들도 삭제 (서브컬렉션은 배치로 직접 삭제 불가능하므로 별도 처리)
      deletePromises.push(
        (async () => {
          const itemsRef = collection(db, 'collections', collectionId, 'items')
          const itemsSnap = await getDocs(itemsRef)
          
          const itemBatch = writeBatch(db)
          itemsSnap.docs.forEach((itemDoc) => {
            itemBatch.delete(itemDoc.ref)
          })
          
          if (itemsSnap.docs.length > 0) {
            await itemBatch.commit()
            console.log(`컬렉션 ${collectionId}의 아이템 ${itemsSnap.docs.length}개 삭제 완료`)
          }
        })()
      )
    })

    // 배치 커밋
    await batch.commit()
    console.log('공유 컬렉션 문서 삭제 완료')

    // 아이템 삭제 대기
    await Promise.all(deletePromises)

    console.log('✅ 모든 공유 컬렉션 삭제 완료')
  } catch (error) {
    console.error('❌ 공유 컬렉션 삭제 실패:', error)
    throw error
  }
}
