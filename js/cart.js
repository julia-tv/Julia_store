const crypto = require('crypto');

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // Якщо даних немає (наприклад, просто зайшли в браузер), не видаємо помилку 500
        if (!req.body || !req.body.amount) {
            return res.status(200).json({ message: "API працює, чекаю на POST запит" });
        }

        const { amount, currency, productName, productCount, productPrice } = req.body;
        const MERCHANT_ACCOUNT = process.env.WFP_ACCOUNT || "test_merch_n1";
        const MERCHANT_SECRET_KEY = process.env.WFP_SECRET || "flk3409refn54t54t*FNJRET";
        const DOMAIN_NAME = "julia-tv.github.io"; 

        const orderReference = "ORD_" + Date.now();
        const orderDate = Math.floor(Date.now() / 1000);

        const stringToSign = [
            MERCHANT_ACCOUNT,
            DOMAIN_NAME,
            orderReference,
            orderDate,
            amount,
            currency,
            productName.join(';'),
            productCount.join(';'),
            productPrice.join(';')
        ].join(';');

        const signature = crypto
            .createHmac('md5', MERCHANT_SECRET_KEY)
            .update(stringToSign, 'utf8')
            .digest('hex');

        res.status(200).json({
            signature,
            orderReference,
            orderDate,
            merchantAccount: MERCHANT_ACCOUNT,
            merchantDomainName: DOMAIN_NAME
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
