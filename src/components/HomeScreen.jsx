import { useState } from 'react';
import { BarChart3, BookOpen, Upload, Trash2, Play } from 'lucide-react';
import CSVUploader from './CSVUploader';
import Dashboard from './Dashboard';

const defaultBook = {
  id: 'default-book1',
  name: 'Book1.csv (標準データセット)',
  isDefault: true,
  data: null,
};

function loadDatasets() {
  const saved = localStorage.getItem('english_type_datasets');
  const loadedData = saved ? JSON.parse(saved) : [];
  return [defaultBook, ...loadedData];
}

export default function HomeScreen({ onSelectDataset }) {
  const [datasets, setDatasets] = useState(loadDatasets);
  const [showUploader, setShowUploader] = useState(false);
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);
  const [activeTab, setActiveTab] = useState('words');

  const handleUploadSuccess = (parsedData, filename) => {
    const newDataset = {
      id: Date.now().toString(),
      name: filename || 'アップロードされたデータ',
      data: parsedData,
      isDefault: false
    };

    const saved = localStorage.getItem('english_type_datasets');
    const loadedData = saved ? JSON.parse(saved) : [];
    const updated = [newDataset, ...loadedData];
    
    localStorage.setItem('english_type_datasets', JSON.stringify(updated));
    setDatasets(prev => [prev[0], ...updated]);
    setShowUploader(false);
  };

  const handleDelete = (id) => {
    const saved = localStorage.getItem('english_type_datasets');
    const loadedData = saved ? JSON.parse(saved) : [];
    const updated = loadedData.filter(d => d.id !== id);
    localStorage.setItem('english_type_datasets', JSON.stringify(updated));
    
    setDatasets(prev => prev.filter(d => d.id !== id));
  };

  const handlePlay = async (dataset) => {
    if (dataset.isDefault) {
      setIsLoadingDefault(true);
      try {
        const response = await fetch('/Book1.csv');
        if (!response.ok) throw new Error('Failed to fetch');
        const csvText = await response.text();
        const Papa = await import('papaparse');
        Papa.default.parse(csvText, {
          complete: (results) => {
            const parsedData = results.data
              .filter(row => row.length >= 2 && row[0] && row[1])
              .map((row) => ({
                word: row[0].trim(),
                meaning: row[1].trim()
              }));
            setIsLoadingDefault(false);
            onSelectDataset(parsedData, dataset.name);
          },
          header: false,
          skipEmptyLines: true,
        });
      } catch {
        setIsLoadingDefault(false);
        alert('Book1.csv の読み込みに失敗しました。publicフォルダにファイルが存在するか確認してください。');
      }
    } else {
      onSelectDataset(dataset.data, dataset.name);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 z-20">
      <div className="flex justify-center mb-8">
        <div className="bg-[#1f2028] border border-[#2e303a] rounded-2xl p-1 flex gap-1">
          <button
            onClick={() => {
              setActiveTab('words');
              setShowUploader(false);
            }}
            className={`px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors ${
              activeTab === 'words' ? 'bg-[#aa3bff] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2e303a]'
            }`}
          >
            <BookOpen size={16} />
            単語帳
          </button>
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setShowUploader(false);
            }}
            className={`px-5 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors ${
              activeTab === 'dashboard' ? 'bg-[#aa3bff] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2e303a]'
            }`}
          >
            <BarChart3 size={16} />
            ダッシュボード
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <Dashboard />
      ) : (
        <>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">単語帳（フォルダ）</h2>
          <p className="text-gray-400">学習するデータセットを選択してください</p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="px-4 py-2 bg-[#aa3bff] hover:bg-[#c084fc] text-white font-medium rounded-xl flex items-center gap-2 transition-colors shadow-lg"
        >
          <Upload size={18} />
          {showUploader ? '一覧に戻る' : '新しい単語帳を追加'}
        </button>
      </div>

      {showUploader ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CSVUploader onDataLoaded={handleUploadSuccess} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset) => (
            <div key={dataset.id} className="bg-[#1f2028] border border-[#2e303a] p-6 rounded-3xl flex flex-col hover:border-[#c084fc] hover:shadow-[0_10px_30px_-15px_rgba(192,132,252,0.3)] transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${dataset.isDefault ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-[#c084fc]'}`}>
                    <BookOpen size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg truncate max-w-[150px]" title={dataset.name}>{dataset.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {dataset.isDefault ? '1600+ 単語' : `${dataset.data.length} 単語`}
                    </p>
                  </div>
                </div>
                {!dataset.isDefault && (
                  <button 
                    onClick={() => handleDelete(dataset.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                    title="削除"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <button 
                onClick={() => handlePlay(dataset)}
                disabled={isLoadingDefault && dataset.isDefault}
                className="mt-auto w-full py-3 bg-[#2e303a] hover:bg-[#c084fc] hover:text-white text-gray-300 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoadingDefault && dataset.isDefault ? (
                  <span className="animate-pulse">読み込み中...</span>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" />
                    このデータで学習する
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
