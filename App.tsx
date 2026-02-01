import React, { useState, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { PromptPreview } from './components/PromptPreview';
import { ComparisonTable } from './components/ComparisonTable';
import { CollegeTabs } from './components/CollegeTabs';
import { analyzeCredits } from './services/gemini';
import { UserFormData, AnalysisResult, ComparisonItem } from './types';
import { Sparkles, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track which comparison is currently being viewed
  const [activeComparisonId, setActiveComparisonId] = useState<string | null>(null);

  const [currentFormData, setCurrentFormData] = useState<UserFormData>({
    degreeLevel: 'Undergraduate',
    university: '',
    residency: 'In-State',
    universities: [],
    program: '',
    major: '',
    minor: '',
    apCourses: [],
    languages: '',
    communityCollege: '',
    targetCommunityCollege: '', // Initialize new field
    interests: ''
  });

  const [comparisons, setComparisons] = useState<ComparisonItem[]>([]);

  const handleFormSubmit = async (data: UserFormData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveComparisonId(null);
    
    // Initial save of the form data
    setCurrentFormData(data);

    // Filter out duplicates in comparisons to avoid re-adding
    // Use the universities array if populated, otherwise fallback to single
    const collegesToAnalyze = data.universities.length > 0 
        ? data.universities 
        : [{ name: data.university, residency: data.residency }];

    try {
      for (const collegeEntry of collegesToAnalyze) {
        // Create a specific payload for this college
        const singleCollegeData = { 
            ...data, 
            university: collegeEntry.name,
            residency: collegeEntry.residency
        };
        
        // Call the AI
        const response = await analyzeCredits(singleCollegeData);
        
        // Use the AI-corrected name if available, otherwise fallback to input
        const finalUniversityName = response.result.canonicalUniversityName || collegeEntry.name;
        
        const newId = crypto.randomUUID();

        // Add to comparison list automatically with full results
        const newItem: ComparisonItem = {
            id: newId,
            university: finalUniversityName,
            residency: collegeEntry.residency,
            totalCredits: response.result.totalCredits,
            program: data.program || 'General',
            timestamp: Date.now(),
            fullResult: response.result,
            sources: response.sources
        };

        // Avoid adding duplicates to comparison state if they exist by name
        setComparisons(prev => {
            // Check if updated exists
            const existingIndex = prev.findIndex(p => p.university === finalUniversityName);
            if (existingIndex >= 0) {
               // Update existing
               const updated = [...prev];
               updated[existingIndex] = newItem;
               return updated;
            }
            return [...prev, newItem];
        });

        // Set this as the active result
        setResult(response.result);
        setSources(response.sources);
        setActiveComparisonId(newItem.id);

        // Update context (optional, but keeps UI consistent if we want to show corrected name in inputs later)
        // We keep formData as is to reflect user input, but result display will use response name
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while analyzing credits.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToComparison = () => {
    if (!result || !currentFormData.university) return;
    
    // Use canonical name if available in result
    const uniName = result.canonicalUniversityName || currentFormData.university;

    if (comparisons.some(c => c.university === uniName)) {
      return;
    }

    const newItem: ComparisonItem = {
      id: crypto.randomUUID(),
      university: uniName,
      residency: currentFormData.residency,
      totalCredits: result.totalCredits,
      program: currentFormData.program || 'General',
      timestamp: Date.now(),
      fullResult: result,
      sources: sources
    };

    setComparisons(prev => [...prev, newItem]);
    setActiveComparisonId(newItem.id);
  };

  const handleRemoveComparison = (id: string) => {
    setComparisons(prev => prev.filter(c => c.id !== id));
    if (activeComparisonId === id) {
        setActiveComparisonId(null);
        setResult(null);
        setSources([]);
    }
  };

  const handleSelectComparison = (item: ComparisonItem) => {
      setActiveComparisonId(item.id);
      if (item.fullResult) {
          setResult(item.fullResult);
      }
      if (item.sources) {
          setSources(item.sources);
      }
      // Update form data context for prompt preview
      setCurrentFormData(prev => ({
          ...prev,
          university: item.university,
          residency: item.residency
      }));
  };

  // Check against canonical name if possible
  const currentUniName = result?.canonicalUniversityName || currentFormData.university;
  const isCurrentSaved = result && comparisons.some(c => c.university === currentUniName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">College Credit Compiler</h1>
              <p className="text-xs text-slate-500 font-medium">AI University Credit Analyzer</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Powered by Gemini 3 Flash
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-slate-800">Student Profile</h2>
              <p className="text-slate-600">Enter your academic details to scout for credits.</p>
            </div>
            <InputForm onSubmit={handleFormSubmit} isLoading={loading} />
            
            {/* Prompt Preview (always visible at bottom of form for transparency) */}
            <PromptPreview formData={currentFormData} />
          </div>

          {/* Right Column: Results & Comparison */}
          <div className="lg:col-span-7">
             <div className="mb-2">
              <h2 className="text-2xl font-bold text-slate-800">Analysis Report</h2>
              <p className="text-slate-600">Generated credit estimation and breakdown.</p>
            </div>
            
            {/* Navigation Tabs */}
            {comparisons.length > 0 && (
                <CollegeTabs 
                    items={comparisons} 
                    activeId={activeComparisonId} 
                    onSelect={handleSelectComparison} 
                />
            )}

            {loading && (
              <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center h-[400px]">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-800">Consulting University Catalogs...</h3>
                <p className="text-slate-500 max-w-xs mt-2">
                  Searching for {currentFormData.university || 'universities'} credit policies and matching your AP scores.
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm">
                <h3 className="text-red-800 font-semibold text-lg mb-2">Analysis Failed</h3>
                <p className="text-red-700">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-4 text-sm font-medium text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {!loading && !result && !error && (
              <div className="bg-white/50 border border-dashed border-slate-300 rounded-xl h-[400px] flex flex-col items-center justify-center text-slate-400">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <FileTextPlaceholder className="w-8 h-8 text-slate-300" />
                </div>
                <p>Fill out the form to generate a report.</p>
              </div>
            )}

            {!loading && result && (
              <ResultsDisplay 
                result={result} 
                sources={sources} 
                onAddToComparison={handleAddToComparison}
                isSaved={isCurrentSaved || false}
              />
            )}
            
            {/* Comparison Table Section */}
            {comparisons.length > 0 && (
                <ComparisonTable 
                    items={comparisons} 
                    onRemove={handleRemoveComparison}
                    onViewDetails={handleSelectComparison}
                    activeId={activeComparisonId}
                />
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

// Helper icon component
const FileTextPlaceholder = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default App;