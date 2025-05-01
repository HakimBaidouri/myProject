import { useState, useEffect } from 'react';

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

export function useLocalStorageData() {
  console.log("⚡ useLocalStorageData: Hook initialisé");
  
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [tableDataMap, setTableDataMap] = useState<Record<string, any[][]>>({});
  const [detailDataMap, setDetailDataMap] = useState<Record<string, any[][]>>({});
  const [chapterTextMap, setChapterTextMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("⚡ useLocalStorageData: Effect de chargement lancé");
    
    const loadDataFromLocalStorage = () => {
      setLoading(true);
      console.log("⚡ useLocalStorageData: Tentative de chargement depuis localStorage");
      
      try {
        const savedTableData = localStorage.getItem(STORAGE_KEYS.TABLE_DATA);
        const savedDetailData = localStorage.getItem(STORAGE_KEYS.DETAIL_DATA);
        const savedChapterText = localStorage.getItem(STORAGE_KEYS.CHAPTER_TEXT);
        const savedTreeData = localStorage.getItem(STORAGE_KEYS.TREE_DATA);

        console.log("⚡ useLocalStorageData: Données trouvées dans localStorage:", {
          hasTableData: !!savedTableData,
          hasDetailData: !!savedDetailData,
          hasChapterText: !!savedChapterText,
          hasTreeData: !!savedTreeData
        });

        if (savedTableData) {
          setTableDataMap(JSON.parse(savedTableData));
        }

        if (savedDetailData) {
          setDetailDataMap(JSON.parse(savedDetailData));
        }

        if (savedChapterText) {
          setChapterTextMap(JSON.parse(savedChapterText));
        }

        if (savedTreeData) {
          setTreeData(JSON.parse(savedTreeData));
        }
      } catch (error) {
        console.error('⚠️ Erreur lors du chargement des données depuis localStorage:', error);
      } finally {
        console.log("⚡ useLocalStorageData: Chargement terminé, passage à loading=false");
        setLoading(false);
      }
    };

    loadDataFromLocalStorage();
  }, []);

  // Vérifie si les données ont bien été initialisées
  useEffect(() => {
    console.log("⚡ useLocalStorageData: État des données après chargement -", {
      loading,
      treeDataLength: treeData.length,
      tableDataSize: Object.keys(tableDataMap).length,
      detailDataSize: Object.keys(detailDataMap).length,
      chapterTextSize: Object.keys(chapterTextMap).length
    });
  }, [loading, treeData, tableDataMap, detailDataMap, chapterTextMap]);

  return {
    treeData,
    tableDataMap,
    detailDataMap,
    chapterTextMap,
    loading
  };
} 