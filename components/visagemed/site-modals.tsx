'use client'

import type { FormEvent } from 'react'
import {
  ScanFace,
  Columns2,
  Search,
  Sparkles,
  User,
  Mail,
  Phone,
} from 'lucide-react'
import { Modal } from './modal'
import { useModal } from './modal-context'

const ajudaItens = [
  {
    icon: ScanFace,
    titulo: 'Avaliação Facial',
    desc: 'Carregue uma foto frontal e a IA detectará automaticamente landmarks faciais. Ative medidas clínicas e proporções estéticas no painel lateral.',
  },
  {
    icon: Columns2,
    titulo: 'Antes e Depois',
    desc: 'Carregue duas fotos para comparação. Use o botão "Alinhar" para sincronizar as imagens pelos olhos. Ajuste margem, gap e bordas antes de exportar.',
  },
  {
    icon: Search,
    titulo: 'Dermatoscopia',
    desc: 'Avalie lesões cutâneas usando critérios ABCDE e estruturas dermatoscópicas. O sistema calcula automaticamente o 7-Point Checklist e ABCD Rule.',
  },
  {
    icon: Sparkles,
    titulo: 'Tricoscopia',
    desc: 'Documente avaliações capilares com foto clínica e tricoscópica. Registre densidade folicular, indicadores e classificação Norwood-Hamilton/Ludwig.',
  },
]

export function SiteModals() {
  const { closeModal } = useModal()

  function handleContato(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    closeModal()
  }

  return (
    <>
      {/* Ajuda */}
      <Modal name="ajuda" title="Central de Ajuda">
        <div className="flex flex-col gap-3">
          {ajudaItens.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.titulo}
                className="rounded-xl bg-[rgba(44,44,46,0.5)] p-4"
              >
                <div className="mb-1.5 flex items-center gap-2 text-[0.95em] font-semibold text-foreground">
                  <Icon className="h-[18px] w-[18px] text-[var(--vm-accent)]" />
                  {item.titulo}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            )
          })}
        </div>
      </Modal>

      {/* Perfil */}
      <Modal name="perfil" title="Minha Conta" maxWidth={400}>
        <div className="py-5 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[rgba(10,132,255,0.3)] bg-[rgba(10,132,255,0.15)]">
            <User className="h-9 w-9 text-[var(--vm-accent)]" strokeWidth={1.5} />
          </div>
          <p className="mb-5 text-sm leading-relaxed text-muted-foreground text-pretty">
            Sistema de contas em desenvolvimento. Em breve você poderá salvar
            avaliações e preferências.
          </p>
          <button
            type="button"
            className="rounded-[10px] border border-[rgba(10,132,255,0.3)] bg-[rgba(10,132,255,0.15)] px-6 py-3 text-sm font-semibold text-[var(--vm-accent)] transition-colors hover:bg-[rgba(10,132,255,0.25)]"
          >
            Notificar quando disponível
          </button>
        </div>
      </Modal>

      {/* Sobre */}
      <Modal name="sobre" title="Sobre o VisageMed" maxWidth={480}>
        <div className="text-sm leading-relaxed text-foreground">
          <p className="mb-4">
            <strong>VisageMed</strong> é uma plataforma de análise visual médica
            que utiliza inteligência artificial para auxiliar profissionais da
            saúde em avaliações clínicas.
          </p>
          <p className="mb-4">
            Desenvolvido para dermatologistas, cirurgiões plásticos,
            tricologistas e demais especialistas que necessitam de ferramentas
            precisas para documentação e análise de imagens médicas.
          </p>
          <p className="text-[0.85em] text-muted-foreground">
            Este software é uma ferramenta de auxílio e não substitui o
            julgamento clínico do profissional de saúde.
          </p>
        </div>
      </Modal>

      {/* Privacidade */}
      <Modal name="privacidade" title="Política de Privacidade" maxWidth={600}>
        <div className="max-h-[60vh] overflow-y-auto pr-2.5 text-sm leading-relaxed text-foreground">
          <h4 className="mb-2 font-semibold text-foreground">
            1. Processamento Local (Segurança by Design)
          </h4>
          <p className="mb-4 text-muted-foreground">
            Toda a análise de Inteligência Artificial, incluindo o mapeamento
            facial e cálculo de métricas, é executada{' '}
            <strong>diretamente no seu navegador (Client-side)</strong>. As
            fotos dos seus pacientes{' '}
            <strong>não são enviadas para os nossos servidores</strong>.
          </p>

          <h4 className="mb-2 font-semibold text-foreground">
            2. Armazenamento de Dados
          </h4>
          <p className="mb-4 text-muted-foreground">
            Atualmente, o VisageMed não armazena fotos, métricas ou dados
            clínicos em nuvem. Toda imagem carregada é temporária e descartada
            assim que a aba do navegador é fechada ou atualizada.
          </p>

          <h4 className="mb-2 font-semibold text-foreground">
            3. Dados Biométricos
          </h4>
          <p className="mb-4 text-muted-foreground">
            A detecção de pontos de referência faciais (landmarks) é utilizada
            estritamente para cálculos de proporções e medidas em tempo real,
            não havendo criação de banco de dados biométricos oculto.
          </p>

          <h4 className="mb-2 font-semibold text-foreground">
            4. Conformidade com a LGPD
          </h4>
          <p className="mb-4 text-muted-foreground">
            Nossa arquitetura foi desenhada para facilitar a conformidade do
            profissional de saúde com a Lei Geral de Proteção de Dados,
            garantindo que o controle das imagens médicas permaneça 100% com o
            especialista.
          </p>
        </div>
      </Modal>

      {/* Contato */}
      <Modal name="contato" title="Fale Conosco" maxWidth={450}>
        <div className="text-sm text-foreground">
          <p className="mb-5 text-muted-foreground">
            Tem alguma dúvida, sugestão ou precisa de suporte? Nossa equipe está
            pronta para ajudar.
          </p>

          <div className="mb-4 flex items-center gap-2.5">
            <Mail className="h-5 w-5 text-[var(--vm-accent)]" />
            <span>suporte@visagemed.com.br</span>
          </div>
          <div className="mb-6 flex items-center gap-2.5">
            <Phone className="h-5 w-5 text-[var(--vm-success)]" />
            <span>(11) 99999-9999</span>
          </div>

          <form onSubmit={handleContato}>
            <input
              type="text"
              required
              placeholder="Seu Nome"
              className="mb-3 w-full rounded-lg border border-[rgba(72,72,74,0.5)] bg-[rgba(44,44,46,0.5)] p-3 text-foreground outline-none focus:border-[var(--vm-accent)]"
            />
            <textarea
              required
              rows={4}
              placeholder="Sua Mensagem"
              className="mb-3 w-full resize-none rounded-lg border border-[rgba(72,72,74,0.5)] bg-[rgba(44,44,46,0.5)] p-3 text-foreground outline-none focus:border-[var(--vm-accent)]"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--vm-accent)] p-3 font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Enviar Mensagem
            </button>
          </form>
        </div>
      </Modal>
    </>
  )
}
