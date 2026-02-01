import React, { useState, useRef } from 'react';
import { Plus, Trash2, BookOpen, GraduationCap, School, FileText, Info, Upload, Sparkles, X, Map } from 'lucide-react';
import { UserFormData, APCourse, UniversityEntry } from '../types';
import { extractAPData } from '../services/gemini';

interface InputFormProps {
  onSubmit: (data: UserFormData) => void;
  isLoading: boolean;
}

const AP_SUBJECTS = [
  "AP 2-D Art and Design",
  "AP 3-D Art and Design",
  "AP African American Studies",
  "AP Art History",
  "AP Biology",
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Chemistry",
  "AP Chinese Language and Culture",
  "AP Comparative Government and Politics",
  "AP Computer Science A",
  "AP Computer Science Principles",
  "AP Drawing",
  "AP English Language and Composition",
  "AP English Literature and Composition",
  "AP Environmental Science",
  "AP European History",
  "AP French Language and Culture",
  "AP German Language and Culture",
  "AP Human Geography",
  "AP Italian Language and Culture",
  "AP Japanese Language and Culture",
  "AP Latin",
  "AP Macroeconomics",
  "AP Microeconomics",
  "AP Music Theory",
  "AP Physics 1: Algebra-Based",
  "AP Physics 2: Algebra-Based",
  "AP Physics C: Electricity and Magnetism",
  "AP Physics C: Mechanics",
  "AP Precalculus",
  "AP Psychology",
  "AP Research",
  "AP Seminar",
  "AP Spanish Language and Culture",
  "AP Spanish Literature and Culture",
  "AP Statistics",
  "AP United States Government and Politics",
  "AP United States History",
  "AP World History: Modern"
];

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  // Local state for the list of universities with residency
  const [universityList, setUniversityList] = useState<UniversityEntry[]>([{ name: '', residency: 'In-State' }]);

  const [formData, setFormData] = useState<UserFormData>({
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
    targetCommunityCollege: '',
    interests: ''
  });

  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // University List Handlers
  const handleUniversityChange = (index: number, field: keyof UniversityEntry, value: string) => {
    const newList = [...universityList];
    newList[index] = { ...newList[index], [field]: value };
    setUniversityList(newList);
  };

  const addUniversity = () => {
    setUniversityList([...universityList, { name: '', residency: 'In-State' }]);
  };

  const removeUniversity = (index: number) => {
    if (universityList.length === 1) {
      setUniversityList([{ name: '', residency: 'In-State' }]); // Clear instead of remove last
      return;
    }
    const newList = universityList.filter((_, i) => i !== index);
    setUniversityList(newList);
  };

  // AP Course Handlers
  const addAPCourse = () => {
    if (formData.apCourses.length >= 15) return;
    const newCourse: APCourse = {
      id: crypto.randomUUID(),
      courseName: '',
      score: ''
    };
    setFormData(prev => ({ ...prev, apCourses: [...prev.apCourses, newCourse] }));
  };

  const updateAPCourse = (id: string, field: keyof APCourse, value: string) => {
    setFormData(prev => ({
      ...prev,
      apCourses: prev.apCourses.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const removeAPCourse = (id: string) => {
    setFormData(prev => ({
      ...prev,
      apCourses: prev.apCourses.filter(c => c.id !== id)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, scoreReportImage: base64String }));
      
      // Auto-extract
      setIsExtracting(true);
      try {
        const extractedCourses = await extractAPData(base64String);
        if (extractedCourses.length > 0) {
            setFormData(prev => {
                const currentCount = prev.apCourses.length;
                const available = 15 - currentCount;
                const toAdd = extractedCourses.slice(0, available);
                return {
                    ...prev,
                    apCourses: [...prev.apCourses, ...toAdd]
                };
            });
        }
      } catch (err) {
        console.error("Extraction failed", err);
        alert("Could not extract data from the file. Please try again or enter manually.");
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, scoreReportImage: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty university strings
    const validUniversities = universityList.filter(u => u.name.trim() !== '');
    if (validUniversities.length === 0) {
        alert("Please enter at least one university.");
        return;
    }

    // Set the first university as the "primary" context for compatibility
    onSubmit({
        ...formData,
        universities: validUniversities,
        university: validUniversities[0].name,
        residency: validUniversities[0].residency
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200">
      
      {/* Section 1: Basic Info */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <School className="w-5 h-5 text-indigo-600" />
          University Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Universities *</label>
            <div className="space-y-3">
              {universityList.map((uni, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex-1 w-full">
                     <input
                        type="text"
                        required={index === 0}
                        value={uni.name}
                        onChange={(e) => handleUniversityChange(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                        placeholder="University Name (e.g. UT Austin)"
                      />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={uni.residency}
                        onChange={(e) => handleUniversityChange(index, 'residency', e.target.value as any)}
                        className="w-full sm:w-40 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                      >
                        <option value="In-State">In-State</option>
                        <option value="Out-of-State">Out-of-State</option>
                      </select>
                      {universityList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUniversity(index)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Remove university"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addUniversity}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-1 pl-1"
              >
                <Plus className="w-4 h-4" /> Add Another College
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Degree Level *</label>
            <select
              name="degreeLevel"
              value={formData.degreeLevel}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Intended Degree Program *</label>
            <input
              type="text"
              name="program"
              required
              value={formData.program}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g. Computer Science"
            />
          </div>
        </div>

        {/* Separated Major/Minor Section */}
        <div className="pt-4 border-t border-slate-100">
           <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Specialization Fields</label>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Major <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="e.g. Data Science"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Minor <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  name="minor"
                  value={formData.minor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="e.g. Mathematics"
                />
              </div>
           </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Section 2: AP Courses */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            AP Courses
            <span className="text-sm font-normal text-slate-500 ml-2">({formData.apCourses.length}/15)</span>
          </h3>
          
          <div className="flex items-center gap-2">
             <button
              type="button"
              onClick={addAPCourse}
              disabled={formData.apCourses.length >= 15}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Manually
            </button>
          </div>
        </div>
        
        {/* Image Upload Area */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1 rounded-xl shadow-sm">
            <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Auto-Fill from Report Card
                    </label>
                    {isExtracting && <span className="text-xs text-indigo-600 animate-pulse font-medium">Analyzing Document...</span>}
                </div>
                
                {!formData.scoreReportImage ? (
                    <div className="relative border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-400 transition-colors bg-slate-50">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="p-6 text-center">
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-600 font-medium">Click to upload AP Score Report</p>
                            <p className="text-xs text-slate-400">Supported: JPG, PNG, PDF</p>
                        </div>
                    </div>
                ) : (
                     <div className="flex items-center justify-between bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-100">
                        <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-md bg-white border border-indigo-200 overflow-hidden flex items-center justify-center">
                                {formData.scoreReportImage.includes('application/pdf') ? (
                                    <FileText className="w-6 h-6 text-red-500" />
                                ) : (
                                    <img src={formData.scoreReportImage} alt="Preview" className="w-full h-full object-cover" />
                                )}
                             </div>
                             <div>
                                 <p className="text-sm font-medium text-indigo-900">Score Report Uploaded</p>
                                 <p className="text-xs text-indigo-600">{isExtracting ? 'Extracting scores...' : 'Analysis complete'}</p>
                             </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={clearImage}
                            className="p-1 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>

        {formData.apCourses.length === 0 && !isExtracting && (
          <p className="text-sm text-slate-500 italic text-center py-2">
            No courses added yet. Upload a score report or add manually.
          </p>
        )}

        <div className="space-y-3">
          {formData.apCourses.map((course, index) => (
            <div key={course.id} className="flex gap-4 items-start bg-slate-50 p-3 rounded-lg border border-slate-200 animate-fadeIn">
              <div className="flex-1 space-y-1">
                <select
                  value={course.courseName}
                  onChange={(e) => updateAPCourse(course.id, 'courseName', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value="" disabled>Select AP Course</option>
                  <option value={course.courseName}>{course.courseName} (Extracted)</option>
                  {AP_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32 space-y-1">
                <input
                  type="text"
                  placeholder="Score (Opt)"
                  value={course.score || ''}
                  onChange={(e) => updateAPCourse(course.id, 'score', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeAPCourse(course.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors mt-0.5"
                title="Remove course"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Section 3: Additional Credits */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          Additional Experience
        </h3>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Languages 
              <span className="text-slate-400 font-normal ml-1">(Classes taken in high school)</span>
            </label>
            <input
              type="text"
              name="languages"
              value={formData.languages}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. 4 years of Spanish, 2 years of French"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Past Community College Credits
              <span className="text-slate-400 font-normal ml-1">(Optional)</span>
            </label>
            <textarea
              name="communityCollege"
              value={formData.communityCollege}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="List any courses already taken at community college..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
              <Map className="w-4 h-4 text-emerald-600" />
              Planning Summer Classes?
              <span className="text-slate-400 font-normal ml-1">(Optional)</span>
            </label>
            <input
              type="text"
              name="targetCommunityCollege"
              value={formData.targetCommunityCollege}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Name of Community College you plan to attend (e.g. Austin Community College)"
            />
            <p className="text-xs text-slate-500 mt-1">We'll check for transfer agreements to help you pick courses.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Student Interests
              <span className="text-slate-400 font-normal ml-1">(Sports, Music, etc.)</span>
            </label>
            <textarea
              name="interests"
              value={formData.interests}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Played varsity soccer, Trumpet in Jazz band..."
            />
            <p className="text-xs text-slate-500 mt-1">This helps identify potential elective credits like Music Performance or Kinesiology.</p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading || isExtracting}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {universityList.length > 1 ? `Analyzing ${universityList.length} Schools...` : 'Generate Credit Report'}
            </>
          ) : (
            <>
              {universityList.length > 1 ? 'Batch Analyze Colleges' : 'Generate Credit Report'} <FileText className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
          <Info className="w-3 h-3" />
          AI-generated estimates. Always verify with official university advisors.
        </p>
      </div>

    </form>
  );
};
