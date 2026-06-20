import { useState, useMemo } from 'react';
import { ArrowLeft, Play, RefreshCw, Sparkles, Loader2, Repeat2, CheckCircle2 } from 'lucide-react';
import { getCache, getCacheKey, regenerateOne, generateSentences } from '../utils/ai';
import { getWrongWordsForDataset } from '../utils/history';

export default function FolderDetailScreen({
  datasetName,
  csvData,
  onBack,
  onStartGame,
  onStartWrongWords,
  onStartCachedWords,
}) {
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  const [batchError, setBatchError] = useState(null);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [showGenerateOptions, setShowGenerateOptions] = useState(false);

  // 単語一覧にキャッシュ情報をマージ
  const wordList = useMemo(() => {
    void cacheVersion;
    const cache = getCache();
    return csvData.map((item, index) => {
      const key = getCacheKey(item.word, item.meaning);
      const cached = cache[key];
      return {
        id: index,
        word: item.word,
        meaning: item.meaning,
        english: cached?.english || null,
        japanese: cached?.japanese || null,
      };
    });
  }, [csvData, cacheVersion]);

  const cachedCount = wordList.filter((w) => w.english).length;
  const uncachedCount = wordList.length - cachedCount;
  const wrongWordSet = getWrongWordsForDataset(datasetName);
  const wrongWordRows = csvData.filter((item) => wrongWordSet.has(item.word));
  const cachedRows = csvData.filter((item) => {
    const cache = getCache();
    const key = getCacheKey(item.word, item.meaning);
    return Boolean(cache[key]?.english && cache[key]?.japanese);
  });

  // 個別の再生成
  const handleRegenerate = async (item) => {
    setRegeneratingId(item.id);
    try {
      await regenerateOne(item.word, item.meaning);
      setCacheVersion((prev) => prev + 1);
    } catch (err) {
      console.error('Regenerate failed:', err);
      alert(`再生成に失敗しました: ${err.message}`);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleBatchGenerate = async (mode) => {
    const cache = getCache();
    const uncached = csvData.filter((item) => {
      const key = getCacheKey(item.word, item.meaning);
      return !cache[key];
    });
    const targetItems = mode === 'all' ? csvData : uncached;
    const forceRegenerate = mode === 'all';

    if (targetItems.length === 0) {
      alert('すべての単語はすでに生成済みです！');
      setShowGenerateOptions(false);
      return;
    }

    setIsBatchGenerating(true);
    setShowGenerateOptions(false);
    setBatchProgress({ completed: 0, total: targetItems.length });
    setBatchError(null);

    try {
      await generateSentences(targetItems, {
        forceRegenerate,
        batchSize: 30,
        onProgress: (completed, total) => {
          setBatchProgress({ completed, total });
          setCacheVersion((prev) => prev + 1);
        },
      });
      setCacheVersion((prev) => prev + 1);
    } catch (err) {
      console.error('Batch generate failed:', err);
      setBatchError(err.message);
      setCacheVersion((prev) => prev + 1);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 z-20 relative">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2e303a] rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">{datasetName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              全 {wordList.length} 語 ・ 生成済み{' '}
              <span className="text-green-400">{cachedCount}</span> ・ 未生成{' '}
              <span className="text-yellow-400">{uncachedCount}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onStartWrongWords(wrongWordRows)}
            disabled={wrongWordRows.length === 0}
            className="px-4 py-2 bg-[#2e303a] hover:bg-[#3a3c48] text-white rounded-xl flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Repeat2 size={16} />
            間違えた単語だけ ({wrongWordRows.length})
          </button>
          <button
            onClick={() => onStartCachedWords(cachedRows)}
            disabled={cachedRows.length === 0}
            className="px-4 py-2 bg-[#2e303a] hover:bg-[#3a3c48] text-white rounded-xl flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
          >
            <CheckCircle2 size={16} />
            生成済みだけ ({cachedRows.length})
          </button>
          <div className="relative">
            <button
              onClick={() => setShowGenerateOptions((prev) => !prev)}
              disabled={isBatchGenerating || wordList.length === 0}
              className="px-4 py-2 bg-[#2e303a] hover:bg-[#3a3c48] text-white rounded-xl flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Sparkles size={16} />
              {isBatchGenerating
                ? `生成中... (${batchProgress.completed}/${batchProgress.total})`
                : 'すべて生成'}
            </button>

            {showGenerateOptions && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1f2028] border border-[#2e303a] rounded-2xl shadow-2xl p-3 z-30">
                <button
                  onClick={() => handleBatchGenerate('missing')}
                  disabled={uncachedCount === 0}
                  className="w-full text-left p-3 rounded-xl hover:bg-[#2e303a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <p className="font-bold text-white text-sm">未生成のみ生成</p>
                  <p className="text-xs text-gray-400 mt-1">{uncachedCount}語を追加生成します</p>
                </button>
                <button
                  onClick={() => handleBatchGenerate('all')}
                  className="w-full text-left p-3 rounded-xl hover:bg-[#2e303a] transition-colors"
                >
                  <p className="font-bold text-white text-sm">すべて再生成</p>
                  <p className="text-xs text-gray-400 mt-1">生成済みも含めて全 {wordList.length} 語を作り直します</p>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onStartGame}
            className="px-5 py-2 bg-gradient-to-r from-[#aa3bff] to-[#c084fc] hover:opacity-90 text-white font-bold rounded-xl flex items-center gap-2 transition-opacity shadow-lg"
          >
            <Play size={16} fill="currentColor" />
            この単語帳で遊ぶ
          </button>
        </div>
      </div>

      {/* バッチ進捗バー */}
      {isBatchGenerating && (
        <div className="mb-6 bg-[#1f2028] border border-[#2e303a] rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="animate-spin text-[#c084fc]" size={18} />
            <span className="text-sm text-gray-300">
              AIが例文を一括生成中... {batchProgress.completed} / {batchProgress.total} 完了
            </span>
          </div>
          <div className="w-full bg-[#16171d] rounded-full h-2 overflow-hidden border border-[#2e303a]">
            <div
              className="bg-gradient-to-r from-[#aa3bff] to-[#c084fc] h-2 rounded-full transition-all duration-500"
              style={{
                width: `${batchProgress.total > 0 ? (batchProgress.completed / batchProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {batchError && (
        <div className="mb-6 bg-red-500/10 border border-red-500/40 rounded-2xl p-4 text-red-400 text-sm">
          一括生成中にエラーが発生しました: {batchError}（途中まで生成されたデータは保存されています）
        </div>
      )}

      {/* テーブルヘッダー */}
      <div className="hidden md:grid grid-cols-[180px_1fr_1fr_60px] gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-[#2e303a]">
        <span>単語</span>
        <span>英文</span>
        <span>日本語訳</span>
        <span></span>
      </div>

      {/* 単語リスト */}
      <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
        {wordList.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 md:grid-cols-[180px_1fr_1fr_60px] gap-2 md:gap-4 px-6 py-4 border-b border-[#2e303a]/60 hover:bg-[#1f2028]/60 transition-colors items-center"
          >
            {/* 単語 & 意味 */}
            <div>
              <span className="text-white font-bold text-base">{item.word}</span>
              <p className="text-xs text-gray-500 mt-0.5">{item.meaning}</p>
            </div>

            {/* 英文 */}
            <div>
              {item.english ? (
                <p className="text-sm text-gray-300">{item.english}</p>
              ) : (
                <span className="text-xs text-yellow-500/60 bg-yellow-500/10 px-2 py-1 rounded-md inline-block">
                  未生成
                </span>
              )}
            </div>

            {/* 日本語訳 */}
            <div>
              {item.japanese ? (
                <p className="text-sm text-gray-400">{item.japanese}</p>
              ) : (
                <span className="text-xs text-gray-600">—</span>
              )}
            </div>

            {/* 再生成ボタン */}
            <div className="flex justify-end">
              <button
                onClick={() => handleRegenerate(item)}
                disabled={regeneratingId === item.id || isBatchGenerating}
                className="p-2 text-gray-500 hover:text-[#c084fc] hover:bg-[#c084fc]/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                title="この単語の文章を再生成"
              >
                {regeneratingId === item.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
