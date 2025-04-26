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
import { useState } from 'react'


export default function ChapterEditorSandbox() {
    const { setEditor } = useEditorStore();

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
        onContentError({ editor }) {
            setEditor(editor);
        },
        editorProps:{
            attributes: {
                // style: `padding-left: ${leftMargin}px; padding-right: ${rightMargin}px;`,
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
        content: `
           <h1>Hello World</h1>
        `,
    })

    return (
        <div className='min-h-screen bg-[#FAFBFD] print:bg-white'>
            <div className="print:hidden">
                <Toolbar></Toolbar>
            </div>
            <div className='size-full overflow-x-auto bg-[#F9FBFD] px-4 print:p-0 print:bg-white print:overflow-visible'>
                <div className="print:hidden pb-4">
                    <Ruler
                        onMarginsChange={(left, right) => {
                            setLeftMargin(left);
                            setRightMargin(right);
                            // Mettre à jour le style CSS dynamiquement
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
                            // Supprimer l'ancien style s'il existe
                            const oldStyle = document.getElementById('dynamic-margins');
                            if (oldStyle) {
                                oldStyle.remove();
                            }
                            style.id = 'dynamic-margins';
                            document.head.appendChild(style);
                        }}
                    />
                </div>
                <div className='min-w-max flex justify-center w-[816px] print:py-0 mx-auto print:w-full print:min-w-0'>
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
