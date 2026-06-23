'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'

/* Índices do MediaPipe Face Mesh para o centro das íris (refineLandmarks) */
const IRIS_DIR = 468
const IRIS_ESQ = 473

type LadoKey = 'antes' | 'depois'

type EstadoLado = {
  img: HTMLImageElement | null
  landmarks: Array<{ x: number; y: number }> | null
  zoom: number
  panX: number
  panY: number
  canvas: HTMLCanvasElement | null
  ctx: CanvasRenderingContext2D | null
}

export function ComparacaoTool() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasAntesRef = useRef<HTMLCanvasElement>(null)
  const canvasDepoisRef = useRef<HTMLCanvasElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const root = rootRef.current
    if (!root) return
    const $ = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!
    const win = window as unknown as {
      FaceMesh: new (config: { locateFile: (f: string) => string }) => any
    }

    let destroyed = false

    /* ---------- estado ---------- */
    const lados: Record<LadoKey, EstadoLado> = {
      antes: {
        img: null,
        landmarks: null,
        zoom: 1,
        panX: 0,
        panY: 0,
        canvas: canvasAntesRef.current,
        ctx: canvasAntesRef.current?.getContext('2d') ?? null,
      },
      depois: {
        img: null,
        landmarks: null,
        zoom: 1,
        panX: 0,
        panY: 0,
        canvas: canvasDepoisRef.current,
        ctx: canvasDepoisRef.current?.getContext('2d') ?? null,
      },
    }

    let alinharAtivo = false
    let sincronizarAtivo = false
    let guiasAtivo = true

    /* ---------- FACE MESH ---------- */
    let faceMesh: any = null
    let pendingResolve:
      | ((lm: Array<{ x: number; y: number }> | null) => void)
      | null = null

    function setupFaceMesh() {
      if (destroyed) return
      if (!win.FaceMesh) {
        setTimeout(setupFaceMesh, 100)
        return
      }
      faceMesh = new win.FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      })
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
      faceMesh.onResults((resultados: any) => {
        const lm =
          resultados.multiFaceLandmarks &&
          resultados.multiFaceLandmarks.length > 0
            ? resultados.multiFaceLandmarks[0]
            : null
        if (pendingResolve) {
          const resolver = pendingResolve
          pendingResolve = null
          resolver(lm)
        }
      })
    }
    setupFaceMesh()

    function detectarRosto(
      img: HTMLImageElement,
    ): Promise<Array<{ x: number; y: number }> | null> {
      if (!faceMesh) return Promise.resolve(null)
      return new Promise((resolve) => {
        pendingResolve = resolve
        try {
          faceMesh.send({ image: img })
        } catch (err) {
          console.error('[v0] Erro no FaceMesh:', err)
          pendingResolve = null
          resolve(null)
        }
      })
    }

    /* ---------- redimensionamento ---------- */
    function ajustarCanvas(key: LadoKey) {
      const lado = lados[key]
      const container = $(`painel${key === 'antes' ? 'Antes' : 'Depois'}`)
      if (!lado.canvas || !container) return
      lado.canvas.width = container.clientWidth
      lado.canvas.height = container.clientHeight
    }

    function onResize() {
      ;(['antes', 'depois'] as LadoKey[]).forEach((key) => {
        if (lados[key].img) {
          ajustarCanvas(key)
          renderizar(key)
        }
      })
    }
    window.addEventListener('resize', onResize)

    /* ---------- renderização ---------- */
    function desenharGuias(ctx: CanvasRenderingContext2D, cv: HTMLCanvasElement) {
      const yOlhos = cv.height * 0.45
      ctx.save()
      ctx.strokeStyle = 'rgba(10, 132, 255, 0.55)'
      ctx.lineWidth = 1
      ctx.setLineDash([6, 6])
      ctx.beginPath()
      ctx.moveTo(0, yOlhos)
      ctx.lineTo(cv.width, yOlhos)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cv.width / 2, 0)
      ctx.lineTo(cv.width / 2, cv.height)
      ctx.stroke()
      ctx.restore()
    }

    function renderizar(key: LadoKey) {
      const lado = lados[key]
      const cv = lado.canvas
      const ctx = lado.ctx
      if (!cv || !ctx) return
      ctx.clearRect(0, 0, cv.width, cv.height)
      if (!lado.img) return

      const targetX = cv.width / 2
      const targetY = cv.height * 0.45

      ctx.save()
      if (alinharAtivo && lado.landmarks) {
        const w = lado.img.width
        const h = lado.img.height
        const rx = lado.landmarks[IRIS_DIR].x * w
        const ry = lado.landmarks[IRIS_DIR].y * h
        const lx = lado.landmarks[IRIS_ESQ].x * w
        const ly = lado.landmarks[IRIS_ESQ].y * h
        const eyeMidX = (rx + lx) / 2
        const eyeMidY = (ry + ly) / 2
        const eyeDist = Math.hypot(lx - rx, ly - ry) || 1
        const angle = Math.atan2(ly - ry, lx - rx)
        const targetEyeDist = cv.width * 0.3
        const baseScale = targetEyeDist / eyeDist

        ctx.translate(targetX + lado.panX, targetY + lado.panY)
        ctx.rotate(-angle)
        ctx.scale(baseScale * lado.zoom, baseScale * lado.zoom)
        ctx.translate(-eyeMidX, -eyeMidY)
        ctx.drawImage(lado.img, 0, 0)
      } else {
        const fit =
          Math.min(cv.width / lado.img.width, cv.height / lado.img.height) * 0.9
        ctx.translate(cv.width / 2 + lado.panX, cv.height / 2 + lado.panY)
        ctx.scale(fit * lado.zoom, fit * lado.zoom)
        ctx.translate(-lado.img.width / 2, -lado.img.height / 2)
        ctx.drawImage(lado.img, 0, 0)
      }
      ctx.restore()

      if (guiasAtivo) desenharGuias(ctx, cv)
    }

    function renderizarTudo() {
      renderizar('antes')
      renderizar('depois')
    }

    /* ---------- upload ---------- */
    async function processarArquivo(key: LadoKey, arquivo: File) {
      const overlayId = key === 'antes' ? 'overlayAntes' : 'overlayDepois'
      const spinnerId = key === 'antes' ? 'spinnerAntes' : 'spinnerDepois'
      const conteudoId = key === 'antes' ? 'conteudoAntes' : 'conteudoDepois'
      $(conteudoId).style.display = 'none'
      $(spinnerId).style.display = 'block'
      $(overlayId).style.pointerEvents = 'none'

      const leitor = new FileReader()
      leitor.onload = (ev) => {
        const img = new Image()
        img.onload = async () => {
          const lado = lados[key]
          lado.img = img
          lado.zoom = 1
          lado.panX = 0
          lado.panY = 0

          ajustarCanvas(key)
          try {
            lado.landmarks = await detectarRosto(img)
          } catch {
            lado.landmarks = null
          } finally {
            if (destroyed) return
            $(overlayId).style.display = 'none'
            if (lado.canvas) lado.canvas.style.display = 'block'
            atualizarBotoes()
            renderizar(key)
          }
        }
        img.src = ev.target?.result as string
      }
      leitor.readAsDataURL(arquivo)
    }

    function configurarUpload(key: LadoKey) {
      const inputId = key === 'antes' ? 'uploadAntes' : 'uploadDepois'
      const overlayId = key === 'antes' ? 'overlayAntes' : 'overlayDepois'
      const input = $(inputId) as HTMLInputElement
      const overlay = $(overlayId)

      const onChange = (e: Event) => {
        const arquivo = (e.target as HTMLInputElement).files?.[0]
        if (arquivo) processarArquivo(key, arquivo)
      }
      input.addEventListener('change', onChange)

      const onDragOver = (e: DragEvent) => {
        e.preventDefault()
        overlay.style.borderColor = '#0A84FF'
        overlay.style.backgroundColor = 'rgba(10, 132, 255, 0.15)'
      }
      const onDragLeave = (e: DragEvent) => {
        e.preventDefault()
        overlay.style.borderColor = ''
        overlay.style.backgroundColor = ''
      }
      const onDrop = (e: DragEvent) => {
        e.preventDefault()
        overlay.style.borderColor = ''
        overlay.style.backgroundColor = ''
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
          processarArquivo(key, e.dataTransfer.files[0])
        }
      }
      overlay.addEventListener('dragover', onDragOver)
      overlay.addEventListener('dragleave', onDragLeave)
      overlay.addEventListener('drop', onDrop)
    }
    configurarUpload('antes')
    configurarUpload('depois')

    /* ---------- pan / zoom ---------- */
    function aplicarZoom(key: LadoKey, fator: number) {
      lados[key].zoom *= fator
      renderizar(key)
      if (sincronizarAtivo) {
        const outro: LadoKey = key === 'antes' ? 'depois' : 'antes'
        lados[outro].zoom *= fator
        renderizar(outro)
      }
    }

    function aplicarPan(key: LadoKey, dx: number, dy: number) {
      lados[key].panX += dx
      lados[key].panY += dy
      renderizar(key)
      if (sincronizarAtivo) {
        const outro: LadoKey = key === 'antes' ? 'depois' : 'antes'
        lados[outro].panX += dx
        lados[outro].panY += dy
        renderizar(outro)
      }
    }

    type Limpeza = () => void
    const limpezas: Limpeza[] = []

    function configurarInteracao(key: LadoKey) {
      const lado = lados[key]
      const cv = lado.canvas
      if (!cv) return
      let arrastando = false
      let ultimoX = 0
      let ultimoY = 0

      const onWheel = (e: WheelEvent) => {
        if (!lado.img) return
        e.preventDefault()
        aplicarZoom(key, e.deltaY < 0 ? 1.1 : 0.9)
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
        if (!lado.img) return
        arrastando = true
        const p = getPos(e)
        ultimoX = p.x
        ultimoY = p.y
      }
      const onMove = (e: MouseEvent | TouchEvent) => {
        if (!arrastando) return
        e.preventDefault()
        const p = getPos(e)
        aplicarPan(key, p.x - ultimoX, p.y - ultimoY)
        ultimoX = p.x
        ultimoY = p.y
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

      limpezas.push(() => {
        cv.removeEventListener('wheel', onWheel)
        cv.removeEventListener('mousedown', onDown)
        cv.removeEventListener('mousemove', onMove)
        cv.removeEventListener('mouseup', onUp)
        cv.removeEventListener('mouseleave', onUp)
        cv.removeEventListener('touchstart', onDown)
        cv.removeEventListener('touchmove', onMove)
        cv.removeEventListener('touchend', onUp)
      })
    }
    configurarInteracao('antes')
    configurarInteracao('depois')

    /* ---------- botões ---------- */
    function atualizarBotoes() {
      const algumImg = !!(lados.antes.img || lados.depois.img)
      const ambasImg = !!(lados.antes.img && lados.depois.img)

      const btnAlinhar = $('btnAlinhar')
      const btnSync = $('btnSync')
      const btnGuias = $('btnGuias')
      const btnReiniciar = $('btnReiniciar')
      const btnDownload = $('btnDownload')

      btnAlinhar.classList.toggle('desativado', !algumImg)
      btnSync.classList.toggle('desativado', !ambasImg)
      btnGuias.classList.toggle('desativado', !algumImg)
      btnReiniciar.classList.toggle('desativado', !algumImg)
      btnDownload.classList.toggle('desativado', !ambasImg)
      btnDownload.classList.toggle('ativo-download', ambasImg)
    }

    const btnAlinhar = $('btnAlinhar')
    const onAlinhar = function (this: HTMLElement) {
      if (this.classList.contains('desativado')) return
      alinharAtivo = !alinharAtivo
      this.classList.toggle('ativo', alinharAtivo)
      // reset de pan/zoom ao alternar para evitar deslocamentos confusos
      ;(['antes', 'depois'] as LadoKey[]).forEach((key) => {
        lados[key].zoom = 1
        lados[key].panX = 0
        lados[key].panY = 0
      })
      renderizarTudo()
    }
    btnAlinhar.addEventListener('click', onAlinhar)

    const btnSync = $('btnSync')
    const onSync = function (this: HTMLElement) {
      if (this.classList.contains('desativado')) return
      sincronizarAtivo = !sincronizarAtivo
      this.classList.toggle('ativo', sincronizarAtivo)
    }
    btnSync.addEventListener('click', onSync)

    const btnGuias = $('btnGuias')
    btnGuias.classList.toggle('ativo', guiasAtivo)
    const onGuias = function (this: HTMLElement) {
      if (this.classList.contains('desativado')) return
      guiasAtivo = !guiasAtivo
      this.classList.toggle('ativo', guiasAtivo)
      renderizarTudo()
    }
    btnGuias.addEventListener('click', onGuias)

    const btnReiniciar = $('btnReiniciar')
    const onReiniciar = function (this: HTMLElement) {
      if (this.classList.contains('desativado')) return
      ;(['antes', 'depois'] as LadoKey[]).forEach((key) => {
        const lado = lados[key]
        lado.zoom = 1
        lado.panX = 0
        lado.panY = 0
        renderizar(key)
      })
    }
    btnReiniciar.addEventListener('click', onReiniciar)

    const btnDownload = $('btnDownload')
    const onDownload = function (this: HTMLElement) {
      if (this.classList.contains('desativado')) return
      const a = lados.antes
      const b = lados.depois
      if (!a.canvas || !b.canvas || !a.img || !b.img) return
      const gap = 24
      const labelH = 48
      const pw = a.canvas.width
      const ph = Math.max(a.canvas.height, b.canvas.height)
      const out = document.createElement('canvas')
      out.width = pw * 2 + gap
      out.height = ph + labelH
      const octx = out.getContext('2d')
      if (!octx) return
      octx.fillStyle = '#000000'
      octx.fillRect(0, 0, out.width, out.height)
      octx.drawImage(a.canvas, 0, labelH)
      octx.drawImage(b.canvas, pw + gap, labelH)
      octx.fillStyle = '#ffffff'
      octx.font = '600 20px sans-serif'
      octx.textAlign = 'center'
      octx.textBaseline = 'middle'
      octx.fillText('ANTES', pw / 2, labelH / 2)
      octx.fillText('DEPOIS', pw + gap + pw / 2, labelH / 2)

      const link = document.createElement('a')
      link.download = 'visagemed-comparacao.png'
      link.href = out.toDataURL('image/png')
      link.click()
    }
    btnDownload.addEventListener('click', onDownload)

    /* ---------- cleanup ---------- */
    return () => {
      destroyed = true
      window.removeEventListener('resize', onResize)
      limpezas.forEach((fn) => fn())
      btnAlinhar.removeEventListener('click', onAlinhar)
      btnSync.removeEventListener('click', onSync)
      btnGuias.removeEventListener('click', onGuias)
      btnReiniciar.removeEventListener('click', onReiniciar)
      btnDownload.removeEventListener('click', onDownload)
      try {
        faceMesh?.close?.()
      } catch {
        /* noop */
      }
    }
  }, [])

  return (
    <div ref={rootRef} className="vm-comparacao">
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
        strategy="afterInteractive"
      />

      {/* Barra de ferramentas */}
      <div className="menu-ferramentas">
        <label htmlFor="uploadAntes" className="item-menu iniciar-ativo">
          Foto Antes
        </label>
        <input type="file" id="uploadAntes" accept="image/*" />
        <label htmlFor="uploadDepois" className="item-menu iniciar-ativo">
          Foto Depois
        </label>
        <input type="file" id="uploadDepois" accept="image/*" />

        <div className="item-menu desativado" id="btnAlinhar">
          Alinhar pelos olhos
        </div>
        <div className="item-menu desativado" id="btnSync">
          Sincronizar
        </div>
        <div className="item-menu desativado" id="btnGuias">
          Guias
        </div>

        <div className="grupo-direita">
          <div className="item-menu desativado" id="btnReiniciar">
            Reiniciar
          </div>
          <div className="item-menu desativado" id="btnDownload">
            Download
          </div>
        </div>
      </div>

      <div className="area-comparacao">
        {/* Painel ANTES */}
        <div className="painel-foto" id="painelAntes">
          <span className="rotulo-painel">Antes</span>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: associado via htmlFor ao input de upload */}
          <label className="estado-inicial" id="overlayAntes" htmlFor="uploadAntes">
            <div id="conteudoAntes" className="overlay-conteudo">
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <div className="overlay-titulo">Foto Antes</div>
              <div className="overlay-subtitulo">Clique ou arraste</div>
            </div>
            <div className="carregando" id="spinnerAntes" />
          </label>
          <canvas ref={canvasAntesRef} style={{ display: 'none' }} />
        </div>

        {/* Painel DEPOIS */}
        <div className="painel-foto" id="painelDepois">
          <span className="rotulo-painel">Depois</span>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: associado via htmlFor ao input de upload */}
          <label className="estado-inicial" id="overlayDepois" htmlFor="uploadDepois">
            <div id="conteudoDepois" className="overlay-conteudo">
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <div className="overlay-titulo">Foto Depois</div>
              <div className="overlay-subtitulo">Clique ou arraste</div>
            </div>
            <div className="carregando" id="spinnerDepois" />
          </label>
          <canvas ref={canvasDepoisRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  )
}
