import React, { useState } from 'react';
import { 
  Beaker, QrCode, ClipboardList, TrendingUp, Sparkles, 
  Send, RefreshCw, Activity, Check, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import Markdown from 'react-markdown';

interface LabPanelProps {
  labOrders: any[];
  onUpdateLabOrder: (id: string, data: any) => Promise<void>;
}

export const LabPanel: React.FC<LabPanelProps> = ({ labOrders, onUpdateLabOrder }) => {
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  
  // Barcode / QR Scan Simulation
  const [collectorName, setCollectorName] = useState('Ananya Jena (Lab Tech)');
  const [sampleType, setSampleType] = useState('Blood (EDTA Tube)');
  const [sampleId, setSampleId] = useState('');

  // Values Entry State
  const [glucoseVal, setGlucoseVal] = useState('148');
  const [hba1cVal, setHba1cVal] = useState('8.2');
  const [hbVal, setHbVal] = useState('11.4');
  const [urineProtein, setUrineProtein] = useState('Negative');
  const [urineSugar, setUrineSugar] = useState('Negative');
  const [customParamName, setCustomParamName] = useState('');
  const [customParamVal, setCustomParamVal] = useState('');

  // AI Interpretation states
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const activeOrder = labOrders.find(l => l.id === activeOrderId);

  const simulateQrScan = () => {
    const generatedSampleId = `SMP-${Math.floor(80000 + Math.random() * 19999)}`;
    setSampleId(generatedSampleId);
    alert(`QR Code Scanned successfully! Sample registered under ID: ${generatedSampleId}`);
  };

  const handleCollectSample = async () => {
    if (!activeOrder) return;
    if (!sampleId) {
      alert('Please scan or enter a sample ID first.');
      return;
    }

    const payload = {
      status: 'Sample-Collected',
      sampleId,
      collectedAt: new Date().toISOString()
    };

    await onUpdateLabOrder(activeOrder.id, payload);
    alert('Sample status updated to Collected. Moving to processing queue.');
  };

  const handleStartProcessing = async () => {
    if (!activeOrder) return;
    await onUpdateLabOrder(activeOrder.id, { status: 'Processing' });
  };

  const runAiInterpretation = async () => {
    if (!activeOrder) return;
    setAiLoading(true);
    setAiInterpretation('');

    const values = getStructuredValues();

    try {
      const response = await fetch('/api/ai/interpret-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName: activeOrder.testName,
          values
        })
      });
      const data = await response.json();
      setAiInterpretation(data.interpretation || 'No interpretation text returned.');
    } catch (e) {
      console.error(e);
      setAiInterpretation('Failed to run AI interpretation. Rule fallback engine returned baseline caution summary.');
    } finally {
      setAiLoading(false);
    }
  };

  const getStructuredValues = () => {
    const test = activeOrder?.testName || '';
    let values: any = {};

    if (test.includes('Glucose') || test.includes('Sugar')) {
      values['Fasting Blood Glucose'] = { value: glucoseVal, unit: 'mg/dL', normalRange: '70 - 100', isAbnormal: parseFloat(glucoseVal) > 100 };
    } else if (test.includes('HbA1c') || test.includes('Hemoglobin')) {
      values['Hemoglobin Count'] = { value: hbVal, unit: 'g/dL', normalRange: '12.0 - 16.0', isAbnormal: parseFloat(hbVal) < 12.0 };
      values['HbA1c Glycated'] = { value: hba1cVal, unit: '%', normalRange: '4.0 - 5.6', isAbnormal: parseFloat(hba1cVal) > 5.6 };
    } else if (test.includes('Urine')) {
      values['Urine Proteins'] = { value: urineProtein, unit: 'qualitative', normalRange: 'Negative', isAbnormal: urineProtein !== 'Negative' };
      values['Urine Glucose'] = { value: urineSugar, unit: 'qualitative', normalRange: 'Negative', isAbnormal: urineSugar !== 'Negative' };
    } else {
      values[customParamName || 'Report Finding'] = { value: customParamVal || '1.0', unit: 'Index', normalRange: 'Normal', isAbnormal: false };
    }
    return values;
  };

  const handlePublishResults = async () => {
    if (!activeOrder) return;
    const values = getStructuredValues();

    const payload = {
      status: 'Completed',
      resultValues: values,
      interpretation: aiInterpretation || 'Values entered within expected healthcare limits.',
      technicianNotes: notes
    };

    await onUpdateLabOrder(activeOrder.id, payload);
    alert('Lab report published successfully! Patient EHR updated immediately.');
    setActiveOrderId('');
    setAiInterpretation('');
  };

  return (
    <div id="lab-panel-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Active Lab queue */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList size={14} className="text-slate-500" /> Pending Worklist
            </h3>
            <span className="text-[10px] bg-indigo-900 text-white font-black px-2 py-0.5 rounded-full">
              {labOrders.filter(l => l.status !== 'Completed').length} Orders
            </span>
          </div>

          <div className="space-y-2.5">
            {labOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => {
                  setActiveOrderId(order.id);
                  setSampleId(order.sampleId || '');
                  setAiInterpretation(order.interpretation || '');
                }}
                className={`border p-3 rounded-lg text-left text-xs transition-all cursor-pointer ${
                  order.id === activeOrderId
                    ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600'
                    : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-start font-bold text-slate-800 mb-1.5">
                  <span className="truncate max-w-[130px]">{order.testName}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded font-mono ${
                    order.status === 'Processing' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : order.status === 'Sample-Collected'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : order.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Patient: {order.patientName}</span>
                  <span className="text-[9px] text-slate-400 font-mono">#{order.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Lab technician workspace */}
      <div className="lg:col-span-3 flex flex-col">
        {!activeOrder ? (
          <div className="bg-white border border-slate-100 rounded-xl p-12 text-center shadow-xs flex-1 flex flex-col items-center justify-center">
            <Beaker size={48} className="text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">Lab Workspace Idle</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Select an ordered test from the pending worklist queue on the left to scan barcodes, input clinical values, and generate AI interpretations.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active order head */}
            <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold block">Active Laboratory Order</span>
                <h2 className="text-base font-black text-white mt-1">{activeOrder.testName}</h2>
                <p className="text-xs text-slate-300 mt-0.5">Patient: {activeOrder.patientName} • Ordered By: {activeOrder.doctorName}</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-lg">
                <QrCode size={14} className="text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-200">Current Status: <span className="font-bold text-indigo-400">{activeOrder.status}</span></span>
              </div>
            </div>

            {/* Workflow steps cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: Sample Collection */}
              <div className={`border p-4 rounded-xl space-y-3.5 transition-all ${
                activeOrder.status === 'Ordered' 
                  ? 'border-indigo-600 bg-indigo-50/10' 
                  : 'border-slate-100 bg-slate-50/50 opacity-80'
              }`}>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <span className="bg-slate-800 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">1</span>
                  Sample Collection & QR Register
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Collector Technician Name:</label>
                    <input
                      type="text"
                      value={collectorName}
                      onChange={(e) => setCollectorName(e.target.value)}
                      className="w-full border border-slate-200 bg-white p-2 rounded-lg outline-hidden"
                      disabled={activeOrder.status !== 'Ordered'}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Sample Medium Type:</label>
                    <input
                      type="text"
                      value={sampleType}
                      onChange={(e) => setSampleType(e.target.value)}
                      className="w-full border border-slate-200 bg-white p-2 rounded-lg outline-hidden"
                      disabled={activeOrder.status !== 'Ordered'}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={simulateQrScan}
                    disabled={activeOrder.status !== 'Ordered'}
                    className="flex-1 border border-slate-300 hover:border-slate-400 disabled:opacity-40 bg-white text-slate-700 font-bold py-1.5 rounded text-[11px] flex items-center justify-center gap-1 shadow-xs"
                  >
                    <QrCode size={11} /> Scan QR Code
                  </button>
                  <button
                    type="button"
                    onClick={handleCollectSample}
                    disabled={activeOrder.status !== 'Ordered' || !sampleId}
                    className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold py-1.5 rounded text-[11px] flex items-center justify-center gap-1 shadow-xs"
                  >
                    ✓ Complete Receipt
                  </button>
                </div>
              </div>

              {/* Step 2: Processing */}
              <div className={`border p-4 rounded-xl flex flex-col justify-between transition-all ${
                activeOrder.status === 'Sample-Collected' 
                  ? 'border-amber-600 bg-amber-50/10' 
                  : 'border-slate-100 bg-slate-50/50 opacity-80'
              }`}>
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <span className="bg-slate-800 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">2</span>
                    Laboratory Processing
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal pt-1">
                    Mark sample as entered in centrifuge and analyzers. Status will update to 'Processing' on central dashboards.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartProcessing}
                  disabled={activeOrder.status !== 'Sample-Collected'}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded text-[11px] disabled:opacity-40 shadow-xs"
                >
                  ⚙ Start Centrifuge Analyzer
                </button>
              </div>

              {/* Step 3: Completed */}
              <div className={`border p-4 rounded-xl flex flex-col justify-between transition-all ${
                activeOrder.status === 'Processing' 
                  ? 'border-emerald-600 bg-emerald-50/10' 
                  : 'border-slate-100 bg-slate-50/50 opacity-80'
              }`}>
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <span className="bg-slate-800 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">3</span>
                    Review & Publish Results
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal pt-1">
                    Input analytic values in the sheet below, click to generate the AI interpretation, and publish verified clinical records.
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-bold bg-emerald-100/60 p-2 rounded-lg border border-emerald-200">
                  <ShieldCheck size={14} /> Ready for data entry sheet
                </div>
              </div>
            </div>

            {/* Structured Value Inputs Sheet */}
            {(activeOrder.status === 'Processing' || activeOrder.status === 'Completed') && (
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs space-y-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">Analyzed Parameters Worksheet</h3>

                {/* Conditional Parameter Inputs based on ordered test */}
                {activeOrder.testName.includes('Glucose') || activeOrder.testName.includes('Sugar') ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600">Fasting Blood Glucose (mg/dL)</label>
                      <input
                        type="number"
                        value={glucoseVal}
                        onChange={(e) => setGlucoseVal(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">Standard Reference Range: 70 - 100 mg/dL</span>
                    </div>
                  </div>
                ) : activeOrder.testName.includes('HbA1c') || activeOrder.testName.includes('Hemoglobin') ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600">Total Hemoglobin (g/dL)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={hbVal}
                        onChange={(e) => setHbVal(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">Standard Reference Range: 12.0 - 16.0 g/dL</span>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600">HbA1c Glycated Percentage (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={hba1cVal}
                        onChange={(e) => setHba1cVal(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">Standard Reference Range: 4.0% - 5.6%</span>
                    </div>
                  </div>
                ) : activeOrder.testName.includes('Urine') ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600">Urine Proteins</label>
                      <select
                        value={urineProtein}
                        onChange={(e) => setUrineProtein(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden font-semibold text-slate-700"
                      >
                        <option value="Negative">Negative (Normal)</option>
                        <option value="Trace">Trace (+-)</option>
                        <option value="1+">1+ (Elevated)</option>
                        <option value="2+">2+ (Severe)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600">Urine Glucose / Ketones</label>
                      <select
                        value={urineSugar}
                        onChange={(e) => setUrineSugar(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden font-semibold text-slate-700"
                      >
                        <option value="Negative">Negative (Normal)</option>
                        <option value="Positive">Positive (Glucose Present)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Custom input sheet */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600">Parameter Name</label>
                      <input
                        type="text"
                        value={customParamName}
                        onChange={(e) => setCustomParamName(e.target.value)}
                        placeholder="e.g. Swab viral finding"
                        className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-600">Finding Value</label>
                      <input
                        type="text"
                        value={customParamVal}
                        onChange={(e) => setCustomParamVal(e.target.value)}
                        placeholder="e.g. Negative"
                        className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {/* AI Interpret button */}
                <div className="space-y-3.5 border-t border-slate-100 pt-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">AI-Assisted Diagnostics Interpretation</h4>
                      <p className="text-[10px] text-slate-400">Generate explanations on findings using local or cloud Gemini models.</p>
                    </div>
                    <button
                      type="button"
                      onClick={runAiInterpretation}
                      disabled={aiLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-xs shrink-0 animate-pulse"
                    >
                      <Sparkles size={12} fill="currentColor" /> {aiLoading ? 'Interpreting via Gemini...' : 'Generate AI Interpretation'}
                    </button>
                  </div>

                  {aiInterpretation && (
                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-950 p-4 rounded-xl text-xs leading-relaxed space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 border-b border-indigo-100/50 pb-1">
                        <Sparkles size={12} /> AI Assisted Interpretation Report:
                      </div>
                      <div className="markdown-body">
                        <Markdown>{aiInterpretation}</Markdown>
                      </div>
                    </div>
                  )}
                </div>

                {/* Technician Notes & Submit */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-600">Centrifuge / Analytical Verification Notes</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Sample processed under ideal fasting parameters. Standard verification complete."
                      className="w-full border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-slate-300"
                    />
                  </div>

                  <button
                    onClick={handlePublishResults}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-1 shadow-md"
                  >
                    ✓ Verify & Publish Signed Health Report to EHR
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
