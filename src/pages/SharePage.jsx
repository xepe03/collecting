import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Image, ArrowLeft, LayoutGrid, List } from 'lucide-react'
import { getSharedCollection } from '../data/shareCollection'

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

  useEffect(() => {
    if (!token) {
      setError('공유 링크가 올바르지 않습니다')
      setLoading(false)
      return
    }
    getSharedCollection(token)
      .then((result) => {
        if (!result) setError('공유 링크가 만료되었거나 존재하지 않습니다')
        else setData(result)
      })
      .catch(() => setError('불러오기에 실패했습니다'))
      .finally(() => setLoading(false))
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
  const allKeys = new Set()
  items.forEach((i) => Object.keys(i?.fields || {}).forEach((k) => allKeys.add(k)))
  itemFields.forEach((f) => allKeys.add(f.key))
  const keys = [...allKeys]
  const labelMap = itemFields.reduce((acc, f) => ({ ...acc, [f.key]: f.label }), {})
  const gridCols = `minmax(3rem,auto) minmax(3rem,auto) 1fr ${keys.map(() => 'minmax(5rem,1fr)').join(' ')}`

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <header className="px-6 py-5 border-b border-zinc-700/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
            aria-label="홈으로"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">{collection.name}</h1>
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
      </header>

      <div className="p-6">
        {viewMode === 'excel' ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-700/50">
            <div className="min-w-[600px]">
              <div
                className="grid border-b border-zinc-700/50"
                style={{ gridTemplateColumns: gridCols }}
              >
                <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">번호</div>
                <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">이미지</div>
                <div className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">이름</div>
                {keys.map((k) => (
                  <div key={k} className="px-4 py-3 text-left font-semibold text-zinc-400 bg-zinc-800/80">
                    {labelMap[k] || k}
                  </div>
                ))}
              </div>
              {items.map((item, index) => (
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
                  {keys.map((k) => (
                    <div key={k} className="px-4 py-3 text-zinc-300">
                      <FieldValue fieldKey={k} value={item.fields?.[k]} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
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
                    {Object.entries(item.fields || {}).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center text-sm py-1.5 border-b border-zinc-700/50 last:border-0"
                      >
                        <span className="text-zinc-400 font-semibold">{labelMap[key] || key}</span>
                        <span className="text-zinc-200">
                          <FieldValue fieldKey={key} value={value} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Image size={64} className="opacity-30 mb-5" />
            <p className="text-lg">아이템이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
