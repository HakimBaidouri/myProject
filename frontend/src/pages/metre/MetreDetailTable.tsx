import { useRef, useEffect, useState } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import type { HotTableClass } from '@handsontable/react';
import { NumericCellType } from 'handsontable/cellTypes';

Handsontable.cellTypes.registerCellType(NumericCellType);

interface MetreDetailTableProps {
  data: any[][];
  onDataChange?: (updated: any[][]) => void;
}

export default function MetreDetailTable({ data, onDataChange }: MetreDetailTableProps) {
  const detailRef = useRef<HotTableClass | null>(null);
  const [localData, setLocalData] = useState<any[][]>([...data]);

  useEffect(() => {
    setLocalData([...data]);
  }, [data]);

  const colHeaders = [
    'Titre',
    'Nombre',
    'Longueur',
    'Largeur',
    'Hauteur/Ép.',
    'Facteur',
    'Total',
    'Actions'
  ];

  const columns = [
    { data: 0, type: 'text' },
    { data: 1, type: 'numeric' },
    { data: 2, type: 'numeric' },
    { data: 3, type: 'numeric' },
    { data: 4, type: 'numeric' },
    { data: 5, type: 'numeric' },
    { data: 6, type: 'numeric', readOnly: true },
    {
      data: 'actions',
      renderer: actionRenderer,
      readOnly: true,
      width: 60
    }
  ];

  function actionRenderer(instance: any, td: HTMLElement, row: number) {
    const totalRowIndex = instance.countRows() - 1;
    td.innerHTML = '';
    if (row === totalRowIndex) return;

    const button = document.createElement('button');
    button.innerText = '🗑️';
    button.style.border = 'none';
    button.style.background = 'transparent';
    button.style.cursor = 'pointer';

    button.onclick = () => {
      const newData = [...localData];
      newData.splice(row, 1);
      updateTotalRow(newData);
      setLocalData(newData);
      onDataChange?.(newData);
    };

    td.appendChild(button);
  }

  const handleChange = (
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    if (!changes || source === 'loadData') return;

    const hot = detailRef.current?.hotInstance;
    if (!hot) return;

    const newData = [...localData.map(row => [...row])];
    const totalRowIndex = hot.countRows() - 1;

    changes.forEach(([row, col]) => {
      if (col !== 6 && row < totalRowIndex) {
        const n = parseFloat(hot.getDataAtCell(row, 1)) || 0;
        const l = parseFloat(hot.getDataAtCell(row, 2)) || 0;
        const w = parseFloat(hot.getDataAtCell(row, 3)) || 0;
        const h = parseFloat(hot.getDataAtCell(row, 4)) || 0;
        const f = parseFloat(hot.getDataAtCell(row, 5)) || 1;
        const total = n * l * w * h * f;
        newData[row][6] = total;
      }
    });

    updateTotalRow(newData);
    setLocalData(newData);
    onDataChange?.(newData);
  };

  const updateTotalRow = (rows: any[][]) => {
    const totalRowIndex = rows.length - 1;
    let total = 0;

    for (let row = 0; row < totalRowIndex; row++) {
      const value = parseFloat(rows[row][6]) || 0;
      total += value;
    }

    rows[totalRowIndex][6] = total;
  };

  const handleAddRow = () => {
    const newData = [...localData];
    const totalRow = newData.pop() || ['Total', '', '', '', '', '', 0];
    const newLine = ['', 1, 1, 1, 1, 1, 0];
    newData.push(newLine, totalRow);
    setLocalData(newData);
    onDataChange?.(newData);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button onClick={handleAddRow} style={{ marginBottom: '0.5rem' }}>
        ➕ Ajouter une ligne
      </button>
      <HotTable
        ref={detailRef}
        data={localData}
        colHeaders={colHeaders}
        columns={columns}
        rowHeaders={true}
        licenseKey="non-commercial-and-evaluation"
        stretchH="all"
        className="metre-table"
        height="auto"
        afterChange={handleChange}
      />
    </div>
  );
}