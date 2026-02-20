import { useState } from 'react'
import { Plus, X } from 'lucide-react'

// 기본 색상 옵션
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
]

export default function ColorPicker({ value, onChange, label = '색상 선택' }) {
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleColorSelect = (color) => {
    onChange(color)
    setShowColorPicker(false)
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-300 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        {/* 기본 색상 옵션 */}
        {DEFAULT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handleColorSelect(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              value === color
                ? 'border-zinc-100 scale-110 shadow-lg'
                : 'border-zinc-600 hover:border-zinc-400'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        
        {/* + 버튼 (상세 색상표) */}
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
            showColorPicker
              ? 'border-zinc-100 bg-zinc-700'
              : 'border-zinc-600 hover:border-zinc-400'
          }`}
          title="더 많은 색상 선택"
        >
          <Plus size={16} className="text-zinc-400" />
        </button>

        {/* 현재 선택된 색상 표시 */}
        {value && (
          <div className="ml-2 flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-zinc-600"
              style={{ backgroundColor: value }}
            />
            <span className="text-xs text-zinc-400 font-mono">{value}</span>
          </div>
        )}
      </div>

      {/* 상세 색상표 모달 */}
      {showColorPicker && (
        <div className="mt-4 p-4 rounded-xl bg-zinc-700/50 border border-zinc-600">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-zinc-300">색상 선택</span>
            <button
              type="button"
              onClick={() => setShowColorPicker(false)}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* 색상 그리드 */}
          <div className="grid grid-cols-8 gap-2">
            {generateColorPalette().map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorSelect(color)}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  value === color
                    ? 'border-zinc-100 scale-110 shadow-lg'
                    : 'border-zinc-600 hover:border-zinc-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* 직접 입력 */}
          <div className="mt-4 flex items-center gap-2">
            <input
              type="color"
              value={value || '#3b82f6'}
              onChange={(e) => handleColorSelect(e.target.value)}
              className="w-12 h-8 rounded border border-zinc-600 cursor-pointer"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => {
                const val = e.target.value
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                  handleColorSelect(val)
                }
              }}
              placeholder="#000000"
              className="flex-1 px-3 py-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 색상 팔레트 생성 (다양한 색상)
function generateColorPalette() {
  const colors = []
  
  // 기본 색상들
  const baseColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#808080', '#800000',
    '#008000', '#000080', '#808000', '#800080', '#008080',
  ]
  
  // 다양한 색상 생성
  const hues = [0, 15, 30, 45, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
  const saturations = [50, 70, 100]
  const lightnesses = [30, 50, 70]
  
  hues.forEach((h) => {
    saturations.forEach((s) => {
      lightnesses.forEach((l) => {
        colors.push(`hsl(${h}, ${s}%, ${l}%)`)
      })
    })
  })
  
  return [...baseColors, ...colors.slice(0, 50)] // 총 65개 색상
}

