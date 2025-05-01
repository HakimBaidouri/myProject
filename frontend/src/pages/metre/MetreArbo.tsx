import { useEffect, useState } from 'react';
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

Handsontable.cellTypes.registerCellType(NumericCellType);

// Clés pour le stockage localStorage
const STORAGE_KEYS = {
  TABLE_DATA: 'metreTableData',
  DETAIL_DATA: 'metreDetailData',
  CHAPTER_TEXT: 'metreChapterText',
  TREE_DATA: 'metreTreeData',
  SELECTED_KEY: 'metreSelectedKey',
  ACTIVE_TAB: 'metreActiveTab'
};

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
  const [activeTab, setActiveTab] = useState<'table' | 'doc'>('table');
  const [chapterTextMap, setChapterTextMap] = useState<Record<string, string>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [clickCountMap, setClickCountMap] = useState<Record<string, number>>({});

  // Mise à jour du localStorage lorsque les données changent
  useEffect(() => {
    if (Object.keys(tableDataMap).length > 0) {
      localStorage.setItem(STORAGE_KEYS.TABLE_DATA, JSON.stringify(tableDataMap));
      console.log('Données des tableaux sauvegardées dans localStorage');
    }
  }, [tableDataMap]);

  useEffect(() => {
    if (Object.keys(detailDataMap).length > 0) {
      localStorage.setItem(STORAGE_KEYS.DETAIL_DATA, JSON.stringify(detailDataMap));
      console.log('Données de détails sauvegardées dans localStorage');
    }
  }, [detailDataMap]);

  useEffect(() => {
    if (Object.keys(chapterTextMap).length > 0) {
      localStorage.setItem(STORAGE_KEYS.CHAPTER_TEXT, JSON.stringify(chapterTextMap));
      console.log('Textes des chapitres sauvegardés dans localStorage');
    }
  }, [chapterTextMap]);

  // Sauvegarder l'arborescence modifiée dans localStorage
  useEffect(() => {
    if (treeData.length > 0) {
      localStorage.setItem(STORAGE_KEYS.TREE_DATA, JSON.stringify(treeData));
      console.log('Arborescence sauvegardée dans localStorage');
    }
  }, [treeData]);

  // Sauvegarder la sélection courante dans localStorage
  useEffect(() => {
    if (selectedKey) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_KEY, selectedKey);
      console.log('Sélection sauvegardée dans localStorage:', selectedKey);
    }
  }, [selectedKey]);

  // Sauvegarder l'onglet actif dans localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    console.log('Onglet actif sauvegardé dans localStorage:', activeTab);
  }, [activeTab]);

  // Chargement des données depuis localStorage si elles existent
  useEffect(() => {
    const loadDataFromLocalStorage = () => {
      try {
        const savedTableData = localStorage.getItem(STORAGE_KEYS.TABLE_DATA);
        const savedDetailData = localStorage.getItem(STORAGE_KEYS.DETAIL_DATA);
        const savedChapterText = localStorage.getItem(STORAGE_KEYS.CHAPTER_TEXT);
        const savedTreeData = localStorage.getItem(STORAGE_KEYS.TREE_DATA);
        const savedSelectedKey = localStorage.getItem(STORAGE_KEYS.SELECTED_KEY);
        const savedActiveTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);

        if (savedTableData) {
          setTableDataMap(JSON.parse(savedTableData));
          console.log('Données des tableaux chargées depuis localStorage');
        }

        if (savedDetailData) {
          setDetailDataMap(JSON.parse(savedDetailData));
          console.log('Données de détails chargées depuis localStorage');
        }

        if (savedChapterText) {
          setChapterTextMap(JSON.parse(savedChapterText));
          console.log('Textes des chapitres chargés depuis localStorage');
        }

        if (savedTreeData) {
          setTreeData(JSON.parse(savedTreeData));
          console.log('Arborescence chargée depuis localStorage');
        }

        if (savedSelectedKey) {
          setSelectedKey(savedSelectedKey);
          console.log('Sélection chargée depuis localStorage:', savedSelectedKey);
        }

        if (savedActiveTab && (savedActiveTab === 'table' || savedActiveTab === 'doc')) {
          setActiveTab(savedActiveTab as 'table' | 'doc');
          console.log('Onglet actif chargé depuis localStorage:', savedActiveTab);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données depuis localStorage:', error);
      }
    };

    // Charger les données depuis localStorage
    loadDataFromLocalStorage();
  }, []);

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
        setActiveTab('table');
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

  return (
    <div className="metre-layout">
      <aside className="metre-tree">
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
                onClick={() => setActiveTab('table')}
                style={{ fontWeight: activeTab === 'table' ? 'bold' : 'normal' }}
              >
                Tableur
              </button>
              <button
                onClick={() => setActiveTab('doc')}
                style={{ fontWeight: activeTab === 'doc' ? 'bold' : 'normal' }}
              >
                Cahier des charges
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
