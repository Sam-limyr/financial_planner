interface Item {
  id: string
  label: string
  sublabel?: string
  badge?: string
  badgeColor?: string
}

interface Props {
  items: Item[]
  editingId: string | null
  onEdit: (id: string | null) => void
  onDelete: (id: string) => void
  onAdd: () => void
  addLabel: string
  renderForm: (id: string) => React.ReactNode
  emptyText?: string
}

export function ItemList({ items, editingId, onEdit, onDelete, onAdd, addLabel, renderForm, emptyText }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && (
        <p className="text-slate-500 text-xs text-center py-3 bg-slate-700/30 rounded border border-dashed border-slate-600">
          {emptyText ?? 'None added yet'}
        </p>
      )}

      {items.map(item => (
        <div key={item.id} className="bg-slate-700/50 rounded border border-slate-600/50">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white truncate">{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.badgeColor ?? 'bg-slate-600 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              {item.sublabel && (
                <p className="text-xs text-slate-400 truncate">{item.sublabel}</p>
              )}
            </div>
            <button
              onClick={() => onEdit(editingId === item.id ? null : item.id)}
              className="text-xs text-slate-400 hover:text-fire-400 transition-colors px-1.5 py-1"
            >
              {editingId === item.id ? 'Close' : 'Edit'}
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="text-xs text-red-500 hover:text-red-400 transition-colors px-1.5 py-1"
            >
              ✕
            </button>
          </div>

          {editingId === item.id && (
            <div className="border-t border-slate-600/50 px-3 py-3 bg-slate-800/50">
              {renderForm(item.id)}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-1.5 text-sm text-fire-400 hover:text-fire-300 border border-dashed border-fire-700 hover:border-fire-500 rounded py-2 transition-colors"
      >
        <span>+</span> {addLabel}
      </button>
    </div>
  )
}
