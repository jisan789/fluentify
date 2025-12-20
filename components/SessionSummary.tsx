
import React, { useEffect, useState } from 'react';
import { ChatMessage, SessionReport } from '../types';
import { generateSessionSummary } from '../services/gemini';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SessionSummaryProps {
  history: ChatMessage[];
  onRestart: () => void;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({ history, onRestart }) => {
  const [report, setReport] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await generateSessionSummary(history);
        setReport(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [history]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <div className="relative mb-8">
           <div className="w-20 h-20 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600">AI</div>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analyzing Session...</h2>
        <p className="text-slate-500 mt-2 max-w-xs text-center">Identifying your strengths and opportunities for improvement.</p>
      </div>
    );
  }

  const scoreData = [
    { name: 'Score', value: report?.score || 0 },
    { name: 'Remaining', value: 100 - (report?.score || 0) }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 overflow-y-auto">
      <div className="max-w-4xl mx-auto pt-16 px-6 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest">Session Report</div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Awesome work! 🏆</h1>
          <p className="text-slate-500 text-lg">You just completed a {Math.floor(history.length * 0.5)} minute practice session.</p>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] p-10 flex flex-col items-center shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl text-indigo-600"><i className="fa-solid fa-chart-pie"></i></div>
            <h3 className="text-xl font-bold text-slate-800 mb-6">Accuracy Score</h3>
            <div className="relative w-48 h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreData}
                    innerRadius={70}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    <Cell fill="#4f46e5" stroke="none" />
                    <Cell fill="#f1f5f9" stroke="none" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-900">{report?.score}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Correctness</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-200/50 flex flex-col justify-between">
            <div>
               <h3 className="text-xl font-bold mb-4 opacity-80">Fluency Insights</h3>
               <p className="text-indigo-50 leading-relaxed font-medium">
                 {report?.summary}
               </p>
            </div>
            <div className="mt-8 pt-8 border-t border-white/20 flex justify-between items-center">
               <div className="text-center">
                 <div className="text-3xl font-black">{history.length}</div>
                 <div className="text-[10px] uppercase font-bold opacity-60">Messages</div>
               </div>
               <div className="text-center">
                 <div className="text-3xl font-black">{history.filter(m => m.correction).length}</div>
                 <div className="text-[10px] uppercase font-bold opacity-60">Learnings</div>
               </div>
               <div className="text-center">
                 <div className="text-3xl font-black">{report?.fluencyScore || 85}%</div>
                 <div className="text-[10px] uppercase font-bold opacity-60">Fluency</div>
               </div>
            </div>
          </div>
        </div>

        {/* Learning Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-circle-exclamation"></i>
                </div>
                <h4 className="text-lg font-black text-slate-800">Top Mistakes</h4>
              </div>
              <ul className="space-y-4">
                 {report?.mistakes.slice(0, 4).map((m, i) => (
                   <li key={i} className="flex space-x-4">
                     <span className="text-indigo-200 font-black italic text-xl">0{i+1}</span>
                     <p className="text-sm text-slate-600 font-medium leading-relaxed">{m}</p>
                   </li>
                 ))}
              </ul>
           </div>

           <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-lightbulb"></i>
                </div>
                <h4 className="text-lg font-black text-slate-800">New Vocabulary</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                 {report?.newWords?.map((word, i) => (
                   <div key={i} className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold border border-slate-100 hover:bg-amber-50 hover:text-amber-700 transition-all cursor-default">
                     {word}
                   </div>
                 ))}
                 {(!report?.newWords || report?.newWords.length === 0) && (
                   <p className="text-slate-400 text-sm">No specific new words identified this session.</p>
                 )}
              </div>
              <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                 <p className="text-[11px] text-indigo-700 font-bold uppercase tracking-widest mb-1">Bonus Tip</p>
                 <p className="text-xs text-slate-600 italic">Try using these words in your next session to cement them in your memory!</p>
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center justify-center gap-4 py-10">
           <button 
             onClick={onRestart}
             className="w-full md:w-auto px-12 py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
           >
             Continue to Dashboard
           </button>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary;
