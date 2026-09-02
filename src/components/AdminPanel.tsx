import React, { useState } from 'react';
import { 
  Building2, Users, Stethoscope, Beaker, Pill, ShieldAlert, 
  ArrowUpRight, Clock, MapPin, CheckCircle2, TrendingUp, Sparkles, UserCheck, PhoneCall
} from 'lucide-react';
import { PatientProfile, Appointment, Consultation, ReferralItem, MedicineInventory } from '../types';

interface AdminPanelProps {
  patients: PatientProfile[];
  appointments: Appointment[];
  consultations: Consultation[];
  referrals: ReferralItem[];
  inventory: MedicineInventory[];
  onRelieveBottleneck: () => void;
  extraDoctorActive: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  patients,
  appointments,
  consultations,
  referrals,
  inventory,
  onRelieveBottleneck,
  extraDoctorActive
}) => {
  const [activeSegment, setActiveSegment] = useState<'analytics' | 'referrals' | 'bottlenecks'>('analytics');

  // Compute Metrics
  const totalPatients = patients.length;
  const completedConsultsCount = consultations.length;
  const pendingLabsCount = appointments.filter(a => a.status === 'In-Queue').length; // approximation
  const lowStockMedicines = inventory.filter(item => item.stock < item.reorderLevel).length;

  // Active wait times
  const avgWaitTime = extraDoctorActive ? '8 mins' : '26 mins';

  // Referral breakdown
  const activeReferralsCount = referrals.length;

  return (
    <div id="admin-panel-container" className="space-y-6">
      {/* Mini Segment Tabs */}
      <div className="flex border-b border-slate-100 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSegment('analytics')}
          className={`px-4 py-2 text-xs font-black border-b-2 transition-all whitespace-nowrap ${
            activeSegment === 'analytics'
              ? 'border-slate-800 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          📊 Facility KPIs & Stock Analytics
        </button>
        <button
          onClick={() => setActiveSegment('bottlenecks')}
          className={`px-4 py-2 text-xs font-black border-b-2 transition-all whitespace-nowrap ${
            activeSegment === 'bottlenecks'
              ? 'border-slate-800 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🚨 Flow Bottleneck Monitor {extraDoctorActive ? '(Resolved)' : '(1 Active)'}
        </button>
        <button
          onClick={() => setActiveSegment('referrals')}
          className={`px-4 py-2 text-xs font-black border-b-2 transition-all whitespace-nowrap ${
            activeSegment === 'referrals'
              ? 'border-slate-800 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          🔄 Inter-facility Referral Tracker ({activeReferralsCount})
        </button>
      </div>

      {/* Segment 1: KPIs & Summary Charts */}
      {activeSegment === 'analytics' && (
        <div className="space-y-6">
          {/* Dashboard Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
              <div className="flex justify-between items-start text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Registered EHR</span>
                <Users size={16} className="text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">{totalPatients}</p>
              <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                +12% vs last month
              </span>
            </div>

            {/* KPI 2 */}
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
              <div className="flex justify-between items-start text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Completed Consultations</span>
                <Stethoscope size={16} className="text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">{completedConsultsCount}</p>
              <span className="text-[9px] text-indigo-600 font-bold flex items-center gap-0.5 mt-1">
                Avg 4.2 mins / patient
              </span>
            </div>

            {/* KPI 3 */}
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
              <div className="flex justify-between items-start text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Average Wait Time</span>
                <Clock size={16} className={extraDoctorActive ? 'text-emerald-500' : 'text-amber-500'} />
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">{avgWaitTime}</p>
              <span className="text-[9px] text-slate-500 font-bold flex items-center gap-0.5 mt-1">
                {extraDoctorActive ? 'Target Achieved' : '🚨 Above 20m Threshold'}
              </span>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
              <div className="flex justify-between items-start text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Inventory Low Alerts</span>
                <Pill size={16} className="text-red-500" />
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">{lowStockMedicines}</p>
              <span className="text-[9px] text-red-600 font-bold flex items-center gap-0.5 mt-1">
                Reorder triggers dispatched
              </span>
            </div>
          </div>

          {/* Graphical Analytics Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visualizer 1: Age Spread */}
            <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Demographics Age Spread</h4>
              <div className="space-y-2.5 pt-2">
                {[
                  { range: 'Infants (0-5 yrs)', percentage: 15, count: 2, color: 'bg-indigo-500' },
                  { range: 'Youth (6-18 yrs)', percentage: 22, count: 3, color: 'bg-emerald-500' },
                  { range: 'Adults (19-50 yrs)', percentage: 48, count: 7, color: 'bg-slate-800' },
                  { range: 'Geriatric (51+ yrs)', percentage: 15, count: 2, color: 'bg-amber-500' }
                ].map((item, idx) => (
                  <div key={idx} className="text-xs font-semibold text-slate-700 space-y-1">
                    <div className="flex justify-between">
                      <span>{item.range}</span>
                      <span className="text-slate-400">{item.percentage}% ({item.count} patients)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visualizer 2: Disease Categorization */}
            <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Diagnosis Heatmap</h4>
              <div className="space-y-3.5 pt-1 text-xs font-semibold text-slate-700">
                {[
                  { disease: 'Diabetes Mellitus (Type 2)', count: 4, share: 40, barColor: 'bg-rose-500/80' },
                  { disease: 'Pregnancy Follow-ups', count: 3, share: 30, barColor: 'bg-purple-500/80' },
                  { disease: 'General Fever / Influenza', count: 2, share: 20, barColor: 'bg-blue-500/80' },
                  { disease: 'Cardiac / Hypertension', count: 1, share: 10, barColor: 'bg-amber-500/80' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-32 truncate text-slate-600 font-medium">{item.disease}</span>
                    <div className="flex-1 bg-slate-100 h-4 rounded overflow-hidden relative">
                      <div className={`h-full ${item.barColor}`} style={{ width: `${item.share}%` }} />
                      <span className="absolute inset-y-0 left-2 flex items-center text-[10px] text-slate-800 font-bold font-mono">
                        {item.count} Cases
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segment 2: Bottlenecks & Smart Controls */}
      {activeSegment === 'bottlenecks' && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">🚨 Smart Patient Flow Bottleneck & Contingency Triggers</h3>
            <p className="text-xs text-slate-500 mt-1">
              Real-time monitor calculates queues at primary, sub-center, and mobile wellness desks. Trigger backups immediately to bypass gridlocks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Facility Load Table */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Facility Loading Status</h4>
              <div className="space-y-3">
                {/* Facility 1 */}
                <div className="border border-slate-100 p-3.5 rounded-lg bg-slate-50/50 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <h5 className="font-bold text-slate-800">Naugaon Primary Health Centre (PHC)</h5>
                    <p className="text-[10px] text-slate-500 mt-1">Clinic load: <span className="text-slate-700 font-bold">12 Patients/hr</span> • Duty physician: <span className="font-bold">Dr. Ramesh Kumar</span></p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black border px-2 py-0.5 rounded-full ${
                      extraDoctorActive 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                        : 'bg-red-100 text-red-800 border-red-200 animate-pulse'
                    }`}>
                      {extraDoctorActive ? 'Normal Load' : '🚨 Overload (26m Wait)'}
                    </span>
                  </div>
                </div>

                {/* Facility 2 */}
                <div className="border border-slate-100 p-3.5 rounded-lg bg-slate-50/50 flex justify-between items-center text-xs font-semibold">
                  <div>
                    <h5 className="font-bold text-slate-800">Naugaon Sub-centre Dispensary</h5>
                    <p className="text-[10px] text-slate-500 mt-1">Clinic load: <span className="text-slate-700 font-bold">4 Patients/hr</span> • Duty paramedic: <span className="font-bold">Ananya Jena</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black border border-emerald-200 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Normal Load (4m Wait)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Trigger Module */}
            <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                  <Sparkles size={11} className="fill-emerald-400" /> AI-Assisted Dispatch Intervention
                </span>
                <h4 className="font-black text-white text-sm">Contingency Backup Physician Routing</h4>
                <p className="text-xs text-slate-300 leading-normal">
                  Average wait times at Naugaon PHC crossed the safety ceiling of <span className="font-semibold text-white">20 minutes</span>. Gemini AI proposes activating our digital pool of reserve tele-physicians (e.g. Dr. Pramila Das) to immediately handle triaged lower-risk outpatient teleconsultations, freeing local physical resources!
                </p>
              </div>

              <div className="pt-2">
                {extraDoctorActive ? (
                  <div className="bg-emerald-950 border border-emerald-800 p-3 rounded-lg text-emerald-300 text-xs flex items-center gap-2 font-bold shadow-xs">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Emergency Tele-physician Desk Activated! Waiting queue load dropped to 8 minutes.</span>
                  </div>
                ) : (
                  <button
                    onClick={onRelieveBottleneck}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-1 shadow-md transition-colors"
                  >
                    🚀 Trigger Tele-Physician Relief Backup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segment 3: Inter-facility Specialist Referrals Tracker */}
      {activeSegment === 'referrals' && (
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">🔄 Inter-Facility Referral Tracking System (EHR-Linked)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tracks high-risk outpatient referrals from rural sub-centres/PHCs up to secondary Community Health Centres (CHCs) and Cuttack District Tertiary Hospital, ensuring patients complete their follow-up loops.
            </p>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">No outbound active specialist referrals recorded.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referrals.map((ref) => (
                <div key={ref.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between gap-3 text-xs font-semibold">
                  <div>
                    <div className="flex justify-between items-start mb-2 border-b border-slate-100/60 pb-1.5">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{ref.patientName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">Referral ID: {ref.id}</span>
                      </div>
                      <span className={`text-[9px] font-black border px-2 py-0.5 rounded-full ${
                        ref.urgency === 'Emergency' 
                          ? 'bg-red-100 text-red-800 border-red-200 animate-pulse' 
                          : ref.urgency === 'Urgent' 
                          ? 'bg-orange-100 text-orange-800 border-orange-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {ref.urgency} Urgency
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-600 text-[11px]">
                      <p className="flex items-center gap-1">
                        <MapPin size={10} className="text-slate-400" />
                        From <span className="font-bold text-slate-700">{ref.sourceFacility}</span> to <span className="font-bold text-slate-800">{ref.destinationFacility}</span>
                      </p>
                      <p>Required Clinic: <span className="font-bold text-slate-800">{ref.specialtyRequired}</span></p>
                      <p className="text-slate-500 italic">"Reason: {ref.reason}"</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-100/60 text-[10px] font-bold">
                    <span className="text-slate-400 uppercase tracking-wider">Referral Status:</span>
                    <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      {ref.status} (In Transit)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
