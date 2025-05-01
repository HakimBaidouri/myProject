import React, { useState, useEffect } from 'react';
import { useLocalStorageData, TreeNodeData } from '../../hooks/useLocalStorageData';
import './Summary.css';

interface SummaryTableRow {
  chapter: string;
  totalPrice: number;
}

export default function Summary() {
  console.log("🔍 Summary: Composant en cours de montage");
  const { treeData, tableDataMap, detailDataMap, chapterTextMap, loading } = useLocalStorageData();
  
  console.log("🔍 Summary: État initial -", { loading, treeDataLength: treeData.length, hasTableData: Object.keys(tableDataMap).length > 0 });
  
  const [summaryData, setSummaryData] = useState<SummaryTableRow[]>([]);
  const [projectTotal, setProjectTotal] = useState<number>(0);

  // Afficher le payload reçu via localStorage
  useEffect(() => {
    console.log("🔍 Summary: Effect de logging déclenché -", { loading });
    
    if (!loading) {
      console.log("🚀 Payload reçu dans Summary:", {
        treeData,
        tableDataMap,
        detailDataMap,
        chapterTextMap
      });
    }
  }, [loading, treeData, tableDataMap, detailDataMap, chapterTextMap]);

  // Calculer les totaux par chapitre quand les données sont chargées
  useEffect(() => {
    if (!loading && treeData.length > 0 && Object.keys(tableDataMap).length > 0) {
      const calculateSummaryData = () => {
        // Fonction récursive pour parcourir l'arborescence
        const processNode = (node: TreeNodeData): SummaryTableRow => {
          const tableData = tableDataMap[node.key] || [];
          
          // Calculer le total pour ce chapitre
          let chapterTotal = 0;
          tableData.forEach(row => {
            if (row[0] !== 'Total' && row[7] && !isNaN(parseFloat(row[7]))) {
              chapterTotal += parseFloat(row[7]);
            }
          });
          
          // Traiter récursivement les enfants
          let childrenTotal = 0;
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              const childResult = processNode(child);
              childrenTotal += childResult.totalPrice;
            });
          }
          
          return {
            chapter: `${node.num} - ${node.label}`,
            totalPrice: chapterTotal + childrenTotal
          };
        };
        
        // Traiter tous les noeuds racine
        const summary: SummaryTableRow[] = [];
        let total = 0;
        
        treeData.forEach(node => {
          const result = processNode(node);
          summary.push(result);
          total += result.totalPrice;
        });
        
        setSummaryData(summary);
        setProjectTotal(total);
      };
      
      calculateSummaryData();
    }
  }, [loading, treeData, tableDataMap]);

  if (loading) {
    return <div className="loading">Chargement des données...</div>;
  }

  if (treeData.length === 0) {
    return <div className="no-data">Aucune donnée disponible. Veuillez d'abord compléter les données dans la section Métré.</div>;
  }

  return (
    <div className="summary-container">
      <h1>Récapitulatif du projet</h1>
      
      <div className="summary-table">
        <table>
          <thead>
            <tr>
              <th>Chapitre</th>
              <th>Montant total (€)</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((row, index) => (
              <tr key={index}>
                <td>{row.chapter}</td>
                <td className="price">{row.totalPrice.toFixed(2)} €</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>TOTAL PROJET</td>
              <td className="price">{projectTotal.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
} 