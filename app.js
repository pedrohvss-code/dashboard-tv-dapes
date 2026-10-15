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
    noticias:   ["timeline",             { ...BASE, feedMode: "all_symbols", displayMode: "regular" }],
    faixa:      ["ticker-tape",          { colorTheme: "dark", isTransparent: true, locale: "br", showSymbolLogo: true, displayMode: "adaptive" }],
  };

  function montarWidget(destino, tipo, opcoes) {
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

    def.widgets.forEach((w) => {
      const bloco = document.createElement("div");
      bloco.className = "bloco";
      bloco.style.gridArea = w.area;
      tela.appendChild(bloco);
      montarWidget(bloco, w.tipo, w.opcoes || {});
    });

    main.insertBefore(tela, nomeTela);
    telas.push({ el: tela, titulo: def.titulo });
  });

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

  // Setas do teclado / controle remoto: navegar. OK/Espaço: pausar.
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") mostrar(atual + 1);
    else if (e.key === "ArrowLeft") mostrar(atual - 1);
    else if (e.key === " " || e.key === "Enter") { pausado = !pausado; mostrar(atual); }
  });

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
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const fmtData = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const fmtFusoNY = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "short" });
  const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

  function agoraSP() {
    const p = {};
    fmtPartes.formatToParts(new Date()).forEach(({ type, value }) => (p[type] = value));
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
  //  Recarga periódica
  // ===================================================================
  if (CFG.recarregarACadaHoras > 0) {
    setTimeout(() => location.reload(), CFG.recarregarACadaHoras * 3600 * 1000);
  }
})();
