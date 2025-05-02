import { create } from "zustand";
import { Editor } from "@tiptap/react"

interface EditorState {
    editor: Editor | null;
    setEditor: (editor: Editor | null) => void;
    lastUpdated: number;
};

export const useEditorStore = create<EditorState>((set) => ({
    editor: null,
    lastUpdated: 0,
    setEditor: (editor) => set({ 
        editor, 
        lastUpdated: Date.now() // Forcera une mise à jour dans les composants qui dépendent de ce store
    }),
}))