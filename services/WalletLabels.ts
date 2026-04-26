
// Known Exchange and Protocol Addresses (Mock/Static list for PoC)
// In a real app, this would query a backend or a large dataset (e.g. from Etherscan/Nansen)

const KNOWN_LABELS: Record<string, { name: string; type: 'CEX' | 'DEX' | 'WHALE' | 'UNKNOWN', color: string }> = {
    // Binance
    '0x28c6c06298d514db089934071355e5743bf21d60': { name: 'Binance Hot Wallet 6', type: 'CEX', color: '#FCD535' },
    '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { name: 'Binance Hot Wallet 7', type: 'CEX', color: '#FCD535' },
    '0x4f3a12066530109f54358597426af5ef747e7049': { name: 'Binance 8', type: 'CEX', color: '#FCD535' },
    '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': { name: 'Binance 14', type: 'CEX', color: '#FCD535' },

    // Coinbase
    '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { name: 'Coinbase Hot Wallet', type: 'CEX', color: '#0052FF' },
    '0x503828976d22510aad0201ac7ec88293211d23da': { name: 'Coinbase 2', type: 'CEX', color: '#0052FF' },

    // Crypto.com
    '0x6262998ced04146fa42253a5c0af90ca02dfd2a3': { name: 'Crypto.com', type: 'CEX', color: '#1199FA' },

    // DeFi / Bridges
    '0x0000000000000000000000000000000000000000': { name: 'Null Address', type: 'UNKNOWN', color: '#6B7280' },
    '0x8797b53f0907d61b3699c60662d08a5da54f0a20': { name: 'StarkNet Core Bridge', type: 'DEX', color: '#6366F1' },

    // Vitalik (Example Whale)
    '0xd8da6bf26964af9d7eed9e03e53415d37aa96045': { name: 'Vitalik Buterin', type: 'WHALE', color: '#8B5CF6' }
};

export const WalletLabels = {
    getLabel: (address: string) => {
        const lowerAddr = address.toLowerCase();
        return KNOWN_LABELS[lowerAddr] || null;
    },

    formatAddress: (address: string, slice = 4) => {
        const label = KNOWN_LABELS[address.toLowerCase()];
        if (label) return label.name;
        return `${address.slice(0, slice)}...${address.slice(-slice)}`;
    },

    getType: (address: string) => {
        const label = KNOWN_LABELS[address.toLowerCase()];
        return label ? label.type : 'UNKNOWN';
    }
};
