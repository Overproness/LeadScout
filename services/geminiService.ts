import { GoogleGenAI } from "@google/genai";
import { Lead } from "../types";

// Helper to sanitize and extract JSON from markdown code blocks if present
const extractJson = (text: string): any[] => {
  try {
    // First attempt: direct parse
    return JSON.parse(text);
  } catch (e) {
    // Second attempt: find code block
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        console.warn("Failed to parse JSON from code block", e2);
      }
    }
    
    // Third attempt: loose array finding
    const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e3) {
        console.warn("Failed to parse loose JSON array", e3);
      }
    }
  }
  return [];
};

export const searchWebLeads = async (query: string, excludeNames: string[] = []): Promise<Lead[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Use gemini-3-flash-preview for web search
  const model = "gemini-3-flash-preview";
  
  // Create a condensed exclusion list to save tokens if the list is huge, 
  // though typically passing the full list is better for strict exclusion.
  const exclusionContext = excludeNames.length > 0 
    ? `IMPORTANT: Do NOT include any of the following entities (find completely different ones): ${JSON.stringify(excludeNames)}.`
    : "";

  const prompt = `
    You are a Lead Generation Bot. Search for "${query}". 
    Focus on finding specific companies, agencies, or professionals that match this description.
    
    ${exclusionContext}
    
    Goal: valid contact information (emails, phone numbers, websites).
    
    Return a list of 10 to 20 distinct entities found in this batch.
    
    Format the output strictly as a JSON array of objects with these keys:
    - name: string
    - description: string (short summary)
    - website: string (or null)
    - email: string (or null - try to find support or contact emails)
    - phone: string (or null)
    - address: string (or null)
    
    Do not add any markdown formatting outside the JSON block.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "[]";
    const rawLeads = extractJson(text);
    
    // Extract grounding metadata to enrich sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return rawLeads.map((lead: any, index: number) => {
      // Try to find a relevant source URL from grounding chunks if possible
      const relevantChunk = groundingChunks.find((chunk: any) => 
        chunk.web?.title?.toLowerCase().includes(lead.name.toLowerCase())
      );

      return {
        id: `web-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        name: lead.name || "Unknown Entity",
        description: lead.description || "No description available",
        email: lead.email,
        phone: lead.phone,
        website: lead.website || relevantChunk?.web?.uri,
        address: lead.address,
        sourceUrl: relevantChunk?.web?.uri,
        sourceType: 'web'
      };
    });

  } catch (error) {
    console.error("Web Search Error:", error);
    throw new Error("Failed to fetch web leads. Please try again.");
  }
};

export const searchMapLeads = async (query: string, userLat?: number, userLng?: number, excludeNames: string[] = []): Promise<Lead[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-2.5-flash for Maps
  const model = "gemini-2.5-flash";

  const latitude = userLat || 37.7749;
  const longitude = userLng || -122.4194;

  const exclusionContext = excludeNames.length > 0 
    ? `Do NOT include any of these places (find different ones): ${JSON.stringify(excludeNames)}.`
    : "";

  const prompt = `
    Find "${query}" nearby.
    ${exclusionContext}
    For each place found, I need extracted contact details.
    
    Return between 10 and 20 results if possible.
    
    Provide the output as a JSON array of objects with:
    - name
    - description (what do they do?)
    - website
    - phone
    - address
    
    If you cannot find an email, leave it null.
    Output pure JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude,
              longitude
            }
          }
        }
      },
    });

    const text = response.text || "[]";
    const rawLeads = extractJson(text);
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return rawLeads.map((lead: any, index: number) => {
      // Find matching map chunk
      const mapChunk = groundingChunks.find((chunk: any) => 
         chunk.maps?.title?.toLowerCase() === lead.name.toLowerCase() ||
         (chunk.maps?.title && lead.name && chunk.maps.title.includes(lead.name))
      );

      return {
        id: `map-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        name: lead.name || mapChunk?.maps?.title || "Unknown Place",
        description: lead.description || "Local business result",
        email: lead.email,
        phone: lead.phone,
        website: lead.website || mapChunk?.maps?.uri, // Maps URI acts as a fallback source
        address: lead.address,
        sourceUrl: mapChunk?.maps?.uri, // The Google Maps link
        sourceType: 'maps'
      };
    });

  } catch (error) {
    console.error("Maps Search Error:", error);
    throw new Error("Failed to fetch map leads. Ensure location permissions are allowed or try a different query.");
  }
};