import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { NumericCellType } from 'handsontable/cellTypes';
import type { HotTableClass } from '@handsontable/react';
import './Metre.css';


Handsontable.cellTypes.registerCellType(NumericCellType);

interface MetreTableProps {
  data: any[][];
  onChange?: (newData: any[][]) => void;
}

export default function Metre(_: MetreTableProps) {

  const hotRef = useRef<HotTableClass | null>(null);


  const initialData = [
    ['340', '22.5.1', 'Toiture', 'm²', 0, 0, 0],
    ['340', '22.5.2', 'Charpente', 'm²', 0, 0, 0],
    ['Total', '', '', '', '', '', 0, ''] //Total
  ];

  const columns = [
    { data: 0, type: 'text', className: 'col-Ordre' },
    { data: 1, type: 'text', className: 'col-Num' },
    { data: 2, type: 'text', className: 'col-Intitule' },
    { data: 3, type: 'text', className: 'col-Unite' },
    { data: 4, type: 'numeric', className: 'col-Quantite' },
    { data: 5, type: 'numeric', className: 'col-PU' },
    { data: 6, type: 'numeric', readOnly: true, className: 'col-SOM' },
    { data: 7, type: 'text', className: 'col-Commentaires' }
  ];

  const colHeaders = ['Ordre', 'Num', 'Intitulé', 'Unité', 'Quantité', 'PU', 'SOM', 'Commentaires'];

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

      if (col === 6 && row != hot.countRows() - 1) {
        updateTotalRow();
      }
    });
  };

  const handleAddRow = () => {
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      const rowIndex = hot.countRows() - 1;
      hot.alter('insert_row_below', hot.countRows() - 1, 1); // ➕ insère une ligne en bas
      hot.setDataAtCell(rowIndex + 1, 0, 'Total'); // Total
      hot.setDataAtCell(rowIndex, 0, ''); // Ordre
      hot.setDataAtCell(rowIndex, 1, ''); // Num
      hot.setDataAtCell(rowIndex, 2, ''); // Intitulé
      hot.setDataAtCell(rowIndex, 3, ''); // Unité
      hot.setDataAtCell(rowIndex, 4, 0);  // Quantité
      hot.setDataAtCell(rowIndex, 5, 0);  // PU
      hot.setDataAtCell(rowIndex, 6, 0);  // SOM
      hot.setDataAtCell(rowIndex, 7, ''); // Commentaires
    }
  };

  const updateTotalRow = () => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    let total = 0;
    const totalRowIndex = hot.countRows() - 1;
  
    // On boucle sur toutes les lignes sauf la dernière (celle du total)
    for (let row = 0; row < totalRowIndex; row++) {
      const value = parseFloat(hot.getDataAtCell(row, 6)) || 0;
      total += value;
    }

    hot.setDataAtCell(totalRowIndex, 6, total);   // SOM total
  };
  
  return (
    <div className='metre-container'>
      <h1>Tableau Métré</h1>
      <button onClick={handleAddRow}>➕ Ajouter une ligne</button>
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
        className='metre-table'
        stretchH="all"
      />
    </div>
  );
}
