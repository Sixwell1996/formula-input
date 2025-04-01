import { create } from 'zustand';

export type TokenType = 'text' | 'number' | 'operand' | 'tag';

export interface Token {
    type: TokenType;
    value: string;
    display?: string;
}

interface FormulaStore {
    tokens: Token[];
    addToken: (token: Token) => void;
    insertToken: (index: number, token: Token) => void;
    removeToken: (index: number) => void;
    updateToken: (index: number, token: Token) => void;
    resetTokens: () => void;
}

export const useFormulaStore = create<FormulaStore>((set) => ({
    tokens: [],
    addToken: (token) => set((state) => ({ tokens: [...state.tokens, token] })),
    insertToken: (index, token) =>
        set((state) => {
            const newTokens = [...state.tokens];
            newTokens.splice(index, 0, token);
            return { tokens: newTokens };
        }),
    removeToken: (index) =>
        set((state) => ({
            tokens: state.tokens.filter((_, i) => i !== index),
        })),
    updateToken: (index, token) =>
        set((state) => ({
            tokens: state.tokens.map((t, i) => (i === index ? token : t)),
        })),
    resetTokens: () => set({ tokens: [] }),
}));
