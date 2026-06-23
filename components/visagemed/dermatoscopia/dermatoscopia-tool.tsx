'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ============================================================
   Tipos e definições dos critérios clínicos
   ============================================================ */

type Metodo = 'abcde' | 'sete-pontos' | 'abcd-tds'

type CriterioBin = {
  id: string
  titulo: string
  descricao: string
}

/* ---- ABCDE (rastreio clínico de melanoma) ---- */
const CRITERIOS_ABCDE: CriterioBin[] = [
  {
    id: 'assimetria',
    titulo: 'A — Assimetria',
    descricao: 'A lesão é assimétrica em um ou dois eixos.',
  },
  {
    id: 'bordas',
    titulo: 'B — Bordas',
    descricao: 'Bordas irregulares, recortadas ou mal definidas.',
  },
  {
    id: 'cor',
    titulo: 'C — Cor',
    descricao: 'Coloração heterogênea ou presença de múltiplas cores.',
  },
  {
    id: 'diametro',
    titulo: 'D — Diâmetro',
    descricao: 'Diâmetro superior a 6 mm.',
  },
  {
    id: 'evolucao',
    titulo: 'E — Evolução',
    descricao: 'Mudança recente em tamanho, forma, cor ou sintomas.',
  },
]

/* ---- 7-Point Checklist (Argenziano) ---- */
const CRITERIOS_MAIORES: CriterioBin[] = [
  {
    id: 'rede-atipica',
    titulo: 'Rede de pigmento atípica',
    descricao: 'Rede irregular com espessamento e distribuição não uniforme.',
  },
  {
    id: 'veu-azul',
    titulo: 'Véu azul-esbranquiçado',
    descricao: 'Área confluente azul-acinzentada sobreposta a véu branco.',
  },
  {
    id: 'vascular-atipico',
    titulo: 'Padrão vascular atípico',
    descricao: 'Vasos lineares irregulares, pontilhados ou polimórficos.',
  },
]
const CRITERIOS_MENORES: CriterioBin[] = [
  {
    id: 'estrias',
    titulo: 'Estrias irregulares',
    descricao: 'Projeções radiais irregulares na periferia da lesão.',
  },
  {
    id: 'pigmentacao',
    titulo: 'Pigmentação irregular',
    descricao: 'Áreas de pigmentação difusa e assimétrica.',
  },
  {
    id: 'pontos-globulos',
    titulo: 'Pontos/glóbulos irregulares',
    descricao: 'Pontos ou glóbulos de tamanho e distribuição variáveis.',
  },
  {
    id: 'regressao',
    titulo: 'Estruturas de regressão',
    descricao: 'Áreas brancas tipo cicatriz e/ou granularidade azul.',
  },
]

/* ---- ABCD Rule of Dermoscopy (Stolz / TDS) ---- */
const CORES_ABCD = [
  'Branco',
  'Vermelho',
  'Marrom-claro',
  'Marrom-escuro',
  'Azul-cinza',
  'Preto',
]
const ESTRUTURAS_ABCD = [
  'Rede de pigmento',
  'Área homogênea',
  'Estrias',
  'Pontos',
  'Glóbulos',
]

type Veredito = {
  rotulo: string
  nivel: 'baixo' | 'medio' | 'alto'
  detalhe: string
}

export function DermatoscopiaTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const imgRef = useRef<HTMLImageElement | null>(null)
  const viewRef = useRef({ zoom: 1, panX: 0, panY: 0 })

  const [temImagem, setTemImagem] = useState(false)
  const [metodo, setMetodo] = useState<Metodo>('abcde')

  /* estados de pontuação */
  const [abcde, setAbcde] = useState<Record<string, boolean>>({})
  const [maiores, setMaiores] = useState<Record<string, boolean>>({})
  const [menores, setMenores] = useState<Record<string, boolean>>({})
  const [assimetriaTds, setAssimetriaTds] = useState(0) // 0,1,2
  const [bordasTds, setBordasTds] = useState(0) // 0..8
  const [coresTds, setCoresTds] = useState<Record<string, boolean>>({})
  const [estruturasTds, setEstruturasTds] = useState<Record<string, boolean>>({})

  /* ============================================================
     Renderização do canvas (imperativa)
     ============================================================ */
  const renderizar = useCallback(() => {
    const cv = canvasRef.current
    const img = imgRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cv.width, cv.height)
    if (!img) return

    const { zoom, panX, panY } = viewRef.current
    const fit =
      Math.min(cv.width / img.width, cv.height / img.height) * 0.92
    ctx.save()
    ctx.translate(cv.width / 2 + panX, cv.height / 2 + panY)
    ctx.scale(fit * zoom, fit * zoom)
    ctx.translate(-img.width / 2, -img.height / 2)
    ctx.drawImage(img, 0, 0)
    ctx.restore()
  }, [])

  const ajustarCanvas = useCallback(() => {
    const cv = canvasRef.current
    const painel = painelRef.current
    if (!cv || !painel) return
    cv.width = painel.clientWidth
    cv.height = painel.clientHeight
    renderizar()
  }, [renderizar])

  /* eventos de pan / zoom / resize */
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return

    let arrastando = false
    let ultimoX = 0
    let ultimoY = 0

    const onWheel = (e: WheelEvent) => {
      if (!imgRef.current) return
      e.preventDefault()
      viewRef.current.zoom *= e.deltaY < 0 ? 1.1 : 0.9
      viewRef.current.zoom = Math.max(0.2, Math.min(8, viewRef.current.zoom))
      renderizar()
    }
    const getPos = (e: MouseEvent | TouchEvent) => {
      const te = e as TouchEvent
      if (te.touches && te.touches.length > 0) {
        return { x: te.touches[0].clientX, y: te.touches[0].clientY }
      }
      const me = e as MouseEvent
      return { x: me.clientX, y: me.clientY }
    }
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!imgRef.current) return
      arrastando = true
      const p = getPos(e)
      ultimoX = p.x
      ultimoY = p.y
    }
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!arrastando) return
      e.preventDefault()
      const p = getPos(e)
      viewRef.current.panX += p.x - ultimoX
      viewRef.current.panY += p.y - ultimoY
      ultimoX = p.x
      ultimoY = p.y
      renderizar()
    }
    const onUp = () => {
      arrastando = false
    }

    cv.addEventListener('wheel', onWheel, { passive: false })
    cv.addEventListener('mousedown', onDown)
    cv.addEventListener('mousemove', onMove)
    cv.addEventListener('mouseup', onUp)
    cv.addEventListener('mouseleave', onUp)
    cv.addEventListener('touchstart', onDown, { passive: false })
    cv.addEventListener('touchmove', onMove, { passive: false })
    cv.addEventListener('touchend', onUp)
    window.addEventListener('resize', ajustarCanvas)

    return () => {
      cv.removeEventListener('wheel', onWheel)
      cv.removeEventListener('mousedown', onDown)
      cv.removeEventListener('mousemove', onMove)
      cv.removeEventListener('mouseup', onUp)
      cv.removeEventListener('mouseleave', onUp)
      cv.removeEventListener('touchstart', onDown)
      cv.removeEventListener('touchmove', onMove)
      cv.removeEventListener('touchend', onUp)
      window.removeEventListener('resize', ajustarCanvas)
    }
  }, [renderizar, ajustarCanvas])

  /* ============================================================
     Upload de imagem
     ============================================================ */
  const processarArquivo = useCallback(
    (arquivo: File) => {
      const leitor = new FileReader()
      leitor.onload = (ev) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          imgRef.current = img
          viewRef.current = { zoom: 1, panX: 0, panY: 0 }
          setTemImagem(true)
          requestAnimationFrame(() => ajustarCanvas())
        }
        img.src = ev.target?.result as string
      }
      leitor.readAsDataURL(arquivo)
    },
    [ajustarCanvas],
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (arquivo) processarArquivo(arquivo)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const arquivo = e.dataTransfer.files?.[0]
    if (arquivo) processarArquivo(arquivo)
  }

  /* ============================================================
     Cálculo de pontuação e veredito
     ============================================================ */
  const numAbcde = useMemo(
    () => Object.values(abcde).filter(Boolean).length,
    [abcde],
  )
  const scoreSetePontos = useMemo(() => {
    const m = Object.values(maiores).filter(Boolean).length * 2
    const n = Object.values(menores).filter(Boolean).length
    return m + n
  }, [maiores, menores])

  const numCores = useMemo(
    () => Object.values(coresTds).filter(Boolean).length,
    [coresTds],
  )
  const numEstruturas = useMemo(
    () => Object.values(estruturasTds).filter(Boolean).length,
    [estruturasTds],
  )
  const tds = useMemo(() => {
    const c = numCores === 0 ? 1 : numCores
    const d = numEstruturas === 0 ? 1 : numEstruturas
    return assimetriaTds * 1.3 + bordasTds * 0.1 + c * 0.5 + d * 0.5
  }, [assimetriaTds, bordasTds, numCores, numEstruturas])

  const veredito: Veredito = useMemo(() => {
    if (metodo === 'abcde') {
      if (numAbcde >= 3)
        return {
          rotulo: 'Alto risco',
          nivel: 'alto',
          detalhe: `${numAbcde} de 5 critérios presentes. Encaminhamento dermatológico recomendado.`,
        }
      if (numAbcde >= 1)
        return {
          rotulo: 'Atenção',
          nivel: 'medio',
          detalhe: `${numAbcde} de 5 critérios presentes. Acompanhamento sugerido.`,
        }
      return {
        rotulo: 'Baixo risco',
        nivel: 'baixo',
        detalhe: 'Nenhum critério de alerta marcado.',
      }
    }
    if (metodo === 'sete-pontos') {
      if (scoreSetePontos >= 3)
        return {
          rotulo: 'Suspeita de melanoma',
          nivel: 'alto',
          detalhe: `Pontuação ${scoreSetePontos} (≥ 3). Excisão/biópsia recomendada.`,
        }
      return {
        rotulo: 'Baixa suspeição',
        nivel: scoreSetePontos === 0 ? 'baixo' : 'medio',
        detalhe: `Pontuação ${scoreSetePontos} (< 3).`,
      }
    }
    // abcd-tds
    if (tds > 5.45)
      return {
        rotulo: 'Lesão maligna provável',
        nivel: 'alto',
        detalhe: `TDS ${tds.toFixed(2)} (> 5.45).`,
      }
    if (tds >= 4.75)
      return {
        rotulo: 'Lesão suspeita',
        nivel: 'medio',
        detalhe: `TDS ${tds.toFixed(2)} (4.75 – 5.45). Avaliação adicional.`,
      }
    return {
      rotulo: 'Lesão benigna provável',
      nivel: 'baixo',
      detalhe: `TDS ${tds.toFixed(2)} (< 4.75).`,
    }
  }, [metodo, numAbcde, scoreSetePontos, tds])

  /* ============================================================
     Ações da barra
     ============================================================ */
  const aplicarZoom = (fator: number) => {
    if (!imgRef.current) return
    viewRef.current.zoom = Math.max(
      0.2,
      Math.min(8, viewRef.current.zoom * fator),
    )
    renderizar()
  }
  const reiniciarVista = () => {
    viewRef.current = { zoom: 1, panX: 0, panY: 0 }
    renderizar()
  }

  const labelMetodo: Record<Metodo, string> = {
    abcde: 'Regra ABCDE',
    'sete-pontos': '7-Point Checklist',
    'abcd-tds': 'ABCD Rule (TDS)',
  }

  const baixarLaudo = () => {
    const cv = canvasRef.current
    if (!cv) return
    const out = document.createElement('canvas')
    const W = 900
    const headerH = 90
    const imgH = 460
    const corpoH = 360
    out.width = W
    out.height = headerH + imgH + corpoH
    const ctx = out.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0a0a0b'
    ctx.fillRect(0, 0, out.width, out.height)

    // cabeçalho
    ctx.fillStyle = '#0A84FF'
    ctx.fillRect(0, 0, W, 4)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 26px sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText('VisageMed — Laudo de Dermatoscopia', 32, 40)
    ctx.fillStyle = '#8e8e93'
    ctx.font = '400 14px sans-serif'
    ctx.fillText(
      `Método: ${labelMetodo[metodo]}  •  ${new Date().toLocaleString('pt-BR')}`,
      32,
      68,
    )

    // imagem da lesão
    const img = imgRef.current
    if (img) {
      const areaY = headerH
      const fit = Math.min(W / img.width, imgH / img.height) * 0.95
      const w = img.width * fit
      const h = img.height * fit
      ctx.drawImage(img, (W - w) / 2, areaY + (imgH - h) / 2, w, h)
    }

    // corpo do laudo
    let y = headerH + imgH + 36
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 18px sans-serif'
    ctx.fillText('Resultado', 32, y)
    y += 34

    const corNivel =
      veredito.nivel === 'alto'
        ? '#ff453a'
        : veredito.nivel === 'medio'
          ? '#ff9f0a'
          : '#30d158'
    ctx.fillStyle = corNivel
    ctx.font = '700 22px sans-serif'
    ctx.fillText(veredito.rotulo, 32, y)
    y += 30
    ctx.fillStyle = '#c7c7cc'
    ctx.font = '400 15px sans-serif'
    ctx.fillText(veredito.detalhe, 32, y)
    y += 40

    // critérios marcados
    ctx.fillStyle = '#8e8e93'
    ctx.font = '600 14px sans-serif'
    ctx.fillText('CRITÉRIOS REGISTRADOS', 32, y)
    y += 26
    ctx.fillStyle = '#e5e5ea'
    ctx.font = '400 14px sans-serif'

    const linhas: string[] = []
    if (metodo === 'abcde') {
      CRITERIOS_ABCDE.forEach((c) => {
        if (abcde[c.id]) linhas.push(`• ${c.titulo}`)
      })
    } else if (metodo === 'sete-pontos') {
      CRITERIOS_MAIORES.forEach((c) => {
        if (maiores[c.id]) linhas.push(`• ${c.titulo} (2 pts)`)
      })
      CRITERIOS_MENORES.forEach((c) => {
        if (menores[c.id]) linhas.push(`• ${c.titulo} (1 pt)`)
      })
    } else {
      linhas.push(`• Assimetria: ${assimetriaTds} eixo(s)`)
      linhas.push(`• Bordas: ${bordasTds}/8 segmentos`)
      linhas.push(
        `• Cores (${numCores}): ${CORES_ABCD.filter((c) => coresTds[c]).join(', ') || '—'}`,
      )
      linhas.push(
        `• Estruturas (${numEstruturas}): ${ESTRUTURAS_ABCD.filter((e) => estruturasTds[e]).join(', ') || '—'}`,
      )
    }
    if (linhas.length === 0) linhas.push('• Nenhum critério marcado.')
    linhas.forEach((l) => {
      ctx.fillText(l, 32, y)
      y += 22
    })

    ctx.fillStyle = '#6e6e73'
    ctx.font = '400 12px sans-serif'
    ctx.fillText(
      'Ferramenta de apoio à decisão — não substitui avaliação médica presencial.',
      32,
      out.height - 24,
    )

    const link = document.createElement('a')
    link.download = 'visagemed-laudo-dermatoscopia.png'
    link.href = out.toDataURL('image/png')
    link.click()
  }

  /* ============================================================
     Render
     ============================================================ */
  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    id: string,
  ) => setter((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="vm-dermatoscopia">
      {/* Barra de ferramentas */}
      <div className="menu-ferramentas">
        <label htmlFor="uploadLesao" className="item-menu iniciar-ativo">
          Carregar imagem
        </label>
        <input
          ref={inputRef}
          type="file"
          id="uploadLesao"
          accept="image/*"
          onChange={onInputChange}
        />

        <div
          className={`item-menu ${temImagem ? '' : 'desativado'}`}
          onClick={() => aplicarZoom(1.2)}
        >
          Ampliar
        </div>
        <div
          className={`item-menu ${temImagem ? '' : 'desativado'}`}
          onClick={() => aplicarZoom(0.8)}
        >
          Reduzir
        </div>
        <div
          className={`item-menu ${temImagem ? '' : 'desativado'}`}
          onClick={reiniciarVista}
        >
          Reiniciar vista
        </div>

        <div className="grupo-direita">
          <div
            className={`item-menu ${temImagem ? 'ativo-download' : 'desativado'}`}
            onClick={temImagem ? baixarLaudo : undefined}
          >
            Baixar laudo
          </div>
        </div>
      </div>

      <div className="area-trabalho">
        {/* Visualizador da lesão */}
        <div className="painel-imagem" ref={painelRef} onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
          {!temImagem && (
            // biome-ignore lint/a11y/noLabelWithoutControl: associado via htmlFor ao input
            <label className="estado-inicial" htmlFor="uploadLesao">
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
                  <circle cx="11" cy="11" r="7" />
                  <line x1="16.5" y1="16.5" x2="21" y2="21" />
                </svg>
                <div className="overlay-titulo">Carregar imagem da lesão</div>
                <div className="overlay-subtitulo">Clique ou arraste</div>
              </div>
            </label>
          )}
          <canvas
            ref={canvasRef}
            style={{ display: temImagem ? 'block' : 'none' }}
          />
        </div>

        {/* Painel de avaliação */}
        <aside className="painel-avaliacao">
          <div className="seletor-metodo">
            {(['abcde', 'sete-pontos', 'abcd-tds'] as Metodo[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`aba-metodo ${metodo === m ? 'ativa' : ''}`}
                onClick={() => setMetodo(m)}
              >
                {labelMetodo[m]}
              </button>
            ))}
          </div>

          <div className="conteudo-metodo">
            {metodo === 'abcde' && (
              <div className="grupo-criterios">
                <p className="legenda-grupo">
                  Marque os critérios de alerta observados.
                </p>
                {CRITERIOS_ABCDE.map((c) => (
                  <CriterioToggle
                    key={c.id}
                    criterio={c}
                    ativo={!!abcde[c.id]}
                    onToggle={() => toggle(setAbcde, c.id)}
                  />
                ))}
              </div>
            )}

            {metodo === 'sete-pontos' && (
              <div className="grupo-criterios">
                <p className="legenda-grupo">
                  Critérios maiores valem 2 pontos; menores valem 1 ponto.
                </p>
                <h4 className="titulo-secao">Critérios maiores (2 pts)</h4>
                {CRITERIOS_MAIORES.map((c) => (
                  <CriterioToggle
                    key={c.id}
                    criterio={c}
                    ativo={!!maiores[c.id]}
                    onToggle={() => toggle(setMaiores, c.id)}
                  />
                ))}
                <h4 className="titulo-secao">Critérios menores (1 pt)</h4>
                {CRITERIOS_MENORES.map((c) => (
                  <CriterioToggle
                    key={c.id}
                    criterio={c}
                    ativo={!!menores[c.id]}
                    onToggle={() => toggle(setMenores, c.id)}
                  />
                ))}
              </div>
            )}

            {metodo === 'abcd-tds' && (
              <div className="grupo-criterios">
                <p className="legenda-grupo">
                  {'TDS = 1,3·A + 0,1·B + 0,5·C + 0,5·D'}
                </p>

                <h4 className="titulo-secao">A — Assimetria (eixos)</h4>
                <div className="grupo-pilulas">
                  {[0, 1, 2].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`pilula ${assimetriaTds === v ? 'ativa' : ''}`}
                      onClick={() => setAssimetriaTds(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <h4 className="titulo-secao">B — Bordas (segmentos abruptos)</h4>
                <div className="campo-slider">
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={1}
                    value={bordasTds}
                    onChange={(e) => setBordasTds(Number(e.target.value))}
                  />
                  <span className="valor-slider">{bordasTds}/8</span>
                </div>

                <h4 className="titulo-secao">C — Cores ({numCores})</h4>
                <div className="grupo-checks">
                  {CORES_ABCD.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`chip ${coresTds[c] ? 'ativo' : ''}`}
                      onClick={() => toggle(setCoresTds, c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <h4 className="titulo-secao">
                  D — Estruturas ({numEstruturas})
                </h4>
                <div className="grupo-checks">
                  {ESTRUTURAS_ABCD.map((e) => (
                    <button
                      key={e}
                      type="button"
                      className={`chip ${estruturasTds[e] ? 'ativo' : ''}`}
                      onClick={() => toggle(setEstruturasTds, e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resultado */}
          <div className={`caixa-resultado nivel-${veredito.nivel}`}>
            <div className="resultado-topo">
              <span className="resultado-rotulo">{veredito.rotulo}</span>
              <span className="resultado-score">
                {metodo === 'abcde' && `${numAbcde}/5`}
                {metodo === 'sete-pontos' && `${scoreSetePontos} pts`}
                {metodo === 'abcd-tds' && `TDS ${tds.toFixed(2)}`}
              </span>
            </div>
            <p className="resultado-detalhe">{veredito.detalhe}</p>
          </div>

          <p className="aviso-clinico">
            Ferramenta de apoio à decisão — não substitui a avaliação médica
            presencial.
          </p>
        </aside>
      </div>
    </div>
  )
}

function CriterioToggle({
  criterio,
  ativo,
  onToggle,
}: {
  criterio: CriterioBin
  ativo: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={`criterio ${ativo ? 'ativo' : ''}`}
      onClick={onToggle}
      aria-pressed={ativo}
    >
      <span className="criterio-check" aria-hidden="true">
        {ativo ? '✓' : ''}
      </span>
      <span className="criterio-texto">
        <span className="criterio-titulo">{criterio.titulo}</span>
        <span className="criterio-desc">{criterio.descricao}</span>
      </span>
    </button>
  )
}
