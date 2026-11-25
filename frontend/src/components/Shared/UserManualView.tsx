import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

export interface ManualSection {
  id: string;
  group: string;
  title: string;
  image: string;
  intro: string;
  points: string[];
}

interface UserManualViewProps {
  imgBase: string;
  sections: ManualSection[];
  buttonLegend?: [string, string][];
  legendGroup?: string;
}

export const UserManualView: React.FC<UserManualViewProps> = ({
  imgBase,
  sections,
  buttonLegend,
  legendGroup = 'Action Buttons',
}) => {
  const groups = Array.from(new Set(sections.map((s) => s.group)));
  const [group, setGroup] = useState<string>(groups[0] || '');
  const visible = sections.filter((s) => s.group === group);

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Manual categories" className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={group === g}
            onClick={() => setGroup(g)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
              group === g
                ? 'bg-[#047857] border-[#047857] text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {buttonLegend && buttonLegend.length > 0 && group === legendGroup && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-serif text-lg font-bold text-gray-900 mb-3">Quick button guide</h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {buttonLegend.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="font-semibold text-gray-900 shrink-0">{k}:</dt>
                <dd className="text-gray-600">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {visible.map((s) => (
        <article key={s.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-5 pb-4">
            <h2 className="font-serif text-xl font-bold text-gray-900">{s.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{s.intro}</p>
          </div>
          <a
            href={`${imgBase}/${s.image}.png`}
            target="_blank"
            rel="noreferrer"
            className="relative block border-y border-gray-100 bg-[#F8F9FA] group"
            aria-label={`Open full screenshot of ${s.title}`}
          >
            <img
              src={`${imgBase}/${s.image}.png`}
              alt={`Screenshot: ${s.title}`}
              loading="lazy"
              className="w-full h-auto"
            />
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 border border-gray-200 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> Enlarge
            </span>
          </a>
          <ul className="p-5 pt-4 space-y-2 text-sm text-gray-700 list-disc list-inside marker:text-[#047857]">
            {s.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
};

export default UserManualView;
