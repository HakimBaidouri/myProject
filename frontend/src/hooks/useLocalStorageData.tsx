import { useState, useEffect, useCallback, useRef } from 'react';

// Clés de stockage utilisées entre Metre et Summary
export const STORAGE_KEYS = {
  TABLE_DATA: 'metreTableData',
  DETAIL_DATA: 'metreDetailData',
  CHAPTER_TEXT: 'metreChapterText',
  TREE_DATA: 'metreTreeData',
  SELECTED_KEY: 'metreSelectedKey',
  ACTIVE_TAB: 'metreActiveTab'
};

export interface TreeNodeData {
  key: string;
  num: string;
  label: string;
  children?: TreeNodeData[];
  parentId?: string | null;
}

// Référence globale pour la persistance des données entre les rendus
const globalDataRef = {
  treeData: [] as TreeNodeData[],
  tableDataMap: {} as Record<string, any[][]>,
  detailDataMap: {} as Record<string, any[][]>,
  chapterTextMap: {} as Record<string, string>,
  initialized: false
};

// Compteur d'instances pour le debugging
let instanceCounter = 0;

export function useLocalStorageData() {
  // Identifiant unique pour cette instance du hook
  const instanceIdRef = useRef(++instanceCounter);
  
  console.log(`⚡ useLocalStorageData: Hook initialisé [instance #${instanceIdRef.current}]`);
  
  // Vérifier si c'est la première initialisation ou une réutilisation
  const isInitializedRef = useRef(globalDataRef.initialized);
  
  const [treeData, setTreeData] = useState<TreeNodeData[]>(globalDataRef.treeData);
  const [tableDataMap, setTableDataMap] = useState<Record<string, any[][]>>(globalDataRef.tableDataMap);
  const [detailDataMap, setDetailDataMap] = useState<Record<string, any[][]>>(globalDataRef.detailDataMap);
  const [chapterTextMap, setChapterTextMap] = useState<Record<string, string>>(globalDataRef.chapterTextMap);
  const [loading, setLoading] = useState(!isInitializedRef.current);

  // Fonction pour sauvegarder les données dans localStorage
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Sauvegarde des données pour ${key}`);
    try {
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
    } catch (error) {
      console.error(`⚠️ Erreur lors de la sauvegarde des données pour ${key}:`, error);
    }
  }, [instanceIdRef]);

  // Fonction pour mettre à jour les numéros des enfants lorsqu'un parent change
  const updateChildNums = useCallback((parentNum: string, children: TreeNodeData[]): TreeNodeData[] => {
    return children.map((child, index) => {
      const newNum = `${parentNum}.${index + 1}`;
      return {
        ...child,
        num: newNum,
        children: child.children ? updateChildNums(newNum, child.children) : undefined
      };
    });
  }, []);

  // Fonction pour mettre à jour un nœud spécifique dans l'arborescence
  const updateNode = useCallback((nodeId: string, newNum?: string, newLabel?: string) => {
    // Fonction récursive pour mettre à jour le nœud
    const updateNodeInTree = (nodes: TreeNodeData[]): TreeNodeData[] => {
      return nodes.map((node) => {
        if (node.key === nodeId) {
          // Si le numéro change, mettre à jour les enfants aussi
          const needUpdateChildren = newNum !== undefined && newNum !== node.num;
          const updatedNode = {
            ...node,
            num: newNum !== undefined ? newNum : node.num,
            label: newLabel !== undefined ? newLabel : node.label,
          };
          
          if (needUpdateChildren && updatedNode.children) {
            updatedNode.children = updateChildNums(updatedNode.num, [...updatedNode.children]);
          }
          
          return updatedNode;
        }
        
        // Rechercher dans les enfants
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updateNodeInTree(node.children)
          };
        }
        
        return node;
      });
    };
    
    setTreeData(prevTreeData => {
      const updatedTreeData = updateNodeInTree(prevTreeData);
      
      // Mettre à jour la référence globale
      globalDataRef.treeData = updatedTreeData;
      
      // Sauvegarder dans localStorage
      saveToLocalStorage(STORAGE_KEYS.TREE_DATA, updatedTreeData);
      
      console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Nœud ${nodeId} mis à jour et sauvegardé`);
      return updatedTreeData;
    });
  }, [saveToLocalStorage, updateChildNums, instanceIdRef]);

  // Méthodes pour mettre à jour les données
  const updateTreeData = useCallback((newTreeData: TreeNodeData[]) => {
    // Mettre à jour la référence globale
    globalDataRef.treeData = newTreeData;
    
    setTreeData(newTreeData);
    saveToLocalStorage(STORAGE_KEYS.TREE_DATA, newTreeData);
    console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Arborescence mise à jour et sauvegardée`);
  }, [saveToLocalStorage, instanceIdRef]);

  const updateTableDataMap = useCallback((newTableDataMap: Record<string, any[][]>) => {
    // Mettre à jour la référence globale
    globalDataRef.tableDataMap = newTableDataMap;
    
    setTableDataMap(newTableDataMap);
    saveToLocalStorage(STORAGE_KEYS.TABLE_DATA, newTableDataMap);
    console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Données des tableaux mises à jour et sauvegardées`);
  }, [saveToLocalStorage, instanceIdRef]);

  const updateDetailDataMap = useCallback((newDetailDataMap: Record<string, any[][]>) => {
    // Mettre à jour la référence globale
    globalDataRef.detailDataMap = newDetailDataMap;
    
    setDetailDataMap(newDetailDataMap);
    saveToLocalStorage(STORAGE_KEYS.DETAIL_DATA, newDetailDataMap);
    console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Données de détails mises à jour et sauvegardées`);
  }, [saveToLocalStorage, instanceIdRef]);

  const updateChapterTextMap = useCallback((newChapterTextMap: Record<string, string>, options?: { silent?: boolean }) => {
    // Mettre à jour la référence globale
    globalDataRef.chapterTextMap = newChapterTextMap;
    
    setChapterTextMap(newChapterTextMap);
    saveToLocalStorage(STORAGE_KEYS.CHAPTER_TEXT, newChapterTextMap);
    
    if (!options?.silent) {
      console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Textes des chapitres mis à jour et sauvegardés`);
    }
  }, [saveToLocalStorage, instanceIdRef]);

  // Mettre à jour un chapitre spécifique
  const updateChapterText = useCallback((chapterId: string, content: string) => {
    setChapterTextMap(prev => {
      const updated = { ...prev, [chapterId]: content };
      
      // Mettre à jour la référence globale
      globalDataRef.chapterTextMap = updated;
      
      saveToLocalStorage(STORAGE_KEYS.CHAPTER_TEXT, updated);
      console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Contenu du chapitre ${chapterId} mis à jour et sauvegardé`);
      return updated;
    });
  }, [saveToLocalStorage, instanceIdRef]);

  // Effet pour charger les données au montage - utilise une référence pour éviter les chargements multiples
  useEffect(() => {
    // Si les données sont déjà initialisées globalement, ne pas recharger
    if (isInitializedRef.current) {
      console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Données déjà initialisées, pas de rechargement`);
      setLoading(false);
      return;
    }
    
    console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Effect de chargement lancé`);
    
    const loadDataFromLocalStorage = () => {
      setLoading(true);
      console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Tentative de chargement depuis localStorage`);
      
      try {
        const savedTableData = localStorage.getItem(STORAGE_KEYS.TABLE_DATA);
        const savedDetailData = localStorage.getItem(STORAGE_KEYS.DETAIL_DATA);
        const savedChapterText = localStorage.getItem(STORAGE_KEYS.CHAPTER_TEXT);
        const savedTreeData = localStorage.getItem(STORAGE_KEYS.TREE_DATA);

        console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Données trouvées dans localStorage:`, {
          hasTableData: !!savedTableData,
          hasDetailData: !!savedDetailData,
          hasChapterText: !!savedChapterText,
          hasTreeData: !!savedTreeData
        });

        if (savedTableData) {
          const parsedData = JSON.parse(savedTableData);
          setTableDataMap(parsedData);
          globalDataRef.tableDataMap = parsedData;
        }

        if (savedDetailData) {
          const parsedData = JSON.parse(savedDetailData);
          setDetailDataMap(parsedData);
          globalDataRef.detailDataMap = parsedData;
        }

        if (savedChapterText) {
          const parsedData = JSON.parse(savedChapterText);
          setChapterTextMap(parsedData);
          globalDataRef.chapterTextMap = parsedData;
        }

        if (savedTreeData) {
          const parsedData = JSON.parse(savedTreeData);
          setTreeData(parsedData);
          globalDataRef.treeData = parsedData;
        }
        
        // Marquer comme initialisé globalement
        globalDataRef.initialized = true;
        isInitializedRef.current = true;
      } catch (error) {
        console.error(`⚠️ useLocalStorageData [#${instanceIdRef.current}]: Erreur lors du chargement des données depuis localStorage:`, error);
      } finally {
        console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Chargement terminé, passage à loading=false`);
        setLoading(false);
      }
    };

    loadDataFromLocalStorage();
    
    // Ajouter un écouteur d'événements pour détecter les changements de localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && Object.values(STORAGE_KEYS).includes(event.key)) {
        console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Changement détecté dans localStorage pour ${event.key}`);
        loadDataFromLocalStorage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [instanceIdRef]); // Dépendance vide pour n'exécuter qu'au montage

  // Vérifie si les données ont bien été initialisées - n'exécuter que si loading change
  useEffect(() => {
    if (!loading) {
      console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: État des données après chargement -`, {
        loading,
        treeDataLength: treeData.length,
        tableDataSize: Object.keys(tableDataMap).length,
        detailDataSize: Object.keys(detailDataMap).length,
        chapterTextSize: Object.keys(chapterTextMap).length
      });
    }
  }, [loading, instanceIdRef]);

  return {
    // Données
    treeData,
    tableDataMap,
    detailDataMap,
    chapterTextMap,
    loading,
    
    // Méthodes de mise à jour
    updateTreeData,
    updateTableDataMap,
    updateDetailDataMap,
    updateChapterTextMap,
    updateChapterText,
    updateNode
  };
} 