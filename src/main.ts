// import './tailwind.css'
import { defineCustomElement } from 'vue'
import ('preline')

import Accordion from './components/Accordion.ce.vue'
import Collapse from './components/Collapse.ce.vue'
import EntityInfobox from './components/EntityInfobox.ce.vue'
import Header from './components/Header.ce.vue'
import Menu from './components/Menu.ce.vue'
import Modal from './components/Modal.ce.vue'
import Trigger from './components/Trigger.ce.vue'

// console.log(`juncture.web-components: version=${process.env.version}`)

function init() {
	customElements.define('twp-accordion', defineCustomElement(Accordion))
	customElements.define('twp-collapse', defineCustomElement(Collapse))
	customElements.define('ve-entity-infobox', defineCustomElement(EntityInfobox))
	customElements.define('twp-header', defineCustomElement(Header))
	customElements.define('twp-menu', defineCustomElement(Menu))
	customElements.define('twp-modal', defineCustomElement(Modal))
	customElements.define('ve-trigger', defineCustomElement(Trigger))
};


// @ts-ignore
console.log(`tailwind-preline: version=${process.env.version}`)

import { getHtml, md2html } from './utils'
export { getHtml, md2html }
let window = (globalThis as any).window
window.md2html = md2html
window.getHtml = getHtml

init()
