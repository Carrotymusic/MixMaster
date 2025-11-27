
import React, { useState } from 'react';
import Home from './components/Home';
import Game from './components/Game';
import CustomCursor from './components/CustomCursor';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'game'>('home');

  return (
    <div className="bg-darkbg text-white min-h-screen relative font-grotesk selection:bg-carroty selection:text-black">
      {/* Global Noise Overlay */}
      <div className="fixed top-0 left-0 w-full h-full z-[9999] bg-noise pointer-events-none"></div>
      
      {/* Custom Cursor */}
      <CustomCursor />

      {/* Navigation - Fixed */}
      <nav className="fixed top-0 left-0 w-full px-[6%] py-6 flex justify-between items-center z-[100] mix-blend-exclusion pointer-events-none">
        
        {/* Logo Area - Pointer Events Auto to allow clicking */}
        <div 
            className="flex items-center gap-4 cursor-pointer pointer-events-auto group"
            onClick={() => setCurrentPage('home')}
        >
            <img 
                src="/carroty.jpg"
                alt="Profile"
                className="w-12 h-12 object-cover grayscale rounded-full border border-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:grayscale-0 group-hover:border-carroty"
            />
            <div className="font-syne font-bold text-2xl tracking-tighter">
                CARROTY<span className="text-carroty">.</span>
            </div>
        </div>

        {/* Menu Links */}
        <div className="flex md:gap-8 gap-4 pointer-events-auto">
            <button 
                onClick={() => setCurrentPage('home')}
                className={`text-sm uppercase tracking-widest relative group ${currentPage === 'home' ? 'text-white' : 'text-gray-400'}`}
            >
                Portfolio
                <span className={`absolute -bottom-1 left-0 h-[1px] bg-carroty transition-all duration-300 ${currentPage === 'home' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button 
                onClick={() => setCurrentPage('game')}
                className={`text-sm uppercase tracking-widest relative group flex items-center gap-1 ${currentPage === 'game' ? 'text-carroty' : 'text-gray-400'}`}
            >
                Symulator Mixu 🎛️
                <span className={`absolute -bottom-1 left-0 h-[1px] bg-carroty transition-all duration-300 ${currentPage === 'game' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main>
        {currentPage === 'home' ? <Home onNavigateToGame={() => setCurrentPage('game')} /> : <Game />}
      </main>
    </div>
  );
};

export default App;
