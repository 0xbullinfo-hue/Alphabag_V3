import React from 'react';
import { Assets } from './Assets';

// Reusing the logic from Assets logic but wrapping it as DexBag for coolness
// In a full refactor, we would move the logic here, but importing it works to keep diff small
import { RefreshCw } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

export const DexBag: React.FC = () => {
    const { refreshBalances, isSyncing } = useWallet();

    return (
        <div className="animate-fade-in relative">
            <Assets onSync={refreshBalances} isSyncing={isSyncing} />
        </div>
    );
};
