const HISTORY_KEY = 'english_type_history';

export function getHistory() {
  const saved = localStorage.getItem(HISTORY_KEY);
  return saved ? JSON.parse(saved) : { sessions: [] };
}

export function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * セッション結果を保存する
 * @param {Object} session
 *   - datasetName: string
 *   - mode: 'fill-blank' | 'full-typing'
 *   - totalQuestions: number
 *   - correctCount: number
 *   - wrongCount: number
 *   - timeTaken: number (seconds)
 *   - wrongWords: string[]  (間違えた単語のリスト)
 */
export function saveSession(session) {
  const history = getHistory();
  const entry = {
    id: `session_${Date.now()}`,
    date: new Date().toISOString(),
    ...session,
  };
  history.sessions.unshift(entry); // 最新が先頭
  saveHistory(history);
  return entry;
}

/**
 * 特定のデータセットで過去に間違えたことがある単語のセットを取得する
 * @param {string} datasetName
 * @returns {Set<string>}
 */
export function getWrongWordsForDataset(datasetName) {
  const history = getHistory();
  const wrongSet = new Set();
  history.sessions
    .filter((s) => s.datasetName === datasetName)
    .forEach((s) => {
      if (s.wrongWords) {
        s.wrongWords.forEach((w) => wrongSet.add(w));
      }
    });
  return wrongSet;
}

/**
 * ダッシュボード用の統計情報を計算する
 */
export function computeStats() {
  const history = getHistory();
  const sessions = history.sessions;

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalWrong: 0,
      overallAccuracy: 0,
      totalTimeSec: 0,
      totalTypedChars: 0,
      recentSessions: [],
      worstWords: [],
      dailyData: {},
    };
  }

  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalTimeSec = 0;
  let totalTypedChars = 0;
  const wordMistakes = {}; // { word: count }
  const dailyData = {}; // { "2026-06-20": { sessions, correct, wrong } }

  for (const s of sessions) {
    totalQuestions += s.totalQuestions || 0;
    totalCorrect += s.correctCount || 0;
    totalWrong += s.wrongCount || 0;
    totalTimeSec += s.timeTaken || 0;
    totalTypedChars += s.typedChars || 0;

    if (s.wrongWords) {
      for (const w of s.wrongWords) {
        wordMistakes[w] = (wordMistakes[w] || 0) + 1;
      }
    }

    const day = s.date ? s.date.substring(0, 10) : 'unknown';
    if (!dailyData[day]) {
      dailyData[day] = { sessions: 0, correct: 0, wrong: 0, questions: 0 };
    }
    dailyData[day].sessions += 1;
    dailyData[day].correct += s.correctCount || 0;
    dailyData[day].wrong += s.wrongCount || 0;
    dailyData[day].questions += s.totalQuestions || 0;
  }

  // 苦手な単語Top10
  const worstWords = Object.entries(wordMistakes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    totalSessions: sessions.length,
    totalQuestions,
    totalCorrect,
    totalWrong,
    overallAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    totalTimeSec,
    totalTypedChars,
    recentSessions: sessions.slice(0, 20),
    worstWords,
    dailyData,
  };
}

/**
 * 履歴データをJSONとしてエクスポートする
 */
export function exportHistory() {
  const history = getHistory();
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `english_type_history_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * JSONファイルから履歴データをインポートする
 * @param {File} file
 * @returns {Promise<void>}
 */
export function importHistory(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.sessions || !Array.isArray(data.sessions)) {
          throw new Error('Invalid history format');
        }
        // 既存のデータとマージ（重複IDを排除）
        const current = getHistory();
        const existingIds = new Set(current.sessions.map((s) => s.id));
        const newSessions = data.sessions.filter((s) => !existingIds.has(s.id));
        current.sessions = [...newSessions, ...current.sessions].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        saveHistory(current);
        resolve(current.sessions.length);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}
