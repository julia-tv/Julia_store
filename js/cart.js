/* ==========================
   CART STATE & UI
========================== */
let cart = JSON.parse(localStorage.getItem('cart')) || [];

window.updateCartUI = function() {
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    const totalSum = cart.reduce((s, i) => s + i.qty * i.price, 0);

    // Оновлення лічильників
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
                        <small style="color: #666;">${item.qty} x ${item.price} грн</small>
                    </div>
                    <button onclick="window.removeFromCart(${idx})" style="background:none; border:none; color:#ff4d4d; cursor:pointer; padding: 5px 10px; font-size: 18px;">✕</button>
                </div>
            `).join('');
        }
    }
    
    if (sumEl) sumEl.textContent = totalSum;
    localStorage.setItem('cart', JSON.stringify(cart));
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    window.updateCartUI();
};

window.addToCartByData = function(element, keyPath) {
    if (!window.PRODUCTS) {
        console.error("Помилка: window.PRODUCTS не завантажено");
        return;
    }

    const parts = keyPath.split('.');
    let data = window.PRODUCTS;
    parts.forEach(p => { if(data) data = data[p]; });

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
   WAYFORPAY INTEGRATION
========================== */
document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (cart.length === 0) return alert("Кошик порожній!");

            const nameEl = document.getElementById('client-name');
            const phoneEl = document.getElementById('client-phone');
            
            if (!nameEl || !phoneEl) return console.error("Поля форми не знайдені");

            const name = nameEl.value;
            const phone = phoneEl.value;
            const totalAmount = cart.reduce((s, i) => s + i.qty * i.price, 0);

            // Ваш реальний API URL на Vercel
            const VERCEL_API_URL = 'https://julia-store.vercel.app/api/sign';

            try {
                const response = await fetch(VERCEL_API_URL, {
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

                if (!response.ok) throw new Error("Сервер підпису не відповів");

                const data = await response.json();
                const wayforpay = new Wayforpay();
                
                wayforpay.run({
                    merchantAccount: "julia_tv_github_io", // Ваші робочі дані
                    merchantDomainName: "julia-tv.github.io", 
                    authorizationType: "SimpleSignature",
                    merchantSignature: data.signature,
                    orderReference: data.orderReference,
                    orderDate: data.orderDate,
                    amount: totalAmount.toString(),
                    currency: "UAH",
                    productName: cart.map(i => i.title),
                    productPrice: cart.map(i => i.price),
                    productCount: cart.map(i => i.qty),
                    clientFirstName: name,
                    clientPhone: phone
                },
                function (res) { // Success
                    alert("Оплата успішна! Дякуємо за замовлення.");
                    cart = [];
                    window.updateCartUI();
                    orderForm.reset();
                },
                function (res) { // Error
                    console.log("Відмова:", res);
                    alert("Оплата не була завершена.");
                });

            } catch (err) {
                alert("Помилка з'єднання з сервером оплати.");
                console.error(err);
            }
        });
    }
    window.updateCartUI();
});

/* ==========================
   ВІДКРИТТЯ/ЗАКРИТТЯ КОШИКА
========================== */
window.toggleCart = function() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        const isHidden = modal.style.display === 'none' || modal.style.display === '';
        modal.style.display = isHidden ? 'block' : 'none';
        
        // Якщо відкриваємо, оновлюємо вигляд
        if (isHidden) {
            window.updateCartUI();
        }
    }
};
