import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, Sheet, Map, Calculator, DollarSign, CheckCircle2, Circle, School } from 'lucide-react';
import { AnalysisResult } from '../types';

interface ResultsDisplayProps {
  result: AnalysisResult;
  sources: { uri: string; title: string }[];
  onAddToComparison?: () => void;
  isSaved?: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, sources, onAddToComparison, isSaved }) => {
  
  // State for checkbox selections
  const [selectedTransferIndices, setSelectedTransferIndices] = useState<Set<number>>(new Set());
  const [selectedSummerIndices, setSelectedSummerIndices] = useState<Set<number>>(new Set());

  // Initialize selections when result changes
  useEffect(() => {
    const allTransfer = new Set(result.credits.map((_, i) => i));
    setSelectedTransferIndices(allTransfer);
    setSelectedSummerIndices(new Set());
  }, [result]);

  const toggleTransfer = (index: number) => {
    const newSet = new Set(selectedTransferIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedTransferIndices(newSet);
  };

  const toggleSummer = (index: number) => {
    const newSet = new Set(selectedSummerIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedSummerIndices(newSet);
  };

  // Helper to safely parse credit string to number
  const parseCredit = (val: string | number | undefined): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const match = String(val).match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  };

  // --- Dynamic Calculations ---
  
  // 1. Earned Credits
  const earnedTransfer = result.credits.reduce((sum, item, idx) => {
    return selectedTransferIndices.has(idx) ? sum + parseCredit(item.creditHours) : sum;
  }, 0);

  const earnedSummer = (result.summerRecommendations || []).reduce((sum, item, idx) => {
    return selectedSummerIndices.has(idx) ? sum + parseCredit(item.creditHours) : sum;
  }, 0);

  const totalEarned = earnedTransfer + earnedSummer;

  // 2. Degree Requirements
  const degreeTotal = result.degreeTotalCredits || 120; // Default to 120 if missing
  const remainingCredits = Math.max(0, degreeTotal - totalEarned);
  const progressPercent = Math.min(100, (totalEarned / degreeTotal) * 100);

  // 3. Financials
  const costPerCredit = result.estimatedCostPerCredit || 0;
  const moneySaved = totalEarned * costPerCredit;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const downloadCSV = () => {
    const headers = ["Activity/Source", "Equivalent University Course", "Credit Hours", "Notes", "Status"];
    
    const transferRows = result.credits.map((c, i) => [
      `"${c.activity}"`,
      `"${c.universityCourse}"`,
      c.creditHours,
      `"${c.notes}"`,
      selectedTransferIndices.has(i) ? "Included" : "Excluded"
    ]);

    const summerRows = (result.summerRecommendations || []).map((c, i) => [
        `"SUMMER: ${c.ccCourse}"`,
        `"${c.universityEquivalent}"`,
        c.creditHours,
        `"${c.reason}"`,
        selectedSummerIndices.has(i) ? "Included" : "Excluded"
    ]);
    
    const rows = [...transferRows, ...summerRows];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "credit_transfer_plan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* --- Prominent University Header (New) --- */}
      <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <School className="w-8 h-8 text-indigo-300" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    {result.canonicalUniversityName || "Target University"}
                </h1>
                <p className="text-indigo-200 text-sm font-medium">Credit Transfer & Degree Plan Analysis</p>
            </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-lg border border-white/10 flex flex-col items-end">
            <span className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Total Projected Credits</span>
            <span className="text-3xl font-bold text-white">{totalEarned}</span>
        </div>
      </div>

      {/* --- Section 1: Detailed Breakdown Metrics --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Metric 1: Degree Progress / Remaining Requirements */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
           <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
              <Circle className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Degree Requirements Breakdown</span>
          </div>
          
          <div className="space-y-4">
             {/* Formula Visualization */}
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Required for Degree</span>
                <span className="font-semibold text-slate-800">{degreeTotal} Credits</span>
             </div>
             
             <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-indigo-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Transfer / AP</span>
                    <span className="font-medium text-slate-700">-{earnedTransfer}</span>
                 </div>
                 {earnedSummer > 0 && (
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-teal-600 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Summer Classes</span>
                        <span className="font-medium text-slate-700">-{earnedSummer}</span>
                     </div>
                 )}
             </div>

             <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800">Remaining Needed</span>
                <span className="font-bold text-xl text-amber-600">{remainingCredits} Credits</span>
             </div>
             
             {/* Progress Bar */}
             <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Financial Savings */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-6 -mt-6 opacity-60"></div>
           <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 relative z-10">
            <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Estimated Tuition Savings</span>
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-center">
             <span className="text-5xl font-bold text-green-600 tracking-tight">{formatCurrency(moneySaved)}</span>
             <div className="mt-4 text-sm text-slate-600 bg-green-50/50 p-3 rounded-lg border border-green-100">
               <p className="flex justify-between mb-1">
                   <span>Est. Cost per Credit:</span>
                   <span className="font-semibold">{formatCurrency(costPerCredit)}</span>
               </p>
               <p className="flex justify-between border-t border-green-200 pt-1 mt-1">
                   <span>Credits Saved:</span>
                   <span className="font-semibold text-green-700">{totalEarned}</span>
               </p>
             </div>
             <p className="text-xs text-slate-400 mt-2 italic text-center">
                *Savings estimate based on current tuition rates vs. credits earned. Does not include room/board.
             </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
          {onAddToComparison && (
                 <button 
                  onClick={onAddToComparison}
                  disabled={isSaved}
                  className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                      isSaved 
                      ? 'bg-green-50 text-green-700 border-green-200 cursor-default' 
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                 >
                   {isSaved ? <><CheckCircle2 className="w-4 h-4" /> Saved to Dashboard</> : '+ Save Analysis for Comparison'}
                 </button>
           )}
      </div>

      {/* --- Section 3: Detailed Lists (Interactive) --- */}
      
      {/* List A: Transfer Credits */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded text-indigo-700">
              <Sheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Transfer Credit Breakdown</h3>
              <p className="text-xs text-slate-500">Uncheck items to exclude them from the total.</p>
            </div>
          </div>
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Plan
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                    <span className="sr-only">Select</span>
                </th>
                <th className="px-6 py-3 font-semibold">Activity (High School)</th>
                <th className="px-6 py-3 font-semibold">University Equivalent</th>
                <th className="px-6 py-3 font-semibold text-center">Credit Hours</th>
                <th className="px-6 py-3 font-semibold">Notes / Requirements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.credits.map((item, index) => {
                const isSelected = selectedTransferIndices.has(index);
                return (
                    <tr 
                        key={index} 
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 text-slate-400 hover:bg-slate-100'}`}
                        onClick={() => toggleTransfer(index)}
                    >
                    <td className="px-4 py-4 text-center">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                    </td>
                    <td className={`px-6 py-4 font-medium ${isSelected ? 'text-slate-900' : 'text-slate-400 line-through decoration-slate-300'}`}>{item.activity}</td>
                    <td className={`px-6 py-4 font-mono ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>{item.universityCourse}</td>
                    <td className={`px-6 py-4 text-center font-semibold ${isSelected ? 'text-slate-700' : 'text-slate-400'}`}>{item.creditHours}</td>
                    <td className="px-6 py-4 text-slate-500 italic max-w-xs">{item.notes}</td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* List B: Summer Recommendations */}
      {result.summerRecommendations && result.summerRecommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-teal-200 overflow-hidden">
          <div className="p-4 border-b border-teal-100 bg-teal-50 flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded text-teal-700">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-teal-900">Summer Course Opportunities</h3>
              <p className="text-xs text-teal-600">Click to add these credits to your plan.</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-teal-700 uppercase bg-teal-50/50 border-b border-teal-100">
                <tr>
                  <th className="px-4 py-3 w-10 text-center">
                     <span className="sr-only">Select</span>
                  </th>
                  <th className="px-6 py-3 font-semibold">CC Course (Take This)</th>
                  <th className="px-6 py-3 font-semibold">University Equivalent (Get This)</th>
                  <th className="px-6 py-3 font-semibold text-center">Credits</th>
                  <th className="px-6 py-3 font-semibold">Strategic Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-50">
                {result.summerRecommendations.map((rec, index) => {
                  const isSelected = selectedSummerIndices.has(index);
                  return (
                    <tr 
                        key={index} 
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-teal-50/20 hover:bg-teal-50/40' : 'hover:bg-slate-50'}`}
                        onClick={() => toggleSummer(index)}
                    >
                        <td className="px-4 py-4 text-center">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-teal-600 border-teal-600' : 'bg-white border-slate-300'}`}>
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </div>
                        </td>
                        <td className={`px-6 py-4 font-bold ${isSelected ? 'text-teal-800' : 'text-slate-600'}`}>{rec.ccCourse}</td>
                        <td className="px-6 py-4 text-slate-600">{rec.universityEquivalent}</td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-700">{rec.creditHours}</td>
                        <td className="px-6 py-4 text-slate-600">{rec.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sources / Grounding */}
      {sources.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Verified Sources
          </h4>
          <ul className="space-y-2">
            {sources.map((source, idx) => (
              <li key={idx}>
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-start gap-2 break-all"
                >
                  <span className="shrink-0 text-slate-400">•</span>
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
