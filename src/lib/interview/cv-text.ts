// ==================================================
// CV text extraction
// ==================================================
// The agent's whole advantage is having read the CV before it asks
// anything, so this runs before the interview starts.
//
// Libraries are imported lazily and per-format. A candidate uploading a
// .docx should not pay the cost of loading a PDF parser, and a missing
// optional dependency should degrade to "the agent asks in conversation"
// rather than taking down the funnel.

/** Anything past this is almost certainly not a CV. */
const MAX_CHARS = 100_000;

export class CvExtractionError extends Error {}

/**
 * Extract plain text from an uploaded CV.
 *
 * Throws CvExtractionError when the format is unreadable. Callers are
 * expected to continue without CV text rather than reject the candidate —
 * a scanned PDF with no text layer is a common, innocent case.
 */
export async function extractCvText(file: File): Promise<string> {
  const buf  = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt")) {
    return clamp(buf.toString("utf8"));
  }

  if (name.endsWith(".pdf")) {
    return clamp(await extractPdf(buf));
  }

  if (name.endsWith(".docx")) {
    return clamp(await extractDocx(buf));
  }

  // .doc is a binary format that needs a different parser entirely; it is
  // rare enough now that supporting it is not worth the dependency.
  throw new CvExtractionError(`Unsupported CV format: ${name}`);
}

async function extractPdf(buf: Buffer): Promise<string> {
  // pdf-parse v2 is class-based; the v1 default-export signature is gone.
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buf) });

  try {
    const { text } = await parser.getText();
    if (!text?.trim()) {
      // A PDF with no text layer is a scan. Nothing to recover without OCR,
      // and OCR is not worth adding for a case the agent can just ask about.
      throw new CvExtractionError("PDF contains no extractable text");
    }
    return text;
  } catch (e) {
    if (e instanceof CvExtractionError) throw e;
    throw new CvExtractionError(`PDF extraction failed: ${(e as Error).message}`);
  } finally {
    // pdfjs holds a worker open; without this the dev server leaks one per
    // upload and eventually stops responding.
    await parser.destroy().catch(() => {});
  }
}

async function extractDocx(buf: Buffer): Promise<string> {
  try {
    const mod = await import("mammoth");
    const mammoth = (mod.default ?? mod) as { extractRawText(o: { buffer: Buffer }): Promise<{ value: string }> };
    const { value } = await mammoth.extractRawText({ buffer: buf });
    if (!value?.trim()) throw new CvExtractionError("DOCX contains no text");
    return value;
  } catch (e) {
    if (e instanceof CvExtractionError) throw e;
    throw new CvExtractionError(`DOCX extraction failed: ${(e as Error).message}`);
  }
}

function clamp(text: string): string {
  const normalised = text.replace(/\r\n/g, "\n").trim();
  return normalised.length > MAX_CHARS ? normalised.slice(0, MAX_CHARS) : normalised;
}
