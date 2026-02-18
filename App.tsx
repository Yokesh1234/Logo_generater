import React, { useState, useEffect } from 'react';
import { LogoStyle, ColorPalette, LogoRequest, GeneratedLogo } from './types.ts';
import { GeminiService } from './services/geminiService.ts';
import LogoCard from './components/LogoCard.tsx';

const LOADING_STEPS = [
  "Analyzing brand essence...",
  "Sketching initial concepts...",
  "Refining geometric proportions...",
  "Applying color theory...",
  "Finalizing vector paths..."
];

const App: React.FC = () => {
  const [request, setRequest] = useState<LogoRequest>({
    brandName: '',
    industry: '',
    style: LogoStyle.GEOMETRIC,
    palette: ColorPalette.MONOCHROME,
    customDetails: '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedLogo[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');

  // Rotate loading messages for a better UX during long generations
  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      setLoadingStep(0);
      interval = window.setInterval(() => {
        setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRequest(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.brandName.trim()) {
      setError("Please provide a brand name to begin.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const gemini = GeminiService.getInstance();
      const imageUrl = await gemini.generateLogo(request);
      
      const newLogo: GeneratedLogo = {
        id: Math.random().toString(36).substring(2, 11),
        imageUrl,
        prompt: `Logo for ${request.brandName}`,
        timestamp: Date.now(),
        request: { ...request }
      };

      setHistory(prev => [newLogo, ...prev]);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const removeBackground = async (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas unavailable');

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // More aggressive white detection for AI generated white backgrounds
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject('Failed to process image');
      img.src = dataUrl;
    });
  };

  const downloadLogo = async (logo: GeneratedLogo, transparent: boolean = false) => {
    try {
      let finalUrl = logo.imageUrl;
      if (transparent) {
        finalUrl = await removeBackground(logo.imageUrl);
      }
      const link = document.createElement('a');
      link.href = finalUrl;
      const fileName = logo.request.brandName.replace(/\s+/g, '-').toLowerCase();
      link.download = `${fileName}-${transparent ? 'transp' : 'solid'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Error generating download. Try saving the image directly.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('create')}>
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white rounded-sm rotate-45"></div>
            </div>
            <span className="text-2xl font-bold heading-font tracking-tight">Minim<span className="text-gray-400">Logo</span></span>
          </div>
          <nav className="flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('create')}
              className={`text-sm font-bold transition-all ${activeTab === 'create' ? 'text-black translate-y-[-1px]' : 'text-gray-400 hover:text-black'}`}
            >
              Generator
            </button>
            <button 
              onClick={() => setActiveTab('gallery')}
              className={`text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'gallery' ? 'text-black translate-y-[-1px]' : 'text-gray-400 hover:text-black'}`}
            >
              Archive
              {history.length > 0 && (
                <span className="bg-black text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                  {history.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start animate-in">
            <div className="space-y-10">
              <div className="space-y-3">
                <h1 className="text-5xl font-extrabold heading-font leading-tight text-gray-900 tracking-tight">
                  Intelligent Design,<br /><span className="text-gray-400">Pure Simplicity.</span>
                </h1>
                <p className="text-gray-500 text-lg max-w-md font-light leading-relaxed">
                  Generate professional, minimalist brand identities powered by advanced generative intelligence.
                </p>
              </div>

              <form onSubmit={handleGenerate} className="space-y-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-1">Brand Name</label>
                    <input 
                      type="text"
                      name="brandName"
                      value={request.brandName}
                      onChange={handleInputChange}
                      placeholder="e.g. Aether"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-1">Industry</label>
                    <input 
                      type="text"
                      name="industry"
                      value={request.industry}
                      onChange={handleInputChange}
                      placeholder="e.g. Architecture"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-1">Style</label>
                    <select 
                      name="style"
                      value={request.style}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all appearance-none cursor-pointer"
                    >
                      {Object.values(LogoStyle).map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-1">Palette</label>
                    <select 
                      name="palette"
                      value={request.palette}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all appearance-none cursor-pointer"
                    >
                      {Object.values(ColorPalette).map(palette => (
                        <option key={palette} value={palette}>{palette}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-1">Additional Details</label>
                  <textarea 
                    name="customDetails"
                    value={request.customDetails}
                    onChange={handleInputChange}
                    placeholder="Specific symbols, vibes, or brand traits..."
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-black/5 focus:bg-white focus:border-black transition-all min-h-[100px] resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-zinc-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-xl shadow-black/10 active:scale-[0.98]"
                >
                  {isGenerating ? "Processing Vision..." : "Generate Identity"}
                </button>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100 font-bold flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}
              </form>
            </div>

            <div className="hidden lg:block relative">
              <div className="sticky top-32 bg-zinc-900 rounded-[3.5rem] p-1.5 shadow-2xl overflow-hidden aspect-[4/5] flex flex-col group">
                <div className="flex-1 bg-white m-1 rounded-[3.2rem] flex flex-col items-center justify-center p-12 text-center space-y-8 relative overflow-hidden">
                  {!isGenerating && history.length === 0 ? (
                    <div className="space-y-6">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-110 duration-500">
                        <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold heading-font text-gray-900">Concept Preview</h3>
                        <p className="text-gray-400 text-sm font-light">Your generated brand assets will appear here.</p>
                      </div>
                    </div>
                  ) : isGenerating ? (
                    <div className="space-y-8 animate-pulse">
                      <div className="w-64 h-64 border-[3px] border-gray-50 rounded-[3rem] flex items-center justify-center relative">
                         <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                         <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gray-50/30 to-transparent animate-shimmer"></div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black">{LOADING_STEPS[loadingStep]}</p>
                        <div className="w-32 h-1 bg-gray-100 rounded-full mx-auto overflow-hidden">
                          <div className="h-full bg-black transition-all duration-300" style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10 w-full animate-in">
                      <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm transition-transform hover:scale-[1.02] duration-300">
                        <img 
                          src={history[0].imageUrl} 
                          alt="Latest result" 
                          className="w-full h-auto object-contain max-h-80 mx-auto"
                        />
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h2 className="text-4xl font-extrabold heading-font text-gray-900 tracking-tight">{history[0].request.brandName}</h2>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{history[0].request.style} Identity</p>
                        </div>
                        <div className="flex gap-4 justify-center">
                          <button 
                            onClick={() => downloadLogo(history[0], false)}
                            className="bg-gray-100 text-black px-8 py-4 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-colors"
                          >
                            Solid
                          </button>
                          <button 
                            onClick={() => downloadLogo(history[0], true)}
                            className="bg-black text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-lg shadow-black/20"
                          >
                            Transparent
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in">
             <div className="flex justify-between items-end border-b border-gray-100 pb-8">
                <div className="space-y-2">
                   <h2 className="text-5xl font-extrabold heading-font tracking-tight">Design Archive</h2>
                   <p className="text-gray-500 font-light">Your curated collection of minimalist identities.</p>
                </div>
                {history.length > 0 && (
                   <button onClick={() => setHistory([])} className="text-[10px] font-black text-gray-300 hover:text-red-500 transition-colors uppercase tracking-[0.2em] border-b border-transparent hover:border-red-500 pb-1">Flush Archive</button>
                )}
             </div>

             {history.length > 0 ? (
               <div className="logo-grid">
                 {history.map((logo) => (
                   <LogoCard key={logo.id} logo={logo} onDownload={downloadLogo} />
                 ))}
               </div>
             ) : (
               <div className="py-48 text-center">
                 <p className="text-gray-300 text-xl font-light italic">Your archive is currently empty.</p>
                 <button onClick={() => setActiveTab('create')} className="mt-4 text-black font-bold border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-colors">Start Designing</button>
               </div>
             )}
          </div>
        )}
      </main>

      <footer className="py-12 border-t border-gray-100 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">MinimLogo — Aesthetic Intelligence</p>
        </div>
      </footer>
    </div>
  );
};

export default App;