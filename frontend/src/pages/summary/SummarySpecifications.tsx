import { useState, useEffect, useRef } from 'react';
import './SummarySpecifications.css';
import { useLocalStorageData, TreeNodeData } from '../../hooks/useLocalStorageData';
import { useEditor, EditorContent } from '@tiptap/react';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import ImageResize from "tiptap-extension-resize-image";
import Underline from '@tiptap/extension-underline';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { useEditorStore } from "@/store/use-editor-store";
import { FontSizeExtension } from '@/extensions/font-size';
import { LineHeightExtension } from '@/extensions/line-height';
import '../textEditor/ChapterEditor.css';
import Toolbar from '../textEditor/Toolbar';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Type simplifié compatible avec localStorage
interface Chapter {
  id: string;
  num: string;
  label: string;
  parentId: string | null;
  content: string;
}

// Composant pour le bouton d'export Word
function ExportButtons() {
  const handleExportPDF = async () => {
    const element = document.querySelector('.ProseMirror') as HTMLElement;
    if (!element) return;

    try {
      // Créer une copie temporaire de l'élément pour l'export
      const printContainer = document.createElement('div');
      printContainer.className = 'pdf-export-container';
      printContainer.innerHTML = element.innerHTML;
      
      // Appliquer les styles nécessaires pour avoir un bon rendu
      printContainer.style.width = '816px'; // Largeur A4 à 96 DPI
      printContainer.style.padding = '40px';
      printContainer.style.backgroundColor = 'white';
      printContainer.style.position = 'absolute';
      printContainer.style.top = '-9999px';
      printContainer.style.left = '-9999px';
      printContainer.style.fontSize = '16px';
      printContainer.style.lineHeight = '1.5';
      printContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Ajouter au document pour le rendu
      document.body.appendChild(printContainer);
      
      const canvas = await html2canvas(printContainer, {
        scale: 2, // Meilleure qualité
        useCORS: true,
        logging: false,
        windowWidth: 816, // A4 width in px at 96 DPI
        windowHeight: printContainer.scrollHeight
      });
      
      // Nettoyer
      document.body.removeChild(printContainer);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // A4 dimensions in mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Ajouter la première page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Télécharger le PDF
      pdf.save('specifications.pdf');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Une erreur est survenue lors de l\'export du PDF. Veuillez réessayer.');
    }
  };

  const exportToWord = () => {
    const editor = document.querySelector('.ProseMirror') as HTMLElement;
    if (!editor) return;

    // Créer un blob avec le contenu HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Cahier des Charges</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { font-size: 18pt; margin-top: 16pt; margin-bottom: 8pt; page-break-before: always; }
            h1:first-child { page-break-before: avoid; }
            h2 { font-size: 16pt; margin-top: 14pt; margin-bottom: 6pt; }
            p { margin-bottom: 8pt; }
            hr { border: none; border-top: 1px solid #eaeaea; margin: 12pt 0; }
          </style>
        </head>
        <body>
          ${editor.innerHTML}
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = url;
    link.download = 'specifications.doc';
    link.click();
    
    // Libérer l'URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="flex gap-2 ml-2">
      <button 
        onClick={handleExportPDF}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
        </svg>
        Export PDF
      </button>
      <button 
        onClick={exportToWord}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
        Export Word
      </button>
    </div>
  );
}

export default function SummarySpecifications() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [combinedContent, setCombinedContent] = useState<string>('');
  const { treeData, chapterTextMap, loading } = useLocalStorageData();
  const { setEditor } = useEditorStore();
  
  console.log("🚀 SummarySpecifications: Payload reçu depuis localStorage:", {
    treeData,
    chapterTextMap
  });

  useEffect(() => {
    if (!loading && treeData.length > 0) {
      processLocalStorageData();
    }
  }, [loading, treeData, chapterTextMap]);

  const processLocalStorageData = () => {
    // Convertir les données du localStorage au format attendu par le composant
    const flatNodes = flattenTreeNodes(treeData);
    
    // Créer des objets chapitre avec leur contenu
    const extractedChapters: Chapter[] = flatNodes.map(node => ({
      id: node.key,
      num: node.num,
      label: node.label,
      parentId: node.parentId || null,
      content: chapterTextMap[node.key] || ''
    }));

    // Trier les chapitres
    const sortedChapters = sortChapters(extractedChapters);
    setChapters(sortedChapters);
    
    // Générer le contenu combiné pour l'éditeur
    const combined = generateCombinedContent(sortedChapters);
    setCombinedContent(combined);
  };

  // Fonction pour aplatir l'arborescence en liste
  const flattenTreeNodes = (nodes: TreeNodeData[]): TreeNodeData[] => {
    let result: TreeNodeData[] = [];
    
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        result = [...result, ...flattenTreeNodes(node.children)];
      }
    });
    
    return result;
  };

  // Fonction pour trier les chapitres hiérarchiquement
  const sortChapters = (chapters: Chapter[]): Chapter[] => {
    // Trier les chapitres par leur numéro
    chapters.sort((a, b) => {
      return a.num.localeCompare(b.num, undefined, { numeric: true });
    });
    
    return chapters;
  };
  
  // Fonction pour générer le contenu combiné avec les titres des chapitres
  const generateCombinedContent = (sortedChapters: Chapter[]): string => {
    let combined = '';
    
    sortedChapters.forEach((chapter, index) => {
      // Déterminer le niveau du titre en fonction de la profondeur (chapitre principal ou sous-chapitre)
      const titleLevel = chapter.parentId === null ? 'h1' : 'h2';
      const pageBreak = index === 0 ? '' : 'page-break-before: always;';
      
      // Ajouter le titre du chapitre
      combined += `<${titleLevel} style="${pageBreak} margin-top: 2em;"><strong>${chapter.num} - ${chapter.label}</strong></${titleLevel}>`;
      
      // Ajouter le contenu du chapitre s'il existe
      if (chapter.content && chapter.content.trim() !== '') {
        combined += chapter.content;
      } else {
        combined += '<p><em>Pas de contenu disponible</em></p>';
      }
      
      // Ajouter un séparateur
      combined += '<hr style="margin: 2em 0; border: none; border-top: 1px solid #eaeaea;" />';
    });
    
    return combined;
  };
  
  // Configuration de l'éditeur TipTap
  const editor = useEditor({
    immediatelyRender: false,
    onCreate({ editor }) {
      setEditor(editor);
    },
    onDestroy() {
      setEditor(null);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none print:border-0 bg-white border border-[#C7C7C7] flex flex-col min-h-[1054px] w-[816px] pt-10 px-14 pb-10 cursor-text",
      }
    },
    extensions: [
      StarterKit,
      LineHeightExtension,
      FontSizeExtension,
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https"
      }),
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily,
      TextStyle,
      Underline,
      Image,
      ImageResize,
      Table,
      TableCell,
      TableHeader,
      TableRow,
      TaskItem.configure({
        nested: true
      }),
      TaskList,
    ],
    content: combinedContent,
  }, [combinedContent]); // Dépendance pour recréer l'éditeur quand le contenu change

  if (loading) {
    return <div className="text-center py-8">Chargement des données...</div>;
  }

  if (treeData.length === 0) {
    return <div className="text-center py-8 text-red-500">Aucune donnée disponible. Veuillez d'abord compléter les données dans la section Métré.</div>;
  }

  return (
    <div className="specifications-summary bg-[#FAFBFD] print:bg-white">
      <div className="print:hidden flex">
        <Toolbar disablePrint={false} />
        <ExportButtons />
      </div>
      
      <div className="size-full overflow-x-auto bg-[#F9FBFD] px-4 print:p-0 print:bg-white print:overflow-visible">
        <div className="min-w-max flex justify-center w-[816px] py-4 print:py-0 mx-auto print:w-full print:min-w-0">
          <div ref={editorRef} className="print:block print:w-full">
            <EditorContent editor={editor} className="print:block print:w-full" />
          </div>
        </div>
      </div>
      
      <style>
        {`
          @media print {
            /* Forcer l'affichage du contenu */
            .specifications-summary {
              display: block !important;
              visibility: visible !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
            }
            
            /* Masquer les éléments inutiles */
            .specifications-summary > div:first-child {
              display: none !important;
            }
            
            /* S'assurer que l'éditeur est visible */
            .ProseMirror, .tiptap {
              display: block !important;
              visibility: visible !important;
              width: 100% !important;
              height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              overflow: visible !important;
              background-color: white !important;
              color: black !important;
              font-size: 12pt !important;
              line-height: 1.5 !important;
            }
            
            /* Styles supplémentaires pour les éléments internes */
            .ProseMirror p {
              margin-bottom: 3pt !important;
              display: block !important;
              visibility: visible !important;
              color: black !important;
            }
            
            .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4 {
              color: black !important;
              display: block !important;
              visibility: visible !important;
            }
            
            /* Réglages pour la page */
            @page {
              margin: 5mm;
              size: A4;
            }
            
            /* Styles pour les titres et sauts de page */
            h1, h2 {
              page-break-before: always;
            }
            
            h1:first-child {
              page-break-before: avoid;
            }
            
            p, ul, ol, table {
              page-break-inside: avoid;
            }
            
            /* S'assurer que les images sont bien dimensionnées */
            img {
              max-width: 100% !important;
            }
            
            /* Forcer l'affichage du contenu */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>
    </div>
  );
} 