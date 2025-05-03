// @ts-ignore
import { useState, useEffect, useRef, useCallback } from 'react';
// @ts-ignore
import { HotTable } from '@handsontable/react';
import Handsontable, { CellChange } from 'handsontable';
import { HotTableProps } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { useLocalStorageData, TreeNodeData, STORAGE_KEYS } from '../../hooks/useLocalStorageData';

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
  chapterId?: string; // ID du chapitre pour suivre les modifications
  lineIndex?: number; // Index de la ligne dans le tableau original
  isEmptyLine?: boolean; // Pour les lignes vides entre les chapitres
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
  const { treeData, tableDataMap, loading, updateTableDataMap } = useLocalStorageData();
  const hotTableRef = useRef<HotTable>(null);
  const dataMapRef = useRef<Record<number, { chapterId: string, lineIndex: number }>>({});
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  
  console.log("🚀 SummarySpreadsheet: Payload reçu depuis localStorage:", {
    treeData,
    tableDataMap
  });

  // Fonction pour forcer le rafraîchissement des données depuis le localStorage
  const forceRefresh = useCallback(() => {
    console.log("🔄 Forçage du rafraîchissement des données...");
    // Rechargement des données depuis localStorage
    const savedTableData = localStorage.getItem(STORAGE_KEYS.TABLE_DATA);
    const savedTreeData = localStorage.getItem(STORAGE_KEYS.TREE_DATA);
    
    let refreshedTableDataMap = tableDataMap;
    let refreshedTreeData = treeData;
    
    if (savedTableData) {
      try {
        refreshedTableDataMap = JSON.parse(savedTableData);
      } catch (error) {
        console.error("Erreur lors du parsing des données de tableau:", error);
      }
    }
    
    if (savedTreeData) {
      try {
        refreshedTreeData = JSON.parse(savedTreeData);
      } catch (error) {
        console.error("Erreur lors du parsing des données d'arborescence:", error);
      }
    }
    
    // Si des données ont été récupérées, mettre à jour le state
    if (Object.keys(refreshedTableDataMap).length > 0 && refreshedTreeData.length > 0) {
      const chaptersData = convertLocalStorageDataToChapters(refreshedTreeData, refreshedTableDataMap);
      processProjectData(chaptersData);
      setLastRefreshTime(Date.now());
    }
  }, [tableDataMap, treeData]);

  // Forcer un rafraîchissement au montage du composant
  useEffect(() => {
    // Attendre un court délai pour s'assurer que localStorage est bien initialisé
    const timer = setTimeout(() => {
      forceRefresh();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Effet standard pour mettre à jour lorsque les données changent
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
        .map(row => {
          // S'assurer que les valeurs numériques sont correctement traitées
          const quantity = typeof row[5] === 'string' ? parseFloat(row[5]) || 0 : Number(row[5]) || 0;
          const unitPrice = typeof row[6] === 'string' ? parseFloat(row[6]) || 0 : Number(row[6]) || 0;
          // Calculer explicitement le prix total ici aussi
          const totalPrice = quantity * unitPrice;
          
          return {
            mainTableLine: {
              gr: row[0],
              num: row[1],
              title: row[2],
              nm: row[3],
              unit: row[4],
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: totalPrice, // Utiliser le prix calculé
              comments: row[8] || ''
            }
          };
        });
      
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

  // Ajuster la fonction de traitement des changements pour gérer correctement les types
  const handleTableChange = (changes: CellChange[] | null, source: Handsontable.ChangeSource) => {
    if (!changes || changes.length === 0 || source !== 'edit') return;
    
    // Clone des données actuelles pour modification
    const updatedTableDataMap = { ...tableDataMap };
    let hasChanges = false;

    // Traiter chaque changement
    changes.forEach((change) => {
      const [row, prop, oldValue, newValue] = change;
      const col = typeof prop === 'number' ? prop : parseInt(prop.toString(), 10);
      
      // Récupérer les infos de la ligne modifiée
      const rowData = consolidatedData[row] as RowData;
      
      // Ignorer si c'est un titre de chapitre ou une ligne vide
      if (rowData.isChapterTitle || rowData.isEmptyLine) return;
      
      // Récupérer l'ID du chapitre et l'index de la ligne
      const chapterId = rowData.chapterId;
      const lineIndex = rowData.lineIndex;
      
      if (chapterId && lineIndex !== undefined) {
        // Récupérer le tableau de données du chapitre
        const chapterData = [...updatedTableDataMap[chapterId]];
        
        // Mettre à jour la valeur dans le tableau
        chapterData[lineIndex][col] = newValue;
        
        // Si col est 5 (quantité) ou 6 (prix unitaire), recalculer le prix total
        if (col === 5 || col === 6) {
          // Convertir explicitement en nombres
          const quantity = typeof chapterData[lineIndex][5] === 'string' ? 
            parseFloat(chapterData[lineIndex][5]) || 0 : 
            Number(chapterData[lineIndex][5]) || 0;
          
          const unitPrice = typeof chapterData[lineIndex][6] === 'string' ? 
            parseFloat(chapterData[lineIndex][6]) || 0 : 
            Number(chapterData[lineIndex][6]) || 0;
          
          // Calculer le nouveau prix total
          const totalPrice = quantity * unitPrice;
          console.log(`Calcul du prix: ${quantity} × ${unitPrice} = ${totalPrice}`);
          
          // Mettre à jour le prix total dans les données
          chapterData[lineIndex][7] = totalPrice;
          
          // Mettre également à jour la ligne dans consolidatedData pour le rendu immédiat
          consolidatedData[row][7] = totalPrice;
        }
        
        // Mettre à jour le tableau dans la map
        updatedTableDataMap[chapterId] = chapterData;
        hasChanges = true;
      }
    });
    
    // Sauvegarder les modifications si nécessaire
    if (hasChanges) {
      updateTableDataMap(updatedTableDataMap);
      
      // Forcer une mise à jour de l'interface pour afficher les prix recalculés
      setConsolidatedData([...consolidatedData]);
    }
  };

  const processProjectData = (chapters: ChapterWithLines[]) => {
    const data: (any[] & RowData)[] = [];
    const mergedCells: MergedCellConfig[] = [];
    const dataMap: Record<number, { chapterId: string, lineIndex: number }> = {};
    
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
      chapterRow.chapterId = chapter.id;
      
      // Enregistrer les informations pour fusionner les cellules de cette ligne
      mergedCells.push({
        row: data.length,
        col: 0,
        rowspan: 1,
        colspan: 9
      });
      
      data.push(chapterRow);
      
      // Ajouter les lignes du chapitre
      lines.forEach((lineWithDetails, lineIndex) => {
        const line = lineWithDetails.mainTableLine;
        const rowIndex = data.length;
        
        // Créer la ligne avec les métadonnées
        const lineRow = [
          line.gr,
          line.num,
          line.title,
          line.nm,
          line.unit,
          line.quantity,
          line.unitPrice,
          line.totalPrice,
          line.comments
        ] as any[] & RowData;
        
        // Ajouter des métadonnées pour identifier la ligne
        lineRow.chapterId = chapter.id;
        lineRow.lineIndex = lineIndex; // Position dans le tableau d'origine
        
        data.push(lineRow);
        
        // Stocker la correspondance entre l'index dans consolidatedData et les données originales
        dataMap[rowIndex] = { chapterId: chapter.id, lineIndex };
        
        // Ajouter au total global
        globalTotal += Number(line.totalPrice) || 0;
      });
      
      // Ajouter une ligne vide après chaque chapitre
      const emptyRow = ['', '', '', '', '', '', '', '', ''] as any[] & RowData;
      emptyRow.isEmptyLine = true;
      data.push(emptyRow);
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
    
    // Sauvegarder les références pour l'édition
    dataMapRef.current = dataMap;
    
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
    { data: 7, type: 'numeric', readOnly: true }, // Prix est calculé automatiquement (readonly)
    { data: 8 }
  ];

  // Fonction pour déterminer si une cellule est en lecture seule
  const isCellReadOnly = (row: number, col: number) => {
    const rowData = consolidatedData[row] as RowData;
    
    // Titres de chapitres et lignes vides en lecture seule
    if (rowData && (rowData.isChapterTitle || rowData.isEmptyLine)) {
      return true;
    }
    
    // Dernière ligne (TOTAL PROJET) en lecture seule
    if (row === consolidatedData.length - 1) {
      return true;
    }
    
    // Prix est toujours calculé automatiquement
    if (col === 7) {
      return true;
    }
    
    return false;
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des données...</div>;
  }

  if (treeData.length === 0) {
    return <div className="text-center py-8 text-red-500">Aucune donnée disponible. Veuillez d'abord compléter les données dans la section Métré.</div>;
  }

  return (
    <div className="summary-spreadsheet">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Spreadsheet Summary</h2>
        <button 
          onClick={forceRefresh}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1"
        >
          <span>↻</span> Rafraîchir
        </button>
      </div>
      
      <div className="bg-yellow-100 p-3 mb-4 rounded border border-yellow-300 text-sm">
        <strong>Note:</strong> Vous pouvez modifier les données dans ce tableur. 
        Les modifications seront synchronisées avec la section Métré.
        <ul className="list-disc ml-5 mt-1">
          <li>Les titres des chapitres ne sont pas modifiables</li>
          <li>Le prix est calculé automatiquement</li>
          <li>L'ajout et la suppression de lignes ne sont pas disponibles</li>
        </ul>
        <p className="mt-1 text-xs text-gray-600">Dernière mise à jour: {new Date(lastRefreshTime).toLocaleTimeString()}</p>
      </div>
      
      {consolidatedData.length > 0 ? (
        <div className="hot-table-container">
          <HotTable
            ref={hotTableRef}
            data={consolidatedData}
            rowHeaders={true}
            colHeaders={columnHeaders}
            columns={columnsConfig}
            licenseKey="non-commercial-and-evaluation"
            height="600"
            stretchH="all"
            readOnly={false}
            className="metre-summary-table"
            mergeCells={mergedCellsConfig}
            afterChange={handleTableChange}
            beforeChange={(changes, source) => {
              if (!changes || source !== 'edit') return true;
              
              // Filtrer les changements pour éviter la modification des cellules en lecture seule
              const filteredChanges = changes.filter(([row, col, oldValue, newValue]) => {
                return !isCellReadOnly(row, parseInt(col.toString()));
              });
              
              // Si tous les changements sont filtrés, annuler l'opération
              if (filteredChanges.length === 0) {
                return false;
              }
              
              // Remplacer les changements par la version filtrée
              changes.splice(0, changes.length, ...filteredChanges);
              
              return true;
            }}
            beforeRenderer={(TD, row, col, prop, value, cellProperties) => {
              // Déterminer si la cellule est en lecture seule
              const isReadOnly = isCellReadOnly(row, col);
              
              // Appliquer les styles pour les cellules en lecture seule
              if (isReadOnly) {
                cellProperties.readOnly = true;
                TD.style.backgroundColor = '#f8f9fa';
                TD.style.color = '#6c757d';
              }
            }}
            afterRenderer={(TD, row, col, prop, value, cellProperties) => {
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
              // Formatage pour les cellules de type numeric
              else if ((col === 5 || col === 6 || col === 7) && typeof value === 'number') {
                TD.style.textAlign = 'right';
                
                // Format différent pour le prix (2 décimales et €)
                if (col === 7) {
                  const numValue = Number(value);
                  TD.textContent = `${numValue.toFixed(2)} €`;
                } 
                // Format pour quantité et PU (2 décimales)
                else {
                  const numValue = Number(value);
                  TD.textContent = numValue.toFixed(2);
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