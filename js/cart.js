/* ==========================
   CART STATE & UI
========================== */
let cart = JSON.parse(localStorage.getItem('cart')) || [];

window.updateCartUI = function() {
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    const totalSum = cart.reduce((s, i) => s + i.qty * i.price, 0);

    // Оновлення лічильників у всіх місцях
    const counts = ["cart-count-header", "cart-count-mobile", "cart-count-badge"];
    counts.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = totalQty;
    });

    const list = document.getElementById("cart-items-list");
    const sumEl = document.getElementById("cart-total-sum");

    if (list) {
        if (cart.length === 0) {
            list.innerHTML = "<p style='text-align:center; padding: 20px;'>Кошик порожній</p>";
        } else {
            list.innerHTML = cart.map((item, idx) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee">
                    <div style="flex: 1;">
                        <div style="font-weight:bold; font-size: 14px;">${item.title}</div>
                        <small style="color: #666;">${item.qty} × ${item.price} грн</small>
                    </div>
                    <button onclick="window.removeFromCart(${idx})" style="background:none; border:none; color:#ff4d4d; cursor:pointer; padding: 5px 10px; font-size: 18px;">✕</button>
                </div>
            `).join('');
        }
    }

    if (sumEl) sumEl.textContent = totalSum;

    // Зберігаємо кошик у localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    window.updateCartUI();
};

window.addToCartByData = function(element, keyPath) {
    if (!window.PRODUCTS) {
        console.error("Помилка: window.PRODUCTS не завантажено з data.js");
        return;
    }
    const parts = keyPath.split('.');
    let data = window.PRODUCTS;
    parts.forEach(p => { if (data) data = data[p]; });

    if (data && data.price) {
        const existing = cart.find(i => i.title === data.title);
        if (existing) {
            existing.qty++;
        } else {
            cart.push({
                title: data.title || "Товар",
                price: data.price,
                qty: 1
            });
        }
        window.updateCartUI();
        alert("Додано в кошик!");
    } else {
        console.warn("Дані товару не знайдено для:", keyPath);
    }
};

/* ==========================
   WAYFORPAY + TELEGRAM NOTIFICATION
========================== */
document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (cart.length === 0) {
                return alert("Кошик порожній!");
            }

            const nameEl = document.getElementById('client-name');
            const phoneEl = document.getElementById('client-phone');
            const npEl   = document.getElementById('client-np');

            if (!nameEl || !phoneEl || !npEl) {
                return console.error("Поля форми не знайдені");
            }

            const name     = nameEl.value.trim();
            const phone    = phoneEl.value.trim();
            const delivery = npEl.value.trim();
            const totalAmount = cart.reduce((s, i) => s + i.qty * i.price, 0);

            // Копіюємо кошик, бо після успіху ми його очистимо
            const cartCopy = [...cart];

            // URL для підпису WayForPay (як було)
            const signUrl = 'https://julia-store.vercel.app/api/sign';

            try {
                // 1. Отримуємо підпис від Vercel
                const signResponse = await fetch(signUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: totalAmount,
                        currency: "UAH",
                        productName: cart.map(i => i.title),
                        productPrice: cart.map(i => i.price),
                        productCount: cart.map(i => i.qty)
                    })
                });

                if (!signResponse.ok) {
                    throw new Error("Сервер підпису не відповів");
                }

                const signData = await signResponse.json();

                // 2. Запускаємо WayForPay
                const wayforpay = new Wayforpay();

                wayforpay.run({
                    merchantAccount: "julia_tv_github_io",
                    merchantDomainName: "julia-tv.github.io",
                    authorizationType: "SimpleSignature",
                    merchantSignature: signData.signature,
                    orderReference: signData.orderReference,
                    orderDate: signData.orderDate,
                    amount: totalAmount.toString(),
                    currency: "UAH",
                    productName: cart.map(i => i.title),
                    productPrice: cart.map(i => i.price),
                    productCount: cart.map(i => i.qty),
                    clientFirstName: name,
                    clientPhone: phone
                    // Якщо хочеш передати доставку в WayForPay (опціонально)
                    // clientAddress: delivery,
                    // deliveryType: 'nova'
                },
                // Success callback
                async function(res) {
                    alert("Оплата успішна! Дякуємо за замовлення.");

                    // Очищаємо кошик
                    cart = [];
                    window.updateCartUI();
                    orderForm.reset();

                    // Надсилаємо сповіщення в Telegram через Vercel
                    try {
                        const notifyResponse = await fetch('https://julia-store.vercel.app/api/notify-telegram', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: name,
                                phone: phone,
                                delivery: delivery,
                                total: totalAmount,
                                products: cartCopy  // використовуємо копію
                            })
                        });

                        if (!notifyResponse.ok) {
                            console.warn("Сповіщення в Telegram не надіслано, але оплата пройшла");
                        } else {
                            console.log("Сповіщення в Telegram надіслано");
                        }
                    } catch (notifyErr) {
                        console.error("Помилка надсилання сповіщення:", notifyErr);
                    }
                },
                // Error callback
                function(res) {
                    console.log("Відмова оплати:", res);
                    alert("Оплата не була завершена. Спробуйте ще раз.");
                });
            } catch (err) {
                alert("Помилка з'єднання з сервером оплати. Перевірте інтернет або спробуйте пізніше.");
                console.error(err);
            }
        });
    }

    // Початкове оновлення UI
    window.updateCartUI();
});

/* ==========================
   ВІДКРИТТЯ/ЗАКРИТТЯ КОШИКА
========================== */
window.toggleCart = function() {
    const modal = document.getElementById('cart-modal');
    const devNotice = document.querySelector('.dev-notice');

    if (modal) {
        const isHidden = modal.style.display === 'none' || modal.style.display === '';

        if (isHidden) {
            modal.style.display = 'block';
            if (devNotice) devNotice.classList.add('hidden');
            window.updateCartUI();
        } else {
            modal.style.display = 'none';
            if (devNotice) devNotice.classList.remove('hidden');
        }
    }
};
