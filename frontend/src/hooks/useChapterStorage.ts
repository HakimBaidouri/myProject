import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';

/**
 * Hook personnalisé pour gérer la sauvegarde et le chargement des chapitres
 * @param initialChapters - Chapitres initiaux
 * @returns [chapters, setChapters, saveChapter, loadChapter] - Fonctions pour gérer les chapitres
 */
function useChapterStorage(initialChapters: Record<string, string> = {}) {
  // Utiliser le hook useLocalStorage pour stocker les chapitres
  const [chapters, setChapters] = useLocalStorage<Record<string, string>>('chapters', initialChapters);
  
  // État pour suivre la dernière sauvegarde
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Fonction pour sauvegarder un chapitre spécifique
  const saveChapter = useCallback((key: string, content: string) => {
    setChapters((prevChapters: Record<string, string>) => {
      const updatedChapters = { ...prevChapters, [key]: content };
      return updatedChapters;
    });
    setLastSaved(new Date());
  }, [setChapters]);
  
  // Fonction pour charger un chapitre spécifique
  const loadChapter = useCallback((key: string) => {
    return chapters[key] || '';
  }, [chapters]);
  
  // Fonction pour obtenir la liste des clés de chapitres
  const getChapterKeys = useCallback(() => {
    return Object.keys(chapters);
  }, [chapters]);
  
  // Fonction pour supprimer un chapitre
  const deleteChapter = useCallback((key: string) => {
    setChapters((prevChapters: Record<string, string>) => {
      const { [key]: _, ...rest } = prevChapters;
      return rest;
    });
  }, [setChapters]);
  
  // Fonction pour effacer tous les chapitres
  const clearAllChapters = useCallback(() => {
    setChapters({});
    setLastSaved(new Date());
  }, [setChapters]);
  
  return {
    chapters,
    setChapters,
    saveChapter,
    loadChapter,
    getChapterKeys,
    deleteChapter,
    clearAllChapters,
    lastSaved
  };
}

export default useChapterStorage; 