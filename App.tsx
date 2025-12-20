
import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import ChatInterface from './components/ChatInterface';
import SessionSummary from './components/SessionSummary';
import LiveMode from './components/LiveMode';
import Dashboard from './components/Dashboard';
import { UserProfile, ChatMessage } from './types';

export enum ViewState {
  ONBOARDING,
  DASHBOARD,
  CHAT,
  SUMMARY
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Load profile from local storage if exists
  useEffect(() => {
    const saved = localStorage.getItem('fluentify_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setView(ViewState.DASHBOARD);
      } catch (e) {
        console.error("Failed to parse saved profile", e);
      }
    }
  }, []);

  const handleOnboardingComplete = (p: UserProfile) => {
    setProfile(p);
    localStorage.setItem('fluentify_profile', JSON.stringify(p));
    setView(ViewState.DASHBOARD);
  };

  const handleEndSession = () => {
    setView(ViewState.SUMMARY);
  };

  const handleRestart = () => {
    setMessages([]); // Reset messages for new session
    setView(ViewState.DASHBOARD);
  };

  const addMessages = (newMsgs: ChatMessage[]) => {
    setMessages(prev => [...prev, ...newMsgs]);
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 transition-colors duration-500 flex flex-col">
      <main className="flex-1">
        {view === ViewState.ONBOARDING && (
          <Onboarding onComplete={handleOnboardingComplete} />
        )}
        
        {view === ViewState.DASHBOARD && profile && (
          <Dashboard 
            profile={profile} 
            onStartChat={() => setView(ViewState.CHAT)}
          />
        )}

        {view === ViewState.CHAT && profile && (
          <>
            <ChatInterface 
              profile={profile} 
              messages={messages}
              setMessages={setMessages}
              onEndSession={handleEndSession} 
              onStartLive={() => setIsLiveMode(true)}
              onBack={() => setView(ViewState.DASHBOARD)}
            />
            {isLiveMode && (
              <LiveMode 
                profile={profile} 
                onClose={(callHistory) => {
                  addMessages(callHistory);
                  setIsLiveMode(false);
                }} 
              />
            )}
          </>
        )}

        {view === ViewState.SUMMARY && (
          <SessionSummary history={messages} onRestart={handleRestart} />
        )}
      </main>
      
      {/* Developer Credit Footer */}
      <footer className="py-4 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-white border-t border-slate-100">
        Developed by <span className="text-indigo-600">Jisan</span>
      </footer>
    </div>
  );
};

export default App;
