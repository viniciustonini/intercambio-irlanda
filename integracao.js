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
/* Tarifas de Dublin (Zona 1) de 2026 e tetos por cartão: veja LEAP_RATES em modulos.js. */
var LEAP_LABEL = {adult:"Adult Leap Card", young:"Young Adult Leap Card", student:"Student Leap Card"};
function transportPlan(){ return Object.assign({days:5, trips:2}, ls("transportPlan")||{}); }
function transportMonthly(p, rate){
  var perDay = Math.min(p.trips*rate.fare, rate.day);
  var perWeek = Math.min(p.days*perDay, rate.week);
  return perWeek*4.33;
}
function renderTransportFin(){
  var wrap = document.getElementById("transportFinWrap");
  if(!wrap) return;
  var rec = leapRecommend(leapAnswers()), rate = rec ? LEAP_RATES[rec] : null;
  if(!rec){
    wrap.innerHTML = '<div class="card"><div class="empty">Responda às perguntas do Leap Card acima para estimar quanto você vai gastar por mês.</div></div>';
    return;
  }
  if(!rate){
    wrap.innerHTML = '<div class="card"><div class="empty">'+(rec==="visitor" ? 'O Visitor Card é para poucos dias e tem preço fixo (€8, €18 ou €24), então não há estimativa mensal. Se a sua estadia passar de uma semana, refaça as perguntas.' : 'Para menores de 19 anos a tarifa é reduzida (€0,65 no 90 minutos), mas o teto de gasto não consta aqui. Confira no aplicativo Leap Card.')+'</div></div>';
    return;
  }
  var p = transportPlan(), monthly = eurRound(transportMonthly(p, rate)), cur = getBudget().transport, o = overrideNow(7);
  function opts(from, to, sel, one, many){ var h = ""; for(var i=from; i<=to; i++) h += '<option value="'+i+'"'+(i===sel?' selected':'')+'>'+i+' '+(i===1?one:many)+'</option>'; return h; }
  var pre = '<div class="tr-plan">'+
    '<label>Uso o transporte público<select id="trDays">'+opts(1,7,p.days,"dia por semana","dias por semana")+'</select></label>'+
    '<label>Faço<select id="trTrips">'+opts(1,6,p.trips,"viagem por dia","viagens por dia")+'</select></label></div>';
  wrap.innerHTML = '<div class="card">'+bridgeHtml("transport", {
    pre:pre, big:fmtEur(monthly), bigCap:'por mês com o '+LEAP_LABEL[rec]+brlSub(monthly),
    now:nowLine(cur, " por mês", "transport"),
    btn:'Usar '+fmtEur(monthly)+' em Finanças', disabled:Math.abs(cur-monthly)<0.5 && Math.abs(o.v-monthly)<0.5,
    touch:'Cálculo com as tarifas de 2026 em Dublin (Zona 1): €'+rate.fare.toFixed(2).replace(".",",")+' por viagem e teto de €'+rate.day.toFixed(2).replace(".",",")+' por dia e €'+rate.week.toFixed(2).replace(".",",")+' por semana. Em janeiro de 2027 as tarifas sobem em média 15%. Muda o <b>Transporte</b> do orçamento mensal e do primeiro mês.'
  })+'</div>';
  function save(){
    ls("transportPlan", {days:parseInt(document.getElementById("trDays").value,10), trips:parseInt(document.getElementById("trTrips").value,10)});
    bridgeMsg.transport = ""; renderTransportFin();
  }
  ["trDays","trTrips"].forEach(function(id){ document.getElementById(id).addEventListener("change", save); });
  bindBridge(wrap, "transport", renderTransportFin, function(){ return applyToFinance("transport", [{budget:"transport", value:monthly}, {row:7, value:monthly}]); });
}

BRIDGES.push(renderStayFin, renderTransportFin);
