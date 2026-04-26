
import axios from 'axios';
import { store } from './storeService.js';

export const getTelegramSettings = async () => {
    const settings = await store.read('admin_settings');
    // Assuming settings are stored as an array, or a single object. 
    // Let's assume store.read returns an array for consistency with other collections, 
    // or we might need to adjust based on how we save 'settings'. 
    // For 'admin_settings', it's likely a single config object or a list of configs.
    // Let's assume it's a list and we take the first one, or use findOne.

    // Actually, storeService.read returns the whole JSON content. 
    // If we save it as a list, we take the first item.
    // If admin_settings.json doesn't exist, store.read returns [].

    if (Array.isArray(settings) && settings.length > 0) {
        return settings[0];
    }
    return null;
};

export const sendTelegramMessage = async (text) => {
    try {
        const settings = await getTelegramSettings();

        if (!settings || !settings.telegramBotToken || !settings.telegramChatId) {
            console.warn('[Telegram] Configuration missing. Message not sent.');
            return false;
        }

        const { telegramBotToken, telegramChatId } = settings;
        const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

        await axios.post(url, {
            chat_id: telegramChatId,
            text: text,
            parse_mode: 'Markdown' // or 'HTML'
        });

        console.log('[Telegram] Message sent successfully.');
        return true;
    } catch (error) {
        console.error('[Telegram] Failed to send message:', error.message);
        return false;
    }
};

export const formatWhaleAlert = (whale, tx) => {
    // tx object structure depends on the API (Nansen/Etherscan/etc)
    // This is a generic formatter

    // Example Tx Object:
    // { symbol: 'ETH', value: 1000, usd_value: 2500000, to_address: '0x...', from_address: '0x...' }

    const shortAddr = (addr) => addr ? `${addr.substr(0, 6)}...${addr.substr(-4)}` : 'Unknown';
    const direction = tx.to_address.toLowerCase() === whale.address.toLowerCase() ? '📥 INFLOW' : '📤 OUTFLOW';
    const whaleName = whale.name || shortAddr(whale.address);

    return `
🚨 **WHALE ALERT** 🚨

**${whaleName}** just moved funds!

${direction}
💰 **Amount**: ${parseFloat(tx.value).toLocaleString()} ${tx.symbol}
💵 **Value**: $${parseFloat(tx.usd_value).toLocaleString()}

🔗 [View on Etherscan](https://etherscan.io/tx/${tx.hash})

_AlphaBAG Whale Watch_ 🐋
`;
};
