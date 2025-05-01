import { useState, useEffect } from 'react';
import './SummarySpecifications.css';
import { useLocalStorageData, TreeNodeData } from '../../hooks/useLocalStorageData';

// Type simplifié compatible avec localStorage
interface Chapter {
  id: string;
  num: string;
  label: string;
  parentId: string | null;
  content: string;
}

export default function SummarySpecifications() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const { treeData, chapterTextMap, loading } = useLocalStorageData();
  
  console.log("🚀 SummarySpecifications: Payload reçu depuis localStorage:", {
    treeData,
    chapterTextMap
  });

  useEffect(() => {
    if (!loading && treeData.length > 0) {
      processLocalStorageData();
    }
  }, [loading, treeData, chapterTextMap]);

  const processLocalStorageData = () => {
    // Convertir les données du localStorage au format attendu par le composant
    const flatNodes = flattenTreeNodes(treeData);
    
    // Créer des objets chapitre avec leur contenu
    const extractedChapters: Chapter[] = flatNodes.map(node => ({
      id: node.key,
      num: node.num,
      label: node.label,
      parentId: node.parentId || null,
      content: chapterTextMap[node.key] || ''
    }));

    // Trier les chapitres
    const sortedChapters = sortChapters(extractedChapters);
    setChapters(sortedChapters);
  };

  // Fonction pour aplatir l'arborescence en liste
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

  // Fonction pour trier les chapitres hiérarchiquement
  const sortChapters = (chapters: Chapter[]): Chapter[] => {
    // Trier les chapitres par leur numéro
    chapters.sort((a, b) => {
      return a.num.localeCompare(b.num, undefined, { numeric: true });
    });
    
    return chapters;
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des données...</div>;
  }

  if (treeData.length === 0) {
    return <div className="text-center py-8 text-red-500">Aucune donnée disponible. Veuillez d'abord compléter les données dans la section Métré.</div>;
  }

  return (
    <div className="specifications-summary">
      <h2 className="text-xl font-semibold mb-4">Specifications Summary</h2>
      
      {chapters.length > 0 ? (
        <div className="specifications-container">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="chapter-container mb-8">
              {/* Utiliser h1 pour les chapitres parents, h2 pour les enfants */}
              {chapter.parentId === null ? (
                <h1 className="text-xl font-bold mb-4">
                  {chapter.num} - {chapter.label}
                </h1>
              ) : (
                <h2 className="text-lg font-semibold mb-3">
                  {chapter.num} - {chapter.label}
                </h2>
              )}
              
              {/* Afficher le contenu HTML du chapitre */}
              {chapter.content ? (
                <div 
                  className="chapter-content" 
                  dangerouslySetInnerHTML={{ __html: chapter.content }}
                />
              ) : (
                <p className="text-gray-500 italic">No content available</p>
              )}
              
              {/* Séparateur entre chapitres */}
              <hr className="my-6 border-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <p>No specifications available</p>
      )}
    </div>
  );
} 