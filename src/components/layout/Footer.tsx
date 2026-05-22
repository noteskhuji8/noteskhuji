import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="NotesKhuji" className="h-8 w-8 rounded-md" />
              <span className="font-display text-lg font-bold">
                Notes<span className="brand-gradient-text">Khuji</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Bangladesh's home for student notes. Find, share and earn from
              high-quality university notes — all in one place.
            </p>
          </div>
          <FooterCol title="Platform" links={[
            { to: "/browse", label: "Browse Notes" },
            { to: "/upload", label: "Upload Notes" },
            { to: "/dashboard", label: "Dashboard" },
            { to: "/blog", label: "Blog" },
          ]} />
          <FooterCol title="Company" links={[
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
            { to: "/blog", label: "Press" },
          ]} />
          <FooterCol title="Legal" links={[
            { to: "/", label: "Terms" },
            { to: "/", label: "Privacy" },
            { to: "/", label: "Copyright" },
          ]} />
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} NotesKhuji. Made for students of Bangladesh.</p>
          <p>Dhaka · Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
