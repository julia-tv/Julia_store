export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, phone, delivery, total, products } = req.body;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('Missing Telegram env vars');
    return res.status(500).json({ error: 'Config missing' });
  }

  const text = `
Нове замовлення!
Ім'я: ${name || 'Не вказано'}
Телефон: ${phone || 'Не вказано'}
Доставка: ${delivery || 'Не вказано'}
Сума: ${total} грн
Товари:
${products?.map(p => `- ${p.title} × ${p.qty} = ${p.qty * p.price} грн`).join('\n') || 'Немає товарів'}
  `.trim();

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      }
    );

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      throw new Error(tgData.description || 'Telegram API error');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Telegram send error:', error);
    res.status(500).json({ error: 'Failed to notify' });
  }
}
