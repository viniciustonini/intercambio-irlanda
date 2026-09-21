/* Painel da aba Início: hero personalizado, próximo passo, progresso, plano em números,
   jornada, checklist urgente, guias e primeiros 30 dias.
   Carregado antes de app.js. Usa ls(), getProfile(), getCity(), CHECKLIST, CRONOGRAMA,
   DIAS30, CITIES etc. de app.js, sempre em tempo de execução (nunca no carregamento). */

var MONTHS_LONG = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

/* ---------- dados do usuário ---------- */
function tripDaysLeft(){
  var td = ls("tripDate");
  if(!td) return null;
  var d = new Date(td+"T00:00:00");
  if(isNaN(d.getTime())) return null;
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((d - today)/86400000);
}
function tripDateLong(){
  var td = ls("tripDate");
  var d = td ? new Date(td+"T00:00:00") : null;
  if(!d || isNaN(d.getTime())) return "";
  return d.getDate()+" de "+MONTHS_LONG[d.getMonth()]+" de "+d.getFullYear();
}
function goalLabel(v){
  var all = GOALS_EU.concat(GOALS_NON_EU), hit = all.filter(function(g){ return g.v===v; })[0];
  return hit ? hit.l : null;
}
function currentCity(){
  var id = getCity();
  return id ? (CITIES.filter(function(c){ return c.id===id; })[0] || null) : null;
}
function cityPhoto(name){
  var hit = TOURIST_CITIES.filter(function(c){ return c.name===name; })[0];
  return hit && hit.photo ? hit : null;
}
function stayChosenNow(){ return !!ls("stayChosen") && !!ls("selectedStay"); }
function profileLabel(p){ return p==="eu" ? "Cidadão europeu" : p==="non-eu" ? "Não cidadão europeu" : null; }
/* passagem/acomodação valem se marcadas no formulário OU no checklist */
function flagState(){
  var cl = ls("checklist") || {};
  return {
    flight: !!ls("hasFlight") || !!cl.passagens,
    stay: !!ls("hasAccommodation") || !!cl.hospedagem || stayChosenNow(),
    school: !!ls("hasSchool")
  };
}
function schoolRelevant(fl){
  var goal = getGoal();
  return getProfile()==="non-eu" || goal==="ingles" || goal==="ingles-trabalho" || !!fl.school;
}
function progressData(){
  var cl = checklistCounts(), cr = countsFor(CRONOGRAMA,"cronogramaDone"), d3 = countsFor(DIAS30,"dias30Done");
  var total = cl.total+cr.total+d3.total, done = cl.done+cr.done+d3.done;
  return {
    total: total, done: done, pct: total ? Math.round(done/total*100) : 0,
    cats: [
      {label:"Documentos e checklist", done:cl.done, total:cl.total},
      {label:"Cronograma até o embarque", done:cr.done, total:cr.total},
      {label:"Primeiros 30 dias", done:d3.done, total:d3.total}
    ]
  };
}
function dashGo(sec){ location.hash = sec; showSection(sec); }
function dashBar(done, total, label){
  var r = total ? done/total : 0;
  return '<div class="progress-track" role="progressbar" aria-label="'+escapeHtml(label||"Progresso")+'" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+done+'"><div class="progress-fill" style="transform:scaleX('+r+')"></div></div>';
}

/* ---------- sincronização formulário → plano ---------- */
/* Só age quando a resposta muda: marca (ou desmarca) o item equivalente do plano. */
function syncFlagsToPlan(prev, now, city){
  var cl = ls("checklist") || {}, cr = ls("cronogramaDone") || {};
  if(now.flight !== prev.flight) cl.passagens = now.flight;
  if(now.stay !== prev.stay) cl.hospedagem = now.stay;
  if(now.school !== prev.school && (city || !now.school)) cr.c3 = now.school && !!city;
  ls("checklist", cl); ls("cronogramaDone", cr);
}

/* ---------- próximas tarefas (ordem depende do perfil) ---------- */
var PRIORITY_IDS = {
  "eu": ["id-nacional","consular","cartao-saude-eu","ppsn-doc","hospedagem","cv","linkedin"],
  "non-eu": ["loa","pagamento-curso","visto","comprovacao","seguro-privado","fotos-irp","taxa-irp"]
};
var TASK_ICONS = {
  passaporte:"🪪", copias:"🗂️", passagens:"✈️", hospedagem:"🏠", seguro:"🛡️", cartao:"💳", euros:"💶", itamaraty:"🏛️", bancoaviso:"🏦",
  "id-nacional":"🪪", consular:"🏛️", "cartao-saude-eu":"🩺", visto:"🛂", loa:"🏫", "pagamento-curso":"🏫", comprovacao:"💶",
  "seguro-privado":"🛡️", "fotos-irp":"📷", "taxa-irp":"🪪", "ppsn-doc":"🪪", cv:"💼", linkedin:"💼",
  c1:"🪪", c2:"💶", c3:"🏫", c4:"🛂", c5:"💬", c6:"🩺", c7:"💼", c8:"🏠", c9:"✅", c10:"✈️",
  d1:"🛬", d2:"🧭", d3:"🏠", d4:"💼", d5:"💼", d6:"💶", d7:"🚌", d8:"🪪", d9:"🏦"
};
function pendingTasks(){
  var p = getProfile(), cl = ls("checklist") || {}, cr = ls("cronogramaDone") || {}, d3 = ls("dias30Done") || {};
  var fl = flagState(), city = getCity();
  var check = {}, checkOrder = [], crono = [], post = [];
  CHECKLIST.forEach(function(g){
    if(g.scope==="eu" && p==="non-eu") return;
    if(g.scope==="non-eu" && p==="eu") return;
    g.items.forEach(function(it){
      if(cl[it.id]) return;
      if(it.id==="passagens" && fl.flight) return;
      if(it.id==="hospedagem" && fl.stay) return;
      var t = {key:"k:"+it.id, kind:"check", id:it.id, title:it.label, detail:it.note||"", sec:"roteiro"};
      check[it.id] = t; checkOrder.push(t);
    });
  });
  CRONOGRAMA.forEach(function(c){
    if(cr[c.id]) return;
    if(c.id==="c4" && p==="eu") return;
    if(c.id==="c3" && city && fl.school) return;
    crono.push({key:"c:"+c.id, kind:"crono", id:c.id, title:c.title, detail:c.detail, sec:c.link ? c.link.sec : "roteiro"});
  });
  DIAS30.forEach(function(c){
    if(d3[c.id]) return;
    post.push({key:"d:"+c.id, kind:"dias30", id:c.id, title:c.title, detail:c.detail, sec:c.link ? c.link.sec : "roteiro"});
  });
  var out = [], seen = {};
  function add(t){ if(t && !seen[t.key]){ seen[t.key] = 1; out.push(t); } }
  var days = tripDaysLeft();
  if(days!==null && days<0) post.forEach(add);
  (PRIORITY_IDS[p] || []).forEach(function(id){ add(check[id]); });
  crono.forEach(add);
  checkOrder.forEach(add);
  post.forEach(add);
  return out;
}
function taskIcon(t){ return TASK_ICONS[t.id] || "📌"; }
function markTaskDone(t){
  var key = t.kind==="check" ? "checklist" : t.kind==="crono" ? "cronogramaDone" : "dias30Done";
  var st = ls(key) || {};
  st[t.id] = true;
  ls(key, st);
  renderAll();
}

/* ---------- componentes ---------- */
function statusChip(done, doneLabel, todoLabel){
  return '<li class="trip-chip '+(done?'is-done':'is-todo')+'"><span aria-hidden="true">'+(done?'✓':'○')+'</span> '+(done?doneLabel:todoLabel)+'</li>';
}

function renderEmptyProfileCTA(el){
  el.className = "trip-card trip-card-empty";
  el.innerHTML =
    '<div class="trip-body">'+
      '<div class="eyebrow">Personalize seu guia</div>'+
      '<h3 class="trip-city">Monte um painel só seu</h3>'+
      '<p class="trip-lead">Conte seu destino e sua situação para adaptarmos:</p>'+
      '<ul class="trip-adapts"><li>documentos e checklist</li><li>custos e reserva</li><li>imigração e trabalho</li><li>acomodação e orientações</li></ul>'+
      '<div class="trip-actions"><button class="btn btn-accent trip-edit" type="button">Configurar meu perfil →</button></div>'+
    '</div>';
  el.querySelector(".trip-edit").addEventListener("click", function(){ openOnboarding(); });
}

/* "Ainda não sei": a foto de fundo alterna entre Dublin, Cork e Galway (só a 1ª carrega de início) */
var tripSlideTimer = null;
function startPhotoRotation(el, slides){
  if(slides.length<2 || reduceMotion) return;
  var imgs = el.querySelectorAll(".trip-photo-slide"), credit = el.querySelector(".trip-credit"), idx = 0;
  tripSlideTimer = setInterval(function(){
    if(!document.body.contains(el)){ clearInterval(tripSlideTimer); return; }
    if(document.hidden) return;
    var next = (idx+1) % imgs.length, img = imgs[next];
    if(!img.getAttribute("src")) img.src = img.dataset.src;
    imgs[idx].classList.remove("is-active");
    img.classList.add("is-active");
    idx = next;
    var ph = slides[idx];
    if(credit && ph.photoCredit){ credit.href = ph.photoCredit.url; credit.textContent = "Foto: "+ph.photoCredit.name+" · "+ph.photoCredit.license; }
  }, 6000);
}

function renderPersonalizedHero(){
  var el = document.getElementById("profileBanner");
  if(!el) return;
  clearInterval(tripSlideTimer);
  var p = getProfile(), c = currentCity();
  if(!p && !c && !ls("tripDate")){ renderEmptyProfileCTA(el); return; }

  var prog = progressData(), fl = flagState(), days = tripDaysLeft(), tasks = pendingTasks();
  var photo = c ? cityPhoto(c.name) : null;
  var slides = c ? [] : ["Dublin","Cork","Galway"].map(cityPhoto).filter(Boolean);
  var place = c ? c.name : "a Irlanda";
  var past = days!==null && days<0;

  var title, lead;
  if(past){
    title = "Você já está na Irlanda?";
    lead = "A data da viagem já passou. Atualize a data ou siga para os primeiros 30 dias em "+place+".";
  } else {
    var stage = prog.pct===0 ? "está começando" : prog.pct>=100 ? "está completo" : "está em andamento";
    title = "Seu "+(c ? "plano para "+c.name : "planejamento para a Irlanda")+" "+stage;
    lead = c ? c.tag+"." : "Escolha sua cidade de destino para ver custos, pontos fortes e fracos.";
  }

  var facts = [];
  var pl = profileLabel(p);
  facts.push('<li class="trip-chip"><span class="trip-chip-k">Cidadania</span> '+(pl || '<button type="button" class="trip-inline-link" data-act="edit">definir</button>')+'</li>');
  var goal = goalLabel(getGoal());
  facts.push('<li class="trip-chip"><span class="trip-chip-k">Objetivo</span> '+(goal ? escapeHtml(goal) : '<button type="button" class="trip-inline-link" data-act="edit">definir</button>')+'</li>');
  if(days===null || past) facts.push('<li class="trip-chip"><span class="trip-chip-k">Viagem</span> <button type="button" class="trip-inline-link" data-act="date">'+(past ? 'Atualizar data' : 'Definir data da viagem')+'</button></li>');
  if(!c) facts.push('<li class="trip-chip"><span class="trip-chip-k">Destino</span> <button type="button" class="trip-inline-link" data-act="city">Escolher meu destino</button></li>');

  var status = statusChip(fl.flight,"Passagem comprada","Passagem ainda não comprada")+statusChip(fl.stay,"Acomodação definida","Acomodação pendente");
  if(schoolRelevant(fl)) status += statusChip(fl.school,"Escola escolhida","Escola ainda não definida");

  var primary = past
    ? '<button class="btn btn-accent trip-continue" type="button" data-act="30dias">Ver primeiros 30 dias</button>'
    : '<button class="btn btn-accent trip-continue" type="button" data-act="continue">Continuar meu planejamento</button>';

  var hasPhoto = !!photo || slides.length>0;
  el.className = "trip-card"+(hasPhoto ? " has-photo" : "");
  el.innerHTML =
    (photo ? '<img class="trip-photo" src="'+photo.photo+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" width="960" height="540">' : '')+
    slides.map(function(s, i){
      return '<img class="trip-photo trip-photo-slide'+(i===0?' is-active':'')+'" '+(i===0 ? 'src="'+s.photo+'" loading="lazy"' : 'data-src="'+s.photo+'"')+' alt="" decoding="async" referrerpolicy="no-referrer" width="960" height="540">';
    }).join("")+
    '<div class="trip-body">'+
      '<div class="eyebrow">'+(c ? escapeHtml(c.name)+' · Irlanda' : 'Sua viagem')+'</div>'+
      '<h3 class="trip-city">'+title+'</h3>'+
      '<p class="trip-lead">'+lead+'</p>'+
      '<div class="trip-prog"><div class="trip-prog-row"><span>Preparação</span><b class="tabular">'+prog.done+' de '+prog.total+' etapas · '+prog.pct+'%</b></div>'+dashBar(prog.done, prog.total, "Preparação geral")+'</div>'+
      '<ul class="trip-chips">'+facts.join("")+'</ul>'+
      '<ul class="trip-chips trip-chips-status" aria-label="Situação da viagem">'+status+'</ul>'+
      '<div class="trip-actions">'+primary+'<button class="btn btn-ghost trip-edit" type="button">Editar perfil</button></div>'+
    '</div>'+
    (function(){ var ph = photo || slides[0]; return ph && ph.photoCredit ? '<a class="trip-credit" href="'+ph.photoCredit.url+'" target="_blank" rel="noopener">Foto: '+escapeHtml(ph.photoCredit.name)+' · '+ph.photoCredit.license+'</a>' : ''; })();
  startPhotoRotation(el, slides);

  el.querySelector(".trip-edit").addEventListener("click", function(){ openOnboarding(); });
  el.querySelectorAll('[data-act="date"]').forEach(function(b){ b.addEventListener("click", function(){ openOnboarding("date"); }); });
  el.querySelectorAll('[data-act="edit"]').forEach(function(b){ b.addEventListener("click", function(){ openOnboarding(); }); });
  el.querySelectorAll('[data-act="city"]').forEach(function(b){ b.addEventListener("click", function(){
    var t = document.getElementById("citySeg"); if(t) t.scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"center"});
  }); });
  var go = el.querySelector(".trip-continue");
  go.addEventListener("click", function(){
    if(go.dataset.act==="30dias") return dashGo("roteiro");
    dashGo(tasks.length ? tasks[0].sec : "roteiro");
  });
}

function renderNextStepCard(){
  var el = document.getElementById("nextStepWrap");
  if(!el) return;
  el.className = "card next-card";
  /* Texto à esquerda e botões numa coluna própria à direita: os botões ficam sempre no mesmo lugar,
     não importa o tamanho do título ou da descrição da tarefa. */
  function shell(icon, title, detail, actions, after){
    return '<div class="next-step"><div class="next-icon" aria-hidden="true">'+icon+'</div><div class="next-main">'+
      '<div class="eyebrow">Seu próximo passo</div><h3 class="next-title">'+title+'</h3>'+
      (detail ? '<p class="next-detail">'+detail+'</p>' : '')+
      (after ? '<p class="next-after">Depois: <b>'+after+'</b></p>' : '')+
      '</div>'+(actions ? '<div class="next-actions">'+actions+'</div>' : '')+'</div>';
  }
  if(!getProfile()){
    el.innerHTML = shell("🧭","Configure sua viagem","Com seu perfil definido, calculamos o próximo passo e reordenamos o checklist.",
      '<button class="btn btn-accent" type="button" data-act="setup">Responder agora →</button>', "");
    el.querySelector('[data-act="setup"]').addEventListener("click", function(){ openOnboarding(); });
    return;
  }
  var tasks = pendingTasks();
  if(!tasks.length){
    el.innerHTML = shell("🎉","Tudo em dia","Nenhuma tarefa pendente no momento.","", "");
    return;
  }
  var t = tasks[0], after = tasks[1];
  el.innerHTML = shell(taskIcon(t), t.title, t.detail,
    '<button class="btn btn-accent" type="button" data-act="go">Começar agora →</button>'+
    '<button class="btn btn-ghost" type="button" data-act="done">Marcar como feito</button>', after ? after.title : "");
  el.querySelector('[data-act="go"]').addEventListener("click", function(){ dashGo(t.sec); });
  el.querySelector('[data-act="done"]').addEventListener("click", function(){ markTaskDone(t); });
}

function renderProgressOverview(){
  var el = document.getElementById("progressWrap");
  if(!el) return;
  var d = progressData();
  el.innerHTML =
    '<div class="prep-head"><div><div class="eyebrow">Sua preparação</div>'+
      '<div class="prep-frac tabular">'+d.done+' de '+d.total+' etapas concluídas</div></div>'+
      '<div class="prep-pct tabular">'+d.pct+'%</div></div>'+
    dashBar(d.done, d.total, "Preparação geral")+
    '<div class="prep-cats">'+d.cats.map(function(c){
      return '<div class="prep-cat"><div class="prep-cat-row"><span>'+c.label+'</span><b class="tabular">'+c.done+' / '+c.total+'</b></div>'+dashBar(c.done, c.total, c.label)+'</div>';
    }).join("")+'</div>';
}

function tileHtml(icon, label, value, sub, link){
  return '<div class="tile"><div class="tile-k"><span aria-hidden="true">'+icon+'</span> '+label+'</div>'+
    '<div class="tile-v'+(value.length>10?' is-text':'')+'">'+value+'</div>'+
    (sub ? '<div class="tile-sub">'+sub+'</div>' : '')+
    (link ? '<button type="button" class="tile-link" data-go="'+link.sec+'"'+(link.date?' data-date="1"':'')+'>'+link.label+'</button>' : '')+'</div>';
}
function renderTripStats(){
  var el = document.getElementById("tripStatsWrap");
  if(!el) return;
  var days = tripDaysLeft(), td = ls("tripDate"), tiles = [];
  if(td && days!==null){
    var sub = days>0 ? days+(days===1?" dia":" dias") : days===0 ? "É hoje" : "Data já passou";
    tiles.push(tileHtml("✈️","Viagem", formatDateBR(td), sub, days<0 ? {sec:"inicio", date:true, label:"Atualizar data"} : null));
  } else {
    tiles.push(tileHtml("✈️","Viagem","Ainda não definido","", {sec:"inicio", date:true, label:"Definir data da viagem"}));
  }
  var edited = !!ls("budget");
  tiles.push(tileHtml("💶","Custo mensal",fmtEur(sumExpenses(getBudget())), '<span class="brl-i">'+fmtBrlApprox(sumExpenses(getBudget()))+' · </span>'+(edited ? "seu orçamento" : "estimativa padrão"), {sec:"financas", label:"Ajustar em Finanças"}));
  var stay = getStayOptions().filter(function(s){ return s.id===ls("selectedStay"); })[0] || null;
  if(stay){
    var eur = stay.noites*stay.preco/getCotacao();
    tiles.push(tileHtml("🏠","Hospedagem",fmtEur(eur), '<span class="brl-i">'+fmtBrlApprox(eur)+' · </span>'+stay.noites+" noites · "+escapeHtml(stay.nome), {sec:"acomodacao", label:"Trocar em Acomodação"}));
  } else {
    tiles.push(tileHtml("🏠","Hospedagem","Ainda não definido","",{sec:"acomodacao",label:"Escolher em Acomodação"}));
  }
  var d = progressData();
  tiles.push(tileHtml("✅","Preparação", d.done+" / "+d.total, d.pct+"% concluído", null));
  el.innerHTML = '<h3 class="dash-h">Seu plano em números</h3><div class="tiles">'+tiles.join("")+'</div>';
  el.querySelectorAll(".tile-link").forEach(function(b){
    b.addEventListener("click", function(){ if(b.dataset.date) openOnboarding("date"); else dashGo(b.dataset.go); });
  });
}

function renderJourneyTimeline(){
  var el = document.getElementById("journeyWrap");
  if(!el) return;
  var fl = flagState(), cr = ls("cronogramaDone") || {}, d3 = ls("dias30Done") || {}, days = tripDaysLeft();
  var c = currentCity(), steps = [];
  steps.push({done:!!c, label: c ? "Cidade escolhida" : "Cidade"});
  steps.push({done:fl.flight, label: fl.flight ? "Passagem comprada" : "Passagem"});
  if(schoolRelevant(fl)) steps.push({done:fl.school, label: fl.school ? "Escola escolhida" : "Escola"});
  steps.push({done:fl.stay, label: fl.stay ? "Acomodação definida" : "Acomodação"});
  steps.push({done:!!cr.c1, label: cr.c1 ? "Documentos em ordem" : "Documentação"});
  steps.push({done:!!cr.c10 || (days!==null && days<0), label: (cr.c10 || (days!==null && days<0)) ? "Embarque feito" : "Embarque"});
  steps.push({done:!!d3.d1, label: d3.d1 ? "Chegada concluída" : "Chegada à Irlanda"});
  var doneCount = steps.filter(function(s){ return s.done; }).length;
  el.innerHTML = '<h3 class="dash-h">Sua jornada</h3><p class="source-note" style="margin:-6px 0 14px;">'+doneCount+' de '+steps.length+' marcos concluídos</p>'+
    '<ol class="journey">'+steps.map(function(s){
      return '<li class="journey-step '+(s.done?'is-done':'is-todo')+'"><span class="journey-dot" aria-hidden="true">'+(s.done?'✓':'')+'</span>'+
        '<span class="journey-label">'+s.label+'<span class="sr-only">'+(s.done?' (concluído)':' (pendente)')+'</span></span></li>';
    }).join("")+'</ol>';
}

function renderUrgentChecklist(){
  var el = document.getElementById("urgentWrap");
  if(!el) return;
  var tasks = pendingTasks(), shown = tasks.slice(0,2).map(function(t){ return t.key; });
  var list = tasks.filter(function(t){ return t.kind==="check" && shown.indexOf(t.key)<0; }).slice(0,4);
  if(!getProfile() || !list.length){ el.hidden = true; el.innerHTML = ""; return; }
  el.hidden = false;
  el.innerHTML = '<h3 class="dash-h">Checklist urgente</h3><p class="source-note" style="margin:-6px 0 14px;">Os próximos itens do seu checklist. Marque aqui ou em Meu Plano.</p>'+
    list.map(function(t){ return checkItemHtml(t.id, t.title, t.detail, false); }).join("")+
    '<a href="#roteiro" class="ci-link" data-go="roteiro">Ver checklist completo →</a>';
  el.querySelectorAll(".checkitem").forEach(function(row){
    row.querySelector(".checkitem-input").addEventListener("change", function(){
      var st = ls("checklist") || {};
      st[row.dataset.id] = true;
      ls("checklist", st);
      renderAll();
    });
  });
  el.querySelector("[data-go]").addEventListener("click", function(e){ e.preventDefault(); dashGo("roteiro"); });
}

var GUIDES = {
  "documentos": {t:"Documentos", d:"PPS Number, IRP, MyGovID e registro consular."},
  "cidadania-europeia": {t:"Cidadania europeia", d:"O que muda pra quem tem cidadania europeia e o que continua obrigatório."},
  "bancos": {t:"Conta bancária", d:"IBAN, conta digital x banco tradicional e como avisar seu banco brasileiro."},
  "trabalho": {t:"Salário e impostos", d:"Salário mínimo, PAYE, USC, PRSI e Emergency Tax."},
  "saude": {t:"Saúde", d:"GP, seguro médico para não-europeus e emergências."},
  "moradia": {t:"Moradia", d:"Tipos de quarto, golpes comuns, tenancy x licence e bairros de Dublin."},
  "custo-de-vida": {t:"Custo de vida", d:"Quanto sobra do salário mínimo depois de aluguel, contas e impostos."},
  "ingles": {t:"Curso de inglês", d:"Credenciamento (ILEP e TrustEd Ireland), curso intensivo x noturno e erros comuns."},
  "transporte": {t:"Transporte", d:"Leap Card, apps essenciais e trens entre as cidades."},
  "turismo": {t:"Turismo", d:"Quando ir, o que ver e o que saber sobre a Irlanda do Norte."},
  "primeiros-dias-na-irlanda": {t:"Primeiros dias", d:"Do embarque ao primeiro mês: o que resolver e em que ordem."},
  "vida-na-irlanda": {t:"Vida na Irlanda", d:"Mitos e verdades sobre trabalho, moradia e transporte."}
};
function recommendedGuides(){
  var p = getProfile(), goal = getGoal(), ids = [];
  function add(a){ a.forEach(function(x){ if(ids.indexOf(x)<0) ids.push(x); }); }
  var base = p==="eu" ? ["cidadania-europeia","documentos","bancos","trabalho"] : p==="non-eu" ? ["documentos","saude","moradia","custo-de-vida"] : [];
  var byGoal = goal==="turismo" ? ["turismo","transporte"] : goal==="morar" ? ["moradia","custo-de-vida"] : (goal==="ingles" || goal==="ingles-trabalho") ? ["ingles"] : [];
  add(base.slice(0,2)); add(byGoal); add(base.slice(2));
  add(["documentos","custo-de-vida","moradia","primeiros-dias-na-irlanda"]);
  return ids.slice(0,4);
}
function renderRecommendedGuides(){
  var el = document.getElementById("guidesWrap");
  if(!el) return;
  el.innerHTML = '<h3 class="dash-h">Guias recomendados</h3><div class="guides">'+
    recommendedGuides().map(function(id){
      var g = GUIDES[id];
      return '<a class="linkcard" href="/'+id+'"><span class="linkcard-arrow" aria-hidden="true">→</span><h4>'+g.t+'</h4><p>'+g.d+'</p></a>';
    }).join("")+'</div>';
}

function renderFirst30(){
  var el = document.getElementById("first30Wrap");
  if(!el) return;
  var done = ls("dias30Done") || {};
  var d = countsFor(DIAS30, "dias30Done");
  el.innerHTML = '<h3>Primeiros 30 dias na Irlanda</h3>'+
    '<p class="source-note" style="margin-bottom:12px;">'+d.done+' de '+d.total+' etapas concluídas.</p>'+
    DIAS30.slice(0,5).map(function(t){
      var ok = !!done[t.id];
      return '<div class="first30-row'+(ok?' is-done':'')+'"><span class="tabular first30-when">'+t.when+'</span><span class="first30-title">'+(ok?'✓ ':'')+t.title+(ok?'<span class="sr-only"> (concluído)</span>':'')+'</span></div>';
    }).join("")+
    '<p style="margin:12px 0 0;font-size:13px;"><a href="#roteiro" data-go="roteiro" class="ci-link">Ver os 30 dias completos →</a> · <a href="/primeiros-dias-na-irlanda" class="ci-link">Guia: primeiros dias →</a></p>';
  el.querySelector("[data-go]").addEventListener("click", function(e){ e.preventDefault(); dashGo("roteiro"); });
}

function renderDashboard(){
  renderPersonalizedHero();
  renderNextStepCard();
  renderProgressOverview();
  renderTripStats();
  if(typeof renderFinancas==="function") renderFinancas();
  renderJourneyTimeline();
  renderUrgentChecklist();
  renderRecommendedGuides();
  renderFirst30();
}

/* ---------- retorno visual ao salvar o perfil ---------- */
function celebrateProfileSaved(){
  var el = document.getElementById("profileBanner"), sec = document.getElementById("sec-inicio");
  if(!el || !sec || !sec.classList.contains("active")) return;
  sec.classList.add("dash-animate");
  var msg = document.createElement("div");
  msg.className = "trip-saved";
  msg.setAttribute("role", "status");
  msg.textContent = "✓ Seu guia foi personalizado.";
  el.appendChild(msg);
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  setTimeout(function(){ el.scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block:"start"}); }, 60);
  setTimeout(function(){
    if(msg.parentNode) msg.parentNode.removeChild(msg);
    el.classList.remove("flash");
    sec.classList.remove("dash-animate");
  }, 4500);
}
