import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

export function BrandKitHeader({ onUpload }: { onUpload?: () => void }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-4xl font-heading font-bold gradient-text mb-2">Brand Kit</h1>
        <p className="text-foreground-muted">Your brand DNA for consistent AI content</p>
      </div>
      <Button onClick={onUpload} className="btn-gradient rounded-full px-6">
        <Upload className="w-4 h-4 mr-2" />
        Upload Assets
      </Button>
    </div>
  )
}
