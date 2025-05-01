import { useState, useEffect } from 'react';
import './SummarySpecifications.css';
import { useProjectLoader } from '@/hooks/useProjectLoader';
import { Chapter, ChapterWithLines } from '@/types/projectTypes';

export default function SummarySpecifications() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  // Temporairement, utiliser un ID de projet fixe
  // Dans une implémentation complète, cela viendrait d'un paramètre d'URL ou d'un état global
  const projectId = 1;
  const { data, loading, error } = useProjectLoader(projectId);

  useEffect(() => {
    if (data) {
      processChapters(data.chapters);
    }
  }, [data]);

  const processChapters = (chaptersData: ChapterWithLines[]) => {
    // Extraire les chapitres avec leur contenu HTML
    const extractedChapters: Chapter[] = chaptersData.map(chapterData => ({
      ...chapterData.chapter
    }));

    // Trier les chapitres
    const sortedChapters = sortChapters(extractedChapters);
    setChapters(sortedChapters);
  };

  // Fonction pour trier les chapitres hiérarchiquement
  const sortChapters = (chapters: Chapter[]): Chapter[] => {
    // Aplatir la hiérarchie des chapitres
    const flatChapters = flattenChapters(chapters);
    
    // Trier les chapitres par leur numéro
    flatChapters.sort((a, b) => {
      return a.num.localeCompare(b.num, undefined, { numeric: true });
    });
    
    return flatChapters;
  };

  // Fonction récursive pour aplatir la structure des chapitres
  const flattenChapters = (chapters: Chapter[], parentId: number | null = null): Chapter[] => {
    const result: Chapter[] = [];
    
    chapters
      .filter(ch => ch.parentId === parentId)
      .forEach(chapter => {
        result.push(chapter);
        result.push(...flattenChapters(chapters, chapter.id));
      });
    
    return result;
  };

  if (loading) {
    return <div className="text-center py-8">Loading data...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
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