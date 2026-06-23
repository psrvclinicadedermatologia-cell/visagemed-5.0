'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useModal, type ModalName } from './modal-context'

type ModalProps = {
  name: ModalName
  title: string
  children: ReactNode
  maxWidth?: number
}

export function Modal({ name, title, children, maxWidth = 500 }: ModalProps) {
  const { activeModal, closeModal } = useModal()
  const isOpen = activeModal === name

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, closeModal])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={closeModal}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      style={{ animation: 'fadeIn 0.3s ease' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="vm-glass relative max-h-[80vh] w-[90%] overflow-y-auto rounded-2xl bg-[rgba(28,28,30,0.95)] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.5)]"
        style={{ maxWidth, animation: 'fadeInUp 0.3s ease' }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(58,58,60,0.6)] text-muted-foreground transition-colors hover:bg-[rgba(255,59,48,0.2)] hover:text-[var(--vm-danger)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
