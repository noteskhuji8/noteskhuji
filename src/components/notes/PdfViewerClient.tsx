import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy so react-pdf (which depends on canvas / workers) only loads in the browser.
const PdfViewer = lazy(() =>
  import("./PdfViewer").then((m) => ({ default: m.PdfViewer })),
);

type Props = {
  url: string;
  maxPages?: number;
  watermark?: string;
};

export function PdfViewerClient(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[500px] items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing viewer…
        </div>
      }
    >
      <PdfViewer {...props} />
    </Suspense>
  );
}
