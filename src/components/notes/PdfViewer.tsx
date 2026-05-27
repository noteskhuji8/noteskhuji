import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Use CDN worker so we don't have to bundle it ourselves.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Props = {
  url: string;
  maxPages?: number;
  watermark?: string;
};

export function PdfViewer({ url, maxPages, watermark }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(700);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setWidth(Math.min(900, containerRef.current.clientWidth - 24));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Block keyboard shortcuts for save/print while viewer is mounted
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lastPage = maxPages ? Math.min(maxPages, numPages || maxPages) : numPages;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Document
          file={url}
          onLoadSuccess={(p) => setNumPages(p.numPages)}
          loading={
            <div className="flex h-[500px] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading document…
            </div>
          }
          error={
            <div className="flex h-[400px] items-center justify-center p-6 text-center text-sm text-destructive">
              Could not load this document. Please try again.
            </div>
          }
        >
          <div className="relative flex justify-center bg-muted/30 p-4">
            <Page
              pageNumber={page}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
            {watermark && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rotate-[-25deg] text-5xl font-bold tracking-widest text-foreground/10">
                  {watermark}
                </span>
              </div>
            )}
          </div>
        </Document>

        {lastPage > 0 && (
          <div className="flex items-center justify-between border-t border-border bg-background px-4 py-3">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page} of {lastPage}
              {maxPages && numPages > maxPages && (
                <span className="ml-2 text-xs text-primary">· preview</span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
