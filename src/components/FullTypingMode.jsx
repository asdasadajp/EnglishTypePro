import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function getLeadingSpaces(sentence = '') {
  return sentence.match(/^ */)?.[0] ?? '';
}

export default function FullTypingMode({ data, onComplete, onAbort }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(() => getLeadingSpaces(data[0]?.english));
  const [hasError, setHasError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [errorCount, setErrorCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongWords, setWrongWords] = useState([]);
  const [markedWrongThisQuestion, setMarkedWrongThisQuestion] = useState(false);

  const currentItem = data[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
      if (!currentItem) return;
      if (e.key === 'Backspace') return;

      const targetSentence = currentItem.english;

      // エンターを押したらリカバリーモード
      if (e.key === 'Enter' && !isRecovering) {
        setIsRecovering(true);
        if (!markedWrongThisQuestion) {
          setMarkedWrongThisQuestion(true);
          setWrongCount((prev) => prev + 1);
          setErrorCount((prev) => prev + 1);
          setWrongWords((prev) => [...prev, currentItem.targetWord]);
        }
        return;
      }

      let expectedChar = targetSentence[typedChars.length];
      if (!expectedChar) return; // 末尾に達している場合

      // 頭文字の自動大文字化
      let inputChar = e.key;
      if (typedChars.length === 0 && expectedChar === expectedChar.toUpperCase() && expectedChar !== expectedChar.toLowerCase()) {
        inputChar = inputChar.toUpperCase();
      }

      if (inputChar === expectedChar) {
        setHasError(false);
        let newTyped = typedChars + inputChar;

        // スペースの自動スキップ: 次の文字がスペースなら自動で進める
        while (newTyped.length < targetSentence.length && targetSentence[newTyped.length] === ' ') {
          newTyped += ' ';
        }

        setTypedChars(newTyped);

        if (newTyped.length === targetSentence.length) {
          // 文を打ち終えた
          const wasCorrect = !markedWrongThisQuestion;
          setTimeout(() => {
            const newCorrectCount = wasCorrect ? correctCount + 1 : correctCount;
            setIsRecovering(false);
            setMarkedWrongThisQuestion(false);
            if (wasCorrect) setCorrectCount((prev) => prev + 1);

            if (currentIndex + 1 < data.length) {
              const nextIndex = currentIndex + 1;
              setCurrentIndex(nextIndex);
              setTypedChars(getLeadingSpaces(data[nextIndex]?.english));
            } else {
              const timeTaken = Math.round((Date.now() - startTime) / 1000);
              onComplete({
                timeTaken,
                total: data.length,
                errors: errorCount,
                correctCount: newCorrectCount,
                wrongCount: data.length - newCorrectCount,
                wrongWords,
              });
            }
          }, 200);
        }
      } else {
        setHasError(true);
        setErrorCount((prev) => prev + 1);
        setTimeout(() => setHasError(false), 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, typedChars, currentItem, data, startTime, errorCount, onComplete, isRecovering, correctCount, wrongCount, wrongWords, markedWrongThisQuestion]);

  if (!currentItem) return null;

  const targetSentence = currentItem.english;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center">
      {/* ヘッダー: 進捗 + スコア + 中断ボタン */}
      <div className="w-full flex justify-between items-center mb-12 text-gray-400">
        <span className="text-sm font-mono tracking-widest uppercase">Full Typing Mode</span>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            <span className="text-green-400 font-bold">{correctCount}</span>
            <span className="text-gray-600 mx-1">/</span>
            <span className="text-red-400 font-bold">{wrongCount}</span>
          </span>
          <span className="bg-[#2e303a] px-4 py-1 rounded-full text-sm">
            {currentIndex + 1} / {data.length}
          </span>
          <button
            onClick={onAbort}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="中断してホームに戻る"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className={`text-center w-full bg-[#1f2028] p-12 rounded-3xl border transition-colors duration-200 shadow-2xl relative ${
          hasError ? 'border-red-500 bg-red-500/5 animate-shake' : 'border-[#2e303a]'
        }`}
      >
        <h2 className="text-2xl md:text-3xl font-medium text-gray-300 mb-10">
          {currentItem.japanese}
        </h2>

        <div className="text-3xl md:text-5xl font-mono leading-relaxed tracking-wide relative inline-block">
          <span className="text-white">{targetSentence.substring(0, typedChars.length)}</span>
          <span className="typing-cursor text-[#c084fc]"></span>
          <span className={isRecovering ? 'text-red-500/80' : 'text-gray-600'}>
            {targetSentence.substring(typedChars.length)}
          </span>
        </div>

        {isRecovering && (
          <div className="absolute top-4 right-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-sm font-bold">
              赤文字を最後までタイピングしてください
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-gray-500 text-sm flex items-center gap-4">
        <span>
          ミスタイプ: <strong className="text-red-400">{errorCount}</strong>
        </span>
        <span>•</span>
        <span>スペースは自動で入力されます</span>
      </p>
    </div>
  );
}
