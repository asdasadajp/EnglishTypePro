import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const CACHE_KEY = 'english_type_cache';

// キャッシュの読み書き
export function getCache() {
  const saved = localStorage.getItem(CACHE_KEY);
  return saved ? JSON.parse(saved) : {};
}

export function saveCache(cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function getCacheKey(word, meaning) {
  return `${word}|${meaning}`;
}

// 単一のAPI呼び出し（リトライ付き）
async function callGemini(prompt, onRetry) {
  let response;
  let retries = 0;
  const maxRetries = 3;

  while (retries <= maxRetries) {
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response;
    } catch (err) {
      const errStr = err.toString().toLowerCase();
      const isRetryable =
        err.status === 503 ||
        err.status === 429 ||
        errStr.includes('503') ||
        errStr.includes('unavailable') ||
        errStr.includes('high demand');

      if (isRetryable && retries < maxRetries) {
        retries++;
        if (onRetry) onRetry(retries, maxRetries);
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw err;
      }
    }
  }
}

function buildPrompt(items) {
  const inputList = items.map((item) => ({ word: item.word, meaning: item.meaning }));
  return `あなたは優秀な英語教師です。以下の英単語と意味のリストから、タイピングゲーム用の例文を生成してください。
条件:
- 各単語を使った自然で一般的な「英文」と、その「日本語訳」を作成してください。
- 英文は長すぎないようにしてください（5〜10語程度が理想）。
- 結果は必ず以下のJSON配列形式のみで出力し、マークダウン記法や他のテキストは一切含めないでください。
[
  { "word": "apple", "meaning": "りんご", "english": "I eat an apple every day.", "japanese": "私は毎日りんごを食べます。" }
]

入力リスト:
${JSON.stringify(inputList, null, 2)}`;
}

function parseResponse(responseText) {
  let text = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(text);
}

/**
 * 単語リストの例文を生成し、キャッシュに保存して返す。
 * @param {Array} items - [{ word, meaning }]
 * @param {Object} options
 *   - onProgress(completed, total): 進捗コールバック
 *   - onRetry(retryNum, maxRetries): リトライ通知
 *   - forceRegenerate: true なら既存キャッシュを無視して再生成
 *   - batchSize: 一度にAPIに送る単語数 (default: 30)
 *   - signal: AbortSignal (キャンセル用)
 * @returns {Array} - [{ word, meaning, english, japanese }]
 */
export async function generateSentences(items, options = {}) {
  const {
    onProgress,
    onRetry,
    forceRegenerate = false,
    batchSize = 30,
    signal,
  } = options;

  const cache = getCache();
  const results = [];
  const toGenerate = [];

  // キャッシュチェック
  for (const item of items) {
    const key = getCacheKey(item.word, item.meaning);
    if (!forceRegenerate && cache[key]) {
      results.push({
        word: item.word,
        meaning: item.meaning,
        english: cache[key].english,
        japanese: cache[key].japanese,
      });
    } else {
      toGenerate.push(item);
    }
  }

  if (toGenerate.length === 0) {
    if (onProgress) onProgress(items.length, items.length);
    return results;
  }

  // バッチに分割して処理
  let completed = results.length;
  for (let i = 0; i < toGenerate.length; i += batchSize) {
    if (signal?.aborted) throw new Error('Cancelled');

    const batch = toGenerate.slice(i, i + batchSize);
    const prompt = buildPrompt(batch);
    const response = await callGemini(prompt, onRetry);
    const generated = parseResponse(response.text);

    for (const item of generated) {
      const key = getCacheKey(item.word, item.meaning);
      cache[key] = { english: item.english, japanese: item.japanese };
      results.push(item);
    }

    saveCache(cache);
    completed += batch.length;
    if (onProgress) onProgress(completed, items.length);

    // バッチ間のスロットリング（最後のバッチ以外）
    if (i + batchSize < toGenerate.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return results;
}

/**
 * 1単語だけ再生成する
 */
export async function regenerateOne(word, meaning, onRetry) {
  const prompt = buildPrompt([{ word, meaning }]);
  const response = await callGemini(prompt, onRetry);
  const generated = parseResponse(response.text);

  if (generated.length > 0) {
    const cache = getCache();
    const key = getCacheKey(word, meaning);
    cache[key] = { english: generated[0].english, japanese: generated[0].japanese };
    saveCache(cache);
    return generated[0];
  }
  throw new Error('AIからの応答が空でした');
}
