import React from 'react';
import { School, MapPin } from 'lucide-react';
import { ComparisonItem } from '../types';

interface CollegeTabsProps {
  items: ComparisonItem[];
  activeId: string | null;
  onSelect: (item: ComparisonItem) => void;
}

export const CollegeTabs: React.FC<CollegeTabsProps> = ({ items, activeId, onSelect }) => {
  if (items.length === 0) return null;

  return (
    <div className="mb-6 overflow-x-auto pb-2 custom-scrollbar">
      <div className="flex gap-3 min-w-max">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-[1.02]' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-sm'
                }
              `}
            >
              <div className={`
                p-2 rounded-lg transition-colors
                ${isActive ? 'bg-indigo-500/50 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}
              `}>
                <School className="w-5 h-5" />
              </div>
              
              <div className="text-left">
                <div className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-800'}`}>
                  {item.university}
                </div>
                <div className={`flex items-center gap-1 text-xs ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                  <MapPin className="w-3 h-3" />
                  {item.residency}
                </div>
              </div>

              {isActive && (
                <div className="ml-2 w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};