import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import FolderDetailScreen from './components/FolderDetailScreen';
import GameSettingsScreen from './components/GameSettingsScreen';
import SentenceGenerator from './components/SentenceGenerator';
import ModeSelector from './components/ModeSelector';
import FillBlankMode from './components/FillBlankMode';
import FullTypingMode from './components/FullTypingMode';
import ResultScreen from './components/ResultScreen';
import { saveSession } from './utils/history';

function App() {
  const [appState, setAppState] = useState('HOME'); 
  // HOME, FOLDER_DETAIL, SETTINGS, GENERATE, MODE_SELECT, GAME_FILL_BLANK, GAME_FULL_TYPING, RESULT
  
  const [datasetName, setDatasetName] = useState('');
  const [csvData, setCsvData] = useState([]); // フルデータ
  const [gamePool, setGamePool] = useState([]); // 出題候補
  const [selectedWords, setSelectedWords] = useState([]); // ピックアップされたデータ
  const [generatedData, setGeneratedData] = useState([]);
  const [resultData, setResultData] = useState(null);
  const [selectedMode, setSelectedMode] = useState('');

  // 1. ホーム画面でデータセットを選択した時 → フォルダ詳細へ
  const handleDatasetSelected = (data, name) => {
    setCsvData(data);
    setDatasetName(name);
    setAppState('FOLDER_DETAIL');
  };

  // 2. フォルダ詳細から「遊ぶ」を押した時 → 問題数選択へ
  const handleStartGameFromFolder = () => {
    setGamePool(csvData);
    setAppState('SETTINGS');
  };

  const handleStartWrongWords = (wrongWords) => {
    setGamePool(wrongWords);
    setAppState('SETTINGS');
  };

  const handleStartCachedWords = (cachedWords) => {
    setGamePool(cachedWords);
    setAppState('SETTINGS');
  };

  // 3. 問題数を選択して開始した時
  const handleSettingsComplete = (count) => {
    const shuffled = [...gamePool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    setSelectedWords(selected);
    setAppState('GENERATE');
  };

  const handleBackToHome = () => {
    setAppState('HOME');
  };

  const handleBackToFolderDetail = () => {
    setAppState('FOLDER_DETAIL');
  };

  // 4. AIによる生成が完了した時
  const handleGenerationComplete = (finalData) => {
    setGeneratedData(finalData);
    setAppState('MODE_SELECT');
  };

  const handleGenerationError = () => {
    setAppState('SETTINGS');
  };

  // 5. ゲームモードを選択した時
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    if (mode === 'fill-blank') setAppState('GAME_FILL_BLANK');
    if (mode === 'full-typing') setAppState('GAME_FULL_TYPING');
  };

  // 6. ゲーム完了時
  const handleGameComplete = (result) => {
    const typedChars =
      selectedMode === 'full-typing'
        ? generatedData.reduce((sum, item) => sum + (item.english?.length || 0), 0)
        : generatedData.reduce((sum, item) => sum + (item.targetWord?.length || 0), 0);
    const session = saveSession({
      datasetName,
      mode: selectedMode,
      totalQuestions: result.total,
      correctCount: result.correctCount ?? result.total - (result.wrongCount || 0),
      wrongCount: result.wrongCount || 0,
      timeTaken: result.timeTaken,
      wrongWords: result.wrongWords || [],
      typedChars,
    });
    setResultData({ ...result, typedChars, sessionId: session.id });
    setAppState('RESULT');
  };

  // 7. 結果画面からの遷移
  const handleRestart = () => {
    setAppState('MODE_SELECT');
  };

  const handleGoHome = () => {
    setCsvData([]);
    setGamePool([]);
    setSelectedWords([]);
    setGeneratedData([]);
    setSelectedMode('');
    setAppState('HOME');
  };

  return (
    <div className="min-h-screen bg-[#16171d] text-white flex flex-col items-center justify-center p-4 selection:bg-[#aa3bff] selection:text-white relative overflow-hidden">
      {/* 背景の装飾 */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#aa3bff]/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#c084fc]/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 text-center md:text-left z-10 pointer-events-none">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#aa3bff] to-[#c084fc] inline-block tracking-tight">
          EnglishType Pro
        </h1>
      </div>

      <main className="w-full flex-1 flex flex-col items-center justify-center py-20 relative z-20">
        
        {appState === 'HOME' && (
          <HomeScreen onSelectDataset={handleDatasetSelected} />
        )}

        {appState === 'FOLDER_DETAIL' && (
          <FolderDetailScreen
            datasetName={datasetName}
            csvData={csvData}
            onBack={handleBackToHome}
            onStartGame={handleStartGameFromFolder}
            onStartWrongWords={handleStartWrongWords}
            onStartCachedWords={handleStartCachedWords}
          />
        )}

        {appState === 'SETTINGS' && (
          <GameSettingsScreen 
            datasetName={datasetName}
            totalWords={gamePool.length}
            onStart={handleSettingsComplete}
            onBack={handleBackToFolderDetail}
          />
        )}

        {appState === 'GENERATE' && (
          <SentenceGenerator 
            csvData={selectedWords} 
            onComplete={handleGenerationComplete} 
            onError={handleGenerationError}
          />
        )}
        
        {appState === 'MODE_SELECT' && (
          <ModeSelector onSelectMode={handleModeSelect} />
        )}
        
        {appState === 'GAME_FILL_BLANK' && (
          <FillBlankMode data={generatedData} onComplete={handleGameComplete} onAbort={handleGoHome} />
        )}
        
        {appState === 'GAME_FULL_TYPING' && (
          <FullTypingMode data={generatedData} onComplete={handleGameComplete} onAbort={handleGoHome} />
        )}
        
        {appState === 'RESULT' && (
          <ResultScreen 
            result={resultData} 
            onRestart={handleRestart} 
            onUploadNew={handleGoHome} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
