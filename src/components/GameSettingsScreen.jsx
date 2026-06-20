import { useState } from 'react';
import { Layers, ArrowRight, AlertTriangle } from 'lucide-react';

export default function GameSettingsScreen({ datasetName, totalWords, onStart, onBack }) {
  const [questionCount, setQuestionCount] = useState(Math.min(10, totalWords));
  
  // AI生成のタイムアウト等を防ぐため、一度に最大50問程度に制限
  const maxAllowed = Math.min(totalWords, 50); 

  const handleStart = () => {
    onStart(questionCount);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-[#1f2028] border border-[#2e303a] rounded-3xl shadow-2xl relative z-20">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 text-sm text-gray-500 hover:text-white transition-colors"
      >
        ← 戻る
      </button>

      <div className="text-center mt-6 mb-10">
        <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-[#c084fc]/10 text-[#c084fc] mb-4">
          <Layers size={32} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">出題設定</h2>
        <p className="text-gray-400">
          選択中: <span className="text-white font-medium">{datasetName}</span> (全 {totalWords} 語)
        </p>
      </div>

      <div className="bg-[#16171d] border border-[#2e303a] rounded-2xl p-6 mb-8">
        <label className="block text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider text-center">
          今回解く問題数を選択
        </label>
        
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {[5, 10, 20, 30, 50].map((num) => {
            if (num > totalWords) return null;
            return (
              <button
                key={num}
                onClick={() => setQuestionCount(num)}
                className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                  questionCount === num
                    ? 'bg-[#aa3bff] text-white shadow-[0_0_20px_rgba(170,59,255,0.4)] scale-105'
                    : 'bg-[#2e303a] text-gray-400 hover:bg-[#3a3c48] hover:text-white'
                }`}
              >
                {num}問
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4">
          <span className="text-gray-500">カスタム:</span>
          <input
            type="number"
            min="1"
            max={maxAllowed}
            value={questionCount}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setQuestionCount(Math.min(Math.max(val, 1), maxAllowed));
            }}
            className="w-24 bg-[#1f2028] border border-[#2e303a] text-center text-white text-xl font-bold py-2 rounded-lg focus:outline-none focus:border-[#c084fc]"
          />
          <span className="text-gray-500">問</span>
        </div>

        {maxAllowed < totalWords && (
          <div className="mt-6 flex items-start gap-2 text-yellow-500/80 text-sm bg-yellow-500/10 p-3 rounded-lg">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p>
              AIによる例文生成の負荷と時間を考慮し、1回につき最大 {maxAllowed} 問までに制限しています。選ばれた単語はランダムに抽出されます。
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleStart}
        className="w-full py-4 bg-gradient-to-r from-[#aa3bff] to-[#c084fc] hover:opacity-90 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_-10px_rgba(170,59,255,0.5)]"
      >
        <span>AIに例文を生成させる</span>
        <ArrowRight size={20} />
      </button>
    </div>
  );
}
