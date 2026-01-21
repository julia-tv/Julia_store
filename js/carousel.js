document.addEventListener("DOMContentLoaded", () => {

  const container = document.querySelector(".carousel__track-container");
  const next = document.querySelector(".carousel__btn--right");
  const prev = document.querySelector(".carousel__btn--left");

  if (!container || !next || !prev) return;

  next.addEventListener("click", () => {
    container.scrollBy({ left: 320, behavior: "smooth" });
  });

  prev.addEventListener("click", () => {
    container.scrollBy({ left: -320, behavior: "smooth" });
  });

});
