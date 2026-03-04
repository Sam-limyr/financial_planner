import { useState, useRef } from 'react'
import { usePlanStore } from '../../store/planStore'
import { EditorPanel } from './EditorPanel'
import { ResultsPanel } from './ResultsPanel'

export function AppLayout() {
  const { plan, setPlanName, exportPlan, importPlan, resetPlan } = usePlanStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => importPlan(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-2 mr-2">
          <span className="text-2xl">🔥</span>
          <span className="font-bold text-white tracking-tight">Retire If FIRE</span>
        </div>

        <input
          type="text"
          value={plan.name}
          onChange={e => setPlanName(e.target.value)}
          className="flex-1 max-w-xs bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-sm text-white outline-none focus:border-fire-500 transition-colors"
          placeholder="Plan name..."
        />

        <div className="flex items-center gap-1.5 ml-auto">
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-slate-300"
          >
            Import
          </button>
          <button
            onClick={exportPlan}
            className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-slate-300"
          >
            Export
          </button>
          <button
            onClick={() => { if (confirm('Reset to default plan?')) resetPlan() }}
            className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-slate-500"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <EditorPanel />
        <ResultsPanel />
      </div>
    </div>
  )
}
