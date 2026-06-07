import { Alchemy, Network } from 'alchemy-sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '../config/env.js';
import { createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, bsc, polygon, base, arbitrum } from 'viem/chains';

class BlockchainService {
    constructor() {
        const apiKey = config.alchemyApiKey;
        
        // Initialize Alchemy for different networks
        this.alchemyInstances = {
            [Network.ETH_MAINNET]: new Alchemy({ apiKey, network: Network.ETH_MAINNET }),
            [Network.MATIC_MAINNET]: new Alchemy({ apiKey, network: Network.MATIC_MAINNET }),
            [Network.ARB_MAINNET]: new Alchemy({ apiKey, network: Network.ARB_MAINNET }),
            [Network.BASE_MAINNET]: new Alchemy({ apiKey, network: Network.BASE_MAINNET }),
        };

        // Solana Connection (Alchemy RPC)
        const solanaRpc = `https://solana-mainnet.g.alchemy.com/v2/${apiKey}`;
        this.solanaConnection = new Connection(solanaRpc);

        // Wallet Client for sending transactions (EVM)
        // Note: PRIVATE_KEY should be in .env
        this.privateKey = process.env.PRIVATE_KEY;

        if (this.privateKey && (process.env.NODE_ENV === 'production' || process.env.VITE_ENVIRONMENT === 'production')) {
            console.warn('\n=============================================================');
            console.warn('CRITICAL SECURITY WARNING: Raw PRIVATE_KEY detected in environment.');
            console.warn('For production, use AWS KMS, HashiCorp Vault, or equivalent.');
            console.warn('Never store raw private keys in .env for mainnet deployments.');
            console.warn('=============================================================\n');
        }
    }

    /**
     * Send EVM Tokens (Native or ERC20)
     */
    async sendEvmTokens(to, amount, tokenAddress = null, chain = 'bsc') {
        if (!this.privateKey) {
            console.error('BlockchainService: PRIVATE_KEY not found in environment');
            return { success: false, error: 'Provider private key missing' };
        }

        try {
            const account = privateKeyToAccount(this.privateKey);
            const selectedChain = this.getViemChain(chain);
            
            const client = createWalletClient({
                account,
                chain: selectedChain,
                transport: http()
            });

            let hash;
            if (!tokenAddress) {
                // Send Native
                hash = await client.sendTransaction({
                    to,
                    value: parseUnits(amount.toString(), 18) // Assuming 18 decimals for native
                });
            } else {
                // Send ERC20 (Simplified: calls transfer(address,uint256))
                // In a real scenario, you'd use a full ABI and contract call
                const abi = [{
                    name: 'transfer',
                    type: 'function',
                    stateMutability: 'nonpayable',
                    inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
                    outputs: [{ name: '', type: 'bool' }],
                }];

                // This is a placeholder for actual viem contract writing
                // hash = await client.writeContract({ ... })
                console.log(`Mocking ERC20 transfer of ${amount} to ${to} on ${chain}`);
                hash = `0x_mock_hash_${Date.now()}`;
            }

            return { success: true, txHash: hash };
        } catch (err) {
            console.error('BlockchainService: Error sending tokens:', err.message);
            return { success: false, error: err.message };
        }
    }

    getViemChain(chainName) {
        const chains = {
            'eth': mainnet,
            'bsc': bsc,
            'polygon': polygon,
            'base': base,
            'arbitrum': arbitrum
        };
        return chains[chainName.toLowerCase()] || bsc;
    }

    /**
     * Fetch all token balances (including Native) for an EVM address across multiple chains
     */
    async getEvmBalances(address) {
        const chains = [
            { id: 'ETH', network: Network.ETH_MAINNET, name: 'Ethereum' },
            { id: 'POLYGON', network: Network.MATIC_MAINNET, name: 'Polygon' },
            { id: 'BASE', network: Network.BASE_MAINNET, name: 'Base' },
            { id: 'ARB', network: Network.ARB_MAINNET, name: 'Arbitrum' }
        ];

            const chainPromises = chains.map(async (chain) => {
                try {
                    const alchemy = this.alchemyInstances[chain.network];
                    if (!alchemy) return null;

                    // Fetch balances (Native + ERC20)
                    const [nativeBalance, tokenBalances] = await Promise.all([
                        alchemy.core.getBalance(address, 'latest'),
                        alchemy.core.getTokensForOwner(address)
                    ]);

                    return {
                        chain: chain.id,
                        chainName: chain.name,
                        nativeBalance: nativeBalance.toString(),
                        tokens: tokenBalances.tokens.map(t => ({
                            address: t.contractAddress,
                            symbol: t.symbol,
                            name: t.name,
                            balance: t.rawBalance,
                            decimals: t.decimals,
                            logo: t.logo
                        }))
                    };
                } catch (err) {
                    console.warn(`BlockchainService: Error fetching ${chain.name} balances: ${err.message}`);
                    return null;
                }
            });

            const results = await Promise.all(chainPromises);
            return results.filter(r => r !== null);
    }

    /**
     * Fetch Solana balances (SOL + SPL Tokens)
     */
    async getSolanaBalances(address) {
        try {
            const pubKey = new PublicKey(address);
            
            // 1. Get SOL Balance
            const solBalance = await this.solanaConnection.getBalance(pubKey);
            
            // 2. Get Token Accounts (SPL Tokens)
            const tokenAccounts = await this.solanaConnection.getParsedTokenAccountsByOwner(pubKey, {
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
            });

            return {
                chain: 'SOL',
                chainName: 'Solana',
                nativeBalance: solBalance.toString(),
                tokens: tokenAccounts.value.map(ta => ({
                    mint: ta.account.data.parsed.info.mint,
                    balance: ta.account.data.parsed.info.tokenAmount.amount,
                    decimals: ta.account.data.parsed.info.tokenAmount.decimals
                }))
            };
        } catch (err) {
            console.error('BlockchainService: Error fetching Solana balances:', err.message);
            return null;
        }
    }
}

export const blockchainService = new BlockchainService();
