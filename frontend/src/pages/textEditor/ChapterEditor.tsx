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
import { CustomPaginationExtension } from '@/extensions/custom-pagination'
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
  const [activeTab, setActiveTab] = useState<'tableur' | 'notes'>('tableur');
  const [leftMargin, setLeftMargin] = useState(56);
  const [rightMargin, setRightMargin] = useState(56);

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
        class: "focus:outline-none print:border-0 bg-white",
      }
    },
    extensions: [
      StarterKit,
      CustomPaginationExtension,
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
    content: chapterNotes[tableKey] || '',
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('tableur')}
          style={{ fontWeight: activeTab === 'tableur' ? 'bold' : 'normal' }}
        >
          📊 Tableur
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          style={{ fontWeight: activeTab === 'notes' ? 'bold' : 'normal' }}
        >
          📄 Cahier des charges
        </button>
      </div>

      {activeTab === 'tableur' ? (
        <MetreTable
          key={tableKey}
          tableKey={tableKey}
          data={tableData}
          onDataChange={onTableChange}
          detailDataMap={detailDataMap}
          setDetailDataMap={setDetailDataMap}
        />
      ) : (
        <div className={`min-h-screen bg-[#FAFBFD] ${disablePrint ? 'print:hidden' : 'print:bg-white'}`}>
          <div className="print:hidden">
            <Toolbar disablePrint={disablePrint} />
          </div>
          <div className='size-full overflow-x-auto bg-[#F9FBFD] px-4 print:p-0 print:bg-white print:overflow-visible'>
            {!disablePrint && (
              <div className="print:hidden pb-4">
                <Ruler
                  onMarginsChange={(left, right) => {
                    setLeftMargin(left);
                    setRightMargin(right);
                    const style = document.createElement('style');
                    style.textContent = `
                      [data-page-body="true"] {
                        padding: 0px ${right}px 0px ${left}px !important;
                      }
                      @media print {
                        [data-page-body="true"] {
                          padding: 0px ${right}px 0px ${left}px !important;
                        }
                      }
                    `;
                    const oldStyle = document.getElementById('dynamic-margins');
                    if (oldStyle) {
                      oldStyle.remove();
                    }
                    style.id = 'dynamic-margins';
                    document.head.appendChild(style);
                  }}
                />
              </div>
            )}
            <div className='min-w-max flex justify-center w-[816px] print:py-0 mx-auto print:w-full print:min-w-0'>
              <EditorContent editor={editor}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
