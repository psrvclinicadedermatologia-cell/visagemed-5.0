'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'

type Sexo = 'masculino' | 'feminino'

type EscalaItem = {
  id: string
  rotulo: string
  descricao: string
  gravidade: number // 0-100 (usado para cor)
}

// Escala Norwood-Hamilton (calvície masculina)
const NORWOOD: EscalaItem[] = [
  { id: 'I', rotulo: 'Tipo I', descricao: 'Sem recessão significativa da linha frontal.', gravidade: 5 },
  { id: 'II', rotulo: 'Tipo II', descricao: 'Recessão temporal leve, padrão maduro.', gravidade: 18 },
  { id: 'III', rotulo: 'Tipo III', descricao: 'Recessão temporal profunda (primeiro estágio de calvície).', gravidade: 32 },
  { id: 'III-vertex', rotulo: 'Tipo III Vertex', descricao: 'Rarefação no vértice com recessão frontal leve.', gravidade: 42 },
  { id: 'IV', rotulo: 'Tipo IV', descricao: 'Recessão frontal e vértice ampliados, separados por faixa de cabelo.', gravidade: 55 },
  { id: 'V', rotulo: 'Tipo V', descricao: 'Faixa de separação entre áreas mais estreita e esparsa.', gravidade: 68 },
  { id: 'VI', rotulo: 'Tipo VI', descricao: 'Áreas frontal e do vértice unidas; faixa de separação ausente.', gravidade: 82 },
  { id: 'VII', rotulo: 'Tipo VII', descricao: 'Padrão mais avançado; apenas faixa em ferradura nas laterais/nuca.', gravidade: 95 },
]

// Escala Ludwig (calvície feminina)
const LUDWIG: EscalaItem[] = [
  { id: 'I', rotulo: 'Grau I', descricao: 'Afinamento perceptível no topo, com linha frontal preservada.', gravidade: 30 },
  { id: 'II', rotulo: 'Grau II', descricao: 'Rarefação pronunciada no topo; alargamento da risca central.', gravidade: 60 },
  { id: 'III', rotulo: 'Grau III', descricao: 'Rarefação difusa intensa no topo do couro cabeludo.', gravidade: 90 },
]

// Indicadores tricoscópicos quantitativos (valores de referência adulto couro cabeludo)
type Indicador = {
  id: string
  rotulo: string
  unidade: string
  min: number
  max: number
  passo: number
  padrao: number
  // faixas de normalidade [normalMin, normalMax]
  normalMin: number
  normalMax: number
  // direção: 'maiorMelhor' significa valores abaixo do normal = pior
  direcao: 'maiorMelhor' | 'menorMelhor'
  ajuda: string
}

const INDICADORES: Indicador[] = [
  {
    id: 'densidade',
    rotulo: 'Densidade capilar',
    unidade: 'fios/cm²',
    min: 50,
    max: 350,
    passo: 1,
    padrao: 200,
    normalMin: 200,
    normalMax: 320,
    direcao: 'maiorMelhor',
    ajuda: 'Número de fios por centímetro quadrado. Valores abaixo de 200 indicam rarefação.',
  },
  {
    id: 'diametro',
    rotulo: 'Diâmetro médio do fio',
    unidade: 'µm',
    min: 20,
    max: 110,
    passo: 1,
    padrao: 70,
    normalMin: 60,
    normalMax: 90,
    direcao: 'maiorMelhor',
    ajuda: 'Espessura média do fio. A miniaturização reduz o diâmetro abaixo de 60 µm.',
  },
  {
    id: 'relacaoTV',
    rotulo: 'Relação terminal/velus',
    unidade: ':1',
    min: 0,
    max: 12,
    passo: 0.1,
    padrao: 7,
    normalMin: 4,
    normalMax: 12,
    direcao: 'maiorMelhor',
    ajuda: 'Proporção de fios terminais para velus. Relação < 4:1 sugere miniaturização (AGA).',
  },
  {
    id: 'fpu',
    rotulo: 'Fios por unidade folicular',
    unidade: 'fios/UF',
    min: 1,
    max: 4,
    passo: 0.1,
    padrao: 2.3,
    normalMin: 2,
    normalMax: 4,
    direcao: 'maiorMelhor',
    ajuda: 'Média de fios por unidade folicular. Predomínio de unidades unitárias indica perda.',
  },
  {
    id: 'velus',
    rotulo: 'Percentual de fios velus',
    unidade: '%',
    min: 0,
    max: 60,
    passo: 1,
    padrao: 12,
    normalMin: 0,
    normalMax: 20,
    direcao: 'menorMelhor',
    ajuda: 'Proporção de fios finos e curtos. Acima de 20% reforça o diagnóstico de AGA.',
  },
]

// Sinais tricoscópicos qualitativos
const SINAIS = [
  { id: 'variabilidade', rotulo: 'Variabilidade de diâmetro > 20%', ajuda: 'Marcador-chave de alopecia androgenética.' },
  { id: 'sinalPeripilar', rotulo: 'Sinal peripilar (halo marrom)', ajuda: 'Discreta inflamação perifolicular.' },
  { id: 'pontosAmarelos', rotulo: 'Pontos amarelos', ajuda: 'Óstios foliculares dilatados sem fios.' },
  { id: 'pontosPretos', rotulo: 'Pontos pretos / cadavéricos', ajuda: 'Fios quebrados ao nível do couro cabeludo.' },
  { id: 'pontoExclamacao', rotulo: 'Fios em ponto de exclamação', ajuda: 'Típico de alopecia areata.' },
  { id: 'descamacao', rotulo: 'Descamação perifolicular', ajuda: 'Sugere processo cicatricial / inflamatório.' },
]

export function CapilarTool() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const imagemRef = useRef<HTMLImageElement | null>(null)
  const animFrame = useRef<number | null>(null)

  // estado de visualização (pan/zoom)
  const viewRef = useRef({ escala: 1, offsetX: 0, offsetY: 0 })
  const arrastando = useRef(false)
  const ultimoPonto = useRef({ x: 0, y: 0 })

  const [temImagem, setTemImagem] = useState(false)
  const [sexo, setSexo] = useState<Sexo>('masculino')
  const [escalaSelecionada, setEscalaSelecionada] = useState<string | null>(null)
  const [valores, setValores] = useState<Record<string, number>>(
    () => Object.fromEntries(INDICADORES.map((i) => [i.id, i.padrao])),
  )
  const [sinaisAtivos, setSinaisAtivos] = useState<Record<string, boolean>>({})

  const escalaAtual = sexo === 'masculino' ? NORWOOD : LUDWIG

  // ----- desenho do canvas -----
  const desenhar = useCallback(() => {
    const canvas = canvasRef.current
    const img = imagemRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const largura = canvas.clientWidth
    const altura = canvas.clientHeight
    if (canvas.width !== largura * dpr || canvas.height !== altura * dpr) {
      canvas.width = largura * dpr
      canvas.height = altura * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, largura, altura)

    if (!img) return
    const { escala, offsetX, offsetY } = viewRef.current
    const base = Math.min(largura / img.width, altura / img.height)
    const escalaFinal = base * escala
    const w = img.width * escalaFinal
    const h = img.height * escalaFinal
    const x = (largura - w) / 2 + offsetX
    const y = (altura - h) / 2 + offsetY
    ctx.drawImage(img, x, y, w, h)
  }, [])

  const agendarDesenho = useCallback(() => {
    if (animFrame.current != null) cancelAnimationFrame(animFrame.current)
    animFrame.current = requestAnimationFrame(desenhar)
  }, [desenhar])

  useEffect(() => {
    const onResize = () => agendarDesenho()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (animFrame.current != null) cancelAnimationFrame(animFrame.current)
    }
  }, [agendarDesenho])

  // ----- upload de imagem -----
  const carregarArquivo = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        imagemRef.current = img
        viewRef.current = { escala: 1, offsetX: 0, offsetY: 0 }
        setTemImagem(true)
        agendarDesenho()
        URL.revokeObjectURL(url)
      }
      img.src = url
    },
    [agendarDesenho],
  )

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) carregarArquivo(file)
    e.target.value = ''
  }

  // ----- pan / zoom -----
  const onMouseDown = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!temImagem) return
    arrastando.current = true
    ultimoPonto.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!arrastando.current) return
    const dx = e.clientX - ultimoPonto.current.x
    const dy = e.clientY - ultimoPonto.current.y
    viewRef.current.offsetX += dx
    viewRef.current.offsetY += dy
    ultimoPonto.current = { x: e.clientX, y: e.clientY }
    agendarDesenho()
  }
  const pararArrasto = () => {
    arrastando.current = false
  }
  const onWheel = (e: ReactMouseEvent<HTMLCanvasElement> & { deltaY?: number }) => {
    if (!temImagem) return
    const delta = (e as unknown as WheelEvent).deltaY
    const fator = delta > 0 ? 0.9 : 1.1
    viewRef.current.escala = Math.min(8, Math.max(0.3, viewRef.current.escala * fator))
    agendarDesenho()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handler = (ev: WheelEvent) => {
      ev.preventDefault()
      if (!temImagem) return
      const fator = ev.deltaY > 0 ? 0.9 : 1.1
      viewRef.current.escala = Math.min(8, Math.max(0.3, viewRef.current.escala * fator))
      agendarDesenho()
    }
    canvas.addEventListener('wheel', handler, { passive: false })
    return () => canvas.removeEventListener('wheel', handler)
  }, [temImagem, agendarDesenho])

  // ----- cálculo de resultado -----
  const analise = useMemo(() => {
    let pontosRisco = 0
    let totalIndicadores = 0
    const alteracoes: string[] = []

    for (const ind of INDICADORES) {
      const v = valores[ind.id]
      totalIndicadores += 1
      const abaixo = v < ind.normalMin
      const acima = v > ind.normalMax
      const foraNorma =
        ind.direcao === 'maiorMelhor' ? abaixo : acima
      if (foraNorma) {
        pontosRisco += 1
        alteracoes.push(ind.rotulo)
      }
    }

    const qtdSinais = Object.values(sinaisAtivos).filter(Boolean).length
    const score = pontosRisco * 2 + qtdSinais

    let nivel: 'baixo' | 'medio' | 'alto'
    let titulo: string
    if (score <= 2) {
      nivel = 'baixo'
      titulo = 'Padrão dentro da normalidade'
    } else if (score <= 5) {
      nivel = 'medio'
      titulo = 'Alterações tricoscópicas moderadas'
    } else {
      nivel = 'alto'
      titulo = 'Padrão sugestivo de alopecia'
    }

    return { score, nivel, titulo, alteracoes, qtdSinais }
  }, [valores, sinaisAtivos])

  const itemEscala = escalaAtual.find((e) => e.id === escalaSelecionada) ?? null

  // ----- exportação de laudo -----
  const exportar = useCallback(() => {
    const img = imagemRef.current
    const W = 1000
    const padding = 40
    const colImgW = 460
    const out = document.createElement('canvas')
    const ctx = out.getContext('2d')
    if (!ctx) return

    // medir altura necessária do texto
    const alturaBase = 720
    out.width = W
    out.height = alturaBase
    // fundo
    ctx.fillStyle = '#0b0b0d'
    ctx.fillRect(0, 0, W, out.height)
    ctx.fillStyle = '#0a84ff'
    ctx.fillRect(0, 0, W, 6)

    // título
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 26px system-ui, -apple-system, sans-serif'
    ctx.fillText('VisageMed — Laudo Tricoscópico', padding, 56)
    ctx.fillStyle = '#8e8e93'
    ctx.font = '400 13px system-ui, sans-serif'
    ctx.fillText(`Gerado em ${new Date().toLocaleString('pt-BR')}`, padding, 78)

    // imagem
    const imgY = 100
    const imgH = 360
    ctx.fillStyle = '#1c1c1e'
    ctx.fillRect(padding, imgY, colImgW, imgH)
    if (img) {
      const base = Math.min(colImgW / img.width, imgH / img.height)
      const w = img.width * base
      const h = img.height * base
      ctx.drawImage(img, padding + (colImgW - w) / 2, imgY + (imgH - h) / 2, w, h)
    } else {
      ctx.fillStyle = '#6e6e73'
      ctx.font = '400 14px system-ui, sans-serif'
      ctx.fillText('Sem imagem carregada', padding + 140, imgY + imgH / 2)
    }

    // coluna direita: dados
    let tx = padding + colImgW + 30
    let ty = imgY + 8
    ctx.fillStyle = '#0a84ff'
    ctx.font = '700 13px system-ui, sans-serif'
    ctx.fillText('INDICADORES', tx, ty)
    ty += 24
    ctx.font = '400 14px system-ui, sans-serif'
    for (const ind of INDICADORES) {
      const v = valores[ind.id]
      const foraNorma =
        ind.direcao === 'maiorMelhor' ? v < ind.normalMin : v > ind.normalMax
      ctx.fillStyle = foraNorma ? '#ff453a' : '#e5e5ea'
      ctx.fillText(`${ind.rotulo}: ${v} ${ind.unidade}`, tx, ty)
      ty += 22
    }

    ty += 12
    ctx.fillStyle = '#0a84ff'
    ctx.font = '700 13px system-ui, sans-serif'
    ctx.fillText('CLASSIFICAÇÃO', tx, ty)
    ty += 22
    ctx.fillStyle = '#e5e5ea'
    ctx.font = '400 14px system-ui, sans-serif'
    const escalaNome = sexo === 'masculino' ? 'Norwood-Hamilton' : 'Ludwig'
    ctx.fillText(`Escala: ${escalaNome}`, tx, ty)
    ty += 22
    ctx.fillText(`Estágio: ${itemEscala ? itemEscala.rotulo : 'não definido'}`, tx, ty)

    // veredito (rodapé)
    const corNivel =
      analise.nivel === 'alto' ? '#ff453a' : analise.nivel === 'medio' ? '#ff9f0a' : '#30d158'
    const vy = imgY + imgH + 40
    ctx.fillStyle = corNivel
    ctx.font = '700 20px system-ui, sans-serif'
    ctx.fillText(analise.titulo, padding, vy)
    ctx.fillStyle = '#8e8e93'
    ctx.font = '400 13px system-ui, sans-serif'
    ctx.fillText(
      `Score: ${analise.score} · ${analise.alteracoes.length} indicador(es) alterado(s) · ${analise.qtdSinais} sinal(is) presente(s)`,
      padding,
      vy + 24,
    )

    ctx.fillStyle = '#6e6e73'
    ctx.font = '400 11px system-ui, sans-serif'
    ctx.fillText(
      'Ferramenta de apoio. Não substitui avaliação médica presencial nem exame anatomopatológico.',
      padding,
      out.height - 24,
    )

    const link = document.createElement('a')
    link.download = `laudo-tricoscopia-${Date.now()}.png`
    link.href = out.toDataURL('image/png')
    link.click()
  }, [valores, sexo, itemEscala, analise])

  const trocarSexo = (s: Sexo) => {
    setSexo(s)
    setEscalaSelecionada(null)
  }

  return (
    <div className="vm-capilar">
      <input ref={fileRef} type="file" accept="image/*" onChange={onInputChange} />

      {/* barra de ferramentas */}
      <div className="menu-ferramentas">
        <div className="item-menu iniciar-ativo" onClick={() => fileRef.current?.click()}>
          Carregar imagem
        </div>
        <div
          className={`item-menu ${temImagem ? '' : 'desativado'}`}
          onClick={() => {
            viewRef.current = { escala: 1, offsetX: 0, offsetY: 0 }
            agendarDesenho()
          }}
        >
          Centralizar
        </div>
        <div className="grupo-direita">
          <div
            className={`item-menu ${temImagem || analise.score > 0 ? 'ativo-download' : 'desativado'}`}
            onClick={exportar}
          >
            Exportar laudo
          </div>
        </div>
      </div>

      <div className="area-trabalho">
        {/* painel da imagem */}
        <div className="painel-imagem">
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={pararArrasto}
            onMouseLeave={pararArrasto}
            onWheel={onWheel}
            style={{ display: temImagem ? 'block' : 'none' }}
          />
          {!temImagem && (
            <button
              type="button"
              className="estado-inicial"
              onClick={() => fileRef.current?.click()}
            >
              <div className="overlay-conteudo">
                <svg
                  className="icone-imagem"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <span className="overlay-titulo">Carregar tricoscopia</span>
                <span className="overlay-subtitulo">Clique ou arraste uma imagem do couro cabeludo</span>
              </div>
            </button>
          )}
        </div>

        {/* painel de análise */}
        <div className="painel-avaliacao">
          {/* seletor de sexo / escala */}
          <div className="seletor-metodo">
            <button
              type="button"
              className={`aba-metodo ${sexo === 'masculino' ? 'ativa' : ''}`}
              onClick={() => trocarSexo('masculino')}
            >
              MASCULINO · NORWOOD
            </button>
            <button
              type="button"
              className={`aba-metodo ${sexo === 'feminino' ? 'ativa' : ''}`}
              onClick={() => trocarSexo('feminino')}
            >
              FEMININO · LUDWIG
            </button>
          </div>

          <div className="conteudo-metodo">
            {/* indicadores quantitativos */}
            <div className="titulo-secao">Indicadores tricoscópicos</div>
            <div className="grupo-criterios">
              {INDICADORES.map((ind) => {
                const v = valores[ind.id]
                const foraNorma =
                  ind.direcao === 'maiorMelhor' ? v < ind.normalMin : v > ind.normalMax
                return (
                  <div className="campo-indicador" key={ind.id}>
                    <div className="indicador-cabecalho">
                      <span className="indicador-rotulo">{ind.rotulo}</span>
                      <span className={`indicador-valor ${foraNorma ? 'alterado' : ''}`}>
                        {v} {ind.unidade}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={ind.min}
                      max={ind.max}
                      step={ind.passo}
                      value={v}
                      onChange={(e) =>
                        setValores((prev) => ({ ...prev, [ind.id]: Number(e.target.value) }))
                      }
                    />
                    <span className="indicador-ajuda">{ind.ajuda}</span>
                  </div>
                )
              })}
            </div>

            {/* sinais qualitativos */}
            <div className="titulo-secao">Sinais tricoscópicos</div>
            <div className="grupo-checks">
              {SINAIS.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  title={s.ajuda}
                  className={`chip ${sinaisAtivos[s.id] ? 'ativo' : ''}`}
                  onClick={() =>
                    setSinaisAtivos((prev) => ({ ...prev, [s.id]: !prev[s.id] }))
                  }
                >
                  {s.rotulo}
                </button>
              ))}
            </div>

            {/* escala de classificação */}
            <div className="titulo-secao">
              Classificação {sexo === 'masculino' ? 'Norwood-Hamilton' : 'Ludwig'}
            </div>
            <div className="grupo-criterios">
              {escalaAtual.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`criterio ${escalaSelecionada === item.id ? 'ativo' : ''}`}
                  onClick={() => setEscalaSelecionada(item.id)}
                >
                  <span
                    className="indicador-barra"
                    style={{
                      background: `linear-gradient(90deg, #0a84ff ${item.gravidade}%, rgba(255,255,255,0.08) ${item.gravidade}%)`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="criterio-texto">
                    <span className="criterio-titulo">{item.rotulo}</span>
                    <span className="criterio-desc">{item.descricao}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* resultado */}
          <div className={`caixa-resultado nivel-${analise.nivel}`}>
            <div className="resultado-topo">
              <span className="resultado-rotulo">{analise.titulo}</span>
              <span className="resultado-score">Score {analise.score}</span>
            </div>
            <p className="resultado-detalhe">
              {analise.alteracoes.length > 0
                ? `Indicadores alterados: ${analise.alteracoes.join(', ')}.`
                : 'Todos os indicadores dentro da faixa de referência.'}
              {analise.qtdSinais > 0 ? ` ${analise.qtdSinais} sinal(is) tricoscópico(s) presente(s).` : ''}
              {itemEscala ? ` Classificação: ${itemEscala.rotulo}.` : ''}
            </p>
          </div>

          <p className="aviso-clinico">
            Ferramenta de apoio à documentação clínica. Não substitui avaliação médica presencial,
            tricograma ou exame anatomopatológico.
          </p>
        </div>
      </div>
    </div>
  )
}
