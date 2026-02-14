import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Folder,
  Image,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Search,
  User,
  X,
  Layers,
  Settings,
  Check,
  Pencil,
  Upload,
  CreditCard,
  Package,
  Share2,
} from 'lucide-react'
import {
  GRADE_OPTIONS,
  GRADE_NUMBERS,
  LANGUAGE_OPTIONS,
  THUMBNAIL_ICONS,
} from '../data/fieldConfig'

export default function MainContent({
  showProfileView,
  selectedCollection,
  currentCollection,
  displayedItems,
  currentItems,
  searchQuery,
  showSearchInput,
  viewMode,
  sortBy,
  onAddItem,
  onAddMultiple,
  onOpenCollectionEdit,
  onOpenCollectionDelete,
  onShareCollection,
  onEditItem,
  onDeleteItem,
  onSaveInlineItem,
  onUploadImage,
  onSortChange,
  onViewModeChange,
  onSearchChange,
  onSearchToggle,
  onSearchClear,
}) {
  const [editMode, setEditMode] = useState(false)
  const [draftNewItem, setDraftNewItem] = useState(null)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingItemData, setEditingItemData] = useState(null)
  const [showCollectionMenu, setShowCollectionMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    if (showCollectionMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }
  }, [showCollectionMenu])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target)
      ) {
        setShowCollectionMenu(false)
      }
    }
    if (showCollectionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCollectionMenu])

  if (showProfileView) {
    return (
      <>
        <header className="px-10 py-7 bg-zinc-800/30 backdrop-blur border-b border-zinc-700/50">
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">
            프로필
          </h2>
          <p className="text-sm text-zinc-400 mt-1">계정 정보 및 설정</p>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl">
            <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700/50 p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
                  <User size={40} className="text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-100">익명 사용자</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Google 로그인을 연결하면 프로필이 표시됩니다
                  </p>
                </div>
              </div>
              <div className="space-y-4 text-sm text-zinc-400">
                <p>• 현재 익명 로그인으로 사용 중입니다</p>
                <p>• 나중에 Google 로그인을 연결하면 이메일과 프로필 사진이 표시됩니다</p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="px-10 py-7 bg-zinc-800/30 backdrop-blur border-b border-zinc-700/50 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">
            {currentCollection?.name || '컬렉션 선택'}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {searchQuery
              ? `${displayedItems.length}개 (검색 결과)`
              : `${currentItems.length}개 아이템`}
          </p>
        </div>
        {selectedCollection && (
          <div className="relative">
            <button
              ref={menuButtonRef}
              onClick={(e) => {
                e.stopPropagation()
                setShowCollectionMenu((prev) => !prev)
              }}
              className="p-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
              aria-label="컬렉션 설정"
            >
              <Settings size={24} />
            </button>
            {showCollectionMenu &&
              createPortal(
                <div
                  ref={menuRef}
                  className="fixed py-2 min-w-[140px] rounded-xl bg-zinc-800 border border-zinc-600 shadow-xl z-[1100]"
                  style={{ top: menuPosition.top, right: menuPosition.right }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onShareCollection?.()
                      setShowCollectionMenu(false)
                    }}
                    className="w-full px-5 py-3 text-left text-sm font-medium text-zinc-200 hover:bg-zinc-700/50 flex items-center gap-3"
                  >
                    <Share2 size={18} /> 공유하기
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onOpenCollectionEdit?.()
                      setShowCollectionMenu(false)
                    }}
                    className="w-full px-5 py-3 text-left text-sm font-medium text-zinc-200 hover:bg-zinc-700/50 flex items-center gap-3"
                  >
                    <Edit2 size={18} /> 수정
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onOpenCollectionDelete?.()
                      setShowCollectionMenu(false)
                    }}
                    className="w-full px-5 py-3 text-left text-sm font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                  >
                    <Trash2 size={18} /> 삭제
                  </button>
                </div>,
                document.body
              )}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {selectedCollection && (
          <div className="mb-6">
            <div className="border-b border-zinc-600/40 pb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {['latest', 'price', 'name'].map((key) => (
                  <button
                    key={key}
                    onClick={() => onSortChange(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortBy === key
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                    }`}
                  >
                    {key === 'latest' && '최신순'}
                    {key === 'price' && '가격순'}
                    {key === 'name' && '나열'}
                  </button>
                ))}
                <div className="relative ml-2 flex items-center gap-1">
                  {showSearchInput ? (
                    <>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="검색..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') onSearchClear()
                        }}
                        className="w-40 px-3 py-1.5 rounded-lg bg-zinc-700/50 border border-zinc-600 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={onSearchClear}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={onSearchToggle}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
                      title="검색"
                    >
                      <Search size={18} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onViewModeChange('card')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'card'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                  }`}
                  title="카드 모드"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => onViewModeChange('excel')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'excel'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                  }`}
                  title="엑셀 모드"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className={
            viewMode === 'excel'
              ? ''
              : 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6'
          }
        >
          {!selectedCollection ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
              <Folder size={64} className="opacity-30 mb-5" />
              <h3 className="text-2xl font-bold text-zinc-400 mb-2">
                컬렉션을 선택하거나 새로 만들어보세요
              </h3>
              <p className="text-sm">왼쪽에서 새 컬렉션 추가 버튼을 눌러 시작하세요</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500">
              <Image size={64} className="opacity-30 mb-5" />
              <h3 className="text-2xl font-bold text-zinc-400 mb-2">
                {searchQuery ? '검색 결과가 없습니다' : '아이템이 없습니다'}
              </h3>
              <p className="text-sm">
                {searchQuery
                  ? '다른 검색어로 시도해보세요'
                  : '첫 번째 수집품을 추가해보세요'}
              </p>
            </div>
          ) : viewMode === 'excel' ? (
            <ItemsTable
              items={displayedItems}
              itemFields={currentCollection?.itemFields}
              showEditButtons={editMode}
              draftNewItem={draftNewItem}
              editingItemId={editingItemId}
              editingItemData={editingItemData}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onSaveInline={onSaveInlineItem}
              onCancelInline={() => {
                setDraftNewItem(null)
                setEditingItemId(null)
                setEditingItemData(null)
              }}
              onStartEdit={(item) => {
                setEditingItemId(item?.id ?? null)
                setEditingItemData(item ? { ...item } : null)
              }}
              onUpdateEditItem={(data) => setEditingItemData((prev) => ({ ...prev, ...data }))}
              onDraftChange={setDraftNewItem}
              onUploadImage={onUploadImage}
            />
          ) : (
            <ItemsGrid
              items={displayedItems}
              itemFields={currentCollection?.itemFields}
              showEditButtons={editMode}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          )}
        </div>
      </div>

      {selectedCollection && (
        <div className="fixed bottom-6 right-6 z-50 flex items-end gap-2">
          <div className="relative flex flex-col items-end gap-2 group">
            <div className="absolute bottom-full right-0 mb-2 flex flex-col gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
              <button
                onClick={() =>
                  viewMode === 'excel'
                    ? setDraftNewItem({ id: 'draft-new', name: '', image: '', fields: {} })
                    : onAddItem()
                }
                className="px-4 py-2.5 rounded-xl bg-zinc-700/95 backdrop-blur border border-zinc-600 text-zinc-100 text-sm font-medium shadow-xl hover:bg-zinc-600 hover:border-cyan-500/50 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={16} /> 아이템 한개
              </button>
              <button
                onClick={() =>
                  viewMode === 'excel'
                    ? setDraftNewItem({ id: 'draft-new', name: '', image: '', fields: {} })
                    : (onAddMultiple || onAddItem)()
                }
                className="px-4 py-2.5 rounded-xl bg-zinc-700/95 backdrop-blur border border-zinc-600 text-zinc-100 text-sm font-medium shadow-xl hover:bg-zinc-600 hover:border-cyan-500/50 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Layers size={16} /> 아이템 여러개
              </button>
            </div>
            <button
              onClick={() =>
                viewMode === 'excel'
                  ? setDraftNewItem({ id: 'draft-new', name: '', image: '', fields: {} })
                  : onAddItem()
              }
              className="px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-200 flex items-center gap-2 group-hover:-translate-y-2 group-hover:shadow-cyan-500/50"
            >
              <Plus size={18} /> 추가
            </button>
          </div>
          <button
            onClick={() => setEditMode((prev) => !prev)}
            className={`px-5 py-3 rounded-xl font-semibold backdrop-blur border shadow-lg transition-all flex items-center gap-2 ${
              editMode
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                : 'bg-zinc-700/95 border-zinc-600 text-zinc-100 hover:bg-zinc-600 hover:border-cyan-500/50 hover:-translate-y-0.5'
            }`}
          >
            <Edit2 size={18} /> 수정
          </button>
        </div>
      )}
    </>
  )
}

const iconMap = {
  folder: Folder,
  'credit-card': CreditCard,
  image: Image,
  package: Package,
}

function ItemImageDisplay({ value }) {
  if (!value) return <div className="w-12 h-12 rounded bg-zinc-700/50" />
  if (value.startsWith('icon:')) {
    const iconId = value.replace('icon:', '')
    const Icon = iconMap[iconId] || Image
    return (
      <div className="w-12 h-12 rounded bg-zinc-700/50 flex items-center justify-center">
        <Icon size={24} className="text-zinc-400" />
      </div>
    )
  }
  return <img src={value} alt="" className="w-12 h-12 object-cover rounded" />
}

function ImageEditButton({ value, onChange, onUploadImage }) {
  const [showModal, setShowModal] = useState(false)
  const [mode, setMode] = useState('icon') // 'icon' | 'link' | 'upload'
  const [linkInput, setLinkInput] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (showModal) {
      setLinkInput(value?.startsWith('icon:') ? '' : value || '')
    }
  }, [showModal, value])

  const handleIconSelect = (iconId) => {
    onChange(`icon:${iconId}`)
    setShowModal(false)
  }

  const handleLinkApply = () => {
    onChange(linkInput.trim())
    setShowModal(false)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadImage) return
    setUploading(true)
    try {
      const url = await onUploadImage(file)
      onChange(url)
      setShowModal(false)
    } catch (err) {
      console.error(err)
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-12 h-12 rounded bg-zinc-700/50 flex items-center justify-center text-zinc-400 hover:bg-zinc-600 hover:text-cyan-400 transition-colors border border-dashed border-zinc-600 hover:border-cyan-500/50"
      >
        <Pencil size={20} />
      </button>
      {showModal && (
        <div
          className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1100]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-zinc-800 rounded-2xl w-[90%] max-w-[400px] p-6 shadow-2xl border border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-zinc-100 mb-4">이미지 설정</h3>
            <div className="flex gap-2 mb-4">
              {[
                { id: 'icon', label: '아이콘' },
                { id: 'link', label: '이미지 링크' },
                { id: 'upload', label: '이미지 첨부' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === m.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700/50 text-zinc-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {mode === 'icon' && (
              <div className="flex gap-2 flex-wrap">
                {THUMBNAIL_ICONS.map((ic) => {
                  const Icon = iconMap[ic.id] || Image
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => handleIconSelect(ic.id)}
                      className="p-3 rounded-xl border-2 border-zinc-600 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors"
                    >
                      <Icon size={28} className="text-zinc-300" />
                    </button>
                  )
                })}
              </div>
            )}
            {mode === 'link' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="이미지 URL 입력"
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleLinkApply}
                  className="w-full py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-medium hover:bg-cyan-500/30"
                >
                  적용
                </button>
              </div>
            )}
            {mode === 'upload' && (
              onUploadImage ? (
                <label className="block w-full py-8 rounded-xl border-2 border-dashed border-zinc-600 hover:border-cyan-500/50 cursor-pointer bg-zinc-700/30 hover:bg-zinc-700/50 transition-colors">
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <Upload size={32} />
                    <span>{uploading ? '업로드 중...' : '클릭하여 이미지 선택'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleFileSelect}
                  />
                </label>
              ) : (
                <p className="py-4 text-center text-zinc-500 text-sm">로그인 후 이미지 첨부가 가능합니다</p>
              )
            )}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-4 w-full py-2 rounded-xl bg-zinc-600/50 text-zinc-400 hover:bg-zinc-600"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function ItemsTable({
  items,
  itemFields,
  showEditButtons,
  draftNewItem,
  editingItemId,
  editingItemData,
  onEdit,
  onDelete,
  onSaveInline,
  onCancelInline,
  onStartEdit,
  onUpdateEditItem,
  onDraftChange,
  onUploadImage,
}) {
  const allKeys = new Set()
  const baseItems = items.map((i) =>
    i?.id === editingItemId && editingItemData ? editingItemData : i
  )
  const allItems = draftNewItem ? [...baseItems, draftNewItem] : baseItems
  allItems.forEach((i) =>
    Object.keys(i?.fields || {}).forEach((k) => allKeys.add(k))
  )
  ;(itemFields || []).forEach((f) => allKeys.add(f.key))
  const keys = [...allKeys]
  const labelMap = (itemFields || []).reduce((acc, f) => ({ ...acc, [f.key]: f.label }), {})
  const fieldTypeMap = (itemFields || []).reduce((acc, f) => ({ ...acc, [f.key]: f.type }), {})
  const gridCols = `minmax(3rem,auto) minmax(3rem,auto) 1fr ${keys.map(() => 'minmax(5rem,1fr)').join(' ')}`

  const isEditing = (item) =>
    (draftNewItem && item?.id === 'draft-new') || editingItemId === item?.id

  const updateItemData = (item, updates) => {
    if (draftNewItem && item?.id === 'draft-new') {
      onDraftChange({ ...draftNewItem, ...updates })
    } else if (editingItemId === item?.id && onUpdateEditItem) {
      onUpdateEditItem(updates)
    }
  }

  const handleSave = async (item) => {
    if (!onSaveInline) return
    const isNew = draftNewItem && item?.id === 'draft-new'
    const data = {
      name: item.name || '',
      image: item.image || '',
      fields: item.fields || {},
    }
    if (!isNew) data.id = item.id
    if (!data.name.trim()) {
      alert('이름을 입력해주세요.')
      return
    }
    await onSaveInline(data, isNew)
    onCancelInline()
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-700/50">
      <div className="min-w-[600px]">
        <div
          className="grid border-b border-zinc-700/50"
          style={{ gridTemplateColumns: gridCols }}
        >
          <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">
            번호
          </div>
          <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">
            이미지
          </div>
          <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">
            이름
          </div>
          {keys.map((k) => (
            <div key={k} className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">
              {labelMap[k] || k}
            </div>
          ))}
        </div>
        {allItems.map((item, index) => {
          const editing = isEditing(item)
          const isDraft = draftNewItem && item?.id === 'draft-new'
          return (
            <div key={item?.id ?? index}>
              <div
                onClick={() => {
                  if (showEditButtons && !editing && !isDraft) onStartEdit(item)
                }}
                className={`grid relative border-b border-zinc-700/30 transition-all ${
                  editing
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : showEditButtons
                      ? 'cursor-pointer hover:bg-zinc-700/30 hover:border-cyan-500/20'
                      : 'hover:bg-zinc-700/30'
                }`}
                style={{ gridTemplateColumns: gridCols }}
              >
                <div className="px-4 py-3 text-zinc-400 font-medium">
                  {index + 1}
                </div>
                <div className="px-4 py-3">
                  {editing ? (
                    <ImageEditButton
                      value={item.image || ''}
                      onChange={(val) => updateItemData(item, { image: val })}
                      onUploadImage={onUploadImage}
                    />
                  ) : (
                    <ItemImageDisplay value={item.image} />
                  )}
                </div>
                <div className="px-4 py-3">
                  {editing ? (
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(e) => updateItemData(item, { name: e.target.value })}
                      placeholder="이름"
                      className="w-full px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 font-medium placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <span className="font-medium text-zinc-100">{item.name || '-'}</span>
                  )}
                </div>
                {keys.map((k) => (
                  <div key={k} className="px-4 py-3">
                    {editing ? (
                      <InlineFieldInput
                        fieldKey={k}
                        fieldType={fieldTypeMap[k] || 'text'}
                        value={item.fields?.[k]}
                        onChange={(val) =>
                          updateItemData(item, {
                            fields: { ...(item.fields || {}), [k]: val },
                          })
                        }
                      />
                    ) : (
                      <FieldValue fieldKey={k} value={item.fields?.[k]} />
                    )}
                  </div>
                ))}
              </div>
              {editing && (
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 border-b border-zinc-700/30">
                  <button
                    onClick={() => handleSave(item)}
                    className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
                  >
                    <Check size={16} /> 완료
                  </button>
                  <button
                    onClick={onCancelInline}
                    className="px-4 py-2 rounded-lg bg-zinc-600/50 text-zinc-400 font-medium hover:bg-zinc-600 transition-colors"
                  >
                    취소
                  </button>
                  {!isDraft && onDelete && (
                    <button
                      onClick={() => {
                        if (confirm('이 아이템을 삭제하시겠습니까?')) {
                          onDelete(item.id)
                          onCancelInline()
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors ml-auto"
                    >
                      <Trash2 size={16} /> 삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InlineFieldInput({ fieldKey, fieldType, value, onChange }) {
  const val = value ?? ''
  if (fieldType === 'grade') {
    const [gradeOrg = '', gradeNum = ''] = String(val).split(/\s+/)
    return (
      <div className="flex gap-1">
        <select
          value={gradeOrg}
          onChange={(e) =>
            onChange(`${e.target.value} ${gradeNum}`.trim())
          }
          className="flex-1 min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">선택</option>
          {GRADE_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select
          value={gradeNum}
          onChange={(e) =>
            onChange(`${gradeOrg} ${e.target.value}`.trim())
          }
          className="flex-1 min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">선택</option>
          {GRADE_NUMBERS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    )
  }
  if (fieldType === 'price') {
    return (
      <input
        type="number"
        min={0}
        value={val}
        onChange={(e) => onChange(e.target.value)}
        placeholder="숫자"
        className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
      />
    )
  }
  if (fieldType === 'purchaseDate') {
    return (
      <input
        type="date"
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
      />
    )
  }
  if (fieldType === 'language') {
    return (
      <select
        value={val}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:border-cyan-500"
      >
        <option value="">선택</option>
        {LANGUAGE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }
  if (fieldType === 'memo') {
    return (
      <input
        type="text"
        value={val}
        onChange={(e) => onChange(e.target.value.slice(0, 50))}
        placeholder="50자까지"
        maxLength={50}
        className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
      />
    )
  }
  return (
    <input
      type="text"
      value={val}
      onChange={(e) => onChange(e.target.value)}
      placeholder="값 입력"
      className="w-full min-w-0 px-2 py-1.5 rounded border border-zinc-600 bg-zinc-700/50 text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
    />
  )
}

function FieldValue({ fieldKey, value }) {
  const str = String(value || '')
  const isPurchasePlace = fieldKey === 'purchasePlace' || fieldKey === '구매장소'
  const [copied, setCopied] = useState(false)
  const display = isPurchasePlace && str.length > 10 ? str.slice(0, 10) + '...' : str
  const handleCopy = () => {
    if (!str) return
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  if (isPurchasePlace && str) {
    return (
      <span
        onClick={handleCopy}
        className="cursor-pointer hover:text-cyan-400 transition-colors relative"
        title="클릭하여 복사"
      >
        {display}
        {copied && (
          <span className="absolute -top-6 left-0 px-2 py-1 rounded bg-cyan-500/90 text-white text-xs whitespace-nowrap">
            복사됨
          </span>
        )}
      </span>
    )
  }
  return <span>{display || '-'}</span>
}

function ItemsGrid({ items, itemFields, showEditButtons, onEdit, onDelete }) {
  const labelMap = (itemFields || []).reduce((acc, f) => ({ ...acc, [f.key]: f.label }), {})
  return items.map((item) => (
    <div
      key={item.id}
      className="bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700/50 shadow-lg hover:shadow-zinc-900/50 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
    >
      <img
        src={item.image || ''}
        alt={item.name}
        className="w-full h-60 object-cover bg-gradient-to-br from-zinc-700 to-zinc-800"
      />
      <div className="p-5">
        <div className="text-xl font-bold text-zinc-100 mb-3">{item.name}</div>
        <div className="flex flex-col gap-2">
          {Object.entries(item.fields || {}).map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-700/50 last:border-0"
            >
              <span className="text-zinc-400 font-semibold">{labelMap[key] || key}</span>
              <span className="text-zinc-200 font-medium">
                <FieldValue fieldKey={key} value={value} />
              </span>
            </div>
          ))}
        </div>
        {showEditButtons && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50">
            <button
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-700/50 text-zinc-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-600 transition-colors"
              onClick={() => onEdit(item)}
            >
              <Edit2 size={14} /> 수정
            </button>
            <button
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-700/50 text-zinc-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  ))
}
