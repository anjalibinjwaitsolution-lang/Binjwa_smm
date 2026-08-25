interface LibraryHeaderProps {
  totalPosts: number
}

export function LibraryHeader({ totalPosts }: LibraryHeaderProps) {
  return (
    <div>
      <h1 className="text-4xl font-heading font-bold gradient-text mb-2">Your Content Library</h1>
      <p className="text-foreground-muted">{totalPosts} posts created</p>
    </div>
  )
}
