import { useState } from 'react';
import Tree from 'rc-tree';
import Handsontable from 'handsontable';
import { NumericCellType } from 'handsontable/cellTypes';
import 'handsontable/dist/handsontable.full.min.css';
import 'rc-tree/assets/index.css';
import './Metre.css';
import MetreTable from './MetreTable'; 


Handsontable.cellTypes.registerCellType(NumericCellType);

export default function MetreArbo() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const treeData = [
    {
      title: '7 - Murs',
      key: '7',
      children: [
        { title: '7.1 - Murs porteurs', key: '7.1' },
        { title: '7.2 - Cloisons intérieures', key: '7.2' }
      ]
    },
    {
      title: '8 - Toiture',
      key: '8',
      children: [
        { title: '8.1 - Charpente', key: '8.1' }
      ]
    }
  ];

  const handleDoubleClick = (_: any, node: any) => {
    if (!node.children) {
      setSelectedKey(node.key); // uniquement si c’est une feuille
    }
  };

  return (
    <div className="metre-layout">
      <aside className="metre-tree">
        <Tree treeData={treeData} onDoubleClick={handleDoubleClick} />
      </aside>
      <main className="metre-table-container">
        {selectedKey && (
          <>
            <h2>Chapitre : {selectedKey}</h2>
            <MetreTable />
          </>
        )}
      </main>
    </div>
  );
}
