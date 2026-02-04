document.addEventListener("DOMContentLoaded", () => {
  if (!window.PRODUCTS) {
    console.error("PRODUCTS не знайдено у window");
    return;
  }
  document.querySelectorAll("[data-product]").forEach(el => {
    const keyPath = el.dataset.product.split('.'); // Розбиваємо шлях, наприклад ['bundles', 'epherium12', 'price']
    let result = window.PRODUCTS;

    // Проходимо по вкладеності об'єкта
    keyPath.forEach(part => {
      if (result) result = result[part];
    });

    // Якщо нічого не знайшли — виходимо
    if (result === undefined) {
      console.warn("Не знайдено даних для:", el.dataset.product);
      return;
    }

    // ЛОГІКА ВИВОДУ:
    
    // 1. Якщо знайшли об'єкт, у якого є властивість price (наприклад, epherium)
    if (typeof result === 'object' && result !== null && result.price) {
      const currency = result.currency || "грн";
      el.textContent = result.price + " " + currency;
    } 
    // 2. Якщо знайшли просто число (наприклад, якщо в HTML вказано 'epherium.price')
    else if (typeof result === 'number') {
      el.textContent = result + " грн";
    } 
    // 3. У всіх інших випадках (текст тощо)
    else {
      el.textContent = result;
    }
  });
});
