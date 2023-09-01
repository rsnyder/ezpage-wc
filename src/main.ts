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
console.log(window.config)

defineCustomElements()

structureContent()

let isJunctureV1 = Array.from(document.querySelectorAll('param'))
	.find(param =>
    Array.from(param.attributes).find(attr => attr.name.indexOf('ve-') === 0)
  ) !== undefined
console.log(`isJunctureV1=${isJunctureV1}`)

if (isJunctureV1) {
  
  let main = document.querySelector('main')
  if (main) {
    let tmp = new DOMParser().parseFromString(main.innerHTML, 'text/html').children[0].children[1]
    Array.from(tmp.querySelectorAll('[data-id]'))
      .forEach(seg => {
        let id = seg.getAttribute('data-id') || ''
        let wrapper = document.createElement('div')
        wrapper.setAttribute('data-id', id)
        wrapper.id = id
        wrapper.className = seg.className
        seg.removeAttribute('id')
        seg.removeAttribute('data-id')
        seg.className = ''
        wrapper.appendChild(seg.cloneNode(true))
        while (seg.nextSibling) {
          let sib = seg.nextSibling
          if (sib.nodeName !== 'PARAM') break
          wrapper.appendChild(sib)
        }
        seg.replaceWith(wrapper)
      })
    let html = tmp.innerHTML

    while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
    main = document.createElement('div')
    main.id = 'vue'
    main.innerHTML = `<juncture-v1 :input-html="html"></juncture-v1>`
    document.body.appendChild(main)
  
    window.Vue.directive('highlightjs', {
      deep: true,
      bind: function(el:HTMLElement, binding:any) {
        let targets = el.querySelectorAll('code')
        targets.forEach((target) => {
          if (binding.value) {
            target.textContent = binding.value
          }
          window.hljs.highlightBlock(target)
        })
      },
      componentUpdated: function(el:HTMLElement, binding:any) {
        let targets = el.querySelectorAll('code')
        targets.forEach((target) => {
          if (binding.value) {
            target.textContent = binding.value
            window.hljs.highlightBlock(target)
          }
        })
      }
    })
    new window.Vue({
      el: '#vue',
      components: {
        'juncture-v1': window.httpVueLoader(`${window.config.baseurl}juncture-components/JunctureV1.vue`)
      },
      data: () => ({ html })
    })
  }

}