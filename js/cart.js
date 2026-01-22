let cart = JSON.parse(localStorage.getItem('cart')) || [];

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

// Захищений обробник замовлення
const orderForm = document.getElementById('order-form');
if (orderForm) {
  orderForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Кошик порожній!");
      return;
    }

    // Декодування конфіденційних даних "на льоту"
    const _0x1a2b = (s) => atob(s);
    const cfg = {
        t: _0x1a2b('ODIwNjkwMjgyMzpBQUdiN3ZhSk9SYWhERkdQQXhsblNZOGhydHdaUXlPQmV1dw=='), // Token
        c: _0x1a2b('MTI5NzkyNDQzNg=='), // ChatID
        m: _0x1a2b('anVsaWFfdHZfZ2l0aHViX2lv') // Merchant
    };

    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const address = document.getElementById('client-np').value;
    const total = document.getElementById('cart-total-sum').textContent;
    const itemsString = cart.map(i => `${i.title} (${i.qty}шт)`).join(', ');

    const message = `📦 НОВЕ ЗАМОВЛЕННЯ\n👤 ${name}\n📞 ${phone}\n📍 ${address}\n🛒 ${itemsString}\n💰 Сума: ${total} грн`;

    fetch(`https://api.telegram.org/bot${cfg.t}/sendMessage?chat_id=${cfg.c}&text=${encodeURIComponent(message)}`)
    .then(() => {
        const wayforpay = new Wayforpay();
        wayforpay.run({
            merchantAccount: cfg.m,
            merchantDomainName: "julia-tv.github.io",
            authorizationType: "SimpleSignature",
            orderReference: "Order_" + Date.now(),
            orderDate: Math.floor(Date.now() / 1000),
            amount: total.toString(),
            currency: "UAH",
            productName: cart.map(i => i.title),
            productPrice: cart.map(i => i.price.toString()),
            productCount: cart.map(i => i.qty.toString()),
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
          alert('Замовлення прийнято! Оплату можна завершити пізніше або при отриманні.');
          toggleCart(false);
        });
    })
    .catch(err => alert("Помилка відправки. Спробуйте ще раз."));
  });
}

updateCartUI();