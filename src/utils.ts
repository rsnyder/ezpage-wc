import { marked } from 'marked'

marked.use({
  walkTokens(token: any) {
    const { type, raw } = token
    /*
    if (type === 'paragraph' && (raw.startsWith('.ez-'))) {
      token.type = 'code'
      token.lang = 'juncture'
    }
    */
  },
  renderer: {
    paragraph(paraText) {

      // if (paraText.startsWith('<img')) return imgHandler(paraText)

      let fnRefs = Array.from(paraText.matchAll(/(\[\^(\w+)\])([^:]|\s|$)/g))        // footnote references
      let markedText = Array.from(paraText.matchAll(/==(.+?)==\{([^\}]+)/g))  // marked text
      if (fnRefs.length || markedText.length) {
        paraText = footnoteReferencesHandler(paraText)
        // paraText = markedTextHandler(paraText)
        return `<p>${paraText}</p>`
      }

      let fns = Array.from(paraText.matchAll(/(\[\^(\w+)\]:)/g))              // footnotes
      if (fns.length) {
        return `<ol style="margin-left:-1rem;">${footnotesHandler(paraText)}</ol>`
      }
      
      return false // Use default renderer
    
    },
    code(code, language) {
      if (language === 'juncture') {
        let lines = code.trim().split('\n')
        let headLine = lines[0]
        let tag = headLine.match(/\.ez-[^\W]+/)?.[0].slice(1)
        let attrs = asAttrs(parseHeadline(headLine))
        let slot = lines.length > 1 ? marked.parse(lines.slice(1).map(l => l.replace(/^    /,'')).join('\n')) : ''
        let elemHtml = `<${tag} ${attrs}>\n${slot}</${tag}>`
        return elemHtml
      }
      return false // Use default code renderer.
    }

  }
})

export function ezComponentHtml(el:HTMLElement) {
  let lines = el.textContent?.trim().split('\n') || []
  if (lines.length === 0) return ''
  let headLine = lines[0]
  let tag = headLine.match(/\.ez-[^\W]+/)?.[0].slice(1)
  let attrs = asAttrs(parseHeadline(headLine))
  let slot = lines.length > 1 ? marked.parse(lines.slice(1).map(l => l.replace(/^    /,'')).join('\n')) : ''
  let elemHtml = `<${tag} ${attrs}>\n${slot}</${tag}>`
  return elemHtml
}

function markedTextHandler(paraText: string) {
  let markedText = paraText.matchAll(/==(.+?)==\{([^\}]+)/g)
  let segments:string[] = []
  let start = 0
  for (const match of markedText) {
    segments.push(paraText.slice(start, match.index))
    let [all, text, attrStr] = match
    let attrs = parseAttrsStr(attrStr)
    let tag = attrs.qid ? 'ez-entity-infobox' : 'ez-trigger'
    segments.push(`<${tag} ${asAttrs(attrs)}>${text}</${tag}>`)
    start = (match.index || 0) + all.length + 1
  }
  segments.push(paraText.slice(start))
  return segments.join('')
}

function footnoteReferencesHandler(paraText:string) { // TODO - Handle multiple references to the same footnote
  let segments:string[] = []
  let start = 0
  Array.from(paraText.matchAll(/(\[\^(\w+)\])([^:]|\s|$)/g)).forEach(match => {
    segments.push(paraText.slice(start, match.index))
    let [all, group, fnRef] = match
    segments.push(`<sup><a id="fnRef-${fnRef}" href="#fn-${fnRef}" style="font-weight:bold;padding:0 3px;">${fnRef}</a></sup>`)
    start = (match.index || 0) + group.length
  })
  segments.push(paraText.slice(start))
  return segments.join('')
}

function footnotesHandler(paraText:string) { // TODO - Handle multiple references to the same footnote
  let footnotes:string[] = []
  let start = 0
  let backLink:string = ''
  Array.from(paraText.matchAll(/(\[\^(\w+)\]:)/g)).forEach(match => {
    if (backLink) footnotes.push(paraText.slice(start, match.index).trim() + backLink)
    let [all, _, fnRef] = match
    backLink = `<a id="fn-${fnRef}" href="#fnRef-${fnRef}" title="Jump back to footnote ${fnRef} in the text" style="margin-left:6px;text-decoration:none;">↩</a>`
    start = (match.index || 0) + all.length + 1
  })
  footnotes.push(paraText.slice(start).trim() + backLink)
  return `<li>${footnotes.join('</li><li>')}</li>`
}

function imgHandler(paraText:string) {
  let match = paraText.match(/(<img.+>)\s*{?([^\}]+)?/) || []
  let [_, imgStr, attrStr] = match
  let img:any = new DOMParser().parseFromString(imgStr, 'text/html').children[0].children[1].children[0]
  let attrs = parseAttrsStr(attrStr)
  if (!attrs.full && !attrs.right) attrs.left = 'true'
  return `<ez-image src="${img.src}" ${asAttrs(attrs)}></ez-image>`
}

function parseHeadline(s:string) {
  let tokens:string[] = []
  s = s.replace(/”/g,'"').replace(/”/g,'"').replace(/’/g,"'")
  s?.match(/[^\s"]+|"([^"]*)"/gmi)?.forEach((token:string) => {
    if (tokens.length > 0 && tokens[tokens.length-1].indexOf('=') === tokens[tokens.length-1].length-1) tokens[tokens.length-1] = `${tokens[tokens.length-1]}${token}`
    else tokens.push(token)
  })
  return Object.fromEntries(tokens.slice(1).map(token => {
    if (token.indexOf('=') > 0) {
      let [key, value] = token.split('=')
      return [key, value[0] === '"' && value[value.length-1] === '"' ? value.slice(1, -1) : value]
    } else return [token, "true"]
  }))
}

function asAttrs(obj:any) {
  return Object.entries(obj).map(([k, v]) => v === 'true' ? k : `${k}="${v}"`).join(' ')
}

function isQid(s:string) { return /^Q\d+$/.test(s) }
function isCoords(s:string) { return /^[+-]?\d+(.\d*|\d*),{1}[+-]?\d+(.\d*|\d*)$/.test(s) }

function parseAttrsStr(s: string): any {
  if (!s) return {}
  let tokens:string[] = []
  s = s.replace(/“/g,'"').replace(/”/g,'"').replace(/’/g,"'")
  s?.match(/[^\s"]+|"([^"]*)"/gmi)?.forEach(token => {
    if (tokens.length > 0 && tokens[tokens.length-1].indexOf('=') === tokens[tokens.length-1].length-1) tokens[tokens.length-1] = `${tokens[tokens.length-1]}${token}`
    else tokens.push(token)
  })
  let obj:any = {}
  let classes = new Set()
  tokens.forEach(token => {
    if (token[0] === '#') obj.id = token.slice(1)
    else if (token[0] === '.') classes.add(token.slice(1))
    else if (token.indexOf('=') > 0) {
      let [key, value] = token.split('=')
      if (key === 'class') value.split(',').forEach(c => classes.add(c))
      else obj[key] = value[0] === '"' && value[value.length-1] === '"' ? value.slice(1, -1) : value
    }
    else if (isQid(token)) obj.qid = token
    else if (isCoords(token)) obj.zoomto = token
    else obj[token] = "true"
  })
  if (classes.size > 0) obj.class = Array.from(classes).join(' ')
  return obj
}

export function setMeta(html:string) {
  let el = new DOMParser().parseFromString(html, 'text/html').children[0].children[1]
  let meta = el.querySelector('ez-meta')
  let header = el.querySelector('ez-header')
  let firstHeading = el.querySelector('h1, h2',)
  let firstParagraph = el.querySelector('p')

  let title = meta?.getAttribute('title')
    ? meta.getAttribute('title')
    : header?.getAttribute('title')
      ? header.getAttribute('title')
      : firstHeading
        ? firstHeading.textContent
        : ''

  let description =  meta?.getAttribute('description')
    ? meta.getAttribute('description')
    : firstParagraph
      ? firstParagraph.textContent
      : ''

  let robots =  meta?.getAttribute('robots') || ''

  if (title) document.title = title
  if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  if (robots) {
    let robotsMeta = document.createElement('meta')
    robotsMeta.setAttribute('name', 'robots')
    robotsMeta.setAttribute('content', robots)
    document.head.appendChild(robotsMeta)
  }
  if (meta) meta.remove()
}

export function md2html(markdown: string) {
  return marked.parse(markdown)
}

export function isGHP() {
  return /\.github\.io$/.test(location.hostname)
}

async function getHeaderHtml() {
  let resp = await fetch('/_includes/header.html')
  if (resp.ok) return await resp.text()
}

async function getFooterHtml() {
  let resp = await fetch('/_includes/footer.html')
  if (resp.ok) return await resp.text()
}

let _config: any = (window as any).config
export async function getConfig(): Promise<any> {
  if (_config) return _config
  _config = {}
  let resp = await fetch('_config.yml')
  if (resp.ok) {
    let rawText = await resp.text()
    if (rawText.indexOf('<!DOCTYPE html>') < 0) {
      _config = rawText.split('\n').map(l => l.split(':')).reduce((acc:any, [k, v]) => {
        acc[k.trim()] = v.trim()
        return acc
      }, {})
    }
  }
  return _config
}

export async function getHtml() {
  
  // console.log(window.location)
  
  let path = location.pathname.split('/').filter(p => p)
  let branch = 'main'
  let owner: string = '', 
      repo: string = '', 
      resp: Response

  let config = await getConfig()
  owner = config.owner
  repo = config.repo

  if (path.length === 0) path = ['README.md']
  console.log(`owner=${owner} repo=${repo} branch=${branch} path=${path}`)

  let contentUrl = location.hostname === 'localhost'
    ? `${location.origin}/${path}`
    : `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`

  let rawText, markdown
  resp = await fetch(contentUrl)
  if (resp.ok) {
    let rawText = await resp.text()
    if (rawText.indexOf('<!DOCTYPE html>') < 0) markdown = rawText
  } 
  if (!markdown && !/\.md$/.test(contentUrl)) {
    contentUrl += '.md'
    resp = await fetch(contentUrl)
    if (resp.ok) {
      rawText = await resp.text()
      if (rawText.indexOf('<!DOCTYPE html>') < 0) markdown = rawText
    }
    if (!markdown) {
      contentUrl = contentUrl.replace(/\.md$/, '/README.md')
      resp = await fetch(contentUrl)
      if (resp.ok) {
        rawText = await resp.text()
        if (rawText.indexOf('<!DOCTYPE html>') < 0) markdown = rawText
      }      
    }
  }
  if (markdown) {
    let headerHtml = (await getHeaderHtml() || '').replace(/\{\{\s*site\.baseurl\s*\}\}/g, '/')
    let footerHtml = await getFooterHtml() || ''
    let el:HTMLElement = new DOMParser().parseFromString(md2html(markdown), 'text/html').children[0].children[1] as HTMLElement
    let html = `
      ${headerHtml}
      <main class="page-content" aria-label="Content">${el.innerHTML}</main>
      ${footerHtml}
    `
    return html
  }
}

export async function convertToEzElements(el:HTMLElement) {
  let isGhp = isGHP()
  let config = await getConfig()
  el.querySelectorAll('a').forEach(anchorElem => {
    let link = new URL(anchorElem.href)
    let qargs = new URLSearchParams(link.search)
    if (qargs.get('zoom')) anchorElem.setAttribute('rel', 'nofollow')
    if (isGhp && link.origin === location.origin && link.pathname.indexOf(`/${config.repo}/`) !== 0) anchorElem.href = `/${config.repo}${link.pathname}`
  })

  Array.from(el.querySelectorAll('img'))
    .forEach((img: HTMLImageElement) => {
      let ezImage = document.createElement('ez-image')
      ezImage.setAttribute('src', img.src)
      ezImage.setAttribute('alt', img.alt)
      ezImage.setAttribute('left', '');
      (img.parentNode as HTMLElement).replaceWith(ezImage)
    })

  Array.from(el.querySelectorAll('p'))
    .filter((p: HTMLParagraphElement) => /^\.ez-/.test(p.textContent || ''))
    .forEach((p: HTMLParagraphElement) => {
      let ezComponent = new DOMParser().parseFromString(ezComponentHtml(p), 'text/html').children[0].children[1].children[0]
      p.parentNode?.replaceChild(ezComponent, p)
    })
}

function isNumeric(arg:any) { return !isNaN(arg) }

export function structureContent() {
  let main = document.querySelector('main')
  let restructured = document.createElement('main')
  let currentSection: HTMLElement = restructured
  let segments:HTMLElement[] = []
  let segment: HTMLElement | null

  (Array.from(main?.children || []) as HTMLElement[]).forEach((el:HTMLElement) => {
    if (el.tagName[0] === 'H' && isNumeric(el.tagName.slice(1))) {
      let heading = el as HTMLHeadingElement
      let sectionLevel = parseInt(heading.tagName.slice(1))
      if (segments) {
        segments.forEach(segment => currentSection.innerHTML += segment.outerHTML)
        segments = []
        segment = null
      }
      currentSection = document.createElement('section')
      currentSection.classList.add(`section-${sectionLevel}`)
      if (heading.id) {
        currentSection.id = heading.id
        heading.removeAttribute('id')
      }
      if (!heading.innerHTML) heading.style.display = 'none'
      currentSection.innerHTML += heading.outerHTML

      let headings = [...restructured.querySelectorAll(`H${sectionLevel-1}`)]
      let parent = sectionLevel === 1 || headings.length === 0 ? restructured : headings.pop()?.parentElement as HTMLElement
      parent?.appendChild(currentSection)
    } else {
      if (segment) {
        segment.innerHTML += el.outerHTML
      } else {
        currentSection.innerHTML += el.outerHTML
      }
    }
  })
  if (segments) {
    segments.forEach(segment => currentSection.innerHTML += segment.outerHTML)
    segments = []
  }

  convertToEzElements(restructured)
  main?.replaceWith(restructured)

  return main

}