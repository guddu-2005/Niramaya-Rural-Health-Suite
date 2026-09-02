import React from 'react';
import { Play, ArrowRight, CheckCircle2, Award, Sparkles } from 'lucide-react';

interface TourGuideProps {
  currentStep: number;
  setStep: (step: number) => void;
  setRole: (role: 'patient' | 'doctor' | 'lab' | 'pharmacy' | 'admin') => void;
  setTriageSymptoms?: (symptoms: string) => void;
  setActivePatientId?: (id: string) => void;
}

export const TourGuide: React.FC<TourGuideProps> = ({
  currentStep,
  setStep,
  setRole,
  setTriageSymptoms,
  setActivePatientId,
}) => {
  const steps = [
    {
      num: 1,
      title: 'AI Digital Triage',
      role: 'patient' as const,
      desc: 'Symptom intake for rural patient Gagan Behera.',
      actionLabel: 'Go to Patient Triage',
      setup: () => {
        setRole('patient');
        if (setTriageSymptoms) setTriageSymptoms('Constant dry mouth, extreme thirst, and mild dizziness in the morning for the last week.');
        if (setActivePatientId) setActivePatientId('P-101');
      }
    },
    {
      num: 2,
      title: 'Analyze Symptoms',
      role: 'patient' as const,
      desc: 'Run the Gemini AI Risk Assessment & next steps.',
      actionLabel: 'Review AI Triage Risk',
      setup: () => {
        setRole('patient');
        if (setActivePatientId) setActivePatientId('P-101');
      }
    },
    {
      num: 3,
      title: 'Queue & Booking',
      role: 'patient' as const,
      desc: 'Book OPD slot at Naugaon PHC & check Token Wait time.',
      actionLabel: 'Check Token Wait Queue',
      setup: () => {
        setRole('patient');
      }
    },
    {
      num: 4,
      title: 'Doctor Consultation',
      role: 'doctor' as const,
      desc: 'Open patient summary & check the AI Doctor Assistant brief.',
      actionLabel: 'Switch to Doctor Panel',
      setup: () => {
        setRole('doctor');
        if (setActivePatientId) setActivePatientId('P-101');
      }
    },
    {
      num: 5,
      title: 'Clinical Orders',
      role: 'doctor' as const,
      desc: 'E-Prescribe Metformin, order HbA1c test & create Cardiologist referral.',
      actionLabel: 'Issue Medical Orders',
      setup: () => {
        setRole('doctor');
        if (setActivePatientId) setActivePatientId('P-101');
      }
    },
    {
      num: 6,
      title: 'Lab Sample Intake',
      role: 'lab' as const,
      desc: 'Technician registers QR sample & marks Processing.',
      actionLabel: 'Switch to Lab Technician',
      setup: () => {
        setRole('lab');
      }
    },
    {
      num: 7,
      title: 'AI Test Report',
      role: 'lab' as const,
      desc: 'Enter results (HbA1c: 8.5%), run AI interpretation & publish report.',
      actionLabel: 'Generate AI Report Interpretation',
      setup: () => {
        setRole('lab');
      }
    },
    {
      num: 8,
      title: 'Pharmacy Dispatch',
      role: 'pharmacy' as const,
      desc: 'Pharmacist reviews prescription & marks available drugs.',
      actionLabel: 'Switch to Pharmacy Store',
      setup: () => {
        setRole('pharmacy');
      }
    },
    {
      num: 9,
      title: 'Inventory Decrement',
      role: 'pharmacy' as const,
      desc: 'Dispense medicines, subtracting from inventory stock.',
      actionLabel: 'Dispense & Deduct Stock',
      setup: () => {
        setRole('pharmacy');
      }
    },
    {
      num: 10,
      title: 'Admin Analytics',
      role: 'admin' as const,
      desc: 'Monitor health KPIs, bottlenecks, stock alerts & specialty referrals.',
      actionLabel: 'Switch to Facility Admin',
      setup: () => {
        setRole('admin');
      }
    }
  ];

  const currentStepData = steps.find(s => s.num === currentStep) || steps[0];

  const handleExecuteAction = () => {
    currentStepData.setup();
  };

  const handleNext = () => {
    if (currentStep < 10) {
      const nextNum = currentStep + 1;
      setStep(nextNum);
      steps.find(s => s.num === nextNum)?.setup();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prevNum = currentStep - 1;
      setStep(prevNum);
      steps.find(s => s.num === prevNum)?.setup();
    }
  };

  return (
    <div id="tour-guide-root" className="bg-emerald-50 border-b border-emerald-100 p-4 md:py-3 md:px-6 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Header Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
            <Award size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Demo Walkthrough</span>
              <span className="flex items-center gap-0.5 text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full font-medium">
                <Sparkles size={8} /> Interactive
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-800">10-Step Rural Patient Journey</h2>
          </div>
        </div>

        {/* Steps Progress Visualizer */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => {
                setStep(s.num);
                s.setup();
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                s.num === currentStep
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 ring-offset-1 scale-110'
                  : s.num < currentStep
                  ? 'bg-emerald-200 text-emerald-800'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {s.num < currentStep ? <CheckCircle2 size={12} className="text-emerald-700" /> : s.num}
            </button>
          ))}
        </div>

        {/* Active Step Panel */}
        <div className="flex-1 max-w-md bg-white border border-emerald-200 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.25 rounded">
                Step {currentStep}/10
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {currentStepData.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-tight mt-1">
              {currentStepData.desc}
            </p>
          </div>

          <button
            onClick={handleExecuteAction}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors shadow-xs shrink-0"
          >
            <Play size={10} fill="currentColor" />
            {currentStepData.actionLabel}
          </button>
        </div>

        {/* Next/Prev Navigation */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            disabled={currentStep === 1}
            onClick={handlePrev}
            className="px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            disabled={currentStep === 10}
            onClick={handleNext}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next Step <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
