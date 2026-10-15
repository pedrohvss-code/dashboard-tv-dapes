// =====================================================================
//  CONFIGURAÇÃO DO DASHBOARD — este é o único arquivo de edição rotineira
// =====================================================================
//  Símbolos seguem o padrão TradingView "BOLSA:TICKER".
//  Para descobrir um símbolo: pesquise em tradingview.com e copie o
//  prefixo + ticker exibido (ex.: BMFBOVESPA:PETR4).
// =====================================================================

window.DASH_CONFIG = {
  titulo: "Mesa RV",

  // Tempo de cada tela, em segundos
  tempoPorTela: 45,

  // Recarrega a página inteira a cada N horas (evita travamentos em uso contínuo)
  recarregarACadaHoras: 4,

  // ---------------------------------------------------------------
  // Pregão B3 (horário de Brasília). A B3 muda o horário conforme o
  // horário de verão dos EUA — a troca é automática.
  // Conferir em: b3.com.br > Soluções > Horário de negociação
  // ---------------------------------------------------------------
  pregao: {
    veraoEUA:   { preAbertura: "09:45", abertura: "10:00", call: "16:55", fechamento: "17:00" },
    invernoEUA: { preAbertura: "09:45", abertura: "10:00", call: "17:55", fechamento: "18:00" },
    // Feriados sem pregão (AAAA-MM-DD). Conferir no calendário da B3.
    feriados: [
      "2026-01-01", "2026-02-16", "2026-02-17", "2026-04-03", "2026-04-21",
      "2026-05-01", "2026-06-04", "2026-09-07", "2026-10-12", "2026-11-02",
      "2026-11-20", "2026-12-24", "2026-12-25", "2026-12-31",
    ],
  },

  // ---------------------------------------------------------------
  // Faixa de cotações do rodapé (sempre visível)
  // ---------------------------------------------------------------
  rodape: [
    { proName: "BMFBOVESPA:IBOV",   title: "Ibovespa" },
    { proName: "FX_IDC:USDBRL",     title: "Dólar" },
    { proName: "FX_IDC:EURBRL",     title: "Euro" },
    { proName: "FOREXCOM:SPXUSD",   title: "S&P 500" },
    { proName: "FOREXCOM:NSXUSD",   title: "Nasdaq 100" },
    { proName: "TVC:UKOIL",         title: "Brent" },
    { proName: "TVC:GOLD",          title: "Ouro" },
    { proName: "BITSTAMP:BTCUSD",   title: "Bitcoin" },
    { proName: "BMFBOVESPA:PETR4",  title: "PETR4" },
    { proName: "BMFBOVESPA:VALE3",  title: "VALE3" },
    { proName: "BMFBOVESPA:ITUB4",  title: "ITUB4" },
  ],

  // ---------------------------------------------------------------
  // Telas em rotação.
  //  layout: grid CSS (cada letra/palavra é uma área)
  //  widgets: { area, tipo, opcoes }
  //  Tipos disponíveis: grafico, mini, cotacoes, visaoGeral,
  //                     destaques, heatmap, calendario
  // ---------------------------------------------------------------
  telas: [
    {
      titulo: "Brasil",
      layout: `"graf dolar" "graf acoes" "graf acoes"`,
      colunas: "2fr 1fr",
      widgets: [
        { area: "graf",  tipo: "grafico", opcoes: { symbol: "BMFBOVESPA:IBOV", interval: "5" } },
        { area: "dolar", tipo: "mini",    opcoes: { symbol: "FX_IDC:USDBRL" } },
        { area: "acoes", tipo: "cotacoes", opcoes: {
            symbolsGroups: [{
              name: "Ações B3",
              symbols: [
                { name: "BMFBOVESPA:PETR4", displayName: "Petrobras PN" },
                { name: "BMFBOVESPA:VALE3", displayName: "Vale ON" },
                { name: "BMFBOVESPA:ITUB4", displayName: "Itaú PN" },
                { name: "BMFBOVESPA:BBDC4", displayName: "Bradesco PN" },
                { name: "BMFBOVESPA:BBAS3", displayName: "Banco do Brasil ON" },
                { name: "BMFBOVESPA:B3SA3", displayName: "B3 ON" },
                { name: "BMFBOVESPA:WEGE3", displayName: "WEG ON" },
                { name: "BMFBOVESPA:ABEV3", displayName: "Ambev ON" },
              ],
            }],
          } },
      ],
    },
    {
      titulo: "Mundo",
      layout: `"lista sp" "lista brent"`,
      colunas: "1fr 1fr",
      widgets: [
        { area: "lista", tipo: "cotacoes", opcoes: {
            symbolsGroups: [
              { name: "Índices", symbols: [
                { name: "FOREXCOM:SPXUSD", displayName: "S&P 500" },
                { name: "FOREXCOM:NSXUSD", displayName: "Nasdaq 100" },
                { name: "FOREXCOM:DJI",    displayName: "Dow Jones" },
                { name: "INDEX:DEU40",     displayName: "DAX" },
                { name: "INDEX:NKY",       displayName: "Nikkei 225" },
              ] },
              { name: "Moedas", symbols: [
                { name: "FX_IDC:USDBRL", displayName: "USD/BRL" },
                { name: "FX_IDC:EURBRL", displayName: "EUR/BRL" },
                { name: "CAPITALCOM:DXY", displayName: "DXY" },
              ] },
              { name: "Commodities", symbols: [
                { name: "TVC:UKOIL",  displayName: "Petróleo Brent" },
                { name: "TVC:GOLD",   displayName: "Ouro" },
                { name: "TVC:USOIL",  displayName: "Petróleo WTI" },
                { name: "TVC:SILVER", displayName: "Prata" },
              ] },
            ],
          } },
        { area: "sp",    tipo: "mini", opcoes: { symbol: "FOREXCOM:SPXUSD" } },
        { area: "brent", tipo: "mini", opcoes: { symbol: "TVC:UKOIL" } },
      ],
    },
    {
      titulo: "Mapa de calor · B3",
      layout: `"mapa"`,
      colunas: "1fr",
      widgets: [
        { area: "mapa", tipo: "heatmap", opcoes: { dataSource: "IBOV", exchanges: [] } },
      ],
    },
  ],

  // ---------------------------------------------------------------
  // Faixa de notícias corrida (RSS lido via api.rss2json.com, que
  // libera o acesso pelo navegador; o serviço guarda cache de ~1h)
  // ---------------------------------------------------------------
  noticias: {
    fontes: [
      { nome: "InfoMoney",   url: "https://www.infomoney.com.br/feed/" },
      { nome: "Money Times", url: "https://www.moneytimes.com.br/feed/" },
      { nome: "Valor",       url: "https://pox.globo.com/rss/valor/" },
    ],
    atualizarACadaMin: 10,
    maxHorasAtras: 24,       // ignora notícias mais antigas que isso
    velocidade: 110,         // pixels por segundo
  },
};
