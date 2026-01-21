document.addEventListener("DOMContentLoaded", () => {

  if (!window.PRODUCTS) {
    console.error("PRODUCTS не знайдено");
    return;
  }

  document.querySelectorAll("[data-product]").forEach(el => {
    const key = el.dataset.product;
    const product = window.PRODUCTS[key];

    if (!product) {
      console.warn("Немає продукту:", key);
      return;
    }

    el.textContent = product.price + " " + product.currency;
  });

});
