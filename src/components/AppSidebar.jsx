import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Shield, CreditCard, AlertTriangle, Check } from 'lucide-react';

const WIZARD_STEPS = [
  { num: 1, title: 'Persona', subtitle: 'Identity & Platform Verification' },
  { num: 2, title: 'Risk Validation', subtitle: 'GPS Acquisition & AI Risk Scoring' },
  { num: 3, title: 'Issuance', subtitle: 'Policy Review & Binding' },
];

const NAV_ITEMS = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Policy', to: '/policy', icon: Shield },
  { label: 'Billing', to: '/billing', icon: CreditCard },
  { label: 'Claim', to: '/claims', icon: AlertTriangle },
];

function getBadgeClass(status) {
  const s = status?.toUpperCase() || '';
  if (['ISSUED', 'ACTIVE', 'ARMED'].includes(s)) return 'badge-teal';
  if (['QUOTED', 'BOUND', 'UNDERWRITING'].includes(s)) return 'badge-navy';
  if (['DRAFT', 'PENDING'].includes(s)) return 'badge-gray';
  if (['WARNING', 'SURGE'].includes(s)) return 'badge-amber';
  return 'badge-gray';
}

/**
 * AppSidebar — shared sidebar for wizard + dashboard pages
 */
export default function AppSidebar({
  activeSection = 'overview',
  currentStep,
  stateHistory = [],
  policyId,
}) {
  const isWizard = typeof currentStep === 'number';

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] h-screen sticky top-0 flex flex-col p-6 shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-[#1A3C5E] text-white text-sm font-bold flex items-center justify-center">
          KS
        </div>
        <span className="text-sm font-semibold text-[#1A1A1A]">KavachSathi</span>
      </div>

      {/* Wizard steps OR Nav links */}
      {isWizard ? (
        <div>
          <p className="section-label mb-4">Submission Flow</p>
          <div className="flex flex-col gap-1">
            {WIZARD_STEPS.map((step, i) => {
              const isCompleted = step.num < currentStep;
              const isActive = step.num === currentStep;
              const isPending = step.num > currentStep;

              return (
                <div key={step.num} className="flex items-start gap-3">
                  {/* Vertical timeline */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0
                        ${isCompleted ? 'bg-[#0F7B6C] text-white' : ''}
                        ${isActive ? 'bg-[#1A3C5E] text-white ring-2 ring-[#1A3C5E] ring-offset-2' : ''}
                        ${isPending ? 'bg-[#F3F4F6] text-gray-400' : ''}
                      `}
                    >
                      {isCompleted ? <Check size={14} strokeWidth={3} /> : step.num}
                    </div>
                    {i < WIZARD_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${isCompleted ? 'bg-[#0F7B6C]' : 'bg-[#E5E7EB]'}`} />
                    )}
                  </div>

                  {/* Label */}
                  <div className={`pt-0.5 rounded-lg transition-all
                    ${isActive ? 'bg-[#EEF2FF] text-[#1A3C5E] px-3 py-2 border-l-4 border-[#1A3C5E] -ml-1' : ''}
                  `}>
                    <p className={`text-sm ${isActive || isCompleted ? 'font-semibold text-[#1A1A1A]' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-[#1A3C5E]' : 'text-gray-400'}`}>
                      {isCompleted ? 'Completed' : isActive ? 'Active' : step.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <p className="section-label mb-4">Navigation</p>
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 text-sm transition-all rounded-lg px-3 py-2.5 ${
                    isActive
                      ? 'bg-[#EEF2FF] text-[#1A3C5E] font-semibold border-l-4 border-[#1A3C5E]'
                      : 'text-gray-500 hover:text-[#1A3C5E] hover:bg-[#F9FAFB]'
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* State History + Policy ID (bottom) */}
      <div className="mt-auto pt-6">
        {stateHistory.length > 0 && (
          <div className="mb-4">
            <p className="section-label mb-3">State History</p>
            <div className="flex flex-col gap-2.5">
              {stateHistory.slice(0, 6).map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    i === 0 ? 'bg-[#1A3C5E] animate-pulse' :
                    i < 3 ? 'bg-[#0F7B6C]' : 'bg-gray-200'
                  }`} />
                  <span className="font-['JetBrains_Mono'] text-xs text-gray-400">{entry.timestamp}</span>
                  <span className={getBadgeClass(entry.status)}>{entry.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {policyId && (
          <div>
            <p className="section-label mb-1">Policy ID</p>
            <p className="font-['JetBrains_Mono'] text-xs text-[#1A3C5E] font-semibold break-all">{policyId}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
