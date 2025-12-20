
import React, { useState } from 'react';
import { UserProfile, EnglishLevel, PersonaType, LearningGoal } from '../types';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    level: EnglishLevel.INTERMEDIATE,
    goals: ['Speaking Fluency'],
    persona: PersonaType.EMMA,
    streak: 0,
    lastActive: new Date().toISOString()
  });

  const GOALS: LearningGoal[] = ['Speaking Fluency', 'Vocabulary', 'Grammar', 'Business English', 'Exam Practice'];

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleGoal = (goal: LearningGoal) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal) 
        : [...prev.goals, goal]
    }));
  };

  const renderStep = () => {
    switch(step) {
      case 1: // Welcome & Name
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
                <i className="fa-solid fa-graduation-cap text-white text-4xl"></i>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome to Fluentify!</h1>
              <p className="text-slate-500 mt-2">Let's start your journey to English mastery.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">What should I call you?</label>
              <input
                type="text"
                autoFocus
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white outline-none transition-all text-lg font-medium"
                placeholder="Enter your name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <button
              disabled={!profile.name}
              onClick={nextStep}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-lg hover:bg-indigo-700 disabled:opacity-30 transition-all transform hover:scale-[1.02] active:scale-95"
            >
              Get Started
            </button>
          </div>
        );
      case 2: // Level Selection
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-bold text-slate-900">Your English Level</h2>
            <p className="text-slate-500">Choose the level that feels most comfortable for you.</p>
            <div className="space-y-3">
              {Object.values(EnglishLevel).map((level) => (
                <button
                  key={level}
                  onClick={() => setProfile({ ...profile, level })}
                  className={`w-full p-5 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${
                    profile.level === level 
                      ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">{level}</div>
                    <div className="text-xs text-slate-500">
                      {level === EnglishLevel.BEGINNER && 'I know some words and basic phrases.'}
                      {level === EnglishLevel.INTERMEDIATE && 'I can hold a basic conversation.'}
                      {level === EnglishLevel.ADVANCED && 'I want to polish my professional skills.'}
                    </div>
                  </div>
                  {profile.level === level && <i className="fa-solid fa-circle-check text-indigo-600 text-xl"></i>}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700">Back</button>
              <button onClick={nextStep} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700">Continue</button>
            </div>
          </div>
        );
      case 3: // Goals
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-bold text-slate-900">What are your goals?</h2>
            <p className="text-slate-500">Select everything you'd like to improve.</p>
            <div className="grid grid-cols-1 gap-3">
              {GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`p-4 rounded-xl text-left border-2 transition-all flex items-center space-x-3 ${
                    profile.goals.includes(goal)
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-slate-100 bg-white text-slate-600'
                  }`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center border ${profile.goals.includes(goal) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                    {profile.goals.includes(goal) && <i className="fa-solid fa-check text-white text-xs"></i>}
                  </div>
                  <span>{goal}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={prevStep} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700">Back</button>
              <button onClick={() => onComplete(profile)} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700">Start Learning</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-lg w-full bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 overflow-hidden border border-slate-100">
        <div className="mb-8 flex justify-between items-center px-1">
           {[1,2,3].map(s => (
             <div key={s} className={`h-1.5 flex-1 mx-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-indigo-600' : 'bg-slate-100'}`} />
           ))}
        </div>
        {renderStep()}
      </div>
    </div>
  );
};

export default Onboarding;
