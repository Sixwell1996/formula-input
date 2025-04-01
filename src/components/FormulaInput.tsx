import React, {
    useState,
    KeyboardEvent,
    ChangeEvent,
    useRef,
    useEffect,
} from 'react';
import {useFormulaStore} from '@/store/formulaStore';
import {useAutocomplete, Suggestion} from '@/hooks/useAutocomplete';

const delimiterRegex = /[+\-*/^() ]/;

const getCurrentQuery = (value: string): string => {
    let lastIndex = -1;
    for (let i = 0; i < value.length; i++) {
        if (delimiterRegex.test(value[i])) {
            lastIndex = i;
        }
    }
    return value.substring(lastIndex + 1);
};

const FormulaInput: React.FC = () => {
    const {tokens, addToken, removeToken, updateToken} = useFormulaStore();

    const [inputValue, setInputValue] = useState('');

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');

    const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
    const [tagQuery, setTagQuery] = useState('');

    const [result, setResult] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);


    const currentQuery = getCurrentQuery(inputValue);
    const {data: suggestions, isLoading} = useAutocomplete(currentQuery);


    const effectiveTagQuery = tagQuery.trim() === '' ? ' ' : tagQuery;
    const {data: tagSuggestions, isLoading: tagLoading} = useAutocomplete(effectiveTagQuery);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() !== '') {
            addToken({type: 'text', value: inputValue});
            setInputValue('');
            e.preventDefault();
            return;
        }
        if (e.key === 'Backspace' && inputValue === '') {
            if (tokens.length > 0) {
                removeToken(tokens.length - 1);
            }
            e.preventDefault();
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleSuggestionClick = (suggestion: Suggestion) => {
        const query = getCurrentQuery(inputValue);
        const prefix = inputValue.slice(0, inputValue.length - query.length);
        if (prefix.trim() !== '') {
            addToken({type: 'text', value: prefix});
        }
        addToken({type: 'tag', value: suggestion.value, display: suggestion.name});
        setInputValue('');
        inputRef.current?.focus();
    };

    const handleTokenEdit = (index: number) => {
        const token = tokens[index];
        if (token.type === 'text') {
            setEditingIndex(index);
            setEditingValue(token.value);
        }
    };

    const handleTagDropdownOpen = (index: number) => {
        setEditingTagIndex(index);
        setTagQuery('');
    };

    const handleTagSuggestionClick = (suggestion: Suggestion) => {
        if (editingTagIndex !== null) {
            updateToken(editingTagIndex, {type: 'tag', value: suggestion.value, display: suggestion.name});
            setEditingTagIndex(null);
            setTagQuery('');
        }
    };

    const handleTagDelete = () => {
        if (editingTagIndex !== null) {
            removeToken(editingTagIndex);
            setEditingTagIndex(null);
            setTagQuery('');
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.token-wrapper')) {
                setEditingTagIndex(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const renderTokensWithInput = () => {
        return (
            <>
                {tokens.map((token, index) => {
                    if (editingIndex === index && token.type === 'text') {
                        return (
                            <input
                                key={`edit-${index}`}
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => {
                                    updateToken(index, {type: 'text', value: editingValue});
                                    setEditingIndex(null);
                                    setEditingValue('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        updateToken(index, {type: 'text', value: editingValue});
                                        setEditingIndex(null);
                                        setEditingValue('');
                                    }
                                    if (e.key === 'Escape') {
                                        setEditingIndex(null);
                                        setEditingValue('');
                                    }
                                }}
                                className="min-w-[50px] outline-none p-1 mr-1"
                            />
                        );
                    } else if (token.type === 'tag') {
                        return (
                            <span
                                key={index}
                                className="token-wrapper inline-flex items-center rounded px-2 py-1 mr-1 bg-blue-200 text-blue-800 font-bold cursor-pointer relative"
                            >
                {token.display || token.value}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleTagDropdownOpen(index);
                                    }}
                                    className="ml-1 text-blue-600 focus:outline-none"
                                >
                  ⋮
                </button>
                                {editingTagIndex === index && (
                                    <div
                                        className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded shadow-md z-20 p-2 w-48 max-h-64 overflow-y-auto">
                                        <input
                                            type="text"
                                            value={tagQuery}
                                            onChange={(e) => setTagQuery(e.target.value)}
                                            placeholder="Search..."
                                            className="w-full p-1 border border-gray-300 rounded mb-1 outline-none"
                                        />
                                        {tagLoading ? (
                                            <div className="p-1">Loading...</div>
                                        ) : tagSuggestions && tagSuggestions.length > 0 ? (
                                            tagSuggestions.map((suggestion) => (
                                                <div
                                                    key={suggestion.id}
                                                    onClick={() => handleTagSuggestionClick(suggestion)}
                                                    className="p-1 cursor-pointer hover:bg-gray-100"
                                                >
                                                    <div>{suggestion.name}</div>
                                                    <div className="text-xs text-gray-500">{suggestion.category}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-1 text-gray-500 text-xs">No suggestions</div>
                                        )}
                                        <div
                                            onClick={handleTagDelete}
                                            className="p-1 mt-1 text-red-600 cursor-pointer hover:bg-red-100 text-center text-xs"
                                        >
                                            Delete Tag
                                        </div>
                                    </div>
                                )}
              </span>
                        );
                    } else {
                        return (
                            <span
                                key={index}
                                onClick={() => handleTokenEdit(index)}
                                className="mr-1 text-gray-800 cursor-pointer"
                            >
                {token.value}
              </span>
                        );
                    }
                })}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type formula..."
                    className="min-w-[50px] outline-none p-1"
                />
            </>
        );
    };

    const handleCalculate = () => {
        const allTokens = [...tokens];
        if (inputValue.trim() !== '') {
            allTokens.push({type: 'text', value: inputValue});
        }
        const formulaString = allTokens.map((t) => t.value).join(' ');
        try {
            const dummyContext = {
                Date: 100,
                abs: Math.abs,
                ceil: Math.ceil,
            };
            const calcFunc = new Function(
                ...Object.keys(dummyContext),
                `return (${formulaString});`
            );
            const calcResult = calcFunc(...Object.values(dummyContext));
            setResult(calcResult.toString());
        } catch (error) {
            setResult('Error');
        }
    };

    return (
        <div className="mx-auto max-w-[1000px] p-4">
            <div className="relative">
                <div className="border border-gray-300 bg-white rounded p-2 flex flex-wrap items-center">
                    {renderTokensWithInput()}
                </div>
                {currentQuery && suggestions && suggestions.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full max-w-xl border border-gray-300 bg-white rounded shadow-md max-h-64 overflow-y-auto">
                        {isLoading ? (
                            <li className="p-2">Loading...</li>
                        ) : (
                            suggestions.map((suggestion) => (
                                <li
                                    key={suggestion.id}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                >
                                    <div>{suggestion.name}</div>
                                    <div className="text-xs text-gray-500">{suggestion.category}</div>
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>
            <div className="mt-4 text-center">
                <button
                    onClick={handleCalculate}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Calculate
                </button>
                {result && (
                    <div className="mt-2 text-lg font-bold text-green-700">
                        Result: {result}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormulaInput;
