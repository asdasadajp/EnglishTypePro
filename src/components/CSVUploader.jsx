import { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, AlertCircle } from 'lucide-react';

export default function CSVUploader({ onDataLoaded }) {
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    setError(null);
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('CSVファイルをアップロードしてください。');
      return;
    }

    Papa.parse(file, {
      complete: (results) => {
        const parsedData = results.data
          .filter(row => row.length >= 2 && row[0] && row[1])
          .map((row) => ({
            word: row[0].trim(),
            meaning: row[1].trim()
          }));

        if (parsedData.length === 0) {
          setError('有効なデータが見つかりませんでした。フォーマット（単語, 意味）を確認してください。');
          return;
        }

        onDataLoaded(parsedData, file.name);
      },
      error: (err) => {
        setError(`CSVの解析に失敗しました: ${err.message}`);
      },
      header: false,
      skipEmptyLines: true,
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="w-full bg-[#1f2028] rounded-2xl shadow-2xl border border-[#2e303a] p-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-white mb-2">新しい単語データを追加</h3>
        <p className="text-sm text-gray-400">CSVをアップロードして新しい単語帳を作成します</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
          isDragging 
            ? 'border-[#c084fc] bg-[rgba(192,132,252,0.1)]' 
            : 'border-[#2e303a] hover:border-gray-500 hover:bg-[#252630]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={(e) => handleFile(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-[#2e303a] rounded-full text-[#c084fc]">
            <UploadCloud size={48} />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-200">
              クリックしてファイルを選択するか、ドラッグ＆ドロップ
            </p>
            <p className="text-sm text-gray-400 mt-2">
              フォーマット: [単語, 意味]
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start space-x-3 text-red-400">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
