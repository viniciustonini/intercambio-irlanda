/* Melhorias de UX por módulo (Fase 5): Inglês, Acomodação, Transporte, Trabalho e Vida prática.
   Carregado depois de plano.js e antes de app.js; usa funções de app.js só em tempo de execução. */

function localISO(d){
  d = d || new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

/* ---------- Inglês: caminho recomendado (sem trava) e "Continuar estudando" ---------- */
function englishRecommendedLevel(){
  for(var i=0; i<ENGLISH_LEVEL_ORDER.length; i++){ if(!englishLevelCompleted(ENGLISH_LEVEL_ORDER[i])) return ENGLISH_LEVEL_ORDER[i]; }
  return null;
}
function englishTouch(){
  var log = ls("englishActivity") || [], today = localISO();
  if(log[log.length-1]===today) return;
  log.push(today);
  ls("englishActivity", log.slice(-90));
}
function englishStreak(){
  var log = ls("englishActivity") || [];
  if(!log.length) return 0;
  var set = {}; log.forEach(function(d){ set[d] = 1; });
  var d = new Date(); d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if(!set[localISO(d)]) d.setDate(d.getDate()-1);
  var n = 0;
  while(set[localISO(d)]){ n++; d.setDate(d.getDate()-1); }
  return n;
}
function englishLastActivityText(){
  var log = ls("englishActivity") || [];
  if(!log.length) return "";
  var last = log[log.length-1], today = localISO(), y = new Date(); y.setDate(y.getDate()-1);
  if(last===today) return "hoje";
  if(last===localISO(y)) return "ontem";
  return formatDateBR(last);
}
function renderEnglishContinue(){
  var wrap = document.getElementById("englishContinueWrap");
  if(!wrap) return;
  var lvl = englishRecommendedLevel(), state = englishProgressState();
  if(!lvl){
    wrap.innerHTML = '<div class="card en-cont"><span class="eyebrow">Continuar estudando</span><p class="en-cont-t">Você concluiu a gramática dos quatro níveis.</p><p class="en-cont-meta">Continue treinando com reading, listening e writing mais abaixo.</p></div>';
    return;
  }
  var topics = ENGLISH_TOPICS[lvl] || [], done = topics.filter(function(t){ return state[t.id]; }).length;
  var next = topics.filter(function(t){ return !state[t.id]; })[0];
  var started = ENGLISH_LEVEL_ORDER.some(function(l){ return (ENGLISH_TOPICS[l]||[]).some(function(t){ return state[t.id]; }); });
  var meta = [];
  var last = englishLastActivityText(), streak = englishStreak();
  if(last) meta.push("Última atividade: "+last);
  if(streak>=2) meta.push("Sequência: "+streak+" dias seguidos");
  wrap.innerHTML = '<div class="card en-cont"><span class="eyebrow">'+(started ? "Continuar estudando" : "Comece por aqui")+'</span>'+
    '<div class="en-cont-row"><div><p class="en-cont-t">'+next.title+'</p><p class="en-cont-s">Nível '+lvl.toUpperCase()+' · '+done+' de '+topics.length+' tópicos concluídos</p></div>'+
    '<button type="button" class="btn btn-accent" id="englishContinueBtn">'+(started ? "Continuar" : "Começar")+'</button></div>'+
    (meta.length ? '<p class="en-cont-meta">'+meta.join(" · ")+'</p>' : '')+'</div>';
  document.getElementById("englishContinueBtn").addEventListener("click", function(){
    englishLevelView = lvl; ls("englishLevelView", lvl);
    renderEnglishLevelTabs(); renderEnglishTopics();
    var el = document.querySelector('#englishTopicsWrap .checkitem[data-id="'+next.id+'"]');
    if(el){
      var top = el.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--tabbar-h"),10)||64) - 80;
      window.scrollTo({top:top, behavior:reduceMotion ? "auto" : "smooth"});
      el.classList.add("is-flash");
      setTimeout(function(){ el.classList.remove("is-flash"); }, 1600);
    }
  });
}

/* ---------- Acomodação: comparar quartos pelo custo efetivo ---------- */
var ROOM_MAX = 4;
function getRooms(){ return ls("stayRooms") || []; }
function saveRooms(r){ ls("stayRooms", r); }
function roomNum(v){ var n = parseFloat(v); return isNaN(n) || n<0 ? 0 : n; }
function roomCalc(r){
  var rent = roomNum(r.rent), bills = r.billsIncluded ? 0 : roomNum(r.bills), eff = rent+bills;
  var dep = (r.deposit===""||r.deposit==null) ? rent : roomNum(r.deposit);
  var min = roomNum(r.minutes);
  return {rent:rent, bills:bills, eff:eff, dep:dep, first:eff+dep, min:min, commuteH:min*2*22/60};
}
function roomHoursText(h){ return (Math.round(h*10)/10).toString().replace(".",",")+" h"; }
function roomCardHtml(r){
  var c = roomCalc(r);
  function seg(field, opts){ return '<div class="rc-seg" role="radiogroup">'+opts.map(function(o){ var on = String(r[field])===String(o.v); return '<button type="button" role="radio" aria-checked="'+on+'" class="subtab'+(on?' active':'')+'" data-rc-seg="'+field+'" data-v="'+o.v+'">'+o.l+'</button>'; }).join("")+'</div>'; }
  function money(f, ph){ return '<span class="fin-money-in"><span aria-hidden="true">€</span><input type="number" min="0" step="10" data-rc="'+f+'" value="'+(r[f]===""||r[f]==null?"":r[f])+'" placeholder="'+(ph||"")+'"></span>'; }
  return '<div class="rc-card" data-room="'+r.id+'">'+
    '<div class="rc-top"><input type="text" class="rc-name" maxlength="30" data-rc="name" value="'+escapeHtml(r.name)+'" aria-label="Nome do quarto"><button type="button" class="fin-x" data-rc-del="'+r.id+'" aria-label="Remover '+escapeHtml(r.name)+'" title="Remover">'+phi("x")+'</button></div>'+
    '<div class="rc-badge" hidden>Menor custo efetivo</div>'+
    '<div class="rc-field"><label>Aluguel por mês</label>'+money("rent","0")+'</div>'+
    '<div class="rc-field"><label>Contas (luz, gás, internet)</label>'+seg("billsIncluded", [{v:true,l:"Inclusas"},{v:false,l:"Não inclusas"}])+
      '<span class="rc-bills"'+(r.billsIncluded?' hidden':'')+'>'+money("bills","0")+'<span class="rc-unit">por mês</span></span></div>'+
    '<div class="rc-field"><label>Depósito</label>'+money("deposit", c.rent||"1 mês")+'<span class="rc-unit">vazio = 1 mês de aluguel</span></div>'+
    '<div class="rc-field"><label>Tempo até o trabalho ou a escola</label><span class="fin-money-in"><input type="number" min="0" step="5" data-rc="minutes" value="'+(r.minutes===""||r.minutes==null?"":r.minutes)+'" placeholder="0"><span aria-hidden="true">min</span></span><span class="rc-unit">só a ida</span></div>'+
    '<div class="rc-field"><label>Tipo</label>'+seg("kind", [{v:"privado",l:"Privado"},{v:"compartilhado",l:"Compartilhado"}])+
      '<label class="rc-check"><input type="checkbox" data-rc="ensuite"'+(r.ensuite?' checked':'')+'> Ensuite</label></div>'+
    '<div class="rc-out"><span class="fin-lbl">Custo efetivo por mês</span><b class="rc-eff fin-big"></b><span class="rc-sub"></span>'+
      '<ul class="rc-facts"><li class="rc-first"></li><li class="rc-commute"></li></ul></div>'+
    '<button type="button" class="btn btn-ghost rc-use" data-rc-use="'+r.id+'">Levar para Finanças</button></div>';
}
function updateRoomCalc(){
  var wrap = document.getElementById("stayRoomsWrap");
  if(!wrap) return;
  var rooms = getRooms(), calcs = {};
  rooms.forEach(function(r){ calcs[r.id] = roomCalc(r); });
  var priced = rooms.filter(function(r){ return calcs[r.id].rent>0; });
  var best = null;
  if(priced.length>=2){ best = priced.slice().sort(function(a,b){ return calcs[a.id].eff-calcs[b.id].eff; })[0]; }
  rooms.forEach(function(r){
    var el = wrap.querySelector('[data-room="'+r.id+'"]'), c = calcs[r.id];
    if(!el) return;
    el.querySelector(".rc-eff").textContent = c.rent>0 ? fmtEur(c.eff) : "";
    el.querySelector(".rc-sub").innerHTML = c.rent>0 ? (c.bills>0 ? fmtEur(c.rent)+' de aluguel + '+fmtEur(c.bills)+' de contas' : (r.billsIncluded ? 'aluguel, com contas inclusas' : 'só o aluguel (sem contas informadas)'))+brlSub(c.eff) : 'Informe o aluguel para ver o custo efetivo.';
    el.querySelector(".rc-first").innerHTML = c.rent>0 ? 'Para entrar: <b>'+fmtEur(c.first)+'</b> (1º mês + depósito de '+fmtEur(c.dep)+')' : '';
    el.querySelector(".rc-commute").innerHTML = c.min>0 ? 'Trajeto: <b>≈ '+roomHoursText(c.commuteH)+' por mês</b> (ida e volta, 22 dias)' : '';
    el.querySelector(".rc-badge").hidden = !(best && best.id===r.id);
    el.querySelector(".rc-use").disabled = !(c.rent>0);
  });
  var sum = "";
  if(best){
    var cb = calcs[best.id];
    sum = priced.filter(function(r){ return r.id!==best.id; }).map(function(r){
      var c = calcs[r.id], d = c.eff-cb.eff, line = '<b>'+escapeHtml(best.name)+'</b> sai '+(d>0.5 ? fmtEur(d)+' mais barato por mês' : 'igual')+' que <b>'+escapeHtml(r.name)+'</b>';
      if(cb.min>0 && c.min>0 && cb.min!==c.min){
        var dh = Math.abs(c.commuteH-cb.commuteH);
        line += cb.min<c.min ? ' e fica mais perto (≈ '+roomHoursText(dh)+' a menos de trajeto por mês).' : ', mas fica mais longe (≈ '+roomHoursText(dh)+' a mais de trajeto por mês).';
      } else line += '.';
      return '<p>'+line+'</p>';
    }).join("");
  }
  var box = wrap.querySelector(".rc-summary");
  if(box) box.innerHTML = sum;
}
function renderStayRooms(){
  var wrap = document.getElementById("stayRoomsWrap");
  if(!wrap) return;
  var rooms = getRooms(), msg = bridgeMsg.room;
  wrap.innerHTML = '<div class="rc-head"><h3>Comparar quartos para alugar</h3><p class="source-note">Aluguel barato nem sempre é o mais barato: some as contas e veja o tempo de trajeto. Os dados ficam só neste navegador.</p></div>'+
    (rooms.length ? '<div class="rc-grid">'+rooms.map(roomCardHtml).join("")+'</div>' :
      '<div class="empty rc-empty">Achou dois ou três quartos? Coloque aluguel, contas e distância lado a lado para ver qual sai mais barato de verdade.</div>')+
    '<div class="rc-summary" aria-live="polite"></div>'+
    '<div class="rc-actions">'+(rooms.length<ROOM_MAX ? '<button type="button" class="btn btn-ghost" id="roomAddBtn">'+phi("plus")+(rooms.length ? "Adicionar outro quarto" : "Adicionar um quarto")+'</button>' : '<span class="source-note">Máximo de '+ROOM_MAX+' quartos por vez.</span>')+'</div>'+
    '<p class="fin-bridge-msg" role="status">'+(msg||"")+'</p>';
  updateRoomCalc();
  var add = document.getElementById("roomAddBtn");
  if(add) add.addEventListener("click", function(){
    var rs = getRooms(), letters = "ABCD";
    var used = rs.map(function(r){ return r.name; });
    var name = ""; for(var i=0;i<letters.length;i++){ if(used.indexOf("Quarto "+letters[i])<0){ name = "Quarto "+letters[i]; break; } }
    rs.push({id:"r"+Date.now(), name:name||"Quarto", rent:"", billsIncluded:true, bills:"", deposit:"", minutes:"", kind:"privado", ensuite:false});
    saveRooms(rs); bridgeMsg.room = ""; renderStayRooms();
    var last = document.querySelector("#stayRoomsWrap .rc-card:last-child [data-rc=rent]"); if(last) last.focus();
  });
  if(!wrap.dataset.bound){
    wrap.dataset.bound = "1";
    wrap.addEventListener("input", function(e){
      var f = e.target.dataset.rc, card = e.target.closest("[data-room]");
      if(!f || !card) return;
      var rs = getRooms(), r = rs.filter(function(x){ return x.id===card.dataset.room; })[0];
      if(!r) return;
      r[f] = e.target.type==="checkbox" ? e.target.checked : e.target.value;
      saveRooms(rs); updateRoomCalc();
    });
    wrap.addEventListener("click", function(e){
      var b, card = e.target.closest("[data-room]");
      if((b = e.target.closest("[data-rc-seg]")) && card){
        var rs = getRooms(), r = rs.filter(function(x){ return x.id===card.dataset.room; })[0];
        if(!r) return;
        var v = b.dataset.v; if(b.dataset.rcSeg==="billsIncluded") v = (v==="true");
        r[b.dataset.rcSeg] = v; saveRooms(rs);
        card.querySelectorAll('[data-rc-seg="'+b.dataset.rcSeg+'"]').forEach(function(x){ var on = x===b; x.classList.toggle("active", on); x.setAttribute("aria-checked", on); });
        if(b.dataset.rcSeg==="billsIncluded") card.querySelector(".rc-bills").hidden = r.billsIncluded;
        updateRoomCalc(); return;
      }
      if((b = e.target.closest("[data-rc-del]"))){
        saveRooms(getRooms().filter(function(x){ return x.id!==b.dataset.rcDel; })); bridgeMsg.room = ""; renderStayRooms(); return;
      }
      if((b = e.target.closest("[data-rc-use]"))){
        var r2 = getRooms().filter(function(x){ return x.id===b.dataset.rcUse; })[0];
        if(!r2) return;
        var c = roomCalc(r2);
        var said = applyToFinance("stay", [{budget:"rent", value:c.eff}, {row:4, value:c.dep}, {row:5, value:c.eff}]);
        bridgeMsg.room = '<b>Feito.</b> Em Finanças, com os dados de '+escapeHtml(r2.name)+': '+said.map(escapeHtml).join("; ")+'. <button type="button" class="fin-link" data-bridge-undo="room">Desfazer</button>';
        refreshBridges(true); return;
      }
      if((b = e.target.closest("[data-bridge-undo]"))){
        undoFinanceChange(); bridgeMsg.room = "Desfeito. Finanças voltou ao que era antes."; refreshBridges(true);
      }
    });
  }
}
BRIDGES.push(renderStayRooms);

/* ---------- Transporte: qual Leap Card comprar (um fluxo só) ---------- */
var LEAP_RATES = {adult:{fare:2.00, day:6.00, week:24.00}, young:{fare:1.00, day:3.00, week:12.00}, student:{fare:1.00, day:3.00, week:12.00}};
var LEAP_2027_NOTE = 'Em janeiro de 2027 as tarifas sobem em média 15%: o 90 minutos de adulto vai de €2,00 para €2,30, e o desconto de 50% do Young Adult e do Student continua. <a href="https://www.rte.ie/news/ireland/2026/0903/1590193-transport-fares/" target="_blank" rel="noopener">Fonte: RTÉ, 03/09/2026 ↗</a>';
function leapAnswers(){ return Object.assign({age:"", enrolled:"", stay:""}, ls("leapAdvisor")||{}); }
function leapRecommend(a){
  if(!a.age || !a.stay) return null;
  if(a.stay==="short") return "visitor";
  if(a.age==="u18") return "child";
  if(a.age==="ya") return "young";
  if(!a.enrolled) return null;
  return a.enrolled==="yes" ? "student" : "adult";
}
function leapCardById(id){ return LEAP_CARDS.filter(function(c){ return c.id===id; })[0] || null; }
function leapResultHtml(id, a){
  var youngRows = leapCardById("young").rows;
  var cards = {
    visitor:{label:"Leap Visitor Card", why:"Você fica poucos dias. É um cartão de viagens ilimitadas por período fixo, sem recarga, ideal para turismo ou os primeiros dias. Não vale nos ônibus expressos do aeroporto.", rows:leapCardById("visitor").rows},
    child:{label:"Leap Card de criança (5 a 18 anos)", why:"Até os 18 anos existe tarifa reduzida, a mais barata de todas.", rows:[{l:"TFI 90 Minute",v:"€0,65"}]},
    young:{label:"Young Adult Leap Card", why:leapCardById("young").who, rows:youngRows},
    student:{label:"Student Leap Card", why:"Você tem 26 anos ou mais e está matriculado em curso de pelo menos 25 semanas, então pode pedir o Student, com 50% de desconto. Precisa da carta da escola.", rows:youngRows},
    adult:{label:"Adult Leap Card", why:leapCardById("adult").who+" Se você tiver carta de matrícula em curso de pelo menos 25 semanas, o Student sai pela metade do preço: confira a resposta acima.", rows:leapCardById("adult").rows}
  };
  var c = cards[id];
  return '<div class="la-result"><span class="eyebrow">Recomendação informativa</span><h4>'+c.label+'</h4><p>'+c.why+'</p>'+
    '<div class="tablewrap tablewrap-narrow"><table><tbody>'+c.rows.map(function(r){ return '<tr><td>'+r.l+'</td><td class="num tabular">'+r.v+'</td></tr>'; }).join("")+'</tbody></table></div>'+
    '<p class="la-note">Valores de 2026 para Dublin (Zona 1). '+LEAP_2027_NOTE+'</p>'+
    '<p class="la-note">Antes de comprar, confirme as regras e o valor vigente no aplicativo Leap Card. Young Adult e Student exigem cadastro e comprovação.</p></div>';
}
function renderLeapAdvisor(){
  var wrap = document.getElementById("leapAdvisorWrap");
  if(!wrap) return;
  var a = leapAnswers(), rec = leapRecommend(a);
  function q(key, title, opts){
    return '<fieldset class="la-q"><legend>'+title+'</legend><div class="la-opts" role="radiogroup">'+opts.map(function(o){
      var on = a[key]===o.v;
      return '<button type="button" role="radio" aria-checked="'+on+'" class="subtab'+(on?' active':'')+'" data-la="'+key+'" data-v="'+o.v+'">'+o.l+'</button>';
    }).join("")+'</div></fieldset>';
  }
  wrap.innerHTML = '<div class="card la">'+
    q("age", "Qual é a sua idade?", [{v:"u18",l:"Até 18 anos"},{v:"ya",l:"19 a 25 anos"},{v:"adult",l:"26 anos ou mais"}])+
    (a.age==="adult" ? q("enrolled", "Você está matriculado em curso de pelo menos 25 semanas?", [{v:"yes",l:"Sim, tenho carta da escola"},{v:"no",l:"Não"}]) : "")+
    q("stay", "Quanto tempo você vai ficar?", [{v:"short",l:"Até 1 semana"},{v:"long",l:"Mais que isso (moro ou estudo lá)"}])+
    (rec ? leapResultHtml(rec, a) : '<p class="la-empty">Responda às perguntas para ver qual cartão vale para o seu caso.</p>')+
  '</div>';
  wrap.querySelectorAll("[data-la]").forEach(function(b){
    b.addEventListener("click", function(){
      var s = leapAnswers(); s[b.dataset.la] = b.dataset.v;
      if(b.dataset.la==="age" && s.age!=="adult") s.enrolled = "";
      ls("leapAdvisor", s);
      renderLeapAdvisor();
      if(typeof renderTransportFin==="function") renderTransportFin();
    });
  });
}

/* ---------- Trabalho: sugestões com palavras para buscar ---------- */
function jobTerms(list){
  var out = [];
  list.forEach(function(j){
    j.title.split("/").forEach(function(t){ t = t.trim().toLowerCase(); if(t && out.indexOf(t)<0) out.push(t); });
  });
  return out;
}
function copyText(text, done){
  function fallback(){
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); }catch(e){}
    ta.remove(); if(done) done();
  }
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function(){ if(done) done(); }, fallback);
  else fallback();
}
function renderJobResult(el, shown, ingles, expLabel, dispo){
  if(!shown.length){ el.innerHTML = '<div class="empty">Nenhuma sugestão para essa combinação. Tente outro nível de inglês ou outra experiência.</div>'; return; }
  var terms = jobTerms(shown);
  var dispoText = dispo.length ? ' Você marcou disponibilidade ('+dispo.join(", ")+'): confirme os turnos de cada vaga antes de se candidatar.' : '';
  el.innerHTML = '<div class="jf-res">'+
    '<p class="jf-lead">Com inglês '+ingles.toLowerCase()+' e experiência em "'+escapeHtml(expLabel)+'", estes são bons tipos de vaga para pesquisar.'+dispoText+'</p>'+
    '<ul class="jf-list">'+shown.map(function(j){
      return '<li><b>'+j.title+'</b><span>'+j.desc+'</span><small>'+j.turno+' · Inglês '+j.ingles.toLowerCase()+'</small></li>';
    }).join("")+'</ul>'+
    '<div class="jf-terms"><span class="eyebrow">Palavras para buscar</span>'+
      '<div class="jf-chips">'+terms.map(function(t){ return '<button type="button" class="jf-chip" data-copy="'+escapeHtml(t)+'" title="Copiar">'+escapeHtml(t)+'</button>'; }).join("")+'</div>'+
      '<button type="button" class="btn btn-ghost jf-copy" id="jfCopyAll">Copiar todas</button><span class="jf-copied" role="status"></span></div>'+
    '<p class="la-note">Cole essas palavras no LinkedIn, no Indeed.ie ou no site das agências abaixo. Isso não é garantia de contratação, e os requisitos variam por empresa.</p></div>';
  var flag = el.querySelector(".jf-copied");
  function say(t){ flag.textContent = t; clearTimeout(say.t); say.t = setTimeout(function(){ flag.textContent = ""; }, 1800); }
  el.querySelectorAll("[data-copy]").forEach(function(b){ b.addEventListener("click", function(){ copyText(b.dataset.copy, function(){ say('Copiado: '+b.dataset.copy); }); }); });
  document.getElementById("jfCopyAll").addEventListener("click", function(){ copyText(terms.join("\n"), function(){ say('Copiadas '+terms.length+' palavras, uma por linha.'); }); });
}
