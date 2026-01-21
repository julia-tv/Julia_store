document.addEventListener('DOMContentLoaded', () => {
  const stickyBuy = document.getElementById('mobileStickyBuy');
  const mainBuyButton = document.querySelector('.hero-cta .btn-primary');

  if (!stickyBuy || !mainBuyButton) return;

  function toggleStickyBuy() {
    const rect = mainBuyButton.getBoundingClientRect();
    const isHidden = rect.bottom < 0;

    if (isHidden) {
      stickyBuy.classList.add('active');
    } else {
      stickyBuy.classList.remove('active');
    }
  }

  window.addEventListener('scroll', toggleStickyBuy);
  toggleStickyBuy();
});
