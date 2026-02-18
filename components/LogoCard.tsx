
import React from 'react';
import { GeneratedLogo } from '../types.ts';

interface LogoCardProps {
  logo: GeneratedLogo;
  onDownload: (logo: GeneratedLogo, transparent: boolean) => void;
}

const LogoCard: React.FC<LogoCardProps> = ({ logo, onDownload }) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="aspect-square bg-white relative p-4 flex items-center justify-center">
        <img 
          src={logo.imageUrl} 
          alt={logo.request.brandName} 
          className="max-w-full max-h-full object-contain"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 px-6">
          <button 
            onClick={() => onDownload(logo, false)}
            className="w-full bg-white text-black py-2 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm"
          >
            White PNG
          </button>
          <button 
            onClick={() => onDownload(logo, true)}
            className="w-full bg-zinc-800 text-white py-2 rounded-full text-xs font-bold hover:bg-zinc-700 transition-colors border border-white/20"
          >
            Transparent PNG
          </button>
        </div>
      </div>
      <div className="p-4 bg-gray-50/50 border-t border-gray-100">
        <h3 className="font-semibold text-gray-900 truncate text-sm">{logo.request.brandName}</h3>
        <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest font-bold">{logo.request.style}</p>
      </div>
    </div>
  );
};

export default LogoCard;
