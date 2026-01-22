import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
      <div className="max-w-2xl z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-blue-400 uppercase bg-blue-400/10 rounded-full border border-blue-400/20">
          Hello User! Welcome to the Auction Portal
        </div>
        
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 mb-6">
          Auction Master Pro
        </h1>
        
        <p className="text-slate-400 text-xl mb-12 max-w-lg mx-auto leading-relaxed">
          The ultimate platform for real-time sports player bidding and team management.
        </p>
        
        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={() => navigate('/login')}
            className="group flex items-center gap-4 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all transform hover:scale-105 shadow-2xl shadow-blue-500/40 active:scale-95"
          >
            {/* Lock Icon */}
            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-lg font-bold">proceed to login</span>
          </button>
          
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium uppercase tracking-widest">System Ready</span>
          </div>
        </div>
      </div>
      
      {/* Decorative Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px]"></div>
    </div>
  );
};

export default Home;