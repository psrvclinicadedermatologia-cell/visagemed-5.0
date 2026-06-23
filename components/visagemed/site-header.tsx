'use client'

import Link from 'next/link'
import { HelpCircle, User } from 'lucide-react'
import { useModal } from './modal-context'

export function SiteHeader() {
  const { openModal } = useModal()

  return (
    <header
      className="vm-glass sticky top-0 z-[100] flex h-14 items-center justify-between px-6"
      style={{ animation: 'fadeIn 0.8s ease-out' }}
    >
      <Link
        href="/"
        className="vm-text-gradient text-[1.1em] font-semibold tracking-wide"
      >
        VisageMed
      </Link>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => openModal('ajuda')}
          className="flex items-center gap-1.5 rounded-lg border border-transparent px-3.5 py-2 text-[0.85em] font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
          <span className="max-md:hidden">Ajuda</span>
        </button>
        <button
          type="button"
          onClick={() => openModal('perfil')}
          aria-label="Minha conta"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(10,132,255,0.3)] bg-[rgba(10,132,255,0.15)] text-[var(--vm-accent)] transition-colors hover:border-[var(--vm-accent)] hover:bg-[rgba(10,132,255,0.25)]"
        >
          <User className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  )
}
