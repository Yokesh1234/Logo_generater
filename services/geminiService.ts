import { GoogleGenAI } from "@google/genai";
import { LogoRequest, LogoStyle } from "../types.ts";

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public async generateLogo(request: LogoRequest): Promise<string> {
    const { brandName, industry, style, palette, customDetails } = request;
    const stylePrompt = this.getStylePrompt(style);
    
    // Improved prompt for better vector-like results
    const prompt = `
      Design a professional, high-end MINIMALIST logo for "${brandName}".
      Industry: ${industry}.
      Design Aesthetic: ${stylePrompt}.
      Target Color Palette: ${palette}.
      
      CRITICAL DESIGN RULES:
      1. Background MUST be solid, pure #FFFFFF white. No mockups, shadows, or textures.
      2. The mark must be clean, balanced, and sophisticated.
      3. Use sharp, well-defined paths as if it were a vector graphic.
      4. Avoid complex gradients or small intricate details.
      5. Context: ${customDetails || 'Modern, clean, and elegant identity.'}
      
      Deliver the logo mark clearly centered on a white background.
    `.trim();

    try {
      // Direct use of process.env.API_KEY as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inlineData);
      
      if (imagePart?.inlineData) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
      }

      throw new Error("The model did not return an image. Please refine your brand description.");
    } catch (error: any) {
      console.error("Gemini Error:", error);
      // More helpful error messages for the user
      const msg = error.message || "";
      if (msg.includes("API key")) {
        throw new Error("System Configuration Error: API Key is missing or invalid.");
      }
      throw new Error(error.message || "Unable to generate your design at this moment.");
    }
  }

  private getStylePrompt(style: LogoStyle): string {
    switch (style) {
      case LogoStyle.GEOMETRIC:
        return "Mathematically perfect geometric forms, balanced symmetry, Bauhaus influence.";
      case LogoStyle.TYPOGRAPHIC:
        return "Minimalist custom wordmark, refined kerning, modern sans-serif or elegant serif character.";
      case LogoStyle.ABSTRACT:
        return "Non-representational symbolic mark that captures brand essence through pure form.";
      case LogoStyle.MONOLINE:
        return "Consistent line weight throughout, clean modern line art, architectural clarity.";
      case LogoStyle.MINIMALIST_PICTORIAL:
        return "A single, highly simplified icon representing a relevant object, reduced to its core geometry.";
      default:
        return "Minimalist and clean.";
    }
  }
}