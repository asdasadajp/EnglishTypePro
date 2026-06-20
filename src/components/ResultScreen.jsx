import { Trophy, Clock, RotateCcw, UploadCloud } from 'lucide-react';

export default function ResultScreen({ result, onRestart, onUploadNew }) {
  const { timeTaken, total, correctCount, wrongCount, wrongWords = [] } = result;
  
  // WPMの簡易計算: 1単語5文字と仮定し、入力文字数を推定（簡略化）
  // 正確な文字数がない場合は、total * 15文字程度を想定
  const estimatedChars = total * 15; 
  const wpm = Math.round((estimatedChars / 5) / (timeTaken / 60));

  return (
    <div className="w-full max-w-2xl mx-auto p-6 flex flex-col items-center">
      <div className="mb-10 text-center">
        <div className="inline-flex justify-center items-center w-24 h-24 rounded-full bg-yellow-500/20 text-yellow-500 mb-6 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
          <Trophy size={48} />
        </div>
        <h2 className="text-4xl font-bold text-white mb-2">学習完了！</h2>
        <p className="text-gray-400">すべての問題を見事クリアしました</p>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 mb-10">
        <div className="bg-[#1f2028] border border-[#2e303a] p-6 rounded-2xl flex flex-col items-center text-center">
          <Clock className="text-[#c084fc] mb-3" size={28} />
          <span className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">クリアタイム</span>
          <span className="text-3xl font-bold text-white">{timeTaken}<span className="text-lg text-gray-500 ml-1">秒</span></span>
        </div>
        
        <div className="bg-[#1f2028] border border-[#2e303a] p-6 rounded-2xl flex flex-col items-center text-center">
          <div className="text-[#c084fc] mb-3 font-mono text-2xl font-bold">WPM</div>
          <span className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">推定入力速度</span>
          <span className="text-3xl font-bold text-white">{wpm > 0 && wpm < 1000 ? wpm : '-'}</span>
        </div>
      </div>

      <div className="w-full bg-[#1f2028] border border-[#2e303a] rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">今回の結果</h3>
          <span className="text-sm text-gray-400">
            正解 <span className="text-green-400 font-bold">{correctCount ?? total - wrongCount}</span>
            <span className="text-gray-600 mx-2">/</span>
            不正解 <span className="text-red-400 font-bold">{wrongCount || 0}</span>
          </span>
        </div>
        {wrongWords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {[...new Set(wrongWords)].map((word) => (
              <span key={word} className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-sm font-mono">
                {word}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">間違えた単語はありません。</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <button
          onClick={onRestart}
          className="flex-1 py-4 px-6 bg-[#2e303a] hover:bg-[#383a46] text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw size={20} />
          <span>モード選択に戻る</span>
        </button>
        <button
          onClick={onUploadNew}
          className="flex-1 py-4 px-6 bg-gradient-to-r from-[#aa3bff] to-[#c084fc] hover:opacity-90 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-opacity shadow-[0_10px_20px_-10px_rgba(170,59,255,0.5)]"
        >
          <UploadCloud size={20} />
          <span>ホーム画面に戻る</span>
        </button>
      </div>
    </div>
  );
}
