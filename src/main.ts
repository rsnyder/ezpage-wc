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

import { md2html, structureContent } from './utils'
export { md2html }
let window = (globalThis as any).window
window.md2html = md2html

// @ts-ignore
console.log(`ezpage-wc: version=${process.env.version}`)

defineCustomElements()

structureContent()
