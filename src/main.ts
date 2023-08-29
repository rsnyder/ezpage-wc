// import './tailwind.css'
import { defineCustomElement } from 'vue'
import ('preline')

import Accordion from './components/Accordion.ce.vue'
import Collapse from './components/Collapse.ce.vue'
import EntityInfobox from './components/EntityInfobox.ce.vue'
import Header from './components/Header.ce.vue'
import Image from './components/Image.ce.vue'
import Menu from './components/Menu.ce.vue'
import Meta from './components/Meta.ce.vue'
import Modal from './components/Modal.ce.vue'
import Trigger from './components/Trigger.ce.vue'

// console.log(`juncture.web-components: version=${process.env.version}`)

function defineCustomElements() {
	customElements.define('ez-accordion', defineCustomElement(Accordion))
	customElements.define('ez-collapse', defineCustomElement(Collapse))
	customElements.define('ez-entity-infobox', defineCustomElement(EntityInfobox))
	customElements.define('ez-header', defineCustomElement(Header))
	customElements.define('ez-image', defineCustomElement(Image))
	customElements.define('ez-menu', defineCustomElement(Menu))
	customElements.define('ez-meta', defineCustomElement(Meta))
	customElements.define('ez-modal', defineCustomElement(Modal))
	customElements.define('ez-trigger', defineCustomElement(Trigger))
};

// @ts-ignore
console.log(`ezpage-wc: version=${process.env.version}`)

import { ezComponentHtml, getHtml, md2html, setMeta } from './utils'
export { getHtml, md2html, setMeta }
let window = (globalThis as any).window
window.md2html = md2html
window.getHtml = getHtml
window.setMeta = setMeta

defineCustomElements()

Array.from(document.body.querySelectorAll('img'))
	.forEach((img: HTMLImageElement) => {
		let ezImage = document.createElement('ez-image')
		ezImage.setAttribute('src', img.src)
		ezImage.setAttribute('alt', img.alt)
		ezImage.setAttribute('left', '')
		img.parentNode?.replaceChild(ezImage, img)
	})

Array.from(document.body.querySelectorAll('p'))
	.filter((p: HTMLParagraphElement) => /^\.ez-/.test(p.textContent || ''))
	.forEach((p: HTMLParagraphElement) => {
		let ezComponent = new DOMParser().parseFromString(ezComponentHtml(p), 'text/html').children[0].children[1].children[0]
		p.parentNode?.replaceChild(ezComponent, p)
	})
