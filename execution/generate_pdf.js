/**
 * Layer 3: Puppeteer HTML-to-PDF Engine
 * Generates an official 4-Page Executive Digital Transformation Blueprint PDF for Exabytes Malaysia
 */

const fs = require('fs');
const path = require('path');
const { buildReportHtml } = require('./report_template');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}

/**
 * Renders HTML to PDF buffer using Puppeteer
 * @param {Object} reportData
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateBlueprintPdf(reportData) {
  const htmlContent = buildReportHtml(reportData);

  if (!puppeteer) {
    throw new Error('Puppeteer is not installed in current environment.');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // Wait brief moment for styles and SVG rendering
    await new Promise(r => setTimeout(r, 500));
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = {
  buildReportHtml,
  generateBlueprintPdf
};
