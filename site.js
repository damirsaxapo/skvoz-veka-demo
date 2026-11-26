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

const plate = document.querySelector('.hero-plate');
const hero = plate.closest('.hero');
let frame = 0;

function drawCover() {
  frame = 0;
  const progress = Math.max(0, Math.min(window.scrollY / hero.offsetHeight, 1));
  plate.style.setProperty('--plate-turn', `${progress * 160}deg`);
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
  plate.style.removeProperty('--plate-turn');
}

motion.addEventListener('change', updateCoverMotion);
updateCoverMotion();

const mobileMenu = document.querySelector('.mobile-menu');
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => { mobileMenu.open = false; });
});
mobileMenu.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !mobileMenu.open) return;
  mobileMenu.open = false;
  mobileMenu.querySelector('summary').focus();
});

const lightbox = document.querySelector('.lightbox');
const links = [...document.querySelectorAll('[data-gallery]')];
const shelf = document.querySelector('.shelf');
const viewport = shelf.querySelector('.shelf-viewport');
const stage = shelf.querySelector('.shelf-stage');
const label = shelf.querySelector('.shelf-caption');
const palettes = [['#695035','#fff0ca'], ['#30473c','#f3e5bb'], ['#dad2b8','#293d4b'], ['#934e36','#ffebc4'], ['#485a6d','#f5e8c6']];
const works = links.map((link, i) => ({
  title: link.closest('figure').querySelector('h3').textContent,
  description: link.closest('figure').querySelector('p').textContent,
  image: link.querySelector('img').getAttribute('src'),
  number: String(i + 1).padStart(2, '0'),
  palette: palettes[i % palettes.length]
}));
const wrap = (value, length) => ((value % length) + length) % length;
let selected = 2;
let position = selected;
let destination = selected;
let shelfFrame = 0;
let lastTime = 0;
let bookHeight, spineWidth, coverWidth, stageWidth;
let swipe;
let blockClick = false;
const books = [];

function makeBook(i) {
  const work = works[i];
  const book = document.createElement('div');
  book.className = 'shelf-book';
  book.classList.toggle('has-long-title', work.title.length > 25);
  book.innerHTML = '<button type="button" class="shelf-face shelf-spine" tabindex="-1"><img alt="" draggable="false"><strong></strong><span class="shelf-number"></span></button><button type="button" class="shelf-face shelf-cover" tabindex="-1"><strong></strong><img alt="" draggable="false"><small>Сквозь века<span class="shelf-number"></span></small></button>';
  book.style.setProperty('--binding', work.palette[0]);
  book.style.setProperty('--letter', work.palette[1]);
  book.querySelectorAll('strong').forEach(el => { el.textContent = work.title; });
  book.querySelectorAll('img').forEach(el => { el.src = work.image; el.loading = 'lazy'; });
  book.querySelectorAll('.shelf-number').forEach(el => { el.textContent = work.number; });
  book.querySelector('.shelf-spine').ariaLabel = 'Выбрать работу ' + work.title;
  book.querySelector('.shelf-cover').ariaLabel = 'Рассмотреть работу ' + work.title;
  book.setAttribute('aria-hidden','true');
  book.dataset.slot = books.length;
  stage.append(book);
  books.push(book);
}

function updateCaption(direction = 0) {
  const work = works[wrap(selected, works.length)];
  const title = label.querySelector('h3');
  const openButton = title.querySelector('button');
  openButton.textContent = work.title;
  openButton.setAttribute('aria-label', 'Рассмотреть работу ' + work.title);
  label.querySelector('.shelf-count').textContent = work.number + ' / ' + String(works.length).padStart(2, '0');
  label.querySelector('p').textContent = work.description;
  if (direction && motion.matches) {
    title.getAnimations().forEach(animation => animation.cancel());
    title.animate([{transform: 'translateY(' + (direction * 95) + '%)'}, {transform: 'none'}], {duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)'});
  }
}

function renderShelf() {
  const total = books.length;
  for (const [slot, book] of books.entries()) {
    const r = wrap(slot - position + total / 2, total) - total / 2;
    const bend = Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) / 2;
    const x = r * (spineWidth + bookHeight * .027) + (coverWidth - spineWidth + bookHeight * .10) * bend;
    const visible = Math.abs(x) < stageWidth / 2 + coverWidth;
    book.hidden = !visible;
    if (!visible) continue;
    const t = Math.max(0, 1 - Math.abs(r));
    const open = t * t * (3 - 2 * t);
    book.style.transform = `translate3d(${x}px,${-open * bookHeight * .035}px,${open * bookHeight * .22}px) rotateZ(${-4 * open}deg) rotateY(${-87 * open}deg)`;
  }
}

function tickShelf(now) {
  const dt = Math.min(now - lastTime, 60);
  lastTime = now;
  position += (destination - position) * (1 - Math.exp(-dt / 99));
  if (!motion.matches || Math.abs(destination - position) < .002) position = destination;
  renderShelf();
  shelfFrame = position === destination ? 0 : requestAnimationFrame(tickShelf);
}

function selectBook(index) {
  const direction = Math.sign(index - selected);
  selected = index;
  destination = index;
  if (direction) updateCaption(direction);
  if (!shelfFrame) {
    lastTime = performance.now();
    shelfFrame = requestAnimationFrame(tickShelf);
  }
}

function measureShelf() {
  bookHeight = stage.getBoundingClientRect().height;
  stageWidth = viewport.clientWidth;
  spineWidth = bookHeight * .168;
  coverWidth = bookHeight * .64;
  stage.style.setProperty('--spine', spineWidth + 'px');
  stage.style.setProperty('--cover', coverWidth + 'px');
  renderShelf();
}

for (let copy = 0; copy < 7; copy++) works.forEach((_, i) => makeBook(i));
document.querySelector('.gallery').hidden = true;
shelf.hidden = false;
updateCaption();
measureShelf();
window.addEventListener('resize', measureShelf);
shelf.querySelectorAll('[data-dir]').forEach(button => button.addEventListener('click', () => selectBook(selected + Number(button.dataset.dir))));
function openSelected() {
  links[wrap(selected, works.length)].click();
}
shelf.querySelector('.shelf-open').addEventListener('click', openSelected);
stage.addEventListener('click', event => {
  if (blockClick) return;
  const book = event.target.closest('.shelf-book');
  if (!book) return;
  const slot = Number(book.dataset.slot);
  const delta = wrap(slot - selected + Math.floor(books.length / 2), books.length) - Math.floor(books.length / 2);
  if (delta === 0) openSelected();
  else selectBook(selected + delta);
});
viewport.addEventListener('keydown', event => {
  if (!['ArrowLeft','ArrowRight','Enter',' '].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'ArrowLeft') selectBook(selected - 1);
  else if (event.key === 'ArrowRight') selectBook(selected + 1);
  else openSelected();
});
viewport.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  blockClick = false;
  swipe = {id: event.pointerId, x: event.clientX, y: event.clientY, start: position, dragging: false};
});
viewport.addEventListener('pointermove', event => {
  if (!swipe || event.pointerId !== swipe.id) return;
  const dx = event.clientX - swipe.x;
  if (!swipe.dragging) {
    if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(event.clientY - swipe.y)) return;
    viewport.setPointerCapture(event.pointerId);
    swipe.dragging = blockClick = true;
    cancelAnimationFrame(shelfFrame);
    shelfFrame = 0;
  }
  position = swipe.start - dx / (spineWidth + bookHeight * .09);
  renderShelf();
});
function endSwipe(event) {
  if (!swipe || event.pointerId !== swipe.id) return;
  if (swipe.dragging) selectBook(Math.round(position));
  swipe = null;
}
viewport.addEventListener('pointerup', endSwipe);
viewport.addEventListener('pointercancel', endSwipe);
viewport.addEventListener('pointerleave', () => { if (!swipe?.dragging) swipe = null; });
let wheelDistance = 0;
let lastWheel = 0;
viewport.addEventListener('wheel', event => {
  if (event.ctrlKey || (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY))) return;
  event.preventDefault();
  const now = performance.now();
  if (now - lastWheel > 160) wheelDistance = 0;
  lastWheel = now;
  const delta = event.deltaX || event.deltaY;
  wheelDistance += delta * (event.deltaMode === 1 ? 16 : 1);
  if (Math.abs(wheelDistance) >= 85) {
    selectBook(selected + Math.sign(wheelDistance));
    wheelDistance = 0;
  }
}, {passive:false});
if (typeof lightbox.showModal === 'function') {
  const photo = lightbox.querySelector('img');
  const caption = lightbox.querySelector('#lightbox-caption');
  const story = lightbox.querySelector('.lightbox-story');
  const video = lightbox.querySelector('video');
  const replay = lightbox.querySelector('.lightbox-replay');
  const close = lightbox.querySelector('.lightbox-close');
  let index = 0;
  let opener;

  function stopAnimation() {
    video.pause();
    video.hidden = true;
    if (video.hasAttribute('src')) {
      video.removeAttribute('src');
      video.load();
    }
  }

  function playAnimation() {
    const source = links[index].dataset.motion;
    if (!source || !motion.matches || !lightbox.open) return;
    video.src = source;
    video.play().catch(() => {});
  }

  video.addEventListener('playing', () => {
    if (lightbox.open && motion.matches && !video.paused) video.hidden = false;
  });
  video.addEventListener('ended', () => { video.hidden = true; });
  video.addEventListener('error', () => { video.hidden = true; });
  replay.addEventListener('click', playAnimation);
  motion.addEventListener('change', () => {
    if (!motion.matches) stopAnimation();
    replay.hidden = !motion.matches || !links[index].dataset.motion;
  });

  function showPhoto(nextIndex) {
    stopAnimation();
    index = wrap(nextIndex, links.length);
    const link = links[index];
    photo.src = link.href;
    photo.alt = link.querySelector('img').alt;
    caption.textContent = works[index].title;
    const notes = link.closest('figure').querySelector('.work-story');
    story.replaceChildren(...[...notes.children].map(paragraph => paragraph.cloneNode(true)));
    replay.hidden = !link.dataset.motion || !motion.matches;
    lightbox.scrollTop = 0;
    playAnimation();
    const step = wrap(index - selected + Math.floor(works.length / 2), works.length) - Math.floor(works.length / 2);
    if (step) selectBook(selected + step);
  }

  links.forEach((link, linkIndex) => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link.closest('[hidden]') ? document.querySelector('.shelf-viewport') : link;
      lightbox.showModal();
      showPhoto(linkIndex);
      if (motion.matches) {
        lightbox.animate([{transform:'translateY(24px) scale(.91) rotate(-2deg)'},{transform:'none'}], {duration:320,easing:'cubic-bezier(.2,.8,.2,1)'});
      }
      close.focus();
    });
  });
  lightbox.querySelectorAll('[data-step]').forEach(button => {
    button.addEventListener('click', () => showPhoto(index + Number(button.dataset.step)));
  });
  close.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('close', () => {
    stopAnimation();
    opener?.focus();
  });
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') showPhoto(index - 1);
    if (event.key === 'ArrowRight') showPhoto(index + 1);
  });
}
