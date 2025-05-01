import { useState, useEffect, useCallback } from 'react';
import React from 'react';

// Créer un event bus global pour communiquer entre les composants dans la même fenêtre
const UpdateEventBus = {
  listeners: new Set<() => void>(),
  
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  },
  
  publish() {
    this.listeners.forEach(callback => callback());
  }
};

// Clés utilisées pour le stockage localStorage
export const STORAGE_KEYS = {
  PROJECT_DATA: 'projectData',
  PROJECT_MODIFICATIONS: 'projectModifications',
  LAST_ROUTE: 'lastRoute'
};

/**
 * Hook personnalisé pour détecter les mises à jour dans les données du métré
 * et forcer la mise à jour des composants récapitulatifs
 */
export function useMetreUpdates() {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const lastUpdateRef = React.useRef<number>(Date.now());
  
  // Souscrire à l'event bus
  useEffect(() => {
    const unsubscribe = UpdateEventBus.subscribe(() => {
      const now = Date.now();
      // Vérifier qu'on ne met pas à jour trop souvent (moins de 200ms)
      if (now - lastUpdateRef.current > 200) {
        lastUpdateRef.current = now;
        setLastUpdate(now);
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Surveiller les modifications dans le localStorage (pour les mises à jour entre onglets)
  useEffect(() => {
    // Fonction à exécuter lorsque le stockage local est modifié
    const handleStorageChange = (event: StorageEvent) => {
      // Vérifier si la modification concerne des données pertinentes pour le métré
      if (event.key && (
        event.key.includes('chapter') || 
        event.key.includes('projet') || 
        event.key.includes('metre') ||
        event.key.includes('tableLine') ||
        event.key === STORAGE_KEYS.PROJECT_MODIFICATIONS ||
        event.key === STORAGE_KEYS.PROJECT_DATA
      )) {
        const now = Date.now();
        // Vérifier qu'on ne met pas à jour trop souvent (moins de 200ms)
        if (now - lastUpdateRef.current > 200) {
          lastUpdateRef.current = now;
          // Forcer une mise à jour en changeant lastUpdate
          setLastUpdate(now);
        }
      }
    };

    // Ajouter un écouteur d'événements pour les modifications du stockage local
    window.addEventListener('storage', handleStorageChange);
    
    // Nettoyer en retirant l'écouteur d'événements
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fonction pour forcer manuellement une mise à jour
  const forceUpdate = useCallback(() => {
    const now = Date.now();
    lastUpdateRef.current = now;
    setLastUpdate(now);
  }, []);

  return { lastUpdate, forceUpdate };
}

/**
 * Hook pour détecter quand le composant devient visible (quand l'utilisateur revient sur la page)
 */
export function usePageVisibility(callback: () => void) {
  // Utiliser une ref pour suivre le dernier appel
  const lastCallRef = React.useRef<number>(0);
  
  useEffect(() => {
    // Fonction appelée quand la visibilité de la page change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Éviter les appels trop fréquents (moins de 500ms)
        if (now - lastCallRef.current > 500) {
          lastCallRef.current = now;
          callback();
        }
      }
    };
    
    // Ajouter un écouteur pour les changements de visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Appeler le callback au montage du composant, mais seulement une fois
    if (lastCallRef.current === 0) {
      lastCallRef.current = Date.now();
      callback();
    }
    
    // Nettoyer l'écouteur
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callback]);
}

/**
 * Hook utilitaire pour écouter les changements dans le localStorage
 */
export function useLocalStorageChangeListener(key: string, callback: () => void) {
  // Référence pour suivre le dernier appel
  const lastCallRef = React.useRef<number>(0);
  
  useEffect(() => {
    // Fonction à exécuter lorsque le stockage local est modifié
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        const now = Date.now();
        // Éviter les appels trop fréquents (moins de 300ms)
        if (now - lastCallRef.current > 300) {
          lastCallRef.current = now;
          callback();
        }
      }
    };

    // Ajouter un écouteur d'événements pour les modifications du stockage local
    window.addEventListener('storage', handleStorageChange);
    
    // Nettoyer en retirant l'écouteur d'événements
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, callback]);
}

/**
 * Hook pour sauvegarder et restaurer les données du projet depuis localStorage
 */
export function useProjectDataStorage() {
  // Référence pour suivre le dernier hachage de données sauvegardées
  const lastSavedHashRef = React.useRef<string>('');
  
  // Fonction pour générer un hachage simple des données
  const getSimpleHash = useCallback((data: any): string => {
    try {
      // Utiliser plus d'informations pour le hachage
      const chaptersInfo = data?.chapters?.map((ch: any) => ({
        id: ch.chapter?.id,
        updated: ch.chapter?.updated || Date.now(),
        linesCount: ch.lines?.length || 0
      })) || [];
      
      const relevantData = {
        id: data?.project?.id,
        timestamp: data?.timestamp || Date.now(),
        chaptersChanged: chaptersInfo,
        dataUpdate: Date.now() // Forcer la mise à jour lors des modifications
      };
      return JSON.stringify(relevantData);
    } catch (e) {
      return Date.now().toString();
    }
  }, []);
  
  // Sauvegarder les données complètes du projet dans localStorage
  const saveProjectData = useCallback((projectData: any) => {
    if (!projectData) return;
    
    try {
      // Générer un hachage des données
      const dataHash = getSimpleHash(projectData);
      
      // Vérifier si les données ont changé
      if (dataHash === lastSavedHashRef.current) {
        console.log('Données inchangées, sauvegarde ignorée');
        return;
      }
      
      // Assurer des valeurs numériques correctes avant sauvegarde
      const processedData = ensureNumericValues(projectData);
      
      // Ajouter un timestamp à jour
      const dataWithTimestamp = {
        ...processedData,
        lastUpdateTimestamp: Date.now()
      };
      
      // Sauvegarder les données complètes
      window.localStorage.setItem(
        STORAGE_KEYS.PROJECT_DATA, 
        JSON.stringify(dataWithTimestamp)
      );
      
      // Mettre à jour le hachage sauvegardé
      lastSavedHashRef.current = dataHash;
      
      // Mettre à jour le timestamp
      signalProjectModification('DataStorage');
      
      console.log('Données du projet sauvegardées dans localStorage', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données du projet:', error);
    }
  }, [getSimpleHash]);
  
  // Récupérer les données du projet depuis localStorage
  const getProjectData = useCallback(() => {
    try {
      const storedData = window.localStorage.getItem(STORAGE_KEYS.PROJECT_DATA);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Assurer des valeurs numériques correctes après lecture
        const processedData = ensureNumericValues(parsedData);
        
        console.log('Données récupérées depuis localStorage, timestamp:', 
                   new Date(processedData.lastUpdateTimestamp || Date.now()).toLocaleTimeString());
        return processedData;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données du projet:', error);
    }
    return null;
  }, []);
  
  return { saveProjectData, getProjectData };
}

/**
 * Fonction utilitaire pour signaler une modification du projet
 */
export function signalProjectModification(source: string) {
  // Vérifier si la dernière modification est récente (moins de 300ms)
  const lastMod = localStorage.getItem(STORAGE_KEYS.PROJECT_MODIFICATIONS);
  if (lastMod) {
    try {
      const parsedMod = JSON.parse(lastMod);
      const now = Date.now();
      // Si la dernière modification est trop récente, ignorer celle-ci pour éviter les boucles
      if (now - parsedMod.timestamp < 300 && parsedMod.source === source) {
        console.log('Modification ignorée (trop récente)', source);
        return;
      }
    } catch (e) {
      // En cas d'erreur, continuer normalement
    }
  }

  // Stocker un timestamp pour indiquer quand la dernière modification a eu lieu
  window.localStorage.setItem(STORAGE_KEYS.PROJECT_MODIFICATIONS, JSON.stringify({
    timestamp: Date.now(),
    source: source
  }));
  
  // Publier via l'event bus (pour les composants dans la même fenêtre)
  UpdateEventBus.publish();
  
  // Déclencher un événement de stockage pour que les autres onglets soient informés
  // Cette partie ne fonctionnera que pour les autres onglets, pas celui courant
  try {
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.PROJECT_MODIFICATIONS,
      newValue: localStorage.getItem(STORAGE_KEYS.PROJECT_MODIFICATIONS)
    }));
  } catch (error) {
    console.error('Erreur lors de la diffusion de l\'événement de stockage:', error);
  }
}

/**
 * Hook pour partager l'état des mises à jour du projet entre composants
 */
export function useProjectModifications() {
  // Récupérer la dernière modification
  const getLastModification = useCallback((): { timestamp: number, source: string } => {
    const stored = window.localStorage.getItem(STORAGE_KEYS.PROJECT_MODIFICATIONS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Erreur lors de la lecture des modifications:', error);
      }
    }
    return { timestamp: 0, source: '' };
  }, []);
  
  return { signalProjectModification, getLastModification };
}

/**
 * Hook pour suivre les changements de route et sauvegarder la dernière route
 */
export function useRouteTracking() {
  // Enregistrer la route actuelle
  const setCurrentRoute = useCallback((route: string) => {
    window.localStorage.setItem(STORAGE_KEYS.LAST_ROUTE, route);
    console.log('Route actuelle enregistrée:', route);
  }, []);
  
  // Obtenir la dernière route enregistrée
  const getLastRoute = useCallback(() => {
    return window.localStorage.getItem(STORAGE_KEYS.LAST_ROUTE) || '';
  }, []);
  
  return { setCurrentRoute, getLastRoute };
}

/**
 * Fonction utilitaire pour forcer un rechargement complet des données
 * Cette fonction envoie un signal que tous les composants doivent recharger
 * leurs données depuis le localStorage immédiatement
 */
export function forceGlobalDataRefresh(reason: string = 'manual') {
  console.log(`Forçage du rafraîchissement global des données (raison: ${reason})`);
  
  // Vérifier si on a déjà envoyé un signal récemment pour éviter les boucles
  const lastRefresh = localStorage.getItem('globalDataRefresh');
  if (lastRefresh) {
    try {
      const parsed = JSON.parse(lastRefresh);
      const now = Date.now();
      
      // Si un rafraîchissement a été émis il y a moins de 2 secondes, ignorer
      if (now - parsed.timestamp < 2000 && !reason.includes('URGENCE')) {
        console.log(`Rafraîchissement global ignoré (trop récent): ${reason}, dernier=${parsed.reason}`);
        return;
      }
    } catch (e) {
      // En cas d'erreur dans la lecture, continuer normalement
    }
  }
  
  // 1. Créer un signal fort avec horodatage unique
  const refreshSignal = {
    timestamp: Date.now(),
    reason: reason,
    isGlobalRefresh: true,
    force: true // Marquer comme un rafraîchissement forcé
  };
  
  // 2. Enregistrer le signal dans le localStorage
  localStorage.setItem('globalDataRefresh', JSON.stringify(refreshSignal));
  
  // 3. Envoyer un signal via l'event bus pour les composants dans la même fenêtre
  UpdateEventBus.publish();
  
  // 4. Essayer de déclencher un événement de stockage pour les autres onglets
  try {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'globalDataRefresh',
      newValue: JSON.stringify(refreshSignal)
    }));
  } catch (error) {
    console.error('Erreur lors de la diffusion de l\'événement de stockage:', error);
  }
  
  // 5. Signal via le système de modifications standard (mais un seul cette fois)
  signalProjectModification('ForcedGlobalRefresh-' + reason);
  
  // 6. Signal différé uniquement pour les événements importants
  if (reason.includes('URGENCE') || reason.includes('Metre') || reason.includes('Update')) {
    setTimeout(() => {
      signalProjectModification('ForcedGlobalRefreshDelayed-' + reason);
    }, 500);
  }
}

/**
 * Fonction utilitaire pour garantir que toutes les valeurs numériques
 * dans les données du projet sont correctement typées comme nombres
 */
export function ensureNumericValues(projectData: any) {
  if (!projectData || !projectData.chapters || !Array.isArray(projectData.chapters)) {
    console.warn("Structure de données invalide pour la conversion des types");
    return projectData;
  }
  
  try {
    // Parcourir tous les chapitres
    projectData.chapters.forEach((chapter: any) => {
      if (chapter.lines && Array.isArray(chapter.lines)) {
        chapter.lines.forEach((line: any) => {
          if (line.mainTableLine) {
            const mtl = line.mainTableLine;
            
            // Convertir les valeurs numériques explicitement
            if (mtl.quantity !== undefined) {
              mtl.quantity = Number(mtl.quantity);
            }
            
            if (mtl.unitPrice !== undefined) {
              mtl.unitPrice = Number(mtl.unitPrice);
            }
            
            // Recalculer le prix total pour être sûr
            mtl.totalPrice = mtl.quantity * mtl.unitPrice;
            
            // Log de débogage pour les valeurs critiques
            if (mtl.title === "Cloison intérieure") {
              console.log(`CONVERSION - Cloison intérieure: PU=${mtl.unitPrice} (${typeof mtl.unitPrice}), Qté=${mtl.quantity} (${typeof mtl.quantity}), Total=${mtl.totalPrice}`);
            }
          }
        });
      }
    });
    
    return projectData;
  } catch (error) {
    console.error("Erreur lors de la conversion des types numériques:", error);
    return projectData;
  }
} 