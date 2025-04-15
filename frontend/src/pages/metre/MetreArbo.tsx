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
  title: string;
  children?: TreeNodeData[];
}

export default function MetreArbo() {
  const initialTreeData = (): TreeNodeData[] => [
    {
      key: uuidv4(),
      title: '7 - Murs',
      children: [
        { key: uuidv4(), title: '7.1 - Murs porteurs' },
        { key: uuidv4(), title: '7.2 - Cloisons intérieures' }
      ]
    },
    {
      key: uuidv4(),
      title: '8 - Toiture',
      children: [
        { key: uuidv4(), title: '8.1 - Charpente' }
      ]
    }
  ];

  const [treeData, setTreeData] = useState<TreeNodeData[]>(initialTreeData);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [tableDataMap, setTableDataMap] = useState<Record<string, any[][]>>({});
  const [detailDataMap, setDetailDataMap] = useState<Record<string, any[][]>>({});

  const getOrCreateTableData = (key: string): any[][] => {
    if (!tableDataMap[key]) {
      const defaultData = [
        ['340', '22.5.1', 'Toiture', 'm²', 0, 0, 0, ''],
        ['Total', '', '', '', '', '', 0, '']
      ];
      setTableDataMap(prev => ({ ...prev, [key]: defaultData }));
      return defaultData;
    }
    return tableDataMap[key];
  };

  const handleDoubleClick = (_: any, node: any) => {
    if (!node.children) {
      setSelectedKey(node.key);
    }
  };

  const findTitleByKey = (key: string, nodes: TreeNodeData[]): string | null => {
    for (const node of nodes) {
      if (node.key === key) return node.title;
      if (node.children) {
        const found = findTitleByKey(key, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const renderTreeWithJSX = (nodes: TreeNodeData[]): any =>
    nodes.map((node) => ({
      ...node,
      title: <span>{node.title}</span>,
      children: node.children ? renderTreeWithJSX(node.children) : undefined
    }));

  return (
    <div className="metre-layout">
      <aside className="metre-tree">
        <Tree
          treeData={renderTreeWithJSX(treeData)}
          onDoubleClick={handleDoubleClick}
        />
      </aside>
      <main className="metre-table-container">
        {selectedKey && (
          <>
            <h2>Chapitre : {findTitleByKey(selectedKey, treeData)}</h2>
            <MetreTable
              key={selectedKey} // ça force le remount
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
