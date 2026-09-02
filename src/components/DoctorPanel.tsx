import React, { useState } from 'react';
import { 
  Users, Stethoscope, Beaker, Pill, ArrowRight, Activity, 
  Plus, Trash2, Heart, ShieldAlert, Sparkles, RefreshCw, Send, CheckCircle2, Calendar
} from 'lucide-react';
import { Appointment, PatientProfile, Consultation, PrescriptionItem, LabTestOrder, ReferralItem } from '../types';

interface DoctorPanelProps {
  appointments: Appointment[];
  patients: PatientProfile[];
  consultations: Consultation[];
  doctors: any[];
  onCompleteConsultation: (data: any) => Promise<void>;
  notifications: any[];
}

export const DoctorPanel: React.FC<DoctorPanelProps> = ({
  appointments,
  patients,
  consultations,
  doctors,
  onCompleteConsultation,
  notifications
}) => {
  const [activeAppointmentId, setActiveAppointmentId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('D-201'); // Dr. Ramesh Kumar by default
  
  // AI summary states
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  // Consultation Form State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptomsInput, setSymptomsInput] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  // Vitals
  const [vitalBp, setVitalBp] = useState('120/80');
  const [vitalPulse, setVitalPulse] = useState('72');
  const [vitalTemp, setVitalTemp] = useState('98.6');
  const [vitalWeight, setVitalWeight] = useState('65');

  // Medicines List Builder
  const [medicines, setMedicines] = useState<Omit<PrescriptionItem, 'id' | 'status'>[]>([]);
  const [medName, setMedName] = useState('');
  const [medGeneric, setMedGeneric] = useState('');
  const [medDose, setMedDose] = useState('500mg');
  const [medRoute, setMedRoute] = useState('Oral');
  const [medFreq, setMedFreq] = useState('Twice daily');
  const [medDur, setMedDur] = useState('5 days');
  const [medInstr, setMedInstr] = useState('Take after meals');

  // Lab Tests Selector
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);

  // Referral State
  const [wantReferral, setWantReferral] = useState(false);
  const [refDestination, setRefDestination] = useState('Jagatsinghpur Community Health Centre (CHC)');
  const [refSpecialty, setRefSpecialty] = useState('Pediatrician');
  const [refReason, setRefReason] = useState('');
  const [refUrgency, setRefUrgency] = useState<'Routine' | 'Urgent' | 'Emergency'>('Routine');

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
  
  // Active queue for this doctor
  const doctorQueue = appointments.filter(a => a.doctorId === selectedDoctorId && a.status !== 'Completed' && a.status !== 'Cancelled');
  const activeApp = appointments.find(a => a.id === activeAppointmentId);
  const activePatient = activeApp ? patients.find(p => p.id === activeApp.patientId) : null;

  const handleAddMedicine = () => {
    if (!medName || !medGeneric) {
      alert('Please enter medicine name and generic name.');
      return;
    }
    setMedicines([...medicines, {
      medicineName: medName,
      genericName: medGeneric,
      dose: medDose,
      route: medRoute,
      frequency: medFreq,
      duration: medDur,
      instructions: medInstr
    }]);

    // Reset fields
    setMedName('');
    setMedGeneric('');
    setMedInstr('Take after meals');
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleLabToggle = (test: string) => {
    if (selectedLabs.includes(test)) {
      setSelectedLabs(selectedLabs.filter(t => t !== test));
    } else {
      setSelectedLabs([...selectedLabs, test]);
    }
  };

  const generateAiPatientSummary = async (patientId: string) => {
    setAiSummaryLoading(true);
    setAiSummary('');
    try {
      const response = await fetch('/api/ai/summarize-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId })
      });
      const data = await response.json();
      setAiSummary(data.summary || 'Summary could not be parsed.');
    } catch (e) {
      console.error(e);
      setAiSummary('Failed to connect to AI summary backend.');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleOpenPatientWorkspace = (app: Appointment) => {
    setActiveAppointmentId(app.id);
    setChiefComplaint(app.specialty === 'Gynecologist' ? 'Regular prenatal follow-up.' : 'Fever, cough, and body aches for 3 days.');
    setSymptomsInput(app.specialty === 'Gynecologist' ? 'Pregnancy signs, mild back stiffness' : 'Fever, dry cough, body aches');
    setDiagnosis('');
    setTreatmentPlan('');
    setMedicines([]);
    setSelectedLabs([]);
    setWantReferral(false);
    setAiSummary('');
    generateAiPatientSummary(app.patientId);
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !activeApp) return;

    const prescriptionItems: PrescriptionItem[] = medicines.map((m, idx) => ({
      id: `Rx-${Math.floor(100 + Math.random() * 900)}-${idx}`,
      ...m,
      status: 'Pending'
    }));

    const labOrdersArray: LabTestOrder[] = selectedLabs.map((l, idx) => ({
      id: `L-${Math.floor(8000 + Math.random() * 2000)}-${idx}`,
      testName: l,
      status: 'Ordered'
    }));

    let referralObj: ReferralItem | undefined = undefined;
    if (wantReferral) {
      referralObj = {
        id: `REF-${Math.floor(700 + Math.random() * 300)}`,
        patientId: activePatient.id,
        patientName: activePatient.name,
        sourceFacility: selectedDoctor.facility,
        destinationFacility: refDestination,
        specialtyRequired: refSpecialty,
        reason: refReason,
        clinicalSummary: diagnosis || chiefComplaint,
        urgency: refUrgency,
        status: 'Created'
      };
    }

    const consultData = {
      appointmentId: activeApp.id,
      patientId: activePatient.id,
      doctorId: selectedDoctorId,
      doctorName: selectedDoctor.name,
      facility: selectedDoctor.facility,
      chiefComplaint,
      symptoms: symptomsInput ? symptomsInput.split(',').map(s => s.trim()) : [],
      vitals: {
        bp: vitalBp,
        weight: vitalWeight + ' kg',
        pulse: vitalPulse + ' bpm',
        temp: vitalTemp + ' F'
      },
      diagnosis,
      treatmentPlan,
      prescription: prescriptionItems,
      labOrders: labOrdersArray,
      referral: referralObj,
      followUpDate: followUpDate || undefined
    };

    try {
      await onCompleteConsultation(consultData);
      alert('Consultation updated successfully! E-Prescriptions and Lab orders dispatched.');
      setActiveAppointmentId('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit consultation.');
    }
  };

  const handleQuickPreset = (type: string) => {
    if (type === 'diabetes') {
      setDiagnosis('Type 2 Diabetes Mellitus - Uncontrolled Hyperglycemia');
      setTreatmentPlan('Advised low glycemic diet, daily brisk walking, and medication adherence. Review in 15 days.');
      setMedicines([
        { medicineName: 'Metformin Hydrochloride', genericName: 'Metformin', dose: '500mg', route: 'Oral', frequency: 'Twice daily', duration: '30 days', instructions: 'Take with major meals' }
      ]);
      setSelectedLabs(['Fasting Blood Glucose', 'HbA1c Profile']);
    } else if (type === 'pregnancy') {
      setDiagnosis('Regular Intrauterine Pregnancy (24 Weeks) - Stable Status');
      setTreatmentPlan('Advised high iron diet, plenty of hydration, and routine vaccinations. Sleep on the left side.');
      setMedicines([
        { medicineName: 'Iron-Folic Acid (IFA)', genericName: 'Iron-Folic Acid', dose: '100mg elemental Iron', route: 'Oral', frequency: 'Once daily', duration: '90 days', instructions: 'Take on empty stomach with water' },
        { medicineName: 'Calcium Carbonate', genericName: 'Calcium', dose: '500mg', route: 'Oral', frequency: 'Once daily', duration: '90 days', instructions: 'Take with milk or lunch' }
      ]);
      setSelectedLabs(['Complete Urine Analysis']);
    }
  };

  return (
    <div id="doctor-panel-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Queue & Doctor Selector */}
      <div className="lg:col-span-1 space-y-6">
        {/* Doctor Identity Selector */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Change Consulting Physician</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              setActiveAppointmentId('');
            }}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300 font-semibold text-slate-800"
          >
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
            ))}
          </select>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mt-3 text-[11px] text-slate-500">
            <span className="font-bold text-slate-700 block mb-0.5">Current Facility:</span>
            <span>{selectedDoctor.facility}</span>
          </div>
        </div>

        {/* Doctor Queue Queue */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-slate-500" /> Wait Queue
            </h3>
            <span className="text-[10px] bg-slate-900 text-white font-black px-2 py-0.5 rounded-full">
              {doctorQueue.length} Pending
            </span>
          </div>

          {doctorQueue.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">All patients cleared. No active queue.</p>
          ) : (
            <div className="space-y-2.5">
              {doctorQueue.map((app) => (
                <div 
                  key={app.id}
                  className={`border p-3 rounded-lg text-left text-xs transition-all cursor-pointer ${
                    app.id === activeAppointmentId 
                      ? 'border-slate-800 bg-slate-50/80 ring-1 ring-slate-800' 
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                  onClick={() => handleOpenPatientWorkspace(app)}
                >
                  <div className="flex justify-between items-center font-bold text-slate-800 mb-1">
                    <span>{app.patientName}</span>
                    <span className="bg-slate-200 text-slate-700 px-1.5 py-0.25 rounded text-[9px] font-mono">
                      Token {app.tokenNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 text-[10px]">
                    <span>Slot: {app.timeSlot}</span>
                    <span className="font-semibold text-emerald-600 uppercase tracking-wider">{app.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="lg:col-span-3 flex flex-col">
        {!activePatient ? (
          <div className="bg-white border border-slate-100 rounded-xl p-12 text-center shadow-xs flex-1 flex flex-col items-center justify-center">
            <Stethoscope size={48} className="text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">Clinical Workspace Empty</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Select a waiting patient from the token queue list on the left to open the EHR summaries and diagnostic consultation workspace.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient Header Executive Summary Card */}
            <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col md:flex-row justify-between gap-5 shadow-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block">Consultation Active</span>
                <h2 className="text-base font-black text-white mt-1">{activePatient.name}</h2>
                <p className="text-xs text-slate-300 mt-0.5">{activePatient.age} yrs • {activePatient.gender} • Blood Group {activePatient.bloodGroup}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  <span className="font-bold text-red-400">Allergies:</span> {activePatient.allergies.join(', ') || 'No reported allergies'}
                </p>
              </div>

              {/* Patient Timeline Briefing / AI Assistant Summary */}
              <div className="flex-1 max-w-lg bg-slate-800 border border-slate-700 rounded-lg p-3.5 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles size={11} className="fill-emerald-400" /> AI Doctor Assistant Brief
                  </span>
                  <button 
                    onClick={() => generateAiPatientSummary(activePatient.id)}
                    disabled={aiSummaryLoading}
                    className="text-[9px] text-slate-400 hover:text-white flex items-center gap-0.5 font-bold"
                  >
                    <RefreshCw size={8} className={aiSummaryLoading ? 'animate-spin' : ''} /> Refresh
                  </button>
                </div>

                {aiSummaryLoading ? (
                  <p className="text-[10px] text-slate-400 animate-pulse py-2">Summarizing historical consultations and active prescriptions via Gemini...</p>
                ) : aiSummary ? (
                  <p className="text-[11px] text-slate-300 leading-relaxed italic">
                    "{aiSummary}"
                  </p>
                ) : (
                  <button 
                    onClick={() => generateAiPatientSummary(activePatient.id)}
                    className="text-[10px] bg-slate-700 text-white font-bold py-1 px-3 rounded hover:bg-slate-600 mt-2"
                  >
                    Generate AI Executive Brief
                  </button>
                )}
              </div>
            </div>

            {/* Quick Presets for Demo */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700">Demo Presets:</h4>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Accelerate your hackathon testing with standard clinical workflows.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('diabetes')}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xs"
                >
                  🍭 Diabetes Clinical Preset
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset('pregnancy')}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xs"
                >
                  🤰 Pregnancy / IFA Preset
                </button>
              </div>
            </div>

            {/* Structured consultation worksheet form */}
            <form onSubmit={handleSubmitConsultation} className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Clinical Examination & Record Entry</h3>

              {/* Chief complaint & vitals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Chief Complaint *</label>
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="e.g. Extreme thirst, dry mouth, blurred vision"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Symptoms (comma separated) *</label>
                  <input
                    type="text"
                    value={symptomsInput}
                    onChange={(e) => setSymptomsInput(e.target.value)}
                    placeholder="e.g. Hyperglycemia, Dizziness, Fatigue"
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                    required
                  />
                </div>
              </div>

              {/* Vitals inputs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Blood Pressure</label>
                  <input
                    type="text"
                    value={vitalBp}
                    onChange={(e) => setVitalBp(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-hidden focus:border-slate-300 text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Pulse Rate (bpm)</label>
                  <input
                    type="text"
                    value={vitalPulse}
                    onChange={(e) => setVitalPulse(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-hidden focus:border-slate-300 text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Temperature (F)</label>
                  <input
                    type="text"
                    value={vitalTemp}
                    onChange={(e) => setVitalTemp(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-hidden focus:border-slate-300 text-center font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase">Weight (kg)</label>
                  <input
                    type="text"
                    value={vitalWeight}
                    onChange={(e) => setVitalWeight(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 outline-hidden focus:border-slate-300 text-center font-bold"
                  />
                </div>
              </div>

              {/* Diagnosis and Treatment Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Clinical Diagnosis *</label>
                  <textarea
                    rows={2}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Primary diagnostic assessment..."
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Treatment Plan / Lifestyle Advice *</label>
                  <textarea
                    rows={2}
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    placeholder="Advise on diet, physical activity, etc."
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                    required
                  />
                </div>
              </div>

              {/* Lab Diagnostics orders checklist */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Beaker size={14} className="text-indigo-600" /> Order Laboratory Investigations
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {['Fasting Blood Glucose', 'HbA1c Profile', 'Complete Blood Count (CBC)', 'Complete Urine Analysis', 'Liver Function Test (LFT)'].map((test) => (
                    <button
                      type="button"
                      key={test}
                      onClick={() => handleLabToggle(test)}
                      className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        selectedLabs.includes(test)
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {selectedLabs.includes(test) ? '✓ ' : '+ '} {test}
                    </button>
                  ))}
                </div>
              </div>

              {/* E-Prescription Builder */}
              <div className="space-y-3.5 border-t border-slate-100 pt-4">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Pill size={14} className="text-emerald-600" /> E-Prescription Builder (Digital Dispensary Link)
                </label>

                {/* Grid Inputs to Add Medicine */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <input
                    type="text"
                    placeholder="Brand Name (e.g. Glycomet 500)"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    className="text-xs border border-slate-200 bg-white rounded-lg p-2 outline-hidden focus:border-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Generic Name (e.g. Metformin)"
                    value={medGeneric}
                    onChange={(e) => setMedGeneric(e.target.value)}
                    className="text-xs border border-slate-200 bg-white rounded-lg p-2 outline-hidden focus:border-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Dose (e.g. 500mg, 1 tab)"
                    value={medDose}
                    onChange={(e) => setMedDose(e.target.value)}
                    className="text-xs border border-slate-200 bg-white rounded-lg p-2 outline-hidden focus:border-slate-300"
                  />
                  <select
                    value={medRoute}
                    onChange={(e) => setMedRoute(e.target.value)}
                    className="text-xs border border-slate-200 bg-white rounded-lg p-2 outline-hidden focus:border-slate-300 font-semibold text-slate-700"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Injection">Injection</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Topical">Topical</option>
                  </select>

                  <select
                    value={medFreq}
                    onChange={(e) => setMedFreq(e.target.value)}
                    className="text-xs border border-slate-200 bg-white rounded-lg p-2 outline-hidden focus:border-slate-300 font-semibold text-slate-700"
                  >
                    <option value="Once daily">Once daily (1-0-0)</option>
                    <option value="Twice daily">Twice daily (1-0-1)</option>
                    <option value="Thrice daily">Thrice daily (1-1-1)</option>
                    <option value="As needed">As needed (PRN)</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Duration (e.g. 30 days)"
                    value={medDur}
                    onChange={(e) => setMedDur(e.target.value)}
                    className="text-xs border border-slate-200 bg-white rounded-lg p-2 outline-hidden focus:border-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Special Instructions..."
                    value={medInstr}
                    onChange={(e) => setMedInstr(e.target.value)}
                    className="text-xs border border-slate-200 bg-white rounded-lg p-2 sm:col-span-2 outline-hidden focus:border-slate-300"
                  />

                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 sm:col-span-4 shadow-xs"
                  >
                    <Plus size={14} /> Append Prescribed Medication
                  </button>
                </div>

                {/* Added Medicines List */}
                {medicines.length > 0 && (
                  <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold border-b border-slate-100">
                          <th className="p-2">MEDICINE & GENERIC</th>
                          <th className="p-2">DOSE & ROUTE</th>
                          <th className="p-2">FREQUENCY & DURATION</th>
                          <th className="p-2">INSTRUCTIONS</th>
                          <th className="p-2 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicines.map((m, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-0 font-semibold text-slate-700">
                            <td className="p-2 font-bold">{m.medicineName} <span className="text-[10px] text-slate-400 font-normal block">({m.genericName})</span></td>
                            <td className="p-2">{m.dose} • {m.route}</td>
                            <td className="p-2">{m.frequency} for {m.duration}</td>
                            <td className="p-2 text-slate-500 italic">"{m.instructions}"</td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveMedicine(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Specialist Referral Card Toggle */}
              <div className="border-t border-slate-100 pt-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <ShieldAlert size={14} className="text-amber-500" /> Specialist Outpatient Referral Referral
                  </label>
                  <button
                    type="button"
                    onClick={() => setWantReferral(!wantReferral)}
                    className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                      wantReferral 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {wantReferral ? 'Active' : 'Add Referral'}
                  </button>
                </div>

                {wantReferral && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/20 p-4 rounded-xl border border-amber-100 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-amber-850">Referral Destination Facility:</label>
                      <select
                        value={refDestination}
                        onChange={(e) => setRefDestination(e.target.value)}
                        className="w-full border border-amber-200 bg-white rounded-lg p-2 outline-hidden text-slate-800 font-semibold"
                      >
                        <option value="Jagatsinghpur Community Health Centre (CHC)">Jagatsinghpur CHC (CHC)</option>
                        <option value="Cuttack District Hospital">Cuttack District Hospital (District Hospital)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-amber-850">Required Specialty Clinic:</label>
                      <select
                        value={refSpecialty}
                        onChange={(e) => setRefSpecialty(e.target.value)}
                        className="w-full border border-amber-200 bg-white rounded-lg p-2 outline-hidden text-slate-800 font-semibold"
                      >
                        <option value="Gynecologist">Obstetrics & Gynecology</option>
                        <option value="Pediatrician">Pediatric Medicine</option>
                        <option value="Cardiologist">Cardiology</option>
                        <option value="Dermatologist">Dermatology & Skin</option>
                        <option value="Orthopedic Surgeon">Orthopedics</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-bold text-amber-850">Reason for Out-Referral *</label>
                      <input
                        type="text"
                        value={refReason}
                        onChange={(e) => setRefReason(e.target.value)}
                        placeholder="e.g. Advanced diabetic retinopathy or coronary angiography evaluation required."
                        className="w-full border border-amber-200 bg-white rounded-lg p-2.5 outline-hidden focus:border-amber-300"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-amber-850">Urgency Level:</label>
                      <div className="flex gap-2">
                        {['Routine', 'Urgent', 'Emergency'].map((urg) => (
                          <button
                            type="button"
                            key={urg}
                            onClick={() => setRefUrgency(urg as any)}
                            className={`flex-1 py-1.5 rounded font-bold border ${
                              refUrgency === urg
                                ? 'bg-amber-600 text-white border-amber-500'
                                : 'bg-white text-amber-700 border-amber-200'
                            }`}
                          >
                            {urg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Follow up Date Picker */}
              <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Calendar size={12} /> Scheduled Follow-Up Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-hidden"
                  />
                </div>
              </div>

              {/* Complete & Submit */}
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-1.5 shadow-md"
              >
                <CheckCircle2 size={16} /> Complete Consultation & Publish EHR Record
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
