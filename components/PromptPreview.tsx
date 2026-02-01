import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff, Terminal } from 'lucide-react';
import { constructPrompt } from '../services/gemini';
import { UserFormData } from '../types';

interface PromptPreviewProps {
  formData: UserFormData;
}

export const PromptPreview: React.FC<PromptPreviewProps> = ({ formData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const promptText = constructPrompt(formData);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-200 shadow-xl">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-800 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-sm tracking-wide uppercase">Agent System Prompt</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {isOpen ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> View Prompt</>}
        </div>
      </div>

      {isOpen && (
        <div className="relative border-t border-slate-700">
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-600 z-10"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <pre className="p-6 overflow-x-auto text-xs font-mono leading-relaxed text-emerald-50/90 whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar">
            {promptText.trim()}
          </pre>
          <div className="bg-slate-800 px-6 py-2 text-[10px] text-slate-400 text-right border-t border-slate-700">
            Ready to paste into Google AI Studio
          </div>
        </div>
      )}
    </div>
  );
};
