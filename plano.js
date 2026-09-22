/* Meu Plano como roteiro: Hoje, Antes de embarcar, Viagem e o primeiro mês na Irlanda.
   Usa as mesmas listas e os mesmos dados salvos de antes (CRONOGRAMA, DIAS30, cronogramaDone,
   dias30Done, planNotes), só reorganiza e calcula prazos a partir da data da viagem.
   Carregado depois de integracao.js e antes de app.js; usa funções de app.js só em tempo de execução. */

var PLAN_PRE_MONTHS = 8;
var PLAN_DUE_M = {c1:2, c2:2, c3:3, c4:4, c5:5, c6:6, c7:7, c8:7};
var PLAN_DUE_D = {c9:-15, c10:0};
var PLAN_POST_DAYS = {d1:3, d2:3, d3:7, d4:7, d5:14, d6:14, d7:28, d8:28, d9:28};
var PLAN_POST_NAMES = {"Dias 1–3":"Chegada", "Dias 4–7":"Primeira semana", "Semana 2":"Segunda semana", "Semanas 3–4":"Fechando o mês"};
var rmOpen = {};

function planTrip(){
  var td = ls("tripDate");
  if(!td) return null;
  var d = new Date(td+"T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
function planToday(){ var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
function planAddDays(d, n){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()+n); }
/* Os 8 meses do plano se comprimem no tempo que falta: quem viaja em 3 meses ainda vê prazos possíveis. */
function planDue(id){
  var trip = planTrip();
  if(!trip) return null;
  var today = planToday();
  if(PLAN_DUE_D[id]!==undefined) return planAddDays(trip, PLAN_DUE_D[id]);
  if(PLAN_POST_DAYS[id]!==undefined) return planAddDays(trip, PLAN_POST_DAYS[id]);
  if(PLAN_DUE_M[id]!==undefined){
    var full = addMonthsClamped(trip, -PLAN_PRE_MONTHS);
    var start = full > today ? full : today;
    var span = trip - start;
    if(span <= 0) return today;
    var d = new Date(start.getTime() + span*(PLAN_DUE_M[id]/PLAN_PRE_MONTHS));
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var cap = planAddDays(trip, -15); if(cap < today) cap = today;
    if(d < today) d = today;
    return d > cap ? cap : d;
  }
  return null;
}
function planDueText(id){
  var d = planDue(id);
  return d ? "até "+fmtDay(d) : null;
}

function planModel(){
  var p = getProfile(), days = tripDaysLeft();
  var pre = CRONOGRAMA.filter(function(c){ return c.id!=="c10" && !(c.id==="c4" && p==="eu"); });
  var trip = CRONOGRAMA.filter(function(c){ return c.id==="c10"; });
  var order = [], seen = {};
  DIAS30.forEach(function(t){ if(!seen[t.when]){ seen[t.when] = 1; order.push(t.when); } });
  var stages = [
    {key:"pre", title:"Antes de embarcar", store:"cronogramaDone", items:pre, kind:"pre"},
    {key:"trip", title:"Viagem", store:"cronogramaDone", items:trip, kind:"trip"}
  ];
  order.forEach(function(w, i){
    stages.push({key:"post"+i, title:PLAN_POST_NAMES[w]||w, sub:w, store:"dias30Done", items:DIAS30.filter(function(t){ return t.when===w; }), kind:"post"});
  });
  var cr = ls("cronogramaDone") || {}, d3 = ls("dias30Done") || {}, total = 0, done = 0;
  stages.forEach(function(s){
    var map = s.store==="cronogramaDone" ? cr : d3;
    s.done = s.items.filter(function(t){ return !!map[t.id]; }).length;
    s.total = s.items.length;
    s.complete = s.total>0 && s.done===s.total;
    s.first = s.items.filter(function(t){ return !map[t.id]; })[0] || null;
    total += s.total; done += s.done;
  });
  var startAt = (days!==null && days<0) ? 2 : 0;
  var cur = null;
  for(var i=startAt; i<stages.length; i++){ if(!stages[i].complete){ cur = stages[i]; break; } }
  if(!cur && startAt>0){ for(var j=0; j<startAt; j++){ if(!stages[j].complete){ cur = stages[j]; break; } } }
  return {stages:stages, total:total, done:done, cur:cur, next:cur ? cur.first : null, days:days, euSkipped:p==="eu", store:{cronogramaDone:cr, dias30Done:d3}};
}

function planTodayNode(){
  var p = getProfile(), city = currentCity(), td = tripDateLong(), fl = flagState();
  function row(ok, label, value, todo, act){
    return '<li class="rm-row '+(ok?'is-done':'is-todo')+'"><span class="rm-mark" aria-hidden="true">'+(ok?'✓':'○')+'</span><span class="rm-row-l">'+label+'</span>'+
      (ok ? '<b>'+value+'</b>' : '<button type="button" class="fin-link" data-rm-act="'+act+'">'+todo+'</button>')+'</li>';
  }
  var goal = getGoal() ? goalLabel(getGoal()) : null;
  var done = !!p && !!city && !!td;
  return {done:done, html:
    '<div class="rm-hd"><h3>Hoje</h3><p class="rm-sub">'+(done ? 'Sua base está definida.' : 'Três respostas deixam o roteiro sob medida.')+'</p></div>'+
    '<ul class="rm-rows">'+
      row(!!p, 'Perfil', escapeHtml((profileLabel(p)||"")+(goal?" · "+goal:"")), 'Definir meu perfil', 'profile')+
      row(!!city, 'Cidade', city ? escapeHtml(city.name) : "", 'Escolher a cidade', 'city')+
      row(!!td, 'Viagem', td, 'Definir a data da viagem', 'date')+
      '<li class="rm-row '+(fl.flight?'is-done':'is-todo')+'"><span class="rm-mark" aria-hidden="true">'+(fl.flight?'✓':'○')+'</span><span class="rm-row-l">Passagem</span><b>'+(fl.flight?'comprada':'pendente')+'</b></li>'+
      '<li class="rm-row '+(fl.stay?'is-done':'is-todo')+'"><span class="rm-mark" aria-hidden="true">'+(fl.stay?'✓':'○')+'</span><span class="rm-row-l">Hospedagem inicial</span><b>'+(fl.stay?'definida':'pendente')+'</b></li>'+
    '</ul>'};
}

function planSummaryHtml(m){
  var days = m.days, trip = tripDateLong();
  var head, sub;
  if(!m.cur){
    head = 'Plano concluído';
    sub = 'Você marcou todas as etapas, até o fim do primeiro mês.';
  } else {
    head = m.cur.title;
    sub = m.done+' de '+m.total+' etapas concluídas';
  }
  var count;
  if(days===null) count = '<div class="rm-when"><span class="rm-when-q">Quando você pretende viajar?</span><button type="button" class="btn btn-accent" data-rm-act="date">Definir minha data</button></div>';
  else if(days>0) count = '<div class="rm-when"><b class="rm-when-n">'+days+'</b><span>'+(days===1?'dia':'dias')+' para a viagem</span><small>'+trip+'</small></div>';
  else if(days===0) count = '<div class="rm-when"><b class="rm-when-n">Hoje</b><span>é o dia da viagem</span><small>'+trip+'</small></div>';
  else count = '<div class="rm-when"><b class="rm-when-n">'+(-days)+'</b><span>'+(days===-1?'dia':'dias')+' na Irlanda</span><small>desde '+trip+'</small></div>';
  var next = "";
  if(m.next){
    var due = planDueText(m.next.id), t = m.next;
    next = '<div class="rm-next"><span class="eyebrow">Próxima etapa</span><div class="rm-next-t"><b>'+t.title+'</b>'+(due?'<span class="rm-due">'+due+'</span>':'')+'</div><p>'+t.detail+'</p>'+
      '<div class="rm-next-act">'+
        (t.link && t.link.sec!=="inicio" ? '<button type="button" class="btn btn-accent" data-rm-open="'+t.link.sec+'">'+t.link.label+'</button>' : '')+
        '<button type="button" class="btn btn-ghost" data-rm-done="'+t.id+'" data-rm-store="'+m.cur.store+'">Marcar como feita</button>'+
      '</div></div>';
  }
  return '<div class="rm-sum"><div class="rm-sum-main"><span class="eyebrow">Você está em</span><h3 class="rm-cur">'+head+'</h3><p class="rm-cur-sub">'+sub+'</p>'+
    dashBar(m.done, m.total, "Progresso do plano")+'</div>'+count+'</div>'+next;
}

function planStageHtml(m, s){
  var map = m.store[s.store];
  var isCur = m.cur===s;
  var open = rmOpen[s.key]!==undefined ? rmOpen[s.key] : isCur;
  var items = s.items.map(function(t){
    var due = planDueText(t.id), copy = Object.assign({}, t);
    if(due) copy.when = due;
    if(t.id==="c10" && planTrip()) copy.when = fmtDay(planTrip());
    if(!map[t.id] && planDue(t.id) && planDue(t.id) <= planAddDays(planToday(), 7) && s.kind==="pre") copy.title = t.title+' <span class="pill now">Para agora</span>';
    return copy;
  });
  var state = s.complete ? "is-done" : (isCur ? "is-current" : "is-todo");
  var range = "";
  if(s.kind==="pre" && planTrip()) range = ' · até '+fmtDay(planDue("c9"));
  if(s.kind==="post" && planTrip()){ var last = s.items[s.items.length-1]; range = ' · '+s.sub.toLowerCase()+' · até '+fmtDay(planDue(last.id)); }
  else if(s.kind==="post") range = ' · '+s.sub.toLowerCase();
  var note = (s.kind==="pre" && m.euSkipped) ? '<p class="rm-skip">Etapa de visto omitida: cidadãos da UE/EEE/Suíça não precisam de visto nem de IRP.</p>' : '';
  return '<details class="rm-stage '+state+(s.kind==="trip"?' rm-trip':'')+'" data-stage="'+s.key+'"'+(open?' open':'')+'>'+
    '<summary><span class="rm-dot" aria-hidden="true">'+(s.complete?'✓':'')+'</span><span class="rm-sum-t"><b>'+s.title+'</b><small>'+s.done+' de '+s.total+' etapas'+range+'</small></span>'+
    (isCur ? '<span class="pill step rm-here">Etapa atual</span>' : '')+'</summary>'+
    '<div class="rm-items" id="rm-items-'+s.key+'" data-store="'+s.store+'">'+note+timelineHtml(items, map)+'</div></details>';
}

function renderPlanRoadmap(){
  var root = document.getElementById("planRoadmap");
  if(!root) return;
  var m = planModel(), today = planTodayNode();
  var focusId = document.activeElement && document.activeElement.closest && document.activeElement.closest(".checkitem") ? document.activeElement.closest(".checkitem").dataset.id : null;
  var last = m.stages[m.stages.length-1];
  var endDate = planTrip() ? ' · '+fmtDay(planAddDays(planTrip(), 30)) : '';
  var preTravel = m.days===null || m.days>=0;
  var pct = m.total ? Math.max(0, Math.min(100, Math.round(m.done/m.total*100))) : 0;
  root.innerHTML = planSummaryHtml(m)+
    '<div class="rm-line"><div class="rm-road"><div class="rm-road-base"></div><div class="rm-road-fill" style="height:'+pct+'%"></div></div>'+
      '<section class="rm-node '+(today.done?'is-done':'is-current')+'"><span class="rm-dot" aria-hidden="true">'+(today.done?'✓':'')+'</span>'+today.html+'</section>'+
      m.stages.map(function(s, i){ return (i===2 ? '<div class="rm-divider"><span>Na Irlanda'+(preTravel?' <span class="rm-divider-note">· para quando você chegar</span>':'')+'</span></div>' : '')+planStageHtml(m, s); }).join("")+
      '<div class="rm-node rm-end'+(m.cur?'':' is-done')+'"><span class="rm-dot" aria-hidden="true">'+(m.cur?'':'✓')+'</span><div class="rm-hd"><h3>Fim do primeiro mês'+endDate+'</h3><p class="rm-sub">Depois disso você entra na rotina: acompanhe seu orçamento e atualize seu plano.</p></div></div>'+
    '</div>';
  m.stages.forEach(function(s){ wirePlanNotes("rm-items-"+s.key); });
  if(m.next){
    var lab = root.querySelector('.checkitem[data-id="'+m.next.id+'"]');
    if(lab && lab.closest(".checkitem-wrap")) lab.closest(".checkitem-wrap").classList.add("is-next");
  }
  if(focusId){ var again = root.querySelector('.checkitem[data-id="'+focusId+'"] input'); if(again) again.focus({preventScroll:true}); }
  if(!root.dataset.bound){
    root.dataset.bound = "1";
    root.addEventListener("change", function(e){
      var inp = e.target.closest(".checkitem-input");
      if(!inp) return;
      var lab = inp.closest(".checkitem"), box = inp.closest("[data-store]");
      if(!lab || !box) return;
      planToggle(lab.dataset.id, box.dataset.store);
    });
    root.addEventListener("click", function(e){
      var b;
      if((b = e.target.closest("[data-rm-done]"))){ planToggle(b.dataset.rmDone, b.dataset.rmStore, true); return; }
      if((b = e.target.closest("[data-rm-open]"))){ goToSection(b.dataset.rmOpen); return; }
      if((b = e.target.closest("[data-rm-act]"))){ openOnboarding(b.dataset.rmAct==="date" ? "date" : undefined); return; }
    });
    root.addEventListener("toggle", function(e){
      var d = e.target;
      if(d && d.classList && d.classList.contains("rm-stage")) rmOpen[d.dataset.stage] = d.open;
    }, true);
  }
}
function planToggle(id, store, forceDone){
  var st = ls(store) || {};
  st[id] = forceDone ? true : !st[id];
  ls(store, st);
  rmOpen = {};
  renderPlanRoadmap();
  renderOverview();
}
window.addEventListener("beforeprint", function(){
  document.querySelectorAll("#planRoadmap details").forEach(function(d){ d.open = true; });
});
