
import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { ViewType, PlantDiagnosisResult, SymptomCardData, DiagnosisHistoryItem } from './types';
import { diagnosePlantByImage, diagnosePlantByText } from './geminiService';
import { 
  Bell, 
  Home, 
  Leaf, 
  BookOpen, 
  MessageCircle, 
  User, 
  Search, 
  Camera, 
  FileText, 
  Lightbulb, 
  HeartPulse, 
  ShieldCheck, 
  History, 
  File,
  ChevronRight
} from 'lucide-react';

// --- Reusable Components ---

const Header: React.FC<{ title?: string }> = ({ title = "꽃의사" }) => (
  <header className="flex items-center justify-between px-6 pt-12 pb-4">
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/10 shadow-sm">
        <img alt="꽃의사 로고" className="w-full h-full object-cover" src="https://picsum.photos/seed/flower-and-stethoscope/180/180" referrerPolicy="no-referrer" />
      </div>
      <h1 className="text-[#0d1b12] dark:text-white text-xl font-extrabold tracking-tight">
        {title} <span className="text-primary font-medium text-sm ml-1">진단</span>
      </h1>
    </div>
    <div className="flex items-center gap-2">
      <button className="size-10 flex items-center justify-center rounded-full bg-background-light dark:bg-white/5">
        <Bell className="size-5 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  </header>
);

const SymptomCard: React.FC<{ data: SymptomCardData }> = ({ data }) => (
  <div className="min-w-[280px] bg-white dark:bg-white/5 rounded-2xl border border-background-light dark:border-white/10 overflow-hidden shadow-sm">
    <div className="h-40 w-full relative">
      <img alt={data.title} className="w-full h-full object-cover" src={data.imageUrl} referrerPolicy="no-referrer" />
      <div className={`absolute top-3 left-3 ${data.tagColor} text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider`}>
        {data.tag}
      </div>
    </div>
    <div className="p-4">
      <h4 className="font-bold text-lg leading-tight mb-1">{data.title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{data.description}</p>
      <button className="w-full py-2 bg-primary/10 text-primary font-bold rounded-lg text-sm hover:bg-primary/20 transition-colors">
        치료 방법 보기
      </button>
    </div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('home');
  const [loadingMsg, setLoadingMsg] = useState('AI가 식물을 분석 중입니다...');
  const [diagnosis, setDiagnosis] = useState<PlantDiagnosisResult | null>(null);
  const [history, setHistory] = useState<DiagnosisHistoryItem[]>([]);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('plant_diagnosis_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage when updated
  useEffect(() => {
    localStorage.setItem('plant_diagnosis_history', JSON.stringify(history));
  }, [history]);

  const symptomData: SymptomCardData[] = [
    {
      id: '1',
      title: '몬스테라: 갈색 반점',
      description: '과습이나 낮은 습도가 원인일 수 있습니다.',
      imageUrl: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=400',
      tag: '가장 빈번함',
      tagColor: 'bg-red-500'
    },
    {
      id: '2',
      title: '다육이: 뿌리 부패',
      description: '잎이 물러지는 것은 수분 과다 신호입니다.',
      imageUrl: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&q=80&w=400',
      tag: '계절 질환',
      tagColor: 'bg-orange-500'
    }
  ];

  const addToHistory = (result: PlantDiagnosisResult, base64Image?: string) => {
    const newItem: DiagnosisHistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      result,
      imageUrl: base64Image ? `data:image/jpeg;base64,${base64Image}` : undefined
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setView('loading');
    setLoadingMsg('이미지를 분석하고 있습니다...');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        const base64String = dataUrl.split(',')[1];
        const res = await diagnosePlantByImage(base64String, file.type);
        setDiagnosis(res);
        addToHistory(res, base64String);
        setView('result');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('진단 중 오류가 발생했습니다.');
      setView('home');
    }
  };

  const handleTextDiagnosis = async () => {
    if (!textInput.trim()) return;
    setView('loading');
    setLoadingMsg('증상을 분석하고 있습니다...');

    try {
      const res = await diagnosePlantByText(textInput);
      setDiagnosis(res);
      addToHistory(res);
      setView('result');
      setTextInput('');
    } catch (err) {
      console.error(err);
      alert('진단 중 오류가 발생했습니다.');
      setView('home');
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'home':
        return (
          <>
            <section className="px-6 py-4">
              <h2 className="text-2xl font-bold leading-tight tracking-tight dark:text-white">
                이 꽃이 <span className="text-primary">어디가 아프지?</span>
              </h2>
            </section>

            <section className="px-6 py-6 grid grid-cols-2 gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 bg-primary text-[#0d1b12] rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform h-44 text-center"
              >
                <div className="bg-white/30 p-3 rounded-full mb-4">
                  <Camera className="size-8" />
                </div>
                <span className="text-base font-bold leading-tight">사진 찍어<br />진단하기</span>
                <span className="text-[10px] opacity-80 mt-2">즉각적인 AI 분석</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*" 
              />
              
              <button 
                onClick={() => setView('text-input')}
                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-white/5 border-2 border-primary/20 text-[#0d1b12] dark:text-white rounded-2xl active:scale-95 transition-transform h-44 text-center"
              >
                <div className="bg-primary/10 p-3 rounded-full mb-4 text-primary">
                  <FileText className="size-8" />
                </div>
                <span className="text-base font-bold leading-tight">증상 입력하여<br />진단하기</span>
                <span className="text-[10px] text-[#4c9a66] mt-2">상세 증상 리포트</span>
              </button>
            </section>

            <section className="py-6">
              <div className="flex items-center justify-between px-6 mb-4">
                <h3 className="text-xl font-bold dark:text-white">자주 발생하는 증상</h3>
                <button className="text-primary font-bold text-sm">전체보기</button>
              </div>
              <div className="flex overflow-x-auto gap-4 px-6 hide-scrollbar">
                {symptomData.map(card => <SymptomCard key={card.id} data={card} />)}
              </div>
            </section>

            <section className="px-6 py-4">
              <div className="bg-background-light dark:bg-white/5 rounded-2xl p-5 flex items-start gap-4">
                <div className="text-primary">
                  <Lightbulb className="size-8" />
                </div>
                <div>
                  <h4 className="font-bold mb-1 dark:text-white">오늘의 관리 팁</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">식물에 물을 줄 때는 잎에 곰팡이가 생기지 않도록 뿌리 쪽에 직접 주세요.</p>
                </div>
              </div>
            </section>
          </>
        );

      case 'text-input':
        return (
          <section className="px-6 py-8 flex flex-col h-[70vh]">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">증상을 자세히 적어주세요</h2>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="예: 몬스테라 잎 끝이 갈색으로 변하고 아래쪽 잎이 노랗게 되어 떨어져요. 일주일에 한 번 물을 줍니다."
              className="flex-1 w-full p-4 bg-background-light dark:bg-white/5 border-none rounded-2xl text-base resize-none focus:ring-2 focus:ring-primary/50 mb-6 dark:text-white"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setView('home')}
                className="flex-1 py-4 bg-gray-200 dark:bg-white/10 rounded-xl font-bold"
              >
                취소
              </button>
              <button 
                onClick={handleTextDiagnosis}
                className="flex-[2] py-4 bg-primary text-[#0d1b12] rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                AI 진단 시작
              </button>
            </div>
          </section>
        );

      case 'loading':
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center h-[70vh]">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8"></div>
            <h3 className="text-xl font-bold mb-2 dark:text-white">{loadingMsg}</h3>
            <p className="text-sm text-gray-500">잠시만 기다려 주시면 최적의 치료법을 찾아드릴게요.</p>
          </div>
        );

      case 'result':
        if (!diagnosis) return null;
        return (
          <section className="px-6 py-6 pb-20">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold dark:text-white">진단 결과</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white ${
                diagnosis.severity === 'high' ? 'bg-red-500' : 
                diagnosis.severity === 'medium' ? 'bg-orange-500' : 'bg-green-500'
              }`}>
                위험도: {diagnosis.severity === 'high' ? '심각' : diagnosis.severity === 'medium' ? '주의' : '낮음'}
              </span>
            </div>

            <div className="bg-primary/10 rounded-2xl p-6 mb-6">
              <h3 className="text-primary font-bold text-sm mb-1 uppercase">분석된 식물</h3>
              <p className="text-xl font-bold mb-4 dark:text-white">{diagnosis.plantName}</p>
              
              <h3 className="text-primary font-bold text-sm mb-1 uppercase">진단명</h3>
              <p className="text-lg font-bold mb-4 dark:text-white">{diagnosis.diagnosis}</p>
              
              <h3 className="text-primary font-bold text-sm mb-1 uppercase">주요 원인</h3>
              <p className="text-gray-600 dark:text-gray-400">{diagnosis.cause}</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-lg mb-3 dark:text-white">
                  <HeartPulse className="size-6 text-primary" /> 치료 방법
                </h3>
                <ul className="space-y-2">
                  {diagnosis.treatment.map((t, i) => (
                    <li key={i} className="flex items-start gap-3 bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                      <span className="text-primary font-bold">•</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-bold text-lg mb-3 dark:text-white">
                  <ShieldCheck className="size-6 text-primary" /> 예방 가이드
                </h3>
                <ul className="space-y-2">
                  {diagnosis.preventiveMeasures.map((pm, i) => (
                    <li key={i} className="flex items-start gap-3 bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                      <span className="text-primary font-bold">•</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{pm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button 
              onClick={() => setView('home')}
              className="w-full py-4 bg-primary text-[#0d1b12] rounded-xl font-bold mt-10"
            >
              다시 진단하기
            </button>
          </section>
        );

      case 'history':
        return (
          <section className="px-6 py-4 pb-20">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">진단 히스토리</h2>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <History className="size-16 mb-4" />
                <p>아직 진단 기록이 없습니다.</p>
                <button 
                  onClick={() => setView('home')}
                  className="mt-6 text-primary font-bold border-b border-primary"
                >
                  첫 진단 시작하기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden shadow-sm">
                    <div className="flex p-4 gap-4">
                      <div className="size-20 bg-background-light dark:bg-white/10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} className="w-full h-full object-cover" alt="Diagnosed plant" referrerPolicy="no-referrer" />
                        ) : (
                          <File className="size-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-base dark:text-white">{item.result.plantName}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">{item.date}</span>
                        </div>
                        <p className="text-sm text-primary font-bold mb-1">{item.result.diagnosis}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{item.result.treatment[0]}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 px-4 py-2 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.result.severity === 'high' ? 'bg-red-100 text-red-600' : 
                          item.result.severity === 'medium' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {item.result.severity === 'high' ? '심각' : item.result.severity === 'medium' ? '주의' : '정상'}
                        </span>
                        <button 
                          onClick={() => { setDiagnosis(item.result); setView('result'); }}
                          className="text-xs font-bold text-primary flex items-center gap-1"
                        >
                          상세 리포트 보기 <ChevronRight className="size-3" />
                        </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => { if(confirm('히스토리를 모두 삭제할까요?')) { setHistory([]); localStorage.removeItem('plant_diagnosis_history'); } }}
                  className="w-full py-3 text-sm text-gray-400 font-medium"
                >
                  기록 전체 삭제
                </button>
              </div>
            )}
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative pb-8 shadow-2xl bg-white dark:bg-[#0d1b12] transition-colors duration-300">
      <Header title={view === 'history' ? "내 정보" : "꽃의사"} />
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
