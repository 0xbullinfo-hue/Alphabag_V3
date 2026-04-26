import { useState, useCallback } from 'react';

const STORAGE_KEY = 'alphabag_cex_connections';

export interface CexConnection {
    id: string;
    name: string;
    icon: string;
    apiKey: string;
    balance: number;
    isConnected: boolean;
}

export function useCexConnections() {
    const [connections, setConnections] = useState<CexConnection[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const save = useCallback((updated: CexConnection[]) => {
        setConnections(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, []);

    const addConnection = useCallback((conn: CexConnection) => {
        setConnections(prev => {
            const updated = [...prev.filter(c => c.id !== conn.id), conn];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const removeConnection = useCallback((id: string) => {
        setConnections(prev => {
            const updated = prev.filter(c => c.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const totalBalance = connections.reduce((acc, c) => acc + c.balance, 0);

    return { connections, addConnection, removeConnection, totalBalance };
}
