const motion = matchMedia('(prefers-reduced-motion: no-preference)');
if (motion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.1 });
  document.documentElement.classList.add('motion');
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

const cover = document.querySelector('.hero-media');
const hero = cover.closest('.hero');
let frame = 0;

function drawCover() {
  frame = 0;
  const distance = Math.max(0, window.scrollY - hero.offsetTop);
  const offset = Math.min(distance * 0.09, cover.offsetHeight * 0.04);
  cover.style.translate = `0 ${offset}px`;
}

function scheduleCover() {
  if (!frame) frame = requestAnimationFrame(drawCover);
}

function updateCoverMotion() {
  if (motion.matches) {
    window.addEventListener('scroll', scheduleCover, { passive: true });
    window.addEventListener('resize', scheduleCover);
    scheduleCover();
    return;
  }
  window.removeEventListener('scroll', scheduleCover);
  window.removeEventListener('resize', scheduleCover);
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  cover.style.removeProperty('translate');
}

motion.addEventListener('change', updateCoverMotion);
updateCoverMotion();

const gallery = document.querySelector('.gallery');
const galleryControls = document.querySelector('.gallery-actions');
const [previous, next] = galleryControls.querySelectorAll('button');

function updateGalleryControls() {
  const maximum = gallery.scrollWidth - gallery.clientWidth;
  galleryControls.hidden = maximum <= 2;
  previous.disabled = gallery.scrollLeft <= 2;
  next.disabled = gallery.scrollLeft >= maximum - 2;
}

galleryControls.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', () => {
    const [first, second] = gallery.children;
    const step = second.offsetLeft - first.offsetLeft;
    gallery.scrollBy({ left: step * Number(button.dataset.galleryStep), behavior: motion.matches ? 'smooth' : 'instant' });
  });
});

gallery.addEventListener('scroll', updateGalleryControls, { passive: true });
window.addEventListener('resize', updateGalleryControls);
updateGalleryControls();

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
