import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, Minus, Plus } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Bundle the pdf.js worker locally (no CDN dependency, version always matches).
(
  pdfjs as unknown as {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
  }
).GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

type PdfPreviewProps = {
  fileUrl: string;
};

export default function PdfPreview({ fileUrl }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);

  // Fit pages to the container width and keep them responsive on resize.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pageWidth = containerWidth > 0 ? Math.min(containerWidth - 32, 900) : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-divider bg-offwhite px-4 py-2 text-sm text-darkerb">
        <span>{numPages > 0 ? `${numPages} page${numPages > 1 ? "s" : ""}` : "\u00A0"}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP))}
            disabled={scale <= MIN_SCALE}
            className="rounded p-1.5 hover:bg-white disabled:opacity-40"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP))}
            disabled={scale >= MAX_SCALE}
            className="rounded p-1.5 hover:bg-white disabled:opacity-40"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-offwhite py-4">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages: total }: { numPages: number }) => setNumPages(total)}
          loading={
            <div className="flex h-40 items-center justify-center text-neutral">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading PDF…
            </div>
          }
          error={
            <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-rose-600">
              Unable to display this PDF. Try “Open in new tab”.
            </div>
          }
          className="flex flex-col items-center gap-4"
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              width={pageWidth}
              scale={scale}
              className="shadow-md"
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
