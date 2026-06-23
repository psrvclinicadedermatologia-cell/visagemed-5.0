'use client'

import { useModal } from './modal-context'

export function SiteFooter() {
  const { openModal } = useModal()

  return (
    <footer
      className="flex items-center justify-between border-t border-white/5 bg-[rgba(28,28,30,0.3)] px-6 py-5 backdrop-blur-md max-md:flex-col max-md:gap-3 max-md:text-center"
      style={{ animation: 'fadeIn 0.8s ease-out 1.2s both' }}
    >
      <div className="text-[0.8em] text-[color:#636366]">
        2026 VisageMed. Todos os direitos reservados.
      </div>
      <nav className="flex gap-6">
        <button
          type="button"
          onClick={() => openModal('sobre')}
          className="text-[0.85em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Sobre
        </button>
        <button
          type="button"
          onClick={() => openModal('contato')}
          className="text-[0.85em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Contato
        </button>
        <button
          type="button"
          onClick={() => openModal('privacidade')}
          className="text-[0.85em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Privacidade
        </button>
      </nav>
    </footer>
  )
}
