import { isHeicFile } from './imageCompressionService.js'

/**
 * Génère un élément de preview pour un fichier image ou PDF
 * @param {File} file
 * @returns {Promise<HTMLElement>} Un élément HTML prêt à être inséré dans le DOM
 */
export async function createPreviewElement(file) {
  let previewEl
  // Gestion HEIC
  const isHeic = isHeicFile(file)
  if (file.type.startsWith('image/') && !isHeic) {
    previewEl = document.createElement('div')
    previewEl.style.display = 'inline-block'
    previewEl.style.position = 'relative'
    previewEl.style.margin = '10px'
    const img = document.createElement('img')
    img.src = URL.createObjectURL(file)
    img.style.maxWidth = '150px'
    img.style.borderRadius = '10px'
    img.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)'
    previewEl.appendChild(img)
  } else if (isHeic) {
    previewEl = document.createElement('div')
    previewEl.style.display = 'inline-block'
    previewEl.style.position = 'relative'
    previewEl.style.margin = '10px'
    // Ajout spinner
    const spinner = document.createElement('div')
    spinner.className = 'heic-spinner'
    spinner.style.position = 'absolute'
    spinner.style.top = '50%'
    spinner.style.left = '50%'
    spinner.style.transform = 'translate(-50%, -50%)'
    spinner.style.width = '32px'
    spinner.style.height = '32px'
    spinner.style.border = '4px solid #e5e7eb'
    spinner.style.borderTop = '4px solid #22c55e'
    spinner.style.borderRadius = '50%'
    spinner.style.animation = 'heic-spin 1s linear infinite'
    const img = document.createElement('img')
    img.style.maxWidth = '150px'
    img.style.borderRadius = '10px'
    img.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)'
    previewEl.appendChild(img)
    previewEl.appendChild(spinner)
    // Conversion asynchrone
    ;(async () => {
      try {
        // Import dynamique : libheif pèse près d'un Mo et ne concerne que les
        // visiteurs qui déposent une photo iPhone.
        const { default: heic2any } = await import('heic2any')
        const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 })
        img.src = URL.createObjectURL(convertedBlob)
      } catch {
        img.src =
          'data:image/svg+xml;utf8,<svg width="150" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="100" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="16">HEIC</text></svg>'
      } finally {
        spinner.remove()
      }
    })()
  } else if (file.type === 'application/pdf') {
    previewEl = document.createElement('div')
    previewEl.style.display = 'flex'
    previewEl.style.alignItems = 'center'
    previewEl.style.gap = '10px'
    previewEl.style.background = '#e6f4ea'
    previewEl.style.border = '1px solid #22c55e'
    previewEl.style.borderRadius = '8px'
    previewEl.style.padding = '10px 16px'
    previewEl.style.margin = '10px 0'
    previewEl.style.position = 'relative'
    previewEl.innerHTML = `
      <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' width='32' height='32' class='text-primary'>
        <rect width='24' height='24' rx='4' fill='#22c55e'/>
        <path d='M8 16h8M8 12h8M8 8h8' stroke='#fff' stroke-width='2' stroke-linecap='round'/>
      </svg>
      <span style='color:#166534;font-weight:600;'>${file.name}</span>
    `
  }
  return previewEl
}
