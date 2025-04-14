import { useRef, useState } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import type { HotTableClass } from '@handsontable/react';
import { NumericCellType } from 'handsontable/cellTypes';
import 'handsontable/dist/handsontable.full.min.css';
import './Metre.css';
import MetreDetailTable from './MetreDetailTable';

Handsontable.cellTypes.registerCellType(NumericCellType);

export default function MetreTable() {
  const hotRef = useRef<HotTableClass | null>(null);

  const [mainData, setMainData] = useState<any[][]>([
    ['340', '22.5.1', 'Toiture', 'm²', 0, 0, 0, ''],
    ['340', '22.5.2', 'Charpente', 'm²', 0, 0, 0, ''],
    ['Total', '', '', '', '', '', 0, '']
  ]);

  const [details, setDetails] = useState<Record<string, any[][]>>({});
  const [openDetails, setOpenDetails] = useState<string[]>([]);

  const toggleDetail = (intitule: string) => {
    setOpenDetails(prev =>
      prev.includes(intitule)
        ? prev.filter(i => i !== intitule)
        : [...prev, intitule]
    );
  };

  const handleAddRow = () => {
    setMainData(prev => {
      const copy = [...prev];
      const total = copy.pop() || ['Total', '', '', '', '', '', 0, ''];
      const newRow = ['', '', '', '', 0, 0, 0, ''];
      return [...copy, newRow, total];
    });
  };

  const handleDetailChange = (intitule: string, totalFromDetail: number) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const rowIndex = hot.getData().findIndex(row => row[2] === intitule);
    if (rowIndex !== -1) {
      hot.setDataAtCell(rowIndex, 4, totalFromDetail, 'fromDetail');
    }
  };

  const updateTotalRow = () => {
    setMainData(prev => {
      const copy = [...prev];
      const totalRowIndex = copy.length - 1;

      let total = 0;
      for (let i = 0; i < totalRowIndex; i++) {
        total += parseFloat(copy[i][6]) || 0;
      }

      copy[totalRowIndex][6] = total;
      return copy;
    });
  };

  const afterChange = (
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    if (!changes || source === 'loadData') return;

    setMainData(prev => {
      const newData = [...prev.map(row => [...row])];
      const totalRowIndex = newData.length - 1;

      changes.forEach(([row, col, , newValue]) => {
        newData[row][col as number] = newValue;

        if (col === 4 || col === 5) {
          const qte = parseFloat(newData[row][4]) || 0;
          const pu = parseFloat(newData[row][5]) || 0;
          newData[row][6] = qte * pu;
        }
      });

      // Update total général
      let total = 0;
      for (let i = 0; i < totalRowIndex; i++) {
        total += parseFloat(newData[i][6]) || 0;
      }
      newData[totalRowIndex][6] = total;

      return newData;
    });
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
      const intitule = instance.getDataAtCell(row, 2); // col 2 = intitulé

      // Supprime la ligne
      instance.alter('remove_row', row);
      updateTotalRow();

      // Supprime aussi le détail associé
      setDetails(prev => {
        const copy = { ...prev };
        delete copy[intitule];
        return copy;
      });

      setOpenDetails(prev => prev.filter(i => i !== intitule));
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
    { data: 0, type: 'text' },
    { data: 1, type: 'text' },
    { data: 2, type: 'text' },
    { data: 3, type: 'text' },
    { data: 4, type: 'numeric' },
    { data: 5, type: 'numeric' },
    { data: 6, type: 'numeric', readOnly: true },
    { data: 7, type: 'text' },
    {
      data: 'actions',
      renderer: actionRenderer,
      readOnly: true,
      width: 60
    }
  ];

  const colHeaders = [
    'Ordre',
    'Num',
    'Intitulé',
    'Unité',
    'Quantité',
    'PU',
    'SOM',
    'Commentaires',
    ''
  ];

  return (
    <div className="metre-container">
      <h1>Tableau Métré</h1>
      <button onClick={handleAddRow} style={{ marginBottom: '1rem' }}>
        ➕ Ajouter une ligne
      </button>

      <HotTable
        ref={hotRef}
        data={mainData}
        colHeaders={colHeaders}
        columns={columns}
        rowHeaders={false}
        licenseKey="non-commercial-and-evaluation"
        height="auto"
        undo={true}
        afterChange={afterChange}
        className="metre-table"
        stretchH="all"
      />

      {openDetails.map(intitule => (
        <div key={`detail-${intitule}`} style={{ marginTop: '1rem' }}>
          <h4>Détail – {intitule}</h4>
          <MetreDetailTable
            onDataChange={total => handleDetailChange(intitule, total)}
          />
        </div>
      ))}
    </div>
  );
}
