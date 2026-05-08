import { createMovieCard, createSkeletonCards } from './movieCard.js';

export function createContentRow(title, items, skeletonCount = 6) {
  const section = document.createElement('section');
  section.className = 'content-section';

  const titleEl = document.createElement('h2');
  titleEl.className = 'section-title';
  titleEl.textContent = title;
  section.appendChild(titleEl);

  const wrapper = document.createElement('div');
  wrapper.className = 'row-wrapper';

  const scroll = document.createElement('div');
  scroll.className = 'row-scroll';

  if (!items || items.length === 0) {
    createSkeletonCards(skeletonCount).forEach(c => scroll.appendChild(c));
  } else {
    items.forEach(item => scroll.appendChild(createMovieCard(item)));
  }

  const btnLeft = document.createElement('button');
  btnLeft.className = 'row-btn left';
  btnLeft.setAttribute('aria-label', 'Scroll left');
  btnLeft.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>`;

  const btnRight = document.createElement('button');
  btnRight.className = 'row-btn right';
  btnRight.setAttribute('aria-label', 'Scroll right');
  btnRight.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>`;

  const scrollAmt = () => Math.min(scroll.clientWidth * 0.8, 800);
  btnLeft.addEventListener('click', () => scroll.scrollBy({ left: -scrollAmt(), behavior: 'smooth' }));
  btnRight.addEventListener('click', () => scroll.scrollBy({ left: scrollAmt(), behavior: 'smooth' }));

  // Show/hide buttons based on scroll position
  const updateBtns = () => {
    btnLeft.style.opacity = scroll.scrollLeft > 10 ? '1' : '0';
    btnLeft.style.pointerEvents = scroll.scrollLeft > 10 ? 'all' : 'none';
    const atEnd = scroll.scrollLeft + scroll.clientWidth >= scroll.scrollWidth - 10;
    btnRight.style.opacity = atEnd ? '0' : '1';
    btnRight.style.pointerEvents = atEnd ? 'none' : 'all';
  };
  scroll.addEventListener('scroll', updateBtns);
  setTimeout(updateBtns, 100);

  wrapper.appendChild(btnLeft);
  wrapper.appendChild(scroll);
  wrapper.appendChild(btnRight);
  section.appendChild(wrapper);

  return section;
}

// Update a row's items after data loads
export function populateRow(rowEl, items) {
  const scroll = rowEl.querySelector('.row-scroll');
  if (!scroll) return;
  scroll.innerHTML = '';
  items.forEach(item => scroll.appendChild(createMovieCard(item)));
}
