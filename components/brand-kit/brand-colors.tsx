"use client"

import { Plus, X } from "lucide-react"

interface BrandColorsProps {
  colors: string[]
  setColors: React.Dispatch<React.SetStateAction<string[]>>
}

export function BrandColors({ colors, setColors }: BrandColorsProps) {
  const handleDelete = (index: number) => {
    setColors(colors.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-background rounded-2xl shadow-sm p-6">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Brand Colors</h2>

      <div className="grid grid-cols-5 gap-4">
        {colors.map((color, index) => (
          <div key={index} className="space-y-2 relative group">
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  const newColors = [...colors]
                  newColors[index] = e.target.value
                  setColors(newColors)
                }}
                className="w-full aspect-square rounded-2xl cursor-pointer shadow-md"
                style={{ backgroundColor: color }}
              />
              <button
                onClick={() => handleDelete(index)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-error/95 hover:bg-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer z-10"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
            <div className="text-center">
              <div className="text-xs font-mono text-foreground-muted uppercase">{color}</div>
            </div>
          </div>
        ))}
        {colors.length < 8 && (
          <button
            onClick={() => setColors([...colors, "#000000"])}
            className="aspect-square border-2 border-dashed border-border rounded-2xl flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
          >
            <Plus className="w-8 h-8 text-foreground-muted" />
          </button>
        )}
      </div>
    </div>
  )
}
