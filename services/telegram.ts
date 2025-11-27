export const sendTelegramMessage = async (name: string, email: string, message: string): Promise<boolean> => {
    // In a real production app, using server-side proxy is better to hide the token.
    // For this demo, we use the token directly as requested.
    const BOT_TOKEN = "8536926751:AAFbT61rmpanQ_UN14LZFVBjDK9On-V_b8k";
    const CHAT_ID = "1177802716";

    const text = `
🔥 *NEW ORDER INQUIRY* 🔥
    
👤 *Name:* ${name}
📧 *Email:* ${email}
    
📝 *Message:*
${message}
    `;

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: text,
                parse_mode: 'Markdown',
            }),
        });

        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error("Telegram Error:", error);
        return false;
    }
};