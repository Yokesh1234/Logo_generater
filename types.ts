
export enum LogoStyle {
  GEOMETRIC = 'Geometric',
  TYPOGRAPHIC = 'Typographic',
  ABSTRACT = 'Abstract',
  MONOLINE = 'Monoline',
  MINIMALIST_PICTORIAL = 'Minimalist Pictorial'
}

export enum ColorPalette {
  MONOCHROME = 'Monochrome (B&W)',
  PASTEL = 'Soft Pastels',
  VIBRANT = 'Modern Vibrant',
  EARTHY = 'Natural Earthy',
  LUXURY = 'Gold & Charcoal'
}

export interface LogoRequest {
  brandName: string;
  slogan?: string;
  industry: string;
  style: LogoStyle;
  palette: ColorPalette;
  customDetails?: string;
}

export interface GeneratedLogo {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
  request: LogoRequest;
}
