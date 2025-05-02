import { useState, useEffect, useCallback, useRef } from 'react';
import useLocalStorage from './useLocalStorage';

/**
 * Hook personnalisé pour gérer la sauvegarde et le chargement des chapitres
 * @param initialChapters - Chapitres initiaux
 * @param forceUpdateFromProps - Force la mise à jour des chapitres depuis les props
 * @returns [chapters, setChapters, saveChapter, loadChapter] - Fonctions pour gérer les chapitres
 */
function useChapterStorage(initialChapters: Record<string, string> = {}, forceUpdateFromProps: boolean = false) {
  // Utiliser le hook useLocalStorage pour stocker les chapitres
  const [chapters, setChapters] = useLocalStorage<Record<string, string>>('chapters', initialChapters);
  
  // État pour suivre la dernière sauvegarde
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Cache des dernières valeurs sauvegardées pour éviter les sauvegardes redondantes
  const lastSavedContent = useRef<Record<string, string>>({});
  
  // Ajouter un ref pour éviter les opérations recursives
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Mettre à jour les chapitres si on force la mise à jour depuis les props
  useEffect(() => {
    if (forceUpdateFromProps && Object.keys(initialChapters).length > 0) {
      console.log('📥 useChapterStorage: Mise à jour forcée depuis les props');
      console.log('   - Clés disponibles:', Object.keys(initialChapters));
      // Ne pas mettre à jour si les données sont identiques
      const isDifferent = Object.keys(initialChapters).some(key => 
        initialChapters[key] !== chapters[key]
      );
      
      if (isDifferent) {
        setChapters(initialChapters);
      }
    }
  }, [initialChapters, forceUpdateFromProps, setChapters, chapters]);
  
  // Fonction pour sauvegarder un chapitre spécifique
  const saveChapter = useCallback((key: string, content: string) => {
    // Vérifier si le contenu est différent de ce qui a déjà été sauvegardé
    if (lastSavedContent.current[key] === content) {
      // Contenu identique, ne pas sauvegarder
      return;
    }
    
    // Si une mise à jour est déjà prévue, l'annuler
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    // Prévenir les opérations simultanées
    if (isUpdatingRef.current) {
      // Planifier la mise à jour pour plus tard
      updateTimeoutRef.current = setTimeout(() => {
        saveChapter(key, content);
      }, 50);
      return;
    }
    
    console.log(`💾 useChapterStorage: Sauvegarde du chapitre ${key}`);
    console.log(`   - Taille du contenu: ${content.length} caractères`);
    
    // Marquer comme étant en cours de mise à jour
    isUpdatingRef.current = true;
    
    // Mettre à jour le cache de contenu
    lastSavedContent.current[key] = content;
    
    // Mettre à jour le localStorage
    setChapters(prevChapters => {
      const updatedChapters = { ...prevChapters, [key]: content };
      console.log(`   - Chapitres après mise à jour: ${Object.keys(updatedChapters).length} chapitres`);
      return updatedChapters;
    });
    
    // Mettre à jour l'horodatage de la dernière sauvegarde
    setLastSaved(new Date());
    
    // Libérer le verrou après un court délai
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, [setChapters]);
  
  // Fonction pour charger un chapitre spécifique
  const loadChapter = useCallback((key: string) => {
    // Si le contenu est dans notre cache, l'utiliser pour éviter des accès inutiles
    if (key in lastSavedContent.current) {
      return lastSavedContent.current[key];
    }
    
    const content = chapters[key] || '';
    
    // Mettre à jour notre cache
    if (content) {
      lastSavedContent.current[key] = content;
    }
    
    return content;
  }, [chapters]);
  
  // Fonction pour obtenir la liste des clés de chapitres
  const getChapterKeys = useCallback(() => {
    return Object.keys(chapters);
  }, [chapters]);
  
  // Fonction pour supprimer un chapitre
  const deleteChapter = useCallback((key: string) => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    // Supprimer du cache
    if (key in lastSavedContent.current) {
      const { [key]: _, ...rest } = lastSavedContent.current;
      lastSavedContent.current = rest;
    }
    
    setChapters(prevChapters => {
      const { [key]: _, ...rest } = prevChapters;
      return rest;
    });
    
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, [setChapters]);
  
  // Fonction pour effacer tous les chapitres
  const clearAllChapters = useCallback(() => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    // Vider le cache
    lastSavedContent.current = {};
    
    setChapters({});
    setLastSaved(new Date());
    
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
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