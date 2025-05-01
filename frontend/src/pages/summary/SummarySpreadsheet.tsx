import { useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { useLocalStorageData, TreeNodeData } from '../../hooks/useLocalStorageData';

// Enregistrer tous les modules Handsontable, y compris MergedCells
registerAllModules();

// Type pour la configuration des cellules fusionnées
type MergedCellConfig = {
  row: number;
  col: 0;
  rowspan: 1;
  colspan: number; // Permet différentes valeurs de colspan
};

interface RowData {
  isChapterTitle?: boolean;
  chapterTitle?: string;
}

// Type simplifié pour la compatibilité avec le localStorage
interface ChapterData {
  id: string;
  num: string;
  label: string;
  parentId: string | null;
}

interface ChapterWithLines {
  chapter: ChapterData;
  lines: {
    mainTableLine: {
      gr: string;
      num: string;
      title: string;
      nm: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      comments: string;
    };
  }[];
}

export default function SummarySpreadsheet() {
  const [consolidatedData, setConsolidatedData] = useState<(any[] & RowData)[]>([]);
  const [mergedCellsConfig, setMergedCellsConfig] = useState<MergedCellConfig[]>([]);
  const { treeData, tableDataMap, loading } = useLocalStorageData();
  
  console.log("🚀 SummarySpreadsheet: Payload reçu depuis localStorage:", {
    treeData,
    tableDataMap
  });

  useEffect(() => {
    if (!loading && treeData.length > 0 && Object.keys(tableDataMap).length > 0) {
      // Convertir les données du localStorage au format attendu par le composant
      const chaptersData = convertLocalStorageDataToChapters(treeData, tableDataMap);
      processProjectData(chaptersData);
    }
  }, [loading, treeData, tableDataMap]);

  // Convertir les données localStorage au format attendu
  const convertLocalStorageDataToChapters = (
    nodes: TreeNodeData[], 
    tables: Record<string, any[][]>
  ): ChapterWithLines[] => {
    // Créer une liste plate de tous les nœuds
    const flatNodes = flattenTreeNodes(nodes);
    
    return flatNodes.map(node => {
      const tableData = tables[node.key] || [];
      
      // Convertir les lignes du tableau en format attendu
      const lines = tableData
        .filter(row => row[0] !== 'Total') // Ignorer les lignes de total
        .map(row => ({
          mainTableLine: {
            gr: row[0],
            num: row[1],
            title: row[2],
            nm: row[3],
            unit: row[4],
            quantity: parseFloat(row[5]) || 0,
            unitPrice: parseFloat(row[6]) || 0,
            totalPrice: parseFloat(row[7]) || 0,
            comments: row[8] || ''
          }
        }));
      
      return {
        chapter: {
          id: node.key,
          num: node.num,
          label: node.label,
          parentId: node.parentId || null
        },
        lines
      };
    });
  };

  // Fonction pour aplatir l'arborescence
  const flattenTreeNodes = (nodes: TreeNodeData[]): TreeNodeData[] => {
    let result: TreeNodeData[] = [];
    
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        result = [...result, ...flattenTreeNodes(node.children)];
      }
    });
    
    return result;
  };

  const processProjectData = (chapters: ChapterWithLines[]) => {
    const data: (any[] & RowData)[] = [];
    const mergedCells: MergedCellConfig[] = [];
    
    // Créer une structure plate des chapitres pour l'affichage
    const flatChapters = chapters;
    
    // Trier les chapitres par leur numéro
    flatChapters.sort((a, b) => {
      return a.chapter.num.localeCompare(b.chapter.num, undefined, { numeric: true });
    });
    
    // Variable pour calculer le total global
    let globalTotal = 0;
    
    // Ajouter les données de chaque chapitre
    flatChapters.forEach(chapterWithLines => {
      const { chapter, lines } = chapterWithLines;
      
      // Titre complet du chapitre pour affichage
      const fullChapterTitle = `${chapter.num} - ${chapter.label}`;
      
      // Ajouter une ligne pour le titre du chapitre
      const chapterRow = [
        fullChapterTitle, // Placer le titre complet dans la première cellule
        '', // Num
        '', // Intitulé
        '', // Nm
        '', // Unité
        '', // Quantité
        '', // PU
        '', // Prix
        ''  // Commentaires
      ] as any[] & RowData;
      
      // Marquer cette ligne comme un titre de chapitre
      chapterRow.isChapterTitle = true;
      chapterRow.chapterTitle = fullChapterTitle;
      
      // Enregistrer les informations pour fusionner les cellules de cette ligne
      mergedCells.push({
        row: data.length,
        col: 0,
        rowspan: 1,
        colspan: 9
      });
      
      data.push(chapterRow);
      
      // Ajouter les lignes du chapitre
      lines.forEach(lineWithDetails => {
        const line = lineWithDetails.mainTableLine;
        data.push([
          line.gr,
          line.num,
          line.title,
          line.nm,
          line.unit,
          line.quantity,
          line.unitPrice,
          line.totalPrice,
          line.comments
        ]);
        
        // Ajouter au total global
        globalTotal += Number(line.totalPrice) || 0;
      });
      
      // Ajouter une ligne vide après chaque chapitre
      data.push(['', '', '', '', '', '', '', '', '']);
    });
    
    console.log('Total global calculé:', globalTotal);
    
    // Formater le total pour s'assurer qu'il est un nombre valide
    const formattedTotal = typeof globalTotal === 'number' ? globalTotal : 
                           typeof globalTotal === 'string' ? parseFloat(globalTotal) || 0 : 0;
    
    // Ajouter une ligne de total global
    const totalRow = [
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      formattedTotal,  // Utiliser la valeur formatée ici
      ''
    ] as any[] & RowData;
    
    // Marquer cette ligne comme un titre spécial
    totalRow.isChapterTitle = true;
    totalRow.chapterTitle = 'TOTAL PROJET';
    
    // Enregistrer les informations pour fusionner les cellules de cette ligne du total
    // On fusionne de la colonne 0 à 6 (7 colonnes) pour laisser la cellule du prix visible
    mergedCells.push({
      row: data.length,
      col: 0,
      rowspan: 1,
      colspan: 7
    });
    
    data.push(totalRow);
    
    setConsolidatedData(data);
    setMergedCellsConfig(mergedCells);
  };

  // En-têtes des colonnes définies en dehors du tableau de données
  const columnHeaders = ['Gr', 'Num', 'Intitulé', 'Nm', 'Unité', 'Quantité', 'PU', 'Prix', 'Commentaires'];

  // Configuration de base des colonnes
  const columnsConfig = [
    { data: 0 },
    { data: 1 },
    { data: 2 },
    { data: 3 },
    { data: 4 },
    { data: 5, type: 'numeric' },
    { data: 6, type: 'numeric' },
    { data: 7, type: 'numeric' },
    { data: 8 }
  ];

  if (loading) {
    return <div className="text-center py-8">Chargement des données...</div>;
  }

  if (treeData.length === 0) {
    return <div className="text-center py-8 text-red-500">Aucune donnée disponible. Veuillez d'abord compléter les données dans la section Métré.</div>;
  }

  return (
    <div className="summary-spreadsheet">
      <h2 className="text-xl font-semibold mb-4">Spreadsheet Summary</h2>
      
      {consolidatedData.length > 0 ? (
        <div className="hot-table-container">
          <HotTable
            data={consolidatedData}
            rowHeaders={true}
            colHeaders={columnHeaders}
            columns={columnsConfig}
            licenseKey="non-commercial-and-evaluation"
            height="600"
            stretchH="all"
            readOnly={true}
            className="metre-summary-table"
            mergeCells={mergedCellsConfig}
            beforeRenderer={(TD, row, col, prop, value, cellProperties) => {
              // Vérifier si la ligne actuelle est un titre de chapitre
              const rowData = consolidatedData[row] as RowData;
              if (rowData && rowData.isChapterTitle) {
                // Styles de base pour tous les titres
                TD.style.fontWeight = 'bold';
                TD.style.textAlign = 'left';
                TD.style.paddingLeft = '1rem';
                TD.style.verticalAlign = 'middle';
                
                // Si c'est la ligne de total global (dernière ligne)
                if (rowData.chapterTitle === 'TOTAL PROJET') {
                  // Style spécifique pour la ligne de total
                  TD.style.backgroundColor = '#e6f7ff'; // Bleu clair
                  TD.style.borderTop = '2px solid #1890ff'; // Bordure bleue
                  TD.style.borderBottom = '2px solid #1890ff';
                  
                  // Pour la cellule du total
                  if (col === 7) { // Colonne Prix
                    const totalValue = Number(value) || 0;
                    console.log('Valeur dans la cellule total:', value, typeof value);
                    
                    TD.style.textAlign = 'right';
                    TD.style.paddingRight = '1rem';
                    TD.style.fontWeight = 'bold';
                    TD.style.fontSize = '18px';
                    TD.textContent = `${totalValue.toFixed(2)} €`;
                    
                    // Pour déboguer
                    console.log('Contenu de la cellule après formatage:', TD.textContent);
                  } else if (col === 0) {
                    TD.style.fontSize = '18px';
                    TD.textContent = 'TOTAL PROJET';
                  } else {
                    TD.textContent = '';
                  }
                } else {
                  // Style normal pour les titres de chapitre
                  TD.style.fontSize = '18px';
                  TD.style.backgroundColor = '#f3f4f6';
                  
                  // Si c'est la première cellule, s'assurer que le titre est bien affiché
                  if (col === 0) {
                    TD.textContent = rowData.chapterTitle || '';
                  } else {
                    // Masquer le contenu des autres cellules dans la ligne fusionnée
                    TD.textContent = '';
                  }
                }
              }
            }}
          />
        </div>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
} 