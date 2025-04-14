import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { NumericCellType } from 'handsontable/cellTypes';
import type { HotTableClass } from '@handsontable/react';
import './Metre.css';

Handsontable.cellTypes.registerCellType(NumericCellType);

interface MetreTableProps {
  data: any[][]; // toujours utile si tu veux le rendre contrôlé plus tard
  onChange?: (newData: any[][]) => void;
}

export default function Metre(_: MetreTableProps) {
  const hotRef = useRef<HotTableClass | null>(null);

  const initialData = [
    ['340', '22.5.1', 'Toiture', 'm²', 0, 0, 0, ''],
    ['340', '22.5.2', 'Charpente', 'm²', 0, 0, 0, ''],
    ['Total', '', '', '', '', '', 0, '']
  ];

  const actionRenderer = (instance: any, td: HTMLElement, row: number) => {
    const totalRowIndex = instance.countRows() - 1;
    td.innerHTML = '';
  
    if (row === totalRowIndex) return;
  
    const button = document.createElement('button');
    button.innerText = '🗑️';
    button.style.border = 'none';
    button.style.background = 'transparent';
    button.style.cursor = 'pointer';
  
    button.onclick = () => {
      instance.alter('remove_row', row);
      updateTotalRow(); // ✅ recalcul après suppression
    };
  
    td.appendChild(button);
  };  

  const columns = [
    { data: 0, type: 'text', className: 'col-Ordre' },
    { data: 1, type: 'text', className: 'col-Num' },
    { data: 2, type: 'text', className: 'col-Intitule' },
    { data: 3, type: 'text', className: 'col-Unite' },
    { data: 4, type: 'numeric', className: 'col-Quantite' },
    { data: 5, type: 'numeric', className: 'col-PU' },
    { data: 6, type: 'numeric', readOnly: true, className: 'col-SOM' },
    { data: 7, type: 'text', className: 'col-Commentaires' },
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
    '' // pour la colonne "Actions"
  ];

  const afterChange = (
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    if (!changes || source === 'loadData') return;

    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    changes.forEach(([row, col]) => {
      if (col === 4 || col === 5) {
        const quantity = parseFloat(hot.getDataAtCell(row, 4)) || 0;
        const unitPrice = parseFloat(hot.getDataAtCell(row, 5)) || 0;
        const product = quantity * unitPrice;
        hot.setDataAtCell(row, 6, product, 'autoCalc');
      }

      if (col === 6 && row !== hot.countRows() - 1) {
        updateTotalRow();
      }
    });
  };

  const handleAddRow = () => {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      const rowIndex = hot.countRows() - 1;
      hot.alter('insert_row_below', rowIndex, 1);
      hot.setDataAtCell(rowIndex + 1, 0, 'Total');
      hot.setDataAtCell(rowIndex, 0, '');
      hot.setDataAtCell(rowIndex, 1, '');
      hot.setDataAtCell(rowIndex, 2, '');
      hot.setDataAtCell(rowIndex, 3, '');
      hot.setDataAtCell(rowIndex, 4, 0);
      hot.setDataAtCell(rowIndex, 5, 0);
      hot.setDataAtCell(rowIndex, 6, 0);
      hot.setDataAtCell(rowIndex, 7, '');
    }
  };

  const updateTotalRow = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    let total = 0;
    const totalRowIndex = hot.countRows() - 1;

    for (let row = 0; row < totalRowIndex; row++) {
      const value = parseFloat(hot.getDataAtCell(row, 6)) || 0;
      total += value;
    }

    hot.setDataAtCell(totalRowIndex, 6, total);
  };

  return (
    <div className="metre-container">
      <h1>Tableau Métré</h1>
      <button onClick={handleAddRow} style={{ marginBottom: '1rem' }}>
        ➕ Ajouter une ligne
      </button>
      <HotTable
        ref={hotRef}
        data={initialData}
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
    </div>
  );
}
