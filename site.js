const motion = matchMedia('(prefers-reduced-motion: no-preference)');
if (motion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  document.documentElement.classList.add('motion');
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

if (motion.matches && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const cover = document.querySelector('.hero-figure');
  cover.addEventListener('pointermove', event => {
    const bounds = cover.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    cover.style.setProperty('--x', `${x * -20}px`);
    cover.style.setProperty('--y', `${y * -20}px`);
  });
  cover.addEventListener('pointerleave', () => {
    cover.style.removeProperty('--x');
    cover.style.removeProperty('--y');
  });
}

const lightbox = document.querySelector('.lightbox');
const links = [...document.querySelectorAll('[data-gallery]')];
if (typeof lightbox.showModal === 'function') {
  const photo = lightbox.querySelector('img');
  const caption = lightbox.querySelector('figcaption');
  const close = lightbox.querySelector('.lightbox-close');
  let index = 0;
  let opener;

  function showPhoto(nextIndex) {
    index = (nextIndex + links.length) % links.length;
    const link = links[index];
    photo.src = link.href;
    photo.alt = link.querySelector('img').alt;
    caption.textContent = link.closest('figure').querySelector('h3').textContent;
  }

  links.forEach((link, linkIndex) => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      showPhoto(linkIndex);
      lightbox.showModal();
      close.focus();
    });
  });
  lightbox.querySelectorAll('[data-step]').forEach(button => {
    button.addEventListener('click', () => showPhoto(index + Number(button.dataset.step)));
  });
  close.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('close', () => opener?.focus());
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') showPhoto(index - 1);
    if (event.key === 'ArrowRight') showPhoto(index + 1);
  });
}
