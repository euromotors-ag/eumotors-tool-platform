import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set up the worker for pdfjs-dist
// Use Vite's asset import to load worker file directly from node_modules
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

export interface ExtractedTextData {
  fileName: string;
  totalPages: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    wordCount: number;
  }>;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
  fullText: string;
  totalWordCount: number;
}

/**
 * Extracts text from a PDF file and returns structured data
 */
export async function extractTextFromPdf(
  file: File
): Promise<ExtractedTextData> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const totalPages = pdf.numPages;
  const pages: ExtractedTextData["pages"] = [];
  let fullText = "";

  // Extract text from each page
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Combine all text items from the page
    const pageText = textContent.items
      .map((item) => {
        if ("str" in item) {
          return item.str as string;
        }
        return "";
      })
      .join(" ");

    const wordCount = pageText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    pages.push({
      pageNumber: pageNum,
      text: pageText,
      wordCount,
    });

    fullText += pageText + "\n\n";
  }

  // Get metadata
  const metadata = await pdf.getMetadata();
  const totalWordCount = fullText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Type-safe metadata extraction
  const info = metadata?.info as Record<string, unknown> | undefined;

  return {
    fileName: file.name,
    totalPages,
    pages,
    metadata: info
      ? {
          title: typeof info.Title === "string" ? info.Title : undefined,
          author: typeof info.Author === "string" ? info.Author : undefined,
          subject: typeof info.Subject === "string" ? info.Subject : undefined,
          creator: typeof info.Creator === "string" ? info.Creator : undefined,
          producer:
            typeof info.Producer === "string" ? info.Producer : undefined,
          creationDate: info.CreationDate
            ? String(info.CreationDate)
            : undefined,
          modificationDate: info.ModDate ? String(info.ModDate) : undefined,
        }
      : undefined,
    fullText: fullText.trim(),
    totalWordCount,
  };
}

/**
 * Converts extracted PDF data to JSON string
 */
export function convertToJson(data: ExtractedTextData): string {
  return JSON.stringify(data, null, 2);
}
