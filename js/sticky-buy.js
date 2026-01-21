document.addEventListener('DOMContentLoaded', () => {
  const stickyBuy = document.getElementById('mobileStickyBuy');
  const mainBuyButton = document.querySelector('.hero-cta .btn-buy');

  if (!stickyBuy || !mainBuyButton) return;

  function toggleStickyBuy() {
    if (window.innerWidth > 768) return;

    const rect = mainBuyButton.getBoundingClientRect();
    stickyBuy.classList.toggle('active', rect.bottom <= 0);
  }

  window.addEventListener('scroll', toggleStickyBuy);
  toggleStickyBuy();
});
