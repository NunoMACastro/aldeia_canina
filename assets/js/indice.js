/* Comportamentos do site: menu «Entidades», coluna lateral perante figuras largas e índice que
   marca a secção que está a ser lida (no índice lateral e no do telemóvel).
   Melhoria progressiva: sem este script, os índices funcionam como listas de ligações.
   Não recolhe nem envia dados. */
(function () {
  "use strict";
  /* O menu «Entidades» fecha com Escape, com um toque ou clique fora dele, quando o foco
     sai dele (Tab) e quando se volta à página pelo histórico; sem este script, abre e fecha
     só no próprio botão. Usa pointerdown porque no Safari do iPhone um clique em zona sem
     ligação nem botão não chega ao documento. */
  var menu = document.querySelector(".menu");
  if (menu) {
    document.addEventListener("pointerdown", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    menu.addEventListener("focusout", function (e) {
      if (menu.open && e.relatedTarget && !menu.contains(e.relatedTarget)) menu.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); }
    });
    window.addEventListener("pageshow", function () { menu.open = false; });
  }
  /* Em ecrãs sem coluna lateral, o botão «Índice» aparece depois de o leitor passar o índice
     e leva-o de volta a ele, já aberto; sem este script, o botão fica escondido. */
  var aoIndice = document.querySelector(".ao-indice");
  var indiceMovel = document.getElementById("indice");
  if (aoIndice && indiceMovel) {
    /* Verificação no scroll e não IntersectionObserver: um salto direto (ligação, movimento
       reduzido) pode passar por cima do índice sem ele nunca entrar no ecrã. */
    var marcado = false;
    var rodape = document.querySelector(".pe");
    var rever = function () {
      marcado = false;
      /* Só aparece quando o índice está visível na página (não na coluna lateral) e já
         ficou todo acima do ecrã; esconde-se quando o rodapé entra no ecrã, porque tem a
         mesma cor do botão e o botão taparia os contactos. */
      aoIndice.hidden = !indiceMovel.offsetParent || indiceMovel.getBoundingClientRect().bottom > 0 ||
        (rodape && rodape.getBoundingClientRect().top < window.innerHeight);
    };
    var pedir = function () { if (!marcado) { marcado = true; window.requestAnimationFrame(rever); } };
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    rever();
    /* Ao carregar, abre o índice, leva-o ao topo e põe o foco no seu título. O botão
       esconde-se a seguir, e o foco não pode ficar num elemento escondido; a navegação
       pela âncora devolveria o foco ao corpo da página, por isso é feita aqui. */
    aoIndice.addEventListener("click", function (e) {
      e.preventDefault();
      indiceMovel.open = true;
      indiceMovel.scrollIntoView({ block: "start" });
      indiceMovel.querySelector("summary").focus({ preventScroll: true });
    });
  }
  /* Apresentação: marca a primeira frase de cada secção (entrada) e de cada critério da
     secção 3, e parte as componentes do faseamento (secção 11) em etiquetas. Só mexe na
     forma: o texto fica igual, sem os pontos e vírgulas que separavam as componentes.
     Sem este script, as secções começam com um parágrafo normal e o faseamento é um quadro. */
  if (document.body.classList.contains("inicio")) {
    /* A frase acaba num ponto seguido de espaço e maiúscula, dentro do primeiro texto do
       elemento; se o elemento for uma só frase de texto simples, é toda a entrada. Quando a
       frase atravessa uma ligação, fica como está. */
    var marcarFrase = function (el, classe) {
      var t = el.firstChild;
      if (!t || t.nodeType !== 3) return;
      var m = /^[\s\S]*?[.!?](?=\s+[A-ZÀ-ÖØ-Þ«(])/.exec(t.data);
      if (!m) {
        if (el.childNodes.length !== 1 || !/[.!?]\s*$/.test(t.data)) return;
      } else {
        t.splitText(m[0].length);
      }
      var s = document.createElement("span");
      s.className = classe;
      el.insertBefore(s, t);
      s.appendChild(t);
    };
    Array.prototype.forEach.call(document.querySelectorAll(".doc > h2"), function (h) {
      var p = h.nextElementSibling;
      if (p && p.tagName === "P" && !p.querySelector("img")) marcarFrase(p, "entrada");
    });
    Array.prototype.forEach.call(document.querySelectorAll('.doc h2[id^="3-"] ~ table:not(h2[id^="4-"] ~ table) td:nth-child(2)'), function (td) {
      marcarFrase(td, "criterio-tipo");
    });
    /* Os números com espaço entre milhares («15 000») não partem no fim da linha */
    var andar = document.createTreeWalker(document.querySelector(".doc"), NodeFilter.SHOW_TEXT);
    while (andar.nextNode()) {
      if (/\d \d{3}\b/.test(andar.currentNode.data)) andar.currentNode.data = andar.currentNode.data.replace(/(\d) (?=\d{3}\b)/g, "$1 ");
    }
    /* No percurso das etapas (secção 5), sem o ponto e vírgula de lista no fim de cada etapa */
    Array.prototype.forEach.call(document.querySelectorAll('.doc h2[id^="5-"] ~ ol:not(h2[id^="6-"] ~ ol) > li'), function (li) {
      if (li.childNodes.length === 1 && li.firstChild.nodeType === 3) li.firstChild.data = li.firstChild.data.trim().replace(/[;.]$/, "");
    });
    Array.prototype.forEach.call(document.querySelectorAll('.doc h2[id^="11-"] ~ table:not(h2[id^="12-"] ~ table) td:nth-child(2)'), function (td) {
      if (td.children.length) return;
      var ul = document.createElement("ul");
      ul.className = "etiquetas";
      td.textContent.split(";").forEach(function (parte) {
        var texto = parte.trim().replace(/\.$/, "");
        if (!texto) return;
        var li = document.createElement("li");
        li.textContent = texto;
        ul.appendChild(li);
      });
      td.textContent = "";
      td.appendChild(ul);
    });
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
