import React from 'react';
import { Trash2, TrendingUp, GraduationCap, MapPin, ArrowRight } from 'lucide-react';
import { ComparisonItem } from '../types';

interface ComparisonTableProps {
  items: ComparisonItem[];
  onRemove: (id: string) => void;
  onViewDetails?: (item: ComparisonItem) => void;
  activeId?: string | null;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ items, onRemove, onViewDetails, activeId }) => {
  if (items.length === 0) return null;

  // Helper to extract a sortable number from the credit string (e.g. "20" or "approx 20")
  const getNumericCredits = (val: string | number) => {
    if (typeof val === 'number') return val;
    const match = String(val).match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  };

  const maxCredits = Math.max(...items.map(i => getNumericCredits(i.totalCredits)), 1);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden animate-fadeIn mt-8">
      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          College Comparison Tool
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200 shadow-sm">
          {items.length} {items.length === 1 ? 'School' : 'Schools'} Saved
        </span>
      </div>
      
      <div className="p-5 space-y-6">
        {items.map((item) => {
          const numericCredits = getNumericCredits(item.totalCredits);
          const percent = Math.min((numericCredits / maxCredits) * 100, 100);
          const isActive = activeId === item.id;
          
          return (
            <div key={item.id} className={`relative group p-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50/50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3 cursor-pointer" onClick={() => onViewDetails && onViewDetails(item)}>
                   <div className={`mt-1 p-1.5 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                     <GraduationCap className="w-4 h-4" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-indigo-700 transition-colors flex items-center gap-2">
                        {item.university}
                        {isActive && <span className="text-[10px] uppercase bg-indigo-600 text-white px-1.5 py-0.5 rounded ml-2">Viewing</span>}
                     </h4>
                     <div className="flex items-center gap-2 mt-0.5">
                       <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{item.program}</p>
                       <span className="text-slate-300">•</span>
                       <p className="text-xs text-slate-500 flex items-center gap-1">
                         <MapPin className="w-3 h-3" />
                         {item.residency}
                       </p>
                     </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="text-right cursor-pointer" onClick={() => onViewDetails && onViewDetails(item)}>
                        <span className="block font-bold text-2xl text-indigo-600 leading-none">{item.totalCredits}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase">Est. Credits</span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        {onViewDetails && (
                            <button
                                onClick={() => onViewDetails(item)}
                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-all"
                                title="View Details"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Remove from comparison"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              </div>
              
              {/* Progress Bar Visual */}
              <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden cursor-pointer" onClick={() => onViewDetails && onViewDetails(item)}>
                <div 
                    className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-xs text-slate-500 text-center">
        Tip: Click on a university to view its detailed credit report.
      </div>
    </div>
  );
};