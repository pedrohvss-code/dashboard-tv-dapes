(function () {
  const CFG = window.DASH_CONFIG;
  const FUSO = "America/Sao_Paulo";

  // ===================================================================
  //  Widgets TradingView
  // ===================================================================
  const BASE = { colorTheme: "dark", isTransparent: true, locale: "br", width: "100%", height: "100%" };

  const WIDGETS = {
    grafico: ["advanced-chart", {
      autosize: true, interval: "5", timezone: FUSO, theme: "dark", style: "1", locale: "br",
      hide_top_toolbar: true, hide_volume: true, allow_symbol_change: false, save_image: false,
      calendar: false, backgroundColor: "#121826", support_host: "https://www.tradingview.com",
    }],
    mini:       ["mini-symbol-overview", { ...BASE, autosize: true, dateRange: "1D", chartOnly: false }],
    cotacoes:   ["market-quotes",        { ...BASE, showSymbolLogo: true }],
    visaoGeral: ["market-overview",      { ...BASE, dateRange: "1D", showChart: true, showSymbolLogo: true }],
    destaques:  ["hotlists",             { ...BASE, dateRange: "1D", exchange: "BMFBOVESPA", showChart: true, showSymbolLogo: true }],
    heatmap:    ["stock-heatmap", {
      ...BASE, isTransparent: false, exchanges: [], dataSource: "IBOV", grouping: "sector",
      blockSize: "market_cap_basic", blockColor: "change", symbolUrl: "",
      hasTopBar: false, isDataSetEnabled: false, isZoomEnabled: false, hasSymbolTooltip: true, isMonoSize: false,
    }],
    calendario: ["events",               { ...BASE, importanceFilter: "0,1", countryFilter: "br,us" }],
    faixa:      ["ticker-tape",          { colorTheme: "dark", isTransparent: true, locale: "br", showSymbolLogo: true, displayMode: "adaptive" }],
  };

  // Widgets novos do TradingView no formato Web Component (<tv-...>).
  // As opções viram atributos HTML (true = atributo presente, false = ausente).
  const COMPONENTES = {
    mapaEconomico: ["tv-economic-map", { region: "global", theme: "dark", transparent: true }],
  };
  const modulosCarregados = new Set();

  function montarComponente(destino, [tag, padrao], opcoes) {
    if (!modulosCarregados.has(tag)) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = `https://widgets.tradingview-widget.com/w/br/${tag}.js`;
      document.head.appendChild(script);
      modulosCarregados.add(tag);
    }
    const el = document.createElement(tag);
    Object.entries({ ...padrao, ...opcoes }).forEach(([k, v]) => {
      if (v === true) el.setAttribute(k, "");
      else if (v !== false && v != null) el.setAttribute(k, v);
    });
    destino.appendChild(el);
  }

  function montarWidget(destino, tipo, opcoes) {
    if (COMPONENTES[tipo]) return montarComponente(destino, COMPONENTES[tipo], opcoes);
    const def = WIDGETS[tipo];
    if (!def) { console.warn("Tipo de widget desconhecido:", tipo); return; }
    const [nome, padrao] = def;

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    const alvo = document.createElement("div");
    alvo.className = "tradingview-widget-container__widget";
    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${nome}.js`;
    script.async = true;
    script.textContent = JSON.stringify({ ...padrao, ...opcoes });

    container.append(alvo, script);
    destino.appendChild(container);
  }

  // ===================================================================
  //  Telas em rotação
  // ===================================================================
  const main = document.getElementById("telas");
  const barra = document.getElementById("barra");
  const nomeTela = document.getElementById("nome-tela");
  const telas = [];

  CFG.telas.forEach((def) => {
    const tela = document.createElement("section");
    tela.className = "tela";
    const linhas = (def.layout.match(/"/g) || []).length / 2;
    tela.style.gridTemplateAreas = def.layout;
    tela.style.gridTemplateColumns = def.colunas || "1fr";
    tela.style.gridTemplateRows = `repeat(${linhas}, minmax(0, 1fr))`;

    main.insertBefore(tela, nomeTela);
    telas.push({ el: tela, titulo: def.titulo, def: def });
  });

  // Todas as telas são montadas logo no início: ao entrar na rotação já estão prontas
  function montarTela(t) {
    t.def.widgets.forEach((w) => {
      const bloco = document.createElement("div");
      bloco.className = "bloco";
      bloco.style.gridArea = w.area;
      t.el.appendChild(bloco);
      montarWidget(bloco, w.tipo, w.opcoes || {});
    });
  }

  let atual = -1;
  let pausado = false;
  let timer = null;

  function mostrar(i) {
    if (atual >= 0) telas[atual].el.classList.remove("ativa");
    atual = (i + telas.length) % telas.length;
    telas[atual].el.classList.add("ativa");
    nomeTela.textContent = `${telas[atual].titulo} · ${atual + 1}/${telas.length}${pausado ? " · pausado" : ""}`;
    reiniciarTimer();
  }

  function reiniciarTimer() {
    clearTimeout(timer);
    barra.style.transition = "none";
    barra.style.width = "0";
    if (pausado || telas.length < 2) return;
    void barra.offsetWidth; // força o reinício da animação
    barra.style.transition = `width ${CFG.tempoPorTela}s linear`;
    barra.style.width = "100%";
    timer = setTimeout(() => mostrar(atual + 1), CFG.tempoPorTela * 1000);
  }

  // Tela cheia: navegadores só permitem após uma ação do usuário (tecla/clique)
  function telaCheia() {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) return false;
    const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
    if (pedir) { try { pedir.call(el); } catch (err) { /* sem suporte */ } }
    return true;
  }
  document.addEventListener("click", telaCheia);

  // Controle remoto / teclado: setas navegam; OK/Espaço entra em tela cheia e depois pausa.
  // keyCode cobre navegadores de TV antigos que não preenchem e.key.
  document.addEventListener("keydown", (e) => {
    const k = e.key || "", c = e.keyCode;
    if (k === "ArrowRight" || c === 39) mostrar(atual + 1);
    else if (k === "ArrowLeft" || c === 37) mostrar(atual - 1);
    else if (k === " " || k === "Enter" || c === 13 || c === 32) {
      if (!telaCheia()) { pausado = !pausado; mostrar(atual); }
    }
  });

  telas.forEach(montarTela);
  mostrar(0);

  // ===================================================================
  //  Faixa de cotações e título
  // ===================================================================
  montarWidget(document.getElementById("rodape"), "faixa", { symbols: CFG.rodape });
  document.getElementById("titulo").textContent = CFG.titulo;

  // ===================================================================
  //  Relógio e status do pregão (sempre no horário de Brasília)
  // ===================================================================
  const fmtPartes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const fmtData = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const fmtFusoNY = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "short" });
  const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

  function agoraSP() {
    const p = {};
    fmtPartes.formatToParts(new Date()).forEach(({ type, value }) => (p[type] = value));
    if (p.hour === "24") p.hour = "00"; // alguns navegadores antigos mostram meia-noite como 24
    return {
      iso: `${p.year}-${p.month}-${p.day}`,
      seg: (+p.hour) * 3600 + (+p.minute) * 60 + (+p.second),
      hms: `${p.hour}:${p.minute}:${p.second}`,
    };
  }

  const emSeg = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 3600 + m * 60; };
  const pad = (n) => String(n).padStart(2, "0");
  const duracao = (s) => s >= 3600
    ? `${Math.floor(s / 3600)}h${pad(Math.floor((s % 3600) / 60))}`
    : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

  function ehDiaUtil(iso) {
    const dia = new Date(iso + "T12:00:00Z").getUTCDay();
    return dia !== 0 && dia !== 6 && !CFG.pregao.feriados.includes(iso);
  }

  function proximoPregao(iso, horaAbertura) {
    const d = new Date(iso + "T12:00:00Z");
    do { d.setUTCDate(d.getUTCDate() + 1); } while (!ehDiaUtil(d.toISOString().slice(0, 10)));
    return `${DIAS[d.getUTCDay()]}, ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)} às ${horaAbertura}`;
  }

  const elHora = document.getElementById("hora");
  const elData = document.getElementById("data");
  const elStatus = document.getElementById("status");
  const elContagem = document.getElementById("contagem");

  function definirStatus(classe, texto, contagem) {
    elStatus.className = `status ${classe}`;
    elStatus.textContent = texto;
    elContagem.textContent = contagem;
  }

  function atualizarRelogio() {
    const t = agoraSP();
    elHora.textContent = t.hms;
    const data = fmtData.format(new Date());
    elData.textContent = data.charAt(0).toUpperCase() + data.slice(1);

    const verao = /DT$/.test(fmtFusoNY.formatToParts(new Date()).find((x) => x.type === "timeZoneName").value);
    const h = verao ? CFG.pregao.veraoEUA : CFG.pregao.invernoEUA;
    const pre = emSeg(h.preAbertura), abre = emSeg(h.abertura), call = emSeg(h.call), fecha = emSeg(h.fechamento);
    const s = t.seg;

    if (!ehDiaUtil(t.iso)) {
      definirStatus("fechado", "Sem pregão hoje", `Próximo pregão: ${proximoPregao(t.iso, h.abertura)}`);
    } else if (s < pre) {
      definirStatus("fechado", "Pregão fechado", `Pré-abertura em ${duracao(pre - s)}`);
    } else if (s < abre) {
      definirStatus("leilao", "Pré-abertura", `Abertura em ${duracao(abre - s)}`);
    } else if (s < call) {
      definirStatus("aberto", "Pregão aberto", `Call de fechamento em ${duracao(call - s)}`);
    } else if (s < fecha) {
      definirStatus("leilao", "Call de fechamento", `Encerramento em ${duracao(fecha - s)}`);
    } else {
      definirStatus("fechado", "Pregão encerrado", `Próximo pregão: ${proximoPregao(t.iso, h.abertura)}`);
    }
  }

  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);

  // ===================================================================
  //  Faixa de notícias (RSS via rss2json)
  // ===================================================================
  const NC = CFG.noticias;
  const trilho = document.getElementById("noticias");
  const fmtHoraSP = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" });
  const decodificar = (txt) => new DOMParser().parseFromString(txt, "text/html").documentElement.textContent.trim();
  let pendentes = null;

  async function buscarFonte(fonte) {
    const r = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(fonte.url));
    const d = await r.json();
    if (d.status !== "ok") throw new Error(d.message || "falha no feed " + fonte.nome);
    // pubDate vem em UTC no formato "AAAA-MM-DD HH:MM:SS"
    return d.items.map((i) => ({ fonte: fonte.nome, titulo: decodificar(i.title), data: new Date(i.pubDate.replace(" ", "T") + "Z") }));
  }

  function criarNoticia(n) {
    const el = document.createElement("span");
    el.className = "noticia";
    const fonte = document.createElement("span");
    fonte.className = "fonte";
    fonte.textContent = n.fonte;
    el.appendChild(fonte);
    if (!isNaN(n.data)) {
      const hora = document.createElement("span");
      hora.className = "hora-noticia";
      hora.textContent = fmtHoraSP.format(n.data);
      el.appendChild(hora);
    }
    el.appendChild(document.createTextNode(n.titulo));
    return el;
  }

  function aplicarNoticias(itens) {
    trilho.classList.remove("correndo");
    trilho.innerHTML = "";
    // Conteúdo duplicado: a animação anda 50% e recomeça sem emenda visível
    for (let copia = 0; copia < 2; copia++) itens.forEach((n) => trilho.appendChild(criarNoticia(n)));
    trilho.style.animationDuration = `${trilho.scrollWidth / 2 / NC.velocidade}s`;
    trilho.classList.add("correndo");
  }

  // Notícias novas só entram quando a faixa completa uma volta
  trilho.addEventListener("animationiteration", () => {
    if (pendentes) { aplicarNoticias(pendentes); pendentes = null; }
  });

  async function atualizarNoticias() {
    // Uma fonte com erro não derruba as outras
    const listas = await Promise.all(NC.fontes.map((f) =>
      buscarFonte(f).catch((err) => { console.warn("Notícias:", err); return []; })));

    const limite = Date.now() - NC.maxHorasAtras * 3600 * 1000;
    const vistos = new Set();
    const itens = [].concat(...listas)
      .filter((n) => n.titulo && !(n.data < limite) && !vistos.has(n.titulo) && vistos.add(n.titulo))
      .sort((a, b) => b.data - a.data);

    if (!itens.length) return; // mantém as notícias anteriores se tudo falhar
    if (trilho.classList.contains("correndo")) pendentes = itens;
    else aplicarNoticias(itens);
  }

  atualizarNoticias();
  setInterval(atualizarNoticias, NC.atualizarACadaMin * 60 * 1000);
})();
