<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'

  const root = ref<HTMLElement | null>(null)
  // const host = computed(() => (root.value?.getRootNode() as any)?.host)
  // const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)

  const props = defineProps({
    src: { type: String }
  })
  watch(props, () => { src.value = props.src })
  
  const src = ref(props.src)
  watch(src, () => { getManifest(src.value) })

  onMounted(() => { getManifest(src.value) })

  async function getManifest(src:any) {
    console.log(`getManifest(${src})`)
  }

</script>

<template>

<!--
<div ref="root" class="images-wrapper">
  <img class="h-auto w-1/2 float-right" :src="src" alt="image description">
</div>
-->

<div ref="root" class="h-auto w-1/2 float-right rounded overflow-hidden shadow-lg ml-4">
  <img class="w-full" :src="src" alt="Image title">
  <div class="px-6 py-4">
    <div class="font-bold text-xl mb-2">Image title</div>
  </div>
</div>

</template>

<style>
  @import '../tailwind.css';
</style>
