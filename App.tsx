
import React, { useState, useEffect, useRef } from 'react';
import { AppStatus, ArchitectSession, ClarificationQuestion } from './types.ts';
import { analyzeIntent, refinePrompt } from './services/gemini.ts';
import { 
  History, Cpu, Sparkles, Clipboard, Check, ChevronRight, 
  Settings, Key, AlertCircle, RefreshCw, Plus 
} from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [userInput, setUserInput] = useState('');
  const [session, setSession] = useState<ArchitectSession | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [history, setHistory] = useState<ArchitectSession[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // API 키 선택 여부 확인 (브릿지 존재 시)
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
    
    const saved = localStorage.getItem('prompt_architect_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [status, session]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true); // 선택했다고 가정하고 진행
    }
  };

  const handleStart = async () => {
    if (!userInput.trim()) return;
    setStatus(AppStatus.ANALYZING);
    setError(null);

    try {
      const result = await analyzeIntent(userInput);
      const newSession: ArchitectSession = {
        id: Date.now().toString(),
        initialInput: userInput,
        questions: result.questions?.map(q => ({ id: Math.random().toString(), question: q })) || [],
        finalResult: result.finalPrompt,
        timestamp: Date.now()
      };
      setSession(newSession);
      if (result.finalPrompt) {
        setStatus(AppStatus.COMPLETED);
        saveToHistory(newSession);
      } else {
        setStatus(AppStatus.CLARIFYING);
      }
    } catch (err: any) {
      if (err.message?.includes("entity was not found")) {
        setHasKey(false);
        setError("API 키가 유효하지 않습니다. 다시 설정해주세요.");
      } else {
        setError("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
      setStatus(AppStatus.ERROR);
    }
  };

  const handleAnswer = (id: string, answer: string) => {
    if (!session) return;
    const updated = session.questions.map(q => q.id === id ? { ...q, answer } : q);
    setSession({ ...session, questions: updated });
  };

  const handleRefine = async () => {
    if (!session) return;
    if (session.questions.some(q => !q.answer?.trim())) return;

    setStatus(AppStatus.GENERATING);
    try {
      const final = await refinePrompt(session.initialInput, session.questions);
      const updatedSession = { ...session, finalResult: final };
      setSession(updatedSession);
      saveToHistory(updatedSession);
      setStatus(AppStatus.COMPLETED);
    } catch (err) {
      setError("최종 생성에 실패했습니다.");
      setStatus(AppStatus.ERROR);
    }
  };

  const saveToHistory = (s: ArchitectSession) => {
    const newHistory = [s, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('prompt_architect_history', JSON.stringify(newHistory));
  };

  const copyPrompt = () => {
    if (session?.finalResult) {
      navigator.clipboard.writeText(session.finalResult.fullMarkdown);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100 max-w-lg mx-auto border-x border-gray-900 shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 p-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
            <Cpu size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight leading-none">Architect</h1>
            <p className="text-[10px] text-gray-500 uppercase font-semibold mt-1">Prompt Engineering</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!hasKey && (
            <button 
              onClick={handleOpenKeySelector}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full text-[11px] font-bold border border-amber-500/20"
            >
              <Key size={12} />
              Key 연결
            </button>
          )}
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <History size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6">
        {status === AppStatus.IDLE && (
          <div className="animate-in text-center space-y-8 pt-12">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20"></div>
              <div className="relative w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                <Sparkles size={40} className="text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight">아이디어를 프롬프트로.</h2>
              <p className="text-gray-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                Gemini 3 Pro의 심층 추론 기술을 활용하여 고성능 구조화된 프롬프트를 설계합니다.
              </p>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-5 text-left transition-all focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="어떤 AI 작업을 원하시나요? 간단하게 적어주세요."
                className="w-full bg-transparent outline-none resize-none h-32 text-gray-200 placeholder-gray-600 text-lg leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Loading States */}
        {(status === AppStatus.ANALYZING || status === AppStatus.GENERATING) && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                <Cpu size={24} className="animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-gray-200">아키텍트가 추론 중입니다...</p>
              <p className="text-xs text-gray-500">Thinking Budget: 32,768 tokens</p>
            </div>
          </div>
        )}

        {/* Questions Phase */}
        {status === AppStatus.CLARIFYING && session && (
          <div className="space-y-4 animate-in">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">설계 정교화 질문</h3>
            {session.questions.map((q, idx) => (
              <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-medium text-blue-400">Q{idx + 1}. {q.question}</p>
                <input
                  type="text"
                  value={q.answer || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder="답변을 입력하세요..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
                />
              </div>
            ))}
          </div>
        )}

        {/* Completion Phase */}
        {status === AppStatus.COMPLETED && session?.finalResult && (
          <div className="space-y-6 animate-in pb-10">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="bg-emerald-500 p-1.5 rounded-full">
                <Check size={14} className="text-white" />
              </div>
              <p className="text-sm font-bold text-emerald-400">프롬프트 설계가 완료되었습니다!</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 bg-gray-800/40 border-b border-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Output Architecture</span>
                </div>
                <button 
                  onClick={copyPrompt}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${copySuccess ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                  {copySuccess ? <><Check size={14}/> 복사됨</> : <><Clipboard size={14}/> 복사하기</>}
                </button>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {session.finalResult.fullMarkdown}
                </pre>
              </div>
              <div className="p-4 bg-gray-950/50 border-t border-gray-800 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Model</p>
                  <p className="text-xs font-mono text-blue-400">{session.finalResult.apiConfig.recommendedModel}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Thinking</p>
                  <p className="text-xs font-mono text-purple-400">{session.finalResult.apiConfig.thinkingBudget} tk</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 animate-in">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </main>

      {/* Floating Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 z-50">
        <div className="glass-panel rounded-[2rem] p-2 flex items-center gap-2 shadow-2xl">
          {status === AppStatus.IDLE && (
            <button 
              onClick={handleStart}
              disabled={!userInput.trim()}
              className="w-full py-4 bg-blue-600 disabled:opacity-50 disabled:bg-gray-800 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              프롬프트 설계하기 <ChevronRight size={20} />
            </button>
          )}
          
          {status === AppStatus.CLARIFYING && (
            <button 
              onClick={handleRefine}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              최종 결과물 생성 <Sparkles size={18} />
            </button>
          )}

          {status === AppStatus.COMPLETED && (
            <button 
              onClick={() => { setStatus(AppStatus.IDLE); setUserInput(''); setSession(null); }}
              className="w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              새로운 설계 시작 <Plus size={18} />
            </button>
          )}

          {status === AppStatus.ERROR && (
            <button 
              onClick={handleStart}
              className="w-full py-4 bg-gray-800 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              재시도 <RefreshCw size={18} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;
