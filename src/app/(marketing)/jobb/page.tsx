import { Briefcase, Clock, MapPin } from "lucide-react";
import { JOB_LISTINGS } from "@/lib/jobs";

export default function JobbPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-10 py-16 bd-fade">
      <span className="bd-eyebrow">Jobba hos oss</span>
      <h1 className="bd-display text-3xl md:text-4xl mt-3 mb-4">Lediga jobb</h1>
      <p className="text-base mb-10 max-w-xl text-slate">
        Vi bygger ett enklare sätt att hantera försäkring. Här är våra just nu lediga tjänster.
      </p>

      <div className="flex flex-col gap-4">
        {JOB_LISTINGS.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl border border-line p-6">
            <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
              <div className="font-semibold text-lg">{job.title}</div>
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-frost-2 text-forest flex-none">
                {job.team}
              </span>
            </div>
            <p className="text-sm mb-4 text-slate">{job.desc}</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate mb-4">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} /> {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {job.type}
              </span>
            </div>
            <a
              href={`mailto:jobb@buddyforsakring.se?subject=${encodeURIComponent(`Ansökan: ${job.title}`)}`}
              className="text-sm font-semibold flex items-center gap-1 text-forest"
            >
              Ansök via mejl →
            </a>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line p-6 mt-8 flex items-start gap-3 bg-frost-2">
        <Briefcase size={17} className="mt-0.5 flex-none text-forest" />
        <p className="text-sm text-ink">
          Hittar du ingen tjänst som passar? Mejla oss ändå på{" "}
          <a href="mailto:jobb@buddyforsakring.se" className="font-semibold underline">
            jobb@buddyforsakring.se
          </a>{" "}
          — vi läser alla spontanansökningar.
        </p>
      </div>
    </div>
  );
}
