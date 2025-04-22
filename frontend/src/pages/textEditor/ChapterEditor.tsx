import { useState } from 'react';
import MetreTable from '../metre/MetreTable';

interface ChapterEditorProps {
  tableKey: string;
  tableData: any[][];
  onTableChange: (data: any[][]) => void;
  detailDataMap: Record<string, any[][]>;
  setDetailDataMap: React.Dispatch<React.SetStateAction<Record<string, any[][]>>>;
  chapterNotes: Record<string, string>;
  setChapterNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function ChapterEditor({
  tableKey,
  tableData,
  onTableChange,
  detailDataMap,
  setDetailDataMap,
  chapterNotes,
  setChapterNotes
}: ChapterEditorProps) {
  
  const [activeTab, setActiveTab] = useState<'tableur' | 'notes'>('tableur');

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('tableur')}
          style={{ fontWeight: activeTab === 'tableur' ? 'bold' : 'normal' }}
        >
          📊 Tableur
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          style={{ fontWeight: activeTab === 'notes' ? 'bold' : 'normal' }}
        >
          📄 Cahier des charges
        </button>
      </div>

      {activeTab === 'tableur' ? (
        <MetreTable
          key={tableKey}
          tableKey={tableKey}
          data={tableData}
          onDataChange={onTableChange}
          detailDataMap={detailDataMap}
          setDetailDataMap={setDetailDataMap}
        />
      ) : (
        <textarea
          value={chapterNotes[tableKey] || ''}
          onChange={(e) => setChapterNotes(prev => ({ ...prev, [tableKey]: e.target.value }))}
          placeholder="Écrivez ici le cahier des charges..."
          style={{ width: '100%', height: '400px' }}
        />
      )}
    </div>
  );
}
