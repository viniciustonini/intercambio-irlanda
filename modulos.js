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
