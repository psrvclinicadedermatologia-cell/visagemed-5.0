import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'

type FeaturePlaceholderProps = {
  titulo: string
  descricao: string
}

export function FeaturePlaceholder({
  titulo,
  descricao,
}: FeaturePlaceholderProps) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <div
        className="vm-glass flex max-w-lg flex-col items-center rounded-[20px] px-8 py-12"
        style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(10,132,255,0.3)] bg-[rgba(10,132,255,0.15)]">
          <Construction
            className="h-8 w-8 text-[var(--vm-accent)]"
            strokeWidth={1.5}
          />
        </div>
        <h1 className="vm-text-gradient mb-3 text-3xl font-semibold tracking-tight">
          {titulo}
        </h1>
        <p className="mb-8 text-base leading-relaxed text-muted-foreground text-pretty">
          {descricao}
        </p>
        <div className="mb-8 rounded-lg border border-[rgba(10,132,255,0.2)] bg-[rgba(10,132,255,0.08)] px-4 py-2 text-sm font-medium text-[var(--vm-accent)]">
          Em migração para a nova plataforma
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
