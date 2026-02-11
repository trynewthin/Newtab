import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PaperDocument {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

interface PaperState {
    documents: PaperDocument[];
    activeDocumentId: string | null;

    // Actions
    createDocument: (title?: string) => string;
    updateDocument: (id: string, updates: Partial<Pick<PaperDocument, 'title' | 'content'>>) => void;
    deleteDocument: (id: string) => void;
    setActiveDocument: (id: string | null) => void;
    getActiveDocument: () => PaperDocument | null;
}

export const usePaperStore = create<PaperState>()(
    persist(
        (set, get) => ({
            documents: [],
            activeDocumentId: null,

            createDocument: (title = 'Untitled') => {
                const newDoc: PaperDocument = {
                    id: `paper-${Date.now()}`,
                    title,
                    content: '',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };
                set((state) => ({
                    documents: [newDoc, ...state.documents],
                    activeDocumentId: newDoc.id,
                }));
                return newDoc.id;
            },

            updateDocument: (id, updates) => {
                set((state) => ({
                    documents: state.documents.map((doc) =>
                        doc.id === id
                            ? { ...doc, ...updates, updatedAt: Date.now() }
                            : doc
                    ),
                }));
            },

            deleteDocument: (id) => {
                set((state) => {
                    const newDocs = state.documents.filter((doc) => doc.id !== id);
                    return {
                        documents: newDocs,
                        activeDocumentId:
                            state.activeDocumentId === id
                                ? newDocs[0]?.id || null
                                : state.activeDocumentId,
                    };
                });
            },

            setActiveDocument: (id) => {
                set({ activeDocumentId: id });
            },

            getActiveDocument: () => {
                const state = get();
                return state.documents.find((doc) => doc.id === state.activeDocumentId) || null;
            },
        }),
        {
            name: 'paper-storage',
        }
    )
);
