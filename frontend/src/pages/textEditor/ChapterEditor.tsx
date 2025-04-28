import { useState } from 'react';
import MetreTable from '../metre/MetreTable';
import { useEditor, EditorContent } from '@tiptap/react'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import ImageResize from "tiptap-extension-resize-image"
import Underline from '@tiptap/extension-underline'
import FontFamily from '@tiptap/extension-font-family'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Toolbar from './Toolbar'
import './ChapterEditor.css'
import { useEditorStore } from "@/store/use-editor-store"
import { FontSizeExtension } from '@/extensions/font-size'
import { LineHeightExtension } from '@/extensions/line-height'
import { Ruler } from './Ruler'

interface ChapterEditorProps {
  tableKey: string;
  tableData: any[][];
  onTableChange: (data: any[][]) => void;
  detailDataMap: Record<string, any[][]>;
  setDetailDataMap: React.Dispatch<React.SetStateAction<Record<string, any[][]>>>;
  chapterNotes: Record<string, string>;
  setChapterNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  disablePrint?: boolean;
}

export default function ChapterEditor({
  tableKey,
  tableData,
  onTableChange,
  detailDataMap,
  setDetailDataMap,
  chapterNotes,
  setChapterNotes,
  disablePrint = false
}: ChapterEditorProps) {
  const { setEditor } = useEditorStore();
  const [leftMargin, setLeftMargin] = useState(75);
  const [rightMargin, setRightMargin] = useState(75);

  const editor = useEditor({
    immediatelyRender: false,
    onCreate({ editor }) {
      setEditor(editor);
    },
    onDestroy() {
      setEditor(null);
    },
    onUpdate({ editor }) {
      setEditor(editor);
      const content = editor.getHTML();
      setChapterNotes(prev => ({ ...prev, [tableKey]: content }));
    },
    onSelectionUpdate({ editor }) {
      setEditor(editor);
      const { state } = editor;
      const { selection } = state;
      const { $from, $to } = selection;
      console.log("Selection updated:", $from.pos, $to.pos);
    },
    onTransaction({ editor }) {
      setEditor(editor);
    },
    onFocus({ editor }) {
      setEditor(editor);
    },
    onBlur({ editor }) {
      setEditor(editor);
    },
    editorProps: {
      attributes: {
        style: `padding-left: ${leftMargin}px; padding-right: ${rightMargin}px;`,
        class: "focus:outline-none print:border-0 bg-white border border-[#C7C7C7] flex flex-col min-h-[1054px] w-[816px] pt-10 pr-14 pb-10 cursor-text",
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
    content: chapterNotes[tableKey] || `
      <h4>DESCRIPTION</h4>
      <h5>- Définition / Comprend</h5>
      <p></p>
      <h5>- Remarques importantes</h5>
      <p></p>
      <h4>MATÉRIAUX</h4>
      <p></p>
      <h4>EXÉCUTION / MISE EN ŒUVRE</h4>
      <p></p>
      <h4>CONTRÔLE</h4>
      <p></p>
      <h4>DOCUMENTS DE RÉFÉRENCE</h4>
      <h5>- Matériau</h5>
      <p></p>
      <h5>- Exécution</h5>
      <p></p>
      <h4>PRÉSCRIPTION SPÉCIALES</h4>
      <h5>- Divers</h5>
      <p></p>
      <h4>AIDE</h4>
      <p></p>
      <h4>A CLASSER</h4>
      <p></p>
      <h4>MESURAGE</h4>
      <h5>- unité de mesure: </h5>
      <h5>- code de mesurage: </h5>
      <h5>- nature du marché: </h5>
    `,
  })

  return (
    <div className='min-h-screen bg-[#FAFBFD] print:bg-white'>
      <div className="print:hidden">
        <Toolbar disablePrint={disablePrint} />
      </div>
      <div className='size-full overflow-x-auto bg-[#F9FBFD] px-4 print:p-0 print:bg-white print:overflow-visible'>
        <div className="print:hidden pb-4">
          <Ruler
            onMarginsChange={(left, right) => {
              setLeftMargin(left);
              setRightMargin(right);
            }}
          />
        </div>
        <div className='min-w-max flex justify-center w-[816px] py-4 print:py-0 mx-auto print:w-full print:min-w-0'>
          <EditorContent editor={editor}/>
        </div>
      </div>
      <style>
        {`
          @media print {
            @page {
              margin: 0;
              size: A4;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}
      </style>
    </div>
  );
}
