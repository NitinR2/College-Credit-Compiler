import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserFormData, AnalysisResult, APCourse } from "../types";

// Define the response schema for structured JSON output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    canonicalUniversityName: {
      type: Type.STRING,
      description: "The official, correctly spelled, full name of the university (e.g. convert 'ut austin' to 'The University of Texas at Austin').",
    },
    summary: {
      type: Type.STRING,
      description: "A friendly, encouraging summary paragraph explaining the overall credit outlook.",
    },
    credits: {
      type: Type.ARRAY,
      description: "List of individual credit transfer details.",
      items: {
        type: Type.OBJECT,
        properties: {
          activity: { type: Type.STRING, description: "The high school activity, AP course, or interest." },
          universityCourse: { type: Type.STRING, description: "The specific university course code equivalent." },
          creditHours: { type: Type.STRING, description: "Number of credit hours granted." },
          notes: { type: Type.STRING, description: "Conditions or notes (e.g., 'Requires score of 4')." }
        },
        required: ["activity", "universityCourse", "creditHours", "notes"]
      }
    },
    summerRecommendations: {
      type: Type.ARRAY,
      description: "List of recommended courses to take at the specific community college mentioned to shorten time.",
      items: {
        type: Type.OBJECT,
        properties: {
          ccCourse: { type: Type.STRING, description: "The specific course code at the Community College (e.g. MATH 201)." },
          universityEquivalent: { type: Type.STRING, description: "The equivalent course it fulfills at the Target University." },
          creditHours: { type: Type.STRING, description: "Estimated credit hours for this course (usually 3 or 4)." },
          reason: { type: Type.STRING, description: "Why this is strategic (e.g. 'Fulfills Core Math Requirement')." }
        },
        required: ["ccCourse", "universityEquivalent", "reason", "creditHours"]
      }
    },
    totalCredits: {
      type: Type.STRING,
      description: "Total estimated credits."
    },
    degreeTotalCredits: {
      type: Type.NUMBER,
      description: "The total number of credits required to graduate with this degree (e.g. 120 for most Bachelor's).",
    },
    estimatedCostPerCredit: {
      type: Type.NUMBER,
      description: "Estimated tuition cost per credit hour in USD for the specific residency status at this university.",
    },
    currencySymbol: {
      type: Type.STRING,
      description: "Currency symbol, usually $.",
    }
  },
  required: ["canonicalUniversityName", "summary", "credits", "totalCredits", "degreeTotalCredits", "estimatedCostPerCredit"]
};

const extractionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      courseName: { type: Type.STRING, description: "The name of the AP course found." },
      score: { type: Type.STRING, description: "The score received (1-5)." }
    },
    required: ["courseName"]
  }
};

export const constructPrompt = (data: UserFormData): string => {
  const apList = data.apCourses.length > 0 
    ? data.apCourses.map(c => `- ${c.courseName} (Score: ${c.score || 'No score provided - assume highest credit-earning score'})`).join('\n')
    : "None";

  const ccInstruction = data.targetCommunityCollege 
    ? `8. The user specifically wants to take summer classes at "${data.targetCommunityCollege}" to graduate faster. 
       - Search for the specific articulation agreement or transfer equivalency guide between "${data.targetCommunityCollege}" and "${data.university}".
       - Identify 3-5 high-value courses (General Education requirements or lower-division Major requirements) they could take at the Community College that are GUARANTEED to transfer.
       - Populate the 'summerRecommendations' field with these specific courses, ensuring you estimate the credit hours (typically 3 or 4).`
    : `8. The user has not specified a community college for summer classes, so leave 'summerRecommendations' empty.`;

  return `
Role – You are an expert Academic Advisor Agent. Your goal is to help high school students understand how their achievements translate into college credits at specific institutions.

Inputs –
* Degree Level: ${data.degreeLevel}
* University/College Name Input: ${data.university} (Note: Use Google Search to find the Official Name and correct spelling)
* In-State/Out-of-state: ${data.residency}
* Intended Program: ${data.program}
* Major: ${data.major || 'Not specified'}
* Minor: ${data.minor || 'Not specified'}
* AP Courses:
${apList}
* Languages: ${data.languages || 'None'}
* Past Community College credits (Already taken): ${data.communityCollege || 'None'}
* Target Community College for Summer Classes (Future): ${data.targetCommunityCollege || 'None'}
* Student Interests (Sports/Music/etc): ${data.interests || 'None'}

Task –
1. **Identify the University**: Search for the input university name. Find the full, official name (e.g., "uva" -> "University of Virginia"). Use this official name for all subsequent steps and the output.
2. Search for the official AP credit policy, transfer credit policy, and catalog for the identified university.
3. Analyze the user's AP courses and scores against the university's specific standards.
4. If scores are not provided for an AP test, assume the highest score that grants credit for that class (typically 5), but explicitly note this assumption in the notes.
5. Search for language placement or retroactive credit policies if languages are listed.
6. Evaluate community college transferability for 'Past Community College credits' if provided.
7. Consider the 'Student Interests'. If the student plays a sport or an instrument, check if the university offers elective credits for these activities (e.g., Music Ensemble credits, Kinesiology/PE credits) and include them in the credit list if applicable.
8. Compile a list of specific course codes and credit hours the student is likely to receive.
${ccInstruction}
9. Search for the **current tuition rates** for ${data.residency} students at the university. Estimate the **Cost Per Credit Hour**. If only annual tuition is found, assume 30 credits per year to calculate the per-credit rate.
10. Determine the standard **Total Credits Required** for this specific degree program (e.g., typically 120-128 for a Bachelor's).

Output –
Return a JSON object containing the official university name, summary, detailed list of credits, summerRecommendations, total credits found, degree requirement total, and estimated cost per credit.
Also return it as a simple memory.

Constraints –
* **CRITICAL**: Always return the "canonicalUniversityName" with proper capitalization and spelling (e.g., "The University of Texas at Austin").
* Only use reputable university websites or official College Board data.
* Be precise with course codes (e.g., "MATH 101") if available in the search results.
* If specific data cannot be found, make a reasonable estimate based on general university standards but flag it as an estimate.
* For cost per credit, prioritize the specific residency status (${data.residency}).

Capabilities & Reminders –
* Use the Google Search tool to find the latest academic catalogs and credit transfer tables.
* Ensure the tone is helpful and encouraging.
`;
};

export const extractAPData = async (base64Image: string): Promise<APCourse[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  
  // Clean base64 string
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Examine this document. Extract all AP (Advanced Placement) course names and their corresponding scores. Return a JSON array. If a score is missing, leave it as an empty string. Map the names to official College Board AP course titles if they differ slightly." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const rawData = JSON.parse(text);
    return rawData.map((item: any) => ({
      id: crypto.randomUUID(),
      courseName: item.courseName,
      score: item.score ? String(item.score) : ''
    }));

  } catch (error) {
    console.error("Extraction error:", error);
    throw new Error("Failed to extract data from image.");
  }
};

export const analyzeCredits = async (data: UserFormData) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // If there is an image, we could theoretically pass it, but the prompt construction relies on the text fields 
  // which we might have populated via the extraction step. 
  // For the final analysis, we rely on the text prompt constructed from the form state.
  
  const prompt = constructPrompt(data);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response generated from AI.");
    }

    const parsedResult = JSON.parse(resultText) as AnalysisResult;
    
    // Extract grounding metadata (sources)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null)
      .filter(Boolean);

    return {
      result: parsedResult,
      sources,
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
