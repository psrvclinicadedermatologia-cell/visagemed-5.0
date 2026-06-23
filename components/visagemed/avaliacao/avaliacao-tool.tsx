'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'

/* =========================================================
   Constantes anatômicas (índices do MediaPipe Face Mesh)
   ========================================================= */
const BOCA_EXTERNA = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37,
  39, 40, 185,
]
const CONTORNO_ROSTO = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
]
const PERIOCULAR_ESQ = [
  336, 296, 334, 293, 300, 383, 372, 340, 346, 347, 348, 349, 350, 357, 465, 417,
]
const PERIOCULAR_DIR = [
  107, 66, 105, 63, 70, 156, 143, 111, 117, 118, 119, 120, 121, 128, 245, 193,
]
const BLUR_INTENSIDADE = 60
const BLUR_SUAVIZACAO = 15

type ItemAnatomia = {
  id: string
  nome: string
  indices: number[]
  color: string
}
type CategoriaAnatomia = { id: string; titulo: string; itens: ItemAnatomia[] }

const CATEGORIAS_ANATOMIA: CategoriaAnatomia[] = [
  {
    id: 'catOlhos',
    titulo: 'Terço Superior e Olhos',
    itens: [
      {
        id: 'dist_intertemporal',
        nome: 'Distância Intertemporal',
        indices: [162, 389],
        color: '#FFD60A',
      },
      {
        id: 'dist_interpupilar',
        nome: 'Distância Interpupilar',
        indices: [468, 473],
        color: '#00E5FF',
      },
      {
        id: 'periocular_dir',
        nome: 'Região Periocular Direita',
        indices: [
          193, 107, 66, 105, 63, 70, 156, 143, 111, 117, 118, 119, 120, 121,
          128, 245, 193,
        ],
        color: '#FF2D95',
      },
      {
        id: 'periocular_esq',
        nome: 'Região Periocular Esquerda',
        indices: [
          417, 336, 296, 334, 293, 300, 383, 372, 340, 346, 347, 348, 349, 350,
          357, 465, 417,
        ],
        color: '#FF2D95',
      },
    ],
  },
  {
    id: 'catNariz',
    titulo: 'Terço Médio e Nariz',
    itens: [
      {
        id: 'dist_bizigomatica',
        nome: 'Largura Bizigomática',
        indices: [234, 454],
        color: '#FFD60A',
      },
      {
        id: 'dist_alar',
        nome: 'Distância Alar',
        indices: [235, 455],
        color: '#00E5FF',
      },
      {
        id: 'sulco_nasogeniano_dir',
        nome: 'Sulco Nasogeniano Direito',
        indices: [129, 203, 206, 216, 212],
        color: '#30FF6A',
      },
      {
        id: 'sulco_nasogeniano_esq',
        nome: 'Sulco Nasogeniano Esquerdo',
        indices: [358, 423, 426, 436, 432],
        color: '#30FF6A',
      },
    ],
  },
  {
    id: 'catLabios',
    titulo: 'Lábios e Região Perioral',
    itens: [
      {
        id: 'arco_cupido',
        nome: 'Arco do Cupido',
        indices: [39, 37, 0, 267, 269],
        color: '#FF2D95',
      },
      {
        id: 'altura_labio_sup',
        nome: 'Altura Lábio Superior',
        indices: [0, 11, 12, 13],
        color: '#00E5FF',
      },
      {
        id: 'altura_labio_inf',
        nome: 'Altura Lábio Inferior',
        indices: [14, 15, 16, 17],
        color: '#FFD60A',
      },
      {
        id: 'dist_intercomissural',
        nome: 'Distância Intercomissural',
        indices: [61, 291],
        color: '#30FF6A',
      },
      {
        id: 'contorno_labio_inf_medial',
        nome: 'Contorno Inf. do Lábio (Medial)',
        indices: [181, 84, 17, 314, 405],
        color: '#FF9F0A',
      },
      {
        id: 'porcao_lat_dir_labio_inf',
        nome: 'Porção Lat. Dir. do Lábio Inferior',
        indices: [61, 146, 91, 181],
        color: '#BF5AF2',
      },
      {
        id: 'porcao_lat_esq_labio_inf',
        nome: 'Porção Lat. Esq. do Lábio Inferior',
        indices: [291, 375, 321, 405],
        color: '#BF5AF2',
      },
      {
        id: 'sulco_labiomentual_dir',
        nome: 'Sulco Labiomentual Direito',
        indices: [202, 210, 169],
        color: '#00E5FF',
      },
      {
        id: 'sulco_labiomentual_esq',
        nome: 'Sulco Labiomentual Esquerdo',
        indices: [422, 430, 394],
        color: '#00E5FF',
      },
    ],
  },
  {
    id: 'catMandibula',
    titulo: 'Contorno e Mandíbula',
    itens: [
      {
        id: 'dist_bigonial',
        nome: 'Largura Bigonial',
        indices: [58, 288],
        color: '#FFD60A',
      },
      {
        id: 'jaw_dir',
        nome: 'Ângulo da Mandíbula (Dir)',
        indices: [176, 149, 150],
        color: '#FF2D95',
      },
      {
        id: 'jaw_esq',
        nome: 'Ângulo da Mandíbula (Esq)',
        indices: [400, 378, 379],
        color: '#FF2D95',
      },
      {
        id: 'contorno_mandibular_dir',
        nome: 'Contorno Mandibular Direito',
        indices: [176, 149, 150, 136, 172, 58],
        color: '#30FF6A',
      },
      {
        id: 'contorno_mandibular_esq',
        nome: 'Contorno Mandibular Esquerdo',
        indices: [400, 378, 379, 365, 397, 288],
        color: '#30FF6A',
      },
      {
        id: 'largura_mentual',
        nome: 'Largura Mentual',
        indices: [176, 148, 152, 377, 400],
        color: '#FF9F0A',
      },
    ],
  },
]

export function AvaliacaoTool() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext('2d')!
    const $ = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!
    const win = window as unknown as {
      FaceMesh: new (config: { locateFile: (f: string) => string }) => any
      FilesetResolver: any
      ImageSegmenter: any
    }

    /* ---------- estado ---------- */
    let imagemOriginal: HTMLImageElement | null = null
    let landmarks: Array<{ x: number; y: number }> | null = null
    let mostrarLandmarks = false
    let imageSegmenter: any = null
    let mascaraPeleCanvas: HTMLCanvasElement | null = null
    let linhaCapilarY = 0
    let moduloPeleAtivo = false
    let mascaraAnalisePeleCanvas: HTMLCanvasElement | null = null
    let removerFundoAtivo = false
    let mascaraFrenteCanvas: HTMLCanvasElement | null = null
    const filtros: Record<string, number> = {
      esfumado: 15,
      exposicao: 0,
      contraste: 0,
      saturacao: 0,
      desfoque: 0,
    }
    let blurPeriocularAtivo = false
    let pincelMaskCanvas: HTMLCanvasElement | null = null
    let cacheImagemBorrada: HTMLCanvasElement | null = null
    let cacheBlurIntensidade = -1
    let canvasTemporarioRender: HTMLCanvasElement | null = null

    const itensAtivos: Record<string, boolean> = {}
    const medidasAtivas: Record<string, boolean> = {
      tercos: false,
      quintos: false,
    }
    const progressoAnatomia: Record<string, number> = {}
    const animandoAnatomia: Record<string, number> = {}

    let escala = 1
    let escalaVisual = 1
    let deslocamentoX = 0
    let deslocamentoY = 0
    let isDragging = false
    let dragStartX = 0
    let dragStartY = 0

    let faceMesh: any = null
    let destroyed = false

    /* ---------- FACE MESH ---------- */
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
        if (
          resultados.multiFaceLandmarks &&
          resultados.multiFaceLandmarks.length > 0
        ) {
          landmarks = resultados.multiFaceLandmarks[0]
        } else {
          landmarks = null
        }
        renderizar()
        ativarBotoes()
      })
    }
    setupFaceMesh()

    /* ---------- IMAGE SEGMENTER ---------- */
    async function initializeSegmenter() {
      try {
        const { ImageSegmenter, FilesetResolver } = await import(
          '@mediapipe/tasks-vision'
        )
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm',
        )
        if (destroyed) return
        imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        })
      } catch (err) {
        console.error('[v0] Erro ao inicializar ImageSegmenter:', err)
      }
    }
    initializeSegmenter()

    function criarMascaraPele(categoryMask: any) {
      const w = categoryMask.width
      const h = categoryMask.height
      const maskArr = categoryMask.getAsUint8Array()

      const tempPele = document.createElement('canvas')
      tempPele.width = w
      tempPele.height = h
      const ctxPele = tempPele.getContext('2d')!
      const imgDataPele = ctxPele.createImageData(w, h)

      const tempFrente = document.createElement('canvas')
      tempFrente.width = w
      tempFrente.height = h
      const ctxFrente = tempFrente.getContext('2d')!
      const imgDataFrente = ctxFrente.createImageData(w, h)

      let primeiroY = h
      for (let i = 0; i < maskArr.length; i++) {
        const category = maskArr[i]
        const idx = i * 4
        if (category === 2 || category === 3) {
          imgDataPele.data[idx] = 255
          imgDataPele.data[idx + 1] = 255
          imgDataPele.data[idx + 2] = 255
          imgDataPele.data[idx + 3] = 255
          if (category === 3) {
            const y = Math.floor(i / w)
            if (y < primeiroY) primeiroY = y
          }
        }
        if (category !== 0) {
          imgDataFrente.data[idx] = 255
          imgDataFrente.data[idx + 1] = 255
          imgDataFrente.data[idx + 2] = 255
          imgDataFrente.data[idx + 3] = 255
        }
      }

      linhaCapilarY = primeiroY / h
      ctxPele.putImageData(imgDataPele, 0, 0)
      ctxFrente.putImageData(imgDataFrente, 0, 0)

      if (!imagemOriginal) return
      mascaraPeleCanvas = document.createElement('canvas')
      mascaraPeleCanvas.width = imagemOriginal.width
      mascaraPeleCanvas.height = imagemOriginal.height
      mascaraPeleCanvas
        .getContext('2d')!
        .drawImage(tempPele, 0, 0, imagemOriginal.width, imagemOriginal.height)

      mascaraFrenteCanvas = document.createElement('canvas')
      mascaraFrenteCanvas.width = imagemOriginal.width
      mascaraFrenteCanvas.height = imagemOriginal.height
      mascaraFrenteCanvas
        .getContext('2d')!
        .drawImage(tempFrente, 0, 0, imagemOriginal.width, imagemOriginal.height)

      if (categoryMask.close) categoryMask.close()
    }

    /* ---------- redimensionamento / pan / zoom ---------- */
    function ajustarTamanhoCanvas() {
      if (!imagemOriginal) return
      const container = $('containerCanvas')
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }

    function onResize() {
      if (imagemOriginal) {
        ajustarTamanhoCanvas()
        renderizar()
      }
    }
    window.addEventListener('resize', onResize)

    function getMousePos(e: MouseEvent | TouchEvent) {
      const rect = canvas.getBoundingClientRect()
      let clientX = (e as MouseEvent).clientX
      let clientY = (e as MouseEvent).clientY
      const te = e as TouchEvent
      if (te.touches && te.touches.length > 0) {
        clientX = te.touches[0].clientX
        clientY = te.touches[0].clientY
      }
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    function onWheel(e: WheelEvent) {
      if (!imagemOriginal) return
      e.preventDefault()
      const pos = getMousePos(e)
      const wheel = e.deltaY < 0 ? 1 : -1
      const zoom = Math.exp(wheel * 0.1)
      deslocamentoX = pos.x - (pos.x - deslocamentoX) * zoom
      deslocamentoY = pos.y - (pos.y - deslocamentoY) * zoom
      escala *= zoom
      escalaVisual = escala
      renderizar()
    }
    function iniciarInteracao(e: MouseEvent | TouchEvent) {
      if (!imagemOriginal) return
      isDragging = true
      const pos = getMousePos(e)
      dragStartX = pos.x - deslocamentoX
      dragStartY = pos.y - deslocamentoY
    }
    function moverInteracao(e: MouseEvent | TouchEvent) {
      if (!isDragging) return
      e.preventDefault()
      const pos = getMousePos(e)
      deslocamentoX = pos.x - dragStartX
      deslocamentoY = pos.y - dragStartY
      renderizar()
    }
    function pararInteracao() {
      isDragging = false
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('mousedown', iniciarInteracao)
    canvas.addEventListener('mousemove', moverInteracao)
    canvas.addEventListener('mouseup', pararInteracao)
    canvas.addEventListener('mouseleave', pararInteracao)
    canvas.addEventListener('touchstart', iniciarInteracao, { passive: false })
    canvas.addEventListener('touchmove', moverInteracao, { passive: false })
    canvas.addEventListener('touchend', pararInteracao)

    /* ---------- upload ---------- */
    const inputImagem = $('uploadImagem') as HTMLInputElement
    async function onUpload(e: Event) {
      const arquivo = (e.target as HTMLInputElement).files?.[0]
      if (!arquivo) return

      $('iconeOverlay').style.display = 'none'
      $('tituloOverlay').style.display = 'none'
      $('subtituloOverlay').style.display = 'none'
      $('spinnerCarregando').style.display = 'block'
      $('textoCarregando').style.display = 'block'
      $('overlayInicial').style.pointerEvents = 'none'

      const leitor = new FileReader()
      leitor.onload = (ev) => {
        const img = new Image()
        img.onload = async () => {
          imagemOriginal = img
          cacheImagemBorrada = null
          cacheBlurIntensidade = -1
          pincelMaskCanvas = null
          blurPeriocularAtivo = false
          $('btnBlurFace').classList.remove('ativo')
          removerFundoAtivo = false
          $('btnRemoverFundo').classList.remove('ativo')
          $('btnRemoverFundo').textContent = 'Remover Fundo'

          ajustarTamanhoCanvas()
          const areaW = canvas.width
          const areaH = canvas.height
          const scaleX = areaW / img.width
          const scaleY = areaH / img.height
          escala = Math.min(scaleX, scaleY) * 0.85
          escalaVisual = escala
          deslocamentoX = (areaW - img.width * escala) / 2
          deslocamentoY = (areaH - img.height * escala) / 2

          try {
            const promessaFace = faceMesh
              ? faceMesh.send({ image: img })
              : Promise.resolve()
            let promessaSegmentacao: Promise<void> = Promise.resolve()
            if (imageSegmenter) {
              promessaSegmentacao = new Promise<void>((resolve) => {
                setTimeout(() => {
                  const result = imageSegmenter.segment(img)
                  if (result && result.categoryMask)
                    criarMascaraPele(result.categoryMask)
                  resolve()
                }, 10)
              })
            }
            await Promise.all([promessaFace, promessaSegmentacao])
          } catch (err) {
            console.error('[v0] Erro na IA:', err)
          } finally {
            $('overlayInicial').style.display = 'none'
            canvas.style.display = 'block'
            ativarBotoes()
            renderizar()
          }
        }
        img.src = ev.target?.result as string
      }
      leitor.readAsDataURL(arquivo)
    }
    inputImagem.addEventListener('change', onUpload)

    /* ---------- ativar botões ---------- */
    function ativarBotoes() {
      $('btnPele').classList.remove('desativado')
      $('btnAvaliacaoPele').classList.remove('desativado')
      $('btnAnatomia').classList.remove('desativado')
      $('btnBlurFace').classList.remove('desativado')
      $('btnRemoverFundo').classList.remove('desativado')
      $('btnReiniciar').classList.remove('desativado')
      $('btnDownload').classList.remove('desativado')
      $('btnDownload').classList.add('ativo-download')
      $('lblIniciar').classList.remove('iniciar-ativo')
      $('lblIniciar').classList.add('desativado')
    }

    const btnPele = $('btnPele')
    function onBtnPele(this: HTMLElement) {
      if (this.classList.contains('desativado')) return
      const painel = $('painelFerramentas')
      const seccaoPele = $('seccaoPele')
      if (this.classList.contains('ativo') && painel.style.display === 'block') {
        painel.style.display = 'none'
        this.classList.remove('ativo')
        seccaoPele.style.display = 'none'
      } else {
        painel.style.display = 'block'
        this.classList.add('ativo')
        $('btnAnatomia').classList.remove('ativo')
        $('btnAvaliacaoPele').classList.remove('ativo')
        seccaoPele.style.display = 'block'
        $('seccaoAnatomia').style.display = 'none'
        $('seccaoAvaliacaoPele').style.display = 'none'
        moduloPeleAtivo = false
        root
          .querySelectorAll('.btn-aval-pele')
          .forEach((b) => b.classList.remove('ativo'))
      }
      ajustarTamanhoCanvas()
      renderizar()
    }
    btnPele.addEventListener('click', onBtnPele)

    const btnAvaliacaoPele = $('btnAvaliacaoPele')
    function onBtnAvaliacaoPele(this: HTMLElement) {
      if (this.classList.contains('desativado')) return
      const painel = $('painelFerramentas')
      if (this.classList.contains('ativo') && painel.style.display === 'block') {
        painel.style.display = 'none'
        this.classList.remove('ativo')
        $('seccaoAvaliacaoPele').style.display = 'none'
        moduloPeleAtivo = false
      } else {
        painel.style.display = 'block'
        this.classList.add('ativo')
        $('btnPele').classList.remove('ativo')
        $('btnAnatomia').classList.remove('ativo')
        $('seccaoAvaliacaoPele').style.display = 'block'
        $('seccaoPele').style.display = 'none'
        $('seccaoAnatomia').style.display = 'none'
        moduloPeleAtivo = true
        gerarMascaraAlvoPele()
      }
      ajustarTamanhoCanvas()
      renderizar()
    }
    btnAvaliacaoPele.addEventListener('click', onBtnAvaliacaoPele)

    const btnAnatomia = $('btnAnatomia')
    function onBtnAnatomia(this: HTMLElement) {
      if (this.classList.contains('desativado')) return
      const painel = $('painelFerramentas')
      const seccaoAnatomia = $('seccaoAnatomia')
      if (this.classList.contains('ativo') && painel.style.display === 'block') {
        painel.style.display = 'none'
        this.classList.remove('ativo')
        seccaoAnatomia.style.display = 'none'
      } else {
        painel.style.display = 'block'
        this.classList.add('ativo')
        $('btnPele').classList.remove('ativo')
        $('btnAvaliacaoPele').classList.remove('ativo')
        seccaoAnatomia.style.display = 'block'
        $('seccaoPele').style.display = 'none'
        $('seccaoAvaliacaoPele').style.display = 'none'
        moduloPeleAtivo = false
        root
          .querySelectorAll('.btn-aval-pele')
          .forEach((b) => b.classList.remove('ativo'))
      }
      ajustarTamanhoCanvas()
      renderizar()
    }
    btnAnatomia.addEventListener('click', onBtnAnatomia)

    const avalPeleBtns = Array.from(
      root.querySelectorAll<HTMLElement>('.btn-aval-pele'),
    )
    const onAvalPele = function (this: HTMLElement) {
      if (!imagemOriginal || !mascaraAnalisePeleCanvas) return
      this.classList.toggle('ativo')
      console.log(`[v0] Motor de análise reservado. Analisando: ${this.textContent}`)
    }
    avalPeleBtns.forEach((b) => b.addEventListener('click', onAvalPele))

    const btnBlurFace = $('btnBlurFace')
    function onBlurFace(this: HTMLElement) {
      if (this.classList.contains('desativado') || !imagemOriginal || !landmarks)
        return
      blurPeriocularAtivo = !blurPeriocularAtivo
      if (blurPeriocularAtivo) {
        this.classList.add('ativo')
        this.textContent = 'Desativar BlurFace (Olhos)'
        gerarMascaraPeriocular()
      } else {
        this.classList.remove('ativo')
        this.textContent = 'Ativar BlurFace (Olhos)'
        if (pincelMaskCanvas) {
          pincelMaskCanvas
            .getContext('2d')!
            .clearRect(0, 0, pincelMaskCanvas.width, pincelMaskCanvas.height)
        }
      }
      renderizar()
    }
    btnBlurFace.addEventListener('click', onBlurFace)

    const btnRemoverFundo = $('btnRemoverFundo')
    function onRemoverFundo(this: HTMLElement) {
      if (!imagemOriginal || !mascaraFrenteCanvas) return
      removerFundoAtivo = !removerFundoAtivo
      if (removerFundoAtivo) {
        this.classList.add('ativo')
        this.textContent = 'Restaurar Fundo'
      } else {
        this.classList.remove('ativo')
        this.textContent = 'Remover Fundo'
      }
      renderizar()
    }
    btnRemoverFundo.addEventListener('click', onRemoverFundo)

    /* ---------- máscaras ---------- */
    function gerarMascaraAlvoPele() {
      if (!mascaraPeleCanvas || !landmarks || !imagemOriginal) return
      mascaraAnalisePeleCanvas = document.createElement('canvas')
      mascaraAnalisePeleCanvas.width = imagemOriginal.width
      mascaraAnalisePeleCanvas.height = imagemOriginal.height
      const mCtx = mascaraAnalisePeleCanvas.getContext('2d')!

      const desenharPoligono = (indices: number[]) => {
        mCtx.beginPath()
        indices.forEach((idx, i) => {
          const px = landmarks![idx].x * imagemOriginal!.width
          const py = landmarks![idx].y * imagemOriginal!.height
          if (i === 0) mCtx.moveTo(px, py)
          else mCtx.lineTo(px, py)
        })
        mCtx.closePath()
        mCtx.fill()
      }

      mCtx.fillStyle = '#FFFFFF'
      desenharPoligono(CONTORNO_ROSTO)
      mCtx.globalCompositeOperation = 'source-in'
      mCtx.drawImage(mascaraPeleCanvas, 0, 0)
      mCtx.globalCompositeOperation = 'destination-out'
      desenharPoligono(PERIOCULAR_ESQ)
      desenharPoligono(PERIOCULAR_DIR)
      desenharPoligono(BOCA_EXTERNA)
      mCtx.globalCompositeOperation = 'source-over'
    }

    function gerarMascaraPeriocular() {
      if (!imagemOriginal || !landmarks) return
      if (!pincelMaskCanvas) {
        pincelMaskCanvas = document.createElement('canvas')
        pincelMaskCanvas.width = imagemOriginal.width
        pincelMaskCanvas.height = imagemOriginal.height
      }
      const pCtx = pincelMaskCanvas.getContext('2d')!
      pCtx.clearRect(0, 0, pincelMaskCanvas.width, pincelMaskCanvas.height)
      pCtx.fillStyle = '#ffffff'
      const desenharPoligono = (indices: number[]) => {
        pCtx.beginPath()
        indices.forEach((idx, i) => {
          const pt = landmarks![idx]
          const px = pt.x * imagemOriginal!.width
          const py = pt.y * imagemOriginal!.height
          if (i === 0) pCtx.moveTo(px, py)
          else pCtx.lineTo(px, py)
        })
        pCtx.closePath()
        pCtx.fill()
      }
      desenharPoligono(PERIOCULAR_ESQ)
      desenharPoligono(PERIOCULAR_DIR)
    }

    /* ---------- controles de filtros / landmarks ---------- */
    const grupoCleanups: Array<() => void> = []
    root.querySelectorAll<HTMLElement>('.controle-grupo').forEach((grupo) => {
      const tipoFiltro = grupo.getAttribute('data-filtro')
      if (!tipoFiltro) return
      const range = grupo.querySelector<HTMLInputElement>('input[type="range"]')!
      const number = grupo.querySelector<HTMLInputElement>(
        'input[type="number"]',
      )!
      const reset = grupo.querySelector<HTMLButtonElement>('.btn-reset')!
      const onRange = () => {
        number.value = range.value
        filtros[tipoFiltro] = parseInt(range.value)
        renderizar()
      }
      const onNumber = () => {
        range.value = number.value
        filtros[tipoFiltro] = parseInt(number.value)
        renderizar()
      }
      const onReset = () => {
        const valorPadrao = tipoFiltro === 'esfumado' ? 15 : 0
        range.value = String(valorPadrao)
        number.value = String(valorPadrao)
        filtros[tipoFiltro] = valorPadrao
        renderizar()
      }
      range.addEventListener('input', onRange)
      number.addEventListener('input', onNumber)
      reset.addEventListener('click', onReset)
      grupoCleanups.push(() => {
        range.removeEventListener('input', onRange)
        number.removeEventListener('input', onNumber)
        reset.removeEventListener('click', onReset)
      })
    })

    const btnToggleLandmarks = $('btnToggleLandmarks')
    function onToggleLandmarks(this: HTMLElement) {
      mostrarLandmarks = !mostrarLandmarks
      this.classList.toggle('ativo')
      this.textContent = mostrarLandmarks
        ? 'Ocultar Malha (Landmarks)'
        : 'Mostrar Malha (Landmarks)'
      renderizar()
    }
    btnToggleLandmarks.addEventListener('click', onToggleLandmarks)

    const mapaGlobais: Record<string, string> = {
      tgTercos: 'tercos',
      tgQuintos: 'quintos',
    }
    const globalCleanups: Array<() => void> = []
    Object.keys(mapaGlobais).forEach((id) => {
      const btn = $(id)
      if (!btn) return
      const handler = function (this: HTMLElement) {
        const chave = mapaGlobais[id]
        medidasAtivas[chave] = !medidasAtivas[chave]
        this.classList.toggle('ativo')
        this.querySelector('span')!.textContent = medidasAtivas[chave]
          ? '−'
          : '+'
        iniciarAnimacaoAnatomia(chave, !medidasAtivas[chave])
      }
      btn.addEventListener('click', handler)
      globalCleanups.push(() => btn.removeEventListener('click', handler))
    })

    /* ---------- painel dinâmico de anatomia ---------- */
    const containerDinamico = $('containerAnatomiaDinamica')
    if (containerDinamico) {
      containerDinamico.innerHTML = ''
      CATEGORIAS_ANATOMIA.forEach((categoria) => {
        const details = document.createElement('details')
        details.open = false
        const summary = document.createElement('summary')
        summary.textContent = categoria.titulo
        details.appendChild(summary)
        const divConteudo = document.createElement('div')
        divConteudo.className = 'conteudo-seccao'
        divConteudo.style.gap = '8px'
        categoria.itens.forEach((item) => {
          itensAtivos[item.id] = false
          const divToggle = document.createElement('div')
          divToggle.className = 'btn-toggle-medida'
          divToggle.innerHTML = `${item.nome} <span>+</span>`
          divToggle.addEventListener('click', function (this: HTMLElement) {
            itensAtivos[item.id] = !itensAtivos[item.id]
            this.classList.toggle('ativo')
            this.querySelector('span')!.textContent = itensAtivos[item.id]
              ? '−'
              : '+'
            iniciarAnimacaoAnatomia(item.id, !itensAtivos[item.id])
          })
          divConteudo.appendChild(divToggle)
        })
        details.appendChild(divConteudo)
        containerDinamico.appendChild(details)
      })
    }

    /* ---------- reiniciar / download ---------- */
    const btnReiniciar = $('btnReiniciar')
    function onReiniciar() {
      imagemOriginal = null
      landmarks = null
      mascaraPeleCanvas = null
      mostrarLandmarks = false
      cacheImagemBorrada = null
      cacheBlurIntensidade = -1
      pincelMaskCanvas = null
      blurPeriocularAtivo = false
      moduloPeleAtivo = false
      mascaraAnalisePeleCanvas = null
      mascaraFrenteCanvas = null
      removerFundoAtivo = false
      escala = 1
      escalaVisual = 1
      deslocamentoX = 0
      deslocamentoY = 0

      Object.keys(medidasAtivas).forEach((k) => (medidasAtivas[k] = false))
      Object.keys(filtros).forEach(
        (k) => (filtros[k] = k === 'esfumado' ? 15 : 0),
      )
      Object.keys(itensAtivos).forEach((k) => {
        itensAtivos[k] = false
        progressoAnatomia[k] = 0
      })

      root.querySelectorAll<HTMLElement>('.btn-toggle-medida').forEach((btn) => {
        btn.classList.remove('ativo')
        const span = btn.querySelector('span')
        if (span) span.textContent = '+'
      })
      root
        .querySelectorAll<HTMLElement>('.controle-grupo[data-filtro]')
        .forEach((grupo) => {
          const tipoFiltro = grupo.getAttribute('data-filtro')!
          const valorPadrao = tipoFiltro === 'esfumado' ? 15 : 0
          grupo.querySelector<HTMLInputElement>('input[type="range"]')!.value =
            String(valorPadrao)
          grupo.querySelector<HTMLInputElement>('input[type="number"]')!.value =
            String(valorPadrao)
        })

      btnToggleLandmarks.classList.remove('ativo')
      btnToggleLandmarks.textContent = 'Mostrar Malha (Landmarks)'
      btnBlurFace.classList.remove('ativo')
      btnBlurFace.textContent = 'Ativar BlurFace (Olhos)'
      btnRemoverFundo.classList.remove('ativo')
      btnRemoverFundo.textContent = 'Remover Fundo'
      root
        .querySelectorAll('.btn-aval-pele')
        .forEach((b) => b.classList.remove('ativo'))

      canvas.style.display = 'none'
      $('painelFerramentas').style.display = 'none'
      $('overlayInicial').style.display = 'flex'
      $('overlayInicial').style.pointerEvents = 'auto'
      $('iconeOverlay').style.display = 'block'
      $('tituloOverlay').style.display = 'block'
      $('subtituloOverlay').style.display = 'block'
      $('spinnerCarregando').style.display = 'none'
      $('textoCarregando').style.display = 'none'

      btnPele.classList.add('desativado')
      btnPele.classList.remove('ativo')
      btnAnatomia.classList.add('desativado')
      btnAnatomia.classList.remove('ativo')
      btnBlurFace.classList.add('desativado')
      btnReiniciar.classList.add('desativado')
      $('btnDownload').classList.add('desativado')
      $('btnDownload').classList.remove('ativo-download')
      $('lblIniciar').classList.add('iniciar-ativo')
      $('lblIniciar').classList.remove('desativado')
      $('seccaoPele').style.display = 'none'
      $('seccaoAnatomia').style.display = 'none'
      inputImagem.value = ''
    }
    btnReiniciar.addEventListener('click', onReiniciar)

    const btnDownload = $('btnDownload')
    function onDownload() {
      if (!imagemOriginal) return
      const tempW = canvas.width
      const tempH = canvas.height
      const tempEscala = escala
      const tempX = deslocamentoX
      const tempY = deslocamentoY
      canvas.width = imagemOriginal.width
      canvas.height = imagemOriginal.height
      escala = 1
      deslocamentoX = 0
      deslocamentoY = 0
      escalaVisual = tempEscala
      renderizar()
      const link = document.createElement('a')
      link.download = 'visagemed_avaliacao.jpg'
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
      canvas.width = tempW
      canvas.height = tempH
      escala = tempEscala
      deslocamentoX = tempX
      deslocamentoY = tempY
      escalaVisual = escala
      renderizar()
    }
    btnDownload.addEventListener('click', onDownload)

    /* ---------- motor de renderização ---------- */
    function obterImagemBorrada() {
      if (!imagemOriginal) return null
      if (!cacheImagemBorrada || cacheBlurIntensidade !== BLUR_INTENSIDADE) {
        cacheImagemBorrada = document.createElement('canvas')
        cacheImagemBorrada.width = imagemOriginal.width
        cacheImagemBorrada.height = imagemOriginal.height
        const ctxCache = cacheImagemBorrada.getContext('2d')!
        ctxCache.filter = `blur(${BLUR_INTENSIDADE}px)`
        ctxCache.drawImage(imagemOriginal, 0, 0)
        cacheBlurIntensidade = BLUR_INTENSIDADE
      }
      return cacheImagemBorrada
    }

    function aplicarBlurPeriocular() {
      if (!blurPeriocularAtivo || !pincelMaskCanvas || !imagemOriginal) return
      const w = imagemOriginal.width
      const h = imagemOriginal.height
      if (!canvasTemporarioRender)
        canvasTemporarioRender = document.createElement('canvas')
      if (canvasTemporarioRender.width !== w) canvasTemporarioRender.width = w
      if (canvasTemporarioRender.height !== h) canvasTemporarioRender.height = h
      const oCtx = canvasTemporarioRender.getContext('2d')!
      oCtx.clearRect(0, 0, w, h)
      oCtx.globalCompositeOperation = 'source-over'
      oCtx.filter = `blur(${BLUR_SUAVIZACAO}px)`
      oCtx.drawImage(pincelMaskCanvas, 0, 0)
      oCtx.filter = 'none'
      oCtx.globalCompositeOperation = 'source-in'
      const borrada = obterImagemBorrada()
      if (borrada) oCtx.drawImage(borrada, 0, 0)
      oCtx.globalCompositeOperation = 'source-over'
      ctx.drawImage(canvasTemporarioRender, 0, 0)
    }

    function renderizar() {
      if (!imagemOriginal) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(deslocamentoX, deslocamentoY)
      ctx.scale(escala, escala)

      if (removerFundoAtivo && mascaraFrenteCanvas) {
        const offscreenRecorte = document.createElement('canvas')
        offscreenRecorte.width = imagemOriginal.width
        offscreenRecorte.height = imagemOriginal.height
        const ctxRecorte = offscreenRecorte.getContext('2d')!
        ctxRecorte.drawImage(imagemOriginal, 0, 0)
        ctxRecorte.globalCompositeOperation = 'destination-in'
        ctxRecorte.drawImage(mascaraFrenteCanvas, 0, 0)
        ctx.drawImage(offscreenRecorte, 0, 0)
      } else {
        ctx.drawImage(imagemOriginal, 0, 0)
      }

      const temFiltroAtivo =
        filtros.exposicao !== 0 ||
        filtros.contraste !== 0 ||
        filtros.saturacao !== 0 ||
        filtros.desfoque !== 0

      if (mascaraPeleCanvas && temFiltroAtivo) {
        const offscreen = document.createElement('canvas')
        offscreen.width = imagemOriginal.width
        offscreen.height = imagemOriginal.height
        const oCtx = offscreen.getContext('2d')!
        let filterStr = ''
        if (filtros.exposicao !== 0)
          filterStr += `brightness(${100 + filtros.exposicao}%) `
        if (filtros.contraste !== 0)
          filterStr += `contrast(${100 + filtros.contraste}%) `
        if (filtros.saturacao !== 0)
          filterStr += `saturate(${100 + filtros.saturacao}%) `
        if (filtros.desfoque > 0) filterStr += `blur(${filtros.desfoque}px) `
        oCtx.filter = filterStr.trim() || 'none'
        oCtx.drawImage(imagemOriginal, 0, 0)
        oCtx.filter = `blur(${filtros.esfumado}px)`
        oCtx.globalCompositeOperation = 'destination-in'
        oCtx.drawImage(mascaraPeleCanvas, 0, 0)
        ctx.drawImage(offscreen, 0, 0)
      }

      aplicarBlurPeriocular()

      if (mostrarLandmarks && landmarks) desenharLandmarks()
      if (medidasAtivas.tercos) desenharTercos()
      if (medidasAtivas.quintos) desenharQuintos()
      desenharItensAnatomicos()

      ctx.restore()
    }

    /* ---------- anatomia ---------- */
    function iniciarAnimacaoAnatomia(itemId: string, reverso = false) {
      let inicioVal = progressoAnatomia[itemId]
      if (inicioVal === undefined) inicioVal = reverso ? 1 : 0
      const targetVal = reverso ? 0 : 1
      if (inicioVal === targetVal) {
        if (reverso) renderizar()
        return
      }
      const diff = Math.abs(targetVal - inicioVal)
      const duracao = 600 * diff
      const inicioTempo = performance.now()
      function passo(agora: number) {
        let p = (agora - inicioTempo) / duracao
        if (p >= 1) p = 1
        progressoAnatomia[itemId] = inicioVal + (targetVal - inicioVal) * p
        renderizar()
        if (p < 1) animandoAnatomia[itemId] = requestAnimationFrame(passo)
        else delete animandoAnatomia[itemId]
      }
      if (animandoAnatomia[itemId]) cancelAnimationFrame(animandoAnatomia[itemId])
      animandoAnatomia[itemId] = requestAnimationFrame(passo)
    }

    function desenharItensAnatomicos() {
      if (!landmarks || !imagemOriginal) return
      const w = imagemOriginal.width
      const h = imagemOriginal.height
      const eX = landmarks[468].x * w
      const eY = landmarks[468].y * h
      const dX = landmarks[473].x * w
      const dY = landmarks[473].y * h
      const ipdPx = Math.hypot(eX - dX, eY - dY)
      const mmPorPx = 63 / ipdPx

      CATEGORIAS_ANATOMIA.forEach((categoria) => {
        categoria.itens.forEach((item) => {
          let p = progressoAnatomia[item.id]
          if (p === undefined) p = itensAtivos[item.id] ? 1 : 0
          if (itensAtivos[item.id] || p > 0) {
            const indices = item.indices
            const cor = item.color
            ctx.strokeStyle = cor
            ctx.fillStyle = cor
            ctx.lineWidth = 3 / escalaVisual
            ctx.shadowColor = cor
            ctx.shadowBlur = 8 / escalaVisual
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'

            let comprimentoTotal = 0
            const pts = indices.map((idx) => ({
              x: landmarks![idx].x * w,
              y: landmarks![idx].y * h,
            }))
            for (let i = 1; i < pts.length; i++) {
              comprimentoTotal += Math.hypot(
                pts[i].x - pts[i - 1].x,
                pts[i].y - pts[i - 1].y,
              )
            }
            const visivel = comprimentoTotal * p
            ctx.setLineDash([comprimentoTotal])
            ctx.lineDashOffset = comprimentoTotal - visivel
            ctx.beginPath()
            pts.forEach((pt, i) =>
              i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y),
            )
            ctx.stroke()
            ctx.setLineDash([])
            ctx.shadowBlur = 0

            if (indices.length === 2 && p >= 1) {
              const pt1 = landmarks![indices[0]]
              const pt2 = landmarks![indices[1]]
              const x1 = pt1.x * w
              const y1 = pt1.y * h
              const x2 = pt2.x * w
              const y2 = pt2.y * h
              const distPx = Math.hypot(x2 - x1, y2 - y1)
              const distMm = distPx * mmPorPx
              const midX = (x1 + x2) / 2
              const midY = (y1 + y2) / 2 - 10 / escalaVisual
              const fontSize = Math.max(11 / escalaVisual, 8)
              ctx.font = `${fontSize}px -apple-system, sans-serif`
              const texto = `${distMm.toFixed(1)} mm`
              const textWidth = ctx.measureText(texto).width
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
              ctx.fillRect(
                midX - textWidth / 2 - 4 / escalaVisual,
                midY - 8 / escalaVisual,
                textWidth + 8 / escalaVisual,
                16 / escalaVisual,
              )
              ctx.fillStyle = cor
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(texto, midX, midY)
            }
          }
        })
      })
    }

    function desenharLandmarks() {
      if (!landmarks || !imagemOriginal) return
      ctx.fillStyle = 'rgba(10, 132, 255, 0.6)'
      landmarks.forEach((ponto) => {
        ctx.beginPath()
        ctx.arc(
          ponto.x * imagemOriginal!.width,
          ponto.y * imagemOriginal!.height,
          2 / escalaVisual,
          0,
          Math.PI * 2,
        )
        ctx.fill()
      })
    }

    function desenharTercos() {
      let p = progressoAnatomia['tercos']
      if (p === undefined) p = medidasAtivas.tercos ? 1 : 0
      if (p <= 0 || !landmarks || !linhaCapilarY || !imagemOriginal) return
      const glabela = landmarks[9]
      const subnasal = landmarks[94]
      const mento = landmarks[152]
      const w = imagemOriginal.width
      const h = imagemOriginal.height
      const yCapilar = linhaCapilarY
      const linhasY = [yCapilar * h, glabela.y * h, subnasal.y * h, mento.y * h]
      const centroX = w / 2
      const larguraMax = w * 0.75
      const larguraAtual = larguraMax * p
      const xInicio = centroX - larguraAtual / 2
      const xFim = centroX + larguraAtual / 2
      ctx.strokeStyle = `rgba(250, 250, 255, ${p})`
      ctx.lineWidth = 2.5 / escalaVisual
      ctx.shadowColor = `rgba(0, 0, 0, ${p * 0.5})`
      ctx.shadowBlur = 6 / escalaVisual
      ctx.setLineDash([8 / escalaVisual, 6 / escalaVisual])
      linhasY.forEach((y) => {
        ctx.beginPath()
        ctx.moveTo(xInicio, y)
        ctx.lineTo(xFim, y)
        ctx.stroke()
      })
      ctx.setLineDash([])
      ctx.shadowBlur = 0
    }

    function desenharQuintos() {
      let p = progressoAnatomia['quintos']
      if (p === undefined) p = medidasAtivas.quintos ? 1 : 0
      if (p <= 0 || !landmarks || !linhaCapilarY || !imagemOriginal) return
      const w = imagemOriginal.width
      const h = imagemOriginal.height
      const pontosX = [
        landmarks[234].x * w,
        landmarks[33].x * w,
        landmarks[133].x * w,
        landmarks[362].x * w,
        landmarks[263].x * w,
        landmarks[454].x * w,
      ]
      const yCapilarPx = linhaCapilarY * h
      const yMentoPx = landmarks[152].y * h
      const alturaMax = yMentoPx - yCapilarPx
      const alturaAtual = alturaMax * p
      const centroY = yCapilarPx + alturaMax / 2
      const yInicio = centroY - alturaAtual / 2
      const yFim = centroY + alturaAtual / 2
      ctx.strokeStyle = `rgba(250, 250, 255, ${p})`
      ctx.lineWidth = 2.5 / escalaVisual
      ctx.shadowColor = `rgba(0, 0, 0, ${p * 0.5})`
      ctx.shadowBlur = 6 / escalaVisual
      ctx.setLineDash([8 / escalaVisual, 6 / escalaVisual])
      pontosX.forEach((x) => {
        ctx.beginPath()
        ctx.moveTo(x, yInicio)
        ctx.lineTo(x, yFim)
        ctx.stroke()
      })
      ctx.setLineDash([])
      ctx.shadowBlur = 0
    }

    /* ---------- drag & drop ---------- */
    const overlayInicial = $('overlayInicial')
    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      overlayInicial.style.borderColor = '#0A84FF'
      overlayInicial.style.backgroundColor = 'rgba(10, 132, 255, 0.2)'
    }
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault()
      overlayInicial.style.borderColor = ''
      overlayInicial.style.backgroundColor = ''
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      overlayInicial.style.borderColor = ''
      overlayInicial.style.backgroundColor = ''
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        inputImagem.files = e.dataTransfer.files
        inputImagem.dispatchEvent(new Event('change'))
      }
    }
    overlayInicial.addEventListener('dragover', onDragOver)
    overlayInicial.addEventListener('dragleave', onDragLeave)
    overlayInicial.addEventListener('drop', onDrop)

    /* ---------- cleanup ---------- */
    return () => {
      destroyed = true
      window.removeEventListener('resize', onResize)
      Object.values(animandoAnatomia).forEach((id) => cancelAnimationFrame(id))
      try {
        faceMesh?.close?.()
        imageSegmenter?.close?.()
      } catch {
        /* noop */
      }
    }
  }, [])

  return (
    <div ref={rootRef} className="vm-avaliacao">
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
        strategy="afterInteractive"
      />

      {/* Barra de ferramentas */}
      <div className="menu-ferramentas">
        <label htmlFor="uploadImagem" className="item-menu iniciar-ativo" id="lblIniciar">
          Iniciar
        </label>
        <input type="file" id="uploadImagem" accept="image/*" />
        <div className="item-menu desativado" id="btnPele">
          Imagem
        </div>
        <div className="item-menu desativado" id="btnAvaliacaoPele">
          Pele
        </div>
        <div className="item-menu desativado" id="btnAnatomia">
          Anatomia
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

      <div className="container-principal">
        <div className="painel-ferramentas" id="painelFerramentas" style={{ display: 'none' }}>
          <div id="seccaoPele" style={{ display: 'none' }}>
            <button className="btn-global desativado" id="btnBlurFace">
              Ativar BlurFace (Olhos)
            </button>

            <details>
              <summary>Ajuste da Mascara (IA)</summary>
              <div className="conteudo-seccao">
                <div className="controle-grupo" data-filtro="esfumado">
                  <div className="controle-cabecalho">
                    <span>Suavizacao das Bordas</span>
                  </div>
                  <div className="controles-interativos">
                    <input type="range" min="0" max="50" defaultValue="15" />
                    <input type="number" min="0" max="50" defaultValue="15" />
                    <button className="btn-reset">↺</button>
                  </div>
                </div>
              </div>
            </details>

            <details>
              <summary>Luz e Tonalidade (Apenas Pele)</summary>
              <div className="conteudo-seccao">
                <div className="controle-grupo" data-filtro="exposicao">
                  <div className="controle-cabecalho">
                    <span>Exposicao</span>
                  </div>
                  <div className="controles-interativos">
                    <input type="range" min="-100" max="100" defaultValue="0" />
                    <input type="number" min="-100" max="100" defaultValue="0" />
                    <button className="btn-reset">↺</button>
                  </div>
                </div>
                <div className="controle-grupo" data-filtro="contraste">
                  <div className="controle-cabecalho">
                    <span>Contraste</span>
                  </div>
                  <div className="controles-interativos">
                    <input type="range" min="-100" max="100" defaultValue="0" />
                    <input type="number" min="-100" max="100" defaultValue="0" />
                    <button className="btn-reset">↺</button>
                  </div>
                </div>
              </div>
            </details>

            <details>
              <summary>Cor e Textura</summary>
              <div className="conteudo-seccao">
                <div className="controle-grupo" data-filtro="saturacao">
                  <div className="controle-cabecalho">
                    <span>Saturacao</span>
                  </div>
                  <div className="controles-interativos">
                    <input type="range" min="-100" max="100" defaultValue="0" />
                    <input type="number" min="-100" max="100" defaultValue="0" />
                    <button className="btn-reset">↺</button>
                  </div>
                </div>
                <div className="controle-grupo" data-filtro="desfoque">
                  <div className="controle-cabecalho">
                    <span>Desfoque da Pele</span>
                  </div>
                  <div className="controles-interativos">
                    <input type="range" min="0" max="100" defaultValue="0" />
                    <input type="number" min="0" max="100" defaultValue="0" />
                    <button className="btn-reset">↺</button>
                  </div>
                </div>
              </div>
            </details>

            <details>
              <summary>Plano de Fundo</summary>
              <div className="conteudo-seccao">
                <button
                  className="btn-global"
                  id="btnRemoverFundo"
                  style={{ margin: 0, width: '100%' }}
                >
                  Remover Fundo
                </button>
              </div>
            </details>
          </div>

          <div id="seccaoAvaliacaoPele" style={{ display: 'none' }}>
            <div className="conteudo-seccao" style={{ paddingTop: 15 }}>
              <button
                className="btn-global btn-aval-pele"
                id="btnManchas"
                style={{ margin: '0 0 10px 0', width: '100%' }}
              >
                Manchas
              </button>
              <button
                className="btn-global btn-aval-pele"
                id="btnInflamacao"
                style={{ margin: '0 0 10px 0', width: '100%' }}
              >
                Inflamação
              </button>
              <button
                className="btn-global btn-aval-pele"
                id="btnPoros"
                style={{ margin: '0 0 10px 0', width: '100%' }}
              >
                Poros
              </button>
              <button
                className="btn-global btn-aval-pele"
                id="btnRugas"
                style={{ margin: '0 0 10px 0', width: '100%' }}
              >
                Rugas
              </button>
              <button
                className="btn-global btn-aval-pele"
                id="btnTextura"
                style={{ margin: 0, width: '100%' }}
              >
                Textura
              </button>
            </div>
          </div>

          <div id="seccaoAnatomia" style={{ display: 'none' }}>
            <button className="btn-global" id="btnToggleLandmarks">
              Mostrar Malha (Landmarks)
            </button>
            <div id="containerAnatomiaDinamica" />
            <details>
              <summary>Proporções Faciais Globais</summary>
              <div className="conteudo-seccao" style={{ gap: 8 }}>
                <div className="btn-toggle-medida" id="tgTercos">
                  Regra dos Terços Faciais <span>+</span>
                </div>
                <div className="btn-toggle-medida" id="tgQuintos">
                  Regra dos Quintos Faciais <span>+</span>
                </div>
              </div>
            </details>
          </div>
        </div>

        <div className="area-trabalho" id="containerCanvas">
          {/* biome-ignore lint/a11y/noLabelWithoutControl: associado via htmlFor ao input de upload */}
          <label className="estado-inicial" id="overlayInicial" htmlFor="uploadImagem">
            <svg
              className="icone-imagem"
              id="iconeOverlay"
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
            <div
              id="tituloOverlay"
              style={{ fontWeight: 600, fontSize: '1.2em', color: '#ffffff' }}
            >
              Pronto para Editar
            </div>
            <div
              id="subtituloOverlay"
              style={{ fontSize: '0.9em', color: '#a1a1a6', marginTop: 8 }}
            >
              Clique aqui ou arraste uma foto
            </div>
            <div className="carregando" id="spinnerCarregando" />
            <div className="texto-carregando" id="textoCarregando">
              Carregando IA...
              <br />
              <span style={{ fontSize: '0.8em', fontWeight: 'normal' }}>
                (Pode demorar uns segundos na 1a vez)
              </span>
            </div>
          </label>

          <canvas ref={canvasRef} id="telaEdicao" style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  )
}
