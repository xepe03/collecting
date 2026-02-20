import { useState } from 'react'
import { Plus, User, ChevronLeft, ChevronRight, Folder, ChevronDown, ChevronUp } from 'lucide-react'
import CollectionTree from './CollectionTree'

export default function Sidebar({
  collections,
  groups,
  selectedCollection,
  expandedCollections,
  showProfileView,
  onSelectCollection,
  onToggleExpand,
  onAddCollection,
  onOpenCollectionEdit,
  onOpenCollectionDelete,
  onOpenCollectionGroupSelect,
  onUpdateCollectionOrder,
  onUpdateCollectionGroup,
  onProfileClick,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [collapsedGroups, setCollapsedGroups] = useState(new Set())
  const rootCollections = Object.values(collections).filter((c) => !c.parentId && !c.groupId)
  const currentCollection = selectedCollection ? collections[selectedCollection] : null

  // 컬렉션을 만든 순서대로 정렬 (문서 ID 기준, Firestore ID는 시간순)
  const sortedRootCollections = [...rootCollections].sort((a, b) => {
    // 문서 ID를 비교하여 시간순 정렬
    return a.id.localeCompare(b.id)
  })

  // 컬렉션 이름의 첫 두 글자 추출
  const getCollectionInitials = (name) => {
    if (!name) return ''
    const trimmed = name.trim()
    if (trimmed.length <= 2) return trimmed
    return trimmed.slice(0, 2)
  }

  // 그룹별로 컬렉션 정리
  const collectionsByGroup = {}
  const ungroupedCollections = []
  
  Object.values(collections).forEach((collection) => {
    if (collection.groupId) {
      if (!collectionsByGroup[collection.groupId]) {
        collectionsByGroup[collection.groupId] = []
      }
      collectionsByGroup[collection.groupId].push(collection)
    } else if (!collection.parentId) {
      ungroupedCollections.push(collection)
    }
  })

  // 그룹별 컬렉션 정렬 (order 필드 기준, 없으면 생성 순서)
  Object.keys(collectionsByGroup).forEach((groupId) => {
    collectionsByGroup[groupId].sort((a, b) => {
      const orderA = a.order ?? 0
      const orderB = b.order ?? 0
      if (orderA !== orderB) return orderA - orderB
      return a.id.localeCompare(b.id)
    })
  })
  ungroupedCollections.sort((a, b) => {
    const orderA = a.order ?? 0
    const orderB = b.order ?? 0
    if (orderA !== orderB) return orderA - orderB
    return a.id.localeCompare(b.id)
  })

  const handleDragStart = (collectionId) => {
    setDraggingId(collectionId)
  }

  const handleDragOver = (collectionId) => {
    if (draggingId && draggingId !== collectionId) {
      setDragOverId(collectionId)
    }
  }

  const handleDrop = (draggedId, targetId, targetGroupId = null) => {
    if (!draggedId) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const dragged = collections[draggedId]
    if (!dragged) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    // 그룹 헤더에 드롭한 경우 (targetId가 null이고 targetGroupId가 있음)
    if (targetGroupId !== null && !targetId) {
      // 그룹 변경
      console.log('handleDrop: 그룹 헤더에 드롭', draggedId, targetGroupId, 'onUpdateCollectionGroup:', typeof onUpdateCollectionGroup)
      if (onUpdateCollectionGroup) {
        onUpdateCollectionGroup(draggedId, targetGroupId)
      } else {
        console.error('onUpdateCollectionGroup가 정의되지 않음')
      }
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    // 그룹 없는 영역에 드롭한 경우 (targetGroupId가 null)
    if (targetGroupId === null && !targetId) {
      // 그룹 해제
      onUpdateCollectionGroup?.(draggedId, null)
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    if (!targetId || draggedId === targetId) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const target = collections[targetId]
    if (!target) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    // 다른 그룹으로 이동하는 경우
    if (dragged.groupId !== target.groupId) {
      // 그룹 변경
      onUpdateCollectionGroup?.(draggedId, target.groupId)
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    // 같은 그룹 내에서 순서 변경
    const groupId = dragged.groupId
    const groupCollections = groupId 
      ? collectionsByGroup[groupId] || []
      : ungroupedCollections

    // 순서 재계산
    const draggedIndex = groupCollections.findIndex(c => c.id === draggedId)
    const targetIndex = groupCollections.findIndex(c => c.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    // 새로운 순서 배열 생성
    const newOrder = []
    groupCollections.forEach((col, index) => {
      if (col.id === draggedId) {
        newOrder.push(targetIndex)
      } else if (col.id === targetId) {
        if (draggedIndex < targetIndex) {
          newOrder.push(index - 1)
        } else {
          newOrder.push(index + 1)
        }
      } else {
        newOrder.push(col.order ?? index)
      }
    })

    // 순서 업데이트
    onUpdateCollectionOrder?.(draggedId, targetId, groupCollections, newOrder)

    setDraggingId(null)
    setDragOverId(null)
  }

  const handleGroupHeaderDragOver = (e, groupId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(`group-${groupId}`)
  }

  const handleGroupHeaderDrop = (e, groupId) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId) {
      handleDrop(draggedId, null, groupId)
    }
  }

  const handleUngroupedAreaDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId('ungrouped')
  }

  const handleUngroupedAreaDrop = (e) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId) {
      handleDrop(draggedId, null, null)
    }
  }

  if (isCollapsed) {
    // 모든 루트 컬렉션 (그룹 있는 것 포함)
    const allRootCollections = Object.values(collections).filter((c) => !c.parentId)
    const sortedAllRootCollections = [...allRootCollections].sort((a, b) => a.id.localeCompare(b.id))
    
    // 현재 선택된 컬렉션과 나머지 컬렉션 분리
    const otherCollections = sortedAllRootCollections.filter(
      (c) => c.id !== selectedCollection
    )

    return (
      <aside className="w-20 flex flex-col bg-zinc-800/50 backdrop-blur-xl border-r border-zinc-700/50 shadow-xl">
        <div className="px-3 py-4 border-b border-zinc-700/50 flex items-center justify-center relative">
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute top-2 right-2 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
            title="사이드바 펼치기"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center py-4 gap-3 overflow-y-auto">
          {/* 현재 선택된 컬렉션 (녹색) */}
          {currentCollection && (
            <button
              className="relative p-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 transition-all hover:bg-green-500/30 min-w-[3rem] flex items-center justify-center"
              onClick={() => onSelectCollection(currentCollection.id)}
              title={currentCollection.name}
            >
              {/* 그룹 색상 표시 */}
              {currentCollection.groupId && groups?.[currentCollection.groupId] && (
                <div
                  className="absolute top-0 left-0 w-3 h-3 rounded-tl-xl rounded-br-lg"
                  style={{ backgroundColor: groups[currentCollection.groupId].color }}
                />
              )}
              <span className="text-sm font-semibold">
                {getCollectionInitials(currentCollection.name)}
              </span>
            </button>
          )}

          {/* 나머지 컬렉션들 (회색) */}
          {otherCollections.map((collection) => (
            <button
              key={collection.id}
              className="relative p-3 rounded-xl bg-zinc-700/30 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200 transition-all min-w-[3rem] flex items-center justify-center"
              onClick={() => onSelectCollection(collection.id)}
              title={collection.name}
            >
              {/* 그룹 색상 표시 */}
              {collection.groupId && groups?.[collection.groupId] && (
                <div
                  className="absolute top-0 left-0 w-3 h-3 rounded-tl-xl rounded-br-lg"
                  style={{ backgroundColor: groups[collection.groupId].color }}
                />
              )}
              <span className="text-xs font-medium">
                {getCollectionInitials(collection.name)}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center gap-3 py-4 border-t border-zinc-700/50">
          {/* 컬렉션 추가 버튼 */}
          <button
            className="p-3 rounded-xl bg-zinc-700/30 border-2 border-dashed border-zinc-600 text-zinc-400 hover:bg-zinc-700/50 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
            onClick={() => onAddCollection(null)}
            title="새 컬렉션 추가"
          >
            <Plus size={24} />
          </button>

          {/* 프로필 아이콘 */}
          <button
            className={`p-3 rounded-xl transition-all ${
              showProfileView
                ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
            }`}
            onClick={onProfileClick}
            title="프로필"
          >
            <User size={24} />
          </button>
        </div>
      </aside>
    )
  }

  // 모든 컬렉션 목록 (그룹별 정렬)
  const allCollectionsList = []
  Object.keys(collectionsByGroup).forEach((groupId) => {
    const groupCollections = collectionsByGroup[groupId]
    groupCollections.forEach(col => allCollectionsList.push(col))
  })
  ungroupedCollections.forEach(col => allCollectionsList.push(col))

  return (
    <>
      {/* 모바일: 상단 헤더 */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-800/95 backdrop-blur-xl border-b border-zinc-700/50 shadow-lg">
        {/* 첫 줄: 로고 | (공간) | 프로필 */}
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
            Collecting
          </h1>
          <button
            onClick={onProfileClick}
            className={`p-2 rounded-lg transition-colors ${
              showProfileView
                ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
            }`}
            title="프로필"
          >
            <User size={20} />
          </button>
        </div>
        
        {/* 두 번째 줄: 컬렉션 목록 (좌우 스크롤) */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* 컬렉션 추가 버튼 (맨 왼쪽, 점선) */}
            <button
              onClick={() => onAddCollection(null)}
              className="flex-shrink-0 p-3 rounded-xl bg-zinc-700/30 border-2 border-dashed border-zinc-600 text-zinc-400 hover:bg-zinc-700/50 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
              title="새 컬렉션 추가"
            >
              <Plus size={20} />
            </button>
            
            {/* 컬렉션 목록 */}
            {allCollectionsList.map((collection) => {
              const isSelected = selectedCollection === collection.id
              return (
                <button
                  key={collection.id}
                  onClick={() => onSelectCollection(collection.id)}
                  className={`relative flex-shrink-0 p-3 rounded-xl transition-all min-w-[3rem] flex items-center justify-center ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-zinc-700/30 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
                  }`}
                  title={collection.name}
                >
                  {/* 그룹 색상 표시 */}
                  {collection.groupId && groups?.[collection.groupId] && (
                    <div
                      className="absolute top-0 left-0 w-3 h-3 rounded-tl-xl rounded-br-lg"
                      style={{ backgroundColor: groups[collection.groupId].color }}
                    />
                  )}
                  <span className="text-sm font-semibold">
                    {getCollectionInitials(collection.name)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* 데스크톱: 기존 사이드바 */}
      <aside className="hidden md:flex w-80 flex-col bg-zinc-800/50 backdrop-blur-xl border-r border-zinc-700/50 shadow-xl">
        <div className="px-6 py-7 border-b border-zinc-700/50 bg-gradient-to-b from-zinc-700/30 to-transparent relative">
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Collecting
          </h1>
          <p className="text-sm text-zinc-400 font-medium mt-1">
            수집품을 정리하고 관리하세요
          </p>
          <button
            onClick={() => setIsCollapsed(true)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
            title="사이드바 접기"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto py-4">
        {/* 그룹별 컬렉션 표시 */}
        {Object.keys(collectionsByGroup).map((groupId) => {
          const group = groups?.[groupId]
          if (!group) return null
          const groupCollections = collectionsByGroup[groupId]
          const isGroupDragOver = dragOverId === `group-${groupId}`
          
          return (
            <div key={groupId} className="mb-4">
              {/* 그룹 헤더 (드롭 가능) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setDragOverId(`group-${groupId}`)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const draggedId = e.dataTransfer.getData('text/plain')
                  if (draggedId) {
                    console.log('그룹 헤더에 드롭:', draggedId, groupId)
                    handleDrop(draggedId, null, groupId)
                  }
                }}
                onDragLeave={(e) => {
                  // 자식 요소로 이동한 경우는 무시
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX
                  const y = e.clientY
                  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    return
                  }
                  if (dragOverId === `group-${groupId}`) {
                    setDragOverId(null)
                  }
                }}
                className={`px-6 py-2 flex items-center gap-2 transition-colors rounded-lg ${
                  isGroupDragOver ? 'bg-cyan-500/20 border-2 border-cyan-500' : ''
                }`}
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-sm font-semibold text-zinc-400">{group.name}</span>
                <div className="flex-1 h-px bg-zinc-700/50 ml-2" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCollapsedGroups(prev => {
                      const next = new Set(prev)
                      if (next.has(groupId)) {
                        next.delete(groupId)
                      } else {
                        next.add(groupId)
                      }
                      return next
                    })
                  }}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                >
                  {collapsedGroups.has(groupId) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {/* 그룹의 컬렉션들 */}
              {!collapsedGroups.has(groupId) && (
              <div className="pl-6">
                {groupCollections.map((collection) => (
                  <CollectionTree
                    key={collection.id}
                    collection={collection}
                    collections={collections}
                    selectedCollection={selectedCollection}
                    expandedCollections={expandedCollections}
                    onSelect={onSelectCollection}
                    onToggleExpand={onToggleExpand}
                    onOpenEdit={onOpenCollectionEdit}
                    onOpenDelete={onOpenCollectionDelete}
                    onOpenGroupSelect={onOpenCollectionGroupSelect}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isDragging={draggingId}
                    dragOverId={dragOverId}
                  />
                ))}
              </div>
              )}
            </div>
          )
        })}
        
        {/* 그룹 없는 컬렉션들 (드롭 가능 영역) */}
        {ungroupedCollections.length > 0 && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setDragOverId('ungrouped')
            }}
            onDrop={(e) => {
              e.preventDefault()
              const draggedId = e.dataTransfer.getData('text/plain')
              if (draggedId) {
                handleDrop(draggedId, null, null)
              }
            }}
            onDragLeave={() => {
              if (dragOverId === 'ungrouped') {
                setDragOverId(null)
              }
            }}
            className={dragOverId === 'ungrouped' ? 'bg-cyan-500/10 border-2 border-cyan-500 rounded-lg p-2' : ''}
          >
            {ungroupedCollections.map((collection) => (
          <CollectionTree
            key={collection.id}
            collection={collection}
            collections={collections}
            selectedCollection={selectedCollection}
            expandedCollections={expandedCollections}
            onSelect={onSelectCollection}
            onToggleExpand={onToggleExpand}
                onOpenEdit={onOpenCollectionEdit}
                onOpenDelete={onOpenCollectionDelete}
                onOpenGroupSelect={onOpenCollectionGroupSelect}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={draggingId}
                dragOverId={dragOverId}
          />
        ))}
          </div>
        )}
        
        {/* 그룹 없는 영역이 비어있을 때도 드롭 가능하도록 */}
        {ungroupedCollections.length === 0 && Object.keys(collectionsByGroup).length > 0 && (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              setDragOverId('ungrouped')
            }}
            onDrop={(e) => {
              e.preventDefault()
              const draggedId = e.dataTransfer.getData('text/plain')
              if (draggedId) {
                handleDrop(draggedId, null, null)
              }
            }}
            onDragLeave={() => {
              if (dragOverId === 'ungrouped') {
                setDragOverId(null)
              }
            }}
            className={`px-6 py-4 text-center text-sm text-zinc-500 transition-colors rounded-lg ${
              dragOverId === 'ungrouped' ? 'bg-cyan-500/10 border-2 border-cyan-500' : ''
            }`}
          >
            그룹 없는 컬렉션을 여기에 드롭하세요
          </div>
        )}
      </div>

      <button
        className="mx-3 mb-2 p-3 rounded-xl bg-zinc-700/30 border-2 border-dashed border-zinc-600 text-zinc-400 font-semibold flex items-center justify-center gap-2 hover:bg-zinc-700/50 hover:border-cyan-500/50 hover:text-cyan-400 transition-all"
        onClick={() => onAddCollection(null)}
      >
        <Plus size={18} /> 새 컬렉션 추가
      </button>

      <div className="mt-auto border-t border-zinc-700/50 p-3">
        <button
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            showProfileView
              ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
          }`}
          onClick={onProfileClick}
        >
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
            <User size={20} />
          </div>
          <span className="font-medium">프로필</span>
        </button>
      </div>
      </aside>
    </>
  )
}
