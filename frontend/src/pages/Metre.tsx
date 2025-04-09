import { useRef } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { NumericCellType } from 'handsontable/cellTypes';
import type { HotTableClass } from '@handsontable/react';


Handsontable.cellTypes.registerCellType(NumericCellType);

export default function Metre() {
    const hotRef = useRef<HotTableClass | null>(null);


  const initialData = [
    [1, 2, 0],
    [3, 4, 0]
  ];

  const columns = [
    { data: 0, type: 'numeric' }, // A
    { data: 1, type: 'numeric' }, // B
    { data: 2, type: 'numeric', readOnly: true } // C = A * B
  ];

  const colHeaders = ['A', 'B', 'C'];

  const afterChange = (
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    if (!changes || source === 'loadData') return;

    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    changes.forEach(([row, col]) => {
      if (col === 0 || col === 1) {
        const a = parseFloat(hot.getDataAtCell(row, 0)) || 0;
        const b = parseFloat(hot.getDataAtCell(row, 1)) || 0;
        const product = a * b;
        hot.setDataAtCell(row, 2, product, 'autoCalc');
      }
    });
  };

  return (
    <div>
      <h1>Tableau Métré</h1>
      <HotTable
        ref={hotRef}
        data={initialData}
        colHeaders={colHeaders}
        columns={columns}
        rowHeaders={true}
        licenseKey="non-commercial-and-evaluation"
        width="100%"
        height="auto"
        undo={true}
        afterChange={afterChange}
      />
    </div>
  );
}
