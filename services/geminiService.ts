import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SnakeAnalysisResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

// Define the schema for structured JSON output
const localizedDataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    first_aid: { type: Type.ARRAY, items: { type: Type.STRING } },
    toxicity_details: { type: Type.STRING },
    fun_fact: { type: Type.STRING },
    habitat_text: { type: Type.STRING },
  },
  required: ["name", "description", "first_aid", "toxicity_details", "fun_fact", "habitat_text"]
};

const detailedInfoSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scientific_name: { type: Type.STRING },
    family: { type: Type.STRING },
    thai_names: { type: Type.ARRAY, items: { type: Type.STRING } },
    other_names: { type: Type.ARRAY, items: { type: Type.STRING } },
    range: { type: Type.STRING },
    habitat: { type: Type.STRING },
    active_time: { type: Type.STRING },
    diet: { type: Type.STRING },
    venom_toxicity: { type: Type.STRING },
    danger_to_humans: { type: Type.STRING },
    prevention: { type: Type.STRING },
    behavior: { type: Type.STRING },
  },
  required: [
    "scientific_name", "family", "thai_names", "other_names", 
    "range", "habitat", "active_time", "diet", 
    "venom_toxicity", "danger_to_humans", "prevention", "behavior"
  ]
};

const snakeResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    found: { type: Type.BOOLEAN, description: "True if a snake is identified in the image/text." },
    scientific_name: { type: Type.STRING },
    confidence: { type: Type.NUMBER, description: "Confidence score from 0-100." },
    is_venomous: { type: Type.BOOLEAN },
    danger_level: { type: Type.STRING, enum: ["Safe", "Moderate", "High", "Critical"] },
    locations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          country: { type: Type.STRING },
          continent_code: { type: Type.STRING, description: "AS, AF, NA, SA, EU, OC" }
        }
      }
    },
    google_search_term: { type: Type.STRING },
    data: {
      type: Type.OBJECT,
      properties: {
        en: localizedDataSchema,
        th: localizedDataSchema
      },
      required: ["en", "th"]
    },
    details: detailedInfoSchema
  },
  required: ["found", "scientific_name", "confidence", "is_venomous", "danger_level", "locations", "google_search_term", "data", "details"]
};

const validateImageQuality = async (base64Data: string): Promise<boolean> => {
  try {
    const parts = [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      },
      { 
        text: `Analyze this image and respond with ONLY "snake_present" if there is a clear, identifiable snake in the image, or "not_a_snake" if it's not a snake or too blurry. Be strict - the image must be clear enough to reliably identify specific snake species. Respond with exactly one of these two words only.` 
      }
    ];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: parts },
      config: {
        temperature: 0.1,
      }
    });

    const result = response.text?.toLowerCase().trim() || '';
    return result.includes('snake_present');
  } catch (error) {
    console.error("Image validation error:", error);
    return false;
  }
};

export const identifySnake = async (input: string, type: 'image' | 'text'): Promise<SnakeAnalysisResult> => {
  const systemInstruction = `
    You are an expert herpetologist specializing in Asian and Global snake species, similar to the expertise found in 'A Field Guide to the Reptiles of Thailand' or 'ThailandSnakes.com'.
    
    CRITICAL INSTRUCTIONS FOR ACCURACY:
    1. Only identify if you are HIGHLY confident (85%+ certainty).
    2. If confidence is below 85%, set "found" to false.
    3. Use morphological features: head shape, scale patterns, color bands, size, eye position.
    4. Consider regional context - prioritize species found in that region.
    5. "description": Use VERY SIMPLE, non-technical language for general audiences.
    6. "locations": List up to 8 key countries/regions where this snake lives.
    7. Provide accurate translations for text fields in English (en) and Thai (th).
    8. "details": Populate with comprehensive field guide information:
       - "thai_names": List common Thai names (e.g., งูจงอาง).
       - "other_names": List alternative English names.
       - "active_time": Diurnal, Nocturnal, or Crepuscular.
       - "venom_toxicity": Specific venom type and clinical effects.
       - "danger_to_humans": Detailed danger assessment.
    9. If unsure about ANY aspect, be conservative and set "found" to false.
    10. For image identification, analyze distinguishing features in detail before responding.
  `;

  try {
    // Validate image quality if it's an image input
    if (type === 'image') {
      const base64Data = input.includes('base64,') ? input.split(',')[1] : input;
      const isValidSnakeImage = await validateImageQuality(base64Data);
      
      if (!isValidSnakeImage) {
        return {
          found: false,
          scientific_name: '',
          confidence: 0,
          is_venomous: false,
          danger_level: 'Safe',
          locations: [],
          google_search_term: '',
          data: {
            en: {
              name: '',
              description: 'Image quality too low or no snake detected. Please try a clearer photo.',
              first_aid: [],
              toxicity_details: '',
              fun_fact: '',
              habitat_text: ''
            },
            th: {
              name: '',
              description: 'คุณภาพภาพไม่ดีหรือไม่พบงู โปรดลองถ่ายรูปที่ชัดเจนขึ้น',
              first_aid: [],
              toxicity_details: '',
              fun_fact: '',
              habitat_text: ''
            }
          },
          details: {
            scientific_name: '',
            family: '',
            thai_names: [],
            other_names: [],
            range: '',
            habitat: '',
            active_time: '',
            diet: '',
            venom_toxicity: '',
            danger_to_humans: '',
            prevention: '',
            behavior: ''
          }
        };
      }
    }

    const parts = [];
    
    if (type === 'image') {
      const base64Data = input.includes('base64,') ? input.split(',')[1] : input;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
      parts.push({ 
        text: `Identify this snake with high accuracy. Analyze key identifying features:
        - Head shape and size relative to body
        - Scale patterns and arrangement
        - Color and band patterns
        - Eye position and pupil shape
        - Specific regional species
        
        Provide detailed field guide information. Only confirm identification if you are 85%+ confident.` 
      });
    } else {
      parts.push({ 
        text: `Retrieve accurate detailed field guide information about the snake species named "${input}". Only provide information if the name clearly refers to a real, identifiable snake species.` 
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: snakeResponseSchema,
        temperature: 0.1, 
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(response.text) as SnakeAnalysisResult;
    
    // Additional validation: enforce confidence threshold
    if (data.confidence < 85) {
      data.found = false;
    }

    return data;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
