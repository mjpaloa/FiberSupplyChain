import React from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const PORTAL_SWITCH_LINKS = [
  { to: '/buyer-login', aliases: ['/buyer-login'], label: 'Buyer' },
  { to: '/farmer-login', aliases: ['/farmer-login'], label: 'Farmer' },
  { to: '/cusafa-login', aliases: ['/cusafa-login', '/association-login'], label: 'Association' },
];

export const AUTH_LABEL_CLASS = 'block text-[13px] font-medium text-gray-700 mb-1.5';
export const AUTH_INPUT_CLASS =
  'w-full px-3.5 py-2.5 min-h-[46px] bg-[#FAFBFA] hover:bg-white focus:bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#047857]/10 focus:border-[#047857] transition-all';
export const AUTH_PRIMARY_BTN_CLASS =
  'min-h-[44px] px-6 py-2.5 bg-[#047857] hover:bg-[#065F46] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-[0_4px_12px_-4px_rgba(4,120,87,0.45)] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';
export const AUTH_SUBMIT_BTN_CLASS =
  'w-full min-h-[46px] px-5 py-2.5 mt-2 bg-[#047857] hover:bg-[#065F46] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-[0_6px_16px_-6px_rgba(4,120,87,0.55)] hover:shadow-[0_8px_20px_-6px_rgba(4,120,87,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
export const AUTH_SECONDARY_BTN_CLASS =
  'min-h-[44px] px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

interface AuthLayoutProps {
  roleLabel: string;
  roleIcon: React.ReactNode;
  title: string;
  subtitle: string;
  asideHeadline: string;
  asideDescription: string;
  asideHighlights: string[];
  onBack?: () => void;
  backLabel?: string;
  mode?: 'login' | 'register';
  onModeChange?: (mode: 'login' | 'register') => void;
  error?: string;
  children: React.ReactNode;
  footerNote?: React.ReactNode;
  /** Compact portal switcher in the form workspace header. Off for admin (officer) login. */
  showPortalSwitcher?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  roleLabel,
  roleIcon,
  title,
  subtitle,
  asideHeadline,
  asideDescription,
  asideHighlights,
  onBack,
  backLabel = 'Back to Home',
  mode,
  onModeChange,
  error,
  children,
  footerNote,
  showPortalSwitcher = true,
}) => {
  const { pathname } = useLocation();
  const isRegister = mode === 'register';

  return (
    <div className="editorial-portal min-h-screen bg-[#F6F8F7] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Architectural Brand Column (single brand logo on desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-[#052E24] text-white p-10 xl:p-12 flex-col justify-between">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(/assets/images/abcafiber.png)' }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#052E24]/80"
        />

        <Link
          to="/"
          className="relative z-10 inline-flex items-center gap-3 w-fit group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B041] rounded-xl"
        >
          <img
            src="/assets/images/abacalogo.png"
            alt="E.A.S.Y ABACA Logo"
            className="w-11 h-11 rounded-xl object-contain bg-white/95 p-1 border border-white/20 shadow-sm group-hover:scale-[1.02] transition-transform"
          />
          <div>
            <p className="font-serif text-lg font-bold tracking-tight text-white leading-tight">
              E.A.S.Y ABACA
            </p>
            <p className="text-xs text-emerald-200/90 mt-0.5">
              MAO Culiram · Talacogon, Agusan del Sur
            </p>
          </div>
        </Link>

        <div className="relative z-10 space-y-6 my-8">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5B041]" aria-hidden="true" />
            {roleLabel}
          </span>

          <div className="space-y-3.5">
            <h1 className="font-serif text-3xl xl:text-[2.5rem] font-bold leading-[1.15] tracking-tight text-white">
              {asideHeadline}
            </h1>
            <p className="text-sm xl:text-[15px] text-emerald-100/90 leading-relaxed max-w-md">
              {asideDescription}
            </p>
          </div>

          <ul className="space-y-3.5 pt-2">
            {asideHighlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-emerald-50/95">
                <CheckCircle2 className="w-4 h-4 text-[#F5B041] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-emerald-200/90">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-300" aria-hidden="true" />
            Protected by reCAPTCHA · SSL Encrypted
          </span>
          <span>MAO Culiram System</span>
        </div>
      </aside>

      {/* Right Authentication Workspace */}
      <main className="lg:col-span-7 relative flex flex-col min-h-screen px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {/* Top Utility Row: single logo on mobile only, clean Back + Portal Switcher */}
        <div className="w-full max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="flex lg:hidden items-center gap-2 pr-1"
              aria-label="E.A.S.Y ABACA Home"
            >
              <img
                src="/assets/images/abacalogo.png"
                alt="E.A.S.Y ABACA Logo"
                className="w-9 h-9 rounded-xl object-contain bg-white border border-gray-200 p-0.5"
              />
              <span className="font-serif text-base font-bold text-[#047857]">E.A.S.Y ABACA</span>
            </Link>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200/90 bg-white text-xs font-semibold text-gray-600 hover:text-gray-900 hover:border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{backLabel}</span>
              </button>
            )}
          </div>

          {showPortalSwitcher && (
            <nav
              aria-label="Switch user portal"
              className="inline-flex items-center bg-white border border-gray-200/90 rounded-full p-1 gap-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              {PORTAL_SWITCH_LINKS.map(({ to, aliases, label }) => {
                const isActive = aliases.includes(pathname);
                return (
                  <Link
                    key={to}
                    to={to}
                    aria-current={isActive ? 'page' : undefined}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#047857] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Centered Editorial Auth Card */}
        <div className="flex-1 flex items-center justify-center py-2">
          <div className={`w-full mx-auto transition-[max-width] duration-200 ${isRegister ? 'max-w-[540px]' : 'max-w-[432px]'}`}>
            <section className="editorial-card bg-white rounded-2xl border border-gray-200/80 shadow-[0_20px_50px_-24px_rgba(5,46,36,0.18),0_2px_10px_-2px_rgba(5,46,36,0.05)] overflow-hidden">
              {/* Two-tone Editorial Top Rule */}
              <div className="flex h-1 w-full" aria-hidden="true">
                <div className="flex-1 bg-[#047857]" />
                <div className="w-20 bg-[#E59500]" />
              </div>

              <div className="p-6 sm:p-8">
                {/* Card Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#EAF6F0] ring-1 ring-[#047857]/15 text-[#047857] flex items-center justify-center flex-shrink-0">
                    {roleIcon}
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-[#047857] mb-1">
                      {roleLabel}
                    </span>
                    <h2 className="font-serif text-[1.75rem] sm:text-[1.875rem] font-bold text-gray-900 leading-[1.15] tracking-tight">
                      {title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{subtitle}</p>
                  </div>
                </div>

                {/* Refined Segmented Mode Tabs */}
                {mode && onModeChange && (
                  <div
                    role="tablist"
                    aria-label="Authentication mode"
                    className="grid grid-cols-2 bg-[#F3F6F4] border border-gray-200/80 rounded-xl p-1 gap-1 mb-6"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'login'}
                      onClick={() => onModeChange('login')}
                      className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                        mode === 'login'
                          ? 'bg-white text-[#047857] shadow-[0_1px_4px_rgba(5,46,36,0.10)] ring-1 ring-black/[0.05]'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'register'}
                      onClick={() => onModeChange('register')}
                      className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                        mode === 'register'
                          ? 'bg-white text-[#047857] shadow-[0_1px_4px_rgba(5,46,36,0.10)] ring-1 ring-black/[0.05]'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="mb-5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                {children}
              </div>

              {/* Grounded Trust Footer Strip */}
              <div className="bg-[#F8FAF9] border-t border-gray-100 px-6 sm:px-8 py-4 text-xs text-gray-500 flex items-center justify-center gap-2 text-center leading-relaxed">
                <ShieldCheck className="w-3.5 h-3.5 text-[#047857]/80 flex-shrink-0" aria-hidden="true" />
                <span>
                  {footerNote || (
                    <>Authorized access only. Protected by reCAPTCHA &amp; encrypted session security.</>
                  )}
                </span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

interface AuthStepProgressProps {
  steps: string[];
  currentStep: number;
}

export const AuthStepProgress: React.FC<AuthStepProgressProps> = ({ steps, currentStep }) => {
  return (
    <nav aria-label="Registration progress" className="mb-6">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((label, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          return (
            <li
              key={label}
              aria-current={isCurrent ? 'step' : undefined}
              className="flex-1 flex flex-col items-center text-center relative"
            >
              <div className="flex items-center w-full">
                <div
                  className={`flex-1 h-0.5 ${
                    idx === 0 ? 'bg-transparent' : currentStep >= stepNumber ? 'bg-[#047857]' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums border transition-colors ${
                    isCurrent
                      ? 'bg-[#047857] border-[#047857] text-white shadow-sm'
                      : isCompleted
                        ? 'bg-[#EAF6F0] border-[#047857] text-[#047857]'
                        : 'bg-white border-gray-300 text-gray-500'
                  }`}
                >
                  {stepNumber}
                </div>
                <div
                  className={`flex-1 h-0.5 ${
                    idx === steps.length - 1
                      ? 'bg-transparent'
                      : currentStep > stepNumber
                        ? 'bg-[#047857]'
                        : 'bg-gray-200'
                  }`}
                />
              </div>
              <span
                className={`mt-1.5 text-[11px] font-semibold leading-tight ${
                  isCurrent ? 'text-[#047857]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
