import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function FillBlankMode({ data, onComplete, onAbort }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [startTime] = useState(() => Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongWords, setWrongWords] = useState([]);
  const [markedWrongThisQuestion, setMarkedWrongThisQuestion] = useState(false);
  const inputRef = useRef(null);

  const currentItem = data[currentIndex];

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  if (!currentItem) return null;

  const targetWord = currentItem.targetWord;
  const parts = currentItem.english.split(new RegExp(`(${targetWord})`, 'i'));
  const displayParts = parts.length > 1 ? parts : [currentItem.english, '', ''];
  const prefix = displayParts[0];
  const suffix = displayParts.slice(2).join('');

  const goToNext = (wasCorrect) => {
    if (wasCorrect && !markedWrongThisQuestion) {
      setCorrectCount((prev) => prev + 1);
    }
    // wrongCount は既にマーク時に加算済み

    setIsRecovering(false);
    setMarkedWrongThisQuestion(false);
    if (currentIndex + 1 < data.length) {
      setCurrentIndex(currentIndex + 1);
      setInputValue('');
      setHasError(false);
    } else {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const finalCorrect = wasCorrect && !markedWrongThisQuestion ? correctCount + 1 : correctCount;
      onComplete({
        timeTaken,
        total: data.length,
        correctCount: finalCorrect,
        wrongCount: data.length - finalCorrect,
        wrongWords,
      });
    }
  };

  const handleChange = (e) => {
    let val = e.target.value;

    // 頭文字の自動大文字化: ターゲットが大文字で始まるなら最初の文字を大文字にする
    if (val.length === 1 && targetWord[0] === targetWord[0].toUpperCase() && targetWord[0] !== targetWord[0].toLowerCase()) {
      val = val.toUpperCase();
    }

    setInputValue(val);

    if (val === targetWord) {
      setHasError(false);
      const delay = isRecovering ? 0 : 150;
      setTimeout(() => goToNext(!markedWrongThisQuestion), delay);
    } else {
      if (val.length > 0 && !targetWord.startsWith(val)) {
        setHasError(true);
      } else {
        setHasError(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue !== targetWord && !isRecovering) {
      e.preventDefault();
      setIsRecovering(true);
      setInputValue('');
      setHasError(true);

      if (!markedWrongThisQuestion) {
        setMarkedWrongThisQuestion(true);
        setWrongCount((prev) => prev + 1);
        setWrongWords((prev) => [...prev, targetWord]);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center">
      {/* ヘッダー: 進捗 + スコア + 中断ボタン */}
      <div className="w-full flex justify-between items-center mb-12 text-gray-400">
        <span className="text-sm font-mono tracking-widest uppercase">Fill-in-the-blank</span>
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

      <div className="text-center w-full bg-[#1f2028] p-12 rounded-3xl border border-[#2e303a] shadow-2xl relative">
        <h2 className="text-2xl md:text-3xl font-medium text-gray-300 mb-8">
          {currentItem.japanese}
        </h2>

        <div className="text-3xl md:text-5xl font-mono text-white leading-relaxed flex flex-wrap justify-center items-center gap-y-4">
          <span>{prefix}</span>
          <div className="relative inline-block mx-2">
            <span className="absolute bottom-0 left-0 w-full h-1 bg-[#c084fc]/30 rounded"></span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className={`bg-transparent outline-none border-b-4 pb-1 text-center font-mono w-[auto] min-w-[3ch] transition-colors ${
                hasError || isRecovering
                  ? 'border-red-500 text-red-500 animate-shake'
                  : inputValue.length > 0
                  ? 'border-[#c084fc] text-[#c084fc]'
                  : 'border-gray-600 text-transparent'
              }`}
              style={{ width: `${Math.max(targetWord.length, inputValue.length || 1)}ch` }}
              onBlur={() => inputRef.current?.focus()}
              autoComplete="off"
              spellCheck="false"
            />
            {inputValue.length === 0 && !isRecovering && (
              <span className="absolute inset-0 flex justify-center text-gray-600 pointer-events-none select-none">
                {'_'.repeat(targetWord.length)}
              </span>
            )}
          </div>
          <span>{suffix}</span>
        </div>

        {isRecovering && (
          <div className="absolute top-4 right-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <span>正解:</span>
              <span className="font-mono text-lg text-white tracking-widest">{targetWord}</span>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-gray-500 text-sm flex items-center gap-2">
        <span className="font-medium bg-[#2e303a] px-3 py-1 rounded text-gray-300">ヒント</span>
        {isRecovering ? (
          <span className="text-red-400">表示された正解をタイピングしてください</span>
        ) : (
          <span>単語の文字数は {targetWord.length} 文字です</span>
        )}
      </p>
    </div>
  );
}
