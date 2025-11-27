import { QueryClient } from '@tanstack/react-query';
import { Persister } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

// Create a custom persister using idb-keyval
export const createIDBPersister = (idbValidKey: IDBValidKey = 'reactQuery'): Persister => {
    return {
        persistClient: async (client) => {
            await set(idbValidKey, client);
        },
        restoreClient: async () => {
            return await get(idbValidKey);
        },
        removeClient: async () => {
            await del(idbValidKey);
        },
    } as Persister;
};

// Configure the QueryClient
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (formerly cacheTime)
            staleTime: 1000 * 60 * 60 * 24, // 24 hours (data is considered fresh for 1 day)
            retry: 1,
        },
    },
});

export const persister = createIDBPersister();
