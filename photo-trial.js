(() => {
  'use strict';
  const mount=()=>{
  const arena=document.querySelector('.arena');
  const image=document.querySelector('.mascot');
  const btn=document.getElementById('portraitToggle');
  const label=document.getElementById('portraitToggleLabel');
  const bubble=document.getElementById('mascotQuote');
  if(!arena || !image || !btn)return;
  const photoSource='https://manly-curses-generator.rainyrhino16.chatgpt.site/assets/tye-capybara-photo.webp';
  const mascotSource='https://manly-curses-generator.rainyrhino16.chatgpt.site/assets/tye-mascot.webp';
  const photoAlt='Tye Clodd in a fluffy orange animal-ear hat holding a turquoise plush dinosaur';
  const cartoonAlt='Illustrated Tye Clodd in a NOT A MANCHILD shirt and blue wrestling gloves';
  let photoMode=true;
  const refresh=()=>{
    arena.classList.toggle('photo-mode',photoMode);
    image.src=photoMode?photoSource:mascotSource;
    image.alt=photoMode?photoAlt:cartoonAlt;
    label.textContent=photoMode?'CARTOON MODE':'PHOTO MODE';
    btn.setAttribute('aria-pressed',String(photoMode));
    btn.setAttribute('aria-label',photoMode?'Switch to original cartoon character':'Switch to real-photo character');
    if(bubble)bubble.textContent=photoMode?'I AM VERY SERIOUS ABOUT TINY INCONVENIENCES.':'PRESS THE BUTTON. I PICKED A GOOD ONE.';
  };
  btn.addEventListener('click',()=>{photoMode=!photoMode;refresh()});
  refresh();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
