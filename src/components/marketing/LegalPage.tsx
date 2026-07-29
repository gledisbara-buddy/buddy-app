export function LegalPage({
  eyebrow,
  title,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <div className="max-w-2xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <span className="bd-eyebrow">{eyebrow}</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-2">{title}</h1>
      <p className="text-xs mb-10 text-slate">Senast uppdaterad: {updated}</p>
      <div className="flex flex-col gap-8">
        {sections.map((s) => (
          <div key={s.heading}>
            <h2 className="font-semibold text-[15px] mb-2">{s.heading}</h2>
            <p className="text-sm leading-relaxed text-slate">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-line p-5 mt-10 bg-frost-2">
        <p className="text-xs text-ink">
          Det här är exempeltext för en designprototyp och utgör inte faktiska juridiska villkor.
        </p>
      </div>
    </div>
  );
}
