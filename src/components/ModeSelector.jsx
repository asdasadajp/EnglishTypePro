import { Edit3, Keyboard } from 'lucide-react';

export default function ModeSelector({ onSelectMode }) {
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-white mb-4">学習モードを選択</h2>
        <p className="text-gray-400 text-lg">アップロードされたデータを使って学習を始めます</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 空欄補充モード */}
        <button
          onClick={() => onSelectMode('fill-blank')}
          className="group relative flex flex-col items-center text-left p-8 bg-[#1f2028] border border-[#2e303a] rounded-2xl hover:border-[#c084fc] hover:bg-[#252630] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(192,132,252,0.3)]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Edit3 size={120} />
          </div>
          <div className="p-4 bg-[#c084fc]/10 rounded-full text-[#c084fc] mb-6">
            <Edit3 size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">空欄補充モード</h3>
          <p className="text-gray-400 leading-relaxed text-center">
            英文の一部が隠されています。<br />
            正解の単語をタイピングして文を完成させましょう。
          </p>
        </button>

        {/* 全文タイピングモード */}
        <button
          onClick={() => onSelectMode('full-typing')}
          className="group relative flex flex-col items-center text-left p-8 bg-[#1f2028] border border-[#2e303a] rounded-2xl hover:border-[#c084fc] hover:bg-[#252630] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(192,132,252,0.3)]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Keyboard size={120} />
          </div>
          <div className="p-4 bg-[#c084fc]/10 rounded-full text-[#c084fc] mb-6">
            <Keyboard size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">全文タイピングモード</h3>
          <p className="text-gray-400 leading-relaxed text-center">
            従来のタイピングゲーム形式です。<br />
            英文を最初から最後まで正確にタイピングしましょう。
          </p>
        </button>
      </div>
    </div>
  );
}
