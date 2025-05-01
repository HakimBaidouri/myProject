// MetreTable.tsx
import { useEffect, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import type { HotTableClass } from '@handsontable/react';
import { NumericCellType } from 'handsontable/cellTypes';
import 'handsontable/dist/handsontable.full.min.css';
import './Metre.css';
import MetreDetailTable from './MetreDetailTable';

Handsontable.cellTypes.registerCellType(NumericCellType);

// Clés pour le stockage localStorage des tables individuelles
const METRE_TABLE_KEY_PREFIX = 'metreTable_';

interface MetreTableProps {
  tableKey: string;
  data: any[][];
  onDataChange: (data: any[][]) => void;
  detailDataMap: Record<string, any[][]>;
  setDetailDataMap: React.Dispatch<React.SetStateAction<Record<string, any[][]>>>;
}

export default function MetreTable({ tableKey, data, onDataChange, detailDataMap, setDetailDataMap }: MetreTableProps) {
  const hotRef = useRef<HotTableClass | null>(null);
  const [localData, setLocalData] = useState<any[][]>([...data]);
  const [openDetails, setOpenDetails] = useState<string[]>([]);

  // Charger les détails ouverts depuis localStorage
  useEffect(() => {
    try {
      const savedDetails = localStorage.getItem(`${METRE_TABLE_KEY_PREFIX}openDetails_${tableKey}`);
      if (savedDetails) {
        setOpenDetails(JSON.parse(savedDetails));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails ouverts:', error);
    }
  }, [tableKey]);

  // Sauvegarder les détails ouverts dans localStorage
  useEffect(() => {
    if (openDetails.length > 0) {
      localStorage.setItem(`${METRE_TABLE_KEY_PREFIX}openDetails_${tableKey}`, JSON.stringify(openDetails));
    }
  }, [openDetails, tableKey]);

  useEffect(() => {
    const updated = [...data.map(row => [...row])];
  
    const totalRowIndex = updated.length - 1;
  
    for (let i = 0; i < totalRowIndex; i++) {
      const qte = parseFloat(updated[i][5]) || 0;
      const pu = parseFloat(updated[i][6]) || 0;
      updated[i][7] = qte * pu;
    }
  
    updated[totalRowIndex][7] = updated
      .slice(0, totalRowIndex)
      .reduce((sum, row) => sum + (parseFloat(row[7]) || 0), 0);
  
    setLocalData(updated);
  }, [data]);

  const getDetailKey = (intitule: string) => `${tableKey}::${intitule}`;

  const toggleDetail = (intitule: string) => {
    const key = getDetailKey(intitule);
    setOpenDetails(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleAddRow = () => {
    setLocalData(prev => {
      const copy = [...prev];
      const total = copy.pop() || ['Total', '', '', '', '', '', 0, 0, 0, ''];
      const newRow = ['', '', '', '', '', 0, 0, 0, ''];
      const updated = [...copy, newRow, total];
      onDataChange(updated);
      
      // Sauvegarde directe dans localStorage pour cette table spécifique
      localStorage.setItem(`${METRE_TABLE_KEY_PREFIX}${tableKey}`, JSON.stringify(updated));
      
      return updated;
    });
  };

  const handleDetailChange = (intitule: string, totalFromDetail: number) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const rowIndex = localData.findIndex(row => row[2] === intitule);
    if (rowIndex !== -1) {
      hot.setDataAtCell(rowIndex, 5, totalFromDetail, 'fromDetail');
    }
  };

  const updateTotalRow = (rows: any[][]) => {
    const totalRowIndex = rows.length - 1;
    let total = 0;
    for (let i = 0; i < totalRowIndex; i++) {
      total += parseFloat(rows[i][7]) || 0;
    }
    rows[totalRowIndex][7] = total;
  };

  const afterChange = (
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    if (!changes || source === 'loadData') return;

    console.log("Modification détectée dans MetreTable:", changes);

    const newData = [...localData.map(row => [...row])];
    const totalRowIndex = newData.length - 1;

    changes.forEach(([row, col, oldValue, newValue]) => {
      console.log(`Cellule modifiée: [${row}, ${col}] de ${oldValue} à ${newValue}`);
      newData[row][col as number] = newValue;

      if (col === 5 || col === 6) {
        // S'assurer que nous traitons avec des nombres
        const qte = parseFloat(newData[row][5]) || 0;
        const pu = parseFloat(newData[row][6]) || 0;
        newData[row][7] = qte * pu;
        console.log(`Prix total recalculé: ${newData[row][7]}`);
      }
    });

    updateTotalRow(newData);
    setLocalData(newData);
    onDataChange(newData);
    
    // Sauvegarde directe dans localStorage pour cette table spécifique
    localStorage.setItem(`${METRE_TABLE_KEY_PREFIX}${tableKey}`, JSON.stringify(newData));
  };

  const actionRenderer = (instance: any, td: HTMLElement, row: number) => {
    const totalRowIndex = instance.countRows() - 1;
    td.innerHTML = '';
    if (row === totalRowIndex) return;

    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = '🗑️';
    deleteBtn.style.marginRight = '5px';
    deleteBtn.style.border = 'none';
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.cursor = 'pointer';

    deleteBtn.onclick = () => {
      const intitule = instance.getDataAtCell(row, 2);
      const newData = [...localData];
      newData.splice(row, 1);
      updateTotalRow(newData);
      setLocalData(newData);
      onDataChange(newData);

      const detailKey = getDetailKey(intitule);
      setDetailDataMap(prev => {
        const copy = { ...prev };
        delete copy[detailKey];
        return copy;
      });

      setOpenDetails(prev => prev.filter(i => i !== detailKey));
      
      // Sauvegarde directe dans localStorage pour cette table spécifique après suppression
      localStorage.setItem(`${METRE_TABLE_KEY_PREFIX}${tableKey}`, JSON.stringify(newData));
    };

    const detailBtn = document.createElement('button');
    detailBtn.innerText = '🔍';
    detailBtn.style.border = 'none';
    detailBtn.style.background = 'transparent';
    detailBtn.style.cursor = 'pointer';

    detailBtn.onclick = () => {
      const intitule = instance.getDataAtCell(row, 2);
      toggleDetail(intitule);
    };

    td.appendChild(deleteBtn);
    td.appendChild(detailBtn);
  };

  const columns = [
    { data: 0, type: 'text' }, // Gr
    { data: 1, type: 'text' }, // Num
    { data: 2, type: 'text' }, // Intitulé
    { data: 3, type: 'text' }, // Nm
    { data: 4, type: 'text' }, // Unité
    { data: 5, type: 'numeric' }, // Quantité
    { data: 6, type: 'numeric' }, // PU
    { data: 7, type: 'numeric', readOnly: true }, // Prix
    { data: 8, type: 'text' }, // Commentaires
    {
      data: 'actions',
      renderer: actionRenderer,
      readOnly: true,
      width: 60
    }
  ];

  const colHeaders = [
    'Gr',
    'Num',
    'Intitulé',
    'Nm',
    'Unité',
    'Quantité',
    'PU',
    'Prix',
    'Commentaires',
    ''
  ];

  return (
    <div className="metre-container">
      <button onClick={handleAddRow} style={{ marginBottom: '1rem' }}>
        ➕ Ajouter une ligne
      </button>

      <HotTable
        ref={hotRef}
        data={localData}
        colHeaders={colHeaders}
        columns={columns}
        rowHeaders={true}
        licenseKey="non-commercial-and-evaluation"
        height="auto"
        undo={true}
        afterChange={afterChange}
        className="metre-table"
        stretchH="all"
      />

      {openDetails.map(detailKey => {
        const intitule = detailKey.split('::')[1];
        const detailData = detailDataMap[detailKey] || [
          ['', 1, 1, 1, 1, 1, 0, ''],
          ['Total', '', '', '', '', '', 0, '']
        ];
        return (
          <div key={`detail-${detailKey}`} style={{ marginTop: '1rem' }}>
            <h4>Détail – {intitule}</h4>
            <MetreDetailTable
              data={detailData}
              onDataChange={(updatedDetail) => {
                setDetailDataMap(prev => ({ ...prev, [detailKey]: updatedDetail }));
                handleDetailChange(intitule, updatedDetail.at(-1)?.[6] ?? 0);
                
                // Sauvegarder les détails modifiés
                const updatedDetails = {...detailDataMap, [detailKey]: updatedDetail};
                localStorage.setItem(`metreDetailData`, JSON.stringify(updatedDetails));
              }}
            />
          </div>
        );
      })}
    </div>
  );
}