import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { generateSentences, getCache, getCacheKey } from '../utils/ai';

export default function SentenceGenerator({ csvData, onComplete, onError }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('キャッシュを確認中...');
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        setProgress(10);

        // キャッシュチェック（全部あるかどうかの事前表示）
        const cache = getCache();
        const uncachedCount = csvData.filter(
          (item) => !cache[getCacheKey(item.word, item.meaning)]
        ).length;

        if (uncachedCount === 0) {
          setStatus('キャッシュから瞬時に読み込みました！');
          setProgress(100);
        } else {
          setStatus(`AIが例文を生成中... (${uncachedCount}語)`);
          setProgress(30);
        }

        await generateSentences(csvData, {
          onProgress: (completed, total) => {
            if (isCancelled) return;
            const pct = Math.round(30 + (completed / total) * 60);
            setProgress(pct);
            setStatus(`生成中... (${completed}/${total})`);
          },
          onRetry: (retryNum, maxRetries) => {
            if (isCancelled) return;
            setStatus(`AIサーバーが混雑しています。再接続中... (${retryNum}/${maxRetries}回目)`);
          },
        });

        if (isCancelled) return;

        // 元の csvData の順番を維持して結果を組み立てる
        const updatedCache = getCache();
        const finalData = csvData.map((item) => {
          const key = getCacheKey(item.word, item.meaning);
          return {
            japanese: updatedCache[key].japanese,
            english: updatedCache[key].english,
            targetWord: item.word,
          };
        });

        setProgress(100);
        setStatus('完了！');

        setTimeout(() => {
          if (!isCancelled) onComplete(finalData);
        }, 500);
      } catch (err) {
        if (!isCancelled) {
          console.error(err);
          setLocalError(err.message || '例文の生成中にエラーが発生しました');
        }
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, [csvData, onComplete]);

  return (
    <div className="w-full max-w-xl mx-auto p-8 bg-[#1f2028] rounded-3xl shadow-2xl border border-[#2e303a] text-center">
      <div className="flex justify-center mb-6">
        <Loader2 className="animate-spin text-[#c084fc]" size={48} />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">準備中...</h2>
      <p className="text-gray-400 mb-8">{status}</p>

      <div className="w-full bg-[#16171d] rounded-full h-2 mb-4 overflow-hidden border border-[#2e303a]">
        <div
          className="bg-gradient-to-r from-[#aa3bff] to-[#c084fc] h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {localError && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start space-x-3 text-red-400 text-left">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-bold">エラー</p>
            <p className="text-sm">{localError}</p>
            <button
              onClick={() => onError()}
              className="mt-3 text-sm underline hover:text-red-300"
            >
              戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
