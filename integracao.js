/* Integração entre módulos: leva valores de Mercado, Acomodação e Transporte para Finanças.
   Nada é alterado sozinho: cada cartão mostra o valor, compara com o que Finanças usa hoje e só grava
   quando a pessoa clica. Depois de gravar, diz o que mudou e permite desfazer.
   Carregado depois de financas.js e antes de app.js; usa ls(), getBudget(), fmtEur(), etc. */

var FIN_SRC = {market:"Mercado", stay:"Acomodação", transport:"Transporte"};
var FIN_ROW_LABEL = {3:"Acomodação inicial", 4:"Depósito de aluguel", 5:"Primeiro aluguel", 6:"Alimentação", 7:"Transporte"};
var BUDGET_LABEL = {rent:"Aluguel", transport:"Transporte", groceries:"Mercado"};

function finSources(){ return ls("finSources") || {}; }
function markFinSource(key, src){
  var s = finSources();
  if(src) s[key] = src; else if(s[key]===undefined) return; else delete s[key];
  ls("finSources", s);
}
function finSrcBadge(key){
  var s = finSources()[key];
  return s ? '<span class="src-badge">vindo de '+FIN_SRC[s]+'</span>' : "";
}

/* changes: [{budget:"groceries", value:183} | {row:6, value:183}]. Devolve o resumo do que mudou. */
var finLastSnap = null, finApplying = false;
function applyToFinance(src, changes){
  ensureRendered("financas");
  finLastSnap = {budget: ls("budget"), ov: ls("gastosIniciaisOverrides"), src: ls("finSources")};
  var sc = finScenario(), said = [];
  changes.forEach(function(c){
    var v = Math.round(c.value*100)/100;
    if(c.budget){
      var b = getBudget(); b[c.budget] = v; ls("budget", b);
      markFinSource(c.budget, src);
      said.push(BUDGET_LABEL[c.budget]+" no orçamento mensal: "+fmtEur(v)+" por mês");
    } else {
      var ov = getGastosOverrides(); ov[c.row+"_"+sc] = v; saveGastosOverrides(ov);
      markFinSource("row"+c.row+"_"+sc, src);
      said.push(FIN_ROW_LABEL[c.row]+" no primeiro mês (cenário "+GASTOS_INICIAIS_CENARIOS.cols[sc]+"): "+fmtEur(v));
    }
  });
  finApplying = true;
  try{ afterFinanceChange(); } finally { finApplying = false; }
  return said;
}
function undoFinanceChange(){
  if(!finLastSnap) return;
  ls("budget", finLastSnap.budget);
  ls("gastosIniciaisOverrides", finLastSnap.ov);
  ls("finSources", finLastSnap.src);
  finLastSnap = null;
  finApplying = true;
  try{ afterFinanceChange(); } finally { finApplying = false; }
}
function afterFinanceChange(){
  ensureRendered("financas");
  renderBudget();
  renderOverview();
  refreshFinancas();
  renderGastosIniciais();
}

/* ---------- cartão "Levar para Finanças" ---------- */
var bridgeMsg = {};
function bridgeHtml(id, o){
  var msg = bridgeMsg[id];
  return '<div class="fin-bridge" data-bridge="'+id+'">'+
    '<div class="fin-bridge-h"><span class="eyebrow">'+(o.title||"Levar para Finanças")+'</span></div>'+
    (o.pre||"")+
    '<div class="fin-bridge-body'+(o.big?"":" no-val")+'">'+
      (o.big ? '<div class="fin-bridge-val"><span class="fin-big">'+o.big+'</span>'+(o.bigCap?'<span class="fin-cap">'+o.bigCap+'</span>':"")+'</div>' : "")+
      '<div class="fin-bridge-now">'+o.now+'</div>'+
    '</div>'+
    '<div class="fin-bridge-act">'+
      '<button type="button" class="btn '+(o.disabled?"btn-ghost":"btn-accent")+'" data-bridge-apply="'+id+'"'+(o.disabled?" disabled":"")+'>'+(o.disabled?(o.doneLabel||"Já está em Finanças"):o.btn)+'</button>'+
      '<a class="fin-link" href="#financas" data-bridge-go="1">Ver em Finanças '+phi("right")+'</a>'+
    '</div>'+
    (o.touch?'<p class="fin-bridge-touch">'+o.touch+'</p>':'')+
    '<p class="fin-bridge-msg" role="status">'+(msg ? msg : "")+'</p>'+
  '</div>';
}
/* liga o botão, o "ver em Finanças" e o "desfazer" de um cartão já inserido */
function bindBridge(root, id, rerender, apply){
  var btn = root.querySelector('[data-bridge-apply="'+id+'"]');
  if(btn) btn.addEventListener("click", function(){
    var said = apply();
    bridgeMsg[id] = '<b>Feito.</b> Em Finanças: '+said.map(escapeHtml).join("; ")+'. <button type="button" class="fin-link" data-bridge-undo="'+id+'">Desfazer</button>';
    refreshBridges(true);
  });
  var undo = root.querySelector('[data-bridge-undo="'+id+'"]');
  if(undo) undo.addEventListener("click", function(){
    undoFinanceChange();
    bridgeMsg[id] = "Desfeito. Finanças voltou ao que era antes.";
    refreshBridges(true);
  });
  var go = root.querySelector("[data-bridge-go]");
  if(go) go.addEventListener("click", function(e){ e.preventDefault(); goToSection("financas"); });
}

var BRIDGES = [];
/* Qualquer mudança que não veio de um botão "Usar" apaga os avisos "Feito" (o Desfazer deles ficaria velho). */
function refreshBridges(keep){
  if(!keep && !finApplying){ bridgeMsg = {}; finLastSnap = null; }
  BRIDGES.forEach(function(fn){ fn(); });
}
function bridgeInput(ids, fn){ ids.forEach(function(i){ bridgeMsg[i] = ""; }); fn(); }

function eurRound(v){ return Math.round(v); }
function nowLine(cur, kind, key){
  var b = ls("budget");
  var custom = key && b && b[key]!==undefined;
  var srcs = finSources();
  var src = key && srcs[key] ? " (vindo de "+FIN_SRC[srcs[key]]+")" : (custom ? " (valor que você definiu)" : " (estimativa padrão do site)");
  return 'Em Finanças hoje: <b>'+fmtEur(cur)+'</b>'+kind+src;
}
function overrideNow(rowId){
  var sc = finScenario(), ov = getGastosOverrides(), k = rowId+"_"+sc;
  var base = GASTOS_INICIAIS_CENARIOS.rows[rowId].v[sc];
  return {v: ov[k]!=null ? ov[k] : base, edited: ov[k]!=null, src: finSources()["row"+rowId+"_"+sc]};
}
function rowNowLine(rowId, label){
  var o = overrideNow(rowId), sc = finScenario();
  var tag = o.src ? " (vindo de "+FIN_SRC[o.src]+")" : (o.edited ? " (valor que você definiu)" : " (estimativa padrão)");
  return 'Em Finanças hoje, em '+label+' (cenário '+GASTOS_INICIAIS_CENARIOS.cols[sc]+'): <b>'+fmtEur(o.v)+'</b>'+tag;
}

/* ---------- Mercado ---------- */
var MARKET_PERIODS = [{k:"week", l:"1 semana", f:4.33}, {k:"fortnight", l:"2 semanas", f:2.165}, {k:"month", l:"1 mês", f:1}];
function marketPeriod(){ var p = ls("marketPeriod"); return MARKET_PERIODS.filter(function(x){ return x.k===p; })[0] || MARKET_PERIODS[2]; }
function marketTotals(){
  var cart = getMarketCart(), total = 0, cats = {};
  cart.forEach(function(it){ var s = (it.qty||0)*(it.price||0); total += s; cats[it.cat||"Outros"] = (cats[it.cat||"Outros"]||0)+s; });
  var list = Object.keys(cats).map(function(k){ return {cat:k, v:cats[k]}; }).filter(function(c){ return c.v>0; }).sort(function(a,b){ return b.v-a.v; });
  return {total:total, cats:list};
}
function renderMarketFin(){
  var wrap = document.getElementById("marketFinWrap");
  if(!wrap) return;
  var t = marketTotals(), p = marketPeriod();
  if(t.total<=0){
    wrap.innerHTML = '<div class="card"><div class="empty">Coloque preço e quantidade nos itens da cesta para estimar quanto você gasta por mês e levar esse valor para Finanças.</div></div>';
    return;
  }
  var monthly = eurRound(t.total*p.f), cur = getBudget().groceries;
  var max = t.cats[0].v;
  var pre = '<div class="mk-period" role="radiogroup" aria-label="Período que a cesta cobre"><span class="fin-lbl">Essa cesta cobre</span>'+
    MARKET_PERIODS.map(function(x){ return '<button type="button" role="radio" aria-checked="'+(x.k===p.k)+'" class="subtab'+(x.k===p.k?' active':'')+'" data-mkp="'+x.k+'">'+x.l+'</button>'; }).join("")+'</div>'+
    '<ul class="mk-cats">'+t.cats.slice(0,6).map(function(c){ return '<li><span>'+escapeHtml(c.cat)+'</span><i style="--w:'+Math.max(4, Math.round(c.v/max*100))+'%"></i><b>'+fmtEur(c.v)+'</b></li>'; }).join("")+'</ul>';
  wrap.innerHTML = '<div class="card">'+bridgeHtml("market", {
    pre:pre, big:fmtEur(monthly), bigCap:'por mês'+brlSub(monthly),
    now:nowLine(cur, " por mês", "groceries"),
    btn:'Usar '+fmtEur(monthly)+' em Finanças', disabled: Math.abs(cur-monthly)<0.5 && Math.abs(overrideNow(6).v-monthly)<0.5,
    touch:'Muda o <b>Mercado</b> do orçamento mensal e a <b>Alimentação</b> do primeiro mês.'
  })+'</div>';
  wrap.querySelectorAll("[data-mkp]").forEach(function(b){ b.addEventListener("click", function(){ ls("marketPeriod", b.dataset.mkp); bridgeMsg.market = ""; renderMarketFin(); }); });
  bindBridge(wrap, "market", renderMarketFin, function(){ return applyToFinance("market", [{budget:"groceries", value:monthly}, {row:6, value:monthly}]); });
}

/* ---------- Acomodação ---------- */
function stayInitialEur(){
  var id = ls("selectedStay");
  var s = getStayOptions().filter(function(o){ return o.id===id; })[0];
  return s ? {s:s, eur:(s.noites*s.preco)/getCotacao()} : null;
}
var stayRentDraft = null;
function renderStayFin(){
  var wrap = document.getElementById("stayFinWrap");
  if(!wrap) return;
  wrap.innerHTML = '<div class="card" id="stayFinInitial"></div><div class="card" id="stayFinRent"></div>';
  var ini = stayInitialEur(), box = document.getElementById("stayFinInitial");
  if(!ini){
    box.innerHTML = '<span class="eyebrow">Levar para Finanças · hospedagem inicial</span><div class="empty" style="margin-top:10px;">Marque uma opção na tabela de hospedagem inicial para levar o valor dela para Finanças.</div>';
  } else {
    var eur = eurRound(ini.eur), o = overrideNow(3);
    box.innerHTML = bridgeHtml("stayInitial", {
      title:"Levar para Finanças · hospedagem inicial",
      big:fmtEur(eur), bigCap:escapeHtml(ini.s.nome)+' · '+ini.s.noites+' noites'+brlSub(eur),
      now:rowNowLine(3, "Acomodação inicial"),
      btn:'Usar '+fmtEur(eur)+' em Finanças', disabled:Math.abs(o.v-eur)<0.5,
      touch:'Muda a <b>Acomodação inicial</b> em "Antes de viajar".'
    });
    bindBridge(box, "stayInitial", renderStayFin, function(){ return applyToFinance("stay", [{row:3, value:eur}]); });
  }
  var rent = getBudget().rent, draft = stayRentDraft===null ? rent : stayRentDraft, rbox = document.getElementById("stayFinRent");
  var pre = '<div class="fin-bridge-in"><label for="stayRentIn">Aluguel mensal que pretendo pagar</label><span class="fin-money-in"><span aria-hidden="true">€</span><input type="number" min="0" step="10" id="stayRentIn" value="'+draft+'"></span><span class="fin-in-brl" id="stayRentBrl">'+fmtBrlApprox(draft)+'</span></div>';
  rbox.innerHTML = bridgeHtml("stayRent", {
    title:"Levar para Finanças · aluguel mensal", pre:pre,
    big:"",
    now:nowLine(rent, " por mês", "rent"),
    btn:'Usar '+fmtEur(draft)+' em Finanças', disabled:Math.abs(rent-draft)<0.5,
    touch:'Muda o <b>Aluguel</b> do orçamento mensal e o <b>Depósito</b> e o <b>Primeiro aluguel</b> do primeiro mês.'
  });
  var inp = document.getElementById("stayRentIn");
  inp.addEventListener("input", function(){
    stayRentDraft = Math.max(0, parseFloat(inp.value)||0);
    var bt = rbox.querySelector("[data-bridge-apply]"), same = Math.abs(rent-stayRentDraft)<0.5;
    if(bt){ bt.disabled = same; bt.className = "btn "+(same?"btn-ghost":"btn-accent"); bt.textContent = same ? "Já está em Finanças" : "Usar "+fmtEur(stayRentDraft)+" em Finanças"; }
    document.getElementById("stayRentBrl").textContent = fmtBrlApprox(stayRentDraft);
  });
  bindBridge(rbox, "stayRent", renderStayFin, function(){
    var v = stayRentDraft===null ? rent : stayRentDraft;
    stayRentDraft = null;
    return applyToFinance("stay", [{budget:"rent", value:v}, {row:4, value:v}, {row:5, value:v}]);
  });
}

/* ---------- Transporte ---------- */
/* Tarifas de Dublin (Zona 1) já citadas na aba: 90 min €2,00 adulto; teto de €3,00/dia e €12,00/semana; Leap Student com 50% de desconto. */
var LEAP_FARE = 2.00, LEAP_DAY_CAP = 3.00, LEAP_WEEK_CAP = 12.00;
function transportPlan(){ return Object.assign({days:5, trips:2, student:false}, ls("transportPlan")||{}); }
function transportMonthly(p){
  var perDay = Math.min(p.trips*LEAP_FARE, LEAP_DAY_CAP);
  var perWeek = Math.min(p.days*perDay, LEAP_WEEK_CAP);
  return perWeek*4.33*(p.student ? 0.5 : 1);
}
function renderTransportFin(){
  var wrap = document.getElementById("transportFinWrap");
  if(!wrap) return;
  var p = transportPlan(), monthly = eurRound(transportMonthly(p)), cur = getBudget().transport, o = overrideNow(7);
  function opts(from, to, sel, suffix){ var h = ""; for(var i=from; i<=to; i++) h += '<option value="'+i+'"'+(i===sel?' selected':'')+'>'+i+suffix+'</option>'; return h; }
  var pre = '<div class="tr-plan">'+
    '<label>Uso o transporte público<select id="trDays">'+opts(1,7,p.days," dia"+"s por semana").replace('>1 dias','>1 dia')+'</select></label>'+
    '<label>Faço<select id="trTrips">'+opts(1,6,p.trips," viagens por dia").replace('>1 viagens','>1 viagem')+'</select></label>'+
    '<label class="tr-check"><input type="checkbox" id="trStudent"'+(p.student?' checked':'')+'> Tenho Leap Student (50% de desconto)</label></div>';
  wrap.innerHTML = '<div class="card">'+bridgeHtml("transport", {
    pre:pre, big:fmtEur(monthly), bigCap:'por mês'+brlSub(monthly),
    now:nowLine(cur, " por mês", "transport"),
    btn:'Usar '+fmtEur(monthly)+' em Finanças', disabled:Math.abs(cur-monthly)<0.5 && Math.abs(o.v-monthly)<0.5,
    touch:'Estimativa com as tarifas de Dublin (Zona 1) e os tetos de €3,00 por dia e €12,00 por semana. Muda o <b>Transporte</b> do orçamento mensal e do primeiro mês.'
  })+'</div>';
  function save(){
    ls("transportPlan", {days:parseInt(document.getElementById("trDays").value,10), trips:parseInt(document.getElementById("trTrips").value,10), student:document.getElementById("trStudent").checked});
    bridgeMsg.transport = ""; renderTransportFin();
  }
  ["trDays","trTrips","trStudent"].forEach(function(id){ document.getElementById(id).addEventListener("change", save); });
  bindBridge(wrap, "transport", renderTransportFin, function(){ return applyToFinance("transport", [{budget:"transport", value:monthly}, {row:7, value:monthly}]); });
}

BRIDGES.push(renderMarketFin, renderStayFin, renderTransportFin);
