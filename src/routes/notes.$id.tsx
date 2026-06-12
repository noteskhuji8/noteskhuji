import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteShell } from "@/components/layout/SiteShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download, Star, FileText, Lock, ShieldCheck, Clock, Eye, ArrowLeft, Share2, Loader2,
} from "lucide-react";
import { NoteCard } from "@/components/notes/NoteCard";
import { fetchNote, fetchNotes } from "@/lib/notes-api";
import type { Note } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { PdfViewerClient } from "@/components/notes/PdfViewerClient";
import {
  getNoteFileUrl,
  getNotePreviewUrl,
  purchaseNote,
  checkNoteAccess,
  downloadNote,
} from "@/lib/notes.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/notes/$id")({
  component: NoteDetails,
  loader: async ({ params }) => {
    const note = await fetchNote(params.id);
    if (!note) throw notFound();
    return { note };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.note.title ?? "Note"} — NotesKhuji` },
      { name: "description", content: loaderData?.note.preview ?? "" },
    ],
  }),
});

function NoteDetails() {
  const { note } = Route.useLoaderData();
  const { user } = useAuth();
  const [related, setRelated] = useState<Note[]>([]);
  const [access, setAccess] = useState<{ hasAccess: boolean; isOwner: boolean; isFree: boolean } | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfMode, setPdfMode] = useState<"full" | "preview" | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadCount, setDownloadCount] = useState<number>(note.downloads);

  const fetchAccess = useServerFn(checkNoteAccess);
  const fetchFile = useServerFn(getNoteFileUrl);
  const fetchPreview = useServerFn(getNotePreviewUrl);
  const buy = useServerFn(purchaseNote);
  const download = useServerFn(downloadNote);

  useEffect(() => {
    fetchNotes({ subjectSlug: note.subjectSlug })
      .then((all) => setRelated(all.filter((n) => n.id !== note.id).slice(0, 4)))
      .catch(console.error);
  }, [note.id, note.subjectSlug]);

  // Resolve access + PDF URL
  useEffect(() => {
    let cancelled = false;
    setLoadingPdf(true);
    setPdfUrl(null);
    (async () => {
      try {
        if (user) {
          const a = await fetchAccess({ data: { noteId: note.id } });
          if (cancelled) return;
          setAccess(a);
          if (a.hasAccess) {
            const { url } = await fetchFile({ data: { noteId: note.id } });
            if (cancelled) return;
            setPdfUrl(url);
            setPdfMode("full");
            return;
          }
        } else {
          setAccess({ hasAccess: false, isOwner: false, isFree: !note.premium && note.price === 0 });
        }
        // Fall back to preview
        const { url } = await fetchPreview({ data: { noteId: note.id } });
        if (cancelled) return;
        setPdfUrl(url);
        setPdfMode("preview");
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingPdf(false);
      }
    })();
    return () => { cancelled = true; };
  }, [note.id, user?.id]);

  const onPurchase = async () => {
    if (!user) {
      toast.error("Please log in to purchase this note.");
      return;
    }
    setPurchasing(true);
    try {
      await buy({ data: { noteId: note.id } });
      toast.success("Purchase complete — enjoy your notes!");
      const { url } = await fetchFile({ data: { noteId: note.id } });
      setPdfUrl(url);
      setPdfMode("full");
      setAccess((a) => (a ? { ...a, hasAccess: true } : a));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  const onDownload = async () => {
    if (!user) {
      toast.error("Please log in to download this note.");
      return;
    }
    setDownloading(true);
    try {
      const { url, downloads } = await download({ data: { noteId: note.id } });
      setDownloadCount(downloads);
      // Trigger browser download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Download started");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const canDownload = !!user && (access?.hasAccess ?? (!note.premium && note.price === 0));

  const showPaywall = pdfMode === "preview" && !access?.hasAccess && (note.premium || note.price > 0);

  return (
    <SiteShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <div className={`relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${note.cover} shadow-xl`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl bg-white/15 p-8 backdrop-blur ring-1 ring-white/30">
                  <FileText className="h-16 w-16 text-white" />
                </div>
              </div>
              <div className="absolute left-4 top-4 flex gap-2">
                {note.premium ? (
                  <Badge className="border-0 bg-white text-foreground">
                    <Lock className="mr-1 h-3 w-3" /> Premium
                  </Badge>
                ) : (
                  <Badge className="border-0 bg-emerald-500 text-white">Free</Badge>
                )}
                <Badge variant="outline" className="border-white/40 bg-white/10 text-white backdrop-blur">
                  PDF · {note.pages} pages
                </Badge>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link to="/subjects/$slug" params={{ slug: note.subjectSlug }} className="font-medium text-primary hover:underline">
                {note.subject}
              </Link>
              <span>·</span>
              <span>{note.university}</span>
              {note.tags.map((t: string) => (
                <Badge key={t} variant="outline" className="ml-1">{t}</Badge>
              ))}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{note.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {note.rating.toFixed(1)} rating
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="h-4 w-4" /> {downloadCount.toLocaleString()} downloads
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Updated recently
              </span>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">About these notes</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{note.preview}</p>
              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Admin verified quality</li>
                <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> In-app PDF viewer</li>
                <li className="flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Instant PDF download after unlock</li>
                <li className="flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Free 3-page preview</li>
              </ul>
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  {pdfMode === "full" ? "Full document" : "Free preview"}
                </h2>
                {pdfMode === "preview" && (
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                    First 3 pages
                  </Badge>
                )}
              </div>
              {loadingPdf ? (
                <div className="flex h-[500px] items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading secure viewer…
                </div>
              ) : !pdfUrl ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
                  <FileText className="mb-2 h-6 w-6" />
                  No previewable file is attached to this note yet.
                </div>
              ) : (
                <div className="relative">
                  <PdfViewerClient
                    url={pdfUrl}
                    watermark={user?.email ?? "NotesKhuji"}
                  />
                  {showPaywall && (
                    <div className="mt-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/30 p-6 text-center">
                      <Lock className="mx-auto h-7 w-7 text-primary" />
                      <h3 className="mt-3 font-display text-xl font-semibold">Purchase to read the rest</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Unlock the full {note.pages}-page document with instant in-app access.
                      </p>
                      <Button
                        className="brand-gradient mt-4 text-white"
                        size="lg"
                        disabled={purchasing}
                        onClick={onPurchase}
                      >
                        {purchasing ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
                        ) : (
                          <>Unlock for ৳{note.price}</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold">
                  {note.price === 0 ? "Free" : `৳${note.price}`}
                </span>
                {note.premium && <span className="text-sm text-muted-foreground line-through">৳{note.price + 100}</span>}
              </div>
              {access?.hasAccess ? (
                <Button className="brand-gradient mt-5 w-full text-white shadow-md" size="lg" disabled>
                  <ShieldCheck className="mr-2 h-4 w-4" /> You own this
                </Button>
              ) : note.premium || note.price > 0 ? (
                <Button
                  className="brand-gradient mt-5 w-full text-white shadow-md"
                  size="lg"
                  disabled={purchasing}
                  onClick={onPurchase}
                >
                  {purchasing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
                  ) : (
                    <><Lock className="mr-2 h-4 w-4" /> Purchase access</>
                  )}
                </Button>
              ) : (
                <Button
                  className="brand-gradient mt-5 w-full text-white shadow-md"
                  size="lg"
                  disabled={downloading || !user}
                  onClick={onDownload}
                >
                  {downloading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing…</>
                  ) : (
                    <><Download className="mr-2 h-4 w-4" /> {user ? "Download PDF" : "Log in to download"}</>
                  )}
                </Button>
              )}
              {canDownload && (note.premium || note.price > 0) && (
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  size="lg"
                  disabled={downloading}
                  onClick={onDownload}
                >
                  {downloading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing…</>
                  ) : (
                    <><Download className="mr-2 h-4 w-4" /> Download PDF</>
                  )}
                </Button>
              )}
              <Button variant="ghost" className="mt-2 w-full" size="sm">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>

              <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full brand-gradient font-semibold text-white">
                  {note.author[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{note.author}</div>
                  <div className="text-xs text-muted-foreground">{note.university} · Top contributor</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-semibold">Related notes</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((n) => <NoteCard key={n.id} note={n} />)}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
