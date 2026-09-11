var LAST_UPDATED = "03/09/2026";
var LS = "ie_guide_";
function ls(key, val){
  if(val===undefined){ try{ var v = localStorage.getItem(LS+key); return v===null?null:JSON.parse(v); }catch(e){ return null; } }
  try{ localStorage.setItem(LS+key, JSON.stringify(val)); }catch(e){}
}
/* Escapa texto vindo do usuario antes de inserir em HTML/atributos — evita XSS
   armazenado quando esse texto (item de mercado, escola, acomodacao etc.) e
   depois re-renderizado via innerHTML. */
/* ---------- fontes/regras com data de verificacao (base pra "OfficialSource") ---------- */
var STALE_DAYS = 180; /* depois disso, sugerimos revisar a informacao */
function daysSince(dateStr){
  var d = new Date(dateStr+"T00:00:00");
  if(isNaN(d.getTime())) return null;
  return Math.floor((Date.now()-d.getTime())/86400000);
}
function oldestVerifiedAt(rules){
  return rules.map(function(r){ return r.verifiedAt; }).sort()[0];
}
function formatDateBR(dateStr){
  var p = dateStr.split("-");
  return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : dateStr;
}
function sourceVerifiedNote(verifiedAt){
  if(!verifiedAt) return "";
  var days = daysSince(verifiedAt);
  var stale = days!=null && days > STALE_DAYS;
  return '<p class="source-note" style="margin-top:4px;'+(stale?"color:var(--warn-strong);":"")+'">'+
    (stale?"⚠ Pode estar desatualizado — ":"")+"Verificado em "+formatDateBR(verifiedAt)+(stale?". Confira a fonte oficial antes de decidir.":".")+
    "</p>";
}
function escapeHtml(str){
  return String(str==null?"":str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

/* ---------- nav ---------- */
var SCROLL_MODE_MQ = window.matchMedia("(max-width:900px)");
function isScrollMode(){ return SCROLL_MODE_MQ.matches; }

function highlightTab(id){
  var activeBtn = null;
  document.querySelectorAll(".tab-btn[data-sec]").forEach(function(b){
    var on = b.dataset.sec===id;
    b.classList.toggle("active", on);
    if(b.getAttribute("role")==="tab") b.setAttribute("aria-selected", on ? "true" : "false");
    if(on) activeBtn = b;
  });
  if(activeBtn) activeBtn.scrollIntoView({behavior:"smooth", inline:"center", block:"nearest"});
  setTimeout(updateTabbarScrollUI, 300);
  return activeBtn;
}

function showSection(id){
  if(id && id!=="inicio") ls("lastSection", id);
  else if(id==="inicio") renderContinueCard();
  if(isScrollMode()){
    highlightTab(id);
    var target = document.querySelector('.section[data-sec="'+id+'"]');
    if(target) target.scrollIntoView({behavior:"smooth", block:"start"});
    return;
  }
  document.querySelectorAll(".section").forEach(function(s){ s.classList.toggle("active", s.dataset.sec===id); });
  highlightTab(id);
  window.scrollTo({top:0, behavior:"instant" in window ? "instant" : "auto"});
  animateSectionEntrance(id);
}

/* ---------- animações (GSAP, somente versão web) ---------- */
var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var animEnabled = (typeof gsap !== "undefined") && !reduceMotion;
if(animEnabled) document.documentElement.classList.add("js-anim");
var hasScrollTrigger = typeof ScrollTrigger !== "undefined";
if(hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);
function animateSectionEntrance(id){
  if(!animEnabled || isScrollMode()) return;
  var section = document.querySelector('.section[data-sec="'+id+'"]');
  if(!section) return;
  var items = section.querySelectorAll(".card, .tablewrap, .rules-card, .tourism-banner, .grid > *, .proscons, .seg, .subtabs, .timeline > .checkitem");
  if(!items.length) return;
  if(hasScrollTrigger) ScrollTrigger.getAll().forEach(function(st){ st.kill(); });
  var above = Array.prototype.slice.call(items, 0, 4);
  var below = Array.prototype.slice.call(items, 4);
  gsap.fromTo(above, {opacity:0, y:16}, {opacity:1, y:0, duration:.5, ease:"power2.out", stagger:0.05, overwrite:true});
  if(hasScrollTrigger && below.length){
    below.forEach(function(item){
      gsap.fromTo(item, {opacity:0, y:26}, {
        opacity:1, y:0, duration:.6, ease:"power2.out",
        scrollTrigger:{trigger:item, start:"top 90%", toggleActions:"play none none none"}
      });
    });
    requestAnimationFrame(function(){ ScrollTrigger.refresh(); });
  } else {
    gsap.set(below, {opacity:1, y:0});
  }
}
function animateHeroEntrance(){
  if(!animEnabled) return;
  var els = [".hero-topbar", ".hero-text h1", ".hero-text p", ".hero-card"];
  gsap.set(els, {opacity:0, y:18});
  var tl = gsap.timeline({defaults:{duration:.7, ease:"power2.out"}});
  tl.to(".hero-topbar", {opacity:1, y:0})
    .to(".hero-text h1", {opacity:1, y:0}, "-=0.45")
    .to(".hero-text p", {opacity:1, y:0}, "-=0.5")
    .to(".hero-card", {opacity:1, y:0, duration:.8}, "-=0.45");
  var daysEl = document.getElementById("heroDays");
  var target = parseInt(daysEl.textContent, 10);
  if(!isNaN(target)){
    var counter = {v:0};
    gsap.to(counter, {v:target, duration:1.1, ease:"power1.out", delay:.35, onUpdate:function(){ daysEl.textContent = Math.round(counter.v); }});
  }
}
document.querySelectorAll(".tab-btn[data-sec]").forEach(function(b){
  b.addEventListener("click", function(){ location.hash = b.dataset.sec; showSection(b.dataset.sec); });
});
window.addEventListener("hashchange", function(){ showSection(location.hash.replace("#","") || "inicio"); });

/* ---------- rolagem contínua (somente mobile) ---------- */
var scrollSpyObserver = null;
function enableScrollSpy(){
  if(scrollSpyObserver) return;
  scrollSpyObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var id = entry.target.dataset.sec;
        document.querySelectorAll(".tab-btn").forEach(function(b){ b.classList.toggle("active", b.dataset.sec===id); });
        history.replaceState(null, "", "#"+id);
        updateTabbarScrollUI();
        var activeBtn = document.querySelector(".tab-btn.active");
        if(activeBtn) activeBtn.scrollIntoView({behavior:"smooth", inline:"center", block:"nearest"});
      }
    });
  }, {rootMargin:"-45% 0px -45% 0px", threshold:0});
  document.querySelectorAll(".section").forEach(function(s){ scrollSpyObserver.observe(s); });
}
function disableScrollSpy(){
  if(scrollSpyObserver){ scrollSpyObserver.disconnect(); scrollSpyObserver = null; }
}
function applyScrollMode(){
  var on = isScrollMode();
  document.body.classList.toggle("scroll-mode", on);
  if(on){
    document.querySelectorAll(".section").forEach(function(s){ s.classList.add("active"); });
    enableScrollSpy();
    var id = location.hash.replace("#","") || "inicio";
    highlightTab(id);
    if(id !== "inicio"){
      var target = document.querySelector('.section[data-sec="'+id+'"]');
      if(target) target.scrollIntoView({block:"start"});
    }
  } else {
    disableScrollSpy();
    showSection(location.hash.replace("#","") || "inicio");
  }
}
if(SCROLL_MODE_MQ.addEventListener) SCROLL_MODE_MQ.addEventListener("change", applyScrollMode);
else SCROLL_MODE_MQ.addListener(applyScrollMode);

/* ---------- tab bar scroll affordance ---------- */
function updateTabbarScrollUI(){
  var tb = document.getElementById("tabbar");
  if(!tb) return;
  var maxScroll = tb.scrollWidth - tb.clientWidth;
  var atStart = tb.scrollLeft <= 2;
  var atEnd = tb.scrollLeft >= maxScroll - 2;
  var hasOverflow = maxScroll > 4;
  ["tabFadeLeft","tabArrowLeft"].forEach(function(id){ document.getElementById(id).classList.toggle("show", hasOverflow && !atStart); });
  ["tabFadeRight","tabArrowRight"].forEach(function(id){ document.getElementById(id).classList.toggle("show", hasOverflow && !atEnd); });
}
(function(){
  var tb = document.getElementById("tabbar");
  tb.addEventListener("scroll", updateTabbarScrollUI);
  window.addEventListener("resize", updateTabbarScrollUI);
  document.getElementById("tabArrowLeft").addEventListener("click", function(){ tb.scrollBy({left:-220, behavior:"smooth"}); });
  document.getElementById("tabArrowRight").addEventListener("click", function(){ tb.scrollBy({left:220, behavior:"smooth"}); });
})();

/* ---------- menu "Mais" ---------- */
function openMoreMenu(){
  var menu = document.getElementById("moreMenu");
  var btn = document.getElementById("tabMoreBtn");
  menu.hidden = false;
  document.getElementById("moreMenuBackdrop").hidden = false;
  btn.setAttribute("aria-expanded", "true");
  if(window.matchMedia("(min-width:641px)").matches){
    var r = btn.getBoundingClientRect();
    var menuWidth = menu.offsetWidth || 220;
    var left = Math.min(r.right - menuWidth, window.innerWidth - menuWidth - 12);
    left = Math.max(left, 12);
    menu.style.top = (r.bottom + 8) + "px";
    menu.style.left = left + "px";
    menu.style.right = "auto";
  } else {
    menu.style.top = ""; menu.style.left = ""; menu.style.right = "";
  }
}
function closeMoreMenu(){
  document.getElementById("moreMenu").hidden = true;
  document.getElementById("moreMenuBackdrop").hidden = true;
  document.getElementById("tabMoreBtn").setAttribute("aria-expanded", "false");
}
document.getElementById("tabMoreBtn").addEventListener("click", function(){
  var isOpen = document.getElementById("tabMoreBtn").getAttribute("aria-expanded") === "true";
  if(isOpen) closeMoreMenu(); else openMoreMenu();
});
document.getElementById("moreMenuBackdrop").addEventListener("click", closeMoreMenu);
document.querySelectorAll("#moreMenu .tab-btn").forEach(function(btn){
  btn.addEventListener("click", closeMoreMenu);
});
document.addEventListener("keydown", function(e){
  if(e.key==="Escape" && !document.getElementById("moreMenu").hidden) closeMoreMenu();
});
window.addEventListener("scroll", function(){
  if(!document.getElementById("moreMenu").hidden) closeMoreMenu();
}, {passive:true});
window.addEventListener("resize", function(){
  if(!document.getElementById("moreMenu").hidden) closeMoreMenu();
});
document.getElementById("heroEditDate").addEventListener("click", function(){
  var editor = document.getElementById("heroDateEditor");
  editor.hidden = !editor.hidden;
  if(!editor.hidden) document.getElementById("heroDateInput").focus();
});

/* ---------- trip date & countdown ---------- */
function todayISO(){ return new Date().toISOString().slice(0,10); }
var MONTHS = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
function getTripDate(){ return ls("tripDate") || "2027-03-11"; }
function setTripDate(v){ ls("tripDate", v); renderHero(); }
function renderHero(){
  var dstr = getTripDate();
  var d = new Date(dstr+"T00:00:00");
  var now = new Date();
  var diffDays = Math.ceil((d - now)/86400000);
  document.getElementById("heroDays").textContent = diffDays > 0 ? diffDays : (diffDays===0 ? "0" : "—");
  document.getElementById("heroDate").textContent = d.getDate()+" "+MONTHS[d.getMonth()]+" "+d.getFullYear();
  var city = getCity();
  var cityObj = city ? CITIES.find(function(c){return c.id===city;}) : null;
  document.getElementById("heroRoute").textContent = "Brasil → " + (cityObj ? cityObj.name : "Irlanda");
  document.getElementById("heroHeadline").textContent = cityObj ? ("Seu caminho até "+cityObj.name+", sem perder o próximo passo.") : "Seu caminho até a Irlanda, sem perder o próximo passo.";
  document.getElementById("heroAvatar").textContent = cityObj ? cityObj.name.charAt(0) : "I";
  document.getElementById("heroTopTitle").textContent = (cityObj ? cityObj.name+" · " : "") + "IRLANDA";
  document.getElementById("heroTopSub").textContent = "Planejamento revisado em " + LAST_UPDATED;
  document.getElementById("heroCotacaoVal").textContent = "R$ " + getCotacao().toFixed(2).replace(".", ",");
  var input = document.getElementById("heroDateInput");
  if(input){ input.min = todayISO(); input.value = dstr; }
}
document.getElementById("heroCotacao").addEventListener("click", function(){ location.hash = "acomodacao"; showSection("acomodacao"); });
document.getElementById("heroDateInput").addEventListener("change", function(e){ setTripDate(e.target.value); });
document.getElementById("heroResetBtn").addEventListener("click", function(){
  document.getElementById("resetModal").hidden = false;
});
document.getElementById("resetModalCancel").addEventListener("click", function(){
  document.getElementById("resetModal").hidden = true;
});
document.getElementById("resetModal").addEventListener("click", function(e){
  if(e.target.id==="resetModal") document.getElementById("resetModal").hidden = true;
});
document.getElementById("resetModalConfirm").addEventListener("click", function(){
  Object.keys(localStorage).filter(function(k){return k.indexOf(LS)===0 && k!==LS+"unlocked" && k!==LS+"name";}).forEach(function(k){ localStorage.removeItem(k); });
  location.reload();
});

/* ---------- backup: exportar / importar / versionamento de schema ---------- */
var STORAGE_VERSION = 1;
/* Migracoes futuras: MIGRATIONS[2] = function(data){ ...ajusta 'data' de v1 para v2...; return data; } */
var MIGRATIONS = {};
function runMigrations(data, fromVersion){
  var v = fromVersion || 1;
  while(v < STORAGE_VERSION){
    v++;
    if(typeof MIGRATIONS[v] === "function") data = MIGRATIONS[v](data);
  }
  return data;
}
function ensureSchemaVersion(){
  if(ls("schemaVersion") == null) ls("schemaVersion", STORAGE_VERSION);
}
function exportBackupData(){
  var data = {};
  Object.keys(localStorage).filter(function(k){ return k.indexOf(LS)===0; }).forEach(function(k){
    try{ data[k.slice(LS.length)] = JSON.parse(localStorage.getItem(k)); }catch(e){}
  });
  return {app:"intercambio-irlanda", schemaVersion: ls("schemaVersion") || STORAGE_VERSION, exportedAt: new Date().toISOString(), data: data};
}
function downloadBackup(){
  var payload = JSON.stringify(exportBackupData(), null, 2);
  var blob = new Blob([payload], {type:"application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  var stamp = new Date().toISOString().slice(0,10);
  a.href = url; a.download = "intercambio-irlanda-backup-"+stamp+".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
}
function restoreBackup(file, statusEl){
  var reader = new FileReader();
  reader.onload = function(){
    var parsed;
    try{ parsed = JSON.parse(reader.result); }catch(e){
      statusEl.textContent = "Arquivo inválido — não parece um backup deste site.";
      statusEl.style.color = "var(--warn-strong)";
      return;
    }
    if(!parsed || parsed.app !== "intercambio-irlanda" || typeof parsed.data !== "object"){
      statusEl.textContent = "Arquivo inválido — não parece um backup deste site.";
      statusEl.style.color = "var(--warn-strong)";
      return;
    }
    var data = runMigrations(parsed.data, parsed.schemaVersion);
    Object.keys(localStorage).filter(function(k){ return k.indexOf(LS)===0; }).forEach(function(k){ localStorage.removeItem(k); });
    Object.keys(data).forEach(function(key){ ls(key, data[key]); });
    ls("schemaVersion", STORAGE_VERSION);
    statusEl.textContent = "Backup restaurado! Recarregando...";
    statusEl.style.color = "var(--accent-strong)";
    setTimeout(function(){ location.reload(); }, 900);
  };
  reader.onerror = function(){
    statusEl.textContent = "Não consegui ler o arquivo. Tente novamente.";
    statusEl.style.color = "var(--warn-strong)";
  };
  reader.readAsText(file);
}
document.getElementById("heroBackupBtn").addEventListener("click", function(){
  document.getElementById("backupStatus").textContent = "";
  document.getElementById("backupModal").hidden = false;
});
document.getElementById("backupModalClose").addEventListener("click", function(){
  document.getElementById("backupModal").hidden = true;
});
document.getElementById("backupModal").addEventListener("click", function(e){
  if(e.target.id==="backupModal") document.getElementById("backupModal").hidden = true;
});
document.getElementById("backupExportBtn").addEventListener("click", downloadBackup);
document.getElementById("backupImportBtn").addEventListener("click", function(){
  document.getElementById("backupImportInput").click();
});
document.getElementById("backupImportInput").addEventListener("change", function(e){
  var file = e.target.files && e.target.files[0];
  if(!file) return;
  var statusEl = document.getElementById("backupStatus");
  statusEl.style.color = "var(--muted)";
  statusEl.textContent = "Lendo arquivo...";
  restoreBackup(file, statusEl);
  e.target.value = "";
});

/* ---------- lightbox de fotos ---------- */
document.getElementById("photoLightbox").addEventListener("click", function(e){
  if(e.target.id==="photoLightbox") closeLightbox();
});
document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
document.addEventListener("keydown", function(e){
  if(e.key==="Escape" && !document.getElementById("photoLightbox").hidden) closeLightbox();
});

/* ---------- privacidade & cookies ---------- */
function openPrivacyModal(){ document.getElementById("privacyModal").hidden = false; }
function closePrivacyModal(){ document.getElementById("privacyModal").hidden = true; }
document.getElementById("privacyLink").addEventListener("click", function(e){ e.preventDefault(); openPrivacyModal(); });
document.getElementById("privacyModalClose").addEventListener("click", closePrivacyModal);
document.getElementById("privacyModal").addEventListener("click", function(e){ if(e.target.id==="privacyModal") closePrivacyModal(); });
document.getElementById("cookieBarLink").addEventListener("click", function(e){ e.preventDefault(); openPrivacyModal(); });
document.getElementById("cookieBarAccept").addEventListener("click", function(){
  ls("cookieConsent", true);
  document.getElementById("cookieBar").hidden = true;
});
if(!ls("cookieConsent")) document.getElementById("cookieBar").hidden = false;

/* ---------- profile & city ---------- */
function getProfile(){ return ls("profile"); }
function setProfile(p){ ls("profile", p); renderAll(); }
function getCity(){ return ls("city"); }
function setCity(id){ ls("city", id); renderAll(); }

var CITIES = [
  {id:"dublin", name:"Dublin", tag:"A capital, o maior mercado", rent:"€800–1.100/mês", jobs:"Maior mercado do país", schools:"Maior oferta de cursos", transit:"Ônibus, Luas e DART",
    pros:["Maior oferta de empregos do país","Forte presença de empresas de tecnologia, finanças, serviços, saúde e multinacionais","Maior quantidade de escolas e cursos de inglês","Cidade mais internacional e multicultural","Melhor variedade de serviços, eventos e lazer","Transporte público mais completo","Grande comunidade brasileira"],
    cons:["Cidade mais cara da Irlanda, principalmente o aluguel","Maior concorrência por empregos e moradia","Dificuldade para encontrar quartos e apartamentos","Deslocamentos podem ser mais longos","Ritmo de vida mais acelerado","Em algumas áreas há relatos de grupos jogando ovos em pedestres à noite (mais comum perto do Halloween) — evite se afastar sozinho em zonas pouco movimentadas à noite"],
    bestFor:"Melhor para quem prioriza emprego, networking e variedade de cursos."},
  {id:"cork", name:"Cork", tag:"A segunda cidade, mais tranquila", rent:"€600–850/mês", jobs:"Farmacêutica/tech + hospitalidade", schools:"Menos opções, mas de qualidade", transit:"Rede de ônibus local",
    pros:["Boa oferta de empregos, especialmente em farmacêutica, biotecnologia, tecnologia, cybersecurity e indústria","Presença de grandes empresas multinacionais","Custo de vida mais equilibrado que Dublin","Cidade grande o suficiente para oportunidades, mas menos intensa","Forte ambiente universitário"],
    cons:["Mercado de trabalho menor que Dublin","Menos opções de cursos e escolas de inglês","Mercado de aluguel ainda competitivo","Transporte público menos abrangente","Para áreas específicas, pode haver menos vagas disponíveis"],
    bestFor:"Provavelmente o melhor equilíbrio entre trabalho, custo e qualidade de vida — especialmente interessante para quem é da área de biomedicina, laboratório ou farmacêutica."},
  {id:"galway", name:"Galway", tag:"Costa oeste, cidade universitária", rent:"€650–900/mês", jobs:"Turismo e hospitalidade (sazonal)", schools:"Boas escolas, cidade estudantil", transit:"Cidade compacta, tudo a pé",
    pros:["Ambiente universitário forte","Estilo de vida mais tranquilo","Fácil deslocamento dentro da cidade","Forte contato com a cultura irlandesa","Boa qualidade de vida","Proximidade com natureza, praias e paisagens","Ambiente acolhedor para estudantes internacionais"],
    cons:["Menor mercado de trabalho entre as três cidades","Menos vagas e grandes empresas","Transporte público mais limitado","Moradia ainda pode ser difícil de encontrar","Para certas áreas profissionais, pode ser necessário buscar emprego fora da cidade"],
    bestFor:"Melhor para quem prioriza tranquilidade e experiência universitária, sem depender de um mercado de trabalho grande."}
];
var NATIONAL_RULES = [
  "Estudante com Stamp 2 pode trabalhar até 20 horas por semana durante o período letivo.",
  "Em períodos oficiais de férias escolares, pode trabalhar até 40 horas semanais.",
  "O objetivo principal do visto de estudante deve ser o estudo, não o trabalho.",
  "Salário mínimo nacional para 20 anos ou mais: €14,15/hora em 2026 (previsão de €14,94 a partir de jan/2027).",
  "Estudantes não-UE precisam comprovar recursos financeiros — €6.665 para cursos de inglês de até 8 meses.",
  "Cursos de inglês têm limite de permanência no percurso de estudante — confirme sempre o prazo vigente no site oficial.",
  "Ao alugar, verifique se o contrato é uma tenancy ou licence — os direitos e proteções mudam.",
  "Nunca envie dinheiro de aluguel antes de visitar o imóvel e confirmar a legitimidade do proprietário ou agência."
];
function renderNationalRules(){
  document.getElementById("nationalRulesList").innerHTML = NATIONAL_RULES.map(function(r){ return "<li>"+r+"</li>"; }).join("");
}

function renderCitySeg(){
  var city = getCity();
  document.getElementById("citySeg").innerHTML = CITIES.map(function(c){
    return '<button class="seg-btn'+(city===c.id?' selected':'')+'" data-city="'+c.id+'"><h4>'+c.name+'</h4><p>'+c.tag+'</p></button>';
  }).join("");
  document.querySelectorAll("#citySeg .seg-btn").forEach(function(b){ b.addEventListener("click", function(){ setCity(b.dataset.city); }); });
  var c = CITIES.find(function(x){ return x.id===city; });
  if(!c){
    document.getElementById("cityFacts").innerHTML = "";
    document.getElementById("cityProsCons").innerHTML = '<div class="empty" style="grid-column:1/-1;">Escolha uma cidade acima para ver os pontos fortes e fracos.</div>';
    document.getElementById("cityBestFor").innerHTML = "";
    return;
  }
  document.getElementById("cityFacts").innerHTML =
    '<div class="fact-chip"><b>'+c.rent+'</b>Aluguel (quarto)</div>'+
    '<div class="fact-chip"><b>'+c.jobs+'</b>Trabalho</div>'+
    '<div class="fact-chip"><b>'+c.schools+'</b>Cursos de inglês</div>'+
    '<div class="fact-chip"><b>'+c.transit+'</b>Transporte</div>';
  document.getElementById("cityProsCons").innerHTML =
    '<div class="box pros"><h4>Pontos fortes</h4><ul>'+c.pros.map(function(p){return '<li>'+p+'</li>';}).join("")+'</ul></div>'+
    '<div class="box cons"><h4>Pontos fracos</h4><ul>'+c.cons.map(function(p){return '<li>'+p+'</li>';}).join("")+'</ul></div>';
  document.getElementById("cityBestFor").innerHTML = '<div class="bestfor"><b>Para quem é mais indicada:</b> '+c.bestFor+'</div>';
}
document.getElementById("pickEU").addEventListener("click", function(){ setProfile("eu"); });
document.getElementById("pickNONEU").addEventListener("click", function(){ setProfile("non-eu"); });
var FAQ_START = [
  {q:"Como comparar escolas sem olhar só o preço?", a:"Peça uma proposta com curso, matrícula, material, exame, seguro e proteção do aluno discriminados. Confira horário, localização, política de cancelamento, reembolso e elegibilidade migratória do curso. Guarde a proposta e os comprovantes.", src:{label:"Regras e perguntas sobre estudos · ISD", url:"https://www.irishimmigration.ie/coming-to-study-in-ireland/frequently-asked-questions-for-students/"}},
  {q:"Quanto preciso reservar antes de viajar?", a:"Some curso, passagem, seguro, documentos, hospedagem inicial, depósito de moradia e instalação. Acrescente os gastos mensais de um período sem emprego e uma margem para imprevistos. O valor de comprovação migratória não é uma previsão de quanto a viagem inteira custará."},
  {q:"O que perguntar durante uma visita ao quarto?", a:"Confirme quem pode alugar o imóvel, quem mora nele, contas incluídas, depósito, duração do acordo, regras da casa e condições de saída. Teste o trajeto até a escola. Peça tudo por escrito e verifique se é tenancy ou licence antes de presumir quais proteções se aplicam.", src:{label:"Orientação sobre moradia · Threshold", url:"https://www.threshold.ie"}},
  {q:"Como me organizar para buscar emprego?", a:"Prepare currículo em inglês, disponibilidade compatível com o curso e a permissão, referências e mensagens de candidatura. Acompanhe onde enviou o currículo e guarde contrato e recibos. Inclua no orçamento um período de procura sem renda.", src:{label:"Vagas · Jobs Ireland", url:"https://jobsireland.ie/"}},
  {q:"Como preparar saúde e adaptação?", a:"Entenda como acionar seu seguro, quais serviços cobre e onde buscar atendimento. Organize receitas e documentação de medicamentos antes do embarque. Planeje uma rotina de sono, alimentação, convivência e contato com sua rede de apoio.", src:{label:"Serviços de saúde · HSE", url:"https://www.hse.ie"}}
];
function renderFaqStart(){
  document.getElementById("faqStartWrap").innerHTML = FAQ_START.map(function(f, i){
    return '<div class="faq-item"><button class="faq-q" aria-expanded="true" aria-controls="faqA'+i+'"><span class="faq-caret">▾</span>'+f.q+'</button>'+
      '<div class="faq-a" id="faqA'+i+'"><p>'+f.a+'</p>'+(f.src?'<a href="'+f.src.url+'" target="_blank" rel="noopener" class="source-note">'+f.src.label+' ↗</a>':'')+'</div></div>';
  }).join("");
  document.querySelectorAll("#faqStartWrap .faq-q").forEach(function(btn){
    btn.addEventListener("click", function(){
      var collapsed = btn.parentElement.classList.toggle("collapsed");
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });
  });
}
function renderProfileSeg(){
  var p = getProfile();
  document.getElementById("pickEU").classList.toggle("selected", p==="eu");
  document.getElementById("pickNONEU").classList.toggle("selected", p==="non-eu");
}
function renderProfileBanner(){
  var p = getProfile(), city = getCity();
  var cname = city ? CITIES.find(function(c){return c.id===city;}).name : null;
  document.getElementById("profileBanner").innerHTML =
    'Perfil: <b>'+(p==="eu"?"cidadão UE": p==="non-eu"?"não-UE":"não definido")+'</b> · Cidade: <b>'+(cname||"não definida")+'</b>'+
    '<button class="btn btn-ghost" style="padding:7px 14px;font-size:12.5px;" id="editProfileBtn" type="button">Editar perfil</button>';
  var btn = document.getElementById("editProfileBtn");
  if(btn) btn.addEventListener("click", openOnboarding);
}

/* ---------- onboarding ---------- */
function getGoal(){ return ls("goal"); }
/* Cidadao europeu tem liberdade de movimento — pode escolher qualquer
   objetivo isoladamente. Nao-europeu so entra pela via de visto de
   estudante (Stamp 2), que ja inclui direito de trabalho limitado —
   por isso "so estudar" ou "so trabalhar" ou "morar" isolados nao sao
   caminhos legais reais pra esse perfil aqui no site. */
var GOALS_EU = [
  {v:"ingles", l:"Estudar inglês"}, {v:"trabalhar", l:"Trabalhar"},
  {v:"ingles-trabalho", l:"Estudar + trabalhar"}, {v:"morar", l:"Morar na Irlanda"}, {v:"turismo", l:"Turismo"}
];
var GOALS_NON_EU = [
  {v:"ingles-trabalho", l:"Estudar inglês + trabalhar (Stamp 2)"}, {v:"turismo", l:"Turismo"}
];
function updateGoalOptions(profile){
  var sel = document.getElementById("onbGoal");
  var current = sel.value;
  var list = profile==="non-eu" ? GOALS_NON_EU : GOALS_EU;
  sel.innerHTML = '<option value="">Selecione...</option>'+list.map(function(g){ return '<option value="'+g.v+'">'+g.l+'</option>'; }).join("");
  sel.value = list.some(function(g){ return g.v===current; }) ? current : "";
}
function openOnboarding(){
  var profile = getProfile();
  document.querySelectorAll("#onbProfileSeg .seg-btn").forEach(function(b){ b.classList.toggle("selected", b.dataset.profile===profile); });
  var city = getCity();
  document.querySelectorAll("#onbCitySeg .seg-btn").forEach(function(b){ b.classList.toggle("selected", city!==null && b.dataset.city===city); });
  updateGoalOptions(profile);
  document.getElementById("onbGoal").value = getGoal() || "";
  document.getElementById("onbTripDate").min = todayISO();
  document.getElementById("onbTripDate").value = ls("tripDate") || "";
  document.getElementById("onbFlight").checked = !!ls("hasFlight");
  document.getElementById("onbAccommodation").checked = !!ls("hasAccommodation");
  document.getElementById("onbSchool").checked = !!ls("hasSchool");
  document.getElementById("onboardingModal").hidden = false;
}
function closeOnboarding(){ document.getElementById("onboardingModal").hidden = true; }
(function(){
  var chosenProfile = null, chosenCity = undefined;
  document.querySelectorAll("#onbProfileSeg .seg-btn").forEach(function(b){
    b.addEventListener("click", function(){
      chosenProfile = b.dataset.profile;
      document.querySelectorAll("#onbProfileSeg .seg-btn").forEach(function(x){ x.classList.toggle("selected", x===b); });
      updateGoalOptions(chosenProfile);
    });
  });
  document.querySelectorAll("#onbCitySeg .seg-btn").forEach(function(b){
    b.addEventListener("click", function(){
      chosenCity = b.dataset.city;
      document.querySelectorAll("#onbCitySeg .seg-btn").forEach(function(x){ x.classList.toggle("selected", x===b); });
    });
  });
  function saveOnboarding(){
    if(chosenProfile!=null) ls("profile", chosenProfile);
    if(chosenCity!==undefined) ls("city", chosenCity);
    var goal = document.getElementById("onbGoal").value;
    if(goal) ls("goal", goal);
    var date = document.getElementById("onbTripDate").value;
    if(date) ls("tripDate", date);
    ls("hasFlight", document.getElementById("onbFlight").checked);
    ls("hasAccommodation", document.getElementById("onbAccommodation").checked);
    ls("hasSchool", document.getElementById("onbSchool").checked);
    ls("onboardingDone", true);
    closeOnboarding();
    renderAll();
  }
  function skipOnboarding(){
    ls("onboardingDone", true);
    closeOnboarding();
  }
  document.getElementById("onbSave").addEventListener("click", saveOnboarding);
  document.getElementById("onbSkip").addEventListener("click", skipOnboarding);
  document.getElementById("onboardingModal").addEventListener("click", function(e){
    if(e.target.id==="onboardingModal") skipOnboarding();
  });
  document.addEventListener("keydown", function(e){
    if(e.key==="Escape" && !document.getElementById("onboardingModal").hidden) skipOnboarding();
  });
})();

/* ---------- checklist ---------- */
var CHECKLIST = [
  {cat:"Documentos essenciais (todos)", scope:"all", items:[
    {id:"passaporte", label:"Passaporte válido (mín. 6 meses após a viagem)"},
    {id:"copias", label:"Cópias digitais e impressas de tudo", note:"Guarde separado do original."},
    {id:"passagens", label:"Passagens aéreas e localizadores confirmados"},
    {id:"hospedagem", label:"Reserva de hospedagem inicial (7–14 dias)"},
    {id:"seguro", label:"Seguro viagem/saúde contratado para todo o período"},
    {id:"cartao", label:"Cartão internacional habilitado para uso na Irlanda"},
    {id:"euros", label:"Reserva em euros definida e separada", note:"Leve ~€200–300 em espécie (notas pequenas) para os primeiros dias; o resto no cartão."},
    {id:"itamaraty", label:"Cadastro consular feito no Portal Consular do Itamaraty", note:"Facilita contato da embaixada/consulado em caso de emergência."},
    {id:"bancoaviso", label:"Banco/cartão brasileiro avisado da viagem", note:"Evita bloqueio por 'compra suspeita' ao usar o cartão na Irlanda."}
  ]},
  {cat:"Cidadania europeia", scope:"eu", items:[
    {id:"id-nacional", label:"Carteira de identidade do seu país europeu"},
    {id:"consular", label:"Registro consular, se seu país exigir (ex.: AIRE para italianos)"},
    {id:"cartao-saude-eu", label:"Cartão europeu de seguro-saúde, se elegível"}
  ]},
  {cat:"Visto de estudante (não-UE)", scope:"non-eu", items:[
    {id:"visto", label:"Visto D solicitado via AVATS (curso acima de 90 dias)", note:"Comece com 2–3 meses de antecedência — processamento leva de 4 a 8 semanas."},
    {id:"loa", label:"Letter of Acceptance de escola credenciada (ILEP)"},
    {id:"pagamento-curso", label:"Comprovante de pagamento do curso"},
    {id:"comprovacao", label:"Comprovação financeira (extratos bancários recentes)"},
    {id:"seguro-privado", label:"Seguro-saúde privado válido para o período do curso"},
    {id:"fotos-irp", label:"Fotos no padrão exigido para o IRP"},
    {id:"taxa-irp", label:"Reserva para a taxa do IRP (~€300, confirme valor atual)"}
  ]},
  {cat:"Trabalho &amp; vida fiscal (todos)", scope:"all", items:[
    {id:"ppsn-doc", label:"Documentação organizada para pedir o PPS Number", note:"Identidade, comprovante de endereço e justificativa."},
    {id:"cv", label:"CV em inglês pronto"},
    {id:"linkedin", label:"LinkedIn atualizado com disponibilidade e localização"}
  ]}
];
var CHECK_ICON = '<svg viewBox="0 0 12 12" fill="none"><path d="M2 6.2 4.8 9 10 3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var STAR_ICON = '<svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12" style="vertical-align:-1px;"><path d="M8 1.3l1.9 4.2 4.5.5-3.4 3.1.9 4.6L8 11.4l-4 2.3.9-4.6-3.4-3.1 4.5-.5z"/></svg>';

function checkItemHtml(id, label, note, checked){
  return '<label class="checkitem'+(checked?' checked':'')+'" data-id="'+id+'"><input type="checkbox" class="checkitem-input"'+(checked?' checked':'')+'><span class="box">'+CHECK_ICON+'</span>'+
    '<div><div class="ci-label">'+label+'</div>'+(note?'<div class="ci-note">'+note+'</div>':'')+'</div></label>';
}
function renderChecklist(){
  var p = getProfile();
  var state = ls("checklist") || {};
  var html = "";
  CHECKLIST.forEach(function(g){
    if(g.scope==="eu" && p==="non-eu") return;
    if(g.scope==="non-eu" && p==="eu") return;
    html += '<div class="checkgroup"><span class="eyebrow">'+g.cat+'</span>';
    g.items.forEach(function(it){ html += checkItemHtml(it.id, it.label, it.note, !!state[it.id]); });
    html += '</div>';
  });
  if(!p){ html = '<div class="callout" style="margin-bottom:20px;">Defina seu <a href="#perfil" onclick="location.hash=\'perfil\';showSection(\'perfil\');return false;">perfil de cidadania</a> para uma lista personalizada. Por enquanto, mostrando todos os itens.</div>' + html; }
  document.getElementById("checklistWrap").innerHTML = html;
  document.querySelectorAll("#checklistWrap .checkitem").forEach(function(el){
    el.querySelector(".checkitem-input").addEventListener("change", function(){
      var st = ls("checklist") || {};
      st[el.dataset.id] = !st[el.dataset.id];
      ls("checklist", st);
      el.classList.toggle("checked", st[el.dataset.id]);
      renderOverview();
    });
  });
}
function checklistCounts(){
  var p = getProfile(); var state = ls("checklist") || {}; var total=0, done=0;
  CHECKLIST.forEach(function(g){
    if(g.scope==="eu" && p==="non-eu") return;
    if(g.scope==="non-eu" && p==="eu") return;
    g.items.forEach(function(it){ total++; if(state[it.id]) done++; });
  });
  return {total:total, done:done};
}

/* ---------- cronograma (checkable) ---------- */
var CRONOGRAMA = [
  {id:"c1", when:"Mês 1–2", title:"Documentos pessoais", detail:"Passaporte, identidade, cópias digitais e, se aplicável, documentos de cidadania.", link:{sec:"imigracao", label:"Ver Imigração"}},
  {id:"c2", when:"Mês 2", title:"Financeiro", detail:"Defina orçamento, comece a poupar em euros e trace a meta de reserva até a viagem.", link:{sec:"financas", label:"Ver Finanças"}},
  {id:"c3", when:"Mês 3", title:"Escolha da cidade e da escola", detail:"Compare Dublin, Cork e Galway; pesquise escolas de inglês credenciadas.", link:{sec:"perfil", label:"Ver Perfil & cidade"}},
  {id:"c4", when:"Mês 4", title:"Visto (se não-UE)", detail:"Carta de aceite, comprovação financeira, seguro-saúde e agendamento do visto.", link:{sec:"imigracao", label:"Ver Imigração"}},
  {id:"c5", when:"Mês 5", title:"Inglês prático", detail:"Treine vocabulário de aeroporto, aluguel, trabalho e entrevistas.", link:{sec:"trabalho", label:"Ver Trabalho & estudo"}},
  {id:"c6", when:"Mês 6", title:"Saúde &amp; seguro", detail:"Compare seguros de viagem/saúde e confirme cobertura para todo o período.", link:{sec:"imigracao", label:"Ver Imigração"}},
  {id:"c7", when:"Mês 6–7", title:"Trabalho", detail:"Prepare CV em inglês, LinkedIn e treine para entrevistas.", link:{sec:"trabalho", label:"Ver Trabalho & estudo"}},
  {id:"c8", when:"Mês 7", title:"Moradia", detail:"Pesquise bairros, faixas de preço e reserve uma hospedagem temporária.", link:{sec:"acomodacao", label:"Ver Acomodação"}},
  {id:"c9", when:"Últimos 15 dias", title:"Revisão final", detail:"Documentos, mala, seguro, conexão e reservas confirmadas."},
  {id:"c10", when:"Dia da viagem", title:"Embarque", detail:"Brasil → Irlanda. Boa viagem!"}
];
var DIAS30 = [
  {id:"d1", when:"Dias 1–3", title:"Chegada", detail:"Vá para a hospedagem temporária, descanse, ative chip/eSIM e providencie a Leap Card.", link:{sec:"transporte", label:"Ver Transporte"}},
  {id:"d2", when:"Dias 1–3", title:"Reconhecimento", detail:"Localize mercado, farmácia, transporte e a escola/curso mais próximos.", link:{sec:"mercado", label:"Ver Mercado"}},
  {id:"d3", when:"Dias 4–7", title:"Moradia", detail:"Comece as visitas a quartos e compare bairros — nunca feche sem visitar.", link:{sec:"acomodacao", label:"Ver Acomodação"}},
  {id:"d4", when:"Dias 4–7", title:"Trabalho", detail:"Revise o CV, teste trajetos nos horários reais e comece os contatos.", link:{sec:"trabalho", label:"Ver Trabalho & estudo"}},
  {id:"d5", when:"Semana 2", title:"Intensifique a busca", detail:"Envie currículos, participe de entrevistas e avance na busca por moradia.", link:{sec:"trabalho", label:"Ver Trabalho & estudo"}},
  {id:"d6", when:"Semana 2", title:"Controle financeiro", detail:"Registre os gastos reais da primeira semana e recalibre seu orçamento.", link:{sec:"financas", label:"Ver Finanças"}},
  {id:"d7", when:"Semanas 3–4", title:"Rotina", detail:"Feche a rotina de moradia, transporte e alimentação.", link:{sec:"transporte", label:"Ver Transporte"}},
  {id:"d8", when:"Semanas 3–4", title:"PPSN &amp; Revenue", detail:"Regularize o PPSN e o registro fiscal assim que tiver um emprego confirmado.", link:{sec:"trabalho", label:"Ver Trabalho & estudo"}},
  {id:"d9", when:"Semanas 3–4", title:"Conta &amp; saúde", detail:"Avalie conta bancária local e revise seu seguro-saúde.", link:{sec:"financas", label:"Ver Finanças"}}
];
function getPlanNote(id){ return (ls("planNotes")||{})[id] || ""; }
function setPlanNote(id, text){
  var notes = ls("planNotes") || {};
  if(text) notes[id] = text; else delete notes[id];
  ls("planNotes", notes);
}
function timelineHtml(list, doneMap){
  return list.map(function(t){
    var done = !!doneMap[t.id];
    var link = t.link ? '<a href="#'+t.link.sec+'" class="ci-link" onclick="event.stopPropagation();location.hash=\''+t.link.sec+'\';showSection(\''+t.link.sec+'\');return false;">'+t.link.label+' →</a>' : '';
    var note = getPlanNote(t.id);
    return '<div class="checkitem-wrap">'+
      '<label class="checkitem'+(done?' checked':'')+'" data-id="'+t.id+'"><input type="checkbox" class="checkitem-input"'+(done?' checked':'')+'><span class="box">'+CHECK_ICON+'</span>'+
      '<div><span class="pill step">'+t.when+'</span>'+
      '<div class="ci-label" style="text-decoration:none;margin-top:6px;">'+(done?'<span style="color:var(--muted);text-decoration:line-through;">':'')+t.title+(done?'</span>':'')+'</div>'+
      '<div class="ci-note">'+t.detail+'</div>'+link+
      '<button type="button" class="ci-link plan-note-toggle" data-note-id="'+t.id+'" style="border:none;background:none;padding:0;font:inherit;cursor:pointer;display:block;margin-top:6px;">'+(note?"✎ Editar minha observação":"+ Adicionar observação")+'</button>'+
      '</div></label>'+
      '<div class="plan-note-box" data-note-wrap="'+t.id+'"'+(note?"":" hidden")+' style="margin:6px 0 4px 44px;">'+
      '<textarea class="plan-note-input" data-note-input="'+t.id+'" placeholder="Sua observação pessoal (só fica neste navegador)..." rows="2">'+escapeHtml(note)+'</textarea>'+
      '</div></div>';
  }).join("");
}
function wirePlanNotes(containerId){
  document.querySelectorAll("#"+containerId+" .plan-note-toggle").forEach(function(btn){
    btn.addEventListener("click", function(e){
      e.preventDefault(); e.stopPropagation();
      var id = btn.dataset.noteId;
      var box = document.querySelector('#'+containerId+' [data-note-wrap="'+id+'"]');
      box.hidden = !box.hidden;
      if(!box.hidden) box.querySelector("textarea").focus();
    });
  });
  document.querySelectorAll("#"+containerId+" .plan-note-input").forEach(function(ta){
    ta.addEventListener("click", function(e){ e.stopPropagation(); });
    ta.addEventListener("change", function(){
      setPlanNote(ta.dataset.noteInput, ta.value.trim());
      var btn = document.querySelector('#'+containerId+' [data-note-id="'+ta.dataset.noteInput+'"]');
      if(btn) btn.textContent = ta.value.trim() ? "✎ Editar minha observação" : "+ Adicionar observação";
    });
  });
}
function renderCheckableList(containerId, list, storeKey, afterFn){
  var doneMap = ls(storeKey) || {};
  document.getElementById(containerId).innerHTML = timelineHtml(list, doneMap);
  wirePlanNotes(containerId);
  document.querySelectorAll("#"+containerId+" .checkitem").forEach(function(el){
    el.querySelector(".checkitem-input").addEventListener("change", function(){
      var dm = ls(storeKey) || {};
      dm[el.dataset.id] = !dm[el.dataset.id];
      ls(storeKey, dm);
      renderCheckableList(containerId, list, storeKey, afterFn);
      renderOverview();
      if(afterFn) afterFn();
    });
  });
}
function countsFor(list, storeKey){
  var dm = ls(storeKey) || {}; var done=0;
  list.forEach(function(t){ if(dm[t.id]) done++; });
  return {total:list.length, done:done};
}

/* ---------- proximo passo / continuar de onde parou ---------- */
function firstPendingChecklist(){
  var p = getProfile();
  var state = ls("checklist") || {};
  for(var gi=0; gi<CHECKLIST.length; gi++){
    var g = CHECKLIST[gi];
    if(g.scope==="eu" && p==="non-eu") continue;
    if(g.scope==="non-eu" && p==="eu") continue;
    for(var ii=0; ii<g.items.length; ii++){
      if(!state[g.items[ii].id]) return {title:g.items[ii].label, sec:"roteiro"};
    }
  }
  return null;
}
function firstPendingFrom(list, storeKey){
  var dm = ls(storeKey) || {};
  for(var i=0;i<list.length;i++){
    if(!dm[list[i].id]) return {title:list[i].title, sec:(list[i].link?list[i].link.sec:"roteiro")};
  }
  return null;
}
function findNextTask(){
  var alreadyTraveled = false;
  var tripDate = ls("tripDate");
  if(tripDate){
    var d = new Date(tripDate+"T00:00:00");
    if(!isNaN(d.getTime()) && d.getTime() < Date.now()) alreadyTraveled = true;
  }
  var beforeTrip = firstPendingFrom(CRONOGRAMA,"cronogramaDone") || firstPendingChecklist();
  var afterArrival = firstPendingFrom(DIAS30,"dias30Done");
  if(alreadyTraveled) return afterArrival || beforeTrip;
  return beforeTrip || afterArrival;
}
function renderNextStepCard(){
  var el = document.getElementById("nextStepWrap");
  if(!el) return;
  if(!getProfile()){
    el.innerHTML = '<div class="eyebrow" style="color:var(--muted);">Próximo passo</div>'+
      '<div style="font-weight:700;margin-top:4px;">Configure sua viagem para criarmos seu planejamento</div>'+
      '<button type="button" class="ci-link" style="border:none;background:none;padding:0;font:inherit;cursor:pointer;" onclick="openOnboarding()">Responder agora →</button>';
    return;
  }
  var next = findNextTask();
  if(!next){
    el.innerHTML = '<div class="eyebrow" style="color:var(--muted);">Próximo passo</div><div style="font-weight:700;margin-top:4px;">Tudo em dia! 🎉</div><p class="ci-note" style="margin-top:2px;">Nenhuma tarefa pendente no momento.</p>';
    return;
  }
  el.innerHTML = '<div class="eyebrow" style="color:var(--muted);">Próximo passo</div>'+
    '<div style="font-weight:700;margin-top:4px;">'+escapeHtml(next.title)+'</div>'+
    '<a href="#'+next.sec+'" class="ci-link" onclick="location.hash=\''+next.sec+'\';showSection(\''+next.sec+'\');return false;">Resolver agora →</a>';
}
function renderContinueCard(){
  var el = document.getElementById("continueWrap");
  if(!el) return;
  var last = ls("lastSection");
  var labels = {perfil:"Perfil & cidade", roteiro:"Meu Plano", imigracao:"Imigração", financas:"Finanças",
    trabalho:"Trabalho & estudo", acomodacao:"Acomodação", mercado:"Mercado", transporte:"Transporte",
    links:"Links oficiais", grupos:"Grupos", turismo:"Turismo"};
  if(!last || !labels[last]){ el.hidden = true; el.innerHTML=""; return; }
  el.hidden = false;
  el.innerHTML = '<button type="button" class="btn-ghost btn" style="width:auto;" onclick="location.hash=\''+last+'\';showSection(\''+last+'\');">↺ Continuar em '+labels[last]+'</button>';
}

/* ---------- overview ---------- */
function renderOverview(){
  renderNextStepCard();
  renderContinueCard();
  var cl = checklistCounts(), cr = countsFor(CRONOGRAMA,"cronogramaDone"), d3 = countsFor(DIAS30,"dias30Done");
  var total = cl.total+cr.total+d3.total, done = cl.done+cr.done+d3.done;
  var pct = total ? Math.round(done/total*100) : 0;
  document.getElementById("progressPct").textContent = pct+"%";
  document.getElementById("progressFrac").textContent = done+" de "+total+" concluídos";
  var circumference = 169.6;
  document.getElementById("ringFill").style.strokeDashoffset = (circumference - (pct/100)*circumference);
  var miniBar = document.getElementById("miniProgressBar"), miniPct = document.getElementById("miniProgressPct");
  if(miniBar){ miniBar.style.transform = "scaleX("+(pct/100)+")"; miniPct.textContent = pct+"%"; }

  var b = getBudget();
  var totalExpenses = sumExpenses(b);
  document.getElementById("statBudget").textContent = "€"+totalExpenses.toFixed(0);
  document.getElementById("statBudgetSub").textContent = "Quarto €"+b.rent+" · transporte €"+b.transport+" · mercado €"+b.groceries;

  var stayOptions = getStayOptions();
  var selectedStay = stayOptions.find(function(s){ return s.id===ls("selectedStay"); });
  if(selectedStay){
    var eur = (selectedStay.noites*selectedStay.preco/getCotacao()).toFixed(2);
    document.getElementById("statStay").textContent = "€"+eur;
    document.getElementById("statStaySub").textContent = selectedStay.nome+" · "+selectedStay.noites+" noites";
  } else {
    document.getElementById("statStay").textContent = "—";
    document.getElementById("statStaySub").textContent = "Escolha uma opção em Acomodação";
  }

  document.getElementById("miniTimeline").innerHTML = CRONOGRAMA.slice(0,5).map(function(t){
    var done = !!(ls("cronogramaDone")||{})[t.id];
    return '<div style="display:flex;gap:10px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--border);font-size:13.3px;">'+
      '<span class="tabular" style="color:var(--accent-strong);font-weight:600;min-width:110px;">'+t.when+'</span>'+
      '<span style="'+(done?'color:var(--muted);text-decoration:line-through;':'')+'">'+t.title+'</span></div>';
  }).join("");

  renderProfileBanner();
  renderHero();
}

/* ---------- vistos / trabalho / curso ---------- */
function fonte(url){ return ' <a href="'+url+'" target="_blank" rel="noopener" style="font-size:12px;color:var(--accent-strong);white-space:nowrap;">Fonte oficial · conferida em 08/09/2026 ↗</a>'; }
var F_FAQ = "https://www.irishimmigration.ie/coming-to-study-in-ireland/frequently-asked-questions-for-students/";
var F_BRVISA = "https://www.ireland.ie/en/brazil/saopaulo/services/visas/visas-for-ireland/";
var F_IRP = "https://www.irishimmigration.ie/registering-your-immigration-permission/how-to-register-your-immigration-permission-for-the-first-time/information-on-registering-your-immigration-permission-for-the-first-time/";
var F_FIN = "https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-options/a-fee-paying-private-primary-or-secondary-school/information-on-student-finances/";
var VISTOS = [
  {title:"Entrada e visto de estudante — antes de embarcar", eu:false, body:"Brasileiros com passaporte brasileiro são dispensados de visto para estadias curtas (turismo/visita) — mas isso <strong>não vale</strong> para a maioria dos cursos de inglês (6–8 meses, acima de 90 dias). Nesse caso, é preciso solicitar o visto de longa duração <strong>tipo D</strong> ANTES de viajar: não dá para entrar como turista e regularizar depois. O pedido é feito online no <strong>AVATS</strong> (sistema oficial de vistos irlandês); depois você agenda horário num centro <strong>VFS Global</strong> (parceiro oficial no Brasil) para entregar biometria, documentos e pagar a taxa. Processamento de <strong>4 a 8 semanas</strong> (pode demorar mais entre maio e agosto) — comece com antecedência e só compre passagens não-reembolsáveis depois do visto aprovado. Ao chegar, apresente o propósito de estudo e os documentos exigidos; a entrada final depende da avaliação da imigração. Outras nacionalidades podem ter regras diferentes — confira os requisitos do seu passaporte antes de comprar a passagem."+fonte(F_BRVISA)},
  {title:"Stamp 2", eu:false, body:"Permissão de estudante para cursos elegíveis, incluindo inglês (em escola credenciada no ILEP) e ensino superior. A elegibilidade do curso e as condições da permissão precisam ser verificadas antes da matrícula. Não se aplica a cidadãos europeus, que têm liberdade de movimento."+fonte(F_FAQ)},
  {title:"IRP: primeiro registro depois da chegada", eu:false, body:"Desde <strong>13/01/2025</strong>, o primeiro registro de residência de toda a República da Irlanda (não só Dublin) é feito pelo ISD em <strong>Burgh Quay, Dublin</strong>. Agende pelo canal oficial (conta no Digital Contact Centre) assim que chegar — não há prazo garantido para vaga. Agendar é gratuito; a taxa de registro do cartão pode ser de <strong>€300</strong>, paga só com cartão. Leve passaporte, formulário de endereço, carta da escola com matrícula e mensalidade paga, comprovação financeira e seguro-saúde."+fonte(F_IRP)},
  {title:"Seguro-saúde exigido", eu:false, body:"Estudantes não europeus devem apresentar seguro médico privado adequado às condições da permissão — normalmente cobertura mínima de <strong>€25.000 para acidente e €25.000 para doença</strong>, válida por todo o período. Confira cobertura, exclusões e documentos aceitos com o ISD antes de contratar; seguro de viagem e seguro médico não são automaticamente equivalentes."+fonte(F_FAQ)},
  {title:"Comprovação financeira", eu:false, body:"Para estudantes dispensados de visto de entrada, o valor oficial exigido pelo ISD é de <strong>€6.665</strong> para permanências de até oito meses — esse é o total que precisa estar disponível na conta que você vai apresentar à imigração (o cálculo é €833/mês × 8, mas o que importa é ter esse saldo completo na conta, não um fluxo mensal). Acima de oito meses, o valor sobe para <strong>€10.000 por ano acadêmico</strong>. Para quem precisa de visto, a comprovação ocorre no próprio pedido do visto, conforme as regras da categoria. O extrato não deve ter mais de 90 dias, e depósitos grandes recentes sem explicação podem levantar suspeita. O mínimo migratório não substitui um orçamento pessoal e não deve depender de conseguir emprego."+fonte(F_FIN)},
  {title:"Limite de horas de trabalho", eu:false, body:"Com Stamp 2: até <strong>20 horas semanais</strong> no período regular, e até <strong>40 horas semanais</strong> durante os períodos de férias padronizados — <strong>junho a setembro (inclusive)</strong> e de <strong>15 de dezembro a 15 de janeiro</strong>. Férias individuais da escola fora dessas datas não liberam automaticamente as 40 horas."+fonte(F_FAQ)},
  {title:"Na prática: sobreviver com 20h", eu:false, body:"20h/semana no salário mínimo dá pouco mais de €1.100–1.200/mês líquidos — apertado nas cidades mais caras, ainda mais em Dublin. É comum ver intercambista trabalhando além do limite oficial pra fechar a conta, mas isso é uma violação da permissão de estudo: o risco real é perder o Stamp 2/IRP e complicar pedidos migratórios futuros (inclusive em outros países). Se for pra fechar as contas, priorize aumentar horas nos períodos de férias liberadas (40h) e ajustar o orçamento antes de contar com horas extras informais."},
  {title:"Renovação e continuidade dos estudos", eu:false, body:"Cursos de inglês têm teto de <strong>2 anos cumulativos</strong> (até 3 matrículas de 8 meses). Para renovar: matricule-se num curso de nível superior de pelo menos 25 semanas, comprove frequência mínima de 15h/semana no curso anterior, tenha frequentado pelo menos 85% das aulas, e apresente resultado do exame de fim de curso. Planeje a renovação antes do vencimento — não presuma que um curso noturno ou parcial mantém a mesma permissão."+fonte(F_FAQ)},
  {title:"Para cidadãos europeus", eu:true, body:"Como cidadão da UE/EEE/Suíço, você não precisa de visto, Stamp 2, IRP nem Employment Permit, e não há limite de horas ligado ao curso. O foco vai para documentação prática, PPSN, moradia, saúde e adaptação."}
];
var TRABALHO = [
  {title:"PPS Number (PPSN)", body:"Identificação fiscal e de serviços na Irlanda. Peça depois de chegar, com uma justificativa clara (ex.: proposta de emprego). Agende pelo MyWelfare.ie e leve identidade, comprovante de endereço e a justificativa."},
  {title:"Revenue &amp; myAccount", body:"Registre o primeiro emprego o quanto antes no Revenue (myAccount) para evitar o 'Emergency Tax' — imposto temporário mais alto cobrado até você ser regularizado."},
  {title:"Salário mínimo nacional", body:"Referência para 2026: €14,15/hora, com previsão de reajuste para €14,94/hora a partir de janeiro de 2027. Confirme o valor vigente em workplacerelations.ie."},
  {title:"Direitos trabalhistas básicos", body:"Contrato/termo de emprego por escrito logo no início, recibo de pagamento (payslip) a cada pagamento, pausas durante o expediente e período mínimo de férias remuneradas proporcional. Guarde contratos e comprovantes."}
];
var CURSO_REGRAS = [
  {title:"Se você não é da UE", eu:false, body:"A escola precisa constar na lista oficial ILEP e o curso ter no mínimo 15h semanais presenciais. Cursos mais longos podem exigir exame de proficiência (ELP) perto da renovação."},
  {title:"Se você é da UE", eu:true, body:"Liberdade total de escolha — sem credenciamento migratório necessário. Escolha pelo custo-benefício e horário."},
  {title:"Estratégia sugerida", eu:null, body:"Na chegada, curso intensivo pela manhã (4–8 semanas) acelera speaking/listening/gramática. Depois de conseguir emprego, migrar para curso noturno (2 noites/semana) costuma ser mais sustentável."}
];
var SCHOOL_CITIES = [{id:"dublin",l:"Dublin"},{id:"cork",l:"Cork"},{id:"galway",l:"Galway"}];
var SCHOOLS_SEED = {
  dublin: [
    {name:"Everest Language School", rating:4.9, reviews:353, morning:205, afternoon:125, evening:40, note:"Melhor equilíbrio geral: intensivo na chegada + noturno barato depois do emprego. everestlanguageschool.com"},
    {name:"ULearn English School", rating:4.7, reviews:312, morning:180, afternoon:140, evening:null, note:"Ótimo custo-benefício diurno; localização central. ulearnschool.com"},
    {name:"Delfin English School", rating:4.7, reviews:614, morning:155, afternoon:130, evening:null, note:"Boa relação preço/estrutura; taxa de matrícula UE baixa. delfinschool.com"},
    {name:"Englishour", rating:4.8, reviews:148, morning:145, afternoon:130, evening:40, note:"Excelente após conseguir emprego: noturno enxuto e barato. englishour.ie"},
    {name:"Your English Language School", rating:4.9, reviews:169, morning:220, afternoon:220, evening:41.25, note:"Turmas noturnas pequenas; boa opção part-time. yourenglish.ie"},
    {name:"Atlas Language School", rating:4.7, reviews:813, morning:300, afternoon:null, evening:null, note:"Estrutura e programa social fortes; preço mais alto. atlaslanguageschool.com"},
    {name:"International House Dublin", rating:4.4, reviews:442, morning:170, afternoon:null, evening:null, note:"Boa opção para inglês profissional; peça cotação real. ihdublin.com"},
    {name:"Emerald Cultural Institute", rating:4.3, reviews:101, morning:375, afternoon:null, evening:null, note:"Turmas menores e apoio acadêmico forte; custo alto. eci.ie"}
  ],
  cork: [
    {name:"Cork English Academy", rating:null, reviews:null, morning:150, afternoon:120, evening:null, note:"Preço da faixa 2–4 semanas (cai p/ €100/€80 em 25+ sem). Matrícula €65 + material €50. 2 Drinan Street, Cork City. corkenglishacademy.com"},
    {name:"Cork English College", rating:null, reviews:null, morning:null, afternoon:null, evening:null, note:"Oferece standard, intensivo e noturno. Matrícula €75 + material €75 — consulte o site para valor semanal atualizado. corkenglishcollege.com"},
    {name:"Cork English World", rating:null, reviews:null, morning:null, afternoon:null, evening:null, note:"Mínimo 20h/semana de prática. Crawford Business Park, Bishop St. Consulte o site para valor semanal atualizado. cew.ie"}
  ],
  galway: [
    {name:"Atlantic Language Galway", rating:null, reviews:null, morning:400, afternoon:null, evening:null, note:"15h/semana (20 aulas). Fairgreen House, Fairgreen Road. atlanticlanguage.com"},
    {name:"Galway Cultural Institute (GCI)", rating:null, reviews:null, morning:290, afternoon:220, evening:null, note:"Curso estendido de 26 aulas: €360/sem. Preços caem após 12 sem. Matrícula €70 + material €75. gci.ie"}
  ]
};
function getSchools(city){
  var key = "schools_"+city;
  var saved = ls(key);
  if(saved && saved.length) return saved;
  var seeded = (SCHOOLS_SEED[city]||[]).map(function(s,i){ return Object.assign({id:city+i}, s); });
  ls(key, seeded);
  return seeded;
}
function saveSchools(city, list){ ls("schools_"+city, list); }
var schoolCity = ls("schoolCityView") || "dublin";
function renderVistos(){
  var p = getProfile();
  document.getElementById("vistosWrap").innerHTML = VISTOS.filter(function(v){
    if(v.eu===true) return p!=="non-eu"; if(v.eu===false) return p!=="eu"; return true;
  }).map(function(v){ return '<div class="card"><h3>'+v.title+'</h3><p style="margin:0;">'+v.body+'</p></div>'; }).join("");
}
function renderTrabalho(){
  document.getElementById("trabalhoWrap").innerHTML = TRABALHO.map(function(t){ return '<div class="card"><h3>'+t.title+'</h3><p style="margin:0;">'+t.body+'</p></div>'; }).join("");
}
function renderCursoRegras(){
  var p = getProfile();
  document.getElementById("cursoRegrasWrap").innerHTML = CURSO_REGRAS.filter(function(c){
    if(c.eu===true) return p!=="non-eu"; if(c.eu===false) return p!=="eu"; return true;
  }).map(function(c){ return '<div class="card"><h3>'+c.title+'</h3><p style="margin:0;">'+c.body+'</p></div>'; }).join("");
}
function renderSchoolTabs(){
  document.getElementById("schoolCityTabs").innerHTML = SCHOOL_CITIES.map(function(c){
    return '<button class="subtab'+(schoolCity===c.id?' active':'')+'" data-city="'+c.id+'">'+c.l+'</button>';
  }).join("");
  document.querySelectorAll("#schoolCityTabs .subtab").forEach(function(b){
    b.addEventListener("click", function(){
      schoolCity = b.dataset.city; ls("schoolCityView", schoolCity);
      renderSchoolTabs(); renderSchoolsTable(); renderSchoolAddForm();
    });
  });
}
function renderSchoolsTable(){
  var list = getSchools(schoolCity);
  var rows = list.map(function(s){
    return '<tr>'+
      '<td data-label="Escola"><input type="text" style="width:190px;" value="'+escapeHtml(s.name)+'" data-id="'+s.id+'" data-f="name"></td>'+
      '<td class="num" data-label="Nota">'+(s.rating?s.rating+' '+STAR_ICON+(s.reviews?'<div class="source-note">'+s.reviews+' aval.</div>':""):'<span class="source-note">—</span>')+'</td>'+
      '<td data-label="Manhã €/sem"><input type="number" step="1" style="width:62px;" value="'+(s.morning!=null?s.morning:"")+'" data-id="'+s.id+'" data-f="morning" placeholder="—"></td>'+
      '<td data-label="Tarde €/sem"><input type="number" step="1" style="width:62px;" value="'+(s.afternoon!=null?s.afternoon:"")+'" data-id="'+s.id+'" data-f="afternoon" placeholder="—"></td>'+
      '<td data-label="Noite €/sem"><input type="number" step="1" style="width:62px;" value="'+(s.evening!=null?s.evening:"")+'" data-id="'+s.id+'" data-f="evening" placeholder="—"></td>'+
      '<td data-label="Observação" style="min-width:220px;"><textarea style="width:100%;min-height:80px;resize:vertical;font:inherit;line-height:1.4;" data-id="'+s.id+'" data-f="note">'+escapeHtml(s.note||"")+'</textarea></td>'+
      '<td data-label=""><button class="btn-ghost btn" style="width:auto;padding:5px 10px;font-size:12px;" data-remove="'+s.id+'">Remover</button></td>'+
      '</tr>';
  }).join("");
  document.getElementById("schoolsTable").innerHTML =
    '<thead><tr><th>Escola</th><th class="num">Nota</th><th class="num">Manhã €/sem</th><th class="num">Tarde €/sem</th><th class="num">Noite €/sem</th><th>Observação</th><th></th></tr></thead>'+
    '<tbody>'+(rows || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:22px;">Nenhuma escola cadastrada — adicione abaixo.</td></tr>')+'</tbody>';
  document.querySelectorAll("#schoolsTable input, #schoolsTable textarea").forEach(function(inp){
    inp.addEventListener("input", function(){
      var list2 = getSchools(schoolCity);
      var row = list2.find(function(r){ return r.id===inp.dataset.id; });
      if(!row) return;
      var f = inp.dataset.f;
      row[f] = (f==="morning"||f==="afternoon"||f==="evening") ? (inp.value===""?null:parseFloat(inp.value)) : inp.value;
      saveSchools(schoolCity, list2);
      if(inp.tagName==="TEXTAREA"){ inp.style.height = "auto"; inp.style.height = Math.max(inp.scrollHeight, 80) + "px"; }
    });
  });
  document.querySelectorAll("#schoolsTable [data-remove]").forEach(function(btn){
    btn.addEventListener("click", function(){
      saveSchools(schoolCity, getSchools(schoolCity).filter(function(r){ return r.id!==btn.dataset.remove; }));
      renderSchoolsTable();
    });
  });
}
function renderSchoolAddForm(){
  document.getElementById("schoolAddForm").innerHTML =
    '<div class="mini-form-grid">'+
    '<div><label>Nome da escola</label><input id="newSchoolName" type="text"></div>'+
    '<div><label>Manhã €/semana</label><input id="newSchoolMorning" type="number" step="1"></div>'+
    '<div><label>Tarde €/semana</label><input id="newSchoolAfternoon" type="number" step="1"></div>'+
    '<div><label>Noite €/semana</label><input id="newSchoolEvening" type="number" step="1"></div>'+
    '<div style="grid-column:1/-1;"><label>Observação</label><input id="newSchoolNote" type="text" placeholder="Endereço, site, condições..."></div>'+
    '</div>'+
    '<button class="btn btn-accent" style="width:auto;padding:10px 18px;" id="addSchoolBtn" type="button">Adicionar escola</button>';
  document.getElementById("addSchoolBtn").addEventListener("click", function(){
    var name = document.getElementById("newSchoolName").value.trim();
    if(!name) return;
    var list = getSchools(schoolCity);
    list.push({id:schoolCity+Date.now(), name:name, rating:null, reviews:null,
      morning:parseFloat(document.getElementById("newSchoolMorning").value)||null,
      afternoon:parseFloat(document.getElementById("newSchoolAfternoon").value)||null,
      evening:parseFloat(document.getElementById("newSchoolEvening").value)||null,
      note:document.getElementById("newSchoolNote").value.trim()});
    saveSchools(schoolCity, list);
    renderSchoolsTable();
  });
}

/* ---------- vagas de entrada rápida ---------- */
var JOB_ROLES = [{id:"cleaner",l:"Cleaner (limpeza)"},{id:"barista",l:"Barista"}];
var JOBS_SEED = {
  cleaner: {
    tips:"Destaque confiabilidade, atenção a detalhes e disponibilidade de horário flexível (manhã cedo ou noite). Experiência prévia com limpeza/organização ajuda, mas nem sempre é exigida — algumas vagas pedem Garda Vetting (verificação de antecedentes) se você já morou fora da Irlanda por mais de 6 meses.",
    companies:[
      {name:"BidvestNoonan", note:"Uma das maiores empresas de facilities/limpeza da Irlanda — contrata com frequência."},
      {name:"Sodexo", note:"Serviços de limpeza e facilities em hotéis, empresas e hospitais."},
      {name:"Aramark", note:"Limpeza e serviços em grandes instalações."},
      {name:"OCS Ireland", note:"Facilities management, limpeza e segurança."},
      {name:"Momentum Support", note:"Empresa irlandesa de limpeza e facilities."}
    ]
  },
  barista: {
    tips:"Destaque atendimento ao cliente, trabalho em equipe e disponibilidade em fins de semana. Muitas vagas dizem explicitamente 'no experience necessary' — o treinamento é dado pela empresa.",
    companies:[
      {name:"Costa Coffee", note:"Rede com vagas frequentes e treinamento completo para quem não tem experiência."},
      {name:"Starbucks", note:"Contrata com frequência em lojas de Dublin e outras cidades."},
      {name:"Coffeeangel", note:"Cafeteria independente de Dublin, conhecida por valorizar a equipe."},
      {name:"Butlers Chocolate Café", note:"Rede irlandesa de cafés, presente em várias cidades."}
    ]
  }
};
function getJobs(role){
  var key = "jobs_"+role;
  var saved = ls(key);
  if(saved) return saved;
  var seed = JOBS_SEED[role] || {tips:"",companies:[]};
  var data = {tips:seed.tips, companies:seed.companies.map(function(c,i){ return Object.assign({id:role+i}, c); })};
  ls(key, data);
  return data;
}
function saveJobs(role, data){ ls("jobs_"+role, data); }
var jobRole = ls("jobRoleView") || "cleaner";
function renderJobRoleTabs(){
  document.getElementById("jobRoleTabs").innerHTML = JOB_ROLES.map(function(r){
    return '<button class="subtab'+(jobRole===r.id?' active':'')+'" data-role="'+r.id+'">'+r.l+'</button>';
  }).join("");
  document.querySelectorAll("#jobRoleTabs .subtab").forEach(function(b){
    b.addEventListener("click", function(){ jobRole = b.dataset.role; ls("jobRoleView", jobRole); renderJobRoleTabs(); renderJobRoleContent(); renderJobAddForm(); });
  });
}
function renderJobRoleContent(){
  var data = getJobs(jobRole);
  var rows = data.companies.map(function(c){
    return '<div class="checkitem" style="cursor:default;"><span class="box" style="background:var(--accent-soft);border-color:var(--accent-soft);"></span>'+
      '<div style="flex:1;"><div class="ci-label">'+c.name+'</div><div class="ci-note">'+c.note+'</div></div>'+
      '<button class="btn-ghost btn" style="width:auto;padding:5px 10px;font-size:12px;flex:none;" data-remove="'+c.id+'">Remover</button></div>';
  }).join("");
  document.getElementById("jobRoleWrap").innerHTML =
    '<div class="callout">'+data.tips+'</div>'+
    '<h4 style="font-size:14.5px;font-weight:700;margin:16px 0 8px;color:var(--text);">Empresas/agências que costumam contratar</h4>'+
    (rows || '<div class="empty">Nenhuma empresa cadastrada ainda.</div>');
  document.querySelectorAll("#jobRoleWrap [data-remove]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var d = getJobs(jobRole);
      d.companies = d.companies.filter(function(c){ return c.id!==btn.dataset.remove; });
      saveJobs(jobRole, d);
      renderJobRoleContent();
    });
  });
}
function renderJobAddForm(){
  document.getElementById("jobAddForm").innerHTML =
    '<div class="mini-form-grid">'+
    '<div><label>Nome da empresa/agência</label><input id="newJobName" type="text"></div>'+
    '<div><label>Observação</label><input id="newJobNote" type="text" placeholder="O que oferecem, onde fica..."></div>'+
    '</div>'+
    '<button class="btn btn-accent" style="width:auto;padding:10px 18px;" id="addJobBtn" type="button">Adicionar empresa</button>';
  document.getElementById("addJobBtn").addEventListener("click", function(){
    var name = document.getElementById("newJobName").value.trim();
    if(!name) return;
    var d = getJobs(jobRole);
    d.companies.push({id:jobRole+Date.now(), name:name, note:document.getElementById("newJobNote").value.trim()});
    saveJobs(jobRole, d);
    renderJobRoleContent();
    document.getElementById("newJobName").value=""; document.getElementById("newJobNote").value="";
  });
}

/* ---------- acomodação ---------- */
var STAY_SEED = [
  {nome:"Gardiner Hostel", noites:10, preco:519.00, obs:"Dormitório 4 camas (misto) + café da manhã"},
  {nome:"Garden Lane", noites:10, preco:509.59, obs:"Dormitório 4 camas (misto) + café da manhã"},
  {nome:"Leevin Hostel · 6 beliches", noites:10, preco:552.31, obs:"6 beliches"},
  {nome:"Leevin Hostel · 4 beliches", noites:10, preco:587.11, obs:"4 beliches"},
  {nome:"Leevin Hostel · 2 beliches", noites:10, preco:801.82, obs:"2 beliches"},
  {nome:"Quarto em Dublin · Airbnb", noites:10, preco:343.51, obs:"1 quarto solteiro — casa de irlandeses"},
  {nome:"Quarto em Dublin · Airbnb econômico", noites:10, preco:312.83, obs:"1 quarto solteiro — casa de irlandeses"},
  {nome:"Garden Lane Backpackers", noites:10, preco:510.31, obs:"Dormitório 4 camas + café da manhã"},
  {nome:"Mattew e Roberta · Airbnb", noites:10, preco:328.70, obs:"Casa aconchegante — quarto duplo em Dublin", selected:true}
];
function getStayOptions(){
  var saved = ls("stayOptions");
  if(saved && saved.length) return saved;
  var seeded = STAY_SEED.map(function(s,i){ var o=Object.assign({id:"s"+i}, s); return o; });
  ls("stayOptions", seeded);
  var sel = seeded.find(function(s){ return s.selected; });
  if(sel) ls("selectedStay", sel.id);
  return seeded;
}
function saveStayOptions(o){ ls("stayOptions", o); }
function getCotacao(){ return ls("cotacao") || 6.02; }
function fetchLiveCotacao(){
  var today = new Date().toISOString().slice(0,10);
  if(ls("cotacaoUpdatedAt") === today) return;
  fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=BRL")
    .then(function(r){ return r.json(); })
    .then(function(d){
      var rate = d && d.rates && d.rates.BRL;
      if(!rate) return;
      ls("cotacao", rate);
      ls("cotacaoUpdatedAt", today);
      var val = document.getElementById("heroCotacaoVal");
      if(val) val.textContent = "R$ " + rate.toFixed(2).replace(".", ",");
      var inp = document.getElementById("cotacaoInput");
      if(inp) inp.value = rate;
      var note = document.getElementById("cotacaoAutoNote");
      if(note) note.textContent = "Atualizada automaticamente hoje ("+today.split("-").reverse().join("/")+"), a partir do Banco Central Europeu.";
      if(typeof updateStayComputed === "function") updateStayComputed();
    })
    .catch(function(){ /* sem internet ou API fora do ar — mantém o último valor salvo */ });
}
function renderStayFields(){
  var updated = ls("cotacaoUpdatedAt");
  var noteText = updated ? "Atualizada automaticamente em "+updated.split("-").reverse().join("/")+", a partir do Banco Central Europeu. Você pode ajustar manualmente se precisar." : "Buscando cotação automática... você também pode ajustar manualmente.";
  document.getElementById("stayCotacaoWrap").innerHTML =
    '<div class="numfield"><label>Cotação R$/€ (usada em todas as opções)</label>'+
    '<div style="display:flex;align-items:center;gap:10px;">'+
    '<input type="number" step="0.01" id="cotacaoInput" value="'+getCotacao()+'" style="width:90px;">'+
    '<a href="https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-brl.en.html" target="_blank" rel="noopener" class="btn-ghost btn" style="width:auto;padding:6px 12px;font-size:12px;">Fonte oficial (BCE) ↗</a>'+
    '</div></div>'+
    '<p class="source-note" style="margin-top:8px;" id="cotacaoAutoNote">'+noteText+'</p>';
  document.getElementById("cotacaoInput").addEventListener("input", function(e){
    ls("cotacao", parseFloat(e.target.value)||1);
    updateStayComputed();
    document.getElementById("heroCotacaoVal").textContent = "R$ " + getCotacao().toFixed(2).replace(".", ",");
  });
  renderStayTable();
  renderStayAddForm();
  document.getElementById("stayTipsWrap").innerHTML =
    tipRow("A hospedagem inicial costuma ser confiável","Um hostel ou Airbnb bem avaliado pode ser reservado com confiança antes de chegar — não precisa visitar antes.")+
    tipRow("Já a moradia definitiva, sim: visite antes","Só depois de estar na Irlanda e for fechar um contrato fixo, visite o imóvel pessoalmente antes de pagar qualquer valor.")+
    tipRow("Compare transporte, curso e trabalho","Pense no deslocamento diário antes de decidir onde morar em definitivo.")+
    tipRow("Guarde mensagens, recibos e acordos","Sempre por escrito, nunca só combinado verbalmente.");
}
var TIP_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11.2c.6.4 1 1.1 1 1.8h4c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z"/></svg>';
function tipRow(title, note){
  return '<div class="tip-row"><span class="tip-ico">'+TIP_ICON+'</span><div class="tip-text"><b>'+title+'</b><span>'+note+'</span></div></div>';
}
function renderStayTable(){
  var options = getStayOptions();
  var selectedId = ls("selectedStay");
  var cotacao = getCotacao();
  var rows = options.map(function(s){
    var total = s.noites*s.preco;
    return '<tr>'+
      '<td data-label="Usar" style="text-align:center;"><input type="radio" name="staySel" '+(selectedId===s.id?"checked":"")+' data-select="'+s.id+'"></td>'+
      '<td data-label="Acomodação"><input type="text" style="width:190px;" value="'+escapeHtml(s.nome)+'" data-id="'+s.id+'" data-f="nome"></td>'+
      '<td data-label="Noites"><input type="number" step="1" style="width:56px;" value="'+s.noites+'" data-id="'+s.id+'" data-f="noites"></td>'+
      '<td data-label="R$/noite"><input type="number" step="0.01" style="width:80px;" value="'+s.preco+'" data-id="'+s.id+'" data-f="preco"></td>'+
      '<td class="num tabular" data-label="Total" id="total-'+s.id+'">R$'+total.toFixed(2)+'</td>'+
      '<td class="num tabular" data-label="Equiv. €" id="eur-'+s.id+'">€'+(total/cotacao).toFixed(2)+'</td>'+
      '<td data-label=""><button class="btn-ghost btn" style="width:auto;padding:5px 10px;font-size:12px;" data-remove="'+s.id+'">Remover</button></td>'+
      '</tr>';
  }).join("");
  document.getElementById("stayTable").innerHTML =
    '<thead><tr><th>Usar</th><th>Acomodação</th><th class="num">Noites</th><th class="num">R$/noite</th><th class="num">Total</th><th class="num">Equiv. €</th><th></th></tr></thead><tbody>'+rows+'</tbody>';
  document.querySelectorAll('#stayTable [data-select]').forEach(function(r){
    r.addEventListener("change", function(){ ls("selectedStay", r.dataset.select); renderOverview(); });
  });
  document.querySelectorAll('#stayTable input[data-f]').forEach(function(inp){
    inp.addEventListener("input", function(){
      var opts = getStayOptions();
      var row = opts.find(function(o){ return o.id===inp.dataset.id; });
      if(!row) return;
      var f = inp.dataset.f;
      row[f] = (f==="nome") ? inp.value : (parseFloat(inp.value)||0);
      saveStayOptions(opts);
      if(f==="noites" || f==="preco"){
        var total = row.noites*row.preco;
        document.getElementById("total-"+row.id).textContent = "R$"+total.toFixed(2);
        document.getElementById("eur-"+row.id).textContent = "€"+(total/getCotacao()).toFixed(2);
        if(ls("selectedStay")===row.id) renderOverview();
      }
    });
  });
  document.querySelectorAll('#stayTable [data-remove]').forEach(function(btn){
    btn.addEventListener("click", function(){
      var opts = getStayOptions().filter(function(o){ return o.id!==btn.dataset.remove; });
      saveStayOptions(opts);
      if(ls("selectedStay")===btn.dataset.remove) ls("selectedStay", null);
      renderStayTable();
      renderOverview();
    });
  });
}
function updateStayComputed(){
  var cotacao = getCotacao();
  getStayOptions().forEach(function(s){
    var totalEl = document.getElementById("total-"+s.id);
    var eurEl = document.getElementById("eur-"+s.id);
    var total = s.noites*s.preco;
    if(totalEl) totalEl.textContent = "R$"+total.toFixed(2);
    if(eurEl) eurEl.textContent = "€"+(total/cotacao).toFixed(2);
  });
  renderOverview();
}
function renderStayAddForm(){
  document.getElementById("stayAddForm").innerHTML =
    '<div class="mini-form-grid">'+
    '<div><label>Nome</label><input id="newStayNome" type="text" placeholder="Ex.: Hostel Dublin 1"></div>'+
    '<div><label>Noites</label><input id="newStayNoites" type="number" value="10"></div>'+
    '<div><label>Preço por noite (R$)</label><input id="newStayPreco" type="number" step="0.01"></div>'+
    '<div><label>Observação</label><input id="newStayObs" type="text" placeholder="Quarto, café, localização..."></div>'+
    '</div>'+
    '<button class="btn btn-accent" style="width:auto;padding:10px 18px;" id="addStayBtn" type="button">Adicionar opção</button>';
  document.getElementById("addStayBtn").addEventListener("click", function(){
    var nome = document.getElementById("newStayNome").value.trim();
    if(!nome) return;
    var opts = getStayOptions();
    opts.push({id:"s"+Date.now(), nome:nome, noites:parseInt(document.getElementById("newStayNoites").value)||1, preco:parseFloat(document.getElementById("newStayPreco").value)||0, obs:document.getElementById("newStayObs").value.trim()});
    saveStayOptions(opts);
    renderStayTable();
    renderStayAddForm();
  });
}
function renderMoradia(){
  document.getElementById("moradiaWrap").innerHTML =
    '<div class="card"><h3>Faixas de aluguel (referência Dublin)</h3><div class="tablewrap"><table>'+
    '<thead><tr><th>Faixa mensal</th><th>Interpretação</th></tr></thead><tbody>'+
    '<tr><td class="num" data-label="Faixa mensal">€600–750</td><td data-label="Interpretação">Pode aparecer, mas exige mais flexibilidade.</td></tr>'+
    '<tr><td class="num" data-label="Faixa mensal">€800–1.100</td><td data-label="Interpretação">Faixa de planejamento mais realista.</td></tr>'+
    '<tr><td class="num" data-label="Faixa mensal">€1.100–1.200+</td><td data-label="Interpretação">Mais opções e margem de segurança.</td></tr>'+
    '</tbody></table></div></div>'+
    '<div class="card"><h3>Passo a passo seguro</h3>'+
    tipRow("Hospedagem inicial: pode reservar com confiança","Hostels e Airbnbs bem avaliados (7–14 dias) geralmente são seguros de reservar à distância, sem precisar visitar antes.")+
    tipRow("Moradia definitiva: só depois de chegar","Nunca feche um contrato fixo à distância — visite o quarto ou apartamento pessoalmente antes de pagar qualquer depósito.")+
    tipRow("Valide antes de transferir qualquer depósito","Confirme identidade do responsável e condições por escrito.")+
    tipRow("Guarde todos os registros","Mensagens, recibos e acordos — sempre por escrito.")+
    tipRow("Entenda \"digs\"/rent-a-room","Quando o dono mora no imóvel, as proteções legais podem ser diferentes — consulte o RTB.")+
    '</div>'+
    '<div class="callout warn"><strong>Golpes comuns:</strong> pedido de transferência internacional antes de qualquer visita, história de "dono está viajando" e preços bons demais para serem verdade.</div>';
}
var TRANSPORT_APPS = [
  {name:"TFI Live", desc:"App oficial nacional com horários em tempo real de ônibus, Luas e DART/trens."},
  {name:"TFI Go", desc:"Compra e uso de bilhetes direto pelo celular, sem precisar do cartão físico."},
  {name:"Leap Card App", desc:"Consulta de saldo e recarga do Leap Card pelo celular."},
  {name:"Google Maps", desc:"Boa cobertura de rotas de transporte público nas três cidades."},
  {name:"FreeNow", desc:"Aplicativo de táxi mais usado na Irlanda."},
  {name:"Irish Rail (app)", desc:"Horários e bilhetes de trens intercidades (Dublin ↔ Cork ↔ Galway)."}
];
function renderTransportApps(){
  document.getElementById("transportAppsWrap").innerHTML = TRANSPORT_APPS.map(function(a){
    return '<div class="card"><h3>'+a.name+'</h3><p style="margin:0;">'+a.desc+'</p></div>';
  }).join("");
}
var TRANSPORT_ROUTES = {
  dublin: {
    mapQuery:"Dublin, Ireland",
    network:"Ônibus (Dublin Bus), Luas (VLT) e DART/trens suburbanos — Dublin não tem metrô em operação.",
    card:"Leap Card — para estadia de meses, o cartão comum costuma valer mais que o Visitor Leap Card. Custa €10 (com algum crédito já incluso) e é vendido em lojas Spar, Centra, SuperValu e nas estações DART.",
    airport:[
      {name:"Dublin Bus 16, 41, 102, 33A (mais baratos)", detail:"Linhas locais que também atendem o aeroporto: <b>16</b> (rumo a Ballinteer), <b>41</b> (Abbey St. → Swords Manor), <b>102</b> (até a estação Sutton do DART) e <b>33A</b> (Balbriggan). Mais baratos que os expressos, mas podem ser mais lentos. Aceitam Leap Card — compre no ônibus ou use o <a href=\"https://www.leapcard.ie/\" target=\"_blank\" rel=\"noopener\">Leap Card</a>, mais barato e fácil."},
      {name:"Aircoach 700 (expresso)", detail:"Liga o aeroporto ao centro com conexões para o Luas — passa a cada ~30 min. Ônibus de piso baixo, acomoda 1 cadeira de rodas por vez (avise a empresa com 24h de antecedência). <b>Não aceita Leap Card</b> — bilhete pelo site <a href=\"https://www.aircoach.ie/\" target=\"_blank\" rel=\"noopener\">aircoach.ie</a> ou com o motorista."},
      {name:"Dublin Express 782 (expresso)", detail:"Melhor opção se o destino for a Heuston Station; passa a cada 15–20 min. Também atende Terenure e Charlotte Way. <b>Não aceita Leap Card</b> — bilhete pelo site <a href=\"https://www.dublinexpress.ie/dublin-city\" target=\"_blank\" rel=\"noopener\">dublinexpress.ie</a>."},
      {name:"Bus Éireann (regionais, direto do aeroporto)", detail:"Se o destino final não é o centro de Dublin, várias linhas saem direto do aeroporto: 100X/101 (Drogheda/Dundalk/Balbriggan), 133/2 (Wicklow/Arklow/Gorey/Wexford), 4 (Carlow/Waterford), 22/23 (Mullingar/Longford/Sligo/Ballina), 30/32 (Cavan/Monaghan/Donegal). Horários e bilhetes em <a href=\"https://www.buseireann.ie/\" target=\"_blank\" rel=\"noopener\">buseireann.ie</a>."},
      {name:"Outras operadoras privadas", detail:"<a href=\"https://airporthopper.ie/\" target=\"_blank\" rel=\"noopener\">Airport Hopper</a>: vans a cada hora para Maynooth/Tallaght via Leixlip, Liffey Valley, Lucan e Clondalkin. <a href=\"https://www.dublincoach.ie/all-timetables/dundrum-dublin-airport\" target=\"_blank\" rel=\"noopener\">Dublin Coach</a>: 36 viagens diárias entre o aeroporto, a parada de Luas Red Cow e Dundrum."},
      {name:"Táxi / FreeNow", detail:"Mais caro (normalmente €30–€40 até o centro), mas direto — vale a pena se chegar de madrugada ou com muita bagagem."},
      {name:"Acessibilidade (cadeira de rodas)", detail:"Aircoach e Dublin Bus têm veículos de piso baixo. Dublin Bus oferece assistência gratuita de viagem (seg-sex, 8h-18h, tel (01) 703 3204, e-mail customercomment@dublinbus.ie). Bus Éireann exige reserva prévia para embarque acessível."}
    ],
    fares:[
      {name:"Leap Card comum (recarregável)", detail:"A opção certa pra quem vai morar em Dublin — recarrega crédito conforme precisa. Custa €10 (com algum crédito já incluso). Compre em lojas Spar/Centra/SuperValu, nas máquinas de bilhete das estações, ou <a href=\"https://about.leapcard.ie/about/where-to-buy\" target=\"_blank\" rel=\"noopener\">peça online</a> — nesse caso chega pelo correio, então peça com antecedência."},
      {name:"Leap Visitor Card (só estadias curtas)", detail:"Viagens ilimitadas por período fixo em Dublin Bus, Go-Ahead, Luas e DART (Zona Curta): <b>24h €8,00 · 72h €18,00 · 7 dias €24,00</b>. <b>Não vale</b> nos ônibus Aircoach nem Dublin Express do aeroporto. Vendido no Aeroporto de Dublin (loja Wrights no T1, Spar no T2) e em pontos no centro como Trinity College, Estação Connolly e O'Connell Street — <a href=\"https://www.leapcard.ie/Home/index.html\" target=\"_blank\" rel=\"noopener\">ou compre pelo site</a> antes da viagem (não é digital, chega pelo correio)."},
      {name:"Tarifa Leap 90 minutos (Zona 1)", detail:"€2,00 adulto · €1,00 Young Adult/Student · €0,65 criança — na janela de 90 min você troca de ônibus/Luas/DART sem pagar de novo. É a tarifa que vale pra quase todo mundo morando e estudando dentro de Dublin."},
      {name:"Ônibus suburbano / Nitelink / Xpresso (Zona 1)", detail:"€2,40 adulto · €1,20 Young Adult/Student."},
      {name:"Viajando para fora da Zona 1", detail:"Só importa se você sair da área central de Dublin para outra zona (ex: Naas, Maynooth, Wicklow). Trem: Zona 1↔2 €3,90 · ↔3 €6,00 · ↔4 €7,50 (metade do valor para criança/jovem). Ônibus: Zona 1↔2 €3,70 · ↔3 €5,30 · ↔4 €6,30 (metade do valor para criança/jovem). A grande maioria dos intercambistas mora e estuda dentro da Zona 1, sem precisar dessas tarifas."},
      {name:"Teto diário e semanal", detail:"Pagando com Leap em Dublin Bus, Luas e DART/Commuter, o gasto trava em €3,00/dia e €12,00/semana — depois disso as viagens do período saem de graça."},
      {name:"Leap Student", detail:"50% de desconto — precisa da carta da escola confirmando matrícula em curso de ao menos 25 semanas para liberar o cartão."}
    ],
    lines:[
      {name:"Luas Linha Vermelha", detail:"32 estações: Saggart/Tallaght ↔ The Point, cruzando o centro por Heuston, Four Courts, Jervis, Abbey Street e Connolly."},
      {name:"Luas Linha Verde", detail:"Broombridge (norte) ↔ Bride's Glen (sul), passando por Parnell, O'Connell, St. Stephen's Green, Ranelagh, Dundrum e Sandyford."},
      {name:"DART", detail:"Malahide/Howth ↔ Greystones, ao longo da costa — trens a cada ~10 min em horário de pico."},
      {name:"Dublin Bus", detail:"Rede extensa cobrindo praticamente toda a cidade e subúrbios — o Google Maps já mostra bem as rotas específicas."}
    ],
    luasStops:{
      red:"Saggart, Tallaght, Hospital, Cookstown, Fortunestown, Citywest Campus, Cheeverstown, Fettercairn, Belgard, Kingswood, Red Cow, Kylemore, Bluebell, Blackhorse, Drimnagh, Goldenbridge, Suir Road, Rialto, Fatima, James's, Heuston, Museum, Smithfield, Four Courts, Jervis, Abbey Street, Busáras, Connolly, George's Dock, Mayor Square–NCI, Spencer Dock, The Point.",
      green:"Broombridge, Cabra, Phibsborough, Grangegorman, Broadstone - DIT, Dominick, Parnell, Marlborough, Trinity, O'Connell–Upper, O'Connell–GPO, Westmoreland, Dawson, St. Stephen's Green, Harcourt, Charlemont, Ranelagh, Beechwood, Cowper, Milltown, Windy Arbour, Dundrum, Balally, Kilmacud, Stillorgan, Sandyford, Central Park, Glencairn, The Gallops, Leopardstown Valley, Ballyogan Wood, Carrickmines, Laughanstown, Cherrywood, Brides Glen."
    },
    officialLinks:[
      {name:"Leap Card", url:"https://www.leapcard.ie/"},
      {name:"Dublin Bus", url:"https://www.dublinbus.ie/"},
      {name:"Luas", url:"https://www.luas.ie/"},
      {name:"Irish Rail (DART/intercidades)", url:"https://www.irishrail.ie/"},
      {name:"Aircoach", url:"https://www.aircoach.ie/"},
      {name:"Dublin Express", url:"https://www.dublinexpress.ie/dublin-city"},
      {name:"Bus Éireann", url:"https://www.buseireann.ie/"},
      {name:"Dublin Public Transport (guia independente)", url:"https://www.dublinpublictransport.ie/"},
      {name:"Mapa de trens (PDF)", url:"https://www.dublinpublictransport.ie/dublin-train-map"}
    ]
  },
  cork: {
    mapQuery:"Cork, Ireland",
    network:"Rede de ônibus urbanos (Bus Éireann) — Cork não tem Luas nem DART.",
    card:"Leap Card também funciona nos ônibus de Cork.",
    lines:[
      {name:"Kent Station", detail:"Estação central de trem — conecta Cork a Dublin Heuston (Irish Rail, intercidade)."},
      {name:"Rota 205 / 219", detail:"MTU ↔ Kent Station / Mahon Point — liga universidade, centro e shopping."},
      {name:"Rota 208", detail:"Ashmount ↔ Curraheen."},
      {name:"Rota 202 / 212", detail:"Hollyhill/Kent Station ↔ Mahon Point."}
    ]
  },
  galway: {
    mapQuery:"Galway, Ireland",
    network:"Ônibus urbanos operados por Bus Éireann e City Direct — Galway também não tem Luas nem DART.",
    card:"Leap Card funciona nos ônibus de Galway; a maioria das rotas parte do Eyre Square (centro).",
    lines:[
      {name:"Ceannt Station", detail:"Estação central de trem — conecta Galway a Dublin Heuston (Irish Rail, intercidade)."},
      {name:"Rota 401", detail:"Salthill via centro — liga a orla de Salthill ao Eyre Square."},
      {name:"Rota 404", detail:"Oranmore ↔ Westside."},
      {name:"City Direct 410–412", detail:"Rotas complementares operadas por empresa privada."}
    ]
  }
};
var transportCity = ls("transportCityView") || "dublin";
function renderTransportCityTabs(){
  document.getElementById("transportCityTabs").innerHTML = SCHOOL_CITIES.map(function(c){
    return '<button class="subtab'+(transportCity===c.id?' active':'')+'" data-city="'+c.id+'">'+c.l+'</button>';
  }).join("");
  document.querySelectorAll("#transportCityTabs .subtab").forEach(function(b){
    b.addEventListener("click", function(){ transportCity = b.dataset.city; ls("transportCityView", transportCity); renderTransportCityTabs(); renderTransportRoutes(); });
  });
}
function renderTransportRoutes(){
  var t = TRANSPORT_ROUTES[transportCity];
  var mapLink = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(t.mapQuery);
  var mapEmbed = "https://maps.google.com/maps?q=" + encodeURIComponent(t.mapQuery) + "&output=embed";
  var html = '<div class="grid cols-2" style="margin-bottom:16px;">'+
    '<div class="card"><h3>Rede</h3><p style="margin:0;">'+t.network+'</p></div>'+
    '<div class="card"><h3>Bilhete</h3><p style="margin:0;">'+t.card+'</p></div>'+
    '</div>';
  if(t.airport){
    html += '<h4 style="font-size:14.5px;font-weight:700;margin:16px 0 8px;color:var(--text);">Chegando do aeroporto</h4>'+
      '<div class="card">'+t.airport.map(function(l){ return tipRow(l.name, l.detail); }).join("")+'</div>';
  }
  if(t.fares){
    html += '<h4 style="font-size:14.5px;font-weight:700;margin:16px 0 8px;color:var(--text);">Tarifas com Leap Card</h4>'+
      '<div class="card">'+t.fares.map(function(l){ return tipRow(l.name, l.detail); }).join("")+'</div>';
  }
  html += '<h4 style="font-size:14.5px;font-weight:700;margin:16px 0 8px;color:var(--text);">Linhas</h4>'+
    '<div class="card">'+t.lines.map(function(l){ return tipRow(l.name, l.detail); }).join("")+'</div>';
  if(t.luasStops){
    html += '<div class="card"><h3>Estações do Luas, em ordem</h3>'+
      '<p style="margin:0 0 10px;font-size:13px;"><strong>Linha Vermelha:</strong> '+t.luasStops.red+'</p>'+
      '<p style="margin:0;font-size:13px;"><strong>Linha Verde:</strong> '+t.luasStops.green+'</p>'+
      '</div>';
  }
  if(t.officialLinks){
    html += '<div class="card"><h3>Fontes oficiais</h3><div style="display:flex;flex-wrap:wrap;gap:8px;">'+
      t.officialLinks.map(function(l){ return '<a href="'+l.url+'" target="_blank" rel="noopener" class="btn-ghost btn" style="width:auto;padding:8px 14px;font-size:12.8px;">'+l.name+' ↗</a>'; }).join("")+
      '</div></div>';
  }
  html += '<div class="card">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px;">'+
    '<h3 style="margin:0;">Mapa de '+t.mapQuery+'</h3>'+
    '<a href="'+mapLink+'" target="_blank" rel="noopener" class="btn-ghost btn" style="width:auto;padding:8px 14px;font-size:12.8px;">Abrir no Google Maps ↗</a>'+
    '</div>'+
    '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;background:var(--surface-2);">'+
    '<iframe src="'+mapEmbed+'" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'+
    '</div>'+
    '</div>'+
    '<p class="source-note">Rotas, tarifas e apps pesquisados em set/2026 — preços de ônibus expresso variam entre fontes, confirme sempre no site oficial antes de comprar.</p>';
  document.getElementById("transportRoutesWrap").innerHTML = html;
}
var MARKET_SEED = [
  {cat:"Hortifruti", item:"Kiwi", pkg:"Pacote com 6", qty:1, price:1.49},
  {cat:"Hortifruti", item:"Clementina / mexerica", pkg:"Pacote", qty:1, price:1.95},
  {cat:"Hortifruti", item:"Cogumelos", pkg:"Bandeja", qty:1, price:1.19},
  {cat:"Hortifruti", item:"Espinafre", pkg:"Pacote de folhas", qty:1, price:1.39},
  {cat:"Hortifruti", item:"Alface iceberg", pkg:"260 g", qty:1, price:1.39},
  {cat:"Hortifruti", item:"Coleslaw / salada de repolho", pkg:"500 g", qty:1, price:1.15},
  {cat:"Hortifruti", item:"Brócolis orgânico", pkg:"Unidade/pacote", qty:1, price:1.99},
  {cat:"Hortifruti", item:"Alho", pkg:"Rede 200 g", qty:1, price:1.09},
  {cat:"Hortifruti", item:"Cebola roxa", pkg:"Pacote", qty:1, price:0.99},
  {cat:"Hortifruti", item:"Berinjela", pkg:"Unidade", qty:1, price:0.85},
  {cat:"Hortifruti", item:"Cenoura orgânica", pkg:"Pacote", qty:1, price:1.29},
  {cat:"Hortifruti", item:"Tomate plum", pkg:"Pacote", qty:1, price:1.99},
  {cat:"Hortifruti", item:"Maracujá (passion fruit)", pkg:"Pacote", qty:1, price:1.29},
  {cat:"Hortifruti", item:"Cebola roxa (Lidl)", pkg:"Pacote", qty:1, price:0.99},
  {cat:"Hortifruti", item:"Pera avulsa (loose pears)", pkg:"Unidade", qty:1, price:0.49},
  {cat:"Carnes", item:"Postas de salmão (4 un.)", pkg:"Pacote", qty:1, price:6.99},
  {cat:"Carnes", item:"Carne moída magra irlandesa", pkg:"Family pack", qty:1, price:6.19},
  {cat:"Mercearia", item:"Snack salgado KVIKI", pkg:"Pacote", qty:1, price:1.29},
  {cat:"Mercearia", item:"Matcha em pó (NUA Naturals)", pkg:"Pote", qty:1, price:7.99},
  {cat:"Carnes", item:"Salsicha / Frankfurters", pkg:"10 unidades", qty:1, price:1.99},
  {cat:"Carnes", item:"Carne moída", pkg:"Family pack", qty:3, price:5.99},
  {cat:"Carnes", item:"Carne bovina em cubos", pkg:"Diced beef", qty:2, price:7.29},
  {cat:"Carnes", item:"Filé suíno", pkg:"580–620 g", qty:1, price:3.95},
  {cat:"Carnes", item:"Peito de frango", pkg:"Family pack ~1 kg", qty:2, price:9.99},
  {cat:"Carnes", item:"Linguiça suína jumbo", pkg:"Pacote", qty:1, price:2.49},
  {cat:"Ovos e laticínios", item:"Ovos irlandeses", pkg:"18 ovos", qty:1, price:4.25},
  {cat:"Ovos e laticínios", item:"Queijo cheddar branco ralado", pkg:"475 g", qty:2, price:2.85},
  {cat:"Ovos e laticínios", item:"Creme de leite fresco", pkg:"500 ml", qty:2, price:2.79},
  {cat:"Padaria", item:"Pão brioche para hambúrguer", pkg:"4 unidades", qty:3, price:1.99},
  {cat:"Padaria", item:"Pão para hot dog", pkg:"4 unidades", qty:2, price:1.05},
  {cat:"Padaria", item:"Pão de forma branco", pkg:"Pacote", qty:1, price:0.85},
  {cat:"Mercearia", item:"Arroz basmati", pkg:"1 kg", qty:2, price:1.59},
  {cat:"Mercearia", item:"Molho de tomate", pkg:"440 g", qty:3, price:0.65},
  {cat:"Mercearia", item:"Biscoito salgado / crackers", pkg:"200 g", qty:1, price:1.49},
  {cat:"Mercearia", item:"Atum em pedaços", pkg:"Lata", qty:3, price:0.85},
  {cat:"Mercearia", item:"Feijão vermelho (kidney beans)", pkg:"Lata", qty:2, price:0.65},
  {cat:"Mercearia", item:"Picles / pepino em conserva", pkg:"Pote 720 g", qty:1, price:1.69},
  {cat:"Mercearia", item:"Azeitona verde sem caroço", pkg:"Pote", qty:1, price:0.79},
  {cat:"Mercearia", item:"Milho doce", pkg:"Lata", qty:4, price:1.09},
  {cat:"Mercearia", item:"Ketchup Heinz", pkg:"Frasco", qty:1, price:3.49},
  {cat:"Mercearia", item:"Maionese light", pkg:"Frasco", qty:1, price:1.19},
  {cat:"Bebidas", item:"Coca-Cola Zero", pkg:"Garrafas", qty:2, price:2.50},
  {cat:"Congelados", item:"Pizza pepperoni", pkg:"Unidade", qty:1, price:2.79},
  {cat:"Congelados", item:"Sorvete / ice cream sticks", pkg:"Caixa com 6", qty:1, price:3.59},
  {cat:"Limpeza", item:"Aromatizador para roupas / scent booster", pkg:"195 g", qty:1, price:3.99},
  {cat:"Limpeza", item:"Detergente de louça", pkg:"1 L", qty:2, price:0.85},
  {cat:"Limpeza", item:"Lenços antibacterianos multiuso", pkg:"Pacote", qty:2, price:0.75},
  {cat:"Limpeza", item:"Lenços para piso", pkg:"Pacote", qty:1, price:0.79},
  {cat:"Higiene", item:"Papel higiênico", pkg:"24 rolos", qty:1, price:7.99},
  {cat:"Higiene", item:"Sabonetes em barra", pkg:"Pacote com 4", qty:1, price:1.99},
  {cat:"Higiene", item:"Enxaguante bucal", pkg:"Frasco", qty:1, price:1.29},
  {cat:"Casa", item:"Filme plástico (cling film)", pkg:"Rolo", qty:1, price:1.39},
  {cat:"Casa", item:"Papel manteiga", pkg:"20 m x 38 cm", qty:1, price:1.49}
];
function getMarketCart(){
  var saved = ls("marketCart");
  if(saved && saved.length) return saved;
  var seeded = MARKET_SEED.map(function(it,i){ return Object.assign({id:"m"+i}, it); });
  ls("marketCart", seeded);
  return seeded;
}
function saveMarketCart(c){ ls("marketCart", c); }
var marketFilter = {q:"", cat:""};
var SUPERMARKETS = [
  {name:"Lidl", url:"https://www.lidl.ie", desc:"Rede alemã de desconto — geralmente a opção mais barata para o básico. Boa parte desta lista de preços vem de lá."},
  {name:"Aldi", url:"https://www.aldi.ie", desc:"Concorrente direto da Lidl, também alemã e focada em preço baixo — vale comparar as duas perto de casa."},
  {name:"Tesco", url:"https://www.tesco.ie", desc:"A maior rede do país, britânica — bom equilíbrio entre preço e variedade, presente em praticamente toda cidade."},
  {name:"SuperValu", url:"https://supervalu.ie", desc:"Rede irlandesa (Musgrave) com forte foco em produtos locais/frescos — um pouco mais cara, mas boa qualidade."},
  {name:"Dunnes Stores", url:"https://www.dunnesstores.com", desc:"Rede irlandesa grande, também vende roupas — preços competem diretamente com Tesco."},
  {name:"Centra", url:"https://centra.ie", desc:"Loja de conveniência espalhada por toda parte, abre até mais tarde — prática, mas mais cara que os grandes mercados."},
  {name:"Spar", url:"https://www.spar.ie", desc:"Outra rede de conveniência bem presente nas cidades — boa para reposições rápidas, não para a compra do mês."}
];
function renderSupermarkets(){
  document.getElementById("supermarketsWrap").innerHTML = SUPERMARKETS.map(function(s){
    var fav = faviconUrl(s.url);
    return '<a class="linkcard" href="'+s.url+'" target="_blank" rel="noopener"><div class="linkcard-icon">'+LINK_ICONS.home+(fav?'<img class="linkcard-favicon" src="'+fav+'" alt="" loading="lazy" onerror="this.remove()">':'')+'</div><h4>'+s.name+'</h4><p>'+s.desc+'</p><span class="linkcard-arrow">↗</span></a>';
  }).join("");
}
function renderMarket(){
  renderSupermarkets();
  renderMarketFilters();
  renderMarketTable();
  renderMarketAddForm();
}
function renderMarketFilters(){
  var cart = getMarketCart();
  var cats = Array.from(new Set(cart.map(function(i){ return i.cat; }))).sort();
  document.getElementById("marketFiltersWrap").innerHTML =
    '<div class="mini-form-grid" style="margin-bottom:0;">'+
    '<div><label>Buscar item</label><input type="text" id="marketSearch" placeholder="Ex.: frango, arroz, limpeza..."></div>'+
    '<div><label>Categoria</label><select id="marketCatFilter"><option value="">Todas as categorias</option>'+cats.map(function(c){ return '<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+'</option>'; }).join("")+'</select></div>'+
    '</div>';
  document.getElementById("marketSearch").addEventListener("input", function(e){ marketFilter.q = e.target.value.toLowerCase(); applyMarketFilter(); });
  document.getElementById("marketCatFilter").addEventListener("change", function(e){ marketFilter.cat = e.target.value; applyMarketFilter(); });
}
function applyMarketFilter(){
  document.querySelectorAll("#marketTable tbody tr").forEach(function(tr){
    var okQ = !marketFilter.q || tr.dataset.item.indexOf(marketFilter.q) !== -1;
    var okCat = !marketFilter.cat || tr.dataset.cat === marketFilter.cat;
    tr.style.display = (okQ && okCat) ? "" : "none";
  });
}
function renderMarketTable(){
  var cart = getMarketCart();
  var rows = cart.map(function(it){
    return '<tr data-item="'+escapeHtml(it.item.toLowerCase())+'" data-cat="'+escapeHtml(it.cat)+'">'+
      '<td data-label="Categoria"><input type="text" style="width:120px;" value="'+escapeHtml(it.cat)+'" data-id="'+it.id+'" data-f="cat"></td>'+
      '<td data-label="Item"><input type="text" style="width:190px;" value="'+escapeHtml(it.item)+'" data-id="'+it.id+'" data-f="item"></td>'+
      '<td data-label="Embalagem"><input type="text" style="width:140px;" value="'+escapeHtml(it.pkg)+'" data-id="'+it.id+'" data-f="pkg"></td>'+
      '<td data-label="Qtd."><input type="number" step="1" style="width:55px;" value="'+it.qty+'" data-id="'+it.id+'" data-f="qty"></td>'+
      '<td data-label="Preço unit. (€)"><input type="number" step="0.01" style="width:75px;" value="'+it.price+'" data-id="'+it.id+'" data-f="price"></td>'+
      '<td class="num tabular" data-label="Subtotal" id="sub-'+it.id+'">€'+(it.qty*it.price).toFixed(2)+'</td>'+
      '<td data-label=""><button class="btn-ghost btn" style="width:auto;padding:5px 10px;font-size:12px;" data-remove="'+it.id+'">Remover</button></td>'+
      '</tr>';
  }).join("");
  document.getElementById("marketTable").innerHTML =
    '<thead><tr><th>Categoria</th><th>Item</th><th>Embalagem</th><th class="num">Qtd.</th><th class="num">Preço unit. (€)</th><th class="num">Subtotal</th><th></th></tr></thead><tbody>'+rows+'</tbody>';
  document.querySelectorAll("#marketTable input").forEach(function(inp){
    inp.addEventListener("input", function(){
      var cart2 = getMarketCart();
      var row = cart2.find(function(r){ return r.id===inp.dataset.id; });
      if(!row) return;
      var f = inp.dataset.f;
      row[f] = (f==="qty") ? (parseInt(inp.value)||0) : (f==="price") ? (parseFloat(inp.value)||0) : inp.value;
      saveMarketCart(cart2);
      var tr = inp.closest("tr");
      if(f==="item") tr.dataset.item = inp.value.toLowerCase();
      if(f==="cat") tr.dataset.cat = inp.value;
      if(f==="qty" || f==="price"){
        document.getElementById("sub-"+row.id).textContent = "€"+(row.qty*row.price).toFixed(2);
        updateMarketTotal();
      }
    });
  });
  document.querySelectorAll("#marketTable [data-remove]").forEach(function(btn){
    btn.addEventListener("click", function(){
      saveMarketCart(getMarketCart().filter(function(r){ return r.id!==btn.dataset.remove; }));
      renderMarket();
    });
  });
  updateMarketTotal();
}
function updateMarketTotal(){
  var total = getMarketCart().reduce(function(s,it){ return s+it.qty*it.price; }, 0);
  var el = document.getElementById("marketTotal");
  if(el) el.textContent = "€"+total.toFixed(2);
}
function renderMarketAddForm(){
  document.getElementById("marketAddForm").innerHTML =
    '<div class="mini-form-grid">'+
    '<div><label>Categoria</label><input id="newCat" type="text" placeholder="Ex.: Bebidas"></div>'+
    '<div><label>Item</label><input id="newItem" type="text"></div>'+
    '<div><label>Embalagem</label><input id="newPkg" type="text" placeholder="Ex.: 1 kg"></div>'+
    '<div><label>Quantidade</label><input id="newQty" type="number" value="1"></div>'+
    '<div><label>Preço unitário (€)</label><input id="newPrice" type="number" step="0.01"></div>'+
    '</div>'+
    '<button class="btn btn-accent" style="width:auto;padding:10px 18px;" id="addItemBtn" type="button">Adicionar item</button>';
  document.getElementById("addItemBtn").addEventListener("click", function(){
    var item = document.getElementById("newItem").value.trim();
    if(!item) return;
    var cart = getMarketCart();
    cart.push({id:"m"+Date.now(), cat:document.getElementById("newCat").value.trim()||"Outros", item:item, pkg:document.getElementById("newPkg").value.trim(), qty:parseInt(document.getElementById("newQty").value)||1, price:parseFloat(document.getElementById("newPrice").value)||0});
    saveMarketCart(cart);
    renderMarket();
  });
}

/* ---------- dinheiro para a viagem ---------- */
var MONEY_TIPS = [
  {title:"Quanto levar em espécie", note:"Leve o equivalente a ~€200–300 em notas pequenas (€5, €10, €20) para os primeiros dias — evite notas de €100/€200, muitos lugares pequenos não aceitam. O resto pode ficar no cartão e ser sacado em caixas eletrônicos, que costumam ter câmbio melhor que casas de câmbio de aeroporto."},
  {title:"Declaração alfandegária", note:"Se entrar ou sair da UE por um aeroporto irlandês carregando €10.000 ou mais em espécie, é obrigatório declarar à alfândega. Abaixo desse valor não há restrição nem necessidade de declarar."},
  {title:"Avise seu banco brasileiro", note:"Notifique seu banco e a bandeira do cartão sobre a viagem antes de embarcar, para evitar bloqueio por 'compra suspeita' assim que usar o cartão na Irlanda."},
  {title:"Conta digital antes de chegar", note:"Abrir uma conta Revolut ou N26 ainda no Brasil (não exige PPSN) facilita muito — o salário já pode cair nela assim que você conseguir emprego, sem precisar esperar abrir conta em banco tradicional."},
  {title:"Comprovação financeira do visto ≠ dinheiro do dia a dia", note:"O valor exigido para comprovar recursos no visto/IRP (ver aba Imigração) é sobre saldo disponível em conta, não sobre quanto você vai gastar por mês — são coisas diferentes, não confunda um com o outro no seu planejamento."}
];
function renderMoneyTips(){
  document.getElementById("moneyTipsWrap").innerHTML = MONEY_TIPS.map(function(t){ return tipRow(t.title, t.note); }).join("");
}

/* ---------- orçamento ---------- */
var BUDGET_DEFAULTS = {wage:14.15, hoursWeek:20, weeksMonth:4.33, rent:900, phone:20, internet:0, transport:80, groceries:200, englishCourse:0, insurance:0, gym:0, leisure:0, other:0};
var EXPENSE_KEYS = ["rent","phone","internet","transport","groceries","englishCourse","insurance","gym","leisure","other"];
function getBudget(){ return Object.assign({}, BUDGET_DEFAULTS, ls("budget")||{}); }
function sumExpenses(b){ return EXPENSE_KEYS.reduce(function(sum,k){ return sum+(b[k]||0); }, 0); }
function setBudgetField(key, val){ var b = getBudget(); b[key] = val; ls("budget", b); updateBudgetSummary(); renderTaxLine(); renderOverview(); }
/* Regras fiscais irlandesas usadas na estimativa de PAYE + USC + PRSI.
   Estrutura pensada pra ser facil de atualizar ano a ano sem mexer na
   formula de calculo — so trocar os valores/fontes/datas aqui. */
var TAX_CONFIG_2026 = {
  year: 2026,
  paye: {
    cutoffYear: 44000, creditYear: 4000, rateLow: 0.20, rateHigh: 0.40,
    source: "Revenue — Calculating your Income Tax", sourceUrl: "https://www.revenue.ie/en/jobs-and-pensions/calculating-your-income-tax/index.aspx",
    verifiedAt: "2026-09-08"
  },
  usc: {
    exemptYear: 13000, band1: 12012, band2: 28700, band3: 70044,
    rate1: 0.005, rate2: 0.02, rate3: 0.03, rate4: 0.08,
    source: "Revenue — USC", sourceUrl: "https://www.revenue.ie/en/jobs-and-pensions/usc/index.aspx",
    verifiedAt: "2026-09-08"
  },
  prsi: {
    exemptWeek: 352, rateBefore: 0.042, rateAfter: 0.0435, rateChangeDate: "2026-10-01",
    source: "gov.ie — PRSI Class A rates", sourceUrl: "https://www.gov.ie/en/department-of-social-protection/publications/prsi-class-a-rates/",
    verifiedAt: "2026-09-08"
  }
};
/* Estimativa de PAYE + USC + PRSI (pessoa solteira, PAYE, sem filhos/outra
   renda, creditos fiscais padrao) — aproximacao para planejamento, nao
   substitui o Revenue. Baseado sempre em 52 semanas/ano (padrao fiscal),
   independente do campo "Semanas por mes". */
function calcIrishTax(wage, hoursWeek){
  var cfg = TAX_CONFIG_2026;
  var grossWeek = wage*hoursWeek;
  var grossYear = grossWeek*52;
  var payeBeforeCredit = grossYear<=cfg.paye.cutoffYear ? grossYear*cfg.paye.rateLow : cfg.paye.cutoffYear*cfg.paye.rateLow + (grossYear-cfg.paye.cutoffYear)*cfg.paye.rateHigh;
  var payeYear = Math.max(0, payeBeforeCredit - cfg.paye.creditYear);
  var uscYear = 0;
  if(grossYear > cfg.usc.exemptYear){
    var b1 = Math.min(grossYear, cfg.usc.band1)*cfg.usc.rate1;
    var b2 = Math.max(0, Math.min(grossYear,cfg.usc.band2)-cfg.usc.band1)*cfg.usc.rate2;
    var b3 = Math.max(0, Math.min(grossYear,cfg.usc.band3)-cfg.usc.band2)*cfg.usc.rate3;
    var b4 = Math.max(0, grossYear-cfg.usc.band3)*cfg.usc.rate4;
    uscYear = b1+b2+b3+b4;
  }
  var prsiRate = new Date() >= new Date(cfg.prsi.rateChangeDate+"T00:00:00") ? cfg.prsi.rateAfter : cfg.prsi.rateBefore;
  var prsiYear = (grossWeek > cfg.prsi.exemptWeek ? grossWeek*prsiRate : 0)*52;
  var totalYear = payeYear+uscYear+prsiYear;
  return {
    grossWeek:grossWeek, grossYear:grossYear,
    payeMonth:payeYear/12, uscMonth:uscYear/12, prsiMonth:prsiYear/12,
    totalMonth:totalYear/12
  };
}
function renderTaxLine(){
  var b = getBudget();
  var t = calcIrishTax(b.wage, b.hoursWeek);
  document.getElementById("taxEstValue").textContent = "€"+t.totalMonth.toFixed(2);
  document.getElementById("taxDetailWrap").innerHTML =
    '<div class="summary-row"><span class="lbl">PAYE (imposto de renda)</span><span class="val">€'+t.payeMonth.toFixed(2)+'</span></div>'+
    '<div class="summary-row"><span class="lbl">USC</span><span class="val">€'+t.uscMonth.toFixed(2)+'</span></div>'+
    '<div class="summary-row"><span class="lbl">PRSI</span><span class="val">€'+t.prsiMonth.toFixed(2)+'</span></div>'+
    '<div class="summary-row big"><span class="lbl">Total de descontos</span><span class="val">€'+t.totalMonth.toFixed(2)+'</span></div>'+
    '<button class="btn-ghost btn" id="taxInfoToggle" type="button" style="width:auto;padding:5px 10px;font-size:12.5px;margin-top:8px;gap:6px;"><svg viewBox="0 0 16 16" fill="none" width="13" height="13"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 7.2v4.1M8 5.1v.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Como calcula?</button>'+
    '<div id="taxInfoWrap" hidden style="margin-top:8px;font-size:12.6px;color:var(--muted);">'+
    '<p style="margin:0 0 8px;"><strong>PAYE:</strong> 20% até €44.000/ano, 40% acima — menos €4.000/ano de créditos fiscais padrão (com 20h/semana no mínimo, o crédito costuma zerar o PAYE).</p>'+
    '<p style="margin:0 0 8px;"><strong>USC:</strong> isento até €13.000/ano; acima disso, 0,5% até €12.012, 2% até €28.700, 3% até €70.044, 8% acima.</p>'+
    '<p style="margin:0;"><strong>PRSI (Classe A):</strong> isento até €352/semana; acima disso, 4,20% (até 30/09/2026) ou 4,35% (a partir de 01/10/2026).</p>'+
    '</div>'+
    '<p class="source-note" style="margin-top:10px;">Referência fiscal: <strong>'+TAX_CONFIG_2026.year+'</strong> (pessoa solteira, sem filhos/outra renda) — estimativa para planejamento, não substitui o Revenue. <a href="'+TAX_CONFIG_2026.paye.sourceUrl+'" target="_blank" rel="noopener">Tabelas</a> · <a href="'+TAX_CONFIG_2026.usc.sourceUrl+'" target="_blank" rel="noopener">USC</a> · <a href="'+TAX_CONFIG_2026.prsi.sourceUrl+'" target="_blank" rel="noopener">PRSI</a> · <a href="https://www.ros.ie/myaccount-web/sign_in.html" target="_blank" rel="noopener">Revenue myAccount ↗</a></p>'+
    sourceVerifiedNote(oldestVerifiedAt([TAX_CONFIG_2026.paye,TAX_CONFIG_2026.usc,TAX_CONFIG_2026.prsi]));
  document.getElementById("taxInfoToggle").addEventListener("click", function(){
    var wrap = document.getElementById("taxInfoWrap");
    wrap.hidden = !wrap.hidden;
  });
}
function renderBudget(){
  var b = getBudget();
  var presetHtml = '<div class="subtabs" id="hoursPreset" style="margin-bottom:12px;">'+
    '<button class="subtab'+(b.hoursWeek===20?' active':'')+'" data-h="20">20h/semana (limite do Stamp 2)</button>'+
    '<button class="subtab'+(b.hoursWeek===40?' active':'')+'" data-h="40">40h/semana (exemplo tempo integral)</button>'+
    '</div>'+
    '<p class="source-note" style="margin:-6px 0 12px;">Na Irlanda, tempo integral não é fixo em 44h como no Brasil — contratos de 39–40h são comuns. Ajuste "Horas por semana" abaixo para o seu caso.</p>';
  var incomeFields = [{k:"wage",l:"Salário por hora (€)",step:0.01},{k:"hoursWeek",l:"Horas por semana",step:1},{k:"weeksMonth",l:"Semanas por mês",step:0.01}];
  document.getElementById("budgetIncomeFields").innerHTML = presetHtml + incomeFields.map(function(f){ return '<div class="numfield"><label>'+f.l+'</label><input type="number" step="'+f.step+'" data-k="'+f.k+'" value="'+b[f.k]+'"></div>'; }).join("")+
    '<div class="numfield">'+
    '<label>Impostos/descontos (estimado)</label>'+
    '<span style="display:flex;align-items:center;gap:10px;">'+
    '<span class="tabular" id="taxEstValue">€0.00</span>'+
    '<button class="btn-ghost btn" id="taxEstToggle" type="button" style="width:auto;padding:6px 12px;font-size:15px;line-height:1;">▾</button>'+
    '</span>'+
    '</div>'+
    '<div id="taxDetailWrap" style="display:none;padding-top:10px;"></div>';
  var expenseFields = [{k:"rent",l:"Aluguel / quarto"},{k:"phone",l:"Celular / contas extras"},{k:"internet",l:"Internet (se separado)"},{k:"transport",l:"Transporte"},{k:"groceries",l:"Mercado"},{k:"englishCourse",l:"Escola de inglês"},{k:"insurance",l:"Seguro-saúde"},{k:"gym",l:"Academia"},{k:"leisure",l:"Lazer / saídas"},{k:"other",l:"Outros gastos"}];
  document.getElementById("budgetExpenseFields").innerHTML = expenseFields.map(function(f){ return '<div class="numfield"><label>'+f.l+'</label><input type="number" step="1" data-k="'+f.k+'" value="'+b[f.k]+'"></div>'; }).join("");
  document.querySelectorAll("#budgetIncomeFields input, #budgetExpenseFields input").forEach(function(inp){ inp.addEventListener("input", function(){ setBudgetField(inp.dataset.k, parseFloat(inp.value)||0); }); });
  document.querySelectorAll("#hoursPreset .subtab").forEach(function(btn){
    btn.addEventListener("click", function(){ setBudgetField("hoursWeek", parseFloat(btn.dataset.h)); renderBudget(); });
  });
  document.getElementById("taxEstToggle").addEventListener("click", function(){
    var detail = document.getElementById("taxDetailWrap");
    var opening = detail.style.display === "none";
    detail.style.display = opening ? "block" : "none";
    document.getElementById("taxEstToggle").style.transform = opening ? "rotate(180deg)" : "none";
  });
  renderTaxLine();
  updateBudgetSummary();
}
function updateBudgetSummary(){
  var b = getBudget();
  var t = calcIrishTax(b.wage, b.hoursWeek);
  var grossMonth = b.wage*b.hoursWeek*b.weeksMonth;
  var netMonth = grossMonth - t.totalMonth;
  var totalExpenses = sumExpenses(b);
  var freeBalance = netMonth-totalExpenses, pctCommitted = netMonth>0 ? (totalExpenses/netMonth*100):0, yearlyReserve = freeBalance*12;
  function row(lbl,val,cls){ return '<div class="summary-row '+(cls||"")+'"><span class="lbl">'+lbl+'</span><span class="val">'+val+'</span></div>'; }
  document.getElementById("budgetSummary").innerHTML =
    row("Salário bruto semanal","€"+t.grossWeek.toFixed(2))+row("Salário bruto mensal","€"+grossMonth.toFixed(2))+row("Salário líquido estimado","€"+netMonth.toFixed(2))+
    row("Total de gastos mensais","€"+totalExpenses.toFixed(2))+row("Saldo livre no mês","€"+freeBalance.toFixed(2), freeBalance<0?"warn big":"big")+
    row("% da renda comprometida", pctCommitted.toFixed(1)+"%", pctCommitted>85?"warn":"")+row("Reserva possível em 12 meses","€"+yearlyReserve.toFixed(2));
  renderSurvivalCard(totalExpenses);
}
function renderConverter(){
  var eurEl = document.getElementById("convEur"), brlEl = document.getElementById("convBrl");
  if(!eurEl) return;
  eurEl.addEventListener("input", function(){
    var v = parseFloat(eurEl.value);
    brlEl.value = isNaN(v) ? "" : (v*getCotacao()).toFixed(2);
  });
  brlEl.addEventListener("input", function(){
    var v = parseFloat(brlEl.value);
    eurEl.value = isNaN(v) ? "" : (v/getCotacao()).toFixed(2);
  });
}
function renderSurvivalCard(totalExpenses){
  var el = document.getElementById("survivalWrap");
  if(!el) return;
  function row(months){ return '<div class="summary-row"><span class="lbl">'+months+' '+(months===1?"mês":"meses")+'</span><span class="val">€'+(totalExpenses*months).toFixed(0)+'</span></div>'; }
  el.innerHTML = row(1)+row(2)+row(3)+row(6);
}

/* ---------- grupos / links ---------- */
var GROUP_CITIES = [
  {id:"dublin", label:"Dublin"},
  {id:"cork", label:"Cork"},
  {id:"galway", label:"Galway"},
  {id:"geral", label:"Geral / outras cidades"}
];
var GROUPS = {
  dublin: [
    {name:"Acomodações na Irlanda-Dublin Casas|Apartamento|Flats|Studios", url:"https://www.facebook.com/share/g/19ND5FrTEU/", desc:"Moradia — ~32,6 mil membros"},
    {name:"Classificados Dublin", url:"https://www.facebook.com/share/g/19QMu3CAKw/", desc:"Compra e venda entre brasileiros — ~106,8 mil membros"},
    {name:"Brasileiros em Dublin", url:"https://www.facebook.com/share/g/1Fe8i4uJgC/", desc:"Comunidade brasileira — ~110,6 mil membros"},
    {name:"Networking Dublin Jobs Official ☘️ Opportunities in Ireland 🇮🇪", url:"https://www.facebook.com/share/g/1EVzv6cPry/", desc:"Vagas e networking — ~2,3 mil membros"},
    {name:"Brazilians Living In Dublin Ireland", url:"https://www.facebook.com/share/g/19PCPB6GaZ/", desc:"Comunidade brasileira — ~13 mil membros"},
    {name:"Ajudando Pessoas - Dublin", url:"https://www.facebook.com/share/g/1Bh6b1AJdN/", desc:"Ajuda mútua entre brasileiros — ~8,5 mil membros"},
    {name:"Pisos, casas y habitaciones en alquiler en Dublín, Irlanda", url:"https://www.facebook.com/share/g/1Bo1LVcobQ/", desc:"Moradia (em espanhol) — ~38,4 mil membros"},
    {name:"Comunidade Brasileira em Dublin", url:"https://www.facebook.com/share/g/1Jjr3pnFLB/", desc:"Comunidade brasileira — ~8,8 mil membros"},
    {name:"Brasileiros Em Dublin 🇮🇪 🍀 📍", url:"https://www.facebook.com/share/g/1EpfpJz2xV/", desc:"Classificados e comunidade — ~125,1 mil membros"}
  ],
  cork: [
    {name:"Brasileiros na Irlanda | UBC — Dublin, Cork, Galway e Limerick", url:"https://www.facebook.com/groups/brasileirosnairlanda.ubn/", desc:"Comunidade brasileira em várias cidades — ~19,4 mil membros"},
    {name:"Brazucas em Cork", url:"https://www.facebook.com/groups/brazucaemcork/", desc:"Comunidade brasileira em Cork — ~5,2 mil membros"},
    {name:"CORK rooms, flatmates, rent", url:"https://www.facebook.com/groups/1614204058630363/", desc:"Moradia e colegas de quarto — ~92,2 mil membros"},
    {name:"Cork Jobs, Ireland", url:"https://www.facebook.com/groups/763366931020771/", desc:"Vagas de emprego em Cork — ~13,9 mil membros"},
    {name:"Sharing Job Info in Cork City, Ireland", url:"https://www.facebook.com/groups/1334021919958105/", desc:"Vagas de emprego em Cork — ~31,8 mil membros"},
    {name:"Cork, Ireland", url:"https://www.facebook.com/groups/2357344181/", desc:"Comunidade geral de Cork — ~93,3 mil membros"},
    {name:"Jobs in Ireland — Dublin, Cork, Galway, Limerick, Drogheda, Bray, Ennis, Waterford", url:"https://www.facebook.com/groups/634236662909957/", desc:"Vagas de emprego em várias cidades — ~7,2 mil membros"},
    {name:"Classificados Geral Cork", url:"https://www.facebook.com/groups/713962095393659/", desc:"Classificados da comunidade brasileira — ~9 mil membros"},
    {name:"Estudantes Brasileiros em Cork", url:"https://www.facebook.com/groups/estudantesbrasileirosemcork/", desc:"Grupo de estudantes brasileiros — ~11,5 mil membros"}
  ],
  galway: [
    {name:"Brasileiros na Irlanda (Galway)", url:"https://www.facebook.com/groups/1678404888931427/", desc:"Comunidade brasileira em Galway — ~2,7 mil membros"},
    {name:"Estudantes Brasileiros em Galway", url:"https://www.facebook.com/groups/estudantesbrasileirosemgalway/", desc:"Grupo de estudantes brasileiros em Galway"},
    {name:"Ireland Immigration - Workpermit, Visas - IRP renewal / Naturalisation", url:"https://www.facebook.com/groups/2376965139120925/", desc:"Imigração, vistos e renovação de IRP — ~84,5 mil membros"},
    {name:"Galway Ireland", url:"https://www.facebook.com/groups/galwayireland/", desc:"Comunidade geral de Galway"},
    {name:"Galway Marketplace", url:"https://www.facebook.com/groups/galwaymarketplace/", desc:"Compra e venda em Galway"},
    {name:"Job Opportunities in Ireland with Visa Sponsorship", url:"https://www.facebook.com/groups/jobopportunitiesinirelandwithvisasponsorship/", desc:"Vagas com patrocínio de visto"},
    {name:"Grupo do Facebook (nome não identificado)", url:"https://www.facebook.com/groups/2315813085553253/", desc:"Não consegui confirmar o nome — me avise qual é para eu atualizar"},
    {name:"Travel Tips for Ireland", url:"https://www.facebook.com/groups/traveltipsforireland/", desc:"Dicas de viagem para a Irlanda"},
    {name:"Grupo do Facebook (nome não identificado)", url:"https://www.facebook.com/groups/985060138611023/", desc:"Não consegui confirmar o nome — me avise qual é para eu atualizar"}
  ],
  geral: [
    {name:"Trabalhos na Irlanda 🇧🇷🇮🇪", url:"https://www.facebook.com/share/g/1FPRUCJFiK/", desc:"Vagas de emprego na Irlanda — ~34,2 mil membros"},
    {name:"Brasileiros na Irlanda ☘️", url:"https://www.facebook.com/share/g/1chat6kwPo/", desc:"Comunidade brasileira na Irlanda — ~14 mil membros"},
    {name:"Brasileiros na Irlanda 26/27 🇮🇪", url:"https://www.facebook.com/share/g/17NhDMbd3x/", desc:"Para quem vai em 2026/2027 — ~3,3 mil membros"},
    {name:"🌍 Grupo de Aluguel na Irlanda 2026 🏡", url:"https://www.facebook.com/share/g/1F393WTs9M/", desc:"Moradia em todo o país — ~14,2 mil membros"},
    {name:"Offers Job Employment Republic of Ireland", url:"https://www.facebook.com/share/g/14ohA9aFYW1/", desc:"Vagas de emprego — ~76,9 mil membros"},
    {name:"Job Search Ireland", url:"https://www.facebook.com/share/g/1Eh8FZjDqZ/", desc:"Vagas de emprego"},
    {name:"Grupo do Facebook (nome não identificado)", url:"https://www.facebook.com/share/g/1DaoCqFYYU/", desc:"Não consegui confirmar o nome — me avise qual é para eu atualizar"}
  ]
};
function renderGroups(){
  document.getElementById("groupsWrap").innerHTML = GROUP_CITIES.map(function(c){
    var list = GROUPS[c.id] || [];
    var body = list.length
      ? '<div class="grid cols-3">'+list.map(function(g){
          var fav = faviconUrl(g.url);
          return '<a class="linkcard" href="'+g.url+'" target="_blank" rel="noopener">'+
            '<div class="linkcard-icon">'+LINK_ICONS.users+(fav?'<img class="linkcard-favicon" src="'+fav+'" alt="" loading="lazy" onerror="this.remove()">':'')+'</div>'+
            '<h4>'+g.name+'</h4><p>'+g.desc+'</p>'+
            '<span class="linkcard-arrow">↗</span></a>';
        }).join("")+'</div>'
      : '<div class="empty">Ainda não há grupos de '+c.label+' cadastrados.</div>';
    return '<div class="card"><h3>'+c.label+'</h3>'+body+'</div>';
  }).join("");
}
var LINK_ICONS = {
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"/></svg>',
  idcard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="1.8"/><path d="M6 15.5c.5-1.5 2-2 2.5-2s2 .5 2.5 2M14 9h5M14 13h5"/></svg>',
  briefcase:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>',
  bus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="12" rx="2"/><path d="M4 12h16M8 20v-2M16 20v-2"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.5-9.5-9C1 8 2 4.5 5.5 4c2-.3 3.8.8 4.5 2 .7-1.2 2.5-2.3 4.5-2C17.9 4.5 19 8 17.5 11c-2.5 4.5-9.5 9-9.5 9Z"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11 12 4l8 7M6 10v9h12v-9"/></svg>',
  plane:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 3 3 10.5l7 2.5M21 3 13.5 21l-2.5-8M21 3 10 14"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><path d="M2.5 19c.5-3 3-5 6.5-5s6 2 6.5 5M16 8.5a2.5 2.5 0 1 0 0-5M17 13.5c2.2.3 4 2 4.3 4.2"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/></svg>',
  wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M15 14h3"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></svg>'
};
var LINKS = [
  {group:"Imigração", icon:"shield", label:"Immigration Service Delivery", url:"https://www.irishimmigration.ie", desc:"Regras de visto, Stamp 2, IRP e permissões de trabalho"},
  {group:"Imigração", icon:"shield", label:"Citizens Information", url:"https://www.citizensinformation.ie", desc:"Leis irlandesas explicadas em linguagem simples"},
  {group:"Documentos", icon:"idcard", label:"Consulado/Embaixada do seu país", url:"#", desc:"Requisitos de documentação e registro consular da sua nacionalidade"},
  {group:"Documentos", icon:"idcard", label:"AIRE (cidadãos italianos)", url:"https://aire.esteri.it", desc:"Registro consular — exemplo para quem tem cidadania italiana"},
  {group:"Trabalho & impostos", icon:"briefcase", label:"MyWelfare", url:"https://www.mywelfare.ie", desc:"Agendamento e solicitação do PPS Number"},
  {group:"Trabalho & impostos", icon:"briefcase", label:"Revenue", url:"https://www.revenue.ie", desc:"Registro fiscal, myAccount e imposto emergencial"},
  {group:"Trabalho & impostos", icon:"briefcase", label:"Workplace Relations Commission", url:"https://www.workplacerelations.ie", desc:"Salário mínimo e direitos trabalhistas"},
  {group:"Trabalho & impostos", icon:"briefcase", label:"Jobs Ireland", url:"https://jobsireland.ie/", desc:"Portal oficial de vagas de emprego do governo irlandês"},
  {group:"Transporte", icon:"bus", label:"Transporte público na Irlanda", url:"https://www.ireland.com/en-us/help-and-advice/practical-information/public-transport/", desc:"Leap Card, rotas e visão geral do transporte público"},
  {group:"Transporte", icon:"bus", label:"Irish Rail", url:"https://www.irishrail.ie", desc:"Trens intercidades — Dublin, Cork, Galway e mais"},
  {group:"Transporte", icon:"bus", label:"Bus Éireann", url:"https://www.buseireann.ie", desc:"Rotas de ônibus municipais e intermunicipais"},
  {group:"Transporte", icon:"bus", label:"Dublin Public Transport", url:"https://www.dublinpublictransport.ie", desc:"Guia independente e detalhado — rotas, zonas do Leap Card e mapas de trem/Luas"},
  {group:"Saúde", icon:"heart", label:"HSE", url:"https://www.hse.ie", desc:"Sistema de saúde irlandês"},
  {group:"Moradia", icon:"home", label:"Residential Tenancies Board (RTB)", url:"https://www.rtb.ie", desc:"Direitos e deveres em contratos de aluguel"},
  {group:"Moradia", icon:"home", label:"Daft.ie", url:"https://www.daft.ie", desc:"Principal site de anúncios de moradia"},
  {group:"Moradia", icon:"home", label:"MyHome.ie", url:"https://www.myhome.ie/rentals/ireland/share/shared-accommodation", desc:"Quartos e casas compartilhadas em toda a Irlanda"},
  {group:"Moradia", icon:"home", label:"Rent.ie", url:"https://www.rent.ie/rooms-to-rent/", desc:"Quartos para alugar e house shares"},
  {group:"Moradia", icon:"home", label:"Roomgo (ex-Easyroommate)", url:"https://ie.roomgo.net/", desc:"Encontrar colegas de quarto e vagas em repúblicas"},
  {group:"Moradia", icon:"home", label:"Threshold", url:"https://www.threshold.ie", desc:"ONG irlandesa de apoio e orientação a inquilinos"},
  {group:"Aeroportos", icon:"plane", label:"Dublin Airport", url:"https://www.dublinairport.com", desc:"Informações do principal aeroporto de chegada"},
  {group:"Estudo & escola", icon:"book", label:"ILEP / TrustEd Ireland", url:"https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-options/interim-list-of-eligible-programmes-ilep/", desc:"Lista oficial de cursos de inglês elegíveis para visto — está sendo substituída pelo selo TrustEd Ireland, confira sempre a versão vigente"},
  {group:"Estudo & escola", icon:"book", label:"Education in Ireland", url:"https://www.educationinireland.com", desc:"Site oficial do governo para quem vai estudar na Irlanda"},
  {group:"Estudo & escola", icon:"book", label:"QQI", url:"https://www.qqi.ie", desc:"Órgão oficial de qualidade e acreditação de ensino na Irlanda"},
  {group:"Estudo & escola", icon:"book", label:"ICOS", url:"https://www.internationalstudents.ie", desc:"Conselho irlandês de apoio a estudantes internacionais — guias e orientação"},
  {group:"Bancos & dinheiro", icon:"wallet", label:"Revolut", url:"https://www.revolut.com", desc:"Conta digital com IBAN irlandês — dá pra abrir antes mesmo de chegar, sem PPSN"},
  {group:"Bancos & dinheiro", icon:"wallet", label:"N26", url:"https://n26.com", desc:"Alternativa de conta digital europeia, sem PPSN necessário"},
  {group:"Bancos & dinheiro", icon:"wallet", label:"Wise", url:"https://wise.com", desc:"Transferência internacional e câmbio com taxas melhores que banco tradicional"},
  {group:"Celular & chip", icon:"phone", label:"Three Ireland", url:"https://www.three.ie", desc:"Uma das operadoras com melhor cobertura 4G/5G no país"},
  {group:"Celular & chip", icon:"phone", label:"Vodafone Ireland", url:"https://www.vodafone.ie", desc:"Rede extensa, boa cobertura mesmo fora dos grandes centros"},
  {group:"Celular & chip", icon:"phone", label:"GoMo", url:"https://www.gomo.ie", desc:"Operadora só digital (do grupo Eir) com planos pré-pagos mais baratos"}
];
function faviconUrl(url){
  try{ return "https://www.google.com/s2/favicons?sz=64&domain="+new URL(url).hostname; }
  catch(e){ return null; }
}
function renderLinks(){
  var wrap = document.getElementById("linksWrap");
  wrap.className = "grid cols-3";
  wrap.innerHTML = LINKS.map(function(l){
    var icon = LINK_ICONS[l.icon] || LINK_ICONS.users;
    var isHash = l.url === "#";
    var tag = isHash ? "div" : "a";
    var fav = isHash ? null : faviconUrl(l.url);
    return "<"+tag+' class="linkcard"'+(isHash?"":' href="'+l.url+'" target="_blank" rel="noopener"')+'>'+
      '<div class="linkcard-icon">'+icon+(fav?'<img class="linkcard-favicon" src="'+fav+'" alt="" loading="lazy" onerror="this.remove()">':'')+'</div>'+
      '<div class="eyebrow">'+l.group+'</div>'+
      '<h4>'+l.label+'</h4><p>'+l.desc+'</p>'+
      (isHash?"":'<span class="linkcard-arrow">↗</span>')+
      "</"+tag+">";
  }).join("");
}

/* ---------- turismo (seção independente) ---------- */
var TOURIST_ENTRY = [
  "Passaporte válido por pelo menos 6 meses além da data de retorno.",
  "Brasileiros não precisam de visto para turismo — estadias de até 90 dias.",
  "Passagem de volta (ou continuação de viagem) comprada.",
  "Comprovante de hospedagem para todo o período.",
  "Comprovação financeira de que consegue se manter durante a estadia.",
  "Seguro viagem — não é obrigatório, mas fortemente recomendado."
];
function renderTouristEntry(){
  document.getElementById("touristEntryWrap").innerHTML = TOURIST_ENTRY.map(function(t){ return tipRow(t, ""); }).join("");
}
var TOUR_ICONS = {
  castle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 21V10l3-2v2h2V8l3-2 3 2v2h2V8l3 2v11H4Z"/><path d="M4 21h16M9 21v-5h6v5"/></svg>',
  mountain:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 19 9 8l4 6 2-3 6 8H3Z"/></svg>',
  music:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/></svg>',
  pint:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 8h10l-1 11a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L7 8Z"/><path d="M7.5 12h9M6.5 8 7 5h10l.5 3"/></svg>',
  ship:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 15h16l-2 5H6l-2-5Z"/><path d="M6 15V6h5v9M13 10h4l2 5"/></svg>',
  island:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 17c3-1 5-1 8 0s5 1 8 0M2 20c3-1 5-1 8 0s5 1 8 0"/><path d="M12 14V6M9 9l3-3 3 3"/></svg>'
};
var TOURIST_CITIES = [
  {name:"Dublin", icon:"castle", dist:"Ponto de chegada", attractions:"Trinity College, Grafton Street, Catedral de St. Patrick, Dublin Castle, Guinness Storehouse, Temple Bar.", hotel:"Ruby Molly Hotel — bem avaliado e no centro da cidade.",
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/Dublin_-_aerial_-_2025-07-07_01.jpg/960px-Dublin_-_aerial_-_2025-07-07_01.jpg",
    photoCredit:{name:"瑞丽江的河水", license:"CC BY-SA 4.0", url:"https://commons.wikimedia.org/wiki/File:Dublin_-_aerial_-_2025-07-07_01.jpg"},
    wiki:"https://en.wikipedia.org/wiki/Dublin"},
  {name:"Wicklow &amp; Glendalough", icon:"mountain", dist:"~50 km de Dublin (1h de carro)", attractions:"Powerscourt Estate (jardins) e Glendalough, vale glacial com lagos e ruínas monásticas — clássico bate-volta de Dublin.", hotel:"Geralmente feito em excursão de um dia, sem pernoite.",
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/St._Kevin%27s_Kitchen%2C_Glendalough%2C_Co._Wicklow_%282023%29.jpg/960px-St._Kevin%27s_Kitchen%2C_Glendalough%2C_Co._Wicklow_%282023%29.jpg",
    photoCredit:{name:"Denzillacey", license:"CC BY-SA 4.0", url:"https://commons.wikimedia.org/wiki/File:St._Kevin%27s_Kitchen,_Glendalough,_Co._Wicklow_(2023).jpg"},
    wiki:"https://en.wikipedia.org/wiki/Glendalough"},
  {name:"Kilkenny", icon:"castle", dist:"~139 km de Dublin (1h40 de carro)", attractions:"Cidade medieval com ruas estreitas, catedral histórica e o Castelo de Kilkenny visitável.", hotel:"Também comum como bate-volta de Dublin.",
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/8/88/Kilkenny_castle_2.jpg/960px-Kilkenny_castle_2.jpg",
    photoCredit:{name:"Jimmy joe jazz", license:"CC BY-SA 4.0", url:"https://commons.wikimedia.org/wiki/File:Kilkenny_castle_2.jpg"},
    wiki:"https://en.wikipedia.org/wiki/Kilkenny"},
  {name:"Galway", icon:"music", dist:"~208 km de Dublin (2h45 de carro)", attractions:"Centro histórico boêmio com pubs de música ao vivo, ponto de partida para as Ilhas Aran e os Cliffs of Moher.", hotel:"The Dean Galway — design moderno, rooftop e localização central.",
    photo:"https://upload.wikimedia.org/wikipedia/commons/c/cb/Galway_cathedral.jpg",
    photoCredit:{name:"Wikimedia Commons", license:"CC BY-SA 3.0", url:"https://commons.wikimedia.org/wiki/File:Galway_cathedral.jpg"},
    wiki:"https://en.wikipedia.org/wiki/Galway"},
  {name:"Ilhas Aran", icon:"island", dist:"Balsa a partir de Galway (~40min–1h)", attractions:"Três ilhas com o forte pré-histórico de Dún Aonghasa e tradições irlandesas bem preservadas.", hotel:"Geralmente visitado em bate-volta a partir de Galway.",
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Dun_Aonghasa_%28cropped%29.JPG/960px-Dun_Aonghasa_%28cropped%29.JPG",
    photoCredit:{name:"Ronan Mac Giollapharaic", license:"CC BY-SA 4.0", url:"https://commons.wikimedia.org/wiki/File:Dun_Aonghasa_(cropped).JPG"},
    wiki:"https://en.wikipedia.org/wiki/Aran_Islands"},
  {name:"Cliffs of Moher", icon:"mountain", dist:"~1h de Galway", attractions:"Falésias de 214m de altura ao longo de 8km de costa — um dos points mais fotografados da Irlanda.", hotel:"Normalmente visitado em bate-volta a partir de Galway.",
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Cliffs-Of-Moher-OBriens-From-South.JPG/960px-Cliffs-Of-Moher-OBriens-From-South.JPG",
    photoCredit:{name:"Bjørn Christian Tørrissen", license:"CC BY-SA 3.0", url:"https://commons.wikimedia.org/wiki/File:Cliffs-Of-Moher-OBriens-From-South.JPG"},
    wiki:"https://en.wikipedia.org/wiki/Cliffs_of_Moher"},
  {name:"Killarney / Ring of Kerry", icon:"mountain", dist:"~307 km de Dublin (4h de carro)", attractions:"Parque Nacional de Killarney, Bunratty Castle nas proximidades, e o Ring of Kerry — percurso circular de 179km com paisagens litorâneas.", hotel:"The Lake Hotel Killarney — à beira do lago, dentro do parque nacional.",
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Atlantic_Ocean%2C_Ring_of_Kerry_%28506559%29_%2827964189752%29.jpg/960px-Atlantic_Ocean%2C_Ring_of_Kerry_%28506559%29_%2827964189752%29.jpg",
    photoCredit:{name:"Robert Linsdell", license:"CC BY 2.0", url:"https://commons.wikimedia.org/wiki/File:Atlantic_Ocean,_Ring_of_Kerry_(506559)_(27964189752).jpg"},
    wiki:"https://en.wikipedia.org/wiki/Ring_of_Kerry"},
  {name:"Cork", icon:"ship", dist:"~259 km de Dublin (2h45 de carro)", attractions:"Segunda maior cidade do país, English Market, e a Pedra de Blarney nas proximidades.", hotel:"The Imperial Hotel — clássico, no centro da cidade.",
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/University_College_Cork_-_Quad_during_Eclipse_2015_%2816684104050%29.jpg/960px-University_College_Cork_-_Quad_during_Eclipse_2015_%2816684104050%29.jpg",
    photoCredit:{name:"Darius Whelan", license:"CC BY 2.0", url:"https://commons.wikimedia.org/wiki/File:University_College_Cork_-_Quad_during_Eclipse_2015_(16684104050).jpg"},
    wiki:"https://en.wikipedia.org/wiki/Cork_(city)"},
  {name:"Belfast &amp; Giant's Causeway", icon:"ship", dist:"~166 km de Dublin (1h30 de carro) — já na Irlanda do Norte", attractions:"Museu Titanic Belfast, Dark Hedges (cenário de Game of Thrones) e o Giant's Causeway — patrimônio da UNESCO com 40 mil colunas de basalto.", hotel:"Consulte Booking/Tripadvisor — boa oferta de hotéis no centro de Belfast.",
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Causeway-code_poet-4.jpg/960px-Causeway-code_poet-4.jpg",
    photoCredit:{name:"code poet (Flickr)", license:"CC BY-SA 2.0", url:"https://commons.wikimedia.org/wiki/File:Causeway-code_poet-4.jpg"},
    wiki:"https://en.wikipedia.org/wiki/Giant%27s_Causeway"}
];
function openLightbox(src, captionHtml){
  var overlay = document.getElementById("photoLightbox");
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightboxCaption").innerHTML = captionHtml;
  overlay.hidden = false;
}
function closeLightbox(){
  var overlay = document.getElementById("photoLightbox");
  overlay.hidden = true;
  document.getElementById("lightboxImg").src = "";
}
function renderTouristCities(){
  document.getElementById("touristCitiesWrap").innerHTML = TOURIST_CITIES.map(function(c, i){
    var name = c.name.replace(/<[^>]+>/g,"");
    var photo = c.photo ? '<img class="city-card-photo" data-idx="'+i+'" src="'+c.photo+'" alt="'+name+'" loading="lazy" onerror="this.remove()">' : "";
    var credit = c.photo ? '<a class="city-card-credit" href="'+c.photoCredit.url+'" target="_blank" rel="noopener">Foto: '+c.photoCredit.name+' / Wikimedia Commons ('+c.photoCredit.license+')</a>' : "";
    var wiki = c.wiki ? '<a class="ci-link" href="'+c.wiki+'" target="_blank" rel="noopener">Saiba mais no Wikipedia →</a>' : "";
    return '<div class="city-card">'+photo+'<div class="city-icon">'+TOUR_ICONS[c.icon]+'</div><h3>'+c.name+'</h3><div class="dist">'+c.dist+'</div>'+
      '<div class="attractions">'+c.attractions+'</div>'+
      '<div class="hotel-pick"><b>Hotel sugerido:</b> '+c.hotel+'</div>'+
      '<div style="margin-top:10px;">'+wiki+'</div>'+credit+'</div>';
  }).join("");
  document.querySelectorAll("#touristCitiesWrap .city-card-photo").forEach(function(img){
    img.addEventListener("click", function(){
      var c = TOURIST_CITIES[img.dataset.idx];
      var cap = c.name.replace(/<[^>]+>/g,"")+' — <a href="'+c.photoCredit.url+'" target="_blank" rel="noopener">Foto: '+c.photoCredit.name+' / Wikimedia Commons ('+c.photoCredit.license+')</a>';
      openLightbox(c.photo, cap);
    });
  });
}
var TOURIST_BUDGET = [
  {label:"Mochilão (hostel)", value:"~€90–100/dia", note:"Cama em hostel, alimentação simples e transporte local."},
  {label:"Conforto médio (hotel)", value:"~€120+/dia", note:"Hotel simples e refeições em restaurantes."},
  {label:"Alimentação", value:"~€60/dia", note:"Café da manhã, almoço, jantar e água por pessoa."},
  {label:"Transporte urbano", value:"~€1,90/trecho", note:"Tarifa média de ônibus/Luas em Dublin."},
  {label:"Viagem de 10 dias", value:"~€1.400 no total", note:"Estimativa com conforto mínimo — varia conforme época e hospedagem."}
];
function renderTouristBudget(){
  var rows = TOURIST_BUDGET.map(function(b){ return '<tr><td data-label="Estilo">'+b.label+'</td><td class="num tabular" data-label="Valor">'+b.value+'</td><td data-label="Observação">'+b.note+'</td></tr>'; }).join("");
  document.getElementById("touristBudgetTable").innerHTML = '<thead><tr><th>Estilo</th><th class="num">Valor</th><th>Observação</th></tr></thead><tbody>'+rows+'</tbody>';
}
var TOURIST_TIPS = [
  {title:"Moeda", note:"Euro na República da Irlanda; Libra Esterlina na Irlanda do Norte. Cartão é amplamente aceito — leve algum dinheiro para gorjetas e pequenas compras."},
  {title:"Gorjeta", note:"Não é obrigatória. Em restaurantes, ~10% é bem-vinda quando a taxa de serviço não está incluída."},
  {title:"Clima &amp; mala", note:"Clima oceânico — pode chover a qualquer hora, mesmo no verão. Leve roupas em camadas, casaco impermeável e calçado confortável."},
  {title:"Direção", note:"Dirige-se pela esquerda, com o volante do lado direito do carro — assim como no Reino Unido."},
  {title:"Voltagem", note:"230V, tomada tipo G (igual ao Reino Unido) — leve adaptador."},
  {title:"Idioma", note:"Inglês é falado em todo o país; o irlandês (gaélico) é oficial e usado em regiões do Gaeltacht."}
];
function renderTouristTips(){
  document.getElementById("touristTipsWrap").innerHTML = TOURIST_TIPS.map(function(t){
    return '<div class="tip-card"><h4>'+t.title+'</h4><p>'+t.note+'</p></div>';
  }).join("");
}
var TOURIST_EXPERIENCES = [
  {icon:"pint", title:"Guinness Storehouse", desc:"Tour interativo em Dublin sobre a cerveja mais famosa da Irlanda, terminando com uma pint no Gravity Bar e vista 360° da cidade."},
  {icon:"book", title:"Trinity College & Livro de Kells", desc:"A biblioteca histórica guarda o Livro de Kells, manuscrito medieval de mais de mil anos."},
  {icon:"music", title:"Música ao vivo em Temple Bar", desc:"Bairro boêmio de Dublin, point clássico para ouvir bandas irlandesas tocando ao vivo em pubs históricos."},
  {icon:"pint", title:"Jameson Distillery", desc:"Tour e degustação de whiskey irlandês numa destilaria centenária no coração de Dublin."},
  {icon:"ship", title:"EPIC — The Irish Emigration Museum", desc:"Museu interativo sobre a história da emigração irlandesa pelo mundo, em Dublin."},
  {icon:"castle", title:"Rock of Cashel", desc:"Ruínas históricas e religiosas do século IX no topo de uma colina — um dos points mais fotografados do país."},
  {icon:"castle", title:"Pedra de Blarney", desc:"Tradição de beijar a 'pedra da eloquência' no topo do Castelo de Blarney, perto de Cork."},
  {icon:"mountain", title:"Ring of Kerry", desc:"Percurso circular de 179km com paisagens litorâneas espetaculares no sudoeste da Irlanda."},
  {icon:"island", title:"Ilhas Aran", desc:"Forte pré-histórico de Dún Aonghasa e tradições irlandesas bem preservadas, a um passeio de barco de Galway."},
  {icon:"mountain", title:"Giant's Causeway & Dark Hedges", desc:"Colunas de basalto vulcânico (UNESCO) e o túnel de árvores que virou cenário de Game of Thrones, na Irlanda do Norte."},
  {icon:"ship", title:"Titanic Belfast", desc:"Museu interativo sobre a história do Titanic, no estaleiro onde o navio foi construído."}
];
function renderTouristExperiences(){
  document.getElementById("touristExpWrap").innerHTML = TOURIST_EXPERIENCES.map(function(e){
    return '<div class="exp-card"><div class="exp-icon">'+TOUR_ICONS[e.icon]+'</div><h4>'+e.title+'</h4><p>'+e.desc+'</p></div>';
  }).join("");
}

/* ---------- explorar a irlanda: atrações rastreáveis ---------- */
var ATTR_CATS = ["Cidades","Natureza","Castelos e história","Pubs e experiências","Bate-voltas"];
var ATTRACTIONS = [
  {id:"trinity", name:"Trinity College + Book of Kells", cat:"Cidades", region:"Dublin", desc:"Campus histórico com o Book of Kells, manuscrito medieval de mais de mil anos. Reserva recomendada.", top15:true},
  {id:"temple-bar", name:"Temple Bar", cat:"Pubs e experiências", region:"Dublin", desc:"Bairro turístico com pubs, música ao vivo e ruas movimentadas — mais caro, não limite a experiência de pub só a ele."},
  {id:"grafton", name:"Grafton Street", cat:"Cidades", region:"Dublin", desc:"Uma das áreas comerciais mais importantes do centro, com lojas, cafés e artistas de rua."},
  {id:"stephens-green", name:"St Stephen's Green", cat:"Natureza", region:"Dublin", desc:"Parque central gratuito, ótimo para caminhada e descanso."},
  {id:"dublin-castle", name:"Dublin Castle", cat:"Castelos e história", region:"Dublin", desc:"Complexo histórico fundamental para entender a história política da Irlanda."},
  {id:"christchurch", name:"Christ Church Cathedral", cat:"Castelos e história", region:"Dublin", desc:"Catedral histórica com arquitetura impressionante no centro de Dublin."},
  {id:"stpatricks", name:"St Patrick's Cathedral", cat:"Castelos e história", region:"Dublin", desc:"Maior catedral da Irlanda, ligada à história de São Patrício."},
  {id:"hapenny", name:"Ha'penny Bridge", cat:"Cidades", region:"Dublin", desc:"Ponte histórica e gratuita sobre o River Liffey — cartão-postal clássico de Dublin."},
  {id:"kilmainham", name:"Kilmainham Gaol", cat:"Castelos e história", region:"Dublin", desc:"Antiga prisão ligada à luta pela independência irlandesa. Reserva fortemente recomendada."},
  {id:"phoenix-park", name:"Phoenix Park", cat:"Natureza", region:"Dublin", desc:"Grande parque urbano gratuito — caminhada, bicicleta e piquenique."},
  {id:"epic", name:"EPIC — The Irish Emigration Museum", cat:"Cidades", region:"Dublin", desc:"Museu interativo sobre a emigração irlandesa e sua influência pelo mundo."},
  {id:"guinness", name:"Guinness Storehouse", cat:"Pubs e experiências", region:"Dublin", desc:"Tour sobre a cerveja mais famosa da Irlanda, terminando no Gravity Bar com vista de Dublin.", top15:true},
  {id:"howth", name:"Howth", cat:"Bate-voltas", region:"Dublin (DART)", desc:"Vila costeira com porto, trilhas, falésias e frutos do mar — chegue de DART. Meio dia ou dia inteiro.", top15:true},
  {id:"glendalough", name:"Wicklow &amp; Glendalough", cat:"Natureza", region:"~50km de Dublin", desc:"Antigo assentamento monástico entre montanhas e lagos (Round Tower, Upper/Lower Lake). Bate-volta clássico.", top15:true},
  {id:"kilkenny-castle", name:"Kilkenny (Castelo + Medieval Mile)", cat:"Cidades", region:"Kilkenny", desc:"Cidade medieval fácil de explorar a pé, com castelo visitável e catedral de St Canice.", top15:true},
  {id:"galway-centro", name:"Galway (Latin Quarter + Spanish Arch)", cat:"Cidades", region:"Galway", desc:"Centro boêmio com pubs de música ao vivo, Spanish Arch e Salthill Promenade ao pôr do sol.", top15:true},
  {id:"cliffs", name:"Cliffs of Moher", cat:"Natureza", region:"County Clare", desc:"Falésias voltadas para o Atlântico — um dos cartões-postais da Irlanda. Depende do clima; nunca ultrapasse as barreiras de segurança.", top15:true},
  {id:"doolin", name:"Doolin", cat:"Bate-voltas", region:"County Clare", desc:"Vila conhecida pela música tradicional, perto dos Cliffs of Moher — boa opção de pernoite."},
  {id:"burren", name:"The Burren", cat:"Natureza", region:"County Clare", desc:"Paisagem calcária única, com o Poulnabrone Dolmen e estradas panorâmicas."},
  {id:"connemara", name:"Connemara &amp; Kylemore Abbey", cat:"Natureza", region:"County Galway", desc:"Paisagens rurais, montanhas e lagos; Kylemore Abbey é uma construção histórica à beira de um lago.", top15:true},
  {id:"aran", name:"Aran Islands", cat:"Natureza", region:"Balsa de Galway", desc:"Inis Mór (recomendada para primeira visita), fortalezas pré-históricas e muros de pedra — ferry + bicicleta.", top15:true},
  {id:"cork-market", name:"Cork (English Market)", cat:"Cidades", region:"Cork", desc:"Mercado gastronômico imperdível em Cork, com St Anne's Church e Cork City Gaol por perto."},
  {id:"blarney", name:"Blarney Castle", cat:"Castelos e história", region:"perto de Cork", desc:"Castelo famoso pela Blarney Stone e pelos jardins.", top15:true},
  {id:"cobh", name:"Cobh", cat:"Bate-voltas", region:"perto de Cork", desc:"Último porto de escala do Titanic — Titanic Experience, St Colman's Cathedral e Deck of Cards.", top15:true},
  {id:"kinsale", name:"Kinsale", cat:"Bate-voltas", region:"perto de Cork", desc:"Cidade costeira de gastronomia, porto e casas coloridas."},
  {id:"killarney-np", name:"Killarney National Park", cat:"Natureza", region:"Killarney", desc:"Ross Castle, Muckross House/Gardens, Torc Waterfall, Ladies View e Gap of Dunloe.", top15:true},
  {id:"ring-kerry", name:"Ring of Kerry", cat:"Natureza", region:"County Kerry", desc:"Road trip circular de ~1 a 2 dias: Killorglin → Cahersiveen → Waterville → Sneem → Kenmare.", top15:true},
  {id:"dingle", name:"Dingle Peninsula", cat:"Natureza", region:"County Kerry", desc:"Slea Head Drive (Dingle → Ventry → Slea Head → Dunquin → Ballyferriter), Inch Beach e Gallarus Oratory.", top15:true},
  {id:"cashel", name:"Rock of Cashel", cat:"Castelos e história", region:"County Tipperary", desc:"Complexo medieval no alto de uma colina — boa parada na rota Dublin → Kilkenny → Cork."},
  {id:"belfast-centro", name:"Belfast (centro)", cat:"Cidades", region:"Irlanda do Norte", desc:"City Hall, Cathedral Quarter, St George's Market e Peace Walls — moeda Libra, parte do Reino Unido.", top15:true},
  {id:"titanic-belfast", name:"Titanic Belfast", cat:"Castelos e história", region:"Belfast", desc:"Museu sobre a história do Titanic no estaleiro onde foi construído."},
  {id:"giants-causeway", name:"Giant's Causeway", cat:"Natureza", region:"Irlanda do Norte", desc:"Milhares de colunas de basalto vulcânico (UNESCO). Combine com Carrick-a-Rede e Dunluce Castle.", top15:true},
  {id:"carrick-a-rede", name:"Carrick-a-Rede Rope Bridge", cat:"Natureza", region:"Irlanda do Norte", desc:"Ponte de corda sobre penhascos — combine com Giant's Causeway e Dunluce Castle."},
  {id:"dunluce", name:"Dunluce Castle", cat:"Castelos e história", region:"Irlanda do Norte", desc:"Ruínas de castelo junto a falésias na Causeway Coast."}
];
function attrState(id){ return ls("attr_"+id) || {want:false, visited:false, fav:false}; }
function setAttrState(id, patch){ var s = attrState(id); Object.assign(s, patch); ls("attr_"+id, s); }
var attrCatView = ls("attrCatView") || "Todos";
function renderAttrCatTabs(){
  var cats = ["Todos"].concat(ATTR_CATS);
  document.getElementById("attrCatTabs").innerHTML = cats.map(function(c){
    return '<button class="subtab'+(attrCatView===c?' active':'')+'" data-cat="'+c+'">'+c+'</button>';
  }).join("");
  document.querySelectorAll("#attrCatTabs .subtab").forEach(function(b){
    b.addEventListener("click", function(){ attrCatView = b.dataset.cat; ls("attrCatView", attrCatView); renderAttrCatTabs(); renderAttrGrid(); });
  });
}
function renderAttrProgress(){
  var total = ATTRACTIONS.length;
  var visited = ATTRACTIONS.filter(function(a){ return attrState(a.id).visited; }).length;
  var pct = total ? Math.round(visited/total*100) : 0;
  document.getElementById("attrProgressWrap").innerHTML =
    '<div style="display:flex;justify-content:space-between;font-size:12.8px;color:var(--muted);margin-bottom:8px;"><span>Irlanda explorada</span><span class="tabular">'+visited+' de '+total+' · '+pct+'%</span></div>'+
    '<div class="progress-track"><div class="progress-fill" style="transform:scaleX('+(pct/100)+')"></div></div>';
}
function renderAttrGrid(){
  var list = attrCatView==="Todos" ? ATTRACTIONS : ATTRACTIONS.filter(function(a){ return a.cat===attrCatView; });
  document.getElementById("attrGridWrap").innerHTML = list.map(function(a){
    var s = attrState(a.id);
    return '<div class="exp-card">'+
      (a.top15?'<div class="eyebrow-alt" style="margin-bottom:6px;">TOP 15</div>':'')+
      '<h4>'+a.name+'</h4><p style="margin-bottom:4px;color:var(--gold-text);font-size:12.5px;font-weight:700;">'+a.region+'</p>'+
      '<p>'+a.desc+'</p>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">'+
      '<button class="btn-ghost btn" data-id="'+a.id+'" data-f="want" style="width:auto;padding:6px 10px;font-size:12.5px;'+(s.want?'background:var(--accent-soft);border-color:var(--accent);':'')+'">Quero ir</button>'+
      '<button class="btn-ghost btn" data-id="'+a.id+'" data-f="visited" style="width:auto;padding:6px 10px;font-size:12.5px;'+(s.visited?'background:var(--accent-soft);border-color:var(--accent);':'')+'">Já visitei</button>'+
      '<button class="btn-ghost btn" data-id="'+a.id+'" data-f="fav" style="width:auto;padding:6px 10px;font-size:12.5px;'+(s.fav?'background:var(--warn-soft);border-color:var(--warn);':'')+'">'+STAR_ICON+' Favorito</button>'+
      '</div></div>';
  }).join("");
  document.querySelectorAll("#attrGridWrap [data-f]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var s = attrState(btn.dataset.id);
      var patch = {}; patch[btn.dataset.f] = !s[btn.dataset.f];
      setAttrState(btn.dataset.id, patch);
      renderAttrGrid(); renderAttrProgress();
    });
  });
}
var ITINERARIES = {
  "3":[{d:"Dia 1",t:"Trinity College, Grafton Street, St Stephen's Green, Temple Bar"},{d:"Dia 2",t:"Dublin Castle, Christ Church, St Patrick's Cathedral, Guinness Storehouse"},{d:"Dia 3",t:"Escolha: Howth OU Glendalough"}],
  "5":[{d:"Dia 1",t:"Dublin histórico"},{d:"Dia 2",t:"Guinness + Kilmainham + Phoenix Park"},{d:"Dia 3",t:"Howth"},{d:"Dia 4",t:"Galway"},{d:"Dia 5",t:"Cliffs of Moher"}],
  "7":[{d:"Dia 1",t:"Dublin: Trinity, Grafton, St Stephen's Green, Temple Bar"},{d:"Dia 2",t:"Dublin: Guinness, Kilmainham, Phoenix Park"},{d:"Dia 3",t:"Galway: Latin Quarter, Spanish Arch, Salthill"},{d:"Dia 4",t:"Burren, Cliffs of Moher, Doolin"},{d:"Dia 5",t:"Killarney National Park"},{d:"Dia 6",t:"Ring of Kerry"},{d:"Dia 7",t:"Retorno a Dublin"}],
  "10":[{d:"Dia 1",t:"Dublin histórico"},{d:"Dia 2",t:"Guinness + Kilmainham"},{d:"Dia 3",t:"Howth"},{d:"Dia 4",t:"Galway"},{d:"Dia 5",t:"Cliffs + Burren + Doolin"},{d:"Dia 6",t:"Connemara"},{d:"Dia 7",t:"Killarney"},{d:"Dia 8",t:"Ring of Kerry"},{d:"Dia 9",t:"Dingle"},{d:"Dia 10",t:"Dublin"}],
  "14":[{d:"Dia 1",t:"Dublin: Trinity, Book of Kells, Grafton, St Stephen's Green, Temple Bar"},{d:"Dia 2",t:"Dublin: Dublin Castle, St Patrick's, Christ Church, Guinness Storehouse"},{d:"Dia 3",t:"Dublin: Kilmainham, Phoenix Park"},{d:"Dia 4",t:"Wicklow: Glendalough, Wicklow Mountains"},{d:"Dia 5",t:"Galway: Latin Quarter, Spanish Arch, Salthill, pub tradicional"},{d:"Dia 6",t:"Connemara: Kylemore Abbey, Connemara National Park"},{d:"Dia 7",t:"Clare: Burren, Cliffs of Moher, Doolin"},{d:"Dia 8",t:"Killarney: National Park, Ross Castle, Torc Waterfall"},{d:"Dia 9",t:"Ring of Kerry"},{d:"Dia 10",t:"Dingle: Slea Head, Dingle Town"},{d:"Dia 11",t:"Cork: English Market, centro, Cork City Gaol"},{d:"Dia 12",t:"Cobh: Titanic Experience, Catedral, Porto"},{d:"Dia 13",t:"Kilkenny: Castelo, Medieval Mile"},{d:"Dia 14",t:"Dublin: compras, descanso, passeios pendentes"}]
};
var itineraryView = ls("itineraryView") || "7";
function renderItineraryTabs(){
  document.getElementById("itineraryTabs").innerHTML = Object.keys(ITINERARIES).map(function(k){
    return '<button class="subtab'+(itineraryView===k?' active':'')+'" data-days="'+k+'">'+k+' dias</button>';
  }).join("");
  document.querySelectorAll("#itineraryTabs .subtab").forEach(function(b){
    b.addEventListener("click", function(){ itineraryView = b.dataset.days; ls("itineraryView", itineraryView); renderItineraryTabs(); renderItinerary(); });
  });
}
function renderItinerary(){
  var list = ITINERARIES[itineraryView];
  document.getElementById("itineraryWrap").innerHTML = list.map(function(d){ return tipRow(d.d, d.t); }).join("")+
    '<p class="source-note" style="margin-top:10px;">Roteiro de referência — ajuste conforme seu ritmo, clima e se vai de carro ou transporte público.</p>';
}
var MISTAKES = [
  "Tentar conhecer toda a Irlanda em poucos dias.",
  "Passar a viagem inteira apenas em Dublin.",
  "Colocar Galway + Cliffs + Connemara + Aran Islands no mesmo dia.",
  "Ignorar previsão e alertas meteorológicos.",
  "Ultrapassar barreiras de segurança em falésias.",
  "Dirigir sem entender a direção pela esquerda.",
  "Subestimar estradas rurais estreitas.",
  "Não reservar atrações populares com antecedência.",
  "Deixar para comprar passagem intermunicipal em cima da hora quando há preços dinâmicos.",
  "Montar roteiros sem considerar o horário do pôr do sol no inverno."
];
function renderMistakes(){
  document.getElementById("mistakesWrap").innerHTML = MISTAKES.map(function(m){ return tipRow(m, ""); }).join("");
}

/* ---------- init ---------- */
function renderAll(){
  renderFaqStart(); renderProfileSeg(); renderCitySeg(); renderChecklist(); renderVistos(); renderTrabalho(); renderCursoRegras();
  renderCheckableList("cronogramaWrap", CRONOGRAMA, "cronogramaDone");
  renderCheckableList("dias30Wrap", DIAS30, "dias30Done");
  renderOverview();
}
function syncTabbarHeight(){
  var tb = document.querySelector(".tabbar-wrap");
  if(tb) document.documentElement.style.setProperty("--tabbar-h", tb.offsetHeight+"px");
}
window.addEventListener("resize", syncTabbarHeight);
function init(){
  ensureSchemaVersion();
  /* Quem ja usava o site antes do onboarding existir (ja tem perfil/cidade
     configurados pela aba Perfil & cidade) nao precisa ver o onboarding. */
  if(!ls("onboardingDone")){
    if(getProfile() || getCity()) ls("onboardingDone", true);
    else openOnboarding();
  }
  renderNationalRules();
  renderSchoolTabs(); renderSchoolsTable(); renderSchoolAddForm();
  renderJobRoleTabs(); renderJobRoleContent(); renderJobAddForm();
  renderTouristEntry(); renderTouristCities(); renderTouristBudget(); renderTouristTips(); renderTouristExperiences();
  renderAttrCatTabs(); renderAttrGrid(); renderAttrProgress();
  renderItineraryTabs(); renderItinerary(); renderMistakes();
  renderMoradia();
  renderTransportApps(); renderTransportCityTabs(); renderTransportRoutes();
  renderMarket(); renderBudget(); renderConverter(); renderMoneyTips(); renderStayFields(); renderLinks(); renderGroups();
  renderAll();
  setInterval(renderHero, 60000);
  document.getElementById("lastUpdated").textContent = LAST_UPDATED;
  applyScrollMode();
  syncTabbarHeight();
  fetchLiveCotacao();
  if(!isScrollMode()) animateHeroEntrance();
}
init();
