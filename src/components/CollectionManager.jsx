import { useState, useEffect } from 'react'
import { Plus, X, Save, Upload, Folder, CreditCard, Image, Package } from 'lucide-react'
import { useCollectionData } from '../data/useCollectionData'
import { uploadFile } from '../data/uploadFile'
import { createShare } from '../data/shareCollection'
import {
  DEFAULT_FIELD_OPTIONS,
  COLLECTION_TAGS,
  THUMBNAIL_ICONS,
  GRADE_OPTIONS,
  GRADE_NUMBERS,
  LANGUAGE_OPTIONS,
} from '../data/fieldConfig'
import Sidebar from './Sidebar'
import MainContent from './MainContent'

export default function CollectionManager() {
  const {
    userId,
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
  } = useCollectionData()

  const [selectedCollection, setSelectedCollection] = useState(null)
  const [expandedCollections, setExpandedCollections] = useState([])
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [showCollectionEditModal, setShowCollectionEditModal] = useState(false)
  const [showCollectionDeleteModal, setShowCollectionDeleteModal] = useState(false)
  const [shareToast, setShareToast] = useState(null)
  const [newCollectionParent, setNewCollectionParent] = useState(null)
  const [viewMode, setViewMode] = useState('card') // 'card' | 'excel'
  const [sortBy, setSortBy] = useState('latest') // 'latest' | 'price' | 'name'
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [showProfileView, setShowProfileView] = useState(false)

  // 첫 컬렉션 선택
  useEffect(() => {
    const roots = Object.values(collections).filter((c) => !c.parentId)
    if (!selectedCollection && roots.length > 0) {
      setSelectedCollection(roots[0].id)
      setExpandedCollections([roots[0].id])
    }
  }, [collections, selectedCollection])

  const toggleExpand = (id) => {
    setExpandedCollections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const getCurrentItems = () => {
    if (!selectedCollection) return []
    const col = collections[selectedCollection]
    if (!col) return []
    return (col.items || []).map((itemId) => items[itemId]).filter(Boolean)
  }

  // 검색어로 필터링
  const filterItemsBySearch = (itemList) => {
    if (!searchQuery.trim()) return itemList
    const q = searchQuery.trim().toLowerCase()
    return itemList.filter((item) => {
      if (item.name?.toLowerCase().includes(q)) return true
      return Object.values(item.fields || {}).some((v) =>
        String(v).toLowerCase().includes(q)
      )
    })
  }

  // 정렬 (가격은 필드에서 숫자 추출 시도)
  const parsePrice = (item) => {
    const priceFields = ['구매가격', '가격', '구매가', 'price']
    for (const key of priceFields) {
      const val = item.fields?.[key]
      if (val) {
        const num = parseInt(String(val).replace(/[^\d]/g, ''), 10)
        if (!isNaN(num)) return num
      }
    }
    return 0
  }

  const sortItems = (itemList) => {
    const sorted = [...itemList]
    if (sortBy === 'latest') {
      // Firestore id 기반 (시간순)
      sorted.reverse()
    } else if (sortBy === 'price') {
      sorted.sort((a, b) => parsePrice(b) - parsePrice(a))
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    return sorted
  }

  const displayedItems = sortItems(filterItemsBySearch(getCurrentItems()))

  const addNewItem = () => {
    setEditingItem({
      id: null,
      name: '',
      image: '',
      fields: {},
    })
    setShowItemModal(true)
  }

  const handleSaveItem = async (formData, imageFile) => {
    if (!selectedCollection || !userId) return
    let imageUrl = formData.image || ''

    try {
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, userId)
      }
    } catch (e) {
      console.error('이미지 업로드 실패:', e)
      alert('이미지 업로드에 실패했습니다.')
      return
    }

    const itemData = {
      name: formData.name,
      image: imageUrl,
      fields: formData.fields || {},
    }

    const isEdit = editingItem?.id && items[editingItem.id]
    if (isEdit) {
      await updateItem({ ...itemData, id: editingItem.id })
    } else {
      await addItem(itemData, selectedCollection)
    }
    setShowItemModal(false)
    setEditingItem(null)
  }

  const handleDeleteItem = (itemId) => {
    if (!selectedCollection) return
    if (confirm('이 아이템을 삭제하시겠습니까?')) {
      deleteItem(itemId, selectedCollection)
    }
  }

  const handleAddCollection = async (name, parentId) => {
    await addCollection(name, parentId || null)
    setShowCollectionModal(false)
    setNewCollectionParent(null)
  }

  const ItemModal = () => {
    const [formData, setFormData] = useState(
      editingItem
        ? { ...editingItem }
        : { id: null, name: '', image: '', fields: {} }
    )
    const [newFieldName, setNewFieldName] = useState('')
    const [imageFile, setImageFile] = useState(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
      setFormData(
        editingItem
          ? { ...editingItem }
          : { id: null, name: '', image: '', fields: {} }
      )
      setImageFile(null)
    }, [editingItem])

    const addField = () => {
      if (newFieldName.trim()) {
        setFormData((prev) => ({
          ...prev,
          fields: { ...prev.fields, [newFieldName]: '' },
        }))
        setNewFieldName('')
      }
    }

    const itemFields = currentCollection?.itemFields || []
    const hasStructuredFields = itemFields.length > 0

    const setFieldValue = (key, value) => {
      setFormData((prev) => ({
        ...prev,
        fields: { ...prev.fields, [key]: value },
      }))
    }

    const renderFieldInput = (field) => {
      const value = formData.fields?.[field.key] ?? ''
      if (field.type === 'grade') {
        const [gradeOrg = '', gradeNum = ''] = String(value).split(/\s+/)
        return (
          <div key={field.key} className="flex gap-2">
            <select
              value={gradeOrg}
              onChange={(e) =>
                setFieldValue(field.key, `${e.target.value} ${gradeNum}`.trim())
              }
              className="flex-1 px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">선택</option>
              {GRADE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <select
              value={gradeNum}
              onChange={(e) =>
                setFieldValue(field.key, `${gradeOrg} ${e.target.value}`.trim())
              }
              className="flex-1 px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="">선택</option>
              {GRADE_NUMBERS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )
      }
      if (field.type === 'price') {
        return (
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setFieldValue(field.key, e.target.value)}
            placeholder="숫자만"
            className="w-full px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        )
      }
      if (field.type === 'purchaseDate') {
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setFieldValue(field.key, e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none focus:border-cyan-500"
          />
        )
      }
      if (field.type === 'language') {
        return (
          <select
            value={value}
            onChange={(e) => setFieldValue(field.key, e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="">선택</option>
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      }
      if (field.type === 'memo') {
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setFieldValue(field.key, e.target.value.slice(0, 50))}
            placeholder="50자까지"
            maxLength={50}
            className="w-full px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        )
      }
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => setFieldValue(field.key, e.target.value)}
          placeholder="값 입력"
          className="w-full px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
        />
      )
    }

    return (
      <div
        className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
        onClick={() => setShowItemModal(false)}
      >
        <div
          className="bg-zinc-800 rounded-2xl w-[90%] max-w-[600px] max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center bg-gradient-to-b from-zinc-700/50 to-transparent">
            <h2 className="text-2xl font-bold text-zinc-100">
              {editingItem?.id && items[editingItem?.id]
                ? '아이템 수정'
                : '새 아이템 추가'}
            </h2>
            <button
              onClick={() => setShowItemModal(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto flex-1">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                아이템 이름
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="예: 뮤츠 EX"
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:bg-zinc-700 transition-colors"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-zinc-300 mb-2">
                이미지
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value })
                    setImageFile(null)
                  }}
                  placeholder="URL 입력 또는 파일 업로드"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:bg-zinc-700 transition-colors"
                />
                <label className="px-4 py-3 rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-700/30 text-zinc-400 hover:border-cyan-500 hover:text-cyan-400 cursor-pointer flex items-center gap-2 transition-colors">
                  <Upload size={18} /> 업로드
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setImageFile(f)
                        setFormData({ ...formData, image: '' })
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              {imageFile && (
                <p className="text-sm text-cyan-400 mb-2">
                  선택됨: {imageFile.name}
                </p>
              )}
            </div>

            {(formData.image || imageFile) && (
              <div className="mb-6 rounded-xl overflow-hidden border-2 border-zinc-600">
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : formData.image}
                  alt="미리보기"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            <div className="mt-8 pt-8 border-t-2 border-zinc-600/50">
              <h3 className="text-xl font-bold text-zinc-100 mb-4">정보 필드</h3>
              {hasStructuredFields ? (
                <div className="space-y-4">
                  {itemFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-zinc-400 mb-1.5">
                        {field.label}
                      </label>
                      {renderFieldInput(field)}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {Object.entries(formData.fields || {}).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[140px_1fr_40px] gap-3 mb-3">
                      <input
                        type="text"
                        value={key}
                        readOnly
                        className="px-4 py-2 rounded-lg bg-zinc-600/50 font-semibold text-zinc-300"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fields: { ...formData.fields, [key]: e.target.value },
                          })
                        }
                        placeholder="값 입력"
                        className="px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={() => {
                          const newFields = { ...formData.fields }
                          delete newFields[key]
                          setFormData({ ...formData, fields: newFields })
                        }}
                        className="flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-3 mt-4">
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder="새 필드 이름"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addField())}
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-700/30 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={addField}
                      className="px-5 py-3 rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-700/30 text-zinc-300 font-semibold flex items-center gap-2 hover:border-cyan-500 hover:text-cyan-400"
                    >
                      <Plus size={18} /> 필드 추가
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="px-8 py-5 border-t border-zinc-600/50 flex gap-3 justify-end bg-zinc-800/50">
            <button
              className="px-6 py-3 rounded-xl font-semibold bg-zinc-600/50 text-zinc-300 hover:bg-zinc-600 transition-colors"
              onClick={() => setShowItemModal(false)}
            >
              취소
            </button>
            <button
              className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-2"
              onClick={async () => {
                setSaving(true)
                await handleSaveItem(formData, imageFile)
                setSaving(false)
              }}
              disabled={!formData.name || saving}
            >
              <Save size={18} /> {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleUpdateCollection = async (formData) => {
    if (!selectedCollection) return
    await updateCollection(selectedCollection, formData)
    setShowCollectionEditModal(false)
  }

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return
    await deleteCollection(selectedCollection)
    setSelectedCollection(null)
    setShowCollectionDeleteModal(false)
  }

  const CollectionEditModal = () => {
    const col = collections[selectedCollection]
    const [name, setName] = useState(col?.name || '')
    const [thumbnailType, setThumbnailType] = useState(col?.thumbnailType || 'icon')
    const [thumbnail, setThumbnail] = useState(col?.thumbnail || '')
    const [iconId, setIconId] = useState(col?.iconId || 'folder')
    const [tag, setTag] = useState(col?.tag || '기타')
    const [memo, setMemo] = useState(col?.memo || '')
    const [selectedFields, setSelectedFields] = useState(() => {
      const existing = col?.itemFields || []
      const nonCustom = existing.filter((f) => f.type !== 'custom')
      if (nonCustom.length > 0) {
        return nonCustom.map((f) => {
          const opt = DEFAULT_FIELD_OPTIONS.find((o) => o.key === f.key)
          return opt ? { ...opt } : f
        })
      }
      return DEFAULT_FIELD_OPTIONS.filter((opt) => !opt.disabled)
    })
    const [customFields, setCustomFields] = useState(() => {
      const existing = col?.itemFields || []
      return existing.filter((f) => f.type === 'custom')
    })
    const [customFieldInput, setCustomFieldInput] = useState('')

    useEffect(() => {
      if (col) {
        setName(col.name || '')
        setThumbnailType(col.thumbnailType || 'icon')
        setThumbnail(col.thumbnail || '')
        setIconId(col.iconId || 'folder')
        setTag(col.tag || '기타')
        setMemo(col.memo || '')
        const existing = col.itemFields || []
        setSelectedFields(existing.filter((f) => f.type !== 'custom'))
        setCustomFields(existing.filter((f) => f.type === 'custom'))
      }
    }, [col?.id])

    const toggleField = (opt) => {
      if (opt.disabled) return
      setSelectedFields((prev) =>
        prev.some((f) => f.key === opt.key)
          ? prev.filter((f) => f.key !== opt.key)
          : [...prev, { ...opt }]
      )
    }

    const addCustomField = () => {
      const label = customFieldInput.trim()
      if (!label || customFields.some((f) => f.label === label)) return
      setCustomFields((prev) => [...prev, { type: 'custom', key: `custom_${Date.now()}`, label }])
      setCustomFieldInput('')
    }

    const removeCustomField = (key) => {
      setCustomFields((prev) => prev.filter((f) => f.key !== key))
    }

    const itemFields = [...selectedFields, ...customFields]

    const handleSubmit = () => {
      if (!name.trim()) return

      const oldKeys = new Set((col?.itemFields || []).map((f) => f.key))
      const newKeys = new Set(itemFields.map((f) => f.key))
      const removedKeys = [...oldKeys].filter((k) => !newKeys.has(k))

      const fieldsWithData = []
      if (removedKeys.length > 0) {
        const collectionItemIds = col?.items || []
        for (const key of removedKeys) {
          const hasData = collectionItemIds.some((itemId) => {
            const item = items[itemId]
            const val = item?.fields?.[key]
            return val !== undefined && val !== null && String(val).trim() !== ''
          })
          if (hasData) {
            const field = (col?.itemFields || []).find((f) => f.key === key)
            fieldsWithData.push(field?.label || key)
          }
        }
      }

      if (fieldsWithData.length > 0) {
        const msg = fieldsWithData.map((l) => `"${l}"`).join(', ')
        if (!confirm(`${msg} 필드의 정보들이 모두 지워집니다. 계속하시겠습니까?`)) {
          return
        }
      }

      handleUpdateCollection({
        name: name.trim(),
        thumbnail: thumbnailType === 'image' ? thumbnail : '',
        thumbnailType,
        iconId,
        tag,
        memo: memo.trim(),
        itemFields,
      })
    }

    return (
      <div
        className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
        onClick={() => setShowCollectionEditModal(false)}
      >
        <div
          className="bg-zinc-800 rounded-2xl w-[90%] max-w-[560px] max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-zinc-100">컬렉션 수정</h2>
            <button
              onClick={() => setShowCollectionEditModal(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto flex-1 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">컬렉션 이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 포켓몬 카드"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">썸네일</label>
              <div className="flex gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setThumbnailType('icon')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailType === 'icon' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700/50 text-zinc-400'
                  }`}
                >
                  아이콘
                </button>
                <button
                  type="button"
                  onClick={() => setThumbnailType('image')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailType === 'image' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700/50 text-zinc-400'
                  }`}
                >
                  이미지
                </button>
              </div>
              {thumbnailType === 'icon' ? (
                <div className="flex gap-2 flex-wrap">
                  {THUMBNAIL_ICONS.map((ic) => {
                    const Icon = iconMap[ic.id] || Folder
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setIconId(ic.id)}
                        className={`p-3 rounded-xl border-2 transition-colors ${
                          iconId === ic.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-600 bg-zinc-700/30 hover:border-zinc-500'
                        }`}
                      >
                        <Icon size={24} className="text-zinc-300" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="이미지 URL"
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">태그</label>
              <div className="flex gap-2">
                {COLLECTION_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tag === t ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700/50 text-zinc-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">메모</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모 (선택)"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="pt-4 border-t border-zinc-600/50">
              <h3 className="text-lg font-bold text-zinc-100 mb-1">아이템 정보</h3>
              <p className="text-sm text-zinc-500 mb-4">
                아이템들의 정보를 기입할 필드를 설정해주세요. 개별편집이나 속성추가는 컬렉션설정에서 변경할 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {DEFAULT_FIELD_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleField(opt)}
                    disabled={opt.disabled}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      opt.disabled ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      selectedFields.some((f) => f.key === opt.key)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600 hover:border-zinc-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFieldInput}
                  onChange={(e) => setCustomFieldInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomField())}
                  placeholder="필드 수동 추가"
                  className="flex-1 px-4 py-2 rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-700/30 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={addCustomField}
                  className="px-4 py-2 rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-700/30 text-zinc-300 font-medium hover:border-cyan-500 hover:text-cyan-400"
                >
                  추가
                </button>
              </div>
              {customFields.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customFields.map((f) => (
                    <span
                      key={f.key}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-700/50 text-zinc-300 text-sm"
                    >
                      {f.label}
                      <button type="button" onClick={() => removeCustomField(f.key)} className="hover:text-red-400">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-8 py-5 border-t border-zinc-600/50 flex gap-3 justify-end">
            <button
              className="px-6 py-3 rounded-xl font-semibold bg-zinc-600/50 text-zinc-300 hover:bg-zinc-600 transition-colors"
              onClick={() => setShowCollectionEditModal(false)}
            >
              취소
            </button>
            <button
              className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleSubmit}
              disabled={!name.trim()}
            >
              <Save size={18} /> 수정완료
            </button>
          </div>
        </div>
      </div>
    )
  }

  const CollectionDeleteModal = () => (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={() => setShowCollectionDeleteModal(false)}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[380px] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-zinc-600/50">
          <h2 className="text-lg font-bold text-zinc-100">컬렉션 삭제</h2>
        </div>
        <div className="p-6">
          <p className="text-zinc-300 text-sm">
            컬렉션의 모든 내용이 삭제됩니다!
          </p>
        </div>
        <div className="px-6 py-4 border-t border-zinc-600/50 flex gap-3 justify-end">
          <button
            className="px-4 py-2.5 rounded-xl font-semibold bg-zinc-600/50 text-zinc-300 hover:bg-zinc-600 transition-colors"
            onClick={() => setShowCollectionDeleteModal(false)}
          >
            취소
          </button>
          <button
            className="px-4 py-2.5 rounded-xl font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors"
            onClick={handleDeleteCollection}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )

  const iconMap = { folder: Folder, 'credit-card': CreditCard, image: Image, package: Package }

  const CollectionModal = () => {
    const [name, setName] = useState('')
    const [thumbnailType, setThumbnailType] = useState('icon')
    const [thumbnail, setThumbnail] = useState('')
    const [iconId, setIconId] = useState('folder')
    const [tag, setTag] = useState('기타')
    const [memo, setMemo] = useState('')
    const [selectedFields, setSelectedFields] = useState(() =>
      DEFAULT_FIELD_OPTIONS.filter((opt) => !opt.disabled)
    )
    const [customFields, setCustomFields] = useState([])
    const [customFieldInput, setCustomFieldInput] = useState('')

    const toggleField = (opt) => {
      if (opt.disabled) return
      setSelectedFields((prev) =>
        prev.some((f) => f.key === opt.key)
          ? prev.filter((f) => f.key !== opt.key)
          : [...prev, { ...opt }]
      )
    }

    const addCustomField = () => {
      const label = customFieldInput.trim()
      if (!label || customFields.some((f) => f.label === label)) return
      setCustomFields((prev) => [...prev, { type: 'custom', key: `custom_${Date.now()}`, label }])
      setCustomFieldInput('')
    }

    const removeCustomField = (key) => {
      setCustomFields((prev) => prev.filter((f) => f.key !== key))
    }

    const itemFields = [
      ...selectedFields,
      ...customFields,
    ]

    const handleSubmit = () => {
      if (!name.trim()) return
      handleAddCollection({
        name: name.trim(),
        parentId: newCollectionParent,
        thumbnail: thumbnailType === 'image' ? thumbnail : '',
        thumbnailType,
        iconId,
        tag,
        memo: memo.trim(),
        itemFields,
      })
    }

    return (
      <div
        className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
        onClick={() => setShowCollectionModal(false)}
      >
        <div
          className="bg-zinc-800 rounded-2xl w-[90%] max-w-[560px] max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-zinc-100">새 컬렉션 추가</h2>
            <button
              onClick={() => setShowCollectionModal(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto flex-1 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">컬렉션 이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 포켓몬 카드"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">썸네일</label>
              <div className="flex gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setThumbnailType('icon')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailType === 'icon' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700/50 text-zinc-400'
                  }`}
                >
                  아이콘
                </button>
                <button
                  type="button"
                  onClick={() => setThumbnailType('image')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    thumbnailType === 'image' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700/50 text-zinc-400'
                  }`}
                >
                  이미지
                </button>
              </div>
              {thumbnailType === 'icon' ? (
                <div className="flex gap-2 flex-wrap">
                  {THUMBNAIL_ICONS.map((ic) => {
                    const Icon = iconMap[ic.id] || Folder
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setIconId(ic.id)}
                        className={`p-3 rounded-xl border-2 transition-colors ${
                          iconId === ic.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-600 bg-zinc-700/30 hover:border-zinc-500'
                        }`}
                      >
                        <Icon size={24} className="text-zinc-300" />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="이미지 URL"
                  className="w-full px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">태그</label>
              <div className="flex gap-2">
                {COLLECTION_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tag === t ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700/50 text-zinc-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-300 mb-2">메모</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모 (선택)"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="pt-4 border-t border-zinc-600/50">
              <h3 className="text-lg font-bold text-zinc-100 mb-1">아이템 정보</h3>
              <p className="text-sm text-zinc-500 mb-4">
                아이템들의 정보를 기입할 필드를 설정해주세요. 개별편집이나 속성추가는 컬렉션설정에서 변경할 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {DEFAULT_FIELD_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleField(opt)}
                    disabled={opt.disabled}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      opt.disabled ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      selectedFields.some((f) => f.key === opt.key)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600 hover:border-zinc-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFieldInput}
                  onChange={(e) => setCustomFieldInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomField())}
                  placeholder="필드 수동 추가"
                  className="flex-1 px-4 py-2 rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-700/30 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={addCustomField}
                  className="px-4 py-2 rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-700/30 text-zinc-300 font-medium hover:border-cyan-500 hover:text-cyan-400"
                >
                  추가
                </button>
              </div>
              {customFields.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customFields.map((f) => (
                    <span
                      key={f.key}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-700/50 text-zinc-300 text-sm"
                    >
                      {f.label}
                      <button type="button" onClick={() => removeCustomField(f.key)} className="hover:text-red-400">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {newCollectionParent && collections[newCollectionParent] && (
              <p className="text-sm text-zinc-400 p-3 rounded-lg bg-zinc-700/30 border-l-4 border-cyan-500">
                "{collections[newCollectionParent]?.name}"의 하위 컬렉션으로 추가됩니다
              </p>
            )}
          </div>

          <div className="px-8 py-5 border-t border-zinc-600/50 flex gap-3 justify-end">
            <button
              className="px-6 py-3 rounded-xl font-semibold bg-zinc-600/50 text-zinc-300 hover:bg-zinc-600 transition-colors"
              onClick={() => setShowCollectionModal(false)}
            >
              취소
            </button>
            <button
              className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={handleSubmit}
              disabled={!name.trim()}
            >
              <Plus size={18} /> 추가
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentCollection = collections[selectedCollection]
  const currentItems = getCurrentItems()

  if (!loaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-900 text-zinc-400">
        로딩 중...
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 text-zinc-100">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm z-[1100]">
          {error}
        </div>
      )}

      <Sidebar
        collections={collections}
        selectedCollection={selectedCollection}
        expandedCollections={expandedCollections}
        showProfileView={showProfileView}
        onSelectCollection={(id) => {
          setSelectedCollection(id)
          setShowProfileView(false)
        }}
        onToggleExpand={toggleExpand}
        onAddCollection={() => {
          setNewCollectionParent(null)
          setShowCollectionModal(true)
        }}
        onAddSubCollection={(parentId) => {
          setNewCollectionParent(parentId)
          setShowCollectionModal(true)
        }}
        onProfileClick={() => setShowProfileView(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <MainContent
          showProfileView={showProfileView}
          selectedCollection={selectedCollection}
          currentCollection={currentCollection}
          displayedItems={displayedItems}
          currentItems={currentItems}
          searchQuery={searchQuery}
          showSearchInput={showSearchInput}
          viewMode={viewMode}
          sortBy={sortBy}
          onAddItem={addNewItem}
          onAddMultiple={addNewItem}
          onOpenCollectionEdit={() => setShowCollectionEditModal(true)}
          onOpenCollectionDelete={() => setShowCollectionDeleteModal(true)}
          onShareCollection={async () => {
            if (!selectedCollection || !currentCollection || !userId) return
            try {
              const { url } = await createShare(userId, currentCollection, displayedItems)
              await navigator.clipboard.writeText(url)
              setShareToast('링크가 복사되었습니다 (30일 후 자동 삭제)')
              setTimeout(() => setShareToast(null), 2500)
            } catch (e) {
              setShareToast(e?.message || '공유 링크 생성 실패')
              setTimeout(() => setShareToast(null), 3000)
            }
          }}
          onEditItem={(item) => {
            setEditingItem(item)
            setShowItemModal(true)
          }}
          onDeleteItem={handleDeleteItem}
          onSaveInlineItem={async (itemData, isNew) => {
            if (!selectedCollection) return
            if (isNew) {
              await addItem(itemData, selectedCollection)
            } else {
              await updateItem({ ...itemData, id: itemData.id })
            }
          }}
          onUploadImage={async (file) => {
            if (!userId) throw new Error('로그인이 필요합니다')
            return uploadFile(file, userId)
          }}
          onSortChange={setSortBy}
          onViewModeChange={setViewMode}
          onSearchChange={setSearchQuery}
          onSearchToggle={() => setShowSearchInput(true)}
          onSearchClear={() => {
            setSearchQuery('')
            setShowSearchInput(false)
          }}
        />
      </main>

      {showItemModal && <ItemModal />}
      {showCollectionModal && <CollectionModal />}
      {showCollectionEditModal && selectedCollection && <CollectionEditModal />}
      {showCollectionDeleteModal && selectedCollection && <CollectionDeleteModal />}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-600 shadow-xl text-zinc-100 font-medium">
          {shareToast}
        </div>
      )}
    </div>
  )
}
