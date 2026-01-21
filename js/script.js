// --- 1. ГАЛЕРЕЯ ТА МЕНЮ ---
const burger = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');

burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
});

function closeMenu() {
    burger.classList.remove('active');
    mobileMenu.classList.remove('active');
}

function changeImage(src) {
    document.getElementById('mainImage').src = src;
    const thumbnails = document.querySelectorAll('.thumbnails-row img');
    thumbnails.forEach(img => img.classList.remove('active'));
    if(event) event.target.classList.add('active');
}

// --- 2. ЛОГІКА КОШИКА ---
let cart = [];

function addToCart(name, price) {
    cart.push({ name, price });
    updateUI();
    document.getElementById('cart-badge').style.display = 'flex';
    if(window.innerWidth > 768) toggleCart(); // Відкриваємо кошик на десктопі
}

function updateUI() {
    const itemsCont = document.getElementById('cart-items');
    const totalSpan = document.getElementById('total-amount');
    const badgeTotal = document.getElementById('cart-total-badge');
    const badgeCount = document.getElementById('cart-count');
    
    itemsCont.innerHTML = '';
    let total = 0;
    
    cart.forEach((item, index) => {
        total += item.price;
        itemsCont.innerHTML += `
            <div class="cart-item">
                <span>${item.name}</span>
                <span>${item.price} грн <button onclick="removeItem(${index})" style="border:none; background:none; cursor:pointer;">❌</button></span>
            </div>`;
    });
    
    totalSpan.innerText = total;
    badgeTotal.innerText = total;
    badgeCount.innerText = cart.length;
    
    if(cart.length === 0) {
        document.getElementById('cart-badge').style.display = 'none';
        toggleCart();
    }
}

function removeItem(index) {
    cart.splice(index, 1);
    updateUI();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

// --- 3. ВІДПРАВКА ТА ОПЛАТА ---
document.getElementById('order-form').onsubmit = function(e) {
    e.preventDefault();
    
    const name = document.getElementById('client-name').value;
    const phone = document.getElementById('client-phone').value;
    const addr = document.getElementById('client-city').value;
    const total = document.getElementById('total-amount').innerText;
    const itemsNames = cart.map(i => i.name).join(', ');

    // Відправка в Телеграм (приклад)
    const botToken = 'ВАШ_ТОКЕН';
    const chatId = 'ВАШ_ID';
    const message = `📦 Нове замовлення!\n👤 ${name}\n📞 ${phone}\n📍 ${addr}\n🛒 ${itemsNames}\n💰 Сума: ${total} грн`;
    
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`);

    // Запуск WayForPay (використовуйте ваш Merchant ID)
    var wayforpay = new Wayforpay();
    wayforpay.run({
            merchantAccount: "test_merch_n1", // ЗАМІНІТЬ НА ВАШ
            merchantDomainName: window.location.hostname,
            authorizationType: "SimpleSignature",
            orderReference: "Order_" + Date.now(),
            orderDate: Date.now(),
            amount: total,
            currency: "UAH",
            productName: cart.map(i => i.name),
            productPrice: cart.map(i => i.price),
            productCount: cart.map(i => 1),
            clientFirstName: name,
            clientPhone: phone
        },
        function (response) { /* Успішно */ },
        function (response) { /* Відмова */ }
    );
};