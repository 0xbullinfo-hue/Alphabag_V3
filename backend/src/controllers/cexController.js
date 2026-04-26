
import ccxt from 'ccxt';

export const getBalance = async (req, res) => {
    const { exchangeId, apiKey, secret } = req.body;

    try {
        if (!ccxt[exchangeId]) {
            return res.status(400).json({ error: 'Exchange not supported' });
        }

        const exchangeClass = ccxt[exchangeId];
        const exchange = new exchangeClass({
            apiKey: apiKey,
            secret: secret,
            enableRateLimit: true,
        });

        const balance = await exchange.fetchTotalBalance();

        const relevantBalances = {};
        for (const [currency, amount] of Object.entries(balance)) {
            if (amount > 0) relevantBalances[currency] = amount;
        }

        res.json({
            success: true,
            balances: relevantBalances,
            raw: balance
        });

    } catch (error) {
        console.error(`CEX Error (${exchangeId}):`, error.message);
        res.status(500).json({ error: `Connection failed: ${error.message}` });
    }
};
