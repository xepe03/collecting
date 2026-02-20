import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FolderOpen, Folder, ChevronRight, ChevronDown, MoreVertical } from 'lucide-react'

export default function CollectionTree({
  collection,
  collections,
  level = 0,
  selectedCollection,
  expandedCollections,
  onSelect,
  onToggleExpand,
  onOpenEdit,
  onOpenDelete,
  onOpenGroupSelect,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dragOverId,
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  const isExpanded = expandedCollections.includes(collection.id)
  const hasChildren = (collection.children || []).length > 0
  const isSelected = selectedCollection === collection.id

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleMenuClick = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
    })
    setShowMenu(true)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    onOpenEdit?.(collection.id)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    onOpenDelete?.(collection.id)
  }

  const handleGroup = (e) => {
    e.stopPropagation()
    setShowMenu(false)
    onOpenGroupSelect?.(collection.id)
  }

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', collection.id)
    onDragStart?.(collection.id)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver?.(collection.id)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId && draggedId !== collection.id) {
      onDrop?.(draggedId, collection.id)
    }
  }

  const isDragOver = dragOverId === collection.id && !isDragging

  return (
    <div>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={() => {
          onDragOver?.(null)
          onDragStart?.(null)
        }}
        className={`group flex items-center gap-2.5 py-2.5 px-3 mx-3 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium
          ${isSelected ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25' : 'text-zinc-200 hover:bg-zinc-700/50 hover:translate-x-0.5'}
          ${isDragging === collection.id ? 'opacity-50' : ''}
          ${isDragOver ? 'border-2 border-cyan-500 bg-cyan-500/10' : ''}`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(collection.id)}
      >
        {hasChildren && (
          <button
            className="p-0 flex items-center text-inherit opacity-70 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(collection.id)
            }}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        {isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
        <span className="flex-1">{collection.name}</span>
        <button
          ref={buttonRef}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all flex items-center"
          onClick={handleMenuClick}
        >
          <MoreVertical size={14} />
        </button>
      </div>
      
      {/* 수정/삭제 메뉴 */}
      {showMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed py-1 min-w-[120px] rounded-lg bg-zinc-800 border border-zinc-600 shadow-xl z-[1100]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <button
              type="button"
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left text-sm font-medium text-zinc-200 hover:bg-zinc-700/50"
            >
              수정
            </button>
            <button
              type="button"
              onClick={handleGroup}
              className="w-full px-4 py-2 text-left text-sm font-medium text-zinc-200 hover:bg-zinc-700/50"
            >
              그룹
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/10"
            >
              삭제
            </button>
          </div>,
          document.body
        )}

      {isExpanded && hasChildren && (
        <div>
          {(collection.children || []).map((childId) => (
            <CollectionTree
              key={childId}
              collection={collections[childId]}
              collections={collections}
              level={level + 1}
              selectedCollection={selectedCollection}
              expandedCollections={expandedCollections}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onOpenEdit={onOpenEdit}
              onOpenDelete={onOpenDelete}
              onOpenGroupSelect={onOpenGroupSelect}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isDragging={isDragging}
              dragOverId={dragOverId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
