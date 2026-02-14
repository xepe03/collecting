import { Plus, User } from 'lucide-react'
import CollectionTree from './CollectionTree'

export default function Sidebar({
  collections,
  selectedCollection,
  expandedCollections,
  showProfileView,
  onSelectCollection,
  onToggleExpand,
  onAddCollection,
  onAddSubCollection,
  onProfileClick,
}) {
  const rootCollections = Object.values(collections).filter((c) => !c.parentId)

  return (
    <aside className="w-80 flex flex-col bg-zinc-800/50 backdrop-blur-xl border-r border-zinc-700/50 shadow-xl">
      <div className="px-6 py-7 border-b border-zinc-700/50 bg-gradient-to-b from-zinc-700/30 to-transparent">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Collecting
        </h1>
        <p className="text-sm text-zinc-400 font-medium mt-1">
          수집품을 정리하고 관리하세요
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {rootCollections.map((collection) => (
          <CollectionTree
            key={collection.id}
            collection={collection}
            collections={collections}
            selectedCollection={selectedCollection}
            expandedCollections={expandedCollections}
            onSelect={onSelectCollection}
            onToggleExpand={onToggleExpand}
            onAddSubCollection={onAddSubCollection}
          />
        ))}
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
  )
}
