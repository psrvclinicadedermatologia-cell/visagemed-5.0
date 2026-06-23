'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type ModalName =
  | 'ajuda'
  | 'perfil'
  | 'sobre'
  | 'contato'
  | 'privacidade'

type ModalContextValue = {
  activeModal: ModalName | null
  openModal: (name: ModalName) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<ModalName | null>(null)

  return (
    <ModalContext.Provider
      value={{
        activeModal,
        openModal: setActiveModal,
        closeModal: () => setActiveModal(null),
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) {
    throw new Error('useModal deve ser usado dentro de <ModalProvider>')
  }
  return ctx
}
