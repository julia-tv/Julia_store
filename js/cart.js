let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartUI() {
  // 1. Рахуємо загальну кількість
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // 2. Оновлюємо лічильник у шапці (десктоп)
  const cartHeaderCount = document.getElementById('cart-count-header');
  if (cartHeaderCount) cartHeaderCount.textContent = totalQty;

  // 3. Оновлюємо лічильники для мобільної версії (плаваюча кнопка та меню)
  const floatBadge = document.getElementById('mobile-cart-float');
  const floatCount = document.getElementById('cart-count-float');
  const mobileCount = document.getElementById('cart-count-mobile');

  if (floatCount) floatCount.textContent = totalQty;
  if (mobileCount) mobileCount.textContent = totalQty;

  // 4. Логіка показу плаваючої кнопки на мобільних
  if (floatBadge) {
    if (window.innerWidth <= 768 && totalQty > 0) {
      floatBadge.style.display = 'flex';
    } else {
      floatBadge.style.display = 'none';
    }
  }

  // 5. Оновлюємо список товарів у модальному вікні
  const cartItemsList = document.getElementById('cart-items-list');
  const cartTotalSum = document.getElementById('cart-total-sum');
  
  if (cartItemsList) {
    cartItemsList.innerHTML = '';
    let totalSum = 0;

    cart.forEach((item, index) => {
      const itemTotal = item.price * item.qty;
      totalSum += itemTotal;
      
      cartItemsList.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 14px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">
          <div style="flex: 1;">
            <strong style="display:block; margin-bottom: 5px;">${item.title}</strong>
            <div style="display: flex; align-items: center; gap: 10px;">
              <button onclick="changeQty(${index}, -1)" style="width: 24px; height: 24px; border: 1px solid #ddd; background: #fff; cursor: pointer; border-radius: 4px;">-</button>
              <span style="font-weight: bold; min-width: 20px; text-align: center;">${item.qty}</span>
              <button onclick="changeQty(${index}, 1)" style="width: 24px; height: 24px; border: 1px solid #ddd; background: #fff; cursor: pointer; border-radius: 4px;">+</button>
              <span style="margin-left: 10px; color: #777;">× ${item.price} грн</span>
            </div>
          </div>
          <div style="font-weight: bold; margin-left: 10px;">${itemTotal} грн</div>
          <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ccc; cursor: pointer; font-size: 20px; margin-left: 10px;">&times;</button>
        </div>
      `;
    });

    if (cartTotalSum) cartTotalSum.textContent = totalSum;
  }

  // 6. Зберігаємо зміни
  localStorage.setItem('cart', JSON.stringify(cart));
}

function changeQty(index, delta) {
  if (cart[index]) {
    cart[index].qty += delta;
    if (cart[index].qty < 1) {
      removeFromCart(index);
    } else {
      updateCartUI();
    }
  }
}

function addToCart(title, price) {
  const id = title.toLowerCase().replace(/\s/g, '-');
  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, title, price: Number(price), qty: 1 });
  }

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

// Форма замовлення
const orderForm = document.getElementById('order-form');
if (orderForm) {
  orderForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const address = document.getElementById('client-np').value;
    const total = document.getElementById('cart-total-sum').textContent;
    const itemsString = cart.map(i => `${i.title} (${i.qty}шт)`).join(', ');

    const botToken = 'ВАШ_ТОКЕН';
    const chatId = 'ВАШ_ID';
    const message = `📦 ЗАМОВЛЕННЯ\n👤 ${name}\n📞 ${phone}\n📍 ${address}\n🛒 ${itemsString}\n💰 Сума: ${total} грн`;

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`)
    .then(() => {
        var wayforpay = new Wayforpay();
        wayforpay.run({
            merchantAccount: "test_merch_n1", 
            merchantDomainName: window.location.hostname,
            authorizationType: "SimpleSignature",
            orderReference: "Order_" + Date.now(),
            orderDate: Date.now(),
            amount: total,
            currency: "UAH",
            productName: cart.map(i => i.title),
            productPrice: cart.map(i => i.price),
            productCount: cart.map(i => i.qty),
            clientFirstName: name,
            clientPhone: phone
        },
        function (response) { 
          alert('Дякуємо! Оплата успішна.');
          cart = [];
          updateCartUI();
          toggleCart(false);
        },
        function (response) { 
          alert('Помилка оплати.');
        });
    });
  });
}

// Початковий виклик при завантаженні сторінки
updateCartUI();