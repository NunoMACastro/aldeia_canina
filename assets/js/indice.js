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

    /* Temas das secções 7 a 9: uma sequência de três ou mais parágrafos que abrem por um tema
       («Na energia, …», «Para poupar água, …») passa a blocos lado a lado, com o tema à vista.
       O tema é o início do próprio parágrafo, marcado; o texto fica igual. Um parágrafo curto
       entre dois temas («O saneamento segue…») entra na sequência, com o sujeito como tema. */
    var TEMA = /^((?:Na|No|Nas|Nos|Para|Quanto (?:a|ao|aos|à|às))\s[^,.;:]{2,40}),\s/;
    var SUJEITO = /^((?:O|A|Os|As)\s[^\s,.;:]+)\s/;
    var abreTema = function (el) {
      return !!el && el.tagName === "P" && !!el.firstChild && el.firstChild.nodeType === 3 && TEMA.test(el.firstChild.data);
    };
    Array.prototype.forEach.call(document.querySelectorAll('.doc > h2[id^="7-"], .doc > h2[id^="8-"], .doc > h2[id^="9-"]'), function (h) {
      var els = [];
      for (var el = h.nextElementSibling; el && el.tagName !== "H2"; el = el.nextElementSibling) els.push(el);
      var marca = els.map(function (el, i) {
        if (abreTema(el)) return TEMA;
        var ponte = el.tagName === "P" && el.firstChild && el.firstChild.nodeType === 3 && el.textContent.length < 200 &&
          abreTema(els[i - 1]) && abreTema(els[i + 1]) && SUJEITO.test(el.firstChild.data);
        return ponte ? SUJEITO : null;
      });
      var seq = [];
      var fechar = function () {
        if (seq.length >= 3) {
          var caixa = document.createElement("div");
          caixa.className = "temas";
          seq[0].el.parentNode.insertBefore(caixa, seq[0].el);
          seq.forEach(function (t) {
            var texto = t.el.firstChild;
            var m = t.re.exec(texto.data);
            var corte = t.re === TEMA ? m[1].length + 1 : m[1].length;
            texto.splitText(corte);
            var rotulo = document.createElement("span");
            rotulo.className = "tema-t";
            t.el.insertBefore(rotulo, texto);
            rotulo.appendChild(texto);
            t.el.classList.add("tema");
            caixa.appendChild(t.el);
          });
        }
        seq = [];
      };
      els.forEach(function (el, i) { if (marca[i]) seq.push({ el: el, re: marca[i] }); else fechar(); });
      fechar();
    });

    /* Resumo primeiro, detalhe a pedido. Em cada secção ficam à vista o título, o primeiro
       parágrafo (com a entrada), as peças visuais e a frase com dois pontos que as introduz;
       o resto fica fechado até o leitor pedir, num botão no fim da secção. Ficam sempre
       abertos «Sobre este documento» e a §12, que têm as ressalvas; as secções 1 e 3 e o
       quadro da 10, que resumem o conceito, os critérios do terreno e as
       condicionantes; os parágrafos de prudência que se leem sozinhos (a aldeia não substitui
       cuidados veterinários, as câmaras em direto fora da primeira fase); e o que for tão
       curto que um botão não compensa. Na §4, cada entrada da grelha abre só a sua subsecção.
       As partes fechadas usam hidden="until-found": a pesquisa do browser encontra-as e
       abre-as onde isso é suportado. Sem este script e na impressão, aparece tudo. */
    var doc = document.querySelector(".doc");
    var PECAS = '[id^="2-"] + table, [id^="3-"] ~ table:not([id^="4-"] ~ table), [id^="3-"] ~ ul:not([id^="4-"] ~ ul), ' +
      '.espacos, [id^="5-"] ~ ol:not([id^="6-"] ~ ol), [id^="10-"] ~ table:not([id^="11-"] ~ table), ' +
      '[id^="11-"] ~ table:not([id^="12-"] ~ table), .temas';
    var PRUDENCIA = /A aldeia não substitui cuidados veterinários|câmaras em direto para tutores/;
    var CURTO = 300;
    var seccoes = [];
    Array.prototype.forEach.call(doc.children, function (el) {
      if (el.tagName === "H2") seccoes.push({ h2: el, els: [] });
      else if (seccoes.length) seccoes[seccoes.length - 1].els.push(el);
    });
    var registos = [];
    var controlos = [];
    var n = 0;
    var aberta = function (parte) { return !parte.hasAttribute("hidden"); };
    var mostrar = function (partes, abrir) {
      partes.forEach(function (parte) {
        if (abrir && !aberta(parte)) {
          parte.removeAttribute("hidden");
          parte.classList.add("a-abrir");
        } else if (!abrir) {
          parte.setAttribute("hidden", "until-found");
          parte.classList.remove("a-abrir");
        }
      });
    };
    seccoes.forEach(function (s, k) {
      if (/^(sobre-este-documento|1-|3-|12-)/.test(s.h2.id)) return;
      var visivel = function (el, i) {
        if (i === 0 && el.tagName === "P") return true;
        if (el.matches(PECAS)) return true;
        if (el.tagName === "P" && PRUDENCIA.test(el.textContent)) return true;
        var seguinte = s.els[i + 1];
        return el.tagName === "P" && /:\s*$/.test(el.textContent) && !!seguinte && seguinte.matches(PECAS);
      };
      var escondidos = s.els.filter(function (el, i) { return !visivel(el, i); });
      var texto = escondidos.reduce(function (t, el) { return t + el.textContent.trim().length; }, 0);
      if (!escondidos.length || (texto < CURTO && !escondidos.some(function (el) { return el.querySelector("img"); }))) return;
      /* Agrupa os elementos fechados em blocos seguidos; na §4, um grupo por subsecção */
      var quatro = /^4-/.test(s.h2.id);
      var grupos = [];
      var grupo = null;
      var parte = null;
      s.els.forEach(function (el, i) {
        if (visivel(el, i)) { parte = null; return; }
        if (!grupo || (quatro && el.tagName === "H3")) { grupo = []; grupos.push(grupo); parte = null; }
        if (!parte) {
          parte = document.createElement("div");
          parte.className = "detalhe";
          parte.id = "detalhe-" + (++n);
          parte.setAttribute("hidden", "until-found");
          parte.setAttribute("tabindex", "-1");
          doc.insertBefore(parte, el);
          grupo.push(parte);
        }
        parte.appendChild(el);
      });
      var todas = [].concat.apply([], grupos);
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "ler-mais";
      botao.setAttribute("aria-controls", todas.map(function (p) { return p.id; }).join(" "));
      doc.insertBefore(botao, seccoes[k + 1] ? seccoes[k + 1].h2 : null);
      /* O estado diz-se num só sinal, o rótulo (sem aria-expanded, que o contradiria). Com a
         secção só em parte aberta (uma subsecção da §4, por exemplo), oferece o resto. */
      var atualizar = function () {
        var completa = todas.every(aberta);
        botao.classList.toggle("aberto", completa);
        botao.textContent = completa ? "Mostrar só o resumo" : "Ler a secção completa";
      };
      atualizar();
      controlos.push({ todas: todas, atualizar: atualizar });
      grupos.forEach(function (g) {
        var abrirGrupo = function () { mostrar(g, true); atualizarTudo(); };
        g.forEach(function (p) {
          registos.push({ parte: p, abrir: abrirGrupo });
          p.addEventListener("beforematch", abrirGrupo);
        });
      });
      /* Ao abrir, o leitor vai para o primeiro texto acabado de abrir (na §4, a 4.1, logo
         abaixo da grelha), com o foco nele. Ao fechar, volta ao título da secção, para não
         ficar a meio de texto que desapareceu, e o foco fica no botão. */
      botao.addEventListener("click", function () {
        var novas = todas.filter(function (p) { return !aberta(p); });
        if (novas.length) {
          mostrar(novas, true);
          atualizarTudo();
          novas[0].scrollIntoView({ block: "start" });
          novas[0].focus({ preventScroll: true });
        } else {
          mostrar(todas, false);
          atualizarTudo();
          s.h2.scrollIntoView({ block: "start" });
        }
      });
    });
    /* §4 como passeio: em cada espaço, a aguarela e a legenda passam a uma coluna própria, fixa
       ao lado do texto no ecrã largo e por cima dele no estreito. No ecrã largo os lados alternam: texto à esquerda e imagem
       à direita no primeiro espaço, o contrário no segundo, e assim por diante. Só reorganiza:
       o texto e as figuras são os mesmos. */
    var passeio = Array.prototype.filter.call(doc.querySelectorAll(":scope > .detalhe"), function (parte) {
      var h3 = parte.firstElementChild;
      return !!h3 && h3.tagName === "H3" && /^4/.test(h3.id) && !!parte.querySelector(":scope > p > img:only-child");
    });
    passeio.forEach(function (parte, i) {
      var h3 = parte.firstElementChild;
      var fig = parte.querySelector(":scope > p > img:only-child").parentNode;
      var leg = fig.nextElementSibling;
      var coluna = document.createElement("div");
      coluna.className = "passeio-fig";
      coluna.appendChild(fig);
      if (leg && leg.tagName === "P" && leg.querySelector(":scope > em:only-child")) coluna.appendChild(leg);
      var texto = document.createElement("div");
      texto.className = "passeio-texto";
      while (h3.nextSibling) texto.appendChild(h3.nextSibling);
      parte.classList.add("passeio");
      if (i % 2) parte.classList.add("passeio-alterno");
      parte.appendChild(coluna);
      parte.appendChild(texto);
    });

    /* Um só botão, na coluna lateral, abre ou fecha todas as secções */
    var tudo = null;
    var atualizarTudo = function () {
      controlos.forEach(function (c) { c.atualizar(); });
      if (!tudo) return;
      var todasAbertas = controlos.every(function (c) { return c.todas.every(aberta); });
      tudo.classList.toggle("aberto", todasAbertas);
      tudo.textContent = todasAbertas ? "Fechar todas as secções" : "Abrir todas as secções";
    };
    var lado = document.querySelector(".lado");
    if (controlos.length && lado) {
      tudo = document.createElement("button");
      tudo.type = "button";
      tudo.className = "abrir-tudo";
      tudo.setAttribute("aria-controls", registos.map(function (r) { return r.parte.id; }).join(" "));
      tudo.addEventListener("click", function () {
        var abrir = !tudo.classList.contains("aberto");
        controlos.forEach(function (c) { mostrar(c.todas, abrir); });
        atualizarTudo();
      });
      lado.appendChild(tudo);
      atualizarTudo();
    }
    /* Uma ligação ou um endereço para um ponto dentro de uma parte fechada (índice, grelha da
       §4, «ver secção 4.9», ligação partilhada) abre primeiro o grupo onde ele está. */
    var abrirAlvo = function (id) {
      var alvo = id && document.getElementById(id);
      var parte = alvo && alvo.closest(".detalhe[hidden]");
      if (!parte) return null;
      registos.forEach(function (r) { if (r.parte === parte) r.abrir(); });
      return alvo;
    };
    var alvoDe = function (href) {
      try { return decodeURIComponent(href.slice(1)); } catch (e) { return href.slice(1); }
    };
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a) abrirAlvo(alvoDe(a.getAttribute("href")));
    }, true);
    var irParaHash = function () {
      var alvo = abrirAlvo(alvoDe(location.hash));
      if (alvo) alvo.scrollIntoView({ block: "start" });
    };
    window.addEventListener("hashchange", irParaHash);
    /* Ao chegar por um endereço com âncora, abre logo e só desce depois de a página carregar:
       antes disso, as imagens e as fontes ainda mudam as alturas e o scroll perde-se. */
    if (location.hash) {
      var inicial = abrirAlvo(alvoDe(location.hash));
      if (inicial) {
        window.addEventListener("load", function () { inicial.scrollIntoView({ block: "start", behavior: "instant" }); });
      }
    }
  }
  /* Em ecrãs largos, a coluna lateral recolhe enquanto uma figura larga lhe passa por cima;
     sem este script, a figura cobre-a por instantes. */
  var lado = document.querySelector(".lado");
  var largas = Array.prototype.slice.call(document.querySelectorAll(".doc p > img:only-child"))
    .map(function (i) { return i.parentNode; })
    .filter(function (p) { return !p.closest(".passeio"); })
    .concat(Array.prototype.slice.call(document.querySelectorAll(".doc .passeio")));
  if (lado && largas.length && window.matchMedia) {
    var largo = window.matchMedia("(min-width: 64.01rem)");
    var pendente = false;
    var verificar = function () {
      pendente = false;
      var tapa = false;
      if (largo.matches) {
        var r = lado.getBoundingClientRect();
        largas.forEach(function (p) {
          /* Uma parte fechada não ocupa altura nem tapa nada */
          if (p.closest("[hidden]") || getComputedStyle(p).display === "none") return;
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
