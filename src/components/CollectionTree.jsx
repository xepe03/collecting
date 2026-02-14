import { FolderOpen, Folder, Plus, ChevronRight, ChevronDown, FolderPlus } from 'lucide-react'

export default function CollectionTree({
  collection,
  collections,
  level = 0,
  selectedCollection,
  expandedCollections,
  onSelect,
  onToggleExpand,
  onAddSubCollection,
}) {
  const isExpanded = expandedCollections.includes(collection.id)
  const hasChildren = (collection.children || []).length > 0
  const isSelected = selectedCollection === collection.id

  return (
    <div>
      <div
        className={`group flex items-center gap-2.5 py-2.5 px-3 mx-3 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium
          ${isSelected ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25' : 'text-zinc-200 hover:bg-zinc-700/50 hover:translate-x-0.5'}`}
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
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all flex items-center"
          onClick={(e) => {
            e.stopPropagation()
            onAddSubCollection(collection.id)
          }}
        >
          <FolderPlus size={14} />
        </button>
      </div>
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
              onAddSubCollection={onAddSubCollection}
            />
          ))}
        </div>
      )}
    </div>
  )
}
