import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const wordNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

// Sequências de propriedades do WordprocessingML (ECMA-376).
// html-to-docx 1.x emite algumas delas na ordem dos estilos HTML.
const propertyOrder: Record<string, string[]> = {
  sectPr: 'headerReference footerReference footnotePr endnotePr type pgSz pgMar paperSrc pgBorders lnNumType pgNumType cols formProt vAlign noEndnote titlePg textDirection bidi rtlGutter docGrid printerSettings sectPrChange'.split(' '),
  pPr: 'pStyle keepNext keepLines pageBreakBefore framePr widowControl numPr suppressLineNumbers pBdr shd tabs suppressAutoHyphens kinsoku wordWrap overflowPunct topLinePunct autoSpaceDE autoSpaceDN bidi adjustRightInd snapToGrid spacing ind contextualSpacing mirrorIndents suppressOverlap jc textDirection textAlignment textboxTightWrap outlineLvl divId cnfStyle rPr sectPr pPrChange'.split(' '),
  rPr: 'rStyle rFonts b bCs i iCs caps smallCaps strike dstrike outline shadow emboss imprint noProof snapToGrid vanish webHidden color spacing w kern position sz szCs highlight u effect bdr shd fitText vertAlign rtl cs em lang eastAsianLayout specVanish oMath rPrChange'.split(' '),
  tblPr: 'tblStyle tblpPr tblOverlap bidiVisual tblStyleRowBandSize tblStyleColBandSize tblW jc tblCellSpacing tblInd tblBorders shd tblLayout tblCellMar tblLook tblCaption tblDescription tblPrChange'.split(' '),
  tcPr: 'cnfStyle tcW gridSpan hMerge vMerge tcBorders shd noWrap tcMar textDirection tcFitText vAlign hideMark headers cellIns cellDel cellMerge tcPrChange'.split(' '),
  tblBorders: 'top left start bottom right end insideH insideV'.split(' '),
  tcBorders: 'top left start bottom right end insideH insideV tl2br tr2bl'.split(' '),
  tblCellMar: 'top left start bottom right end'.split(' '),
  tcMar: 'top left start bottom right end'.split(' '),
};

function normalizeXml(xml: string): string {
  const document = new DOMParser({ errorHandler: { error: message => { throw new Error(message); }, fatalError: message => { throw new Error(message); } } }).parseFromString(xml, 'application/xml');
  const elements = Array.from(document.getElementsByTagNameNS(wordNamespace, '*'));
  for (const element of elements) {
    const order = propertyOrder[element.localName];
    if (order) {
      const children = Array.from(element.childNodes).filter((node): node is Element => node.nodeType === 1);
      const rank = (child: Element) => child.namespaceURI === wordNamespace && order.includes(child.localName) ? order.indexOf(child.localName) : order.length;
      for (const child of children.sort((a, b) => rank(a) - rank(b))) element.appendChild(child);
    }
    // A seção final pertence ao fim do corpo, depois de todos os parágrafos.
    const parent = element.parentNode;
    if (element.localName === 'sectPr' && parent?.nodeType === 1 && (parent as Element).localName === 'body') parent.appendChild(element);
  }
  return new XMLSerializer().serializeToString(document);
}

/** Corrige a estrutura gerada sem converter texto, imagens ou relacionamentos. */
export async function normalizeDocx(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const parts = Object.values(zip.files).filter(file => !file.dir && /^word\/.*\.xml$/.test(file.name));
  for (const part of parts) zip.file(part.name, normalizeXml(await part.async('string')));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
