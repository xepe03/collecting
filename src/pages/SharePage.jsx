import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Image, ArrowLeft, LayoutGrid, List, Search, Filter, Calculator, Lock, X, Check } from 'lucide-react'
import { subscribeSharedCollection } from '../data/shareCollection'
import { GRADE_OPTIONS, GRADE_NUMBERS, LANGUAGE_OPTIONS } from '../data/fieldConfig'

function ItemImageDisplay({ value }) {
  if (!value) return <div className="w-12 h-12 rounded bg-zinc-700/50" />
  if (value.startsWith('icon:')) {
    return (
      <div className="w-12 h-12 rounded bg-zinc-700/50 flex items-center justify-center">
        <Image size={24} className="text-zinc-400" />
      </div>
    )
  }
  return <img src={value} alt="" className="w-12 h-12 object-cover rounded" />
}

function FieldValue({ fieldKey, value }) {
  const str = String(value || '')
  const isPurchasePlace = fieldKey === 'purchasePlace' || fieldKey === '구매장소'
  const display = isPurchasePlace && str.length > 10 ? str.slice(0, 10) + '...' : str
  return <span>{display || '-'}</span>
}

export default function SharePage() {
  const { token } = useParams()
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('excel')
  const [sortBy, setSortBy] = useState('latest')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showCalculatorModal, setShowCalculatorModal] = useState(false)
  const [showVisibilityModal, setShowVisibilityModal] = useState(false)
  const [filters, setFilters] = useState({})

  useEffect(() => {
    if (!token) {
      setError('공유 링크가 올바르지 않습니다')
      setLoading(false)
      return
    }

    // 실시간 동기화 구독
    const unsubscribe = subscribeSharedCollection(token, (result) => {
      setLoading(false)
      if (!result.collection) {
        setError('공유 컬렉션을 찾을 수 없거나 접근 권한이 없습니다')
        setData(null)
      } else {
        setError(null)
        setData(result)
      }
    })

    // cleanup
    return () => {
      unsubscribe()
    }
  }, [token])

  if (error && !data) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-8">
        <p className="text-red-400 mb-6">{error}</p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={18} /> 홈으로
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400">불러오는 중...</div>
      </div>
    )
  }

  const { collection, items } = data
  const itemFields = collection.itemFields || []
  const fieldVisibility = collection.fieldVisibility || {}
  
  // 공개 필드만 필터링 (visibility=0인 필드만, 이름과 이미지는 항상 표시)
  const visibleFields = itemFields.filter(field => {
    const visibility = fieldVisibility[field.key]
    return visibility === 0 || visibility === undefined // 0이거나 설정되지 않은 경우 공개
  })
  
  // 가격 파싱 함수
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

  // 검색 필터링
  const filterItemsBySearch = (itemList) => {
    if (!searchQuery.trim()) return itemList
    const q = searchQuery.trim().toLowerCase()
    return itemList.filter((item) => {
      if (item.name?.toLowerCase().includes(q)) return true
      // 공개 필드만 검색 대상
      return visibleFields.some(field => {
        const value = item.fields?.[field.key]
        return value !== undefined && String(value).toLowerCase().includes(q)
      })
    })
  }

  // 필터링 로직 (공개 필드만)
  const filterItems = (itemList) => {
    let filtered = [...itemList]

    // 등급 필터 (공개 필드인 경우만)
    if (filters.gradeType && visibleFields.some(f => f.key === 'grade')) {
      filtered = filtered.filter((item) => {
        const gradeValue = item.fields?.grade || item.fields?.['등급(PSA,BGS)'] || ''
        if (!gradeValue) return false
        const gradeStr = String(gradeValue).replace(/\s+/g, '').trim()
        const startsWithType = gradeStr.startsWith(filters.gradeType)
        if (!startsWithType) return false
        if (filters.gradeNumber) {
          const expectedGrade = `${filters.gradeType}${filters.gradeNumber}`
          return gradeStr === expectedGrade
        }
        return true
      })
    }

    // 가격 범위 필터 (공개 필드인 경우만)
    if ((filters.priceMin || filters.priceMax) && visibleFields.some(f => f.key === 'price')) {
      filtered = filtered.filter((item) => {
        const price = parsePrice(item)
        if (filters.priceMin && price < parseInt(filters.priceMin)) return false
        if (filters.priceMax && price > parseInt(filters.priceMax)) return false
        return true
      })
    }

    // 언어 필터 (공개 필드인 경우만)
    if (filters.language && filters.language.length > 0 && visibleFields.some(f => f.key === 'language')) {
      filtered = filtered.filter((item) => {
        const langValue = item.fields?.language || item.fields?.언어 || ''
        return filters.language.some((l) => String(langValue).includes(l))
      })
    }

    // 구매기간 필터 (공개 필드인 경우만)
    if ((filters.purchaseDateStart || filters.purchaseDateEnd) && visibleFields.some(f => f.key === 'purchaseDate')) {
      filtered = filtered.filter((item) => {
        const purchaseDate = item.fields?.purchaseDate || item.fields?.구매일 || ''
        if (!purchaseDate) return false
        const date = new Date(purchaseDate)
        if (filters.purchaseDateStart && date < new Date(filters.purchaseDateStart)) return false
        if (filters.purchaseDateEnd && date > new Date(filters.purchaseDateEnd)) return false
        return true
      })
    }

    // 시리즈 필터 (공개 필드인 경우만)
    if (filters.series && filters.series.length > 0 && visibleFields.some(f => f.key === 'series')) {
      filtered = filtered.filter((item) => {
        const seriesValue = item.fields?.series || item.fields?.['시리즈'] || ''
        return filters.series.some((s) => String(seriesValue).trim() === String(s).trim())
      })
    }

    return filtered
  }

  // 정렬
  const sortItems = (itemList) => {
    const sorted = [...itemList]
    if (sortBy === 'latest') {
      sorted.reverse()
    } else if (sortBy === 'price') {
      sorted.sort((a, b) => parsePrice(b) - parsePrice(a))
    }
    return sorted
  }

  const displayedItems = sortItems(filterItems(filterItemsBySearch(items)))
  
  const allKeys = new Set()
  displayedItems.forEach((i) => {
    Object.keys(i?.fields || {}).forEach((k) => {
      const field = itemFields.find(f => f.key === k)
      if (field) {
        const visibility = fieldVisibility[field.key]
        if (visibility === 0 || visibility === undefined) {
          allKeys.add(k)
        }
      }
    })
  })
  visibleFields.forEach((f) => allKeys.add(f.key))
  const keys = [...allKeys]
  const labelMap = itemFields.reduce((acc, f) => ({ ...acc, [f.key]: f.label }), {})
  const gridCols = `minmax(3rem,auto) minmax(3rem,auto) 1fr ${keys.map(() => 'minmax(5rem,1fr)').join(' ')}`

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <header className="px-6 py-5 border-b border-zinc-700/50">
        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
            aria-label="홈으로"
          >
            <ArrowLeft size={20} />
          </Link>
            <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{collection.name}</h1>
              <button
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors"
                title="공개 설정 정보"
                onClick={() => setShowVisibilityModal(true)}
              >
                <Lock size={18} />
              </button>
            </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('excel')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'excel' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:bg-zinc-700/50'
            }`}
            aria-label="테이블 보기"
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'card' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 hover:bg-zinc-700/50'
            }`}
            aria-label="카드 보기"
          >
            <LayoutGrid size={20} />
          </button>
          </div>
        </div>
        
        {/* 정렬, 검색, 필터, 계산기 */}
        <div className="flex items-center gap-2">
          {/* 정렬 버튼 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'latest'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              최신순
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'price'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              가격순
            </button>
          </div>
          
          {/* 구분선 */}
          <div className="h-6 w-px bg-zinc-600"></div>
          
          {/* 검색, 필터, 계산기 */}
          <div className="flex items-center gap-2">
            {showSearchInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색..."
                  autoFocus
                  className="w-48 px-4 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => {
                    setShowSearchInput(false)
                    setSearchQuery('')
                  }}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
                title="검색"
              >
                <Search size={18} />
              </button>
            )}
            <button
              onClick={() => setShowFilterModal(true)}
              className={`p-1.5 rounded-lg transition-colors ${
                filters && Object.keys(filters).some(key => {
                  const val = filters[key]
                  if (Array.isArray(val)) return val.length > 0
                  if (typeof val === 'object' && val !== null) {
                    return Object.values(val).some(v => v !== '' && v != null)
                  }
                  return val !== '' && val != null
                })
                  ? 'text-cyan-400 bg-cyan-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
              }`}
              title="필터"
            >
              <Filter size={18} />
            </button>
            <button
              onClick={() => setShowCalculatorModal(true)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
              title="계산기"
            >
              <Calculator size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {viewMode === 'excel' ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-700/50">
            <div className="inline-block min-w-full">
              <div
                className="grid border-b border-zinc-700/50"
                style={{ gridTemplateColumns: gridCols, minWidth: 'max-content' }}
              >
                <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">번호</div>
                <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">이미지</div>
                <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">이름</div>
                {keys.map((k) => {
                  const field = itemFields.find(f => f.key === k)
                  const visibility = field ? fieldVisibility[field.key] : undefined
                  return (
                    <div key={k} className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80 flex items-center gap-1">
                    {labelMap[k] || k}
                      {visibility === 1 && <Lock size={12} className="text-zinc-500" />}
                  </div>
                  )
                })}
              </div>
              {displayedItems.map((item, index) => (
                <div
                  key={item.id}
                  className="grid border-b border-zinc-700/30 hover:bg-zinc-700/20 transition-colors"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div className="px-4 py-3 text-zinc-400 font-medium">{index + 1}</div>
                  <div className="px-4 py-3">
                    <ItemImageDisplay value={item.image} />
                  </div>
                  <div className="px-4 py-3 font-medium text-zinc-100">{item.name || '-'}</div>
                  {keys.map((k) => {
                    const field = itemFields.find(f => f.key === k)
                    const visibility = field ? fieldVisibility[field.key] : undefined
                    if (visibility === 1) return null
                    return (
                    <div key={k} className="px-4 py-3 text-zinc-300">
                      <FieldValue fieldKey={k} value={item.fields?.[k]} />
                    </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedItems.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700/50"
              >
                <div className="aspect-[4/3] bg-zinc-700/50 flex items-center justify-center overflow-hidden">
                  {item.image && !item.image.startsWith('icon:') ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Image size={48} className="text-zinc-500" />
                  )}
                </div>
                <div className="p-5">
                  <div className="text-lg font-bold text-zinc-100 mb-3">{item.name}</div>
                  <div className="flex flex-col gap-2">
                    {visibleFields
                      .filter(field => item.fields?.[field.key] !== undefined && item.fields?.[field.key] !== null && item.fields?.[field.key] !== '')
                      .map((field) => (
                      <div
                          key={field.key}
                        className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-700/50 last:border-0"
                      >
                          <span className="text-zinc-400 font-semibold">{field.label || field.key}</span>
                        <span className="text-zinc-200">
                            <FieldValue fieldKey={field.key} value={item.fields[field.key]} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {displayedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Image size={64} className="opacity-30 mb-5" />
            <p className="text-lg">아이템이 없습니다</p>
          </div>
        )}
      </div>

      {/* 필터 모달 */}
      {showFilterModal && collection && (
        <ShareFilterModal
          collection={collection}
          items={displayedItems}
          visibleFields={visibleFields}
          filters={filters || {}}
          onClose={() => setShowFilterModal(false)}
          onApply={(newFilters) => {
            setFilters(newFilters)
            setShowFilterModal(false)
          }}
        />
      )}

      {/* 계산기 모달 */}
      {showCalculatorModal && collection && (
        <ShareCalculatorModal
          collection={collection}
          items={displayedItems}
          visibleFields={visibleFields}
          onClose={() => setShowCalculatorModal(false)}
        />
      )}

      {/* 공개 설정 모달 (읽기 전용) */}
      {showVisibilityModal && collection && (
        <ShareVisibilityModal
          collection={collection}
          fieldVisibility={fieldVisibility}
          visibleFields={visibleFields}
          onClose={() => setShowVisibilityModal(false)}
        />
      )}
    </div>
  )
}

// 공유 페이지용 필터 모달 (공개 필드만)
function ShareFilterModal({ collection, items, visibleFields, filters, onClose, onApply }) {
  const [localFilters, setLocalFilters] = useState(() => ({
    gradeType: filters?.gradeType || '',
    gradeNumber: filters?.gradeNumber || '',
    priceMin: filters?.priceMin || '',
    priceMax: filters?.priceMax || '',
    language: filters?.language || [],
    purchaseDateStart: filters?.purchaseDateStart || '',
    purchaseDateEnd: filters?.purchaseDateEnd || '',
    series: filters?.series || [],
  }))

  const hasGrade = visibleFields.some(f => f.key === 'grade')
  const hasPrice = visibleFields.some(f => f.key === 'price')
  const hasLanguage = visibleFields.some(f => f.key === 'language')
  const hasPurchaseDate = visibleFields.some(f => f.key === 'purchaseDate')
  const hasSeries = visibleFields.some(f => f.key === 'series')
  
  const availableSeries = Array.from(
    new Set(
      (items || [])
        .map(item => {
          const seriesValue = item.fields?.series || item.fields?.['시리즈'] || ''
          return String(seriesValue).trim()
        })
        .filter(s => s !== '')
    )
  ).sort()

  const selectGradeType = (type) => {
    setLocalFilters(prev => ({
      ...prev,
      gradeType: prev.gradeType === type ? '' : type
    }))
  }

  const selectGradeNumber = (number) => {
    setLocalFilters(prev => ({
      ...prev,
      gradeNumber: prev.gradeNumber === number ? '' : number
    }))
  }

  const toggleLanguage = (lang) => {
    setLocalFilters(prev => ({
      ...prev,
      language: prev.language.includes(lang)
        ? prev.language.filter(l => l !== lang)
        : [...prev.language, lang]
    }))
  }

  const toggleSeries = (series) => {
    setLocalFilters(prev => ({
      ...prev,
      series: prev.series.includes(series)
        ? prev.series.filter(s => s !== series)
        : [...prev.series, series]
    }))
  }

  const clearFilters = () => {
    setLocalFilters({
      gradeType: '',
      gradeNumber: '',
      priceMin: '',
      priceMax: '',
      language: [],
      purchaseDateStart: '',
      purchaseDateEnd: '',
      series: [],
    })
  }

  const hasActiveFilters = () => {
    return localFilters.gradeType !== '' ||
      (localFilters.gradeType !== '' && localFilters.gradeNumber !== '') ||
      localFilters.priceMin !== '' ||
      localFilters.priceMax !== '' ||
      localFilters.language.length > 0 ||
      localFilters.purchaseDateStart !== '' ||
      localFilters.purchaseDateEnd !== '' ||
      localFilters.series.length > 0
  }

  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[600px] max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">필터</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {hasGrade && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">등급</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">등급 타입</h4>
                  <div className="flex flex-wrap gap-2">
                    {GRADE_OPTIONS.map((type) => {
                      const isSelected = localFilters.gradeType === type
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => selectGradeType(type)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                              : 'bg-zinc-700/50 border-2 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                          }`}
                        >
                          {type}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {localFilters.gradeType && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-300 mb-2">등급 숫자</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => selectGradeNumber('')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          localFilters.gradeNumber === ''
                            ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                            : 'bg-zinc-700/50 border-2 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                        }`}
                      >
                        전체
                      </button>
                      {GRADE_NUMBERS.map((num) => {
                        const isSelected = localFilters.gradeNumber === num.toString()
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => selectGradeNumber(num.toString())}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                                : 'bg-zinc-700/50 border-2 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                            }`}
                          >
                            {num}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasPrice && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">가격 범위</h3>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={localFilters.priceMin}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                  placeholder="최소 가격"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-zinc-400">~</span>
                <input
                  type="number"
                  value={localFilters.priceMax}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                  placeholder="최대 가격"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {hasLanguage && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">언어</h3>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = localFilters.language.includes(lang)
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                          : 'bg-zinc-700/50 border border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                      }`}
                    >
                      {lang}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {hasPurchaseDate && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">구매기간</h3>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={localFilters.purchaseDateStart}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, purchaseDateStart: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-zinc-400">~</span>
                <input
                  type="date"
                  value={localFilters.purchaseDateEnd}
                  onChange={(e) => setLocalFilters(prev => ({ ...prev, purchaseDateEnd: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {hasSeries && availableSeries.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">시리즈</h3>
              <div className="flex flex-wrap gap-2">
                {availableSeries.map((series) => {
                  const isSelected = localFilters.series.includes(series)
                  return (
                    <button
                      key={series}
                      type="button"
                      onClick={() => toggleSeries(series)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                          : 'bg-zinc-700/50 border border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                      }`}
                    >
                      {series}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-zinc-600/50 flex justify-between items-center">
          <button
            onClick={clearFilters}
            className="px-6 py-3 rounded-xl bg-zinc-700/50 text-zinc-300 font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasActiveFilters()}
          >
            필터 초기화
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-zinc-700/50 text-zinc-300 font-medium hover:bg-zinc-600 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => onApply(localFilters)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 공유 페이지용 계산기 모달 (공개 필드만)
function ShareCalculatorModal({ collection, items, visibleFields, onClose }) {
  const itemFields = collection?.itemFields || []
  
  // 공개 필드 중 int 타입만 필터링
  const intFields = visibleFields.filter(f => {
    if (f.fieldType === 'input' && f.inputType === 'int') return true
    if (f.type === 'price' || f.type === 'number' || f.type === 'quantity' || f.type === 'marketPrice') return true
    return false
  })
  
  const [selectedFields, setSelectedFields] = useState([])
  
  const toggleField = (fieldKey) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(k => k !== fieldKey)
        : [...prev, fieldKey]
    )
  }
  
  const calculateTotals = () => {
    const totals = {}
    selectedFields.forEach(fieldKey => {
      let sum = 0
      items.forEach(item => {
        const value = item.fields?.[fieldKey]
        if (value !== undefined && value !== null && value !== '') {
          const num = parseInt(String(value).replace(/[^\d]/g, ''), 10)
          if (!isNaN(num)) {
            sum += num
          }
        }
      })
      totals[fieldKey] = sum
    })
    return totals
  }
  
  const totals = calculateTotals()
  const totalCount = items.length
  
  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[600px] max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">계산기</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          <div className="p-4 rounded-xl bg-zinc-700/30 border border-zinc-600">
            <div className="text-sm text-zinc-400 mb-1">계산 대상 아이템</div>
            <div className="text-2xl font-bold text-cyan-400">{totalCount.toLocaleString()}개</div>
          </div>

          {intFields.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">계산할 필드 선택 (공개 필드만)</h3>
              <div className="space-y-2">
                {intFields.map((field) => {
                  const isSelected = selectedFields.includes(field.key)
                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => toggleField(field.key)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{field.label || field.key}</span>
                        {isSelected && <Check size={18} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-700/30 border border-zinc-600 text-center">
              <div className="text-zinc-400">계산 가능한 공개 필드가 없습니다.</div>
            </div>
          )}

          {selectedFields.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-4">계산 결과</h3>
              <div className="space-y-3">
                {selectedFields.map((fieldKey) => {
                  const field = itemFields.find(f => f.key === fieldKey)
                  const total = totals[fieldKey] || 0
                  return (
                    <div
                      key={fieldKey}
                      className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-300 font-medium">{field?.label || fieldKey}</span>
                        <span className="text-2xl font-bold text-cyan-400">
                          {total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {selectedFields.length > 1 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-2 border-cyan-500/50">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-100 font-bold text-lg">전체 합계</span>
                      <span className="text-3xl font-bold text-cyan-300">
                        {Object.values(totals).reduce((sum, val) => sum + val, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-zinc-600/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

// 공개 설정 모달 (읽기 전용)
function ShareVisibilityModal({ collection, fieldVisibility, visibleFields, onClose }) {
  const itemFields = collection?.itemFields || []
  const allFields = itemFields.filter(f => f.key !== 'name' && f.key !== 'image')
  
  const publicFields = allFields.filter(f => {
    const visibility = fieldVisibility[f.key]
    return visibility === 0 || visibility === undefined
  })
  
  const privateFields = allFields.filter(f => {
    const visibility = fieldVisibility[f.key]
    return visibility === 1
  })

  return (
    <div
      className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-zinc-800 rounded-2xl w-[90%] max-w-[600px] max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-7 border-b border-zinc-600/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-zinc-100">공개 설정 정보</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {/* 공개 필드 */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              공개 필드
            </h3>
            {publicFields.length > 0 ? (
              <div className="space-y-2">
                {publicFields.map((field) => (
                  <div
                    key={field.key}
                    className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30"
                  >
                    <span className="text-zinc-200 font-medium">{field.label || field.key}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 rounded-xl bg-zinc-700/30 border border-zinc-600 text-zinc-400">
                공개 필드가 없습니다
              </div>
            )}
          </div>

          {/* 비공개 필드 */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
              <Lock size={16} className="text-zinc-400" />
              비공개 필드
            </h3>
            {privateFields.length > 0 ? (
              <div className="space-y-2">
                {privateFields.map((field) => (
                  <div
                    key={field.key}
                    className="px-4 py-3 rounded-xl bg-zinc-700/50 border border-zinc-600"
                  >
                    <span className="text-zinc-400 font-medium">{field.label || field.key}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 rounded-xl bg-zinc-700/30 border border-zinc-600 text-zinc-400">
                비공개 필드가 없습니다
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-zinc-700/30 border border-zinc-600">
            <p className="text-sm text-zinc-400">
              이 설정은 컬렉션 소유자만 변경할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-zinc-600/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
