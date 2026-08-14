import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { wrapText } from "@/lib/fullmakt";
import { itemDetailRows, itemSummary, itemTitle, type InsuranceItem } from "@/lib/items";
import type { Quote } from "@/lib/quote";

const DEMO_NOTICE =
  "Genererad av Buddy — en designprototyp. Bolagsnamn, priser och villkor ovan kan vara fiktiva exempel och ska inte tolkas som ett riktigt avtal.";

// Samma "en sak, ett dokument"-behov som fullmakten, men för valfri post i
// översikten — t.ex. för att visa en hyresvärd vad hemförsäkringen täcker,
// utan att behöva dela in i hela kontot (se den fulla JSON-exporten i
// Inställningar för det).
export async function buildItemSummaryPdf(params: {
  item: InsuranceItem;
  quote?: Quote;
  generatedAt: Date;
}): Promise<Uint8Array> {
  const { item, quote, generatedAt } = params;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 56;
  const contentWidth = width - margin * 2;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - margin;
  page.drawText(itemTitle(item), { x: margin, y, size: 22, font: boldFont, color: rgb(0.06, 0.09, 0.08) });
  y -= 26;
  for (const line of wrapText(itemSummary(item), font, 12, contentWidth)) {
    page.drawText(line, { x: margin, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 16;
  }
  y -= 20;

  const rows = itemDetailRows(item, quote);
  if (rows.length > 0) {
    page.drawText("Villkor", { x: margin, y, size: 13, font: boldFont, color: rgb(0.06, 0.09, 0.08) });
    y -= 22;
    for (const row of rows) {
      page.drawText(row.label, { x: margin, y, size: 11, font, color: rgb(0.45, 0.45, 0.45) });
      page.drawText(row.value, { x: margin + 160, y, size: 11, font: boldFont, color: rgb(0.06, 0.09, 0.08) });
      y -= 20;
    }
  } else {
    page.drawText("Inga villkor sparade ännu.", { x: margin, y, size: 11, font, color: rgb(0.45, 0.45, 0.45) });
    y -= 20;
  }

  page.drawText(`Genererad: ${generatedAt.toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" })}`, {
    x: margin,
    y: margin + 40,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const noticeLines = wrapText(DEMO_NOTICE, font, 8, contentWidth);
  let noticeY = margin + noticeLines.length * 11;
  for (const line of noticeLines) {
    page.drawText(line, { x: margin, y: noticeY, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    noticeY -= 11;
  }

  return pdfDoc.save();
}
