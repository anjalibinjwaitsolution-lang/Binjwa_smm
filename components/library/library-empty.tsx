import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import Link from "next/link"

export function LibraryEmpty() {
  return (
    <div className="bg-background rounded-2xl shadow-sm p-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
          <FolderOpen className="w-12 h-12 text-foreground-muted" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">No posts yet</h2>
        <p className="text-foreground-muted mb-6">Create your first post to get started with binj.Ai</p>
        <Link href="/dashboard/create">
          <Button className="btn-gradient h-12 px-8 rounded-xl">Create Post</Button>
        </Link>
      </div>
    </div>
  )
}
