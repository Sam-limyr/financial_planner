import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { usePlanStore } from '../../store/planStore'
import type { SavedProfile } from '../../store/planStore'
import type { Plan } from '../../types/plan'

interface SampleMeta {
  id: string
  name: string
  file: string
}

type ConfirmState =
  | { phase: 'idle' }
  | { phase: 'confirming'; targetPlan: Plan; targetName: string }

interface Props {
  onClose: () => void
}

export function SavesModal({ onClose }: Props) {
  const { plan, savedProfiles, lastSavedSnapshot, savePlan, loadProfile, deleteProfile } = usePlanStore()
  const isDirty = JSON.stringify(plan) !== lastSavedSnapshot

  const [saveName, setSaveName] = useState(plan.name)
  const [sampleMeta, setSampleMeta] = useState<SampleMeta[]>([])
  const [samplesLoading, setSamplesLoading] = useState(true)
  const [samplesError, setSamplesError] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState>({ phase: 'idle' })

  useEffect(() => {
    fetch('/samples/index.json')
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json() as Promise<SampleMeta[]> })
      .then(data => { setSampleMeta(data); setSamplesLoading(false) })
      .catch(() => { setSamplesError(true); setSamplesLoading(false) })
  }, [])

  function requestLoad(targetPlan: Plan, targetName: string) {
    if (isDirty) {
      setConfirmState({ phase: 'confirming', targetPlan, targetName })
    } else {
      loadProfile(targetPlan)
      onClose()
    }
  }

  async function requestLoadSample(meta: SampleMeta) {
    try {
      const r = await fetch(`/samples/${meta.file}`)
      if (!r.ok) throw new Error('fetch failed')
      const samplePlan = await r.json() as Plan
      requestLoad(samplePlan, meta.name)
    } catch {
      alert(`Failed to load sample "${meta.name}".`)
    }
  }

  function handleSaveAndLoad() {
    if (confirmState.phase !== 'confirming') return
    savePlan(plan.name)
    loadProfile(confirmState.targetPlan)
    onClose()
  }

  function handleDiscardAndLoad() {
    if (confirmState.phase !== 'confirming') return
    loadProfile(confirmState.targetPlan)
    onClose()
  }

  function handleSave() {
    const trimmed = saveName.trim()
    if (!trimmed) return
    savePlan(trimmed)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // ── Confirmation dialog ──────────────────────────────────────────────────
  if (confirmState.phase === 'confirming') {
    return (
      <Modal title="Unsaved Changes" onClose={() => setConfirmState({ phase: 'idle' })}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-300">
            You have unsaved changes to{' '}
            <span className="font-semibold text-white">"{plan.name}"</span>.
            What would you like to do before loading{' '}
            <span className="font-semibold text-white">"{confirmState.targetName}"</span>?
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSaveAndLoad}
              className="w-full text-sm py-2 px-4 bg-fire-500 hover:bg-fire-400 text-white rounded-lg font-medium transition-colors"
            >
              Save "{plan.name}" and Load
            </button>
            <button
              onClick={handleDiscardAndLoad}
              className="w-full text-sm py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            >
              Discard Changes and Load
            </button>
            <button
              onClick={() => setConfirmState({ phase: 'idle' })}
              className="w-full text-sm py-2 px-4 bg-transparent hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  // ── Main modal ───────────────────────────────────────────────────────────
  return (
    <Modal title="Saves" onClose={onClose} width="max-w-xl">
      <div className="flex flex-col gap-5">

        {isDirty && (
          <div className="flex items-center gap-2 px-3 py-2 bg-fire-700/30 border border-fire-700/60 rounded-lg">
            <span className="text-fire-400 text-sm">●</span>
            <p className="text-xs text-fire-300">
              You have unsaved changes. Loading a profile will replace your current plan.
            </p>
          </div>
        )}

        {/* Your Saves */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Your Saves
          </h3>
          {savedProfiles.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4 border border-dashed border-slate-700 rounded-lg">
              No saves yet. Save your current plan below.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {savedProfiles.map(profile => (
                <SaveRow
                  key={profile.id}
                  profile={profile}
                  formatDate={formatDate}
                  onLoad={() => requestLoad(profile.plan, profile.name)}
                  onDelete={() => deleteProfile(profile.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Sample Plans */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Sample Plans
          </h3>
          {samplesLoading && (
            <p className="text-xs text-slate-500 text-center py-3">Loading samples...</p>
          )}
          {samplesError && (
            <p className="text-xs text-red-400 text-center py-3">Failed to load sample plans.</p>
          )}
          {!samplesLoading && !samplesError && (
            <div className="flex flex-col gap-1.5">
              {sampleMeta.map(meta => (
                <div
                  key={meta.id}
                  className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg border border-slate-700/50"
                >
                  <span className="text-sm text-slate-200">{meta.name}</span>
                  <button
                    onClick={() => requestLoadSample(meta)}
                    className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-fire-500 text-slate-300 hover:text-white rounded transition-colors"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Save Current Plan */}
        <section className="border-t border-slate-700 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Save Current Plan
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              placeholder="Save name..."
              className="flex-1 bg-slate-800 border border-slate-700 focus:border-fire-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="text-sm px-4 py-2 bg-fire-500 hover:bg-fire-400 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          </div>
          {saveName.trim() && savedProfiles.some(p => p.name === saveName.trim()) && (
            <p className="text-xs text-slate-500 mt-1.5">
              A save named "{saveName.trim()}" already exists — it will be overwritten.
            </p>
          )}
        </section>

      </div>
    </Modal>
  )
}

// ── SaveRow ──────────────────────────────────────────────────────────────────

interface SaveRowProps {
  profile: SavedProfile
  formatDate: (iso: string) => string
  onLoad: () => void
  onDelete: () => void
}

function SaveRow({ profile, formatDate, onLoad, onDelete }: SaveRowProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 rounded-lg border border-slate-700/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{profile.name}</p>
        <p className="text-xs text-slate-500">{formatDate(profile.savedAt)}</p>
      </div>
      <button
        onClick={onLoad}
        className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-fire-500 text-slate-300 hover:text-white rounded transition-colors flex-shrink-0"
      >
        Load
      </button>
      <button
        onClick={onDelete}
        className="text-xs px-2 py-1 text-red-500 hover:text-red-400 transition-colors flex-shrink-0"
        aria-label={`Delete save "${profile.name}"`}
      >
        ✕
      </button>
    </div>
  )
}
