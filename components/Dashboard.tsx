
import React from 'react';
import { UserProfile, PersonaType } from '../types';
import { PERSONA_CONFIGS } from '../constants';

interface DashboardProps {
  profile: UserProfile;
  onStartChat: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, onStartChat }) => {
  const persona = PERSONA_CONFIGS[PersonaType.EMMA];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      {/* Header section */}
      <div className="text-center md:text-left">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Hello, {profile.name}! 👋</h1>
        <p className="text-slate-500 mt-3 text-xl font-medium">Your personalized English journey continues.</p>
      </div>

      {/* Main Action Card - The focus of the app */}
      <div className="relative group overflow-hidden bg-indigo-600 rounded-[3rem] p-12 md:p-16 text-white shadow-2xl shadow-indigo-200 border-4 border-indigo-500">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center text-6xl shadow-2xl float-animation border-8 border-indigo-400">
            😊
          </div>
          <div className="space-y-4 max-w-lg">
            <div className="inline-block px-5 py-2 bg-indigo-500 rounded-full text-xs font-black tracking-widest uppercase border border-indigo-400">
              {profile.level} Level
            </div>
            <h2 className="text-4xl font-black leading-tight">Practice with {persona.name}</h2>
            <p className="text-indigo-100 text-lg">{persona.description}</p>
          </div>
          <button 
            onClick={onStartChat}
            className="px-12 py-5 bg-white text-indigo-600 rounded-2xl font-black text-xl shadow-xl hover:shadow-indigo-400/50 hover:-translate-y-2 transition-all active:scale-95"
          >
            Start Conversation
          </button>
        </div>
      </div>

      {/* Credits Section */}
      <div className="pt-10 flex flex-col items-center justify-center space-y-4">
        <div className="h-px w-24 bg-slate-200"></div>
        <div className="text-center group">
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">Exclusive Platform</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter group-hover:text-indigo-600 transition-colors">
            Developed by Jisan
          </h3>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
