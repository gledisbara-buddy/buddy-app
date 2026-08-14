import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont } from "pdf-lib";

// UTKAST — texten nedan är inte juridiskt granskad. Den används i nuläget
// bara för demo-/pitchsyfte och måste granskas av en jurist innan den
// någonsin används med riktiga kunder. Se FULLMAKT_DRAFT_NOTICE, som
// upprepas både i appen och som fotnot i själva PDF:en av samma anledning.
export const FULLMAKT_PARAGRAPHS: string[] = [
  "Fullmaktsgivaren ger härmed Buddy fullmakt att, för fullmaktsgivarens räkning och alltid enligt fullmaktsgivarens uttryckliga val i appen:",
  "teckna, förnya eller ändra försäkrings- och abonnemangsavtal som fullmaktsgivaren väljer att gå vidare med via Buddys tjänst,",
  "säga upp motsvarande befintliga avtal hos andra bolag, men bara i de fall fullmaktsgivaren själv uttryckligen bett om hjälp med det,",
  "anmäla skador och föra fullmaktsgivarens talan i kontakt med försäkringsbolag under skaderegleringen.",
  "Buddy tecknar, säger aldrig upp eller anmäler något utan att fullmaktsgivaren själv först bekräftat just det steget i appen.",
  "Fullmakten gäller tills vidare och kan när som helst återkallas av fullmaktsgivaren, till exempel via inställningarna i appen eller genom att kontakta Buddys kundtjänst.",
];

export const FULLMAKT_DRAFT_NOTICE =
  "Det här är ett utkast till fullmakt som ännu inte har juridiskt granskats. Texten används i nuläget för demo- och pitchsyfte och måste granskas av en jurist innan den används med riktiga kunder.";

// Delas med item-pdf.ts — inte bara fullmakten som behöver radbrytning
// mot en fast PDF-bredd.
export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildFullmaktPdf(params: {
  name: string;
  personnummer?: string;
  signatureDataUrl: string;
  signedAt: Date;
}): Promise<Uint8Array> {
  const { name, personnummer, signatureDataUrl, signedAt } = params;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 56;
  const contentWidth = width - margin * 2;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText("UTKAST", {
    x: width / 2 - 150,
    y: height / 2 - 40,
    size: 70,
    font: boldFont,
    color: rgb(0.85, 0.85, 0.85),
    opacity: 0.5,
    rotate: degrees(35),
  });

  let y = height - margin;
  page.drawText("Fullmakt", { x: margin, y, size: 22, font: boldFont, color: rgb(0.06, 0.09, 0.08) });
  y -= 34;

  for (const paragraph of FULLMAKT_PARAGRAPHS) {
    for (const line of wrapText(paragraph, font, 11, contentWidth)) {
      page.drawText(line, { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
      y -= 16;
    }
    y -= 8;
  }

  y -= 10;
  page.drawText(`Namn: ${name}`, { x: margin, y, size: 11, font: boldFont, color: rgb(0.06, 0.09, 0.08) });
  y -= 18;
  if (personnummer) {
    page.drawText(`Personnummer: ${personnummer}`, { x: margin, y, size: 11, font: boldFont, color: rgb(0.06, 0.09, 0.08) });
    y -= 18;
  }
  page.drawText(`Signerad: ${signedAt.toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" })}`, {
    x: margin,
    y,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;

  page.drawText("Signatur:", { x: margin, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
  y -= 8;

  const pngImage = await pdfDoc.embedPng(signatureDataUrl);
  const sigDims = pngImage.scaleToFit(220, 90);
  page.drawImage(pngImage, { x: margin, y: y - sigDims.height, width: sigDims.width, height: sigDims.height });
  y -= sigDims.height + 8;

  page.drawLine({
    start: { x: margin, y },
    end: { x: margin + 220, y },
    thickness: 0.5,
    color: rgb(0.6, 0.6, 0.6),
  });

  const noticeLines = wrapText(FULLMAKT_DRAFT_NOTICE, font, 8, contentWidth);
  let noticeY = margin + noticeLines.length * 11;
  for (const line of noticeLines) {
    page.drawText(line, { x: margin, y: noticeY, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    noticeY -= 11;
  }

  return pdfDoc.save();
}
