import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, X } from 'lucide-react'

interface ToastAction {
  label: string
  run: () => void
}
interface Toast {
  id: number
  text: string
  tone: 'ok' | 'info'
  action?: ToastAction
}

type Push = (text: string, tone?: Toast['tone'], action?: ToastAction) => void
const ToastCtx = createContext<Push>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))
  const push = useCallback<Push>((text, tone = 'ok', action) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-2), { id, text, tone, action }])
    setTimeout(() => dismiss(id), action ? 6500 : 4200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toaster" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.tone === 'ok' ? <CheckCircle2 size={18} /> : <Info size={18} />}
            <span>{t.text}</span>
            {t.action && (
              <button
                className="toast-action"
                onClick={() => {
                  t.action!.run()
                  dismiss(t.id)
                }}
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
