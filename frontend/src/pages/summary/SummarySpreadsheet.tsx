import { useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { useProjectLoader } from '@/hooks/useProjectLoader';
import { ChapterWithLines, Chapter, MainTableLine } from '@/types/projectTypes';

// Enregistrer tous les modules Handsontable, y compris MergedCells
registerAllModules();

interface RowData {
  isChapterTitle?: boolean;
  chapterTitle?: string;
}

export default function SummarySpreadsheet() {
  const [consolidatedData, setConsolidatedData] = useState<(any[] & RowData)[]>([]);
  const [mergedCellsConfig, setMergedCellsConfig] = useState<{row: number, col: 0, rowspan: 1, colspan: 9}[]>([]);
  // Temporairement, utiliser un ID de projet fixe
  // Dans une implémentation complète, cela viendrait d'un paramètre d'URL ou d'un état global
  const projectId = 1;
  const { data, loading, error } = useProjectLoader(projectId);

  useEffect(() => {
    if (data) {
      processProjectData(data.chapters);
    }
  }, [data]);

  const processProjectData = (chapters: ChapterWithLines[]) => {
    const data: (any[] & RowData)[] = [];
    const mergedCells: {row: number, col: 0, rowspan: 1, colspan: 9}[] = [];
    
    // Créer une structure plate des chapitres pour l'affichage
    const flatChapters = flattenChapters(chapters);
    
    // Trier les chapitres par leur numéro
    flatChapters.sort((a, b) => {
      return a.chapter.num.localeCompare(b.chapter.num, undefined, { numeric: true });
    });
    
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
      });
      
      // Ajouter une ligne vide après chaque chapitre
      data.push(['', '', '', '', '', '', '', '', '']);
    });
    
    setConsolidatedData(data);
    setMergedCellsConfig(mergedCells);
  };

  // Fonction récursive pour aplatir la structure des chapitres
  const flattenChapters = (chapters: ChapterWithLines[], parentId: number | null = null): ChapterWithLines[] => {
    const result: ChapterWithLines[] = [];
    
    chapters
      .filter(ch => ch.chapter.parentId === parentId)
      .forEach(chapterWithLines => {
        result.push(chapterWithLines);
        result.push(...flattenChapters(chapters, chapterWithLines.chapter.id));
      });
    
    return result;
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
    return <div className="text-center py-8">Loading data...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
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
                // Appliquer des styles spécifiques aux titres de chapitres
                TD.style.fontWeight = 'bold';
                TD.style.fontSize = '24px';
                TD.style.backgroundColor = '#f3f4f6';
                TD.style.textAlign = 'left';  // Aligner le texte à gauche
                TD.style.paddingLeft = '1rem'; // Ajouter un peu de marge à gauche
                TD.style.verticalAlign = 'middle';
                
                // Si c'est la première cellule, s'assurer que le titre est bien affiché
                if (col === 0) {
                  TD.textContent = rowData.chapterTitle || '';
                } else {
                  // Masquer le contenu des autres cellules dans la ligne fusionnée
                  TD.textContent = '';
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