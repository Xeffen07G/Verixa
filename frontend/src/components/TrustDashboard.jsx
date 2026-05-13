import React from 'react';
import { ShieldAlert, CheckCircle, Info, HelpCircle } from 'lucide-react';

/**
 * TrustDashboard component to display system confidence, 
 * hallucination warnings, and citation verification status.
 */
const TrustDashboard = ({ confidenceScore, sourceCount, status = 'verified' }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-verixa-surface border border-verixa-border rounded-xl p-6 mb-6 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-verixa-text2">Intelligence Trust Layer</h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${status === 'verified' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-verixa-text3 mb-1">Evidence Confidence</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-serif ${getScoreColor(confidenceScore)}`}>{confidenceScore}</span>
            <span className="text-sm text-verixa-text3">%</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-verixa-text3 mb-1">Grounded Sources</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif text-verixa-text">{sourceCount}</span>
            <span className="text-sm text-verixa-text3">citations</span>
          </div>
        </div>
      </div>

      {confidenceScore < 70 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400 leading-relaxed">
            <span className="font-bold">Hallucination Warning:</span> Insufficient evidence retrieved. Probabilistic estimation active. Use results with caution.
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-4">
        <div className="flex items-center gap-1.5 text-[10px] text-verixa-text3">
          <CheckCircle className="w-3 h-3" />
          <span>Section-Aware Retrieval</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-verixa-text3">
          <Info className="w-3 h-3" />
          <span>Cross-Ref Verified</span>
        </div>
      </div>
    </div>
  );
};

export default TrustDashboard;
