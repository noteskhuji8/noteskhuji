import { Link } from "@tanstack/react-router";
import { Download, Star, FileText, Lock } from "lucide-react";
import type { Note } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function NoteCard({ note }: { note: Note }) {
  return (
    <Link
      to="/notes/$id"
      params={{ id: note.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className={`relative aspect-[4/3] w-full bg-gradient-to-br ${note.cover}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl bg-white/15 p-4 backdrop-blur-sm ring-1 ring-white/30">
            <FileText className="h-10 w-10 text-white" />
          </div>
        </div>
        <div className="absolute left-3 top-3 flex gap-1.5">
          {note.premium ? (
            <Badge className="border-0 bg-white/95 text-foreground shadow-sm">
              <Lock className="mr-1 h-3 w-3" /> Premium
            </Badge>
          ) : (
            <Badge className="border-0 bg-emerald-500 text-white shadow-sm">Free</Badge>
          )}
        </div>
        <div className="absolute bottom-3 right-3 rounded-md bg-black/40 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {note.pages} pages
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-primary">{note.subject}</span>
          <span>·</span>
          <span>{note.university}</span>
        </div>
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-foreground group-hover:text-primary">
          {note.title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {note.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {note.downloads.toLocaleString()}
            </span>
          </div>
          <Button
            size="sm"
            className={note.premium ? "brand-gradient text-white" : ""}
            variant={note.premium ? "default" : "outline"}
          >
            {note.price === 0 ? "Free" : `৳${note.price}`}
          </Button>
        </div>
      </div>
    </Link>
  );
}
