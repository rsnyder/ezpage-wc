<script setup lang="ts">

  import { computed, nextTick, onMounted, ref, toRaw, watch } from 'vue'
  import OpenSeadragon, { TiledImage } from 'openseadragon'

  type ImageSize = {
    width: number,
    height: number
  }

  const root = ref<HTMLElement | null>(null)
  const osdEl = ref<HTMLElement | null>(null)
  // const host = computed(() => (root.value?.getRootNode() as any)?.host)
  // const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)

  const osdWidth = ref<number>()
  watch(osdWidth, () => { resize() })

  const imageSize = ref<ImageSize>()
  const aspectRatio = computed(() =>  Number(((imageSize.value?.width || 1)/(imageSize.value?.height || 1)).toFixed(4)) )
  watch(aspectRatio, () => { resize() })

  // TODO: debounce size updates
  watch(osdEl, () => { 
    if (osdEl.value)
      new ResizeObserver(() => { osdWidth.value = osdEl.value?.clientWidth }).observe(osdEl.value)
  })

  const props = defineProps({
    src: { type: String, required: true },
    fit: { type: String, default: 'contain' }
  })
  watch(props, () => { src.value = props.src })
  
  const osd = ref<OpenSeadragon.Viewer>()
  const tileSource:any = ref<TiledImage>()
  watch(tileSource, () => { osd.value?.open(tileSource.value) })

  // watch(osd, () => { console.log(toRaw(osd.value)) })

  const src = ref(props.src)
  watch(src, () => { getTileSource(src.value) })

  onMounted(() => { 
    osd.value = initOpenSeadragon()
    getTileSource(src.value)
  })

  async function getTileSource(src:string) {
    getImageSize(src).then((size) => { imageSize.value = size })
    tileSource.value = { url: src, type: 'image', buildPyramid: true }
  }

  async function getManifest(src:any) {
    console.log(`getManifest(${src})`)
  }

  async function getImageSize(src: string): Promise<ImageSize> {
    return new Promise((resolve, reject) => {
      let img = new Image()
      img.onload = () => resolve({ width:img.width, height:img.height })
      img.onerror = () => reject()
      img.src = src
    })
  }

  function resize() {
    if (osdWidth.value === undefined) return
    let osdHeight = osdWidth.value / aspectRatio.value
    // console.log(`resize() width: ${osdWidth.value} height: ${osdHeight}`)
    osdEl.value?.setAttribute('style', `height: ${osdHeight}px;`)
    setTimeout(() => osd.value?.viewport?.goHome(true), 10)
  }

  function initOpenSeadragon() {
    let shadowRoot: any = root.value?.parentNode
    let container = shadowRoot.querySelector('#osd')
    const osdOptions: OpenSeadragon.Options = {
      element: container,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      homeFillsViewer: props.fit === 'cover',
      showNavigationControl: true,
      minZoomImageRatio: 1,
      maxZoomPixelRatio: 10,
      showRotationControl: true,
      showHomeControl: true,
      showZoomControl: true,
      showFullPageControl: true,
      showNavigator: false,
      sequenceMode: true,
      showReferenceStrip: true,
      
      animationTime: 0.5,
      springStiffness: 10,
      
      visibilityRatio: 1.0,
      constrainDuringPan: true
      
    }
    return OpenSeadragon(osdOptions)
  }

</script>

<template>

<div ref="root" class="h-auto w-1/2 float-right rounded overflow-hidden shadow-lg ml-4">
  <!-- <img class="w-full" :src="src" alt="Image title"> -->
  <div ref="osdEl" id="osd" class="w-full h-96"></div>
  <div class="px-6 py-4">
    <div class="font-bold text-xl mb-2">Image title</div>
  </div>
</div>

</template>

<style>
  @import '../tailwind.css';
</style>
