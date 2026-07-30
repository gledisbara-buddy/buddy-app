import Link from "next/link";
import { Logo } from "@/components/Logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Försäkringar",
    links: [
      { href: "/forsakringar", label: "Boende" },
      { href: "/forsakringar", label: "Bil & fordon" },
      { href: "/forsakringar", label: "Person" },
      { href: "/forsakringar", label: "Djur" },
    ],
  },
  {
    title: "Innehåll",
    links: [
      { href: "/guider", label: "Guider" },
      { href: "/nyheter", label: "Nyheter" },
      { href: "/vanliga-fragor", label: "Vanliga frågor" },
    ],
  },
  {
    title: "Om Buddy",
    links: [
      { href: "/om-oss", label: "Om oss" },
      { href: "/jobb", label: "Jobba hos oss" },
      { href: "/kontakt", label: "Kontakta oss" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line mt-auto">
      <div className="max-w-6xl mx-auto px-5 md:px-10 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <Logo />
            <p className="text-sm mt-3 text-slate max-w-[220px]">
              Din digitala försäkringsassistent — jämför, teckna och hantera dina försäkringar på
              ett ställe.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-semibold mb-3">{col.title}</div>
              <div className="flex flex-col gap-2">
                {col.links.map((link, i) => (
                  <Link key={i} href={link.href} className="text-sm text-slate hover:text-forest">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-6 border-t border-line">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate">
            <Link href="/villkor" className="hover:text-forest">
              Villkor
            </Link>
            <Link href="/integritetspolicy" className="hover:text-forest">
              Integritetspolicy
            </Link>
            <Link href="/cookies" className="hover:text-forest">
              Cookies
            </Link>
          </div>
          <p className="text-xs text-slate">
            © {new Date().getFullYear()} Buddy Försäkring. Det här är en designprototyp —
            bolaget och innehållet är fiktivt.
          </p>
        </div>
      </div>
    </footer>
  );
}
