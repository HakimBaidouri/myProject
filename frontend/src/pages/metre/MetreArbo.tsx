import { useEffect, useState, useRef, useCallback } from 'react';
import Tree from 'rc-tree';
import Handsontable from 'handsontable';
import { NumericCellType } from 'handsontable/cellTypes';
import { v4 as uuidv4 } from 'uuid';
import 'handsontable/dist/handsontable.full.min.css';
import 'rc-tree/assets/index.css';
import './Metre.css';
import MetreTable from './MetreTable';
import { useProjectLoader } from '../../hooks/useProjectLoader';
import ChapterEditor from '../textEditor/ChapterEditor';
import { HotTable } from '@handsontable/react';
import { HotTableProps } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

Handsontable.cellTypes.registerCellType(NumericCellType);

// Clés pour le stockage localStorage
const STORAGE_KEYS = {
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
const DEFAULT_VERSION_ID = 'version-default';

// Fonction pour obtenir les clés de stockage spécifiques à une version
const getVersionStorageKeys = (versionId: string) => ({
  TABLE_DATA: `${STORAGE_KEYS.TABLE_DATA}_${versionId}`,
  DETAIL_DATA: `${STORAGE_KEYS.DETAIL_DATA}_${versionId}`,
  CHAPTER_TEXT: `${STORAGE_KEYS.CHAPTER_TEXT}_${versionId}`,
  TREE_DATA: `${STORAGE_KEYS.TREE_DATA}_${versionId}`,
  SELECTED_KEY: `${STORAGE_KEYS.SELECTED_KEY}_${versionId}`,
  ACTIVE_TAB: `${STORAGE_KEYS.ACTIVE_TAB}_${versionId}`
});

// Type pour les versions du projet
interface ProjectVersion {
  id: string;
  name: string;
  createdAt: string;
  treeData: TreeNodeData[];
  tableDataMap: Record<string, any[][]>;
  detailDataMap: Record<string, any[][]>;
  chapterTextMap: Record<string, string>;
}

interface TreeNodeData {
  key: string;
  num: string;
  label: string;
  children?: TreeNodeData[];
  parentId?: string | null;
}

export default function MetreArbo() {
  
  const { data, loading } = useProjectLoader(1); // 👈 on teste avec projet ID 1
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [tableDataMap, setTableDataMap] = useState<Record<string, any[][]>>({});
  const [detailDataMap, setDetailDataMap] = useState<Record<string, any[][]>>({});
  const [activeTab, setActiveTab] = useState<'table' | 'doc'>('doc');
  const [chapterTextMap, setChapterTextMap] = useState<Record<string, string>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [clickCountMap, setClickCountMap] = useState<Record<string, number>>({});
  
  // Nouveaux états pour la gestion des versions
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>(DEFAULT_VERSION_ID);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialisation & chargement des versions depuis localStorage
  useEffect(() => {
    console.log("INITIALISATION - Chargement des versions");
    
    // Vérifier d'abord si des versions existent déjà
    const savedVersionsStr = localStorage.getItem(STORAGE_KEYS.PROJECT_VERSIONS);
    const savedCurrentVersion = localStorage.getItem(STORAGE_KEYS.CURRENT_VERSION);
    
    let versions: ProjectVersion[] = [];
    let versionId: string = DEFAULT_VERSION_ID;
    
    // Si des versions existent, les charger
    if (savedVersionsStr) {
      try {
        const parsedVersions: ProjectVersion[] = JSON.parse(savedVersionsStr);
        if (Array.isArray(parsedVersions) && parsedVersions.length > 0) {
          versions = parsedVersions;
          console.log(`${versions.length} versions trouvées dans localStorage`);
          
          // Si une version courante est définie et existe dans nos versions, l'utiliser
          if (savedCurrentVersion) {
            const versionExists = versions.some(v => v.id === savedCurrentVersion);
            if (versionExists) {
              versionId = savedCurrentVersion;
              console.log(`Version courante sélectionnée: ${versionId}`);
            }
          } else {
            // Sinon, utiliser la dernière version
            versionId = versions[versions.length - 1].id;
            console.log(`Aucune version courante définie, utilisation de la dernière: ${versionId}`);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des versions:", error);
      }
    }
    
    // Si aucune version n'existe, créer la version par défaut
    if (versions.length === 0) {
      console.log("Aucune version trouvée, création de la version par défaut");
      const defaultVersion: ProjectVersion = {
        id: DEFAULT_VERSION_ID,
        name: "Version initiale",
        createdAt: new Date().toISOString(),
        treeData: [],
        tableDataMap: {},
        detailDataMap: {},
        chapterTextMap: {}
      };
      
      versions = [defaultVersion];
      versionId = DEFAULT_VERSION_ID;
      
      // Sauvegarder la version par défaut
      localStorage.setItem(STORAGE_KEYS.PROJECT_VERSIONS, JSON.stringify(versions));
      localStorage.setItem(STORAGE_KEYS.CURRENT_VERSION, versionId);
    }
    
    // Mettre à jour les états avec les versions et la version courante
    setProjectVersions(versions);
    setCurrentVersion(versionId);
    
    // Marquer l'initialisation comme terminée
    setIsInitialized(true);
  }, []);

  // Chargement des données de la version actuelle
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log(`Chargement des données pour la version: ${currentVersion}`);
    
    // Obtenez les clés pour la version actuelle
    const versionKeys = getVersionStorageKeys(currentVersion);
    
    // Charger d'abord les données depuis localStorage
    try {
      // Arborescence
      const savedTreeData = localStorage.getItem(versionKeys.TREE_DATA);
      if (savedTreeData) {
        const parsedTreeData = JSON.parse(savedTreeData);
        setTreeData(parsedTreeData);
        console.log("Arborescence chargée depuis localStorage");
      } else {
        // Si pas d'arborescence dans localStorage, chercher dans la version
        const currentVersionObj = projectVersions.find(v => v.id === currentVersion);
        if (currentVersionObj && currentVersionObj.treeData.length > 0) {
          setTreeData(currentVersionObj.treeData);
          console.log("Arborescence chargée depuis l'objet version");
        }
      }
      
      // Tableaux
      const savedTableData = localStorage.getItem(versionKeys.TABLE_DATA);
      if (savedTableData) {
        const parsedTableData = JSON.parse(savedTableData);
        setTableDataMap(parsedTableData);
        console.log("Données des tableaux chargées depuis localStorage");
      } else if (currentVersion === DEFAULT_VERSION_ID) {
        // Si nous utilisons la version par défaut, essayer de charger depuis les anciennes clés
        const legacyTableData = localStorage.getItem(STORAGE_KEYS.TABLE_DATA);
        if (legacyTableData) {
          setTableDataMap(JSON.parse(legacyTableData));
          console.log("Données des tableaux chargées depuis les anciennes clés");
        }
      }
      
      // Détails
      const savedDetailData = localStorage.getItem(versionKeys.DETAIL_DATA);
      if (savedDetailData) {
        const parsedDetailData = JSON.parse(savedDetailData);
        setDetailDataMap(parsedDetailData);
        console.log("Données de détails chargées depuis localStorage");
      } else if (currentVersion === DEFAULT_VERSION_ID) {
        // Si nous utilisons la version par défaut, essayer de charger depuis les anciennes clés
        const legacyDetailData = localStorage.getItem(STORAGE_KEYS.DETAIL_DATA);
        if (legacyDetailData) {
          setDetailDataMap(JSON.parse(legacyDetailData));
          console.log("Données de détails chargées depuis les anciennes clés");
        }
      }
      
      // Textes des chapitres
      const savedChapterText = localStorage.getItem(versionKeys.CHAPTER_TEXT);
      if (savedChapterText) {
        const parsedChapterText = JSON.parse(savedChapterText);
        setChapterTextMap(parsedChapterText);
        console.log("Textes des chapitres chargés depuis localStorage");
      } else if (currentVersion === DEFAULT_VERSION_ID) {
        // Si nous utilisons la version par défaut, essayer de charger depuis les anciennes clés
        const legacyChapterText = localStorage.getItem(STORAGE_KEYS.CHAPTER_TEXT);
        if (legacyChapterText) {
          setChapterTextMap(JSON.parse(legacyChapterText));
          console.log("Textes des chapitres chargés depuis les anciennes clés");
        }
      }
      
      // Sélection
      const savedSelectedKey = localStorage.getItem(versionKeys.SELECTED_KEY);
      if (savedSelectedKey) {
        setSelectedKey(savedSelectedKey);
        console.log(`Sélection chargée: ${savedSelectedKey}`);
      } else if (currentVersion === DEFAULT_VERSION_ID) {
        // Si nous utilisons la version par défaut, essayer de charger depuis les anciennes clés
        const legacySelectedKey = localStorage.getItem(STORAGE_KEYS.SELECTED_KEY);
        if (legacySelectedKey) {
          setSelectedKey(legacySelectedKey);
          console.log(`Sélection chargée depuis les anciennes clés: ${legacySelectedKey}`);
        }
      }
      
      // Onglet actif
      const savedActiveTab = localStorage.getItem(versionKeys.ACTIVE_TAB);
      if (savedActiveTab && (savedActiveTab === 'table' || savedActiveTab === 'doc')) {
        setActiveTab(savedActiveTab as 'table' | 'doc');
        console.log(`Onglet actif chargé: ${savedActiveTab}`);
      } else if (currentVersion === DEFAULT_VERSION_ID) {
        // Si nous utilisons la version par défaut, essayer de charger depuis les anciennes clés
        const legacyActiveTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
        if (legacyActiveTab && (legacyActiveTab === 'table' || legacyActiveTab === 'doc')) {
          setActiveTab(legacyActiveTab as 'table' | 'doc');
          console.log(`Onglet actif chargé depuis les anciennes clés: ${legacyActiveTab}`);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  }, [isInitialized, currentVersion, projectVersions]);

  // Mise à jour de la version courante dans localStorage quand elle change
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log(`Mise à jour de la version courante: ${currentVersion}`);
    localStorage.setItem(STORAGE_KEYS.CURRENT_VERSION, currentVersion);
  }, [currentVersion, isInitialized]);

  // Sauvegarde globale des données dans l'objet de version
  useEffect(() => {
    if (!isInitialized || projectVersions.length === 0) return;
    
    // Delay to group updates
    const timer = setTimeout(() => {
      console.log(`Mise à jour des données complètes de la version: ${currentVersion}`);
      
      // Vérifier si on a des données vides qui appartiennent à cette version
      // Si c'est une version qui devrait être vide, ne pas la mettre à jour avec des données
      const currentVersionObj = projectVersions.find(v => v.id === currentVersion);
      if (currentVersionObj && 
          currentVersionObj.treeData.length === 0 && 
          Object.keys(currentVersionObj.tableDataMap).length === 0 &&
          treeData.length === 0 && 
          Object.keys(tableDataMap).length === 0) {
        // C'est une version vide et on n'a pas de données, on ne fait rien
        console.log("Version vide, pas de mise à jour nécessaire");
        return;
      }
      
      // Update version object with current data
      const updatedVersions = projectVersions.map(version => {
        if (version.id === currentVersion) {
          return {
            ...version,
            treeData: [...treeData],
            tableDataMap: { ...tableDataMap },
            detailDataMap: { ...detailDataMap },
            chapterTextMap: { ...chapterTextMap }
          };
        }
        return version;
      });
      
      // Only update if there's a real change
      if (JSON.stringify(updatedVersions) !== JSON.stringify(projectVersions)) {
        setProjectVersions(updatedVersions);
        localStorage.setItem(STORAGE_KEYS.PROJECT_VERSIONS, JSON.stringify(updatedVersions));
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [treeData, tableDataMap, detailDataMap, chapterTextMap, currentVersion, isInitialized]);

  // Sauvegarde des données individuelles de la version actuelle dans localStorage
  useEffect(() => {
    if (!isInitialized || treeData.length === 0) return;
    
    console.log(`Sauvegarde de l'arborescence pour la version: ${currentVersion}`);
    const versionKeys = getVersionStorageKeys(currentVersion);
    localStorage.setItem(versionKeys.TREE_DATA, JSON.stringify(treeData));
  }, [treeData, currentVersion, isInitialized]);

  useEffect(() => {
    if (!isInitialized || Object.keys(tableDataMap).length === 0) return;
    
    console.log(`Sauvegarde des données des tableaux pour la version: ${currentVersion}`);
    const versionKeys = getVersionStorageKeys(currentVersion);
    localStorage.setItem(versionKeys.TABLE_DATA, JSON.stringify(tableDataMap));
  }, [tableDataMap, currentVersion, isInitialized]);

  useEffect(() => {
    if (!isInitialized || Object.keys(detailDataMap).length === 0) return;
    
    console.log(`Sauvegarde des données de détails pour la version: ${currentVersion}`);
    const versionKeys = getVersionStorageKeys(currentVersion);
    localStorage.setItem(versionKeys.DETAIL_DATA, JSON.stringify(detailDataMap));
  }, [detailDataMap, currentVersion, isInitialized]);

  useEffect(() => {
    if (!isInitialized || Object.keys(chapterTextMap).length === 0) return;
    
    console.log(`Sauvegarde des textes des chapitres pour la version: ${currentVersion}`);
    const versionKeys = getVersionStorageKeys(currentVersion);
    localStorage.setItem(versionKeys.CHAPTER_TEXT, JSON.stringify(chapterTextMap));
  }, [chapterTextMap, currentVersion, isInitialized]);

  // Sauvegarde de la sélection
  useEffect(() => {
    if (!isInitialized || !selectedKey) return;
    
    console.log(`Sauvegarde de la sélection pour la version: ${currentVersion}`);
    const versionKeys = getVersionStorageKeys(currentVersion);
    localStorage.setItem(versionKeys.SELECTED_KEY, selectedKey);
  }, [selectedKey, currentVersion, isInitialized]);

  // Sauvegarde de l'onglet actif
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log(`Sauvegarde de l'onglet actif pour la version: ${currentVersion}`);
    const versionKeys = getVersionStorageKeys(currentVersion);
    localStorage.setItem(versionKeys.ACTIVE_TAB, activeTab);
  }, [activeTab, currentVersion, isInitialized]);

  // Reconstruction de l'arborescence imbriquée depuis un tableau plat
  function buildTreeFromFlatData(flat: TreeNodeData[]): TreeNodeData[] {
    const nodeMap: Record<string, TreeNodeData> = {};
    const roots: TreeNodeData[] = [];

    flat.forEach(node => {
      node.children = [];
      nodeMap[node.key] = node;
    });

    flat.forEach(node => {
      if (node.parentId && nodeMap[node.parentId]) {
        nodeMap[node.parentId].children!.push(node);
      } else {
        roots.push(node);
      }
    });
    
    return roots;
  }

  // Transformation des données backend en tree + table maps
  useEffect(() => {
    if (!data) return;

    // 1. Arborescence à partir du backend
    const flatChapters = data.chapters.map(({ chapter }) => ({
      key: chapter.id.toString(),
      num: chapter.num,
      label: chapter.label,
      parentId: chapter.parentId ? chapter.parentId.toString() : null
    }));

    // Construire l'arborescence à partir des données de l'API
    const apiTreeData = buildTreeFromFlatData(flatChapters);
    
    // Vérifier si on a déjà une arborescence dans le localStorage
    const savedTreeData = localStorage.getItem(STORAGE_KEYS.TREE_DATA);
    
    if (savedTreeData) {
      try {
        // Utiliser l'arborescence sauvegardée si elle existe
        const parsedTreeData = JSON.parse(savedTreeData);
        console.log('Utilisation de l\'arborescence sauvegardée');
        // Mettre à jour l'arborescence avec celle sauvegardée
        setTreeData(parsedTreeData);
      } catch (error) {
        console.error('Erreur lors du parsing de l\'arborescence sauvegardée:', error);
        // En cas d'erreur, utiliser l'arborescence de l'API
        setTreeData(apiTreeData);
      }
    } else {
      // Aucune arborescence sauvegardée, utiliser celle de l'API
      setTreeData(apiTreeData);
    }

    // 2. Préparer les tables à partir des données de l'API
    const tables: Record<string, any[][]> = {};
    const details: Record<string, any[][]> = {};
    const chapterTexts: Record<string, string> = {}; // Pour stocker le contenu HTML

    data.chapters.forEach(({ chapter, lines }) => {
      const chapterId = chapter.id.toString();
      
      // Récupération du contenu HTML du chapitre s'il existe
      if (chapter.content) {
        chapterTexts[chapterId] = chapter.content;
      }

      const mainLines = lines.map(({ mainTableLine, details: lineDetails }) => {
        const prix = mainTableLine.quantity * mainTableLine.unitPrice;
        const lineKey = `${chapterId}::${mainTableLine.title}`;

        details[lineKey] = [
          ...lineDetails.map(detail => [
            detail.title,
            detail.number,
            detail.length,
            detail.width,
            detail.height,
            detail.factor,
            detail.total,
            detail.comments
          ]),
          ['Total', '', '', '', '', '', lineDetails.reduce((sum, d) => sum + d.total, 0), '']
        ];

        return [
          mainTableLine.gr,
          mainTableLine.num,
          mainTableLine.title,
          mainTableLine.nm,
          mainTableLine.unit,
          mainTableLine.quantity,
          mainTableLine.unitPrice,
          prix,
          mainTableLine.comments
        ];
      });

      tables[chapterId] = [...mainLines, ['Total', '', '', '', '', '', '', 0, '']];
    });

    // 3. Fusionner les données de l'API avec celles du localStorage
    try {
      const savedTableData = localStorage.getItem(STORAGE_KEYS.TABLE_DATA);
      const savedDetailData = localStorage.getItem(STORAGE_KEYS.DETAIL_DATA);
      const savedChapterText = localStorage.getItem(STORAGE_KEYS.CHAPTER_TEXT);

      // Utiliser les données de localStorage si elles existent, sinon celles de l'API
      if (savedTableData) {
        const parsedTableData = JSON.parse(savedTableData);
        // Fusionner en prioritisant les données de localStorage
        Object.keys(tables).forEach(key => {
          if (!parsedTableData[key]) {
            parsedTableData[key] = tables[key];
          }
        });
        setTableDataMap(parsedTableData);
      } else {
        setTableDataMap(tables);
      }

      if (savedDetailData) {
        const parsedDetailData = JSON.parse(savedDetailData);
        // Fusionner en prioritisant les données de localStorage
        Object.keys(details).forEach(key => {
          if (!parsedDetailData[key]) {
            parsedDetailData[key] = details[key];
          }
        });
        setDetailDataMap(parsedDetailData);
      } else {
        setDetailDataMap(details);
      }

      if (savedChapterText) {
        const parsedChapterText = JSON.parse(savedChapterText);
        // Fusionner en prioritisant les données de localStorage
        Object.keys(chapterTexts).forEach(key => {
          if (!parsedChapterText[key]) {
            parsedChapterText[key] = chapterTexts[key];
          }
        });
        setChapterTextMap(parsedChapterText);
      } else {
        setChapterTextMap(chapterTexts);
      }
    } catch (error) {
      console.error('Erreur lors de la fusion des données:', error);
      // En cas d'erreur, utiliser les données de l'API
      setTableDataMap(tables);
      setDetailDataMap(details);
      setChapterTextMap(chapterTexts);
    }
  }, [data]);

  const getOrCreateTableData = (key: string): any[][] => {
    if (!tableDataMap[key]) {
      const defaultData = [
        ['', '', '', '', '', '', 0, 0, 0, ''],
        ['Total', '', '', '', '', '', '', 0, '']
      ];
      setTableDataMap(prev => ({ ...prev, [key]: defaultData }));
      return defaultData;
    }
    return tableDataMap[key];
  };

  const findTitleByKey = (key: string, nodes: TreeNodeData[]): string | null => {
    for (const node of nodes) {
      if (node.key === key) return `${node.num} - ${node.label}`;
      if (node.children) {
        const found = findTitleByKey(key, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const updateNodeInfo = (key: string, newNum: string, newLabel: string, nodes: TreeNodeData[]): TreeNodeData[] => {
    return nodes.map(node => {
      if (node.key === key) {
        return {
          ...node,
          num: newNum,
          label: newLabel,
          children: updateChildNums(newNum, node.children || [])
        };
      } else if (node.children) {
        return { ...node, children: updateNodeInfo(key, newNum, newLabel, node.children) };
      }
      return node;
    });
  };

  const updateChildNums = (parentNum: string, children: TreeNodeData[]): TreeNodeData[] => {
    return children.map((child, index) => {
      const newNum = `${parentNum}.${index + 1}`;
      return {
        ...child,
        num: newNum,
        children: child.children ? updateChildNums(newNum, child.children) : undefined
      };
    });
  };

  const deleteNode = (key: string, nodes: TreeNodeData[]): TreeNodeData[] => {
    return nodes
      .filter(node => node.key !== key)
      .map(node => ({
        ...node,
        children: node.children ? deleteNode(key, node.children) : undefined
      }));
  };

  const addChildNode = (parentKey: string, nodes: TreeNodeData[]): TreeNodeData[] => {
    return nodes.map(node => {
      if (node.key === parentKey) {
        const childCount = (node.children?.length || 0) + 1;
        const newNum = `${node.num}.${childCount}`;
        const tempKey = `new-${uuidv4()}`;
        const newChild: TreeNodeData = {
          key: tempKey,
          num: newNum,
          label: 'Nouveau poste',
          children: []
        };
        return { ...node, children: [...(node.children || []), newChild] };
      } else if (node.children) {
        return { ...node, children: addChildNode(parentKey, node.children) };
      }
      return node;
    });
  };

  const handleClick = (key: string) => {
    setClickCountMap(prev => {
      const newCount = (prev[key] || 0) + 1;
      const updated = { ...prev, [key]: newCount };

      if (newCount === 2) {
        setSelectedKey(key);
        setActiveTab('doc');
        setTimeout(() => setClickCountMap(p => ({ ...p, [key]: 0 })), 400);
      } else if (newCount >= 3) {
        setEditingKey(key);
        setClickCountMap(p => ({ ...p, [key]: 0 }));
      }
      return updated;
    });
  };

  const renderTreeWithJSX = (nodes: TreeNodeData[]): any =>
    nodes
      .sort((a, b) => a.num.localeCompare(b.num, undefined, { numeric: true }))
      .map((node) => {
        const isEditing = editingKey === node.key;

        return {
          ...node,
          title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isEditing ? (
                <>
                  <input
                    defaultValue={node.num}
                    style={{ width: '3rem' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const numInput = e.target as HTMLInputElement;
                        const labelInput = numInput.nextElementSibling as HTMLInputElement;
                        const newNum = numInput.value;
                        const newLabel = labelInput?.value || node.label;
                        setTreeData(prev => updateNodeInfo(node.key, newNum, newLabel, prev));
                        setEditingKey(null);
                      }
                    }}
                  />
                  <input
                    defaultValue={node.label}
                    style={{ width: '8rem' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const labelInput = e.target as HTMLInputElement;
                        const numInput = labelInput.previousElementSibling as HTMLInputElement;
                        const newLabel = labelInput.value;
                        const newNum = numInput?.value || node.num;
                        setTreeData(prev => updateNodeInfo(node.key, newNum, newLabel, prev));
                        setEditingKey(null);
                      }
                    }}
                    onBlur={(e) => {
                      const labelInput = e.target as HTMLInputElement;
                      const numInput = labelInput.previousElementSibling as HTMLInputElement;
                      const newLabel = labelInput.value;
                      const newNum = numInput?.value || node.num;
                      setTreeData(prev => updateNodeInfo(node.key, newNum, newLabel, prev));
                      setEditingKey(null);
                    }}
                  />
                </>
              ) : (
                <span onClick={() => handleClick(node.key)} style={{ cursor: 'pointer' }}>
                  {`${node.num} - ${node.label}`}
                </span>
              )}
              <button onClick={() => setTreeData(prev => addChildNode(node.key, prev))}>➕</button>
              <button onClick={() => setTreeData(prev => deleteNode(node.key, prev))}>🗑️</button>
            </div>
          ),
          children: node.children ? renderTreeWithJSX(node.children) : undefined
        };
      });

  const addMainChapter = () => {
    const rootNums = treeData.map(node => parseInt(node.num)).filter(n => !isNaN(n));
    const maxNum = rootNums.length > 0 ? Math.max(...rootNums) : 0;
    const nextNum = (maxNum + 1).toString();
  
    const tempKey = `new-${uuidv4()}`;
  
    const newChapter: TreeNodeData = {
      key: tempKey,
      num: nextNum,
      label: 'Nouveau chapitre',
      children: []
    };
  
    setTreeData(prev => [...prev, newChapter]);
  };
      
  const saveProject = async () => {
    if (!data) return;
  
    // 1. Recréer un tableau plat de chapitres à partir de treeData
    const flattenChapters = (nodes: TreeNodeData[], parentNode: TreeNodeData | null = null): any[] => {
      return nodes.flatMap((node) => {
        const isNew = node.key.startsWith('new-');
        const parentIsNew = parentNode?.key?.startsWith('new-');
    
        const chapter = {
          id: isNew ? null : Number(node.key),
          tempId: node.key,
          parentId: !isNew && parentNode && !parentIsNew ? Number(parentNode.key) : null,
          parentTempId: isNew && parentNode ? parentNode.key : null,
          num: node.num,
          label: node.label,
          projectId: data.project.id,
          content: chapterTextMap[node.key] || ''
        };
    
        const children = node.children ? flattenChapters(node.children, node) : [];
        return [chapter, ...children];
      });
    };    
    
    const flatChapters = flattenChapters(treeData);
  
    // 2. Construit les ChapterWithLinesDTO[]
    const chapters = flatChapters.map(ch => {
      const chapterId = ch.id ?? ch.tempId;
      const rawLines = tableDataMap[chapterId] || [];
      const lines = rawLines
        .filter(row => row[0] !== 'Total') // skip total
        .map((row, i) => {
          const lineKey = `${chapterId}::${row[2]}`; // based on title
          const rawDetails = detailDataMap[lineKey] || [];
  
          const details = rawDetails
            .filter(row => row[0] !== 'Total')
            .map((d, i) => ({
              id: null,
              mainTableLineId: null,
              title: d[0],
              number: d[1],
              length: d[2],
              width: d[3],
              height: d[4],
              factor: d[5],
              total: d[6],
              comments: d[7],
              position: i
            }));
  
          return {
            mainTableLine: {
              id: null,
              chapterId: null,
              gr: row[0],
              num: row[1],
              title: row[2],
              nm: row[3],
              unit: row[4],
              quantity: row[5],
              unitPrice: row[6],
              totalPrice: row[7],
              comments: row[8],
              position: i
            },
            details
          };
        });
  
      return {
        chapter: ch,
        lines
      };
    });
  
    // 3. Construction finale du payload
    const payload = {
      project: {
        id: data.project.id,
        name: data.project.name,
        userId: data.project.userId,
        companyId: data.project.companyId
      },
      chapters
    };
  
    // 4. Envoi vers l'API
    try {
      console.log("🚀 Payload projet à envoyer :", payload);
      const res = await fetch(`http://localhost:8080/myProject/api/projects/${data.project.id}/full`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (res.ok) {
        alert('Projet enregistré avec succès !');
        // Après sauvegarde réussie, mettre à jour localStorage avec les données actuelles
        localStorage.setItem(STORAGE_KEYS.TABLE_DATA, JSON.stringify(tableDataMap));
        localStorage.setItem(STORAGE_KEYS.DETAIL_DATA, JSON.stringify(detailDataMap));
        localStorage.setItem(STORAGE_KEYS.CHAPTER_TEXT, JSON.stringify(chapterTextMap));
        localStorage.setItem(STORAGE_KEYS.TREE_DATA, JSON.stringify(treeData));
        localStorage.setItem(STORAGE_KEYS.SELECTED_KEY, selectedKey || '');
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
      } else {
        alert(`Erreur à l'enregistrement (HTTP ${res.status})`);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la requête');
    }
  };

  // Fonction pour créer une nouvelle version
  const createNewVersion = () => {
    if (!newVersionName.trim()) {
      alert('Veuillez entrer un nom pour la version');
      return;
    }

    // Création de la nouvelle version avec une arborescence vide
    const newVersion: ProjectVersion = {
      id: `version-${Date.now()}`,
      name: newVersionName,
      createdAt: new Date().toISOString(),
      treeData: [], // Arborescence vide par défaut
      tableDataMap: {}, // Tableaux vides par défaut
      detailDataMap: {}, // Détails vides par défaut
      chapterTextMap: {} // Textes vides par défaut
    };

    console.log('Création d\'une nouvelle version:', newVersion.name);
    
    // Mise à jour de l'état
    const updatedVersions = [...projectVersions, newVersion];
    setProjectVersions(updatedVersions);
    setCurrentVersion(newVersion.id);
    setIsCreatingVersion(false);
    setNewVersionName('');

    // Réinitialiser les données pour la nouvelle version
    setTreeData([]);
    setTableDataMap({});
    setDetailDataMap({});
    setChapterTextMap({});
    setSelectedKey(null);

    // Sauvegarde dans localStorage
    localStorage.setItem(STORAGE_KEYS.PROJECT_VERSIONS, JSON.stringify(updatedVersions));
    localStorage.setItem(STORAGE_KEYS.CURRENT_VERSION, newVersion.id);
  };

  // Fonction pour changer de version
  const switchVersion = (versionId: string) => {
    if (!versionId) return;
    
    console.log(`Changement de version vers: ${versionId}`);
    
    // Sauvegarder les données actuelles dans la version courante avant de changer
    if (currentVersion) {
      console.log(`Sauvegarde des données de la version actuelle: ${currentVersion}`);
      
      // Sauvegarder les données dans l'objet version actuel
      const updatedVersions = projectVersions.map(version => {
        if (version.id === currentVersion) {
          return {
            ...version,
            treeData: [...treeData],
            tableDataMap: { ...tableDataMap },
            detailDataMap: { ...detailDataMap },
            chapterTextMap: { ...chapterTextMap }
          };
        }
        return version;
      });
      
      // Mettre à jour les versions avec les données actuelles
      setProjectVersions(updatedVersions);
      localStorage.setItem(STORAGE_KEYS.PROJECT_VERSIONS, JSON.stringify(updatedVersions));
      
      // Sauvegarder également dans les clés spécifiques à la version actuelle
      const currentVersionKeys = getVersionStorageKeys(currentVersion);
      localStorage.setItem(currentVersionKeys.TREE_DATA, JSON.stringify(treeData));
      localStorage.setItem(currentVersionKeys.TABLE_DATA, JSON.stringify(tableDataMap));
      localStorage.setItem(currentVersionKeys.DETAIL_DATA, JSON.stringify(detailDataMap));
      localStorage.setItem(currentVersionKeys.CHAPTER_TEXT, JSON.stringify(chapterTextMap));
    }
    
    // Trouver la version cible
    const targetVersion = projectVersions.find(v => v.id === versionId);
    if (!targetVersion) return;
    
    // Charger les données de la version cible
    console.log(`Chargement des données de la version cible: ${versionId}`);
    
    // Vérifier d'abord si des données existent dans localStorage pour cette version
    const targetVersionKeys = getVersionStorageKeys(versionId);
    const savedTreeData = localStorage.getItem(targetVersionKeys.TREE_DATA);
    const savedTableData = localStorage.getItem(targetVersionKeys.TABLE_DATA);
    const savedDetailData = localStorage.getItem(targetVersionKeys.DETAIL_DATA);
    const savedChapterText = localStorage.getItem(targetVersionKeys.CHAPTER_TEXT);
    const savedSelectedKey = localStorage.getItem(targetVersionKeys.SELECTED_KEY);
    const savedActiveTab = localStorage.getItem(targetVersionKeys.ACTIVE_TAB);
    
    // Mise à jour de l'arborescence
    if (savedTreeData) {
      setTreeData(JSON.parse(savedTreeData));
    } else {
      setTreeData(targetVersion.treeData || []);
    }
    
    // Mise à jour des tableaux
    if (savedTableData) {
      setTableDataMap(JSON.parse(savedTableData));
    } else {
      setTableDataMap(targetVersion.tableDataMap || {});
    }
    
    // Mise à jour des détails
    if (savedDetailData) {
      setDetailDataMap(JSON.parse(savedDetailData));
    } else {
      setDetailDataMap(targetVersion.detailDataMap || {});
    }
    
    // Mise à jour des textes des chapitres
    if (savedChapterText) {
      setChapterTextMap(JSON.parse(savedChapterText));
    } else {
      setChapterTextMap(targetVersion.chapterTextMap || {});
    }
    
    // Mise à jour de la sélection
    if (savedSelectedKey) {
      setSelectedKey(savedSelectedKey);
    } else {
      setSelectedKey(null);
    }
    
    // Mise à jour de l'onglet actif
    if (savedActiveTab && (savedActiveTab === 'table' || savedActiveTab === 'doc')) {
      setActiveTab(savedActiveTab as 'table' | 'doc');
    }
    
    // Mise à jour de la version courante
    setCurrentVersion(versionId);
    localStorage.setItem(STORAGE_KEYS.CURRENT_VERSION, versionId);
  };

  return (
    <div className="metre-layout">
      <aside className="metre-tree">
        <div className="version-controls" style={{ margin: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <select 
            value={currentVersion || ''} 
            onChange={(e) => switchVersion(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px' }}
          >
            <option value="">Sélectionner une version</option>
            {projectVersions.map(version => (
              <option key={version.id} value={version.id}>
                {version.name} ({new Date(version.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>

          {isCreatingVersion ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="Nom de la version"
                style={{ padding: '0.5rem', borderRadius: '4px', flex: 1 }}
              />
              <button 
                onClick={createNewVersion}
                style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#4CAF50', color: 'white' }}
              >
                Créer
              </button>
              <button 
                onClick={() => setIsCreatingVersion(false)}
                style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#f44336', color: 'white' }}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreatingVersion(true)}
              style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: '#2196F3', color: 'white' }}
            >
              ➕ Créer une nouvelle version
            </button>
          )}
        </div>

        <button onClick={addMainChapter} style={{ margin: '0.5rem' }}>
          ➕ Ajouter un chapitre principal
        </button>
        <button onClick={saveProject} style={{ margin: '0.5rem' }}>
          💾 Enregistrer le projet
        </button>
        <Tree
          treeData={renderTreeWithJSX(treeData)}
          selectable={false}
        />
      </aside>
      <main className="metre-table-container">
        {selectedKey && (
          <>
            <h2>Chapitre : {findTitleByKey(selectedKey, treeData)}</h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button
                onClick={() => setActiveTab('doc')}
                style={{ fontWeight: activeTab === 'doc' ? 'bold' : 'normal' }}
              >
                Cahier des charges
              </button>
              <button
                onClick={() => setActiveTab('table')}
                style={{ fontWeight: activeTab === 'table' ? 'bold' : 'normal' }}
              >
                Tableur
              </button>
            </div>

            {activeTab === 'table' ? (
              <MetreTable
                key={selectedKey}
                tableKey={selectedKey}
                data={getOrCreateTableData(selectedKey)}
                onDataChange={(updatedData) =>
                  setTableDataMap(prev => ({ ...prev, [selectedKey]: updatedData }))
                }
                detailDataMap={detailDataMap}
                setDetailDataMap={setDetailDataMap}
              />
            ) : (
              <ChapterEditor
                key={selectedKey}
                tableKey={selectedKey}
                tableData={getOrCreateTableData(selectedKey)}
                onTableChange={(updatedData) =>
                  setTableDataMap(prev => ({ ...prev, [selectedKey]: updatedData }))
                }
                detailDataMap={detailDataMap}
                setDetailDataMap={setDetailDataMap}
                chapterNotes={chapterTextMap}
                setChapterNotes={setChapterTextMap}
                disablePrint={true}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}