const fs = require('fs')
const PDFDocument = require('pdfkit')

const { buildReceiptData } = require('./receiptData')

const THUMB_SIZE = 48
const HERO_SIZE = 96
const PAGE_MARGIN = 48

/**
 * @param {string|null|undefined} url
 * @param {number} [timeoutMs]
 * @returns {Promise<Buffer|null>}
 */
async function fetchImageBuffer(url, timeoutMs = 8000) {
  if (!url || typeof url !== 'string') return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) return null
    return Buffer.from(await response.arrayBuffer())
  } catch {
    return null
  }
}

/**
 * @param {string|null|undefined} filePath
 * @returns {Buffer|null}
 */
function readLocalImage(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null
  try {
    return fs.readFileSync(filePath)
  } catch {
    return null
  }
}

/**
 * @param {object} receipt
 * @returns {Promise<Map<number, Buffer>>}
 */
async function loadLineImages(receipt) {
  const map = new Map()
  if (!receipt.branding.showWatchImages) return map

  await Promise.all(
    receipt.lines.map(async (line, index) => {
      const buffer = await fetchImageBuffer(line.imageUrl)
      if (buffer) map.set(index, buffer)
    }),
  )
  return map
}

/**
 * @param {import('pdfkit').PDFDocument} doc
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {Buffer|null} buffer
 * @param {string} panelColor
 */
function drawImagePlaceholder(doc, x, y, size, buffer, panelColor) {
  if (buffer) {
    try {
      doc.image(buffer, x, y, { width: size, height: size, fit: [size, size] })
      return
    } catch {
      /* fall through to placeholder */
    }
  }
  doc
    .roundedRect(x, y, size, size, 4)
    .fillColor(panelColor)
    .fill()
}

/**
 * @param {import('pdfkit').PDFDocument} doc
 * @param {number} y
 * @param {string} label
 * @param {string} value
 * @param {number} pageWidth
 * @param {string} textColor
 */
function drawTotalRow(doc, y, label, value, pageWidth, textColor, { bold = false } = {}) {
  const rightX = pageWidth - PAGE_MARGIN
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor(textColor)
  doc.text(label, PAGE_MARGIN, y, { width: pageWidth / 2 })
  doc.text(value, PAGE_MARGIN, y, { width: pageWidth - PAGE_MARGIN * 2, align: 'right' })
}

/**
 * @param {object} receipt
 * @param {Buffer|null} logoBuffer
 * @param {Map<number, Buffer>} lineImages
 * @returns {Promise<Buffer>}
 */
function renderReceiptPdf(receipt, logoBuffer, lineImages) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, autoFirstPage: true })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const { branding, labels, order, seller, customer, lines, shipping, discount, totals } =
      receipt
    const pageWidth = doc.page.width
    const contentWidth = pageWidth - PAGE_MARGIN * 2
    let y = PAGE_MARGIN

    // Header
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, PAGE_MARGIN, y, { height: 40, fit: [120, 40] })
      } catch {
        doc.font('Helvetica-Bold').fontSize(14).fillColor(branding.accentColor)
        doc.text(branding.brandName, PAGE_MARGIN, y)
      }
    } else {
      doc.font('Helvetica-Bold').fontSize(14).fillColor(branding.accentColor)
      doc.text(branding.brandName, PAGE_MARGIN, y)
    }

    doc.font('Helvetica-Bold').fontSize(16).fillColor(branding.textColor)
    doc.text(branding.documentTitle, PAGE_MARGIN, y, {
      width: contentWidth,
      align: 'right',
    })
    y += 28
    doc.font('Helvetica').fontSize(9).fillColor('#666666')
    doc.text(labels.receiptSubtitle, PAGE_MARGIN, y, { width: contentWidth, align: 'right' })
    y += 24

    // Metadata
    doc.font('Helvetica').fontSize(10).fillColor(branding.textColor)
    doc.text(`${labels.orderNumber} : ${order.id}`, PAGE_MARGIN, y)
    y += 14
    doc.text(`${labels.paymentDate} : ${receipt.formatDate(order.paidAt)}`, PAGE_MARGIN, y)
    y += 14
    if (order.customerEmail) {
      doc.text(`${order.customerEmail}`, PAGE_MARGIN, y)
      y += 14
    }
    y += 8

    // Hero image for single-item orders
    if (receipt.showHeroImage && lines.length === 1) {
      const heroBuffer = lineImages.get(0)
      if (heroBuffer) {
        try {
          doc.image(heroBuffer, PAGE_MARGIN, y, { width: HERO_SIZE, height: HERO_SIZE, fit: [HERO_SIZE, HERO_SIZE] })
          y += HERO_SIZE + 12
        } catch {
          /* skip */
        }
      }
    }

    // Two-column addresses
    const colWidth = contentWidth / 2 - 8
    const addressStartY = y

    doc.font('Helvetica-Bold').fontSize(10).fillColor(branding.accentColor)
    doc.text(labels.seller, PAGE_MARGIN, y)
    doc.text(labels.customer, PAGE_MARGIN + colWidth + 16, y)
    y += 14

    doc.font('Helvetica').fontSize(9).fillColor(branding.textColor)
    const sellerLines = [seller.name, seller.address, seller.email]
    if (seller.siret) sellerLines.push(`${labels.siret} : ${seller.siret}`)
    if (seller.vatNumber) sellerLines.push(`${labels.vatNumber} : ${seller.vatNumber}`)

    const customerLines = [...customer.billingLines]
    if (customer.email && !customerLines.length) customerLines.push(customer.email)
    if (customer.phone) customerLines.push(customer.phone)

    const sellerHeight = doc.heightOfString(sellerLines.join('\n'), { width: colWidth })
    const customerHeight = doc.heightOfString(customerLines.join('\n') || '—', { width: colWidth })
    doc.text(sellerLines.filter(Boolean).join('\n'), PAGE_MARGIN, y, { width: colWidth })
    doc.text(customerLines.join('\n') || '—', PAGE_MARGIN + colWidth + 16, y, { width: colWidth })
    y = addressStartY + 14 + Math.max(sellerHeight, customerHeight) + 16

    // Line items table header
    const tableTop = y
    const colThumb = THUMB_SIZE + 8
    const colRef = 56
    const colQty = 28
    const colUnit = 72
    const colLine = 72
    const colDesc = contentWidth - colThumb - colRef - colQty - colUnit - colLine

    doc.rect(PAGE_MARGIN, y, contentWidth, 20).fillColor(branding.panelColor).fill()
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#555555')
    let colX = PAGE_MARGIN + 4
    if (branding.showWatchImages) colX += colThumb
    doc.text(labels.item, colX, y + 6, { width: colDesc })
    doc.text(labels.reference, colX + colDesc, y + 6, { width: colRef, align: 'right' })
    doc.text(labels.quantity, colX + colDesc + colRef, y + 6, { width: colQty, align: 'center' })
    doc.text(labels.unitPrice, colX + colDesc + colRef + colQty, y + 6, {
      width: colUnit,
      align: 'right',
    })
    doc.text(labels.lineTotal, colX + colDesc + colRef + colQty + colUnit, y + 6, {
      width: colLine,
      align: 'right',
    })
    y += 24

    doc.font('Helvetica').fontSize(9).fillColor(branding.textColor)
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]
      const rowY = y
      const rowHeight = Math.max(THUMB_SIZE + 4, 20)

      if (y + rowHeight > doc.page.height - PAGE_MARGIN - 180) {
        doc.addPage()
        y = PAGE_MARGIN
      }

      if (branding.showWatchImages) {
        drawImagePlaceholder(doc, PAGE_MARGIN + 4, y, THUMB_SIZE, lineImages.get(i) || null, branding.panelColor)
      }

      colX = PAGE_MARGIN + 4 + (branding.showWatchImages ? colThumb : 0)
      doc.text(line.name, colX, y + 4, { width: colDesc })
      doc.text(line.reference || '—', colX + colDesc, y + 4, { width: colRef, align: 'right' })
      doc.text(String(line.quantity), colX + colDesc + colRef, y + 4, {
        width: colQty,
        align: 'center',
      })
      doc.text(receipt.formatMoney(line.unitPriceCents), colX + colDesc + colRef + colQty, y + 4, {
        width: colUnit,
        align: 'right',
      })
      doc.text(receipt.formatMoney(line.lineTotalCents), colX + colDesc + colRef + colQty + colUnit, y + 4, {
        width: colLine,
        align: 'right',
      })

      y += rowHeight + 4
      doc
        .moveTo(PAGE_MARGIN, y - 2)
        .lineTo(pageWidth - PAGE_MARGIN, y - 2)
        .strokeColor('#eeeeee')
        .stroke()
    }

    if (lines.length === 0) {
      doc.text('—', PAGE_MARGIN, y)
      y += 20
    }

    y = Math.max(y, tableTop + 24) + 8

    // Totals block (right-aligned)
    const totalsX = pageWidth - PAGE_MARGIN - 220
    const totalsWidth = 220
    y += 8
    doc.font('Helvetica').fontSize(10).fillColor(branding.textColor)

    const totalRows = [
      [labels.subtotal, receipt.formatMoney(totals.subtotalCents)],
      [
        labels.shippingLine,
        totals.shippingCents === 0 ? labels.free : receipt.formatMoney(totals.shippingCents),
      ],
    ]
    if (discount) {
      totalRows.push([labels.discount, `-${receipt.formatMoney(discount.discountCents)}`])
    }
    totalRows.push([labels.netExclVat, receipt.formatMoney(totals.netCents)])
    totalRows.push([`${labels.vat} (${totals.vatRate} %)`, receipt.formatMoney(totals.vatCents)])

    for (const [label, value] of totalRows) {
      doc.text(label, totalsX, y, { width: totalsWidth / 2 })
      doc.text(value, totalsX, y, { width: totalsWidth, align: 'right' })
      y += 14
    }

    y += 4
    doc
      .moveTo(totalsX, y)
      .lineTo(totalsX + totalsWidth, y)
      .strokeColor(branding.accentColor)
      .lineWidth(1)
      .stroke()
    y += 8

    doc.font('Helvetica-Bold').fontSize(11).fillColor(branding.accentColor)
    doc.text(labels.totalInclVat, totalsX, y, { width: totalsWidth / 2 })
    doc.text(receipt.formatMoney(totals.totalCents), totalsX, y, { width: totalsWidth, align: 'right' })
    y += 24

    // Discount detail
    if (discount?.code) {
      doc.font('Helvetica').fontSize(9).fillColor('#15803d')
      doc.text(`${labels.promoCode} : ${discount.code}`, PAGE_MARGIN, y)
      y += 14
    }

    // Shipping block
    if (shipping) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(branding.accentColor)
      doc.text(labels.shipping, PAGE_MARGIN, y)
      y += 14
      doc.font('Helvetica').fontSize(9).fillColor(branding.textColor)
      if (shipping.methodLabel) {
        doc.text(`${labels.method} : ${shipping.methodLabel}`, PAGE_MARGIN, y)
        y += 12
      }
      if (shipping.methodType === 'pickup' && shipping.pickupLocation) {
        const pickupLines = [shipping.pickupLocation.name, shipping.pickupLocation.address].filter(Boolean)
        doc.text(`${labels.pickupLocation} :`, PAGE_MARGIN, y)
        y += 12
        doc.text(pickupLines.join('\n'), PAGE_MARGIN, y)
        y += pickupLines.length * 12
      } else if (customer.shippingLines.length) {
        doc.text(`${labels.deliveryAddress} :`, PAGE_MARGIN, y)
        y += 12
        doc.text(customer.shippingLines.join('\n'), PAGE_MARGIN, y)
        y += customer.shippingLines.length * 12
      }
      y += 8
    }

    // Payment block
    doc.font('Helvetica-Bold').fontSize(10).fillColor(branding.accentColor)
    doc.text(labels.payment, PAGE_MARGIN, y)
    y += 14
    doc.font('Helvetica').fontSize(9).fillColor(branding.textColor)
    doc.text(`${labels.paymentMethod} : ${labels.cardViaStripe}`, PAGE_MARGIN, y)
    y += 12
    if (order.paymentIntentId) {
      doc.text(`${labels.paymentRef} : ${order.paymentIntentId}`, PAGE_MARGIN, y)
      y += 12
    }

    // Footer
    y = doc.page.height - PAGE_MARGIN - 40
    doc
      .moveTo(PAGE_MARGIN, y)
      .lineTo(pageWidth - PAGE_MARGIN, y)
      .strokeColor('#dddddd')
      .stroke()
    y += 10

    doc.font('Helvetica').fontSize(8).fillColor('#888888')
    if (branding.footerNote) {
      doc.text(branding.footerNote, PAGE_MARGIN, y, { width: contentWidth, align: 'center' })
      y += 12
    }
    if (branding.copyrightLine) {
      doc.text(branding.copyrightLine, PAGE_MARGIN, y, { width: contentWidth, align: 'center' })
      y += 10
    }
    if (branding.cgvUrl) {
      doc.text(`${labels.cgv} : ${branding.cgvUrl}`, PAGE_MARGIN, y, {
        width: contentWidth,
        align: 'center',
        link: branding.cgvUrl,
      })
    }

    doc.end()
  })
}

/**
 * @param {object} receipt Built receipt DTO
 * @returns {Promise<Buffer>}
 */
async function generateReceiptPdfBuffer(receipt) {
  const logoBuffer = readLocalImage(receipt.branding.logoPath)
  const lineImages = await loadLineImages(receipt)
  return renderReceiptPdf(receipt, logoBuffer, lineImages)
}

/**
 * @param {object} site Registry entry
 * @param {object} order
 * @param {object[]} lines
 * @param {{ shipping?: object|null, discount?: object|null }} [extras]
 * @returns {Promise<Buffer|null>}
 */
async function generateOrderReceiptPdf(site, order, lines, extras = {}) {
  const receipt = buildReceiptData(site, order, lines, extras)
  if (!receipt.branding.enabled) return null
  if (order.status !== 'paid') return null
  return generateReceiptPdfBuffer(receipt)
}

/**
 * @param {string} orderId
 */
function receiptPdfFilename(orderId) {
  const safe = String(orderId).replace(/[^\w-]+/g, '_')
  return `receipt-${safe}.pdf`
}

module.exports = {
  generateOrderReceiptPdf,
  generateReceiptPdfBuffer,
  fetchImageBuffer,
  receiptPdfFilename,
}
