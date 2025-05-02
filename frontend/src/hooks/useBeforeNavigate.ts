import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useEditorStore } from '@/store/use-editor-store';

/**
 * Hook personnalisé pour exécuter des actions avant la navigation
 * @param callback - Fonction à exécuter avant la navigation
 */
export function useBeforeNavigate(callback: () => void) {
  const location = useLocation();
  const { editor } = useEditorStore();
  const previousPath = useRef(location.pathname);
  const callbackRef = useRef(callback);
  
  // Mettre à jour la référence du callback quand il change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Utiliser un seul useEffect pour la navigation
  useEffect(() => {
    // Vérifier si le chemin a changé pour éviter les exécutions inutiles
    if (previousPath.current !== location.pathname) {
      if (editor) {
        // Exécuter le callback de sauvegarde
        callbackRef.current();
      }
      
      // Mettre à jour le chemin précédent
      previousPath.current = location.pathname;
    }
    
    // Pas besoin de définir une fonction de nettoyage qui appelle encore le callback
    // et setEditor, cela peut créer des boucles infinies
  }, [location.pathname, editor]);
}

export default useBeforeNavigate; 