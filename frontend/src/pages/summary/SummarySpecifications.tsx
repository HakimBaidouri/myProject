import { useState, useEffect, useRef, useCallback } from 'react';
import './SummarySpecifications.css';
import { useLocalStorageData, TreeNodeData, STORAGE_KEYS, getVersionStorageKeys } from '../../hooks/useLocalStorageData';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
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

// Fonction auxiliaire pour vérifier si un en-tête est protégé
function isHeadingProtected(editor: any) {
  const { selection } = editor.state;
  const { $head } = selection;
  
  // Vérifier si on se trouve dans un titre h1 ou h2
  if ($head.parent.type.name === 'heading' && 
      ($head.parent.attrs.level === 1 || $head.parent.attrs.level === 2)) {
    
    const nodeText = $head.parent.textContent;
    // Vérifier si le texte contient un numéro de chapitre
    const match = nodeText.match(/^([\d\.]+)\s*-\s*/);
    
    if (match) {
      return true; // Ce titre est protégé
    }
  }
  
  return false; // Ce n'est pas un titre protégé
}

// Fonction de gestion des touches pour les titres protégés
const handleProtectedHeading = ({ editor }: { editor: any }) => {
  return isHeadingProtected(editor);
};

// Extension pour empêcher la modification des titres de chapitres
const ProtectHeadings = Extension.create({
  name: 'protectHeadings',
  
  addKeyboardShortcuts() {
    return {
      // Empêcher la suppression des titres de chapitres
      Backspace: ({ editor }) => {
        // Ne pas interférer avec les commandes d'historique (undo)
        if (editor.view.state.selection.$head.pos === 0) {
          return false;
        }
        
        const { selection } = editor.state;
        const { empty, $head } = selection;
        
        // Vérifier si on se trouve dans un titre h1 ou h2
        if (empty && $head.parent.type.name === 'heading' && 
            ($head.parent.attrs.level === 1 || $head.parent.attrs.level === 2)) {
          
          const nodeText = $head.parent.textContent;
          // Vérifier si le texte contient un numéro de chapitre (format: "X.Y - Titre")
          const match = nodeText.match(/^([\d\.]+)\s*-\s*/);
          
          if (match) {
            const numPart = match[0]; // La partie "X.Y - "
            const numPartLength = numPart.length;
            
            // Protection renforcée: empêcher toute modification de l'ensemble du titre
            return true; // Empêcher l'action par défaut
          }
        }
        
        return false; // Laisser passer les autres cas
      },
      
      // Empêcher la suppression des titres avec Delete
      Delete: ({ editor }) => {
        const { selection } = editor.state;
        const { empty, $head } = selection;
        
        // Vérifier si on se trouve dans un titre h1 ou h2
        if (empty && $head.parent.type.name === 'heading' && 
            ($head.parent.attrs.level === 1 || $head.parent.attrs.level === 2)) {
          
          const nodeText = $head.parent.textContent;
          // Vérifier si le texte contient un numéro de chapitre
          const match = nodeText.match(/^([\d\.]+)\s*-\s*/);
          
          if (match) {
            // Protection renforcée: empêcher toute modification de l'ensemble du titre
            return true; // Empêcher l'action par défaut
          }
        }
        
        return false; // Laisser passer les autres cas
      },
      
      // Bloquer toutes les touches alphabétiques et numériques pour les titres
      'Enter': ({ editor }) => {
        const { selection } = editor.state;
        const { $head } = selection;
        
        // Vérifier si on se trouve dans un titre h1 ou h2
        if ($head.parent.type.name === 'heading' && 
            ($head.parent.attrs.level === 1 || $head.parent.attrs.level === 2)) {
          
          const nodeText = $head.parent.textContent;
          // Vérifier si le texte contient un numéro de chapitre
          const match = nodeText.match(/^([\d\.]+)\s*-\s*/);
          
          if (match) {
            // Bloquer la touche dans les titres
            return true;
          }
        }
        
        return false;
      },
      
      // On ajoute également des bloqueurs pour les caractères individuels
      'Space': handleProtectedHeading,
      'a': handleProtectedHeading,
      'b': handleProtectedHeading,
      'c': handleProtectedHeading,
      'd': handleProtectedHeading,
      'e': handleProtectedHeading,
      'f': handleProtectedHeading,
      'g': handleProtectedHeading,
      'h': handleProtectedHeading,
      'i': handleProtectedHeading,
      'j': handleProtectedHeading,
      'k': handleProtectedHeading,
      'l': handleProtectedHeading,
      'm': handleProtectedHeading,
      'n': handleProtectedHeading,
      'o': handleProtectedHeading,
      'p': handleProtectedHeading,
      'q': handleProtectedHeading,
      'r': handleProtectedHeading,
      's': handleProtectedHeading,
      't': handleProtectedHeading,
      'u': handleProtectedHeading,
      'v': handleProtectedHeading,
      'w': handleProtectedHeading,
      'x': handleProtectedHeading,
      'y': handleProtectedHeading,
      'z': handleProtectedHeading,
      '0': handleProtectedHeading,
      '1': handleProtectedHeading,
      '2': handleProtectedHeading,
      '3': handleProtectedHeading,
      '4': handleProtectedHeading,
      '5': handleProtectedHeading,
      '6': handleProtectedHeading,
      '7': handleProtectedHeading,
      '8': handleProtectedHeading,
      '9': handleProtectedHeading,
      
      // Permettre explicitement les raccourcis undo et redo
      'Mod-z': () => false, // Permet à l'événement de continuer son traitement normal
      'Mod-y': () => false, // Permet à l'événement de continuer son traitement normal
      'Mod-Shift-z': () => false, // Alternative pour Redo sur certains systèmes
    };
  }
});

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
  const [lastUpdateCheck, setLastUpdateCheck] = useState<number>(Date.now());
  const { treeData, chapterTextMap, loading, updateNode, updateChapterText, updateChapterTextMap, currentVersion, projectVersions } = useLocalStorageData();
  const { setEditor } = useEditorStore();
  const editorUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const contentUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const forceUpdateRef = useRef<boolean>(false);
  const [versionName, setVersionName] = useState<string>('');
  const lastCheckedVersionRef = useRef<string | null>(currentVersion);
  
  // Initialiser l'éditeur
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      ImageResize,
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex checkbox-item gap-2',
        },
      }),
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          class: 'text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      FontSizeExtension,
      LineHeightExtension,
      ProtectHeadings,
    ],
    content: combinedContent,
    editorProps: {
      attributes: {
        class: "focus:outline-none print:border-0 bg-white border border-[#C7C7C7] flex flex-col min-h-[1054px] w-[816px] pt-10 px-14 pb-10 cursor-text",
      }
    },
    
    onCreate({ editor }) {
      setEditor(editor);
    },
    onDestroy() {
      setEditor(null);
    },
    onUpdate({ editor }) {
      // Utiliser setTimeout pour éviter les mises à jour pendant la saisie
      // Cela permettra à l'utilisateur de finir sa saisie avant de traiter les modifications
      if (editorUpdateTimeout.current) {
        clearTimeout(editorUpdateTimeout.current);
      }
      
      // Vérification du contenu sans mise à jour des titres vers métré
      editorUpdateTimeout.current = setTimeout(() => {
        extractChapterTitles(editor.getHTML());
      }, 1000); // Délai d'une seconde après la dernière frappe

      // Mise à jour du contenu avec un délai plus long
      if (contentUpdateTimeout.current) {
        clearTimeout(contentUpdateTimeout.current);
      }
      contentUpdateTimeout.current = setTimeout(() => {
        extractAndSaveContent(editor.getHTML());
      }, 2000); // Délai de deux secondes pour la sauvegarde du contenu
    },
    onBlur({ editor }) {
      // Vérification du contenu sans mise à jour des titres vers métré
      extractChapterTitles(editor.getHTML());
      // Sauvegarder le contenu lorsque l'éditeur perd le focus
      extractAndSaveContent(editor.getHTML());
    }
  });
  
  // Trouver le nom de la version actuelle
  useEffect(() => {
    if (currentVersion && projectVersions.length > 0) {
      const version = projectVersions.find(v => v.id === currentVersion);
      if (version) {
        setVersionName(version.name);
      } else {
        setVersionName('Version inconnue');
      }
    } else {
      setVersionName('Version par défaut');
    }
  }, [currentVersion, projectVersions]);
  
  // Ajouter un intervalle pour vérifier périodiquement si la version a changé
  useEffect(() => {
    // Vérifier si la version courante a changé dans localStorage
    const checkVersionChange = () => {
      const storedVersion = localStorage.getItem(STORAGE_KEYS.CURRENT_VERSION);
      
      if (storedVersion && storedVersion !== lastCheckedVersionRef.current) {
        console.log(`🔄 Version changée: ${lastCheckedVersionRef.current} -> ${storedVersion}`);
        lastCheckedVersionRef.current = storedVersion;
        
        // Mettre à jour le nom de la version
        const savedProjectVersions = localStorage.getItem(STORAGE_KEYS.PROJECT_VERSIONS);
        if (savedProjectVersions) {
          try {
            const versions = JSON.parse(savedProjectVersions);
            const version = versions.find((v: any) => v.id === storedVersion);
            if (version) {
              setVersionName(version.name);
            }
          } catch (error) {
            console.error("Erreur lors du parsing des versions:", error);
          }
        }
        
        // Forcer un rafraîchissement du contenu
        processLocalStorageDataWithVersion(storedVersion);
      }
    };
    
    // Vérifier toutes les 2 secondes
    const intervalId = setInterval(checkVersionChange, 2000);
    
    // Nettoyer l'intervalle au démontage
    return () => clearInterval(intervalId);
  }, []);
  
  // Nouvelle fonction pour traiter les données avec une version spécifique
  const processLocalStorageDataWithVersion = useCallback((versionId: string) => {
    console.log(`🔄 Traitement des données pour la version: ${versionId}`);
    
    // Obtenir les clés spécifiques à la version
    const versionKeys = getVersionStorageKeys(versionId);
    
    // Charger les données depuis localStorage
    const savedTreeData = localStorage.getItem(versionKeys.TREE_DATA);
    const savedChapterText = localStorage.getItem(versionKeys.CHAPTER_TEXT);
    
    if (!savedTreeData || !savedChapterText) {
      console.log("⚠️ Données manquantes pour cette version");
      return;
    }
    
    try {
      const parsedTreeData = JSON.parse(savedTreeData);
      const parsedChapterText = JSON.parse(savedChapterText);
      
      // Traiter les données chargées
      const flatNodes = flattenTreeNodes(parsedTreeData);
      const extractedChapters: Chapter[] = flatNodes.map(node => ({
        id: node.key,
        num: node.num,
        label: node.label,
        parentId: node.parentId || null,
        content: parsedChapterText[node.key] || ''
      }));
      
      // Trier les chapitres
      const sortedChapters = sortChapters(extractedChapters);
      setChapters(sortedChapters);
      
      // Générer le contenu combiné
      const newContent = generateCombinedContent(sortedChapters);
      setCombinedContent(newContent);
      
      // Mettre à jour l'éditeur si disponible
      if (editor) {
        editor.commands.setContent(newContent);
      }
      
      // Mettre à jour la date de dernière vérification
      setLastUpdateCheck(Date.now());
      
      console.log("🔄 Mise à jour du contenu terminée");
    } catch (error) {
      console.error("Erreur lors du traitement des données:", error);
    }
  }, [editor]);

  // Fonction pour forcer le rechargement depuis localStorage
  const forceReloadFromLocalStorage = useCallback(() => {
    try {
      // Activer le flag pour éviter les sauvegardes pendant le rechargement forcé
      forceUpdateRef.current = true;
      
      // Récupérer la version courante directement depuis localStorage
      const storedVersion = localStorage.getItem(STORAGE_KEYS.CURRENT_VERSION);
      if (!storedVersion) {
        console.log("⚠️ Aucune version trouvée dans localStorage");
        forceUpdateRef.current = false;
        return;
      }
      
      // Mettre à jour le nom de la version
      const savedProjectVersions = localStorage.getItem(STORAGE_KEYS.PROJECT_VERSIONS);
      if (savedProjectVersions) {
        try {
          const versions = JSON.parse(savedProjectVersions);
          const version = versions.find((v: any) => v.id === storedVersion);
          if (version) {
            setVersionName(version.name);
          } else {
            setVersionName('Version inconnue');
          }
        } catch (error) {
          console.error("Erreur lors du parsing des versions:", error);
        }
      }
      
      processLocalStorageDataWithVersion(storedVersion);
      
      // Nettoyer le flag après un court délai
      setTimeout(() => {
        forceUpdateRef.current = false;
      }, 500);
    } catch (error) {
      console.error("Erreur lors du rechargement des données:", error);
      forceUpdateRef.current = false;
    }
  }, [processLocalStorageDataWithVersion]);
  
  console.log("🚀 SummarySpecifications: Payload reçu depuis localStorage:", {
    treeData,
    chapterTextMap
  });
  
  // Effet pour charger les données une seule fois au montage du composant
  useEffect(() => {
    // Charger les données immédiatement au montage du composant
    console.log("Chargement initial des données");
    forceReloadFromLocalStorage();
    
    // Nettoyer les timeouts à la destruction du composant
    return () => {
      if (editorUpdateTimeout.current) {
        clearTimeout(editorUpdateTimeout.current);
        editorUpdateTimeout.current = null;
      }
      if (contentUpdateTimeout.current) {
        clearTimeout(contentUpdateTimeout.current);
        contentUpdateTimeout.current = null;
      }
    };
  }, [forceReloadFromLocalStorage]);

  // Mise à jour lors de changements dans localStorage (pour synchronisation entre onglets/fenêtres)
  useEffect(() => {
    // Fonction pour gérer les événements de changement dans localStorage
    const handleStorageChange = (event: StorageEvent) => {
      // Vérifier toutes les clés pertinentes
      if (event.key === STORAGE_KEYS.TREE_DATA || event.key === STORAGE_KEYS.CHAPTER_TEXT) {
        console.log(`Changement détecté dans localStorage pour ${event.key}`);
        forceReloadFromLocalStorage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [forceReloadFromLocalStorage]);

  const processLocalStorageData = () => {
    // Convertir les données du localStorage au format attendu par le composant
    const flatNodes = flattenTreeNodes(treeData);
    
    // Vérifier s'il y a des nouveaux chapitres sans contenu et les initialiser
    let updatedChapterTextMap = { ...chapterTextMap };
    let hasNewChapters = false;
    
    flatNodes.forEach(node => {
      if (!updatedChapterTextMap[node.key] || updatedChapterTextMap[node.key].trim() === '') {
        console.log(`Initialisation du contenu pour le nouveau chapitre: ${node.num} - ${node.label}`);
        updatedChapterTextMap[node.key] = '<p><em>Contenu du chapitre à compléter...</em></p>';
        hasNewChapters = true;
      }
    });
    
    // Si des nouveaux chapitres ont été détectés, mettre à jour le chapterTextMap
    if (hasNewChapters) {
      updateChapterTextMap(updatedChapterTextMap);
    }
    
    // Créer des objets chapitre avec leur contenu
    const extractedChapters: Chapter[] = flatNodes.map(node => ({
      id: node.key,
      num: node.num,
      label: node.label,
      parentId: node.parentId || null,
      content: updatedChapterTextMap[node.key] || '<p><em>Contenu du chapitre à compléter...</em></p>'
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

  // Extraire et sauvegarder le contenu des chapitres
  const extractAndSaveContent = (editorContent: string) => {
    if (!editor || !chapters || chapters.length === 0) return;
    
    console.log("Extraction et sauvegarde du contenu des chapitres...");
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(editorContent, 'text/html');
    
    // Créer une map mise à jour pour stocker les contenus des chapitres
    const updatedChapterTextMap = { ...chapterTextMap };
    
    // Trouver tous les titres pour délimiter les sections de chapitres
    const headings = Array.from(doc.querySelectorAll('h1, h2'));
    
    headings.forEach((heading, index) => {
      const text = heading.textContent || '';
      const match = text.match(/^([\d\.]+)\s*-\s*(.+)$/);
      
      if (match) {
        const chapterNum = match[1].trim();
        
        // Trouver le chapitre correspondant
        const chapter = chapters.find(c => c.num === chapterNum);
        
        if (chapter) {
          // Récupérer tout le contenu jusqu'au prochain titre ou la fin
          let content = [];
          let currentNode = heading.nextSibling;
          
          // Continuer jusqu'au prochain titre ou jusqu'à la fin
          while (currentNode && 
                 !(currentNode instanceof HTMLElement && 
                  (currentNode.tagName === 'H1' || currentNode.tagName === 'H2'))) {
            
            if (currentNode.nodeType === Node.ELEMENT_NODE && 
                (currentNode as HTMLElement).tagName !== 'HR') {
              content.push((currentNode as HTMLElement).outerHTML);
            }
            
            // Passer au nœud suivant
            currentNode = currentNode.nextSibling;
          }
          
          // Sauvegarder le contenu pour ce chapitre
          if (content.length > 0) {
            updatedChapterTextMap[chapter.id] = content.join('');
          } else {
            // Si pas de contenu, mettre un contenu vide
            updatedChapterTextMap[chapter.id] = '<p><em>Contenu à compléter...</em></p>';
          }
        }
      }
    });
    
    // Mettre à jour le chapterTextMap dans localStorage
    updateChapterTextMap(updatedChapterTextMap);
    console.log("Contenu des chapitres sauvegardé");
  };

  // Fonction pour extraire les titres depuis l'éditeur (modification désactivée)
  const extractChapterTitles = (editorContent: string) => {
    // Fonctionnalité de modification des titres depuis le récap vers métré désactivée
    if (!editor) return;
    
    // On garde le parsing pour la vérification mais on n'effectue pas de mise à jour
    const parser = new DOMParser();
    const doc = parser.parseFromString(editorContent, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h1, h2'));
    
    // Parcourir les titres pour traitement interne uniquement
    headings.forEach(heading => {
      const text = heading.textContent || '';
      // Vérifier que le format est correct
      const match = text.match(/^([\d\.]+)\s*-\s*(.+)$/);
      // Aucune mise à jour du nœud dans l'arborescence effectuée
    });
  };

  // Vérifier et restaurer les titres de chapitres s'ils sont supprimés
  useEffect(() => {
    if (!editor || !chapters || chapters.length === 0) return;

    // Cette fonction vérifie que tous les titres de chapitres sont présents
    const checkChapterHeadings = () => {
      const content = editor.getHTML();
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      // Obtenir tous les titres h1 et h2 du document
      const headings = Array.from(doc.querySelectorAll('h1, h2'));
      
      // Si le nombre de titres est inférieur au nombre de chapitres, 
      // c'est qu'un titre a été supprimé
      if (headings.length < chapters.length) {
        console.warn('🚨 Un titre de chapitre a été supprimé. Restauration du contenu...');
        
        // Regénérer le contenu combiné
        const combined = generateCombinedContent(chapters);
        
        // Utiliser setTimeout pour éviter les conflits avec d'autres mises à jour
        setTimeout(() => {
          editor.commands.setContent(combined);
          
          // Notifier l'utilisateur
          alert('Attention: Les titres de chapitres ne peuvent pas être supprimés. Le contenu a été restauré.');
        }, 10);
      }
    };

    // Vérifier après chaque mise à jour du contenu
    editor.on('update', checkChapterHeadings);
    
    return () => {
      editor.off('update', checkChapterHeadings);
    };
  }, [editor, chapters, generateCombinedContent]);

  if (loading) {
    return <div className="text-center py-8">Chargement des données...</div>;
  }

  if (treeData.length === 0) {
    return <div className="text-center py-8 text-red-500">Aucune donnée disponible. Veuillez d'abord compléter les données dans la section Métré.</div>;
  }

  return (
    <div className="specifications-summary bg-[#FAFBFD] print:bg-white">
      <div className="print:hidden flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div>
            {editor && <Toolbar disablePrint={false} directEditor={editor} />}
          </div>
          <div className="flex gap-2 items-center">
            {versionName && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                Phase active: {versionName}
              </span>
            )}
            <button 
              onClick={forceReloadFromLocalStorage}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1"
              title="Rafraîchir le contenu"
            >
              <span>↻</span> Rafraîchir
            </button>
            <ExportButtons />
          </div>
        </div>
        <div className="bg-yellow-100 p-2 rounded text-sm mb-2 border border-yellow-300">
          <strong>Note:</strong> Les titres des chapitres ne peuvent pas être modifiés depuis le récap. Pour modifier un titre, veuillez utiliser la section Métré.
        </div>
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
