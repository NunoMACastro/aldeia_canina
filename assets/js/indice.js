/* Marca no índice a secção que está a ser lida (no índice lateral e no do telemóvel).
   Melhoria progressiva: sem este script, os índices funcionam como listas de ligações.
   Não recolhe nem envia dados. */
(function () {
  "use strict";
  /* No telemóvel, a barra de documentos desliza até à página atual. */
  var atual = document.querySelector(".barra a[aria-current='page']");
  var barra = atual && atual.closest("nav");
  if (barra && barra.scrollWidth > barra.clientWidth) {
    barra.scrollLeft = Math.max(0, atual.offsetLeft - 16);
  }
  /* Em ecrãs largos, a coluna lateral recolhe enquanto uma figura larga lhe passa por cima;
     sem este script, a figura cobre-a por instantes. */
  var lado = document.querySelector(".lado");
  var largas = Array.prototype.slice.call(document.querySelectorAll(".doc p > img:only-child")).map(function (i) { return i.parentNode; });
  if (lado && largas.length && window.matchMedia) {
    var largo = window.matchMedia("(min-width: 64.01rem)");
    var pendente = false;
    var verificar = function () {
      pendente = false;
      var tapa = false;
      if (largo.matches) {
        var r = lado.getBoundingClientRect();
        largas.forEach(function (p) {
          if (getComputedStyle(p).display === "none") return;
          var f = p.getBoundingClientRect();
          if (f.bottom > r.top && f.top < r.bottom) tapa = true;
        });
      }
      lado.classList.toggle("recolhido", tapa);
    };
    var pedir = function () { if (!pendente) { pendente = true; requestAnimationFrame(verificar); } };
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    verificar();
  }

  var links = Array.prototype.slice.call(document.querySelectorAll(".indice a[href^='#']"));
  if (!links.length || !("IntersectionObserver" in window)) return;

  var byId = {};
  links.forEach(function (a) {
    var id = decodeURIComponent(a.getAttribute("href").slice(1));
    (byId[id] = byId[id] || []).push(a);
  });
  var heads = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);

  function mark(id) {
    links.forEach(function (a) { a.removeAttribute("aria-current"); });
    (byId[id] || []).forEach(function (a) { a.setAttribute("aria-current", "true"); });
  }

  function update() {
    for (var i = heads.length - 1; i >= 0; i--) {
      if (heads[i].getBoundingClientRect().top < window.innerHeight * 0.35) { mark(heads[i].id); return; }
    }
    mark(heads[0].id);
  }

  var observer = new IntersectionObserver(update, { rootMargin: "0px 0px -60% 0px", threshold: [0, 1] });
  heads.forEach(function (h) { observer.observe(h); });
})();
