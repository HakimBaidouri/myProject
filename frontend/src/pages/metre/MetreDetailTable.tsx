import { useRef, useEffect, useState } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import type { HotTableClass } from '@handsontable/react';
import { NumericCellType } from 'handsontable/cellTypes';

Handsontable.cellTypes.registerCellType(NumericCellType);

// Clé pour le stockage des tables de détail
const METRE_DETAIL_KEY = 'metreDetailData';

interface MetreDetailTableProps {
  data: any[][];
  onDataChange?: (updated: any[][]) => void;
}

export default function MetreDetailTable({ data, onDataChange }: MetreDetailTableProps) {
  const detailRef = useRef<HotTableClass | null>(null);
  const [localData, setLocalData] = useState<any[][]>([...data]);

  // Mise à jour des données locales quand les props changent
  useEffect(() => {
    setLocalData([...data]);
  }, [data]);

  // Mettre à jour les totaux lors de l'initialisation
  useEffect(() => {
    if (localData.length > 0) {
      const updatedData = calculateTotals([...localData]);
      setLocalData(updatedData);
    }
  }, []);

  // Fonction pour calculer les totaux des lignes et la somme totale
  const calculateTotals = (rows: any[][]): any[][] => {
    const lastRowIndex = rows.length - 1;
    let sum = 0;

    for (let i = 0; i < lastRowIndex; i++) {
      // Pour chaque ligne, calculer le total comme number * length * width * height * factor
      const number = parseFloat(rows[i][1]) || 0;
      const length = parseFloat(rows[i][2]) || 0;
      const width = parseFloat(rows[i][3]) || 0;
      const height = parseFloat(rows[i][4]) || 0;
      const factor = parseFloat(rows[i][5]) || 0;
      
      const total = number * length * width * height * factor;
      rows[i][6] = total;
      sum += total;
    }

    // Mettre à jour la ligne Total
    if (rows[lastRowIndex] && rows[lastRowIndex][0] === 'Total') {
      rows[lastRowIndex][6] = sum;
    }

    return rows;
  };

  const handleChange = (
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) => {
    if (!changes || source === 'loadData') return;

    console.log("Modification détectée dans MetreDetailTable:", changes);

    // Obtenir une copie des données
    const newData = [...localData.map(row => [...row])];
    
    // Appliquer les changements
    changes.forEach(([row, col, oldValue, newValue]) => {
      console.log(`Cellule détail modifiée: [${row}, ${col}] de ${oldValue} à ${newValue}`);
      newData[row][col as number] = newValue;
    });

    // Recalculer les totaux
    const updatedData = calculateTotals(newData);
    
    setLocalData(updatedData);
    onDataChange?.(updatedData);
  };

  const columns = [
    { data: 0, type: 'text' },      // Désignation
    { data: 1, type: 'numeric' },   // Nombre
    { data: 2, type: 'numeric' },   // Longueur
    { data: 3, type: 'numeric' },   // Largeur
    { data: 4, type: 'numeric' },   // Hauteur
    { data: 5, type: 'numeric' },   // Facteur
    { data: 6, type: 'numeric', readOnly: true }, // Total
    { data: 7, type: 'text' }       // Commentaires
  ];

  const colHeaders = [
    'Désignation',
    'Nombre',
    'Longueur',
    'Largeur',
    'Hauteur',
    'Facteur',
    'Total',
    'Commentaires'
  ];

  const handleAddRow = () => {
    const newData = [...localData];
    const totalRow = newData.pop() || ['Total', '', '', '', '', '', 0, '', ''];
    const newLine = ['', 1, 1, 1, 1, 1, 0, '', ''];
    newData.push(newLine, totalRow);
    
    const updatedData = calculateTotals(newData);
    setLocalData(updatedData);
    onDataChange?.(updatedData);
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
