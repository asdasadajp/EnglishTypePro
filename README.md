# EnglishType Pro

CSVの単語帳から英語タイピング練習を作るReact/Viteアプリです。単語と意味を読み込み、Geminiで短い例文を生成して、穴埋めまたは全文タイピングで練習できます。

## 主な機能

- 標準データセット `public/Book1.csv` の読み込み
- CSVアップロードによる単語帳追加
- Gemini APIによる英文・日本語訳の生成
- 生成済み例文のブラウザ内キャッシュ
- 穴埋めモードと全文タイピングモード
- 学習結果のクリア時間・推定WPM表示
- セッション履歴の自動保存
- ダッシュボードで正答率、学習量、苦手な単語を表示
- 間違えた単語だけの復習モード
- 履歴データのJSONエクスポート/インポート

## CSV形式

ヘッダーなしで、1列目に英単語、2列目に日本語の意味を入れます。

```csv
apple,りんご
study,勉強する
important,重要な
```

## セットアップ

```bash
npm install
```

`.env` にGemini APIキーを設定します。

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

## 起動

```bash
npm run dev
```

## 確認

```bash
npm run lint
npm run build
```
