import { useMemo, useRef, useState } from 'react';
import { Download, Upload, BarChart3, Target, Clock, Keyboard, AlertTriangle } from 'lucide-react';
import { computeStats, exportHistory, importHistory } from '../utils/history';

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}分${rest}秒` : `${rest}秒`;
}

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  const stats = useMemo(() => {
    void refreshKey;
    return computeStats();
  }, [refreshKey]);

  const dailyEntries = Object.entries(stats.dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14);
  const maxDailyQuestions = Math.max(1, ...dailyEntries.map(([, day]) => day.questions));

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const total = await importHistory(file);
      setRefreshKey((prev) => prev + 1);
      setMessage(`履歴を読み込みました。現在 ${total} 件のセッションがあります。`);
    } catch (err) {
      setMessage(`読み込みに失敗しました: ${err.message}`);
    } finally {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">ダッシュボード</h2>
          <p className="text-gray-400">これまでの学習履歴と苦手な単語を確認できます</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportHistory}
            className="px-4 py-2 bg-[#2e303a] hover:bg-[#3a3c48] text-white rounded-xl flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <Download size={16} />
            エクスポート
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#aa3bff] hover:bg-[#c084fc] text-white rounded-xl flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <Upload size={16} />
            インポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => handleImport(e.target.files[0])}
            className="hidden"
          />
        </div>
      </div>

      {message && (
        <div className="bg-[#1f2028] border border-[#2e303a] rounded-2xl p-4 text-sm text-gray-300">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1f2028] border border-[#2e303a] rounded-2xl p-5">
          <BarChart3 className="text-[#c084fc] mb-3" size={24} />
          <p className="text-sm text-gray-400 mb-1">総プレイ回数</p>
          <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
        </div>
        <div className="bg-[#1f2028] border border-[#2e303a] rounded-2xl p-5">
          <Target className="text-green-400 mb-3" size={24} />
          <p className="text-sm text-gray-400 mb-1">総正答率</p>
          <p className="text-3xl font-bold text-white">{stats.overallAccuracy}%</p>
        </div>
        <div className="bg-[#1f2028] border border-[#2e303a] rounded-2xl p-5">
          <Keyboard className="text-blue-400 mb-3" size={24} />
          <p className="text-sm text-gray-400 mb-1">総タイプ文字数</p>
          <p className="text-3xl font-bold text-white">{stats.totalTypedChars}</p>
        </div>
        <div className="bg-[#1f2028] border border-[#2e303a] rounded-2xl p-5">
          <Clock className="text-yellow-400 mb-3" size={24} />
          <p className="text-sm text-gray-400 mb-1">総学習時間</p>
          <p className="text-3xl font-bold text-white">{formatTime(stats.totalTimeSec)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="bg-[#1f2028] border border-[#2e303a] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-5">最近のセッション</h3>
          {stats.recentSessions.length === 0 ? (
            <p className="text-sm text-gray-400">まだ履歴がありません。</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSessions.slice(0, 8).map((session) => {
                const accuracy =
                  session.totalQuestions > 0
                    ? Math.round((session.correctCount / session.totalQuestions) * 100)
                    : 0;
                return (
                  <div key={session.id} className="grid md:grid-cols-[100px_1fr_80px] gap-3 border-b border-[#2e303a]/70 pb-3 last:border-0 last:pb-0">
                    <span className="text-sm text-gray-500">{formatDate(session.date)}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{session.datasetName}</p>
                      <p className="text-xs text-gray-500">
                        {session.mode === 'fill-blank' ? '穴埋め' : '全文タイピング'} ・ {session.totalQuestions}問 ・ {formatTime(session.timeTaken)}
                      </p>
                      {session.wrongWords?.length > 0 && (
                        <p className="text-xs text-red-300 mt-1">
                          {session.wrongWords.slice(0, 5).join(', ')}
                          {session.wrongWords.length > 5 ? ' ...' : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-right text-sm font-bold text-[#c084fc]">{accuracy}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-[#1f2028] border border-[#2e303a] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-5">苦手な単語Top10</h3>
          {stats.worstWords.length === 0 ? (
            <div className="flex items-start gap-3 text-gray-400 text-sm">
              <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
              <p>間違えた単語が記録されると、ここに表示されます。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.worstWords.map((item, index) => (
                <div key={item.word} className="flex items-center gap-3">
                  <span className="w-6 text-sm text-gray-500">{index + 1}</span>
                  <span className="flex-1 text-white font-mono">{item.word}</span>
                  <span className="text-sm text-red-300">{item.count}回</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1f2028] border border-[#2e303a] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-5">日ごとの学習量</h3>
        {dailyEntries.length === 0 ? (
          <p className="text-sm text-gray-400">プレイすると日別の学習量が表示されます。</p>
        ) : (
          <div className="flex items-end gap-3 h-44">
            {dailyEntries.map(([date, day]) => (
              <div key={date} className="flex-1 h-full flex flex-col justify-end items-center gap-2">
                <div className="w-full flex items-end justify-center h-32">
                  <div
                    className="w-full max-w-10 bg-gradient-to-t from-[#aa3bff] to-[#c084fc] rounded-t-lg"
                    style={{ height: `${Math.max(8, (day.questions / maxDailyQuestions) * 100)}%` }}
                    title={`${date}: ${day.questions}問`}
                  />
                </div>
                <span className="text-[11px] text-gray-500">{date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
