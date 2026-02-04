/* ==========================
   CART STATE
========================== */
let cart = JSON.parse(localStorage.getItem('cart')) || [];

/* ==========================
   CONFIG WAYFORPAY
========================== */
const WFP_CONFIG = {
  merchantAccount: "julia_tv_github_io",
  merchantSecret: "f2d4b820652b76d7f2f400928d43a4318f85a816",
  merchantDomainName: "julia-tv.github.io", // ❗ ОБОВʼЯЗКОВО
  currency: "UAH"
};

/* ==========================
   UI UPDATE
========================== */
function updateCartUI() {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const totalSum = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const headerCount = document.getElementById("cart-count-header");
  const mobileCount = document.getElementById("cart-count-mobile");
  if (headerCount) headerCount.textContent = totalQty;
  if (mobileCount) mobileCount.textContent = totalQty;

  const list = document.getElementById("cart-items-list");
  const sum = document.getElementById("cart-total-sum");

  if (list) {
    list.innerHTML = "";
    cart.forEach((item, idx) => {
      list.innerHTML += `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding:6px 0;font-size:14px;">
          <div>${item.title} × ${item.qty}</div>
          <div><b>${item.price * item.qty} грн</b></div>
          <button onclick="removeFromCart(${idx})" style="border:none;background:none;color:red;font-size:18px;cursor:pointer">&times;</button>
        </div>
      `;
    });
  }

  if (sum) sum.textContent = totalSum.toFixed(2);
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* ==========================
   CART ACTIONS
========================== */
function addToCart(title, price) {
  const item = cart.find(i => i.title === title);
  if (item) item.qty++;
  else cart.push({ title, price: Number(price), qty: 1 });

  updateCartUI();
  toggleCart(true);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function toggleCart(force = null) {
  const modal = document.getElementById("cart-modal");
  if (!modal) return;
  if (force === true) modal.style.display = "block";
  else if (force === false) modal.style.display = "none";
  else modal.style.display = modal.style.display === "block" ? "none" : "block";
}

/* ==========================
   WAYFORPAY SIGNATURE
========================== */
function generateSignature(orderRef, orderDate, amount) {
  const productNames  = cart.map(i => i.title).join(";");
  const productCounts = cart.map(i => i.qty).join(";");
  const productPrices = cart.map(i => i.price.toFixed(2)).join(";");

  const stringToSign = [
    WFP_CONFIG.merchantAccount,
    WFP_CONFIG.merchantDomainName, // ❗ БРАКУВАЛО
    orderRef,
    orderDate,
    amount,
    WFP_CONFIG.currency,
    productNames,
    productCounts,
    productPrices
  ].join(";");

  return md5.hmac(WFP_CONFIG.merchantSecret, stringToSign);
}

/* ==========================
   ORDER SUBMIT
========================== */
const orderForm = document.getElementById("order-form");

if (orderForm) {
  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!cart.length) {
      alert("Кошик порожній");
      return;
    }

    if (typeof md5 === "undefined" || typeof Wayforpay === "undefined") {
      alert("Платіжні бібліотеки не завантажені");
      return;
    }

    const name  = document.getElementById("client-name").value.trim();
    const phone = document.getElementById("client-phone").value.trim();

    const amount = cart
      .reduce((s, i) => s + i.qty * i.price, 0)
      .toFixed(2); // ❗ STRING, НЕ number

    const orderRef  = "ORDER_" + Date.now();
    const orderDate = Math.floor(Date.now() / 1000);
    const signature = generateSignature(orderRef, orderDate, amount);

    const wayforpay = new Wayforpay();

    wayforpay.run({
      merchantAccount: WFP_CONFIG.merchantAccount,
      merchantDomainName: WFP_CONFIG.merchantDomainName, // ❗ ОБОВʼЯЗКОВО
      merchantSignature: signature,
      orderReference: orderRef,
      orderDate: orderDate,
      amount: amount,
      currency: WFP_CONFIG.currency,
      productName: cart.map(i => i.title),
      productPrice: cart.map(i => i.price.toFixed(2)),
      productCount: cart.map(i => i.qty),
      clientFirstName: name,
      clientPhone: phone
    },
    function () {
      alert("Оплата успішна!");
      cart = [];
      updateCartUI();
      toggleCart(false);
      orderForm.reset();
    },
    function (err) {
      console.error("WayForPay error:", err);
      alert("Оплата не пройшла");
    });
  });
}

updateCartUI();
