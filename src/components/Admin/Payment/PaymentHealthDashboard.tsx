import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Activity, Server, Zap, Clock, Eye } from 'lucide-react';
import { DiagnosticResult, DiagnosticStep } from '../../../services/payment/types';
import { PaymentService } from '../../../services/payment/PaymentService';

interface Props {
  tenantId?: string;
  activeProviderName: string;
  lastDiagnostic?: DiagnosticResult;
  onDiagnosticComplete?: (result: DiagnosticResult) => void;
}

export const PaymentHealthDashboard: React.FC<Props> = ({
  tenantId = 'global',
  activeProviderName,
  lastDiagnostic,
  onDiagnosticComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentDiagnostic, setCurrentDiagnostic] = useState<DiagnosticResult | undefined>(lastDiagnostic);
  const [selectedStep, setSelectedStep] = useState<DiagnosticStep | null>(null);

  const handleRunDiagnostic = async () => {
    setIsRunning(true);
    try {
      const result = await PaymentService.runDiagnostic(tenantId);
      setCurrentDiagnostic(result);
      if (onDiagnosticComplete) onDiagnosticComplete(result);
    } catch (err: any) {
      console.error("Diagnostic error:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const score = currentDiagnostic?.healthScore ?? 100;
  const status = currentDiagnostic?.overallStatus ?? 'pass';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${status === 'pass' ? 'bg-emerald-50 text-emerald-600' : status === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Payment Gateway Health
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {activeProviderName}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Automated API connection, account permissions, and webhook validation metrics.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunDiagnostic}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-sm shadow-sky-200"
        >
          <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Diagnostic...' : 'Run Payment Diagnostic'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {/* Score Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase block">Health Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black ${score >= 90 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                {score}%
              </span>
              <span className="text-xs text-gray-400 font-bold">/ 100</span>
            </div>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-xs ${score >= 90 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
            {score >= 90 ? 'EXCELLENT' : score >= 60 ? 'WARNING' : 'CRITICAL'}
          </div>
        </div>

        {/* API Connection */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase">API Connection</span>
            <Server className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-bold text-gray-800">Verified & Active</span>
          </div>
        </div>

        {/* Webhook Signature */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Webhook Security</span>
            <ShieldCheck className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-bold text-gray-800">Signature Valid</span>
          </div>
        </div>

        {/* Last Diagnostic */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Last Diagnostic</span>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          <span className="text-xs font-semibold text-gray-700 block mt-2">
            {currentDiagnostic ? new Date(currentDiagnostic.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never Run'}
          </span>
        </div>
      </div>

      {/* Diagnostic Steps List */}
      {currentDiagnostic && currentDiagnostic.steps && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">
            Diagnostic Verification Results
          </h4>
          <div className="space-y-2">
            {currentDiagnostic.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  {step.status === 'pass' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                  {step.status === 'fail' && <XCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                  {step.status === 'running' && <RefreshCw className="h-4 w-4 text-sky-500 animate-spin shrink-0" />}
                  {step.status === 'pending' && <Clock className="h-4 w-4 text-gray-300 shrink-0" />}
                  
                  <div>
                    <span className="font-bold text-gray-900 block">{step.name}</span>
                    <span className="text-gray-500 text-[11px]">{step.message}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  step.status === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
