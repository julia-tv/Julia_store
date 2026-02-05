document.addEventListener("DOMContentLoaded", () => {
  if (!window.PRODUCTS) {
    console.error("Помилка: Об'єкт window.PRODUCTS не знайдено. Перевірте підключення data.js");
    return;
  }

  document.querySelectorAll("[data-product]").forEach(el => {
    const keyPath = el.dataset.product.split('.'); 
    let result = window.PRODUCTS;

    // Проходимо по вкладеності об'єкта PRODUCTS
    keyPath.forEach(part => {
      if (result && result[part] !== undefined) {
        result = result[part];
      } else {
        result = undefined;
      }
    });

    // Якщо дані не знайдені — виводимо попередження в консоль
    if (result === undefined) {
      console.warn("Дані не знайдено для шляху:", el.dataset.product);
      return;
    }

    // ЛОГІКА ВИВОДУ ЦІНИ:
    
    // 1. Якщо шлях вказав на об'єкт (наприклад, epherium), беремо price всередині
    if (typeof result === 'object' && result !== null) {
      const price = result.price;
      const currency = result.currency || "грн";
      if (price !== undefined) {
        el.textContent = `${price} ${currency}`;
      }
    } 
    // 2. Якщо шлях вказав на конкретне число (наприклад, epherium.price або bundles.epherium12.price)
    else if (typeof result === 'number' || typeof result === 'string') {
      // Додаємо "грн", якщо це число і його немає в тексті
      el.textContent = `${result} грн`;
    }
  });
});
