(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- hero headline lands on load ---- */
  requestAnimationFrame(function(){
    setTimeout(function(){ document.getElementById('hero').classList.add('lit'); }, 120);
  });

  /* ---- island menu ---- */
  var burger = document.getElementById('burger');
  function menu(on){
    document.body.setAttribute('data-menu', on ? 'open' : 'closed');
    burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    burger.setAttribute('aria-label', on ? 'Close menu' : 'Open menu');
    document.body.style.overflow = on ? 'hidden' : '';
  }
  burger.addEventListener('click', function(){
    menu(document.body.getAttribute('data-menu') !== 'open');
  });
  document.getElementById('sheet').addEventListener('click', function(e){
    if (e.target.tagName === 'A') menu(false);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && document.body.getAttribute('data-menu') === 'open'){ menu(false); burger.focus(); }
  });


  /* ---- testimonial lightbox: nothing loads until the visitor asks ---- */
  var lbox = document.getElementById('lbox'), lvid = document.getElementById('lboxVid'), opener = null;
  function lclose(){
    lbox.removeAttribute('data-open');
    setTimeout(function(){ lbox.hidden = true; }, 320);
    lvid.pause(); lvid.removeAttribute('src'); lvid.load();
    document.body.style.overflow = '';
    if (opener) { opener.focus(); opener = null; }
  }
  [].slice.call(document.querySelectorAll('.vcard-btn')).forEach(function(b){
    b.addEventListener('click', function(){
      opener = b;
      lvid.src = b.getAttribute('data-video');
      lvid.load();   /* preload="none" : sans load(), un play() refuse ne charge rien du tout */
      lbox.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function(){ lbox.setAttribute('data-open','true'); });
      lvid.play().catch(function(){});
      document.getElementById('lboxClose').focus();
    });
  });
  document.getElementById('lboxClose').addEventListener('click', lclose);
  lbox.addEventListener('click', function(e){ if (e.target === lbox) lclose(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !lbox.hidden) lclose(); });

  /* ---- scroll reveals: IntersectionObserver, never a scroll listener ---- */
  var groups = [].slice.call(document.querySelectorAll('.rise, #deck, #bento, #tstmGrid'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.classList.add('lit');
        io.unobserve(e.target);
      });
    }, { threshold:.22, rootMargin:'0px 0px -8% 0px' });
    groups.forEach(function(g){ io.observe(g); });
  } else {
    groups.forEach(function(g){ g.classList.add('lit'); });
  }

  /* ---- logo belt: duplicate the row so the loop has somewhere to go ---- */
  var belt = document.getElementById('belt');
  if (belt) {
    belt.innerHTML += belt.innerHTML;
    if (reduce) belt.style.animation = 'none';
  }

  /* ---- running timecode, the way a cut sheet is stamped ---- */
  var tc = document.getElementById('tc'), t0 = Date.now();
  function pad(n){ return (n<10?'0':'')+n; }
  if (tc && !reduce) {
    setInterval(function(){
      var s = Math.floor((Date.now()-t0)/1000);
      tc.textContent = pad(Math.floor(s/3600))+':'+pad(Math.floor(s/60)%60)+':'+pad(s%60);
    }, 1000);
  }

  /* ---- the brief asks for a still on mobile so the page stays light ---- */
  var v = document.getElementById('heroVideo');
  if (v && (reduce || matchMedia('(max-width: 820px)').matches)) {
    v.removeAttribute('autoplay'); v.pause();
  }
})();
