let cart = JSON.parse(localStorage.getItem('cart')) || [];

// 1. Оновлення інтерфейсу
function updateCartUI() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalSum = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const cartHeaderCount = document.getElementById('cart-count-header');
  const cartMobileCount = document.getElementById('cart-count-mobile');
  if (cartHeaderCount) cartHeaderCount.textContent = totalQty;
  if (cartMobileCount) cartMobileCount.textContent = totalQty;

  const cartItemsList = document.getElementById('cart-items-list');
  const cartTotalSum = document.getElementById('cart-total-sum');
  
  if (cartItemsList) {
    cartItemsList.innerHTML = '';
    cart.forEach((item, index) => {
      cartItemsList.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
          <div style="flex: 1;">${item.title} x ${item.qty}</div>
          <div style="font-weight: bold; margin: 0 10px;">${item.price * item.qty} грн</div>
          <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red; cursor:pointer; font-size:18px;">&times;</button>
        </div>`;
    });
    if (cartTotalSum) cartTotalSum.textContent = totalSum;
  }
  localStorage.setItem('cart', JSON.stringify(cart));
}

// 2. Функції кошика
function addToCart(title, price) {
  const existing = cart.find(i => i.title === title);
  if (existing) { existing.qty++; } 
  else { cart.push({ title, price: Number(price), qty: 1 }); }
  updateCartUI();
  toggleCart(true);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function toggleCart(show = null) {
  const modal = document.getElementById('cart-modal');
  if (!modal) return;
  if (show === true) modal.style.display = 'block';
  else if (show === false) modal.style.display = 'none';
  else modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

// 3. ОБРОБКА ЗАМОВЛЕННЯ З ПІДПИСОМ
const orderForm = document.getElementById('order-form');
if (orderForm) {
  orderForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Кошик порожній!");
      return;
    }

    // --- НАЛАШТУВАННЯ ---
    // Ваші зашифровані ключі (Bot, ChatID, MerchantLogin, SecretKey)
    const decode = (str) => atob(str);
    const CONFIG = {
        botToken: decode('ODIwNjkwMjgyMzpBQUdiN3ZhSk9SYWhERkdQQXhsblNZOGhydHdaUXlPQmV1dw=='),
        chatId: decode('MTI5NzkyNDQzNg=='),
        merchantLogin: decode('anVsaWFfdHZfZ2l0aHViX2lv'), // julia_tv_github_io
        merchantSecret: decode('ZjJkNGI4MjA2NTJiNzZkN2YyZjQwMDkyOGQ0M2E0MzE4Zjg1YTgxNg==') // f2d4...
    };

    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const address = document.getElementById('client-np').value;
    const total = document.getElementById('cart-total-sum').textContent;
    const itemsString = cart.map(i => `${i.title} (${i.qty}шт)`).join(', ');

    // Підготовка даних для WayForPay
    const orderRef = "Order_" + Date.now();
    const orderDate = Math.floor(Date.now() / 1000);
    const productNames = cart.map(i => i.title);
    const productPrices = cart.map(i => i.price.toString());
    const productCounts = cart.map(i => i.qty.toString());
    const domainName = "julia-tv.github.io"; // Має співпадати з налаштуваннями кабінету

    // --- ГЕНЕРАЦІЯ ПІДПИСУ (SIGNATURE) ---
    // Порядок: merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;productName;productCount;productPrice
    const stringToSign = [
        CONFIG.merchantLogin,
        domainName,
        orderRef,
        orderDate,
        total,
        "UAH",
        productNames.join(";"),
        productCounts.join(";"),
        productPrices.join(";")
    ].join(";");

    // Створюємо хеш (підпис) використовуючи бібліотеку md5
    const signature = md5.hmac(CONFIG.merchantSecret, stringToSign);

    const message = `📦 НОВЕ ЗАМОВЛЕННЯ\n👤 ${name}\n📞 ${phone}\n📍 ${address}\n🛒 ${itemsString}\n💰 Сума: ${total} грн`;

    // 1. Спочатку пишемо в Telegram
    fetch(`https://api.telegram.org/bot${CONFIG.botToken}/sendMessage?chat_id=${CONFIG.chatId}&text=${encodeURIComponent(message)}`)
    .then(() => {
        // 2. Відкриваємо віджет оплати
        const wayforpay = new Wayforpay();
        wayforpay.run({
            merchantAccount: CONFIG.merchantLogin,
            merchantDomainName: domainName,
            merchantSignature: signature, // <--- ОСЬ ЧОГО НЕ ВИСТАЧАЛО!
            orderReference: orderRef,
            orderDate: orderDate,
            amount: total.toString(),
            currency: "UAH",
            productName: productNames,
            productPrice: productPrices,
            productCount: productCounts,
            clientFirstName: name,
            clientPhone: phone
        },
        function (response) { 
          alert('Дякуємо! Оплата успішна.');
          cart = [];
          updateCartUI();
          toggleCart(false);
          orderForm.reset();
        },
        function (response) { 
          console.log("Оплата не завершена або скасована");
        });
    })
    .catch(err => {
        console.error(err);
        alert("Помилка. Перевірте інтернет з'єднання.");
    });
  });
}

updateCartUI();