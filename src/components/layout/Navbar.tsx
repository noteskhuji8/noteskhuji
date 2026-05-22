import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const nav = [
  { to: "/browse", label: "Browse Notes" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="NotesKhuji" className="h-8 w-8 rounded-md" />
          <span className="font-display text-lg font-bold tracking-tight">
            Notes<span className="brand-gradient-text">Khuji</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link to="/browse">
            <Button variant="ghost" size="sm" className="gap-2">
              <Search className="h-4 w-4" /> Search
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/upload">
            <Button size="sm" className="brand-gradient gap-2 text-white shadow-md hover:opacity-95">
              <Upload className="h-4 w-4" /> Upload
            </Button>
          </Link>
        </div>
        <button
          className="rounded-md p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="space-y-1 px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Log in</Button>
              </Link>
              <Link to="/upload" onClick={() => setOpen(false)}>
                <Button size="sm" className="brand-gradient w-full text-white">Upload</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
