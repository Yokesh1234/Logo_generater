
import React, { useState, useCallback, useEffect } from 'react';
import { LogoStyle, ColorPalette, LogoRequest, GeneratedLogo } from './types';
import { GeminiService } from './services/geminiService';
import LogoCard from './components/LogoCard';

const App: React.FC = () => {
  const [request, setRequest] = useState<LogoRequest>({
    brandName: '',
    industry: '',
    style: LogoStyle.GEOMETRIC,
    palette: ColorPalette.MONOCHROME,
    customDetails: '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedLogo[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRequest(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.brandName.trim()) {
      setError("Please enter a brand name.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const gemini = GeminiService.getInstance();
      const imageUrl = await gemini.generateLogo(request);
      
      const newLogo: GeneratedLogo = {
        id: Math.random().toString(36).substr(2, 9),
        imageUrl,
        prompt: `Logo for ${request.brandName}`,
        timestamp: Date.now(),
        request: { ...request }
      };

      setHistory(prev => [newLogo, ...prev]);
      // Stay on current page or switch? Switching to gallery helps see the result
      // But keeping on create page with the big preview is better UX
    } catch (err: any) {
      setError(err.message || "Failed to generate logo. Please try again.");
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
        if (!ctx) return reject('Canvas context unavailable');

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Iterate through pixels and make white/near-white transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // If the pixel is very close to white, set alpha to 0
          if (r > 248 && g > 248 && b > 248) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject('Failed to load image for processing');
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
      link.download = `${fileName}-${transparent ? 'transparent' : 'white'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      alert("There was an issue processing the image for download.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white rounded-sm rotate-45"></div>
            </div>
            <span className="text-2xl font-bold heading-font tracking-tight">Minim<span className="text-gray-400">Logo</span></span>
          </div>
          
          <nav className="flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('create')}
              className={`text-sm font-semibold transition-colors ${activeTab === 'create' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
            >
              Generate
            </button>
            <button 
              onClick={() => setActiveTab('gallery')}
              className={`text-sm font-semibold transition-colors ${activeTab === 'gallery' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
            >
              My Library {history.length > 0 && <span className="ml-1 bg-black text-white text-[10px] px-1.5 py-0.5 rounded-full">{history.length}</span>}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Column: Form */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl font-extrabold heading-font leading-tight text-gray-900">
                  Refined Design,<br />Instantly.
                </h1>
                <p className="text-gray-500 text-lg max-w-md font-light leading-relaxed">
                  Craft a professional identity with AI-powered precision. Supports instant background removal.
                </p>
              </div>

              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">Brand Name</label>
                    <input 
                      type="text"
                      name="brandName"
                      value={request.brandName}
                      onChange={handleInputChange}
                      placeholder="e.g. Lumina"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">Industry</label>
                    <input 
                      type="text"
                      name="industry"
                      value={request.industry}
                      onChange={handleInputChange}
                      placeholder="e.g. Fintech"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">Design Style</label>
                    <select 
                      name="style"
                      value={request.style}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none cursor-pointer"
                    >
                      {Object.values(LogoStyle).map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">Color Palette</label>
                    <select 
                      name="palette"
                      value={request.palette}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all appearance-none cursor-pointer"
                    >
                      {Object.values(ColorPalette).map(palette => (
                        <option key={palette} value={palette}>{palette}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">Creative Direction</label>
                  <textarea 
                    name="customDetails"
                    value={request.customDetails}
                    onChange={handleInputChange}
                    placeholder="Vibe, symbols, or specific details..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all min-h-[100px] resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-zinc-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-lg shadow-black/10"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span>Curating Design...</span>
                    </div>
                  ) : "Generate Identity"}
                </button>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                    {error}
                  </div>
                )}
              </form>
            </div>

            {/* Right Column: Preview Area */}
            <div className="hidden lg:block relative group">
              <div className="sticky top-32 bg-zinc-900 rounded-[3.5rem] p-1 shadow-2xl overflow-hidden aspect-[4/5] flex flex-col">
                <div className="flex-1 bg-white m-1 rounded-[3.2rem] flex flex-col items-center justify-center p-12 text-center space-y-6">
                  {!isGenerating && history.length === 0 ? (
                    <>
                      <div className="w-32 h-32 border-4 border-dashed border-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold heading-font text-gray-900">Concept Preview</h3>
                        <p className="text-gray-400 text-sm">Enter brand details to visualize identity.</p>
                      </div>
                    </>
                  ) : isGenerating ? (
                    <div className="space-y-8 flex flex-col items-center">
                       <div className="relative">
                          <div className="w-56 h-56 border-2 border-gray-50 rounded-[2.5rem] animate-pulse"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-10 h-10 border-[3px] border-black border-t-transparent rounded-full animate-spin"></div>
                          </div>
                       </div>
                       <div className="space-y-3">
                          <p className="text-black font-bold tracking-widest text-[10px] uppercase animate-pulse">Processing Vector...</p>
                          <div className="flex gap-1.5 justify-center">
                             {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-black rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}}></div>)}
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-10 w-full animate-in zoom-in duration-500">
                      <div className="bg-white p-10 rounded-3xl border border-gray-50 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] transition-all hover:shadow-2xl">
                        <img 
                          src={history[0].imageUrl} 
                          alt="Generated logo preview" 
                          className="w-full h-auto object-contain max-h-72 mx-auto"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Master Concept</p>
                          <h2 className="text-3xl font-extrabold heading-font text-gray-900">{history[0].request.brandName}</h2>
                        </div>
                        <div className="flex gap-4 justify-center">
                          <button 
                            onClick={() => downloadLogo(history[0], false)}
                            className="bg-gray-100 text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
                          >
                            White PNG
                          </button>
                          <button 
                            onClick={() => downloadLogo(history[0], true)}
                            className="bg-black text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2"
                          >
                            Transparent PNG
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
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                   <h2 className="text-4xl font-extrabold heading-font">Design Archive</h2>
                   <p className="text-gray-500">Your collection of AI-crafted identities.</p>
                </div>
                {history.length > 0 && (
                   <button 
                    onClick={() => setHistory([])}
                    className="text-xs font-bold text-gray-300 hover:text-red-500 transition-colors uppercase tracking-widest"
                   >
                     Clear Archive
                   </button>
                )}
             </div>

             {history.length > 0 ? (
               <div className="logo-grid">
                 {history.map((logo) => (
                   <LogoCard 
                    key={logo.id} 
                    logo={logo} 
                    onDownload={downloadLogo} 
                   />
                 ))}
               </div>
             ) : (
               <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                    <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Your archive is empty</h3>
                    <p className="text-gray-400 max-w-xs mx-auto text-sm">Every identity you generate will be safely stored here until you clear them.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('create')}
                    className="bg-black text-white px-10 py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-black/5"
                  >
                    Start Designing
                  </button>
               </div>
             )}
          </div>
        )}
      </main>

      <footer className="py-16 mt-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-3 opacity-20 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <div className="w-6 h-6 bg-black rounded-sm rotate-45"></div>
            <span className="text-xl font-bold heading-font tracking-tighter">MinimLogo</span>
          </div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.4em]">Proprietary Identity Engine • Powered by Gemini AI</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
