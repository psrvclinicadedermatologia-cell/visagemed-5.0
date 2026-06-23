import Link from 'next/link'
import { ScanFace, Columns2, Search, Sparkles } from 'lucide-react'

const opcoes = [
  {
    href: '/avaliacao',
    icon: ScanFace,
    titulo: 'Avaliação Facial',
    desc: 'Análise de IA, medidas clínicas e proporções estéticas.',
    delay: '0.6s',
  },
  {
    href: '/comparacao',
    icon: Columns2,
    titulo: 'Antes e Depois',
    desc: 'Compare duas fotos lado a lado e gere uma imagem unificada.',
    delay: '0.75s',
  },
  {
    href: '/dermatoscopia',
    icon: Search,
    titulo: 'Dermatoscopia',
    desc: 'Avaliação de lesões cutâneas com critérios ABCDE e scores.',
    delay: '0.9s',
  },
  {
    href: '/capilar',
    icon: Sparkles,
    titulo: 'Tricoscopia',
    desc: 'Avaliação capilar com densidade folicular e indicadores.',
    delay: '1.05s',
  },
]

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
      <h1
        className="vm-text-gradient mb-3 text-5xl font-semibold tracking-tight max-md:text-4xl"
        style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}
      >
        VisageMed
      </h1>
      <p
        className="mb-12 text-lg text-muted-foreground"
        style={{ animation: 'fadeInUp 0.8s ease-out 0.4s both' }}
      >
        Inteligência visual para a prática clínica.
      </p>

      <div className="grid w-full max-w-3xl grid-cols-2 gap-6 px-5 max-md:max-w-sm max-md:grid-cols-1 max-md:gap-4">
        {opcoes.map((opcao) => {
          const Icon = opcao.icon
          return (
            <Link
              key={opcao.href}
              href={opcao.href}
              className="group vm-glass flex flex-col items-center rounded-[20px] px-7 py-10 text-foreground transition-all duration-300 hover:-translate-y-2 hover:border-[rgba(10,132,255,0.5)] hover:bg-[rgba(44,44,46,0.7)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_60px_rgba(10,132,255,0.15)]"
              style={{
                animation: `fadeInUp 1.2s cubic-bezier(0.2,0.8,0.2,1) ${opcao.delay} both`,
              }}
            >
              <Icon
                className="mb-5 h-14 w-14 text-[var(--vm-accent)] transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.5}
              />
              <div className="mb-2.5 text-[1.15em] font-semibold tracking-tight">
                {opcao.titulo}
              </div>
              <div className="text-sm leading-relaxed text-muted-foreground">
                {opcao.desc}
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
