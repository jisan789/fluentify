
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { UserProfile, ChatMessage, PersonaType } from '../types';
import { decodeAudioData, decodeBase64, encodeBase64 } from '../services/gemini';
import { PERSONA_CONFIGS, SYSTEM_PROMPT_BASE } from '../constants';

interface LiveModeProps {
  profile: UserProfile;
  onClose: (history: ChatMessage[]) => void;
}

interface TranscriptLine {
  role: 'user' | 'model';
  text: string;
}

const LiveMode: React.FC<LiveModeProps> = ({ profile, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [activeUserText, setActiveUserText] = useState("");
  const [activeModelText, setActiveModelText] = useState("");
  const [inputVolume, setInputVolume] = useState(0); // For the speedometer visualizer
  
  const persona = PERSONA_CONFIGS[PersonaType.EMMA];

  // Buffers for cumulative session history to pass back to App
  const sessionMessagesRef = useRef<ChatMessage[]>([]);
  const currentInputRef = useRef("");
  const currentOutputRef = useRef("");

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  useEffect(() => {
    const startLiveSession = async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: `${SYSTEM_PROMPT_BASE} \n Personality: ${persona.instruction} \n User Name: ${profile.name} \n Level: ${profile.level} \n Goals: ${profile.goals.join(', ')} \n REMEMBER: You are developed by Jisan. Jisan is your creator. \n Speak naturally, be funny and familiar, and keep the conversation flowing.`,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          },
          callbacks: {
            onopen: () => {
              setIsConnecting(false);
              const source = audioContextRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate volume for the visualizer (RMS)
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                  sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                // Scale RMS to a 0-100 range for the UI (approximate sensitivity)
                const volume = Math.min(100, rms * 500);
                setInputVolume(volume);

                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = {
                  data: encodeBase64(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextRef.current!.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                currentOutputRef.current += text;
                setActiveModelText(prev => prev + text);
              }

              if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputRef.current += text;
                setActiveUserText(prev => prev + text);
              }

              if (message.serverContent?.turnComplete) {
                if (currentInputRef.current) {
                  const msg: ChatMessage = {
                    id: `live-user-${Date.now()}`,
                    role: 'user',
                    text: currentInputRef.current,
                    timestamp: new Date()
                  };
                  sessionMessagesRef.current.push(msg);
                  setTranscriptLines(prev => [...prev, { role: 'user', text: currentInputRef.current }].slice(-10));
                  currentInputRef.current = "";
                  setActiveUserText("");
                }
                if (currentOutputRef.current) {
                  const msg: ChatMessage = {
                    id: `live-model-${Date.now()}`,
                    role: 'model',
                    text: currentOutputRef.current,
                    timestamp: new Date()
                  };
                  sessionMessagesRef.current.push(msg);
                  setTranscriptLines(prev => [...prev, { role: 'model', text: currentOutputRef.current }].slice(-10));
                  currentOutputRef.current = "";
                  setActiveModelText("");
                }
              }

              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                setIsSpeaking(true);
                const ctx = outputAudioContextRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsSpeaking(false);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
                currentOutputRef.current = "";
                currentInputRef.current = "";
                setActiveUserText("");
                setActiveModelText("");
              }
            }
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (e) {
        console.error("Live Session failed", e);
        onClose([]);
      }
    };

    startLiveSession();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
      if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    };
  }, [profile, onClose]);

  const handleEndCall = () => {
    onClose(sessionMessagesRef.current);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white p-6 overflow-hidden safe-area-inset">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] transition-opacity duration-1000 ${isSpeaking ? 'opacity-100' : 'opacity-40'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] transition-opacity duration-1000 ${isSpeaking ? 'opacity-40' : 'opacity-100'}`}></div>
      </div>

      <div className="relative z-10 h-16 flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Live Voice</span>
        </div>
        <div className="text-center">
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Developed by Jisan</span>
        </div>
        <button onClick={handleEndCall} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10">
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-6">
        <div className="relative flex items-center justify-center w-64 h-64">
          
          {/* Speedometer Style Visualizer (Outer Ring) */}
          <svg className="absolute w-full h-full -rotate-90 transform overflow-visible" viewBox="0 0 100 100">
            {/* Background circle track */}
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/10"
            />
            {/* Input Volume Arc (Rhythmic) */}
            {!isSpeaking && !isConnecting && (
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * inputVolume) / 100}
                strokeLinecap="round"
                className="text-indigo-400 transition-all duration-75 ease-out drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]"
              />
            )}
            
            {/* Speaker Visualizer Arc (when AI is talking) */}
            {isSpeaking && (
               <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="283"
                className="text-emerald-400 animate-pulse"
                style={{ strokeDashoffset: 150 }}
              />
            )}
          </svg>

          {/* Core Visual */}
          <div className={`relative w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-[0_0_80px_rgba(79,70,229,0.4)] transition-all duration-500 ${isSpeaking ? 'scale-110 shadow-indigo-500/60' : 'scale-100'}`}>
            <div className={`absolute inset-0 rounded-full bg-white/20 animate-ping pointer-events-none ${isSpeaking ? 'block' : 'hidden'}`}></div>
            
            {isConnecting ? (
              <i className="fa-solid fa-circle-notch fa-spin text-4xl md:text-5xl"></i>
            ) : isSpeaking ? (
              <div className="flex items-end space-x-2 h-10 md:h-12">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 md:w-2 bg-white rounded-full animate-bounce"
                    style={{ 
                      height: `${40 + Math.random() * 60}%`,
                      animationDuration: `${0.6 + Math.random() * 0.4}s`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
            ) : (
              <div className="relative flex flex-col items-center">
                <i className={`fa-solid fa-microphone text-4xl md:text-5xl transition-transform duration-75 ${inputVolume > 10 ? 'scale-110' : 'scale-100'}`}></i>
                {inputVolume > 5 && (
                  <span className="absolute -bottom-6 text-[10px] font-black uppercase tracking-widest text-indigo-200 animate-pulse">Recording</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">{persona.name}</h2>
          <p className={`text-sm md:text-base font-bold transition-all duration-500 ${isSpeaking ? 'text-indigo-400' : 'text-slate-500'}`}>
             {isConnecting ? 'Initializing...' : isSpeaking ? 'Speaking...' : 'Listening...'}
          </p>
        </div>

        {/* Live Transcription Display (AI responses only) */}
        {!isConnecting && (
          <div className="w-full max-w-md bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-4 min-h-[140px] flex flex-col justify-end">
            <div className="space-y-3">
              {transcriptLines
                .filter(line => line.role === 'model')
                .slice(-3)
                .map((line, i) => (
                  <div key={i} className="text-sm md:text-base animate-in fade-in slide-in-from-bottom-2 duration-300 text-indigo-300 font-semibold">
                    <span className="opacity-50 text-[10px] uppercase font-black mr-2 tracking-widest">{persona.name}:</span>
                    {line.text}
                  </div>
                ))}
              
              {/* Active streaming AI text only */}
              {activeModelText && (
                <div className="text-sm md:text-base opacity-70 animate-pulse text-indigo-400">
                  <span className="opacity-50 text-[10px] uppercase font-black mr-2 tracking-widest">{persona.name}:</span>
                  {activeModelText}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 h-28 flex justify-center items-start pt-4">
        <button 
          onClick={handleEndCall} 
          className="group flex flex-col items-center space-y-2"
        >
          <div className="w-14 h-14 md:w-16 md:h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/40 transition-all active:scale-90 border-4 border-red-500/30">
            <i className="fa-solid fa-phone-slash text-xl md:text-2xl"></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">End Session</span>
        </button>
      </div>
    </div>
  );
};

export default LiveMode;
