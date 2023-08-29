import { marked } from 'marked'

marked.use({
  walkTokens(token: any) {
    const { type, raw } = token
    if (type === 'paragraph' && (raw.startsWith('.ez-'))) {
      token.type = 'code'
      token.lang = 'juncture'
    }
  },
  renderer: {
    paragraph(paraText) {

      if (paraText.startsWith('<img')) return imgHandler(paraText)

      let fnRefs = Array.from(paraText.matchAll(/(\[\^(\w+)\])[^:]/g))        // footnote references
      let markedText = Array.from(paraText.matchAll(/==(.+?)==\{([^\}]+)/g))  // marked text
      if (fnRefs.length || markedText.length) {
        paraText = footnoteReferencesHandler(paraText)
        paraText = markedTextHandler(paraText)
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
  Array.from(paraText.matchAll(/(\[\^(\w+)\])[^:]/g)).forEach(match => {
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
  console.log(img.src, attrs)
  return `<ez-image src="${img.src}" ${asAttrs(attrs)}></ez-image>`
}

function parseHeadline(s:string) {
  let tokens:string[] = []
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
  let tokens:string[] = []
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

export async function getHtml() {
  
  console.log(window.location)
  let isGhp = /\.github\.io$/.test(location.hostname) // GitHub Pages
  
  let path = location.pathname.split('/').filter(p => p)
  let branch = 'main'
  let owner: string = '', 
      repo: string = '', 
      resp: Response

  if (isGhp) {
    owner = location.hostname.split('.')[0]
    repo = path[0]
    path = path.slice(1)
    let base = document.createElement('base')
    base.href = `/${repo}/`
    document.head.append(base)
  } else {
    resp = await fetch('/config.yaml')
    if (resp.ok) {
      let rawText = await resp.text()
      if (rawText.indexOf('<!DOCTYPE html>') < 0) {
        let config = (await resp.text()).split('\n').map(l => l.split(':')).reduce((acc:any, [k, v]) => {
          acc[k.trim()] = v.trim()
          return acc
        }, {})
        owner = config.owner
        repo = config.repo
      }
    }
  }
  if (path.length === 0) path = ['README.md']
  console.log(`isGhp=${isGhp} owner=${owner} repo=${repo} branch=${branch} path=${path}`)

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
    let el = new DOMParser().parseFromString(md2html(markdown), 'text/html').children[0].children[1]
    // Fix relative links for GHP
    el.querySelectorAll('a').forEach(link => {
      let href = new URL(link.href)
      if (isGhp && href.origin === location.origin && href.pathname.indexOf(`/${repo}/`) !== 0) link.href = `/${repo}${href.pathname}`
    })
    return el.innerHTML
  }
}