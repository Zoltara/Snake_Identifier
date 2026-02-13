import { SnakeAnalysisResult } from "../types";

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Multiple vision models to try (in order of preference)
// Note: Free tier models often have limitations. Consider using paid models for production.
const VISION_MODELS = [
  "openai/gpt-4o-mini",               // Fast, reliable, supports JSON mode
  "google/gemini-flash-1.5-exp",      // Google's experimental model
  "google/gemini-pro-1.5",            // Stable Google model
  "meta-llama/llama-3.2-90b-vision-instruct"  // Larger LLaMA with better vision
];

let currentModelIndex = 0;

// Rate limiting helpers
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to make OpenRouter API calls with vision support and model fallback
async function callOpenRouterWithVision(
  textPrompt: string, 
  imageBase64: string | null = null, 
  retries = 2
): Promise<string> {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();

  // Build content array for vision
  const content: any[] = [];
  
  if (imageBase64) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${imageBase64}`
      }
    });
  }
  
  content.push({
    type: "text",
    text: textPrompt
  });

  // Try each model until one works
  for (let modelAttempt = 0; modelAttempt < VISION_MODELS.length; modelAttempt++) {
    const modelToUse = VISION_MODELS[(currentModelIndex + modelAttempt) % VISION_MODELS.length];
    
    const requestBody: any = {
      model: modelToUse,
      messages: [
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.1,
      max_tokens: 3000  // Increased for detailed bilingual responses
    };

    // Add JSON mode for models that support it
    if (modelToUse.includes('gpt-4') || modelToUse.includes('gpt-3.5')) {
      requestBody.response_format = { type: "json_object" };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (!OPENROUTER_API_KEY) {
          throw new Error('OpenRouter API key not found. Please set OPENROUTER_API_KEY in your .env file.');
        }

        console.log(`Trying model: ${modelToUse} (attempt ${attempt + 1})`);
        
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "SerpentID Snake Identifier"
          },
          body: JSON.stringify(requestBody)
        });

        if (response.status === 429) {
          console.log(`Rate limit hit on ${modelToUse}, trying next model...`);
          // Move to next model
          currentModelIndex = (currentModelIndex + 1) % VISION_MODELS.length;
          await delay(1000);
          break; // Break inner retry loop, try next model
        }

        if (response.status === 404) {
          console.log(`Model ${modelToUse} not found (404), trying next model...`);
          // Move to next model immediately, don't retry
          currentModelIndex = (currentModelIndex + 1) % VISION_MODELS.length;
          break; // Break inner retry loop, try next model
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`API Error: ${response.status} - ${errorText}`);
          
          if (attempt < retries) {
            await delay(2000 * (attempt + 1));
            continue;
          }
          // Try next model
          break;
        }

        const data = await response.json();
        console.log(`Success with model: ${modelToUse}`);
        return data.choices[0].message.content;

      } catch (error) {
        console.error(`Attempt failed:`, error);
        if (attempt === retries) {
          break; // Try next model
        }
        await delay(2000 * (attempt + 1));
      }
    }
  }
  
  throw new Error('All AI models are currently unavailable. This may be due to rate limits, unavailable endpoints, or API key issues. Please check your API key and try again in 1-2 minutes.');
}

// JSON response schema description for the prompt
const schemaDescription = `
{
  "found": boolean (true if snake identified with 85%+ confidence),
  "needs_clarification": boolean (true if input is ambiguous like "python", "cobra", "viper" - generic terms that match multiple species),
  "suggestions": string[] (if needs_clarification is true, list 5-8 specific species names the user might mean, e.g. for "python": ["Ball Python", "Burmese Python", "Reticulated Python", "Royal Python", "Green Tree Python"]),
  "related_species": string[] (always include 4-6 other snake species from the same family for further exploration, e.g. if identified as "King Cobra", include other Elapidae like "Indian Cobra", "Banded Krait", "Blue Malayan Coral Snake"),
  "scientific_name": string,
  "confidence": number (0-100),
  "is_venomous": boolean,
  "danger_level": "Safe" | "Moderate" | "High" | "Critical",
  "locations": [{ "country": string, "continent_code": "AS"|"AF"|"NA"|"SA"|"EU"|"OC" }],
  "search_term": string (search term for more info),
  "data": {
    "en": { "name": string, "description": string, "first_aid": string[], "toxicity_details": string, "fun_fact": string, "habitat_text": string },
    "th": { "name": string (Thai), "description": string (Thai), "first_aid": string[] (Thai), "toxicity_details": string (Thai), "fun_fact": string (Thai), "habitat_text": string (Thai) }
  },
  "details": {
    "en": {
      "scientific_name": string, "family": string, "thai_names": string[], "other_names": string[],
      "range": string, "habitat": string, "active_time": string, "diet": string,
      "venom_toxicity": string, "danger_to_humans": string, "prevention": string, "behavior": string
    },
    "th": {
      "scientific_name": string, "family": string (Thai), "thai_names": string[], "other_names": string[],
      "range": string (Thai), "habitat": string (Thai), "active_time": string (Thai), "diet": string (Thai),
      "venom_toxicity": string (Thai), "danger_to_humans": string (Thai), "prevention": string (Thai), "behavior": string (Thai)
    }
  }
}`;

export const identifySnake = async (input: string, type: 'image' | 'text'): Promise<SnakeAnalysisResult> => {
  const systemPrompt = `You are an expert herpetologist specializing in snake identification.

CRITICAL: You MUST respond with ONLY valid JSON. No explanations, no markdown, no additional text before or after the JSON object.

INSTRUCTIONS:
- If analyzing an image, carefully examine: head shape, scale patterns, coloration, body proportions, eye characteristics. Identify it directly - do NOT ask for clarification on images.
- Only set "found": true if you are 85%+ confident in the identification
- If confidence is below 85%, set "found": false
- For TEXT searches ONLY: If the input is a generic/ambiguous term (like "python", "cobra", "viper", "boa", "rattlesnake", "mamba") that could refer to multiple species, set "needs_clarification": true and provide 5-8 specific species in "suggestions" array
- If the input is already specific (like "Ball Python", "King Cobra", "Burmese Python"), identify it directly
- ALWAYS include "related_species" with 4-6 other snakes from the same family for user exploration
- Provide accurate bilingual data in English and Thai
- Include comprehensive field guide details

RESPOND WITH VALID JSON ONLY matching this exact schema:
${schemaDescription}`;

  try {
    let responseText: string;
    
    if (type === 'image') {
      const base64Data = input.includes('base64,') ? input.split(',')[1] : input;
      
      const imagePrompt = `${systemPrompt}

Analyze this snake image and identify the species. Provide complete field guide information.

REMEMBER: Return ONLY the JSON object with no additional text, explanations, or markdown formatting.`;
      
      responseText = await callOpenRouterWithVision(imagePrompt, base64Data);
    } else {
      const textPrompt = `${systemPrompt}

The user is searching for: "${input}"

IMPORTANT: 
- If "${input}" is a generic/ambiguous term that matches multiple snake species (like "python", "cobra", "viper", "boa", "rattlesnake", "mamba", "adder", "racer", "rat snake"), you MUST set "needs_clarification": true and provide 5-8 specific species names in "suggestions" array. Set "found": false in this case.
- If "${input}" is already a specific species name (like "Ball Python", "King Cobra", "Burmese Python"), identify it directly with "found": true and "needs_clarification": false.

REMEMBER: Return ONLY the JSON object with no additional text, explanations, or markdown formatting.`;
      
      responseText = await callOpenRouterWithVision(textPrompt, null);
    }

    if (!responseText) {
      throw new Error("No response from AI");
    }

    // Extract JSON from response
    let jsonText = responseText.trim();
    
    // Clean up markdown code blocks first
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to find JSON object in the response (most greedy match)
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    // Remove any text before the first { or after the last }
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    console.log('Attempting to parse JSON response (first 300 chars):', jsonText.substring(0, 300));
    
    let data: SnakeAnalysisResult;
    try {
      data = JSON.parse(jsonText) as SnakeAnalysisResult;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Failed to parse response. Full text (first 500 chars):', responseText.substring(0, 500));
      throw new Error(`Invalid JSON response from AI. The model may not support structured output. Error: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }
    
    // Enforce confidence threshold
    if (data.confidence < 85) {
      data.found = false;
    }

    return data;

  } catch (error) {
    console.error("Snake Analysis Error:", error);
    
    // Return a structured error response
    return {
      found: false,
      scientific_name: '',
      confidence: 0,
      is_venomous: false,
      danger_level: 'Safe',
      locations: [],
      search_term: '',
      data: {
        en: {
          name: '',
          description: error instanceof Error ? `Analysis failed: ${error.message}` : 'Analysis failed. Please try again.',
          first_aid: [],
          toxicity_details: '',
          fun_fact: '',
          habitat_text: ''
        },
        th: {
          name: '',
          description: 'การวิเคราะห์ล้มเหลว กรุณาลองใหม่อีกครั้ง',
          first_aid: [],
          toxicity_details: '',
          fun_fact: '',
          habitat_text: ''
        }
      },
      details: {
        en: {
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
        },
        th: {
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
      }
    };
  }
};
