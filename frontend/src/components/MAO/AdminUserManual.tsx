import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

const IMG = '/assets/manual/admin';

interface Section {
  id: string;
  group: string;
  title: string;
  image: string;
  intro: string;
  points: string[];
}

// ponytail: static content, edit this array to update the manual. No CMS needed.
const SECTIONS: Section[] = [
  {
    id: 'login', group: 'Simula', title: 'Pag-login', image: '01-login',
    intro: 'Buksan ang /mao, ilagay ang Email Address at Password, tapos pindutin ang Sign In to Admin Portal. Protektado ito ng reCAPTCHA.',
    points: [
      'Gamitin ang eye icon sa password para ipakita o itago ang password.',
      'Back to Home – bumalik sa public homepage.',
      'Pagkatapos mag-login, mapupunta ka sa Overview.',
    ],
  },
  {
    id: 'overview', group: 'General', title: 'Overview (Reports & Analytics)', image: '02-dashboard',
    intro: 'Buod ng production, field monitoring, deliveries at sales.',
    points: [
      'Tabs: Abaca Production, Sales & Delivery, at Users.',
      'Cards: Received Seedlings, Completely Distributed, Total Monitoring, Planted Seedlings, Area Planted, Harvest Fiber.',
      'Seedling Distribution Overview: piliin ang taon at Monthly o Yearly.',
      'Refresh data / Refresh – kunin ang pinakabagong data.',
    ],
  },
  {
    id: 'users', group: 'Field Operations', title: 'User Management', image: '03-user-management',
    intro: 'Pamahalaan ang accounts ng farmers, buyers at association coordinators.',
    points: [
      'Piliin ang tab: Farmers, Buyers, o Association.',
      'Search (pangalan, email, organization) at All Status filter.',
      'Cards: Total Users, Pending Review, Verified, Rejected.',
      'Export CSV o Export PDF para sa listahan.',
    ],
  },
  {
    id: 'seedlings', group: 'Field Operations', title: 'Seedling Distribution', image: '04-seedling-distribution',
    intro: 'Subaybayan ang seedling batches na ibinigay sa associations.',
    points: [
      'Cards: Total Distributions, Total Quantity, This Month, Varieties.',
      'Columns: Photo, Date, Variety, Quantity, Recipient, Source, Status, Progress, Actions.',
      'Distribute to Association – mag-record ng bagong distribution (tingnan ang Mga Action Buttons).',
    ],
  },
  {
    id: 'planted', group: 'Field Operations', title: 'Planted Seedlings', image: '05-planted-seedlings',
    intro: 'Planting progress at area coverage ng mga farmers.',
    points: [
      'Filters: search, All Varieties, All Municipalities.',
      'Columns: Farmer, Variety, Quantity (planted/received at units loss), Planting Date, Location, Association, Photos.',
      'View – tingnan ang buong detalye at photos.',
    ],
  },
  {
    id: 'monitoring', group: 'Field Operations', title: 'Field Monitoring – Active', image: '06-field-monitoring-active',
    intro: 'Mga field visit logs at kondisyon ng bukid.',
    points: [
      'Cards: Total Monitoring, Healthy Farms, Needs Support, Damaged Farms, Upcoming Visits.',
      'Tabs: Active, Upcoming, Overdue, History, All Records.',
      'Condition: Healthy, Needs Support, o Damaged.',
      'Add New – mag-simula ng bagong monitoring.',
    ],
  },
  {
    id: 'monitoring-history', group: 'Field Operations', title: 'Field Monitoring – History', image: '07-field-monitoring-history',
    intro: 'Ang mga natapos na monitoring ay lumilipat dito para malinis ang Active list.',
    points: [
      'Sub-filters: All History, Completed, Done Monitor, Previous Visits.',
      'Ang history icon sa Actions ay nagpapakita ng lahat ng nakaraang visits ng farmer.',
    ],
  },
  {
    id: 'harvest', group: 'Field Operations', title: 'Harvest Verification', image: '08-harvest-verification',
    intro: 'Suriin at i-verify ang harvest submissions ng farmers.',
    points: [
      'Cards: Total Harvests, Total Farmers, Total Fiber (kg), Pending, Last 30 Days.',
      'Status dropdown (default Pending) – palitan para makita ang ibang records.',
      'Export CSV para sa report.',
    ],
  },
  {
    id: 'sales', group: 'Market & Logistics', title: 'Sales Management', image: '09-sales-management',
    intro: 'Suriin, i-verify at pamahalaan ang sales reports ng farmers.',
    points: [
      'Cards: Verified Sales, Pending Reports, Active Farmers, Total Abaca Sold, Total Reports.',
      'Filters: search, All Status, All Time. May Export button.',
      'Sa Pending rows: view, edit, approve (✔), reject (✖), delete. Sa Approved: view, edit, delete lang.',
      'I-verify muna ang Pending report bago ito mabilang sa Verified Sales.',
    ],
  },
  {
    id: 'prices', group: 'Market & Logistics', title: 'Buyer Price Listings', image: '10-buyer-price-listings',
    intro: 'Ang kasalukuyang presyo ng mga buyers.',
    points: [
      'Class A / B / C cards – nasa taas ang pinakamataas na presyo kada kg.',
      'Filters: search, All Types, All Municipalities, All Status.',
      'Read-only ito para sa admin; ang buyers ang nag-uupdate ng presyo.',
    ],
  },
  {
    id: 'delivery', group: 'Market & Logistics', title: 'Delivery Tracking', image: '11-delivery-tracking',
    intro: 'Subaybayan ang fiber deliveries sa buong associations.',
    points: [
      'Tabs: All Deliveries, In Transit, Delivered, Completed, Cancelled.',
      'Columns: Buyer / Farmer, Variety & Grade, Quantity, Date, Status, Progress.',
      'Export CSV at search (farmers, buyers, variety, location).',
    ],
  },
  {
    id: 'staff', group: 'Administration', title: 'Staff Management (Super Admin lang)', image: '13-staff-management',
    intro: 'Pamahalaan ang MAO administrator at coordinator accounts.',
    points: [
      'Cards: Total Staff, Administrators, Profile Completed, Pending Profile.',
      'Create Coordinator – gumawa ng bagong account (tingnan ang Mga Action Buttons).',
    ],
  },
  {
    id: 'btn-monitoring-add', group: 'Mga Action Buttons', title: 'Add New (Field Monitoring)', image: '16-btn-monitoring-add-new',
    intro: 'Buksan ang Field Monitoring Form para mag-record ng bagong visit.',
    points: [
      'Visit Information: Date of Visit. Ang Monitored By ay awtomatikong account mo.',
      'Farmer / Association: piliin ang farmer (rehistradong farmers lang), ilagay ang Association Name at Farm Location.',
      'Crop Growth & Farm Condition: Farm Condition, Growth Stage, Weather Condition, Estimated Yield (kg).',
      'Ang may pulang * ay kailangan. Lalabas ang bagong monitoring sa Active tab.',
    ],
  },
  {
    id: 'btn-filters', group: 'Mga Action Buttons', title: 'Filters (Field Monitoring)', image: '17-btn-monitoring-filters',
    intro: 'Pindutin ang Filters para magpakita ng dagdag na filters. Pindutin ulit para itago.',
    points: ['Farm Condition, Date From, at Date To.'],
  },
  {
    id: 'btn-monitoring-view', group: 'Mga Action Buttons', title: 'View (Field Monitoring)', image: '18-btn-monitoring-view',
    intro: 'Ang eye icon ay nagbubukas ng Monitoring Details.',
    points: [
      'Basic Information: Monitoring ID, Date of Visit, Coordinator.',
      'Farmer Information at Farm Assessment (condition, growth stage, weather, yield, issues observed).',
    ],
  },
  {
    id: 'btn-distribute', group: 'Mga Action Buttons', title: 'Distribute to Association', image: '19-btn-distribute-to-association',
    intro: 'Mag-record ng seedling distribution sa isang association.',
    points: [
      'Ilagay ang Variety, Quantity at Date Distributed. Opsyonal ang Source/Supplier.',
      'Piliin ang Recipient Association at Status. Opsyonal ang Remarks.',
      'Photo Documentation: Seedling, Distribution at Quality Photo.',
      'Distribute Seedlings para i-save, o Cancel para umatras.',
    ],
  },
  {
    id: 'btn-seedling-view', group: 'Mga Action Buttons', title: 'View (Seedling Distribution)', image: '20-btn-seedling-view',
    intro: 'Ipinapakita ang Distribution Details at Distribution Progress.',
    points: ['Variety, quantity, petsa, recipient, status, remarks.', 'Progress to Farmers: Total, Distributed, Remaining.'],
  },
  {
    id: 'btn-planted-view', group: 'Mga Action Buttons', title: 'View (Planted Seedlings)', image: '22-btn-planted-view',
    intro: 'Ipinapakita ang Planting Details.',
    points: ['Farmer, variety, quantity distributed, actual planted, damaged/losses.', 'Petsa, lokasyon, method, at Planting Photos.'],
  },
  {
    id: 'btn-sales-view', group: 'Mga Action Buttons', title: 'View (Sales Management)', image: '23-btn-sales-view',
    intro: 'Ipinapakita ang Sales Report Details. Pindutin ang Close para isara.',
    points: [
      'Report ID, Farmer, Buyer Company, Total Sales, Quantity Sold, Status, Submitted Date.',
      'Ang approve (✔) at reject (✖) ay para sa Pending reports lang. Suriing mabuti bago pumili.',
    ],
  },
  {
    id: 'btn-create-coordinator', group: 'Mga Action Buttons', title: 'Create Coordinator', image: '24-btn-create-coordinator',
    intro: 'Gumawa ng bagong MAO coordinator account.',
    points: [
      'Ilagay ang Full Name, Email Address, Password (min. 8 characters) at Confirm Password.',
      'I-check ang "Make this account a Super Admin" kung kailangan ng buong access. Ibigay lang ito sa pinagkakatiwalaan.',
      'Create Account para i-save, o Cancel para umatras.',
    ],
  },
];

const GROUPS = Array.from(new Set(SECTIONS.map((s) => s.group)));

const BUTTON_LEGEND: [string, string][] = [
  ['Refresh', 'Kunin ang pinakabagong data (kanang-taas ng bawat page).'],
  ['Export', 'I-download ang listahan bilang CSV o PDF.'],
  ['Filters', 'Magpakita ng dagdag na filters.'],
  ['Add New', 'Mag-record ng bagong monitoring.'],
  ['View (👁)', 'Tingnan ang buong detalye.'],
  ['Edit (✏)', 'Baguhin ang record.'],
  ['Approve (✔) / Reject (✖)', 'I-verify o i-reject ang Pending sales report.'],
  ['Delete (🗑)', 'Burahin ang record.'],
  ['X / Cancel / Close', 'Isara ang popup nang walang binabago.'],
];

const AdminUserManual: React.FC = () => {
  const [group, setGroup] = useState<string>(GROUPS[0]);
  const visible = SECTIONS.filter((s) => s.group === group);

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Manual categories" className="flex flex-wrap gap-2">
        {GROUPS.map((g) => (
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

      {group === 'Mga Action Buttons' && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-serif text-lg font-bold text-gray-900 mb-3">Mabilis na gabay sa mga button</h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {BUTTON_LEGEND.map(([k, v]) => (
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
            href={`${IMG}/${s.image}.png`}
            target="_blank"
            rel="noreferrer"
            className="relative block border-y border-gray-100 bg-[#F8F9FA] group"
            aria-label={`Buksan ang larawan ng ${s.title}`}
          >
            <img
              src={`${IMG}/${s.image}.png`}
              alt={`Screenshot: ${s.title}`}
              loading="lazy"
              className="w-full h-auto"
            />
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 border border-gray-200 text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> Palakihin
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

export default AdminUserManual;
