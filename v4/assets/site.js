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


  /* ---- video lightbox: nothing loads until the visitor asks ----
     La visionneuse n'existe pas sur toutes les pages. Sans ce garde, ce bloc levait
     une TypeError et tout ce qui suit -- dont le revelateur d'animations -- ne
     s'executait jamais : les pages restaient a opacity 0.

     Depuis le 08/09 les films sont chez Vimeo, plus dans le depot. Vimeo sert un
     debit adaptatif de 240p a 2160p : c'est LUI qui choisit la qualite selon le
     reseau du visiteur. Les deux rendus bureau/mobile bricoles le 06/09 -- et la
     bascule -m.mp4 qui allait avec -- n'ont donc plus de raison d'etre.
     L'iframe est CREEE au clic et DETRUITE a la fermeture : c'est ce qui arrete la
     lecture et coupe le son. Un simple hidden laisserait le film tourner. */
  var lbox = document.getElementById('lbox');
  var lframe = document.getElementById('lboxVid');
  var lclosebtn = document.getElementById('lboxClose');
  if (lbox && lframe && lclosebtn) {
    var opener = null;
    var lclose = function(){
      lbox.removeAttribute('data-open');
      setTimeout(function(){ lbox.hidden = true; }, 320);
      lframe.innerHTML = '';
      document.body.style.overflow = '';
      if (opener) { opener.focus(); opener = null; }
    };
    [].slice.call(document.querySelectorAll('.vcard-btn')).forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-vimeo');
        if (!id || !/^[0-9]+$/.test(id)) return;   /* rien d'autre qu'un identifiant ne part dans l'URL */
        opener = b;
        /* Le portfolio est en 16/9, les echantillons de format sont verticaux, et le
           temoignage Platinum est en 4/3. On reporte le ratio du bouton sur la boite
           AVANT de creer l'iframe, sinon la video part dans le 16/9 par defaut. */
        var ratio = b.getAttribute('data-ratio');
        if (ratio) { lframe.setAttribute('data-ratio', ratio); }
        else { lframe.removeAttribute('data-ratio'); }
        var f = document.createElement('iframe');
        f.src = 'https://player.vimeo.com/video/' + id +
                '?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1';
        f.setAttribute('frameborder','0');
        f.setAttribute('allow','autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share');
        f.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
        f.setAttribute('title', b.getAttribute('aria-label') || 'S5L film');
        lframe.appendChild(f);
        lbox.hidden = false;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function(){ lbox.setAttribute('data-open','true'); });
        lclosebtn.focus();
      });
    });
    lclosebtn.addEventListener('click', lclose);
    lbox.addEventListener('click', function(e){ if (e.target === lbox) lclose(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !lbox.hidden) lclose(); });
  }

  /* ---- scroll reveals: IntersectionObserver, never a scroll listener ---- */
  var groups = [].slice.call(document.querySelectorAll('.rise, #deck, #vgrid, #tstmGrid'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.classList.add('lit');
        io.unobserve(e.target);
      });
    }, { threshold:.12, rootMargin:'0px 0px -6% 0px' });
    groups.forEach(function(g){ io.observe(g); });

    /* Filet de securite. L'observateur ne voit que ce qui traverse l'ecran : un saut
       d'ancre, un rechargement en milieu de page ou un scroll tres rapide laissent des
       blocs a opacity 0 pour toujours. On repasse donc apres coup sur tout ce qui est
       deja au-dessus du bas de l'ecran. Mesure du 05/09 : 12 blocs sur 24 restaient
       invisibles apres un defilement par sauts. */
    var filet = function(){
      groups.forEach(function(g){
        if (!g.classList.contains('lit') && g.getBoundingClientRect().top < innerHeight) {
          g.classList.add('lit'); io.unobserve(g);
        }
      });
    };
    var prevu = false;
    addEventListener('scroll', function(){
      if (prevu) return;
      prevu = true;
      requestAnimationFrame(function(){ prevu = false; filet(); });
    }, { passive:true });
    addEventListener('load', filet);
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

  /* ---- the brief asks for a still on mobile so the page stays light ----
     Une image fixe, c'est un hero mort la ou arrive la moitie des visiteurs. On
     remplace donc la video par le meme montage joue en cinq plans : 105 Ko au
     lieu de 2,8 Mo. Les images sont creees ICI et pas dans le HTML, sinon le
     grand ecran les telechargerait pour rien -- un display:none ne l'empeche pas.
     Les cinq fichiers sont DEJA cadres en portrait par `hero-stills.py`, qui les
     tire du montage lui-meme. Deux raisons, mesurees le 08/09 : le hero fait
     100dvh, donc `object-fit:cover` d'une image 16/9 n'en gardait que 26 % de la
     largeur -- 4 plans sur 5 ne montraient plus aucun visage ; et le montage
     avait ete reordonne deux fois sans que ces images suivent. Regenerer depuis
     le montage supprime les deux problemes d'un coup. NE PAS remettre
     `hero-poster` ici : c'est le poster 16/9 de la video du grand ecran. */
  var v = document.getElementById('heroVideo');
  var etroit = matchMedia('(max-width: 820px)').matches;
  if (v && (reduce || etroit)) {
    v.removeAttribute('autoplay');
    v.pause();
    var media = v.parentNode;
    var bande = document.createElement('div');
    bande.className = 'hero-slides';
    bande.setAttribute('aria-hidden', 'true');
    /* Le premier plan reste dessous en permanence et fait aussi le cinquieme
       temps du cycle. Les 4 autres passent au-dessus.
       Sur GRAND ecran on n'arrive ici que par « mouvement reduit » : les plans
       portrait y seraient etires, c'est le poster 16/9 qu'il faut. */
    var plans = etroit ? ['hero-m1', 'hero-m2', 'hero-m3', 'hero-m4', 'hero-m5']
                       : ['hero-poster'];
    if (reduce) plans = plans.slice(0, 1);   /* mouvement refuse : un plan fixe suffit */
    /* Le dossier des images se DEDUIT du poster de la video, jamais ecrit en dur :
       sur Vercel il vaut `assets/`, dans WordPress `/wp-content/themes/.../media/`.
       C'est le seul chemin que ce script fabrique, et un chemin relatif ecrit en dur
       se resoudrait contre l'URL de la page -- donc en 404 sur /about/. */
    var base = (v.getAttribute('poster') || 'assets/hero-poster.jpg').replace(/[^\/]+$/, '');
    plans.forEach(function(nom, i){
      var im = document.createElement('img');
      im.src = base + nom + '.jpg';
      im.alt = '';
      im.decoding = 'async';
      if (i === 0) { im.className = 'hero-base'; }
      else { im.style.animationDelay = ((i - 1) * 4) + 's'; }
      bande.appendChild(im);
    });
    media.insertBefore(bande, v);
    v.remove();   /* sinon preload="metadata" continue de tirer sur la data */
  }
})();
