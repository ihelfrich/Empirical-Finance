const revealItems = Array.from(document.querySelectorAll('.reveal'));

revealItems.forEach((el, index) => {
  const delay = el.dataset.delay ? Number(el.dataset.delay) : index * 90;
  el.style.transitionDelay = `${delay}ms`;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((el) => observer.observe(el));
