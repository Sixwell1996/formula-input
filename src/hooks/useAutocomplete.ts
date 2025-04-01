import { useQuery } from 'react-query';

export interface Suggestion {
    id: string;
    name: string;
    category: string;
    value: string;
}

const fetchSuggestions = async (input: string): Promise<Suggestion[]> => {
    if (!input) return [];
    const response = await fetch(
        `https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete?query=${encodeURIComponent(input)}`
    );
    if (!response.ok) {
        throw new Error("Error fetching suggestions");
    }
    return response.json();
};

export const useAutocomplete = (input: string) => {
    return useQuery<Suggestion[], Error>(
        ['autocomplete', input],
        () => fetchSuggestions(input),
        { enabled: !!input, staleTime: 60000 }
    );
};
