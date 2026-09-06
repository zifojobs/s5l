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


  /* ---- testimonial lightbox: nothing loads until the visitor asks ----
     La visionneuse n'existe QUE sur l'accueil. Sans ce garde, ce bloc levait une
     TypeError sur les 5 autres pages et tout ce qui suit -- dont le revelateur
     d'animations -- ne s'executait jamais : les pages restaient a opacity 0. */
  var lbox = document.getElementById('lbox');
  var lvid = document.getElementById('lboxVid');
  var lclosebtn = document.getElementById('lboxClose');
  if (lbox && lvid && lclosebtn) {
    var opener = null;
    var lclose = function(){
      lbox.removeAttribute('data-open');
      setTimeout(function(){ lbox.hidden = true; }, 320);
      lvid.pause(); lvid.removeAttribute('src'); lvid.load();
      document.body.style.overflow = '';
      if (opener) { opener.focus(); opener = null; }
    };
    [].slice.call(document.querySelectorAll('.vcard-btn')).forEach(function(b){
      b.addEventListener('click', function(){
        opener = b;
        /* Le portfolio est en 16/9, les echantillons de format sont verticaux.
           On reporte le ratio du bouton sur la visionneuse AVANT de charger, sinon
           la video vertical part dans la boite 16/9 par defaut. Pas de data-ratio
           (cas des temoignages) = on retire l'attribut, donc retour au 16/9. */
        var ratio = b.getAttribute('data-ratio');
        if (ratio) { lvid.setAttribute('data-ratio', ratio); }
        else { lvid.removeAttribute('data-ratio'); }
        /* Deux rendus depuis le 06/09 : X.mp4 pour le grand ecran, X-m.mp4 pour le
           telephone. Shabeeb signalait les deux defauts LE MEME JOUR -- image
           bloquee et lenteur sur mobile -- et ils tirent en sens inverse : un
           fichier unique ne peut pas repondre aux deux. Le choix se fait ici, au
           clic, jamais au chargement de la page. */
        var src = b.getAttribute('data-video');
        var bureau = src;
        var eco = !!(navigator.connection && navigator.connection.saveData);
        if (eco || matchMedia('(max-width: 820px)').matches) {
          src = src.replace(/\.mp4$/, '-m.mp4');
        }
        /* Filet : si le rendu mobile manque, on retombe sur le fichier bureau
           plutot que de laisser une visionneuse vide. Une seule tentative. */
        lvid.onerror = function(){
          if (lvid.getAttribute('src') === bureau) return;
          lvid.src = bureau; lvid.load(); lvid.play().catch(function(){});
        };
        lvid.src = src;
        lvid.load();   /* preload="none" : sans load(), un play() refuse ne charge rien du tout */
        lbox.hidden = false;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function(){ lbox.setAttribute('data-open','true'); });
        lvid.play().catch(function(){});
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
     remplace donc la video par le meme montage joue en cinq plans : 407 Ko au
     lieu de 2,8 Mo. Les images sont creees ICI et pas dans le HTML, sinon le
     grand ecran les telechargerait pour rien -- un display:none ne l'empeche pas. */
  var v = document.getElementById('heroVideo');
  if (v && (reduce || matchMedia('(max-width: 820px)').matches)) {
    v.removeAttribute('autoplay');
    v.pause();
    var media = v.parentNode;
    var bande = document.createElement('div');
    bande.className = 'hero-slides';
    bande.setAttribute('aria-hidden', 'true');
    /* Le premier plan est le poster deja charge : il reste dessous en permanence
       et fait aussi le cinquieme temps du cycle. Les 4 autres passent au-dessus. */
    var plans = ['hero-poster', 'hero-s1', 'hero-s2', 'hero-s3', 'hero-s4'];
    if (reduce) plans = ['hero-poster'];   /* mouvement refuse : le plan fixe suffit */
    plans.forEach(function(nom, i){
      var im = document.createElement('img');
      im.src = 'assets/' + nom + '.jpg';
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
