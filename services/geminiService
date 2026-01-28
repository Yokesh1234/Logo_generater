
import { GoogleGenAI } from "@google/genai";
import { LogoRequest, LogoStyle } from "../types";

export class GeminiService {
  private static instance: GeminiService;
  private ai: GoogleGenAI;

  private constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public async generateLogo(request: LogoRequest): Promise<string> {
    const { brandName, slogan, industry, style, palette, customDetails } = request;

    const stylePrompt = this.getStylePrompt(style);
    
    const prompt = `
      Create a high-end, professional MINIMALIST vector logo for a brand named "${brandName}".
      Industry: ${industry}.
      ${slogan ? `Slogan: "${slogan}".` : ''}
      Style: ${stylePrompt}.
      Color Palette: ${palette}.
      Visual Requirements:
      - MANDATORY: Solid, pure white background (#FFFFFF). Absolutely no textures or shadows on the background.
      - Clean sharp lines, flat design, modern aesthetic.
      - Iconic and memorable simplicity.
      - High contrast.
      - ${customDetails || 'Professional and modern aesthetic.'}
      - Do NOT include mockups, photorealistic backgrounds, or complex textures. 
      - The logo mark should be clearly separated from the background.
    `.trim();

    try {
      const response = await this.ai.models.generateContent({
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

      // Find the image part in the response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      throw new Error("No image data found in response");
    } catch (error) {
      console.error("Error generating logo:", error);
      throw error;
    }
  }

  private getStylePrompt(style: LogoStyle): string {
    switch (style) {
      case LogoStyle.GEOMETRIC:
        return "Built with basic geometric shapes (circles, squares, triangles), mathematically balanced.";
      case LogoStyle.TYPOGRAPHIC:
        return "Focus on unique custom lettering or a stylized wordmark, elegant font-driven design.";
      case LogoStyle.ABSTRACT:
        return "Non-representational marks that convey the brand's essence through form and color.";
      case LogoStyle.MONOLINE:
        return "Consistent line weight throughout the design, clean and modern line art.";
      case LogoStyle.MINIMALIST_PICTORIAL:
        return "A highly simplified, iconic representation of a physical object related to the industry.";
      default:
        return "Minimalist and clean.";
    }
  }
}
