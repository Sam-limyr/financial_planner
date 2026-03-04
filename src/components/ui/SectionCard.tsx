interface Props {
  title: string
  children: React.ReactNode
  className?: string
}

export function SectionCard({ title, children, className = '' }: Props) {
  return (
    <div className={`bg-slate-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{title}</h3>
      {children}
    </div>
  )
}
