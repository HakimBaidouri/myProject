import { useState, useEffect, useCallback, useRef } from 'react';

// Clés de stockage utilisées entre Metre et Summary
export const STORAGE_KEYS = {
  TABLE_DATA: 'metreTableData',
  DETAIL_DATA: 'metreDetailData',
  CHAPTER_TEXT: 'metreChapterText',
  TREE_DATA: 'metreTreeData',
  SELECTED_KEY: 'metreSelectedKey',
  ACTIVE_TAB: 'metreActiveTab',
  PROJECT_VERSIONS: 'metreProjectVersions',
  CURRENT_VERSION: 'metreCurrentVersion'
};

// Version par défaut
export const DEFAULT_VERSION_ID = 'version-default';

// Fonction pour obtenir les clés de stockage spécifiques à une version
export const getVersionStorageKeys = (versionId: string) => ({
  TABLE_DATA: `${STORAGE_KEYS.TABLE_DATA}_${versionId}`,
  DETAIL_DATA: `${STORAGE_KEYS.DETAIL_DATA}_${versionId}`,
  CHAPTER_TEXT: `${STORAGE_KEYS.CHAPTER_TEXT}_${versionId}`,
  TREE_DATA: `${STORAGE_KEYS.TREE_DATA}_${versionId}`,
  SELECTED_KEY: `${STORAGE_KEYS.SELECTED_KEY}_${versionId}`,
  ACTIVE_TAB: `${STORAGE_KEYS.ACTIVE_TAB}_${versionId}`
});

export interface TreeNodeData {
  key: string;
  num: string;
  label: string;
  children?: TreeNodeData[];
  parentId?: string | null;
}

export interface ProjectVersion {
  id: string;
  name: string;
  createdAt: string;
  treeData: TreeNodeData[];
  tableDataMap: Record<string, any[][]>;
  detailDataMap: Record<string, any[][]>;
  chapterTextMap: Record<string, string>;
}

// Référence globale pour la persistance des données entre les rendus
const globalDataRef = {
  currentVersion: null as string | null,
  projectVersions: [] as ProjectVersion[],
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
  
  const [currentVersion, setCurrentVersion] = useState<string | null>(globalDataRef.currentVersion);
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>(globalDataRef.projectVersions);
  const [treeData, setTreeData] = useState<TreeNodeData[]>(globalDataRef.treeData);
  const [tableDataMap, setTableDataMap] = useState<Record<string, any[][]>>(globalDataRef.tableDataMap);
  const [detailDataMap, setDetailDataMap] = useState<Record<string, any[][]>>(globalDataRef.detailDataMap);
  const [chapterTextMap, setChapterTextMap] = useState<Record<string, string>>(globalDataRef.chapterTextMap);
  const [loading, setLoading] = useState(!isInitializedRef.current);

  // Fonction pour obtenir les clés de stockage actuelles basées sur la version
  const getCurrentStorageKeys = useCallback(() => {
    if (currentVersion) {
      return getVersionStorageKeys(currentVersion);
    } else {
      // Charger la version courante
      const savedCurrentVersion = localStorage.getItem(STORAGE_KEYS.CURRENT_VERSION);
      if (savedCurrentVersion) {
        return getVersionStorageKeys(savedCurrentVersion);
      }
    }
    // Fallback aux clés par défaut si aucune version n'est définie
    return STORAGE_KEYS;
  }, [currentVersion]);

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
        // Charger d'abord les informations de version
        const savedProjectVersions = localStorage.getItem(STORAGE_KEYS.PROJECT_VERSIONS);
        const savedCurrentVersion = localStorage.getItem(STORAGE_KEYS.CURRENT_VERSION);
        
        // Déterminer quelle version utiliser
        let versionId = DEFAULT_VERSION_ID;
        let versions: ProjectVersion[] = [];
        
        if (savedProjectVersions) {
          try {
            versions = JSON.parse(savedProjectVersions);
            if (savedCurrentVersion && versions.some(v => v.id === savedCurrentVersion)) {
              versionId = savedCurrentVersion;
            } else if (versions.length > 0) {
              versionId = versions[versions.length - 1].id;
            }
          } catch (error) {
            console.error("Erreur lors du parsing des versions:", error);
          }
        }
        
        // Mettre à jour les versions dans l'état global
        globalDataRef.projectVersions = versions;
        globalDataRef.currentVersion = versionId;
        setProjectVersions(versions);
        setCurrentVersion(versionId);
        
        console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Version actuelle: ${versionId}`);
        
        // Obtenir les clés de stockage pour cette version
        const storageKeys = getVersionStorageKeys(versionId);
        
        // Charger les données avec les clés de la version
        const savedTableData = localStorage.getItem(storageKeys.TABLE_DATA);
        const savedDetailData = localStorage.getItem(storageKeys.DETAIL_DATA);
        const savedChapterText = localStorage.getItem(storageKeys.CHAPTER_TEXT);
        const savedTreeData = localStorage.getItem(storageKeys.TREE_DATA);

        console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Données trouvées dans localStorage pour version ${versionId}:`, {
          hasTableData: !!savedTableData,
          hasDetailData: !!savedDetailData,
          hasChapterText: !!savedChapterText,
          hasTreeData: !!savedTreeData
        });

        if (savedTableData) {
          const parsedData = JSON.parse(savedTableData);
          globalDataRef.tableDataMap = parsedData;
          setTableDataMap(parsedData);
        }

        if (savedDetailData) {
          const parsedData = JSON.parse(savedDetailData);
          globalDataRef.detailDataMap = parsedData;
          setDetailDataMap(parsedData);
        }

        if (savedChapterText) {
          const parsedData = JSON.parse(savedChapterText);
          globalDataRef.chapterTextMap = parsedData;
          setChapterTextMap(parsedData);
        }

        if (savedTreeData) {
          const parsedData = JSON.parse(savedTreeData);
          globalDataRef.treeData = parsedData;
          setTreeData(parsedData);
        }

        globalDataRef.initialized = true;
        isInitializedRef.current = true;
        setLoading(false);

        console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Chargement des données terminé`);
      } catch (error) {
        console.error(`⚠️ Erreur lors du chargement des données:`, error);
        setLoading(false);
      }
    };
    
    loadDataFromLocalStorage();
  }, [instanceIdRef]);

  // Effet pour écouter les changements de stockage local (window.addEventListener)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Si la clé de version courante a changé, il faut tout rafraîchir
      if (event.key === STORAGE_KEYS.CURRENT_VERSION) {
        console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Version courante changée, rechargement des données`);
        
        const newVersionId = event.newValue;
        if (newVersionId && newVersionId !== currentVersion) {
          // Mise à jour de l'état global
          globalDataRef.currentVersion = newVersionId;
          setCurrentVersion(newVersionId);
          
          // Charger les données de cette version
          const versionKeys = getVersionStorageKeys(newVersionId);
          
          try {
            // Charger les données avec les clés de la nouvelle version
            const savedTableData = localStorage.getItem(versionKeys.TABLE_DATA);
            const savedDetailData = localStorage.getItem(versionKeys.DETAIL_DATA);
            const savedChapterText = localStorage.getItem(versionKeys.CHAPTER_TEXT);
            const savedTreeData = localStorage.getItem(versionKeys.TREE_DATA);
            
            if (savedTableData) {
              const parsedData = JSON.parse(savedTableData);
              globalDataRef.tableDataMap = parsedData;
              setTableDataMap(parsedData);
            }
            
            if (savedDetailData) {
              const parsedData = JSON.parse(savedDetailData);
              globalDataRef.detailDataMap = parsedData;
              setDetailDataMap(parsedData);
            }
            
            if (savedChapterText) {
              const parsedData = JSON.parse(savedChapterText);
              globalDataRef.chapterTextMap = parsedData;
              setChapterTextMap(parsedData);
            }
            
            if (savedTreeData) {
              const parsedData = JSON.parse(savedTreeData);
              globalDataRef.treeData = parsedData;
              setTreeData(parsedData);
            }
          } catch (error) {
            console.error(`⚠️ Erreur lors du chargement des données de la nouvelle version:`, error);
          }
        }
      } else if (event.key === STORAGE_KEYS.PROJECT_VERSIONS) {
        console.log(`⚡ useLocalStorageData [#${instanceIdRef.current}]: Liste des versions mise à jour`);
        
        try {
          if (event.newValue) {
            const parsedVersions = JSON.parse(event.newValue);
            globalDataRef.projectVersions = parsedVersions;
            setProjectVersions(parsedVersions);
          }
        } catch (error) {
          console.error(`⚠️ Erreur lors de la mise à jour des versions:`, error);
        }
      } 
      // ... les autres cas pour les autres clés ...
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [instanceIdRef, currentVersion]);

  return {
    treeData,
    tableDataMap,
    detailDataMap,
    chapterTextMap,
    loading,
    projectVersions,
    currentVersion,
    updateNode,
    updateTreeData,
    updateTableDataMap,
    updateDetailDataMap,
    updateChapterText,
    updateChapterTextMap
  };
} 