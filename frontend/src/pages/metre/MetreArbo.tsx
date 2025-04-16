import { useState } from 'react';
import Tree from 'rc-tree';
import Handsontable from 'handsontable';
import { NumericCellType } from 'handsontable/cellTypes';
import { v4 as uuidv4 } from 'uuid';
import 'handsontable/dist/handsontable.full.min.css';
import 'rc-tree/assets/index.css';
import './Metre.css';
import MetreTable from './MetreTable';

Handsontable.cellTypes.registerCellType(NumericCellType);

interface TreeNodeData {
  key: string;
  num: string;
  label: string;
  children?: TreeNodeData[];
}

export default function MetreArbo() {
  const initialTreeData = (): TreeNodeData[] => [
    {
      key: uuidv4(),
      num: '7',
      label: 'Murs',
      children: [
        { key: uuidv4(), num: '7.1', label: 'Murs porteurs' },
        { key: uuidv4(), num: '7.2', label: 'Cloisons intérieures' }
      ]
    },
    {
      key: uuidv4(),
      num: '8',
      label: 'Toiture',
      children: [
        { key: uuidv4(), num: '8.1', label: 'Charpente' }
      ]
    }
  ];

  const [treeData, setTreeData] = useState<TreeNodeData[]>(initialTreeData);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [clickCountMap, setClickCountMap] = useState<Record<string, number>>({});
  const [tableDataMap, setTableDataMap] = useState<Record<string, any[][]>>({});
  const [detailDataMap, setDetailDataMap] = useState<Record<string, any[][]>>({});

  const getOrCreateTableData = (key: string): any[][] => {
    if (!tableDataMap[key]) {
      const defaultData = [
        ['', '22.5.1', 'Toiture', 'm²', 'QF', 0, 0, 0, ''],
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
        const updatedNode = {
          ...node,
          num: newNum,
          label: newLabel,
          children: updateChildNums(newNum, node.children || [])
        };
        return updatedNode;
      } else if (node.children) {
        return { ...node, children: updateNodeInfo(key, newNum, newLabel, node.children) };
      }
      return node;
    });
  };
  
  const updateChildNums = (parentNum: string, children: TreeNodeData[]): TreeNodeData[] => {
    return children.map((child, index) => {
      const newChildNum = `${parentNum}.${index + 1}`;
      return {
        ...child,
        num: newChildNum,
        children: child.children ? updateChildNums(newChildNum, child.children) : undefined
      };
    });
  };
  
  

  const deleteNode = (key: string, nodes: TreeNodeData[]): TreeNodeData[] => {
    return nodes
      .filter(node => node.key !== key)
      .map(node => {
        if (node.children) {
          return { ...node, children: deleteNode(key, node.children) };
        }
        return node;
      });
  };

  const addChildNode = (parentKey: string, nodes: TreeNodeData[]): TreeNodeData[] => {
    return nodes.map(node => {
      if (node.key === parentKey) {
        const childCount = (node.children?.length || 0) + 1;
        const newNum = `${node.num}.${childCount}`;
        const newChild = { key: uuidv4(), num: newNum, label: 'Nouveau poste' };
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
  
    const newChapter: TreeNodeData = {
      key: uuidv4(),
      num: nextNum,
      label: 'Nouveau chapitre',
      children: []
    };
  
    setTreeData(prev => [...prev, newChapter]);
  };

  return (
    <div className="metre-layout">
      <aside className="metre-tree">
        <button onClick={addMainChapter} style={{ margin: '0.5rem' }}>
          ➕ Ajouter un chapitre principal
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
          </>
        )}
      </main>
    </div>
  );
}
