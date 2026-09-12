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
function officialSourceHtml(url, verifiedAt){
  if(!url) return "";
  return '<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);">'+
    '<a href="'+url+'" target="_blank" rel="noopener" style="font-size:12px;color:var(--accent-strong);">Fonte oficial ↗</a>'+
    sourceVerifiedNote(verifiedAt)+
  '</div>';
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
/* navega pra outra secao e, opcionalmente, rola ate um elemento especifico dentro dela */
function goToSection(sec, elId){
  history.replaceState(null, "", "#"+sec);
  showSection(sec);
  if(elId){
    setTimeout(function(){
      var el = document.getElementById(elId);
      if(el) el.scrollIntoView({behavior:"smooth", block:"start"});
    }, isScrollMode() ? 350 : 60);
  }
}
/* ---------- comece aqui ---------- */
var COMECE_AQUI = [
  {label:"Quero entender como funciona o intercâmbio", sec:"inicio", el:"faqStartWrap"},
  {label:"Quero saber quanto dinheiro preciso", sec:"financas"},
  {label:"Quero escolher uma cidade", sec:"inicio", el:"cityFacts"},
  {label:"Quero pesquisar escolas", sec:"trabalho", el:"comoEscolherEscolaWrap"},
  {label:"Quero entender trabalho", sec:"trabalho", el:"jobTypesWrap"},
  {label:"Quero pesquisar moradia", sec:"acomodacao"},
  {label:"Quero entender documentação", sec:"imigracao"},
  {label:"Quero comparar fazer sozinho x assessoria", sec:"trabalho", el:"assessoriaWrap"}
];
function renderComeceAqui(){
  var wrap = document.getElementById("comeceAquiGrid");
  if(!wrap) return;
  wrap.innerHTML = COMECE_AQUI.map(function(c){
    return '<button type="button" class="tip-card scroll-to-btn" data-sec="'+c.sec+'" data-el="'+(c.el||"")+'"><h4 style="margin:0;">'+c.label+'</h4></button>';
  }).join("");
  wrap.querySelectorAll("button").forEach(function(btn){
    btn.addEventListener("click", function(){ goToSection(btn.dataset.sec, btn.dataset.el || null); });
  });
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
  if(hasScrollTrigger) ScrollTrigger.getAll().forEach(function(st){ if(section.contains(st.trigger)) st.kill(); });
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
    adjustTabbarOverflow();
  }
}
if(SCROLL_MODE_MQ.addEventListener) SCROLL_MODE_MQ.addEventListener("change", applyScrollMode);
else SCROLL_MODE_MQ.addListener(applyScrollMode);

/* ---------- tab bar: encolhe pra "Mais" quando nao cabe, sem seta de rolagem ---------- */
var TABBAR_FLEX_IDS = ["tab-roteiro","tab-imigracao","tab-financas","tab-trabalho","tab-ingles","tab-acomodacao","tab-mercado","tab-transporte","tab-grupos"];
function adjustTabbarOverflow(){
  var tabbar = document.getElementById("tabbar");
  var moreMenu = document.getElementById("moreMenu");
  var moreBtn = document.getElementById("tabMoreBtn");
  var linksBtn = document.getElementById("tab-links");
  if(!tabbar || !moreMenu || isScrollMode()) return;
  TABBAR_FLEX_IDS.forEach(function(id){
    var btn = document.getElementById(id);
    if(btn) tabbar.insertBefore(btn, moreBtn);
  });
  for(var i=TABBAR_FLEX_IDS.length-1; i>=0 && tabbar.scrollWidth > tabbar.clientWidth; i--){
    var demoted = document.getElementById(TABBAR_FLEX_IDS[i]);
    if(demoted) moreMenu.insertBefore(demoted, linksBtn);
  }
}
var tabbarResizeTimer = null;
window.addEventListener("resize", function(){
  clearTimeout(tabbarResizeTimer);
  tabbarResizeTimer = setTimeout(adjustTabbarOverflow, 150);
});

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
  ls("lastBackupAt", stamp);
  renderBackupReminder();
}
var BACKUP_REMINDER_DAYS = 21;
function renderBackupReminder(){
  var wrap = document.getElementById("backupReminderWrap");
  if(!wrap) return;
  var hasData = Object.keys(localStorage).some(function(k){ return k.indexOf(LS)===0 && k!==LS+"schemaVersion" && k!==LS+"lastBackupAt"; });
  var last = ls("lastBackupAt");
  var days = last ? daysSince(last) : null;
  var needsBackup = hasData && (last==null || (days!=null && days > BACKUP_REMINDER_DAYS));
  if(!needsBackup){ wrap.hidden = true; wrap.innerHTML = ""; return; }
  wrap.hidden = false;
  wrap.innerHTML = '<div class="callout" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">'+
    '<span>'+(last?"Seu último backup foi há "+days+" dias.":"Você ainda não baixou um backup dos seus dados.")+' Baixe um agora para não perder seu progresso.</span>'+
    '<button type="button" class="btn btn-accent" id="backupReminderBtn" style="width:auto;padding:8px 16px;font-size:12.8px;">Fazer backup</button>'+
    '</div>';
  document.getElementById("backupReminderBtn").addEventListener("click", openBackupModal);
}
function openBackupModal(){
  document.getElementById("backupStatus").textContent = "";
  document.getElementById("backupModal").hidden = false;
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
document.getElementById("heroBackupBtn").addEventListener("click", openBackupModal);
document.getElementById("exportPdfBtn").addEventListener("click", function(){ window.print(); });
document.querySelectorAll(".scroll-to-btn").forEach(function(btn){
  btn.addEventListener("click", function(){
    var target = document.getElementById(btn.dataset.scrollTarget);
    if(target) target.scrollIntoView({behavior:"smooth", block:"start"});
  });
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
  var html =
    'Perfil: <b>'+(p==="eu"?"cidadão UE": p==="non-eu"?"não-UE":"não definido")+'</b> · Cidade: <b>'+(cname||"não definida")+'</b>'+
    '<button class="btn btn-ghost profile-banner-edit" style="padding:7px 14px;font-size:12.5px;" type="button">Editar perfil</button>';
  var el = document.getElementById("profileBanner");
  if(!el) return;
  el.innerHTML = html;
  el.querySelector(".profile-banner-edit").addEventListener("click", openOnboarding);
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
  if(!p){ html = '<div class="callout" style="margin-bottom:20px;">Defina seu <a href="#inicio" onclick="location.hash=\'inicio\';showSection(\'inicio\');return false;">perfil de cidadania</a> para uma lista personalizada. Por enquanto, mostrando todos os itens.</div>' + html; }
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
  {id:"c3", when:"Mês 3", title:"Escolha da cidade e da escola", detail:"Compare Dublin, Cork e Galway; pesquise escolas de inglês credenciadas.", link:{sec:"inicio", label:"Ver perfil e cidade"}},
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
  var labels = {roteiro:"Meu Plano", imigracao:"Imigração", financas:"Finanças",
    trabalho:"Trabalho & estudo", ingles:"Inglês", acomodacao:"Acomodação", mercado:"Mercado", transporte:"Transporte",
    links:"Links oficiais", grupos:"Grupos", turismo:"Turismo"};
  if(!last || !labels[last]){ el.hidden = true; el.innerHTML=""; return; }
  el.hidden = false;
  el.innerHTML = '<button type="button" class="btn-ghost btn" style="width:auto;" onclick="location.hash=\''+last+'\';showSection(\''+last+'\');">↺ Continuar em '+labels[last]+'</button>';
}

/* ---------- overview ---------- */
function renderOverview(){
  renderNextStepCard();
  renderContinueCard();
  renderBackupReminder();
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
var VISTOS_VERIFIED_AT = "2026-09-08";
var F_FAQ = "https://www.irishimmigration.ie/coming-to-study-in-ireland/frequently-asked-questions-for-students/";
var F_BRVISA = "https://www.ireland.ie/en/brazil/saopaulo/services/visas/visas-for-ireland/";
var F_IRP = "https://www.irishimmigration.ie/registering-your-immigration-permission/how-to-register-your-immigration-permission-for-the-first-time/information-on-registering-your-immigration-permission-for-the-first-time/";
var F_FIN = "https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-options/a-fee-paying-private-primary-or-secondary-school/information-on-student-finances/";
var VISTOS = [
  {title:"Entrada e visto de estudante — antes de embarcar", eu:false, body:"Brasileiros com passaporte brasileiro são dispensados de visto para estadias curtas (turismo/visita) — mas isso <strong>não vale</strong> para a maioria dos cursos de inglês (6–8 meses, acima de 90 dias). Nesse caso, é preciso solicitar o visto de longa duração <strong>tipo D</strong> ANTES de viajar: não dá para entrar como turista e regularizar depois. O pedido é feito online no <strong>AVATS</strong> (sistema oficial de vistos irlandês); depois você agenda horário num centro <strong>VFS Global</strong> (parceiro oficial no Brasil) para entregar biometria, documentos e pagar a taxa. Processamento de <strong>4 a 8 semanas</strong> (pode demorar mais entre maio e agosto) — comece com antecedência e só compre passagens não-reembolsáveis depois do visto aprovado. Ao chegar, apresente o propósito de estudo e os documentos exigidos; a entrada final depende da avaliação da imigração. Outras nacionalidades podem ter regras diferentes — confira os requisitos do seu passaporte antes de comprar a passagem.", sourceUrl:F_BRVISA, verifiedAt:VISTOS_VERIFIED_AT},
  {title:"Stamp 2", eu:false, body:"Permissão de estudante para cursos elegíveis, incluindo inglês (em escola credenciada no ILEP) e ensino superior. A elegibilidade do curso e as condições da permissão precisam ser verificadas antes da matrícula. Não se aplica a cidadãos europeus, que têm liberdade de movimento.", sourceUrl:F_FAQ, verifiedAt:VISTOS_VERIFIED_AT},
  {title:"IRP: primeiro registro depois da chegada", eu:false, body:"Desde <strong>13/01/2025</strong>, o primeiro registro de residência de toda a República da Irlanda (não só Dublin) é feito pelo ISD em <strong>Burgh Quay, Dublin</strong>. Agende pelo canal oficial (conta no Digital Contact Centre) assim que chegar — não há prazo garantido para vaga. Agendar é gratuito; a taxa de registro do cartão pode ser de <strong>€300</strong>, paga só com cartão. Leve passaporte, formulário de endereço, carta da escola com matrícula e mensalidade paga, comprovação financeira e seguro-saúde.", sourceUrl:F_IRP, verifiedAt:VISTOS_VERIFIED_AT},
  {title:"Seguro-saúde exigido", eu:false, body:"Estudantes não europeus devem apresentar seguro médico privado adequado às condições da permissão — normalmente cobertura mínima de <strong>€25.000 para acidente e €25.000 para doença</strong>, válida por todo o período. Confira cobertura, exclusões e documentos aceitos com o ISD antes de contratar; seguro de viagem e seguro médico não são automaticamente equivalentes.", sourceUrl:F_FAQ, verifiedAt:VISTOS_VERIFIED_AT},
  {title:"Comprovação financeira", eu:false, body:"Para estudantes dispensados de visto de entrada, o valor oficial exigido pelo ISD é de <strong>€6.665</strong> para permanências de até oito meses — esse é o total que precisa estar disponível na conta que você vai apresentar à imigração (o cálculo é €833/mês × 8, mas o que importa é ter esse saldo completo na conta, não um fluxo mensal). Acima de oito meses, o valor sobe para <strong>€10.000 por ano acadêmico</strong>. Para quem precisa de visto, a comprovação ocorre no próprio pedido do visto, conforme as regras da categoria. O extrato não deve ter mais de 90 dias, e depósitos grandes recentes sem explicação podem levantar suspeita. O mínimo migratório não substitui um orçamento pessoal e não deve depender de conseguir emprego.", sourceUrl:F_FIN, verifiedAt:VISTOS_VERIFIED_AT},
  {title:"Limite de horas de trabalho", eu:false, body:"Com Stamp 2: até <strong>20 horas semanais</strong> no período regular, e até <strong>40 horas semanais</strong> durante os períodos de férias padronizados — <strong>junho a setembro (inclusive)</strong> e de <strong>15 de dezembro a 15 de janeiro</strong>. Férias individuais da escola fora dessas datas não liberam automaticamente as 40 horas.", sourceUrl:F_FAQ, verifiedAt:VISTOS_VERIFIED_AT},
  {title:"Na prática: sobreviver com 20h", eu:false, body:"20h/semana no salário mínimo dá pouco mais de €1.100–1.200/mês líquidos — apertado nas cidades mais caras, ainda mais em Dublin. É comum ver intercambista trabalhando além do limite oficial pra fechar a conta, mas isso é uma violação da permissão de estudo: o risco real é perder o Stamp 2/IRP e complicar pedidos migratórios futuros (inclusive em outros países). Se for pra fechar as contas, priorize aumentar horas nos períodos de férias liberadas (40h) e ajustar o orçamento antes de contar com horas extras informais."},
  {title:"Renovação e continuidade dos estudos", eu:false, body:"Cursos de inglês têm teto de <strong>2 anos cumulativos</strong> (até 3 matrículas de 8 meses). Para renovar: matricule-se num curso de nível superior de pelo menos 25 semanas, comprove frequência mínima de 15h/semana no curso anterior, tenha frequentado pelo menos 85% das aulas, e apresente resultado do exame de fim de curso. Planeje a renovação antes do vencimento — não presuma que um curso noturno ou parcial mantém a mesma permissão.", sourceUrl:F_FAQ, verifiedAt:VISTOS_VERIFIED_AT},
  {title:"Para cidadãos europeus", eu:true, body:"Como cidadão da UE/EEE/Suíço, você não precisa de visto, Stamp 2, IRP nem Employment Permit, e não há limite de horas ligado ao curso. O foco vai para documentação prática, PPSN, moradia, saúde e adaptação."}
];
var TRABALHO = [
  {title:"PPS Number (PPSN)", body:"Identificação fiscal e de serviços na Irlanda. Peça depois de chegar, com uma justificativa clara (ex.: proposta de emprego). Agende pelo MyWelfare.ie e leve identidade, comprovante de endereço e a justificativa.", sourceUrl:"https://www.mywelfare.ie", verifiedAt:VISTOS_VERIFIED_AT},
  {title:"MyGovID", body:"Conta verificada do governo irlandês, necessária para usar o Revenue myAccount completo, o MyWelfare e boa parte dos serviços públicos online. Depois de ter o PPSN, crie uma conta básica (nível 1) em mygovid.ie; para acessar mais serviços, faça a verificação nível 2 (por vídeo-chamada ou correspondência).", sourceUrl:"https://www.mygovid.ie", verifiedAt:VISTOS_VERIFIED_AT},
  {title:"Revenue &amp; myAccount", body:"Registre o primeiro emprego o quanto antes no Revenue (myAccount) para evitar o 'Emergency Tax' — imposto temporário mais alto cobrado até você ser regularizado.", sourceUrl:"https://www.revenue.ie", verifiedAt:VISTOS_VERIFIED_AT},
  {title:"Salário mínimo nacional (2026)", body:"Desde 1º de janeiro de 2026: <strong>€14,15/hora</strong> a partir de 20 anos; €12,74 aos 19 anos; €11,32 aos 18 anos; €9,91 para menores de 18. Há previsão de reajuste para €14,94/hora a partir de janeiro de 2027 — confirme o valor vigente antes de assinar contrato. Quem trabalha em limpeza terceirizada (contract cleaning) tem piso setorial maior: €14,80/hora a partir de 20 anos, €13,32 aos 19, €11,84 aos 18 e €10,36 para menores de 18.", sourceUrl:"https://www.workplacerelations.ie", verifiedAt:VISTOS_VERIFIED_AT},
  {title:"Direitos trabalhistas básicos", body:"Contrato/termo de emprego por escrito logo no início (essenciais em até 5 dias, o restante em até 1 mês), recibo de pagamento (payslip) a cada pagamento, pausas durante o expediente e período mínimo de férias remuneradas proporcional. Jornada média máxima geral de 48h/semana; intervalo de 15 min após mais de 4h30 trabalhadas e de 30 min (total) após mais de 6h. A Irlanda tem 10 feriados públicos e, desde 2026, 5 dias de sick leave pagos por ano após 13 semanas de casa. Gorjeta não pode ser usada para completar o salário mínimo contratual. Guarde contratos, escalas e payslips.", sourceUrl:"https://www.workplacerelations.ie", verifiedAt:VISTOS_VERIFIED_AT},
  {title:"Golpes em vagas de emprego", body:"Nunca pague para \"garantir\" uma vaga. Confirme o domínio do e-mail e candidate-se sempre pelo portal oficial da empresa. Desconfie de entrevista feita só por mensagem, pedido de criptomoeda/gift card ou de compra antecipada de equipamento. Uma agência legítima informa o empregador, o local e a forma de pagamento — o candidato normalmente não paga taxa à agência por uma vaga. Nunca entregue o passaporte original a empregador ou agência."}
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
    {name:"Emerald Cultural Institute", rating:4.3, reviews:101, morning:375, afternoon:null, evening:null, note:"Turmas menores e apoio acadêmico forte; custo alto. eci.ie"},
    {name:"ISI Dublin", rating:null, reviews:null, morning:230, afternoon:195, evening:null, note:"Semi-intensivo €310/sem, intensivo €390/sem. Jobs Club e apoio de carreira, 4 prêmios StudyTravel Star. 39 Parnell Square West, Dublin 1. studyinireland.ie"},
    {name:"ISE — International School of English", rating:null, reviews:null, morning:150, afternoon:null, evening:null, note:"Semi-intensivo 20h €200/sem, intensivo 30h €250/sem. Jobs Club e orientação de emprego. 26 Harcourt St / 66 Camden St Lower, Dublin 2. iseireland.ie"},
    {name:"Apollo Language Centre", rating:null, reviews:null, morning:295, afternoon:null, evening:null, note:"25h (Plus) sob consulta. Turma máx. 15, lição de 60 min, sem suplemento de verão. 5 Lad Lane, Dublin 2. apollolanguagecentre.com"},
    {name:"CES Dublin", rating:null, reviews:null, morning:355, afternoon:200, evening:null, note:"Intensivo 26 lições €425/sem. Rede CES, centro CELTA/Cambridge/IELTS. Study & Work 25+8 sem: €6.750 manhã. ces-schools.com"},
    {name:"EC Dublin", rating:null, reviews:null, morning:380, afternoon:null, evening:null, note:"A partir de €380/sem (preço varia por data/duração). English for Work a partir de €445/sem. Rathmines, Dublin 6. ecenglish.com"},
    {name:"ILSC Dublin", rating:null, reviews:null, morning:300, afternoon:null, evening:null, note:"Dublin Experience (30 lições) €400/sem. Study & Work 33 sem: €6.000 manhã ou €5.750 tarde. ilsc.com"}
  ],
  cork: [
    {name:"Cork English Academy", rating:null, reviews:null, morning:150, afternoon:120, evening:null, note:"Preço da faixa 2–4 semanas (cai p/ €100/€80 em 25+ sem). Matrícula €65 + material €50. 2 Drinan Street, Cork City. corkenglishacademy.com"},
    {name:"Cork English College", rating:null, reviews:null, morning:null, afternoon:null, evening:null, note:"Oferece standard, intensivo e noturno. Matrícula €75 + material €75 — consulte o site para valor semanal atualizado. corkenglishcollege.com"},
    {name:"Cork English World", rating:null, reviews:null, morning:null, afternoon:null, evening:null, note:"Mínimo 20h/semana de prática. Crawford Business Park, Bishop St. Consulte o site para valor semanal atualizado. cew.ie"},
    {name:"CES Cork (antiga ACET)", rating:null, reviews:null, morning:285, afternoon:185, evening:null, note:"Intensivo €350/sem. ACET foi adquirida pela CES em 2024. 16 St Patrick's Place, Wellington Road, Cork. ces-schools.com"},
    {name:"UCC Language Centre", rating:null, reviews:null, morning:315, afternoon:null, evening:null, note:"16 lições ≈€250/sem. Campus universitário (UCC), programas TrustEd Ireland. O'Rahilly Building. ucc.ie/en/esol"},
    {name:"Griffith Institute of Language — Cork", rating:null, reviews:null, morning:null, afternoon:null, evening:null, note:"Preço sob consulta (não usar tabelas antigas de 2019). General English 15h manhã, campus de faculdade. Wellington Road, Cork. griffith.ie"}
  ],
  galway: [
    {name:"Atlantic Language Galway", rating:null, reviews:null, morning:400, afternoon:null, evening:null, note:"15h/semana (20 aulas). Fairgreen House, Fairgreen Road. atlanticlanguage.com"},
    {name:"Galway Cultural Institute (GCI)", rating:null, reviews:null, morning:290, afternoon:220, evening:null, note:"Curso estendido de 26 aulas: €360/sem. Preços caem após 12 sem. Matrícula €70 + material €75. gci.ie"},
    {name:"Bridge Mills Galway (IH Galway)", rating:null, reviews:null, morning:225, afternoon:null, evening:null, note:"EG30 (sazonal, abr-set) €305/sem. Passou a integrar a rede International House em 2025. The Bridge Mills, Galway. galwaylanguage.com"},
    {name:"Corrib English", rating:null, reviews:null, morning:null, afternoon:null, evening:null, note:"Preço sob consulta. Turmas de até 8 alunos, part-time — boa opção para residente/cidadão UE. Merchant's Road, Galway city centre. corribenglish.com"},
    {name:"Galway English Academy", rating:null, reviews:null, morning:200, afternoon:null, evening:null, note:"Intensivo 30h a partir de €375/sem. Turma máx. 8, materiais inclusos, sem matrícula. Galway city centre. galwayenglishacademy.com"},
    {name:"University of Galway — English Language Centre", rating:null, reviews:null, morning:null, afternoon:null, evening:null, note:"Pre-sessional acadêmico, preço sob consulta. Unidade oficial da universidade, autorizada TrustEd Ireland. Campus Newcastle. universityofgalway.ie/englishlanguage"}
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
function euBadge(eu){
  if(eu===true) return '<span class="pill" style="background:var(--accent-soft);color:var(--accent-strong);margin-left:8px;">🇪🇺 UE/EEE</span>';
  if(eu===false) return '<span class="pill" style="background:var(--warn-soft);color:var(--warn-strong);margin-left:8px;">🌎 Não-UE</span>';
  return "";
}
function renderVistos(){
  var p = getProfile();
  var shown = VISTOS.filter(function(v){
    if(v.eu===true) return p!=="non-eu"; if(v.eu===false) return p!=="eu"; return true;
  });
  document.getElementById("vistosWrap").innerHTML = shown.map(function(v){
    return '<div class="card"><h3>'+v.title+euBadge(v.eu)+'</h3><p style="margin:0;">'+v.body+'</p>'+officialSourceHtml(v.sourceUrl, v.verifiedAt)+'</div>';
  }).join("");
  var withSource = shown.filter(function(v){ return v.verifiedAt; });
  var staleWrap = document.getElementById("vistosStaleWrap");
  if(staleWrap){
    staleWrap.innerHTML = withSource.length ? '<div class="callout" style="margin-bottom:16px;">'+sourceVerifiedNote(oldestVerifiedAt(withSource))+'</div>' : "";
  }
}
function renderTrabalho(){
  document.getElementById("trabalhoWrap").innerHTML = TRABALHO.map(function(t){
    return '<div class="card"><h3>'+t.title+'</h3><p style="margin:0;">'+t.body+'</p>'+officialSourceHtml(t.sourceUrl, t.verifiedAt)+'</div>';
  }).join("");
}
function renderCursoRegras(){
  var p = getProfile();
  document.getElementById("cursoRegrasWrap").innerHTML = CURSO_REGRAS.filter(function(c){
    if(c.eu===true) return p!=="non-eu"; if(c.eu===false) return p!=="eu"; return true;
  }).map(function(c){ return '<div class="card"><h3>'+c.title+euBadge(c.eu)+'</h3><p style="margin:0;">'+c.body+'</p></div>'; }).join("");
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
/* ---------- como escolher uma escola ---------- */
var COMO_ESCOLHER_ESCOLA = [
  {t:"Tipos de curso", b:'<b>General English</b> — foco em conversação, gramática e vocabulário do dia a dia; é o mais comum e mais barato. <b>Intensive English</b> — mais horas por semana, evolução mais rápida, custo mais alto. <b>IELTS/Cambridge</b> — preparação para exames de proficiência, útil se você vai precisar de certificado (trabalho, universidade, imigração para outro país). <b>Study & Work</b> — pacote com curso + apoio voltado a intercambistas não-UE, geralmente mais longo e mais caro; confira exatamente o que está incluído antes de comparar preço.'},
  {t:"O horário da escola influencia seu trabalho", b:"<b>Manhã</b> libera tarde e noite pra trabalhar — o mais comum entre intercambistas. <b>Tarde</b> libera manhã e noite. <b>Noite</b> (2–3x/semana) é mais leve e costuma ser usada por quem já trabalha em horário comercial. Pense no emprego que pretende buscar antes de escolher o turno."},
  {t:"Horas semanais", b:"Cursos de 15h/semana costumam ser o mínimo aceito para o visto de estudante (não-UE). Cursos intensivos passam de 20h/semana — aceleram o aprendizado, mas custam mais e sobra menos tempo livre para trabalhar."},
  {t:"Matrícula e material", b:"Quase toda escola cobra uma taxa de matrícula (enrollment fee) única, além do material didático — peça os dois valores separados da mensalidade antes de comparar preços entre escolas."},
  {t:"Política de cancelamento", b:"Pergunte por escrito o que acontece se você quiser trocar de escola, adiar o início ou cancelar — prazos e valores de reembolso variam bastante entre escolas."},
  {t:"Acreditação", b:"Para o curso valer como base do visto de estudante, a escola precisa constar na lista oficial ILEP. Fora do visto de estudante, selos como ACELS, Cambridge English ou IALC são um bom sinal de qualidade."},
  {t:"Tamanho das turmas", b:"Turmas menores (8–12 alunos) tendem a dar mais prática de fala; turmas maiores costumam ser mais baratas. Pergunte a média de alunos por turma antes de decidir."}
];
function renderComoEscolherEscola(){
  var wrap = document.getElementById("comoEscolherEscolaWrap");
  if(!wrap) return;
  wrap.innerHTML = '<div class="card">'+
    COMO_ESCOLHER_ESCOLA.map(function(i,idx){
      return '<details class="acc-item"'+(idx===0?" open":"")+'><summary>'+i.t+'</summary><p style="margin:10px 0 0;font-size:13.3px;line-height:1.6;">'+i.b+'</p></details>';
    }).join("")+
    '</div>';
}

/* ---------- assessoria: vale a pena? ---------- */
var ASSESSORIA_PERGUNTAS = [
  "Qual escola está incluída?",
  "Há taxa da agência, separada da escola?",
  "Seguro está incluído?",
  "Acomodação está incluída — por quantos dias/semanas?",
  "Transfer do aeroporto está incluído?",
  "Quais documentos eles auxiliam a preparar?",
  "Existe suporte depois da chegada?",
  "O \"suporte para emprego\" significa orientação ou garantia de vaga?",
  "Existe política de cancelamento?",
  "Como funciona o reembolso, e em quanto tempo?"
];
function renderAssessoria(){
  var wrap = document.getElementById("assessoriaWrap");
  if(!wrap) return;
  wrap.innerHTML =
    '<p class="source-note" style="margin-bottom:14px;">Algumas pessoas preferem contratar uma empresa de intercâmbio para ajudar com escola, visto e chegada; outras preferem organizar tudo sozinhas. Não existe resposta certa — depende do seu tempo, orçamento e conforto com burocracia em inglês.</p>'+
    '<div class="grid cols-2" style="margin-bottom:16px;">'+
      '<div class="card"><h3>Fazer sozinho</h3><ul style="margin:0;padding-left:20px;font-size:13.3px;line-height:1.8;">'+
        '<li>Maior autonomia nas escolhas.</li><li>Possibilidade de pesquisar e comparar preços diretamente.</li>'+
        '<li>Exige mais tempo de estudo e organização.</li><li>Você mesmo cuida de escola, documentos e acomodação.</li>'+
      '</ul></div>'+
      '<div class="card"><h3>Com assessoria</h3><ul style="margin:0;padding-left:20px;font-size:13.3px;line-height:1.8;">'+
        '<li>Suporte durante o processo.</li><li>Pode facilitar a contratação da escola.</li>'+
        '<li>Pode incluir acomodação inicial.</li><li>Pode ajudar com documentação.</li>'+
        '<li>Serviços e preços variam bastante entre empresas — vale comparar mais de uma.</li>'+
      '</ul></div>'+
    '</div>'+
    '<div class="card"><h3>Pergunte antes de fechar</h3><ul style="margin:0;padding-left:20px;font-size:13.3px;line-height:1.9;">'+
      ASSESSORIA_PERGUNTAS.map(function(p){ return "<li>"+p+"</li>"; }).join("")+
    '</ul></div>';
}

/* ---------- trabalhos comuns para quem chega ---------- */
var JOB_TYPE_CATS = [
  {id:"todos", l:"Todos"},
  {id:"hospitality", l:"Hotelaria & alimentação"},
  {id:"varejo", l:"Varejo & logística"},
  {id:"escritorio", l:"Escritório & atendimento"},
  {id:"industria", l:"Indústria & tecnologia"}
];
var jobTypeCatView = ls("jobTypeCatView") || "todos";
var JOB_TYPES_COMMON = [
  {title:"Cleaner", cat:"hospitality", ingles:"Básico", desc:"Limpeza residencial, comercial ou de escritórios.", turno:"Manhã ou noite, meio período comum."},
  {title:"Kitchen Porter", cat:"hospitality", ingles:"Básico", desc:"Apoio na cozinha — lavar louça, organizar, limpeza.", turno:"Turnos variados, inclui fins de semana."},
  {title:"Housekeeping", cat:"hospitality", ingles:"Básico", desc:"Arrumação de quartos em hotéis.", turno:"Diurno, ritmo físico."},
  {title:"Accommodation Assistant", cat:"hospitality", ingles:"Básico/Intermediário", desc:"Apoio na recepção e manutenção de acomodações e hotéis.", turno:"Turnos variados."},
  {title:"Barista", cat:"hospitality", ingles:"Básico/Intermediário", desc:"Preparo de bebidas e atendimento em cafeterias.", turno:"Manhã é mais concorrida; fins de semana comuns."},
  {title:"Waiter / Waitress", cat:"hospitality", ingles:"Intermediário", desc:"Atendimento de mesas em restaurantes.", turno:"Noites e fins de semana concentram a demanda."},
  {title:"Bartender", cat:"hospitality", ingles:"Intermediário", desc:"Preparo de bebidas em bares e pubs.", turno:"Noturno — geralmente pede alguma experiência prévia."},
  {title:"Catering Assistant", cat:"hospitality", ingles:"Básico", desc:"Apoio em eventos e serviços de alimentação em larga escala.", turno:"Escalas variam por evento."},
  {title:"Deli Assistant", cat:"varejo", ingles:"Básico/Intermediário", desc:"Atendimento no balcão de frios/rotisserie em supermercados.", turno:"Diurno, inclui fins de semana."},
  {title:"Retail Assistant", cat:"varejo", ingles:"Básico/Intermediário", desc:"Atendimento e reposição em lojas.", turno:"Turnos variados, inclui noite em algumas redes."},
  {title:"Stock Assistant", cat:"varejo", ingles:"Básico", desc:"Reposição e organização de estoque em lojas e supermercados.", turno:"Muitas vagas de madrugada/manhã cedo."},
  {title:"Warehouse Operative", cat:"varejo", ingles:"Básico", desc:"Separação e movimentação de mercadorias em centros de distribuição.", turno:"Turnos fixos, inclui madrugada."},
  {title:"Picker / Packer", cat:"varejo", ingles:"Básico", desc:"Separação e embalagem de pedidos — comum em logística e e-commerce.", turno:"Turnos fixos, inclui madrugada e fim de semana."},
  {title:"Delivery", cat:"varejo", ingles:"Básico", desc:"Entregas por bike, moto ou carro via aplicativos.", turno:"Flexível — você escolhe quando se conectar."},
  {title:"General Operative", cat:"industria", ingles:"Básico", desc:"Função de apoio geral em fábricas e linhas de produção.", turno:"Turnos fixos (manhã/tarde/noite), inclui rotativo."},
  {title:"Manufacturing", cat:"industria", ingles:"Básico/Intermediário", desc:"Operação em linhas de produção industrial.", turno:"Turnos fixos ou rotativos."},
  {title:"Medical Devices", cat:"industria", ingles:"Intermediário", desc:"Produção, montagem ou controle de qualidade em fábricas de dispositivos médicos — setor forte em Galway e Cork.", turno:"Turnos fixos; alguns exigem treinamento inicial."},
  {title:"Receptionist", cat:"escritorio", ingles:"Intermediário/Avançado", desc:"Recepção em escritórios, clínicas ou hotéis — exige boa comunicação.", turno:"Comercial, geralmente fixo."},
  {title:"Customer Service", cat:"escritorio", ingles:"Intermediário/Avançado", desc:"Atendimento por telefone ou chat — muitas vagas multilíngues; português e italiano costumam ser diferencial.", turno:"Comercial ou escalas rotativas conforme fuso do cliente."},
  {title:"Administration", cat:"escritorio", ingles:"Intermediário/Avançado", desc:"Apoio administrativo em escritórios.", turno:"Comercial."},
  {title:"IT Support", cat:"industria", ingles:"Avançado", desc:"Suporte técnico e help desk — inglês técnico e clareza contam mais que sotaque perfeito.", turno:"Comercial ou plantão, conforme empresa."},
  {title:"Tecnologia", cat:"industria", ingles:"Avançado", desc:"Desenvolvimento, dados e produto — setor mais concorrido, geralmente pede experiência prévia.", turno:"Comercial; home office comum."}
];
function renderJobTypeCatTabs(){
  var wrap = document.getElementById("jobTypeCatTabs");
  if(!wrap) return;
  wrap.innerHTML = JOB_TYPE_CATS.map(function(c){
    return '<button class="subtab'+(jobTypeCatView===c.id?' active':'')+'" data-cat="'+c.id+'">'+c.l+'</button>';
  }).join("");
  wrap.querySelectorAll(".subtab").forEach(function(b){
    b.addEventListener("click", function(){ jobTypeCatView = b.dataset.cat; ls("jobTypeCatView", jobTypeCatView); renderJobTypeCatTabs(); renderJobTypesGrid(); });
  });
}
function renderJobTypesGrid(){
  var wrap = document.getElementById("jobTypesGrid");
  if(!wrap) return;
  var shown = jobTypeCatView==="todos" ? JOB_TYPES_COMMON : JOB_TYPES_COMMON.filter(function(j){ return j.cat===jobTypeCatView; });
  wrap.innerHTML = shown.map(function(j){
    return '<div class="exp-card"><h4>'+j.title+' <span class="pill" style="background:var(--accent-soft);color:var(--accent-strong);font-size:10.5px;">'+j.ingles+'</span></h4>'+
      '<p>'+j.desc+'</p><p class="source-note" style="margin-top:6px;">'+j.turno+'</p></div>';
  }).join("");
}
function renderJobTypes(){
  var wrap = document.getElementById("jobTypesWrap");
  if(!wrap) return;
  wrap.innerHTML = '<p class="source-note" style="margin-bottom:14px;">Panorama geral de vagas comuns pra quem está começando — não é promessa de contratação, requisitos variam por empresa. Para empresas específicas que contratam em cada área, veja "Vagas de entrada rápida" e "Agências de recrutamento" logo abaixo.</p>'+
    '<div class="subtabs" id="jobTypeCatTabs" style="margin-bottom:12px;"></div>'+
    '<div class="grid cols-3" id="jobTypesGrid"></div>';
  renderJobTypeCatTabs();
  renderJobTypesGrid();
}

/* ---------- glossario ---------- */
var GLOSSARIO_TERMS = [
  {t:"PPSN", d:"Personal Public Service Number — número de identificação usado para trabalho, impostos e serviços públicos na Irlanda."},
  {t:"Revenue", d:"Órgão da receita federal irlandesa — responsável por impostos e pelo registro do seu emprego."},
  {t:"PAYE", d:"Pay As You Earn — sistema pelo qual o imposto de renda é descontado direto do seu salário pelo empregador."},
  {t:"USC", d:"Universal Social Charge — imposto adicional sobre a renda, descontado junto com o PAYE."},
  {t:"PRSI", d:"Pay Related Social Insurance — contribuição para a previdência social irlandesa, também descontada do salário."},
  {t:"IRP", d:"Irish Residence Permit — cartão de residência que comprova seu registro como imigrante na Irlanda."},
  {t:"Stamp 1", d:"Carimbo de imigração para quem tem permissão de trabalho vinculada a um empregador (Employment Permit)."},
  {t:"Stamp 2", d:"Carimbo de imigração para estudantes internacionais matriculados em curso elegível."},
  {t:"Stamp 4", d:"Carimbo de imigração com direito de trabalhar sem restrições, sem precisar de Employment Permit."},
  {t:"Employment Permit", d:"Autorização de trabalho emitida pelo governo para contratar um profissional de fora da UE/EEE para uma vaga específica."},
  {t:"Leap Card", d:"Cartão de transporte público recarregável, aceito em ônibus, Luas e DART nas principais cidades."},
  {t:"Luas", d:"Sistema de VLT (bonde/light rail) de Dublin, com linhas Vermelha e Verde."},
  {t:"DART", d:"Trem suburbano que liga a costa de Dublin, de Malahide/Howth até Greystones."},
  {t:"GP", d:"General Practitioner — médico de família/clínico geral, geralmente o primeiro contato do sistema de saúde."},
  {t:"En-suite", d:"Quarto com banheiro privativo dentro do próprio cômodo."},
  {t:"Bills included", d:"Anúncio de acomodação em que o aluguel já inclui contas de água, luz, gás e internet."},
  {t:"Viewing", d:"Visita presencial (ou por vídeo) a um imóvel antes de fechar o aluguel — recomendada sempre que possível."},
  {t:"Deposit", d:"Depósito de segurança pago no início do aluguel, devolvido ao final se o imóvel for entregue em condições."},
  {t:"Accommodation Assistant", d:"Função de apoio na recepção e manutenção de hotéis ou acomodações estudantis."},
  {t:"Kitchen Porter", d:"Função de apoio na cozinha de restaurantes e hotéis — lavar louça, organizar, limpeza."},
  {t:"Warehouse Operative", d:"Função de separação e movimentação de mercadorias em centros de distribuição."}
];
function renderGlossario(filter){
  var wrap = document.getElementById("glossarioWrap");
  if(!wrap) return;
  var f = (filter||"").trim().toLowerCase();
  var shown = f ? GLOSSARIO_TERMS.filter(function(g){ return g.t.toLowerCase().indexOf(f)>-1 || g.d.toLowerCase().indexOf(f)>-1; }) : GLOSSARIO_TERMS;
  wrap.innerHTML = shown.length ? shown.map(function(g){
    return '<div class="card" style="padding:16px 18px;"><h3 style="font-size:15px;margin-bottom:4px;">'+g.t+'</h3><p style="margin:0;font-size:13.3px;">'+g.d+'</p></div>';
  }).join("") : '<div class="empty">Nenhum termo encontrado — tente outra palavra.</div>';
}
document.getElementById("glossarioSearch").addEventListener("input", function(e){ renderGlossario(e.target.value); });

var JOB_ROLES = [{id:"cleaner",l:"Cleaner (limpeza)"},{id:"barista",l:"Barista"},{id:"hotelaria",l:"Hotelaria"},{id:"varejo",l:"Varejo"},{id:"logistica",l:"Logística/warehouse"},{id:"atendimento",l:"Atendimento/call center"},{id:"delivery",l:"Delivery"},{id:"ti",l:"TI/suporte"}];
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
  },
  hotelaria: {
    tips:"Destaque flexibilidade de turnos (incluindo fins de semana e feriados), atenção a detalhes e disposição para aprender. Vagas de accommodation assistant e kitchen porter costumam pedir pouca ou nenhuma experiência prévia.",
    companies:[
      {name:"Dalata Hotel Group (Clayton/Maldron)", note:"Maior rede hoteleira irlandesa, com hotéis em Dublin, Cork e Galway — boa porta de entrada."},
      {name:"MHL Hotel Collection", note:"Rede com unidades em várias cidades, incluindo o Galmont em Galway."},
      {name:"The Doyle Collection", note:"Hotéis de padrão mais alto, principalmente em Dublin."},
      {name:"Leonardo Hotels / Hilton / Marriott / Accor / Radisson", note:"Redes internacionais com unidades nas três cidades — procure vagas de accommodation assistant, kitchen porter, food & beverage e recepção."}
    ]
  },
  varejo: {
    tips:"Destaque disponibilidade para turnos variados (incluindo noite e fim de semana) e experiência com atendimento, mesmo que informal. Boa porta de entrada para quem ainda está pegando fluência.",
    companies:[
      {name:"Tesco", note:"Uma das maiores redes de supermercado — vagas frequentes de customer assistant e night pack."},
      {name:"Dunnes Stores", note:"Rede irlandesa de varejo, com lojas em todo o país."},
      {name:"Lidl / Aldi", note:"Redes de supermercado com vagas de sales/stock assistant, presença nas três cidades."},
      {name:"Penneys/Primark", note:"Rede de moda com grande volume de contratação de sales assistant."},
      {name:"SuperValu / Centra", note:"Redes de conveniência com lojas em quase todos os bairros."},
      {name:"Boots", note:"Farmácia/perfumaria com vagas de customer assistant."}
    ]
  },
  logistica: {
    tips:"Destaque disponibilidade para turnos (incluindo madrugada/noite) e disposição física para o trabalho. CNH e experiência com forklift são diferenciais, mas não sempre exigidos para picker/packer.",
    companies:[
      {name:"An Post", note:"Correios nacionais — vagas de entrega e triagem em todo o país."},
      {name:"DPD / DHL / UPS / GLS", note:"Transportadoras internacionais com centros de distribuição nas três cidades."},
      {name:"Musgrave", note:"Grande distribuidor de alimentos (dono de SuperValu/Centra) — vagas de warehouse operative."},
      {name:"Amazon", note:"Centros de distribuição com vagas de warehouse operative e picker/packer, principalmente na região de Dublin."}
    ]
  },
  atendimento: {
    tips:"Português e italiano nativos costumam ser diferencial forte nesse setor — muitas empresas atendem clientes de vários países da Europa a partir da Irlanda. Inglês B2+ geralmente é esperado para o trabalho interno.",
    companies:[
      {name:"Concentrix", note:"Uma das maiores operações de customer support multilíngue na Irlanda."},
      {name:"TELUS Digital", note:"Contrata falantes de português/italiano para suporte e moderação de conteúdo."},
      {name:"Accenture", note:"Grandes operações de suporte e back office em Dublin."},
      {name:"Apple (Cork)", note:"Suporte ao cliente multilíngue com grande operação em Cork."},
      {name:"Fidelity Investments / Genesys / Diligent (Galway)", note:"Empresas com equipes de suporte/atendimento em Galway."}
    ]
  },
  delivery: {
    tips:"Boa opção para complementar renda com horário flexível. Confirme se o veículo (bike, moto ou carro) e o seguro exigidos estão de acordo com o que a plataforma pede antes de começar.",
    companies:[
      {name:"Deliveroo", note:"Entrega por bike/moto/carro, cadastro pelo app."},
      {name:"Just Eat", note:"Uma das maiores plataformas de delivery de comida na Irlanda."},
      {name:"Uber Eats", note:"Cadastro pelo app, flexibilidade de horário."}
    ]
  },
  ti: {
    tips:"Inglês técnico e clareza para explicar problemas contam mais do que sotaque perfeito. Certificações (ex.: CompTIA, ITIL) e um portfólio/GitHub ajudam para quem vem de TI no Brasil.",
    companies:[
      {name:"Version 1 / NTT DATA", note:"Consultorias de TI com forte presença em Dublin, boas portas de entrada para suporte técnico."},
      {name:"Google / Microsoft / Amazon (AWS) / Meta", note:"Grandes empresas de tecnologia com operações em Dublin — nível de entrada costuma ser concorrido."},
      {name:"Dell Technologies / Apple / Trend Micro (Cork)", note:"Grande presença de TI e suporte técnico em Cork."},
      {name:"HPE / Cisco / SAP / MathWorks (Galway)", note:"Empresas de tecnologia com operações em Galway, incluindo o polo do PorterShed/Galway Technology Centre."}
    ]
  }
};
var AGENCIAS = [
  {name:"Excel Recruitment", url:"https://www.excelrecruitment.com/", desc:"Hotelaria, varejo, industrial e warehouse — cobertura nas três cidades."},
  {name:"Cpl", url:"https://www.cpl.com/ie", desc:"Customer service multilíngue, tecnologia, pharma e escritório."},
  {name:"Hays Ireland", url:"https://www.hays.ie/", desc:"Escritório, construção, finanças e TI."},
  {name:"Adecco Ireland", url:"https://www.adecco.ie/", desc:"Temporário, operações, atendimento e indústria."},
  {name:"Manpower Ireland", url:"https://www.manpower.ie/", desc:"Temporário, operações, atendimento e indústria."},
  {name:"Morgan McKinley", url:"https://www.morganmckinley.com/ie/jobs", desc:"Profissional, tecnologia, finanças e operações — forte presença em Cork."},
  {name:"Sigmar Recruitment", url:"https://www.sigmarrecruitment.com/", desc:"Escritório, vendas, finanças, supply chain e TI."},
  {name:"FRS Recruitment", url:"https://www.frsrecruitment.com/", desc:"Cobertura regional, boa presença fora de Dublin."},
  {name:"Osborne", url:"https://osborne.ie/", desc:"Escritório, vendas, finanças, supply chain e TI."}
];
function renderAgencias(){
  var wrap = document.getElementById("agenciasWrap");
  if(!wrap) return;
  wrap.innerHTML = AGENCIAS.map(function(a){
    var fav = faviconUrl(a.url);
    return '<a class="linkcard" href="'+a.url+'" target="_blank" rel="noopener"><div class="linkcard-icon">'+LINK_ICONS.briefcase+(fav?'<img class="linkcard-favicon" src="'+fav+'" alt="" loading="lazy" onerror="this.remove()">':'')+'</div><h4>'+a.name+'</h4><p>'+a.desc+'</p><span class="linkcard-arrow">↗</span></a>';
  }).join("");
}
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

/* ---------- inglês ---------- */
var ENGLISH_LEVELS = [
  {id:"a1", label:"A1", desc:"Iniciante — frases básicas do dia a dia."},
  {id:"a2", label:"A2", desc:"Básico — situações rotineiras simples."},
  {id:"b1", label:"B1", desc:"Intermediário — conversas e textos do cotidiano."},
  {id:"b2", label:"B2", desc:"Intermediário avançado — argumentar e detalhar ideias."}
];
var ENGLISH_TOPICS = {
  a1: [
    {id:"a1-verbtobe", title:"Verb to be (am / is / are)", body:"Usado para identidade, nacionalidade e descrições. Ex.: <i>I am Brazilian. She is a student.</i>"},
    {id:"a1-presentsimple", title:"Present Simple", body:"Rotinas e fatos. Ex.: <i>I work on Mondays. She lives in Dublin.</i>"},
    {id:"a1-articles", title:"Artigos (a / an / the)", body:"\"a/an\" para algo não específico, \"the\" para algo já conhecido. Ex.: <i>I have a room. The room is small.</i>"},
    {id:"a1-numbers", title:"Números e horas", body:"Essencial para preços, horários e endereços. Ex.: <i>It's half past nine. That's twelve euros.</i>"},
    {id:"a1-thereis", title:"There is / there are", body:"Dizer o que existe em um lugar. Ex.: <i>There's a desk next to the window. Is there a pharmacy nearby?</i>"},
    {id:"a1-canpolite", title:"Can / could — pedidos educados", body:"\"Could you...?\" costuma soar mais educado que \"Can you...?\", mas os dois são comuns. Ex.: <i>Could you repeat that, please?</i>"}
  ],
  a2: [
    {id:"a2-pastsimple", title:"Past Simple", body:"Ações concluídas no passado. Ex.: <i>I arrived last week. I didn't have a SIM card yet.</i>"},
    {id:"a2-future", title:"Futuro (going to / will)", body:"\"going to\" para planos já decididos, \"will\" para decisões espontâneas. Ex.: <i>I'm going to apply for a PPSN. I'll call them now.</i>"},
    {id:"a2-comparatives", title:"Comparativos e superlativos", body:"Comparar preços, cidades, empregos. Ex.: <i>Dublin is more expensive than Cork. This is the cheapest option.</i>"},
    {id:"a2-modals", title:"Can / could / have to", body:"Habilidade, pedidos educados e obrigação. Ex.: <i>Can I pay by card? I have to register my address.</i>"},
    {id:"a2-presentperfectintro", title:"Present Perfect (already / yet / just)", body:"Experiências recentes, sem dizer quando exatamente. Ex.: <i>I've just arrived. She hasn't opened an account yet.</i>"},
    {id:"a2-shouldmust", title:"Should / must / have to", body:"Conselho, proibição e obrigação. Ex.: <i>You should view the room first. You mustn't smoke here.</i>"}
  ],
  b1: [
    {id:"b1-presentperfect", title:"Present Perfect", body:"Experiências e resultados até agora. Ex.: <i>I have already sent my CV. Have you found a room yet?</i>"},
    {id:"b1-conditionals", title:"First Conditional", body:"Consequências prováveis. Ex.: <i>If I get the job, I'll need a PPSN.</i>"},
    {id:"b1-passive", title:"Voz passiva (básica)", body:"Comum em avisos e regras formais. Ex.: <i>Payments are accepted by card only.</i>"},
    {id:"b1-phrasal", title:"Phrasal verbs comuns no trabalho", body:"Ex.: <i>fill in</i> (preencher), <i>sign up</i> (se inscrever), <i>look for</i> (procurar), <i>sort out</i> (resolver)."},
    {id:"b1-pastperfect", title:"Past Perfect em narrativas", body:"Diz o que já tinha acontecido antes de outro evento passado. Ex.: <i>I realised I had left my keys at work.</i>"},
    {id:"b1-relative", title:"Relative clauses (who / which / that)", body:"Dar detalhes sem começar outra frase. Ex.: <i>A GP is a doctor who provides general care.</i>"}
  ],
  b2: [
    {id:"b2-secondcond", title:"Second Conditional", body:"Situações hipotéticas. Ex.: <i>If I had more savings, I would rent a bigger room.</i>"},
    {id:"b2-reported", title:"Reported speech", body:"Relatar o que alguém disse — comum em e-mails e ligações. Ex.: <i>She said the room was still available.</i>"},
    {id:"b2-relative", title:"Orações relativas", body:"Dar mais detalhes de forma natural. Ex.: <i>The school, which is ILEP-listed, starts in January.</i>"},
    {id:"b2-formal", title:"Linguagem formal em e-mails", body:"Ex.: <i>I am writing to enquire about... / I would appreciate your response.</i>"},
    {id:"b2-wishusedto", title:"Wish / used to / get used to", body:"Desejos, hábitos passados e adaptação. Ex.: <i>I wish I spoke more confidently. I'm getting used to the weather.</i>"},
    {id:"b2-diplomatic", title:"Diplomatic English", body:"Suavizar discordância no trabalho. Ex.: <i>I'm not sure this approach will give us the result we need.</i>"}
  ]
};
var ENGLISH_LEVEL_ORDER = ["a1","a2","b1","b2"];
function englishLevelCompleted(level){
  var topics = ENGLISH_TOPICS[level] || [];
  if(!topics.length) return true;
  var state = englishProgressState();
  return topics.every(function(t){ return !!state[t.id]; });
}
function englishLevelUnlocked(level){
  var idx = ENGLISH_LEVEL_ORDER.indexOf(level);
  if(idx <= 0) return true;
  for(var i=0;i<idx;i++){ if(!englishLevelCompleted(ENGLISH_LEVEL_ORDER[i])) return false; }
  return true;
}
function renderEnglishLevelSubtabs(containerId, items, currentLevel, onSelect){
  document.getElementById(containerId).innerHTML = items.map(function(it){
    var locked = !englishLevelUnlocked(it.level);
    return '<button class="subtab'+(currentLevel===it.level?' active':'')+(locked?' locked':'')+'" data-level="'+it.level+'"'+(locked?' disabled title="Complete a gramática do nível anterior para desbloquear"':'')+'>'+(locked?'🔒 ':'')+it.label+'</button>';
  }).join("");
  document.querySelectorAll("#"+containerId+" .subtab").forEach(function(b){
    b.addEventListener("click", function(){
      if(b.hasAttribute("disabled")) return;
      onSelect(b.dataset.level);
    });
  });
}
var ENGLISH_MODULES = [
  {id:"airport", title:"No aeroporto", phrases:[
    "Where is the baggage claim? — Onde fica a esteira de bagagem?",
    "I'm here to study English. — Estou aqui para estudar inglês.",
    "Do you have a SIM card for tourists? — Vocês têm chip para turistas?"
  ]},
  {id:"room", title:"Alugando um quarto", phrases:[
    "Is the room available from [date]? — O quarto está disponível a partir de [data]?",
    "Is the deposit refundable? — O depósito é reembolsável?",
    "Are bills included? — As contas estão incluídas?"
  ]},
  {id:"interview", title:"Entrevista de emprego", phrases:[
    "I'm available to start immediately. — Estou disponível para começar imediatamente.",
    "I can work up to 20 hours a week. — Posso trabalhar até 20 horas por semana.",
    "Do you provide training? — Vocês oferecem treinamento?"
  ]},
  {id:"market", title:"No mercado / loja", phrases:[
    "Do you accept card? — Vocês aceitam cartão?",
    "Where can I find...? — Onde eu encontro...?",
    "Can I get a receipt, please? — Posso pegar o recibo, por favor?"
  ]},
  {id:"gp", title:"No médico / farmácia", phrases:[
    "I'd like to register with a GP. — Gostaria de me registrar com um médico de família.",
    "I have an allergy to... — Tenho alergia a...",
    "Can you recommend something for...? — Você recomenda algo para...?"
  ]},
  {id:"transport", title:"Transporte", phrases:[
    "Does this bus go to the city centre? — Esse ônibus vai para o centro?",
    "Can I top up my Leap Card here? — Posso recarregar meu Leap Card aqui?",
    "Is this the right platform for Cork? — Essa é a plataforma certa para Cork?"
  ]},
  {id:"bank", title:"Banco e pagamentos", phrases:[
    "I'd like to open a current account. — Gostaria de abrir uma conta corrente.",
    "What documents do I need? — Quais documentos eu preciso?",
    "My card has been declined. — Meu cartão foi recusado."
  ]},
  {id:"restaurant", title:"Restaurante / café", phrases:[
    "Could we have a table for two? — Podemos ter uma mesa para dois?",
    "Does this contain nuts? — Isso contém nozes/castanhas?",
    "Could I have the bill, please? — Pode trazer a conta, por favor?"
  ]},
  {id:"emergency", title:"Emergências", phrases:[
    "I need an ambulance / the Gardaí / the fire brigade. — Preciso de uma ambulância / da polícia / dos bombeiros.",
    "There's been an accident. — Aconteceu um acidente.",
    "My location is... — Minha localização é..."
  ]}
];
var ENGLISH_MISTAKES = [
  {wrong:"I have 25 years.", right:"I am 25 years old.", why:"Idade usa o verbo <i>to be</i>."},
  {wrong:"I have hungry.", right:"I am hungry.", why:"Estado usa <i>to be</i>."},
  {wrong:"I don't can go.", right:"I can't go.", why:"Modal não usa <i>do</i>."},
  {wrong:"He don't work.", right:"He doesn't work.", why:"Terceira pessoa do singular."},
  {wrong:"She have a car.", right:"She has a car.", why:"Forma irregular de <i>have</i>."},
  {wrong:"I am agree.", right:"I agree.", why:"<i>Agree</i> já é verbo."},
  {wrong:"People is friendly.", right:"People are friendly.", why:"<i>People</i> é plural."},
  {wrong:"I live here since May.", right:"I've lived here since May.", why:"Situação iniciada no passado e ainda atual usa Present Perfect."},
  {wrong:"I didn't went.", right:"I didn't go.", why:"Depois de <i>did</i>, usa-se a forma base do verbo."},
  {wrong:"More easier.", right:"Easier.", why:"Não duplicar o comparativo."},
  {wrong:"Depends of.", right:"Depends on.", why:"Preposição correta."},
  {wrong:"Married with.", right:"Married to.", why:"Preposição correta."},
  {wrong:"Explain me.", right:"Explain it to me.", why:"Construção com <i>to</i>."},
  {wrong:"Ask to him.", right:"Ask him.", why:"<i>Ask</i> aceita objeto direto."},
  {wrong:"I made a course.", right:"I took/did a course.", why:"Colocação natural."},
  {wrong:"I did a mistake.", right:"I made a mistake.", why:"Colocação com <i>make</i>."},
  {wrong:"I lost the bus.", right:"I missed the bus.", why:"<i>Miss</i> para transporte."},
  {wrong:"Pass an exam.", right:"Take an exam.", why:"<i>Take</i> = fazer a prova; <i>pass</i> = ser aprovado."},
  {wrong:"I'm boring.", right:"I'm bored.", why:"<i>Bored</i> sente; <i>boring</i> causa o tédio."},
  {wrong:"The news are good.", right:"The news is good.", why:"<i>News</i> é gramaticalmente singular."},
  {wrong:"Informations.", right:"Information.", why:"Substantivo incontável."},
  {wrong:"In the weekend.", right:"At the weekend / on the weekend.", why:"Na Irlanda e no Reino Unido, <i>at</i> é muito comum."},
  {wrong:"I go to home.", right:"I go home.", why:"Sem <i>to</i> antes de <i>home</i> nesse uso."},
  {wrong:"I'm here for study.", right:"I'm here to study.", why:"Propósito usa infinitivo com <i>to</i>."}
];
var ENGLISH_FALSE_FRIENDS = [
  {word:"actually", meaning:"na verdade", not:"atualmente", example:"Actually, I live in Cork."},
  {word:"currently", meaning:"atualmente", not:"corretamente", example:"I'm currently studying."},
  {word:"pretend", meaning:"fingir", not:"pretender", example:"He pretended to be asleep."},
  {word:"intend", meaning:"pretender / ter intenção", not:"entender", example:"I intend to apply."},
  {word:"parents", meaning:"pais", not:"parentes", example:"My parents live in Brazil."},
  {word:"relatives", meaning:"parentes", not:"relativos", example:"I visited my relatives."},
  {word:"sensible", meaning:"sensato", not:"sensível", example:"That sounds sensible."},
  {word:"sensitive", meaning:"sensível", not:"sensato", example:"This information is sensitive."},
  {word:"library", meaning:"biblioteca", not:"livraria", example:"I studied at the library."},
  {word:"bookshop", meaning:"livraria", not:"biblioteca", example:"I bought it at a bookshop."},
  {word:"college", meaning:"faculdade / instituição", not:"colégio, em muitos contextos", example:"She's at college in Dublin."},
  {word:"lecture", meaning:"palestra / aula universitária", not:"leitura", example:"The lecture starts at ten."},
  {word:"fabric", meaning:"tecido", not:"fábrica", example:"This fabric is waterproof."},
  {word:"factory", meaning:"fábrica", not:"tecido", example:"He works in a factory."},
  {word:"push", meaning:"empurrar", not:"puxar", example:"Push the door."},
  {word:"pull", meaning:"puxar", not:"pular", example:"Pull the handle."},
  {word:"lunch", meaning:"almoço", not:"lanche", example:"I have lunch at one."},
  {word:"snack", meaning:"lanche", not:"almoço", example:"I had a quick snack."},
  {word:"costume", meaning:"fantasia / traje", not:"costume / hábito", example:"He wore a pirate costume."},
  {word:"custom", meaning:"costume / tradição", not:"fantasia", example:"It's a local custom."},
  {word:"eventually", meaning:"finalmente / com o tempo", not:"eventualmente", example:"Eventually, we found a room."},
  {word:"occasionally", meaning:"às vezes", not:"finalmente", example:"I occasionally work late."},
  {word:"assist", meaning:"ajudar", not:"assistir", example:"Can I assist you?"},
  {word:"attend", meaning:"comparecer / frequentar", not:"atender", example:"I attended the meeting."}
];
var ENGLISH_PHRASAL_GROUPS = [
  {id:"daily", label:"Vida diária e viagem", items:[
    {v:"wake up", pt:"acordar", ex:"I wake up at seven."},
    {v:"get up", pt:"levantar-se", ex:"I got up late."},
    {v:"go out", pt:"sair", ex:"We're going out tonight."},
    {v:"come back", pt:"voltar", ex:"I'll come back at six."},
    {v:"pick up", pt:"buscar / pegar", ex:"I'll pick you up at the airport."},
    {v:"drop off", pt:"deixar", ex:"Can you drop me off at the station?"},
    {v:"check in", pt:"fazer check-in", ex:"We checked in online."},
    {v:"check out", pt:"sair do hotel / verificar", ex:"We need to check out by eleven."},
    {v:"find out", pt:"descobrir", ex:"I found out which bus to take."},
    {v:"run out of", pt:"ficar sem", ex:"I've run out of credit."},
    {v:"look for", pt:"procurar", ex:"I'm looking for a room."},
    {v:"look after", pt:"cuidar de", ex:"She looks after two children."},
    {v:"get along with", pt:"dar-se bem com", ex:"I get along with my flatmates."},
    {v:"turn up", pt:"aparecer / aumentar", ex:"He turned up late."}
  ]},
  {id:"work", label:"Trabalho e tecnologia", items:[
    {v:"set up", pt:"configurar / montar", ex:"I'll set up your account."},
    {v:"log in", pt:"entrar no sistema", ex:"I can't log in."},
    {v:"sign out", pt:"sair da conta", ex:"Sign out and try again."},
    {v:"shut down", pt:"desligar / encerrar", ex:"Please shut down the laptop."},
    {v:"back up", pt:"fazer backup / apoiar", ex:"Back up the files first."},
    {v:"look into", pt:"investigar", ex:"We're looking into the issue."},
    {v:"figure out", pt:"descobrir / entender", ex:"I'm trying to figure out the cause."},
    {v:"carry out", pt:"realizar", ex:"We carried out several tests."},
    {v:"deal with", pt:"lidar com", ex:"I deal with customer requests."},
    {v:"take over", pt:"assumir", ex:"Niamh will take over the project."},
    {v:"follow up", pt:"acompanhar", ex:"I'll follow up tomorrow."},
    {v:"get back to", pt:"responder mais tarde", ex:"I'll get back to you by Friday."},
    {v:"point out", pt:"destacar", ex:"She pointed out an error."},
    {v:"go over", pt:"revisar", ex:"Let's go over the requirements."},
    {v:"roll out", pt:"lançar gradualmente", ex:"The update will be rolled out next week."}
  ]}
];
var englishPhrasalView = ls("englishPhrasalView") || "daily";
var ENGLISH_SLANG = [
  {term:"grand", meaning:"tudo bem; bom o suficiente", example:"“That's grand, thanks.” — informal."},
  {term:"cheers", meaning:"obrigado; saúde; despedida curta", example:"“Cheers for your help.”"},
  {term:"sound", meaning:"legal, confiável; valeu", example:"“He's sound.” / “Sound, thanks.” — informal."},
  {term:"craic", meaning:"diversão, novidades, ambiente", example:"“What's the craic?” — muito informal, soa como “crack”."},
  {term:"fair play", meaning:"parabéns; reconhecimento", example:"“You passed? Fair play to you.”"},
  {term:"no bother", meaning:"sem problema", example:"“Could you send it today?” “No bother.”"},
  {term:"howya", meaning:"forma rápida de “How are you?”", example:"Cumprimento informal; não exige resposta longa."},
  {term:"what's the story?", meaning:"como estão as coisas? / novidades?", example:"Muito informal."},
  {term:"your man / your one", meaning:"aquele homem / aquela mulher do contexto", example:"Informal; pode confundir iniciantes."},
  {term:"press", meaning:"armário, especialmente embutido", example:"“The towels are in the hot press.”"},
  {term:"runners", meaning:"tênis esportivo", example:"Equivale a “trainers/sneakers”."},
  {term:"chips / crisps", meaning:"batatas fritas / batata de pacote", example:"Diferença comum no inglês da Irlanda/Reino Unido."},
  {term:"Garda / Gardaí", meaning:"policial / polícia ou policiais", example:"Termo irlandês de uso cotidiano."},
  {term:"Eircode", meaning:"código postal irlandês", example:"Útil ao informar endereços."}
];
var ENGLISH_READING = [
  {level:"a1", label:"A1", title:"My first week", text:"My name is Bruno and I'm from São Paulo. I live in a shared house in Dublin. There are four people in the house. My English class starts at nine every morning. After class, I usually have lunch with my classmates. I take the bus home at four. Ireland is new to me, but I'm happy to be here.",
    questions:["Where is Bruno from?","How many people live in the house?","What time does class start?","How does he go home?"],
    answers:"São Paulo/Brazil; four; at nine; by bus / he takes the bus."},
  {level:"a2", label:"A2", title:"A room viewing", text:"Sofia viewed a room near her school yesterday. The room was smaller than the photos, but the kitchen was bright and clean. The rent included internet and heating, but electricity was separate. Two students already lived there. Sofia liked the location because she could walk to class in fifteen minutes. She hasn't decided yet because she is viewing another room tomorrow.",
    questions:["What was different from the photos?","Which bills were included?","Why did Sofia like the location?","Has she made a final decision?"],
    answers:"The room was smaller; internet and heating; she could walk to class in fifteen minutes; no, she hasn't."},
  {level:"b1", label:"B1", title:"A difficult first shift", text:"On my first evening shift, the card machine stopped working while several customers were waiting. I had never dealt with that problem before, so I told the supervisor immediately. She showed me how to restart the terminal and asked me to explain the delay to the queue. Most customers were understanding because I kept them informed. By the end of the shift, I had learned both a technical process and an important lesson about communication.",
    questions:["What happened during the shift?","Why did the writer ask the supervisor?","How did the writer help the customers?","What two things did the writer learn?"],
    answers:"The card machine stopped working; they had never dealt with it before; they explained the delay and kept customers informed; a technical process and the value of communication."},
  {level:"b2", label:"B2", title:"Working abroad and professional identity", text:"Moving abroad can reshape a person's professional identity. Skills that once felt automatic — making small talk, explaining a complex problem or showing confidence in an interview — may suddenly require conscious effort in another language. Nevertheless, this temporary loss of ease should not be mistaken for a loss of competence. International workers often develop valuable abilities precisely because they must observe more carefully, adapt their communication and ask clearer questions. Employers can support this process by assessing evidence of performance rather than treating accent or speed as measures of intelligence.",
    questions:["What mistaken conclusion might a worker make?","Which abilities can international workers develop?","What does the text recommend employers assess?"],
    answers:"They may mistake reduced ease for reduced competence; careful observation, adaptable communication and clearer questioning; evidence of performance, not accent or speed."}
];
var englishReadingView = ls("englishReadingView") || "a1";
if(!englishLevelUnlocked(englishReadingView)) englishReadingView = "a1";
var ENGLISH_LISTENING = [
  {level:"a1", label:"A1", title:"At the café", lines:[
    "Barista: Hi there. What can I get you?",
    "Customer: A tea and a cheese sandwich, please.",
    "Barista: Is that for here or to take away?",
    "Customer: For here, please. How much is it?",
    "Barista: It's eight euro fifty."
  ], questions:["What drink did the customer order?","What food?","For here or to take away?","How much is it?"],
    answers:"Tea; cheese sandwich; for here; €8.50."},
  {level:"a2", label:"A2", title:"Transport announcement", lines:[
    "Attention, please. The 14:20 service to Galway is delayed by approximately twenty minutes.",
    "It will now depart from platform six, not platform four.",
    "We apologise for the delay."
  ], questions:["Destination?","Original time?","How long is the delay?","New platform?"],
    answers:"Galway; 14:20; about 20 minutes; platform 6."},
  {level:"b1", label:"B1", title:"Voicemail about a viewing", lines:[
    "Hi Larissa, this is Patrick calling about the room in Drumcondra.",
    "Tomorrow's viewing has moved from half past five to quarter past six because the current tenant will be home late.",
    "The address is 42 Cedar Road, and the blue door is beside a small grocery shop.",
    "Text me if the new time doesn't suit you."
  ], questions:["Why did Patrick call?","What was the original time?","What is the new time?","What's the reference point for the address?","What should she do if the time doesn't work?"],
    answers:"About a room viewing; 5:30; 6:15; blue door beside a grocery shop; text Patrick."},
  {level:"b2", label:"B2", title:"Project update", lines:[
    "We've identified the cause of yesterday's login failures.",
    "A configuration change was deployed without one of the required security rules.",
    "The team rolled the change back at 9:40, and access has been stable since then.",
    "We're now reviewing the deployment process.",
    "Although no customer data was exposed, we'll contact affected users and publish a short incident summary this afternoon."
  ], questions:["What was the root cause?","What action was taken?","At what time?","Was any customer data exposed?","What are the next steps?"],
    answers:"A missing security rule in a configuration change; rollback of the change; 9:40; no customer data was exposed; contact affected users and publish an incident summary."}
];
var englishListeningView = ls("englishListeningView") || "a1";
if(!englishLevelUnlocked(englishListeningView)) englishListeningView = "a1";
var ENGLISH_YOUTUBE = [
  {name:"BBC Learning English", url:"https://www.youtube.com/@bbclearningenglish", desc:"Vídeos curtos sobre gramática, vocabulário e inglês das notícias, com legendas."},
  {name:"Cambridge English", url:"https://www.youtube.com/@CambridgeEnglish", desc:"Conteúdo alinhado ao CEFR (A1–C2), útil para acompanhar o próprio nível."},
  {name:"English with Lucy", url:"https://www.youtube.com/@EnglishwithLucy", desc:"Pronúncia, vocabulário do dia a dia e expressões naturais, em ritmo bom para A2–B2."},
  {name:"engVid", url:"https://www.youtube.com/@engvid", desc:"Vários professores, aulas curtas de gramática e vocabulário organizadas por tema."},
  {name:"Speak English With Vanessa", url:"https://www.youtube.com/@SpeakEnglishWithVanessa", desc:"Foco em fluência e expressões idiomáticas do inglês americano."},
  {name:"TED-Ed", url:"https://www.youtube.com/@TEDEd", desc:"Listening mais avançado (B2+): vídeos curtos com legendas em inglês sobre temas variados."}
];
var ENGLISH_WRITING = [
  {level:"a1", label:"A1", prompts:["Preencha um formulário pessoal simples (nome, país, profissão).","Escreva uma mensagem de 30 palavras se apresentando.","Descreva sua rotina em cinco frases.","Escreva uma lista de compras com seis itens."],
    model:"Hi, I'm Ana. I'm from Brazil. I'm a student. I live in Dublin with two flatmates. I study English in the morning and I work part-time in the afternoon."},
  {level:"a2", label:"A2", prompts:["Escreva uma mensagem perguntando sobre a visita a um quarto.","Relate em 80 palavras seu primeiro dia em uma cidade nova.","Escreva um convite para um colega.","Peça informação sobre um curso por e-mail."],
    model:"Hi, I saw your ad for the room in Rathmines. Is it still available? I'd like to know if bills are included and when I could arrange a viewing. Thanks, Marcos."},
  {level:"b1", label:"B1", prompts:["Escreva um e-mail de candidatura a uma vaga.","Escreva uma reclamação educada sobre um problema no apartamento.","Conte uma experiência inesperada em 130 palavras.","Escreva um perfil profissional curto para o LinkedIn."],
    model:"Dear Hiring Team, I'm writing to apply for the Barista position advertised on your website. I have two years of experience in customer service and I'm available for morning and weekend shifts. I've attached my CV and would welcome the opportunity to discuss my application further. Kind regards, Camila Souza."},
  {level:"b2", label:"B2", prompts:["Escreva uma cover letter de 180–220 palavras para uma vaga real.","Resuma os pontos principais de uma reunião fictícia.","Escreva um texto de opinião sobre morar no exterior.","Escreva um relatório curto de um incidente técnico."],
    model:"Subject: Follow-up on Support Analyst Interview\n\nDear Ms Byrne,\n\nThank you for meeting with me today. I enjoyed learning more about the role and the team. Our discussion reinforced my interest in the position, particularly the opportunity to work with cloud support. Please let me know if I can provide any further information.\n\nKind regards,\nMariana Costa"}
];
var englishWritingView = ls("englishWritingView") || "a1";
if(!englishLevelUnlocked(englishWritingView)) englishWritingView = "a1";
function getEnglishWritingDraft(level){ return (ls("englishWritingDrafts")||{})[level] || ""; }
function setEnglishWritingDraft(level, text){
  var drafts = ls("englishWritingDrafts") || {};
  if(text) drafts[level] = text; else delete drafts[level];
  ls("englishWritingDrafts", drafts);
}
function wireRevealToggles(containerId){
  document.querySelectorAll("#"+containerId+" .reveal-toggle").forEach(function(btn){
    var showLabel = btn.dataset.showLabel || "Ver respostas";
    var hideLabel = btn.dataset.hideLabel || "Ocultar respostas";
    btn.addEventListener("click", function(){
      var box = document.querySelector('#'+containerId+' [data-reveal-box="'+btn.dataset.revealToggle+'"]');
      if(!box) return;
      box.hidden = !box.hidden;
      btn.textContent = box.hidden ? showLabel : hideLabel;
    });
  });
}
function renderEnglishMistakes(){
  var rows = ENGLISH_MISTAKES.map(function(m){
    return '<tr><td data-label="Evitar" style="color:var(--warn-strong);">'+m.wrong+'</td><td data-label="Prefira"><strong>'+m.right+'</strong></td><td data-label="Por quê">'+m.why+'</td></tr>';
  }).join("");
  document.getElementById("englishMistakesTable").innerHTML =
    '<thead><tr><th>Evitar</th><th>Prefira</th><th>Por quê</th></tr></thead><tbody>'+rows+'</tbody>';
}
function renderEnglishFalseFriends(){
  var rows = ENGLISH_FALSE_FRIENDS.map(function(f){
    return '<tr><td data-label="Palavra"><strong>'+f.word+'</strong></td><td data-label="Significado certo">'+f.meaning+'</td><td data-label="Não significa">'+f.not+'</td><td data-label="Exemplo"><i>'+f.example+'</i></td></tr>';
  }).join("");
  document.getElementById("englishFalseFriendsTable").innerHTML =
    '<thead><tr><th>Palavra</th><th>Significado certo</th><th>Não significa</th><th>Exemplo</th></tr></thead><tbody>'+rows+'</tbody>';
}
function renderEnglishPhrasalTabs(){
  document.getElementById("englishPhrasalTabs").innerHTML = ENGLISH_PHRASAL_GROUPS.map(function(g){
    return '<button class="subtab'+(englishPhrasalView===g.id?' active':'')+'" data-group="'+g.id+'">'+g.label+'</button>';
  }).join("");
  document.querySelectorAll("#englishPhrasalTabs .subtab").forEach(function(b){
    b.addEventListener("click", function(){ englishPhrasalView = b.dataset.group; ls("englishPhrasalView", englishPhrasalView); renderEnglishPhrasalTabs(); renderEnglishPhrasalContent(); });
  });
}
function renderEnglishPhrasalContent(){
  var group = ENGLISH_PHRASAL_GROUPS.find(function(g){ return g.id===englishPhrasalView; });
  var items = group ? group.items : [];
  document.getElementById("englishPhrasalWrap").innerHTML = '<div class="grid cols-3">'+items.map(function(it){
    return '<div class="card"><h3 style="font-size:15px;">'+it.v+'</h3><p style="margin:0 0 6px;color:var(--muted);font-size:13px;">'+it.pt+'</p><p style="margin:0;font-size:13.5px;"><i>'+it.ex+'</i></p></div>';
  }).join("")+'</div>';
}
function renderEnglishSlang(){
  var rows = ENGLISH_SLANG.map(function(s){
    return '<tr><td data-label="Expressão"><strong>'+s.term+'</strong></td><td data-label="Sentido">'+s.meaning+'</td><td data-label="Exemplo">'+s.example+'</td></tr>';
  }).join("");
  document.getElementById("englishSlangTable").innerHTML =
    '<thead><tr><th>Expressão</th><th>Sentido provável</th><th>Registro / exemplo</th></tr></thead><tbody>'+rows+'</tbody>';
}
function renderEnglishReadingTabs(){
  renderEnglishLevelSubtabs("englishReadingTabs", ENGLISH_READING, englishReadingView, function(level){
    englishReadingView = level; ls("englishReadingView", englishReadingView); renderEnglishReadingTabs(); renderEnglishReadingContent();
  });
}
function answersToOrderedList(answers){
  var items = answers.replace(/\.$/,"").split(/;\s*/);
  return '<ol style="margin:0;padding-left:20px;">'+items.map(function(a){ return "<li>"+a.trim()+"</li>"; }).join("")+'</ol>';
}
function renderEnglishReadingContent(){
  var r = ENGLISH_READING.find(function(x){ return x.level===englishReadingView; });
  if(!r) return;
  document.getElementById("englishReadingWrap").innerHTML =
    '<div class="card"><h3>'+r.title+'</h3><p style="margin:0 0 16px;">'+r.text+'</p>'+
    '<ol style="margin:0 0 12px;padding-left:20px;font-size:13.5px;">'+r.questions.map(function(q){ return "<li>"+q+"</li>"; }).join("")+'</ol>'+
    '<button type="button" class="btn btn-ghost reveal-toggle" data-reveal-toggle="reading" style="width:auto;padding:8px 16px;font-size:12.5px;">Ver respostas</button>'+
    '<div data-reveal-box="reading" hidden style="margin-top:10px;" class="source-note">'+answersToOrderedList(r.answers)+'</div>'+
    '</div>';
  wireRevealToggles("englishReadingWrap");
}
function renderEnglishListeningTabs(){
  renderEnglishLevelSubtabs("englishListeningTabs", ENGLISH_LISTENING, englishListeningView, function(level){
    englishListeningView = level; ls("englishListeningView", englishListeningView); renderEnglishListeningTabs(); renderEnglishListeningContent();
  });
}
function renderEnglishListeningContent(){
  var l = ENGLISH_LISTENING.find(function(x){ return x.level===englishListeningView; });
  if(!l) return;
  document.getElementById("englishListeningWrap").innerHTML =
    '<div class="card"><h3>'+l.title+'</h3>'+
    '<div style="background:var(--bg);border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:13.5px;line-height:1.7;">'+l.lines.map(function(ln){ return "<p style=\"margin:0 0 6px;\">"+ln+"</p>"; }).join("")+'</div>'+
    '<ol style="margin:0 0 12px;padding-left:20px;font-size:13.5px;">'+l.questions.map(function(q){ return "<li>"+q+"</li>"; }).join("")+'</ol>'+
    '<button type="button" class="btn btn-ghost reveal-toggle" data-reveal-toggle="listening" style="width:auto;padding:8px 16px;font-size:12.5px;">Ver respostas</button>'+
    '<div data-reveal-box="listening" hidden style="margin-top:10px;" class="source-note">'+answersToOrderedList(l.answers)+'</div>'+
    '</div>';
  wireRevealToggles("englishListeningWrap");
}
function renderEnglishYoutube(){
  document.getElementById("englishYoutubeWrap").innerHTML = '<div class="grid cols-3">'+ENGLISH_YOUTUBE.map(function(y){
    var fav = faviconUrl(y.url);
    return '<a class="linkcard" href="'+y.url+'" target="_blank" rel="noopener"><div class="linkcard-icon">'+LINK_ICONS.book+(fav?'<img class="linkcard-favicon" src="'+fav+'" alt="" loading="lazy" onerror="this.remove()">':'')+'</div><h4>'+y.name+'</h4><p>'+y.desc+'</p><span class="linkcard-arrow">↗</span></a>';
  }).join("")+'</div>';
}
function renderEnglishWritingTabs(){
  renderEnglishLevelSubtabs("englishWritingTabs", ENGLISH_WRITING, englishWritingView, function(level){
    englishWritingView = level; ls("englishWritingView", englishWritingView); renderEnglishWritingTabs(); renderEnglishWritingContent();
  });
}
function renderEnglishWritingContent(){
  var w = ENGLISH_WRITING.find(function(x){ return x.level===englishWritingView; });
  if(!w) return;
  document.getElementById("englishWritingWrap").innerHTML =
    '<div class="card">'+
    '<h3>Temas para praticar</h3>'+
    '<ul style="margin:0 0 14px;padding-left:20px;font-size:13.5px;line-height:1.7;">'+w.prompts.map(function(p){ return "<li>"+p+"</li>"; }).join("")+'</ul>'+
    '<label style="font-size:13px;color:var(--muted);display:block;margin-bottom:6px;">Seu rascunho (fica salvo só neste navegador)</label>'+
    '<textarea id="englishWritingDraft" rows="4" placeholder="Escreva sua versão em inglês aqui..." style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:13.5px;font-family:inherit;">'+escapeHtml(getEnglishWritingDraft(w.level))+'</textarea>'+
    '<button type="button" class="btn btn-ghost reveal-toggle" data-reveal-toggle="writing" style="width:auto;padding:8px 16px;font-size:12.5px;margin-top:10px;">Ver modelo</button>'+
    '<div data-reveal-box="writing" hidden style="margin-top:10px;white-space:pre-wrap;font-size:13.5px;background:var(--bg);border-radius:10px;padding:12px 14px;">'+escapeHtml(w.model)+'</div>'+
    '</div>';
  var ta = document.getElementById("englishWritingDraft");
  ta.addEventListener("change", function(){ setEnglishWritingDraft(w.level, ta.value); });
  wireRevealToggles("englishWritingWrap");
}
function englishProgressState(){ return ls("inglesProgress") || {}; }
function englishAllIds(){
  var ids = [];
  ENGLISH_LEVELS.forEach(function(l){ (ENGLISH_TOPICS[l.id]||[]).forEach(function(t){ ids.push(t.id); }); });
  ENGLISH_MODULES.forEach(function(m){ ids.push("mod-"+m.id); });
  return ids;
}
var englishLevelView = ls("englishLevelView") || "a1";
if(!englishLevelUnlocked(englishLevelView)) englishLevelView = "a1";
function renderEnglishLevelTabs(){
  var items = ENGLISH_LEVELS.map(function(l){ return {level:l.id, label:l.label}; });
  renderEnglishLevelSubtabs("englishLevelTabs", items, englishLevelView, function(level){
    englishLevelView = level; ls("englishLevelView", englishLevelView); renderEnglishLevelTabs(); renderEnglishTopics();
  });
}
function renderEnglishTopics(){
  var level = ENGLISH_LEVELS.find(function(l){ return l.id===englishLevelView; });
  var topics = ENGLISH_TOPICS[englishLevelView] || [];
  var state = englishProgressState();
  document.getElementById("englishLevelDesc").textContent = level ? level.desc : "";
  document.getElementById("englishTopicsWrap").innerHTML = topics.map(function(t){
    return checkItemHtml(t.id, t.title, t.body, !!state[t.id]);
  }).join("");
  document.querySelectorAll("#englishTopicsWrap .checkitem").forEach(function(el){
    el.querySelector(".checkitem-input").addEventListener("change", function(){
      var st = englishProgressState();
      st[el.dataset.id] = !st[el.dataset.id];
      ls("inglesProgress", st);
      el.classList.toggle("checked", st[el.dataset.id]);
      renderEnglishProgress();
      renderEnglishLevelTabs(); renderEnglishReadingTabs(); renderEnglishListeningTabs(); renderEnglishWritingTabs();
    });
  });
}
function renderEnglishModules(){
  var state = englishProgressState();
  document.getElementById("englishModulesWrap").innerHTML = ENGLISH_MODULES.map(function(m){
    var id = "mod-"+m.id;
    var checked = !!state[id];
    var phrasesHtml = m.phrases.map(function(p){ return "<li>"+p+"</li>"; }).join("");
    return '<div class="card">'+
      '<label class="checkitem'+(checked?' checked':'')+'" data-id="'+id+'" style="margin-bottom:10px;"><input type="checkbox" class="checkitem-input"'+(checked?' checked':'')+'><span class="box">'+CHECK_ICON+'</span><div class="ci-label">'+m.title+'</div></label>'+
      '<ul style="margin:0;padding-left:18px;font-size:13.5px;line-height:1.7;">'+phrasesHtml+'</ul>'+
    '</div>';
  }).join("");
  document.querySelectorAll("#englishModulesWrap .checkitem").forEach(function(el){
    el.querySelector(".checkitem-input").addEventListener("change", function(){
      var st = englishProgressState();
      st[el.dataset.id] = !st[el.dataset.id];
      ls("inglesProgress", st);
      el.classList.toggle("checked", st[el.dataset.id]);
      renderEnglishProgress();
    });
  });
}
function renderEnglishProgress(){
  var ids = englishAllIds();
  var state = englishProgressState();
  var done = ids.filter(function(id){ return state[id]; }).length;
  var pct = ids.length ? Math.round(done/ids.length*100) : 0;
  var text = document.getElementById("englishProgressText");
  if(text) text.textContent = done+"/"+ids.length+" concluído ("+pct+"%)";
  var bar = document.getElementById("englishProgressBar");
  if(bar) bar.style.width = pct+"%";
}
function renderEnglish(){
  renderEnglishLevelTabs();
  renderEnglishTopics();
  renderEnglishModules();
  renderEnglishMistakes();
  renderEnglishFalseFriends();
  renderEnglishPhrasalTabs();
  renderEnglishPhrasalContent();
  renderEnglishSlang();
  renderEnglishReadingTabs();
  renderEnglishReadingContent();
  renderEnglishListeningTabs();
  renderEnglishListeningContent();
  renderEnglishYoutube();
  renderEnglishWritingTabs();
  renderEnglishWritingContent();
  renderEnglishProgress();
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
      var rateNote = document.getElementById("convRateNote");
      if(rateNote) rateNote.textContent = "1 € = R$ "+rate.toFixed(2).replace(".",",")+" (cotação de "+today.split("-").reverse().join("/")+")";
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
  renderStayComparator();
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
    r.addEventListener("change", function(){ ls("selectedStay", r.dataset.select); renderStayComparator(); renderOverview(); });
  });
  document.querySelectorAll('#stayTable input[data-f]').forEach(function(inp){
    inp.addEventListener("input", function(){
      var opts = getStayOptions();
      var row = opts.find(function(o){ return o.id===inp.dataset.id; });
      if(!row) return;
      var f = inp.dataset.f;
      row[f] = (f==="nome") ? inp.value : (parseFloat(inp.value)||0);
      saveStayOptions(opts);
      if(f==="noites" || f==="preco" || f==="nome"){
        renderStayComparator();
      }
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
      renderStayComparator();
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
  renderStayComparator();
  renderOverview();
}
function renderStayComparator(){
  var wrap = document.getElementById("stayComparatorWrap");
  if(!wrap) return;
  var cotacao = getCotacao();
  var selectedId = ls("selectedStay");
  var options = getStayOptions().map(function(s){
    return Object.assign({}, s, {perNight: (s.preco/cotacao)});
  }).sort(function(a,b){ return a.perNight-b.perNight; });
  if(!options.length){ wrap.innerHTML = '<div class="empty">Adicione opções na tabela abaixo para comparar.</div>'; return; }
  var shown = options.slice(0,4);
  var max = Math.max.apply(null, shown.map(function(s){ return s.perNight; }));
  var cheapest = shown[0];
  var RANK_COLORS = ["#0F7A51","#2E9E6F","#6BAF8F","#9FB8AC"];
  wrap.innerHTML = '<div class="card" style="padding:18px 20px;">'+shown.map(function(s, i){
    var pct = max>0 ? Math.max(8, Math.round(s.perNight/max*100)) : 0;
    var isCheapest = s.id===cheapest.id;
    var isSelected = s.id===selectedId;
    var savings = (!isCheapest && cheapest.perNight>0) ? Math.round((1 - cheapest.perNight/s.perNight)*100) : null;
    var badges = "";
    if(isCheapest) badges += '<span class="pill" style="background:var(--accent-soft);color:var(--accent-strong);margin-left:6px;">🏆 Melhor preço</span>';
    if(isSelected) badges += '<span class="pill step" style="margin-left:6px;">✓ Selecionada</span>';
    return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;'+(i>0?'border-top:1px solid var(--border);':'')+'">'+
      '<div style="flex:none;width:26px;height:26px;border-radius:50%;background:'+RANK_COLORS[i]+';color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">'+(i+1)+'</div>'+
      '<div style="flex:1;min-width:0;">'+
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px;">'+
          '<span style="font-size:13.5px;"><b>'+escapeHtml(s.nome)+'</b>'+badges+'</span>'+
          '<span class="tabular" style="font-size:15px;font-weight:700;color:'+(isCheapest?"var(--accent-strong)":"var(--text)")+';">€'+s.perNight.toFixed(2)+'<span style="font-size:11px;font-weight:400;color:var(--muted);">/noite</span></span>'+
        '</div>'+
        '<div style="background:var(--bg);border-radius:8px;height:10px;overflow:hidden;"><div style="width:'+pct+'%;height:100%;background:'+RANK_COLORS[i]+';border-radius:8px;transition:width .3s ease;"></div></div>'+
        (savings!=null ? '<div style="font-size:11.5px;color:var(--muted);margin-top:4px;">'+savings+'% mais cara que a opção mais barata</div>' : '')+
      '</div>'+
    '</div>';
  }).join("")+'</div>';
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
    renderStayComparator();
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
var SCAM_CHECKLIST = [
  {id:"visitou", label:"Visitou o imóvel (ou pediu para alguém de confiança visitar) antes de pagar qualquer depósito"},
  {id:"identidade", label:"Confirmou a identidade de quem está alugando", note:"Nome completo, telefone, perfil verificável em site oficial (Daft, MyHome, Rent.ie)."},
  {id:"semtransferencia", label:"Não fez nenhuma transferência internacional ou PIX para terceiros antes de ver o imóvel"},
  {id:"porescrito", label:"Tudo combinado está registrado por escrito", note:"Mensagens, e-mail ou contrato — nunca só combinado verbalmente."},
  {id:"preco", label:"Desconfiou de preço muito abaixo da média da região/tipo de quarto"},
  {id:"pesquisou", label:"Pesquisou o nome do anunciante/imóvel em grupos de brasileiros antes de fechar"},
  {id:"contrato", label:"Recebeu contrato ou recibo formal do pagamento", note:"Guarde uma cópia digital e impressa."}
];
function renderScamChecklist(){
  var state = ls("scamChecklist") || {};
  document.getElementById("scamChecklistWrap").innerHTML = SCAM_CHECKLIST.map(function(it){
    return checkItemHtml(it.id, it.label, it.note, !!state[it.id]);
  }).join("");
  document.querySelectorAll("#scamChecklistWrap .checkitem").forEach(function(el){
    el.querySelector(".checkitem-input").addEventListener("change", function(){
      var st = ls("scamChecklist") || {};
      st[el.dataset.id] = !st[el.dataset.id];
      ls("scamChecklist", st);
      el.classList.toggle("checked", st[el.dataset.id]);
      updateScamChecklistProgress();
    });
  });
  updateScamChecklistProgress();
}
function updateScamChecklistProgress(){
  var state = ls("scamChecklist") || {};
  var done = SCAM_CHECKLIST.filter(function(it){ return state[it.id]; }).length;
  var el = document.getElementById("scamChecklistProgress");
  if(el) el.textContent = done+"/"+SCAM_CHECKLIST.length+" verificados";
}
var TRANSPORT_APPS = [
  {name:"TFI Live", iconUrl:"https://www.transportforireland.ie/", desc:"App oficial nacional com horários em tempo real de ônibus, Luas, DART e trens — rotas, partidas e paradas próximas. Baixe pela loja de apps do seu celular (o site oficial tem bloqueado o acesso por navegador em alguns casos)."},
  {name:"TFI Go", iconUrl:"https://www.transportforireland.ie/", desc:"Usado principalmente para comprar bilhetes em determinados serviços de Bus Éireann, Local Link e operadoras comerciais participantes — não é o app principal para pagar Dublin Bus/Luas/DART no dia a dia (isso é feito com o Leap Card)."},
  {name:"Leap Card App (TFI Leap Top-Up)", iconUrl:"https://www.leapcard.ie/", desc:"Consulta de saldo, recarga do Leap Card e histórico de transações pelo celular. Baixe pela loja de apps — o site leapcard.ie tem bloqueado o acesso por navegador em alguns casos."},
  {name:"Google Maps", url:"https://maps.google.com/", desc:"Boa cobertura de rotas de transporte público nas três cidades e integração a pé até a parada."},
  {name:"FreeNow", iconUrl:"https://free-now.com/ie/", desc:"Aplicativo de táxi mais usado na Irlanda — bom para madrugada ou com muita bagagem. Baixe pela loja de apps do seu celular."},
  {name:"TFI Driver Check", iconUrl:"https://www.transportforireland.ie/", desc:"Verifica se o motorista, veículo e licença do táxi são os cadastrados oficialmente antes de embarcar. Baixe pela loja de apps do seu celular."},
  {name:"Irish Rail (app)", url:"https://www.irishrail.ie/", desc:"Horários e bilhetes de trens intercidades (Dublin ↔ Cork ↔ Galway) e do DART."},
  {name:"Moovit", url:"https://moovit.com/", desc:"App internacional de transporte público, com boa cobertura em Dublin, Cork e Galway — boa alternativa ao TFI Live."},
  {name:"Uber", url:"https://www.uber.com/ie/en/", desc:"Também funciona em Dublin como alternativa ao FreeNow para pedir carro."}
];
function renderTransportApps(){
  document.getElementById("transportAppsWrap").innerHTML = TRANSPORT_APPS.map(function(a){
    var hasLink = !!a.url;
    var fav = faviconUrl(a.url || a.iconUrl);
    var tag = hasLink ? "a" : "div";
    return "<"+tag+' class="linkcard"'+(hasLink?' href="'+a.url+'" target="_blank" rel="noopener"':'')+'><div class="linkcard-icon">'+LINK_ICONS.phone+(fav?'<img class="linkcard-favicon" src="'+fav+'" alt="" loading="lazy" onerror="this.remove()">':'')+'</div><h4>'+a.name+'</h4><p>'+a.desc+'</p>'+(hasLink?'<span class="linkcard-arrow">↗</span>':'')+'</'+tag+'>';
  }).join("");
}
var TRANSPORT_VERIFIED_AT = "2026-09-11";
var LEAP_CARDS = [
  {id:"adult", label:"Adult Leap Card", who:"Quem vai morar na Irlanda e não se enquadra em Young Adult ou Student — uso frequente de Dublin Bus, Go-Ahead, Luas e DART.",
    rows:[{l:"Short Fare",v:"€1,50"},{l:"TFI 90 Minute",v:"€2,00"},{l:"Teto diário",v:"€6,00"},{l:"Teto semanal",v:"€24,00"},{l:"Mensal Zona 1 (aprox.)",v:"€96"}]},
  {id:"young", label:"Young Adult Leap Card", who:"Principalmente pessoas de 19 a 25 anos — não precisa necessariamente estar estudando para se enquadrar.", badge:"Até ~50% de desconto em tarifas participantes",
    rows:[{l:"Short Fare",v:"€0,75"},{l:"TFI 90 Minute",v:"€1,00"},{l:"Teto diário",v:"€3,00"},{l:"Teto semanal",v:"€12,00"},{l:"Mensal Zona 1 (aprox.)",v:"€48"}]},
  {id:"student", label:"Student Leap Card", who:"Separado do Young Adult — pessoas de 19–25 anos normalmente devem primeiro conferir a elegibilidade ao Young Adult, que é mais simples de obter. Fora dessa faixa etária, o Student exige carta da escola confirmando matrícula em curso de pelo menos 25 semanas.",
    rows:[]},
  {id:"visitor", label:"Leap Visitor Card", who:"Ideal para turismo ou os primeiros dias em Dublin — não recarregável, viagens ilimitadas por período fixo.",
    rows:[{l:"24 horas",v:"€8"},{l:"72 horas",v:"€18"},{l:"7 dias",v:"€24"}]}
];
function renderLeapCards(){
  var wrap = document.getElementById("leapCardsWrap");
  if(!wrap) return;
  wrap.innerHTML = LEAP_CARDS.map(function(c){
    var rows = c.rows.length ? '<div class="tablewrap tablewrap-narrow" style="margin-top:10px;"><table><tbody>'+c.rows.map(function(r){ return '<tr><td>'+r.l+'</td><td class="num tabular">'+r.v+'</td></tr>'; }).join("")+'</tbody></table></div>' : "";
    return '<div class="card"><h3 style="font-size:15.5px;">'+c.label+'</h3><p style="margin:0 0 4px;font-size:13.3px;">'+c.who+'</p>'+
      (c.badge?'<span class="pill" style="background:var(--accent-soft);color:var(--accent-strong);">'+c.badge+'</span>':'')+
      rows+'</div>';
  }).join("")+
  '<div class="callout" style="grid-column:1/-1;">Valores de referência para Dublin (Zona 1) — confirme sempre o valor vigente no aplicativo <b>Leap Card</b> (baixe na loja de apps do seu celular) antes de comprar; o site leapcard.ie tem bloqueado o acesso por navegador em alguns casos.'+sourceVerifiedNote(TRANSPORT_VERIFIED_AT)+'</div>';
}
var TRANSPORT_ROUTES = {
  dublin: {
    mapQuery:"Dublin, Ireland",
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Dublin_Bus_EA_Class%2C_Aug24.jpg/960px-Dublin_Bus_EA_Class%2C_Aug24.jpg",
    photoCredit:{name:"Cityswift", license:"CC BY 2.0", url:"https://commons.wikimedia.org/wiki/File:Dublin_Bus_EA_Class,_Aug24.jpg"},
    network:"Ônibus (Dublin Bus), Luas (VLT) e DART/trens suburbanos — Dublin não tem metrô em operação.",
    card:"Leap Card — para estadia de meses, o cartão comum costuma valer mais que o Visitor Leap Card. Custa €10 (com algum crédito já incluso) e é vendido em lojas Spar, Centra, SuperValu e nas estações DART.",
    airport:[
      {name:"Dublin Bus 16, 41, 102, 33A (mais baratos)", detail:"Linhas locais que também atendem o aeroporto: <b>16</b> (rumo a Ballinteer), <b>41</b> (Abbey St. → Swords Manor), <b>102</b> (até a estação Sutton do DART) e <b>33A</b> (Balbriggan). Mais baratos que os expressos, mas podem ser mais lentos. Aceitam Leap Card — compre no ônibus ou use o app <b>Leap Card</b>, mais barato e fácil."},
      {name:"Aircoach 700 (expresso)", detail:"Liga o aeroporto ao centro com conexões para o Luas — passa a cada ~30 min. Ônibus de piso baixo, acomoda 1 cadeira de rodas por vez (avise a empresa com 24h de antecedência). <b>Não aceita Leap Card</b> — bilhete pelo site <a href=\"https://www.aircoach.ie/\" target=\"_blank\" rel=\"noopener\">aircoach.ie</a> ou com o motorista."},
      {name:"Dublin Express 782 (expresso)", detail:"Melhor opção se o destino for a Heuston Station; passa a cada 15–20 min. Também atende Terenure e Charlotte Way. <b>Não aceita Leap Card</b> — bilhete pelo site <a href=\"https://www.dublinexpress.ie/dublin-city\" target=\"_blank\" rel=\"noopener\">dublinexpress.ie</a>."},
      {name:"Bus Éireann (regionais, direto do aeroporto)", detail:"Se o destino final não é o centro de Dublin, várias linhas saem direto do aeroporto: 100X/101 (Drogheda/Dundalk/Balbriggan), 133/2 (Wicklow/Arklow/Gorey/Wexford), 4 (Carlow/Waterford), 22/23 (Mullingar/Longford/Sligo/Ballina), 30/32 (Cavan/Monaghan/Donegal). Horários e bilhetes em <a href=\"https://www.buseireann.ie/\" target=\"_blank\" rel=\"noopener\">buseireann.ie</a>."},
      {name:"Outras operadoras privadas", detail:"<a href=\"https://airporthopper.ie/\" target=\"_blank\" rel=\"noopener\">Airport Hopper</a>: vans a cada hora para Maynooth/Tallaght via Leixlip, Liffey Valley, Lucan e Clondalkin. <a href=\"https://www.dublincoach.ie/all-timetables/dundrum-dublin-airport\" target=\"_blank\" rel=\"noopener\">Dublin Coach</a>: 36 viagens diárias entre o aeroporto, a parada de Luas Red Cow e Dundrum."},
      {name:"Táxi / FreeNow", detail:"Mais caro (normalmente €30–€40 até o centro), mas direto — vale a pena se chegar de madrugada ou com muita bagagem."},
      {name:"Acessibilidade (cadeira de rodas)", detail:"Aircoach e Dublin Bus têm veículos de piso baixo. Dublin Bus oferece assistência gratuita de viagem (seg-sex, 8h-18h, tel (01) 703 3204, e-mail customercomment@dublinbus.ie). Bus Éireann exige reserva prévia para embarque acessível."}
    ],
    fares:[
      {name:"Leap Card comum (recarregável)", detail:"A opção certa pra quem vai morar em Dublin — recarrega crédito conforme precisa. Custa €10 (com algum crédito já incluso). Compre em lojas Spar/Centra/SuperValu, nas máquinas de bilhete das estações, ou peça pelo aplicativo Leap Card — nesse caso chega pelo correio, então peça com antecedência."},
      {name:"Leap Visitor Card (só estadias curtas)", detail:"Viagens ilimitadas por período fixo em Dublin Bus, Go-Ahead, Luas e DART (Zona Curta): <b>24h €8,00 · 72h €18,00 · 7 dias €24,00</b>. <b>Não vale</b> nos ônibus Aircoach nem Dublin Express do aeroporto. Vendido no Aeroporto de Dublin (loja Wrights no T1, Spar no T2) e em pontos no centro como Trinity College, Estação Connolly e O'Connell Street — ou peça pelo aplicativo Leap Card antes da viagem (não é digital, chega pelo correio)."},
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
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Buses_in_Cork_at_the_bus_station_%28Bus_Eireann%29.jpg/960px-Buses_in_Cork_at_the_bus_station_%28Bus_Eireann%29.jpg",
    photoCredit:{name:"JoachimKohler-HB", license:"CC BY-SA 4.0", url:"https://commons.wikimedia.org/wiki/File:Buses_in_Cork_at_the_bus_station_(Bus_Eireann).jpg"},
    network:"Rede de ônibus urbanos (Bus Éireann) — Cork não tem Luas nem DART.",
    card:"Leap Card também funciona nos ônibus de Cork.",
    airport:[
      {name:"Bus Éireann — Cork Airport ↔ centro (Kent Station)", detail:"Rota regular ligando o aeroporto ao centro de Cork e à estação de trem (Kent Station). Aceita Leap Card — confirme o número da linha e a tarifa vigente no site oficial antes de embarcar."},
      {name:"Táxi / FreeNow", detail:"Mais caro, mas direto — útil se chegar de madrugada ou com muita bagagem."}
    ],
    lines:[
      {name:"Kent Station", detail:"Estação central de trem — conecta Cork a Dublin Heuston (Irish Rail, intercidade)."},
      {name:"Rota 205 / 219", detail:"MTU ↔ Kent Station / Mahon Point — liga universidade, centro e shopping."},
      {name:"Rota 208", detail:"Ashmount ↔ Curraheen."},
      {name:"Rota 202 / 212", detail:"Hollyhill/Kent Station ↔ Mahon Point."}
    ],
    officialLinks:[
      {name:"Bus Éireann", url:"https://www.buseireann.ie/"},
      {name:"Cork Airport", url:"https://www.corkairport.com/"},
      {name:"Irish Rail (Kent Station)", url:"https://www.irishrail.ie/"}
    ]
  },
  galway: {
    mapQuery:"Galway, Ireland",
    photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Galway_-_Bus_and_Rail_Station_-_geograph.org.uk_-_1647013.jpg/960px-Galway_-_Bus_and_Rail_Station_-_geograph.org.uk_-_1647013.jpg",
    photoCredit:{name:"Joseph Mischyshyn", license:"CC BY-SA 2.0", url:"https://commons.wikimedia.org/wiki/File:Galway_-_Bus_and_Rail_Station_-_geograph.org.uk_-_1647013.jpg"},
    network:"Ônibus urbanos operados por Bus Éireann e City Direct — Galway também não tem Luas nem DART.",
    card:"Leap Card funciona nos ônibus de Galway; a maioria das rotas parte do Eyre Square (centro).",
    airport:[
      {name:"Sem aeroporto comercial regular", detail:"O Galway Airport não opera voos comerciais regulares atualmente. A maioria de quem chega de avião desembarca em Dublin (depois ônibus/trem até Galway, ~2h30) ou em Shannon (mais próximo, também via ônibus)."}
    ],
    lines:[
      {name:"Ceannt Station", detail:"Estação central de trem — conecta Galway a Dublin Heuston (Irish Rail, intercidade)."},
      {name:"Rota 401", detail:"Salthill via centro — liga a orla de Salthill ao Eyre Square."},
      {name:"Rota 404", detail:"Oranmore ↔ Westside."},
      {name:"City Direct 410–412", detail:"Rotas complementares operadas por empresa privada."}
    ],
    officialLinks:[
      {name:"Bus Éireann", url:"https://www.buseireann.ie/"},
      {name:"City Direct", url:"https://citydirect.ie/"},
      {name:"Irish Rail (Ceannt Station)", url:"https://www.irishrail.ie/"}
    ]
  }
};
var TRANSPORT_GALLERY_DUBLIN = [
  {name:"Luas", photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/The_Luas_at_O%27Connell_Upper_May_2025.jpg/960px-The_Luas_at_O%27Connell_Upper_May_2025.jpg", photoCredit:{name:"4300streetcar", license:"CC BY 4.0", url:"https://commons.wikimedia.org/wiki/File:The_Luas_at_O%27Connell_Upper_May_2025.jpg"}},
  {name:"DART", photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d4/DART_Dublin_train_2023_%281%29.jpg/960px-DART_Dublin_train_2023_%281%29.jpg", photoCredit:{name:"MOs810", license:"CC BY 4.0", url:"https://commons.wikimedia.org/wiki/File:DART_Dublin_train_2023_(1).jpg"}},
  {name:"Dublin Airport", photo:"https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Dublin_Airport_Terminal_2_-_2024-05-18.jpg/960px-Dublin_Airport_Terminal_2_-_2024-05-18.jpg", photoCredit:{name:"瑞丽江的河水", license:"CC BY-SA 4.0", url:"https://commons.wikimedia.org/wiki/File:Dublin_Airport_Terminal_2_-_2024-05-18.jpg"}}
];
function renderTransportGallery(){
  var wrap = document.getElementById("transportGalleryWrap");
  if(!wrap) return;
  wrap.innerHTML = TRANSPORT_GALLERY_DUBLIN.map(function(g, i){
    return '<div class="city-card"><img class="city-card-photo" data-idx="'+i+'" src="'+g.photo+'" alt="'+g.name+'" loading="lazy" onerror="this.remove()">'+
      '<h3 style="font-size:14.5px;">'+g.name+'</h3>'+
      '<a class="city-card-credit" href="'+g.photoCredit.url+'" target="_blank" rel="noopener">Foto: '+g.photoCredit.name+' / Wikimedia Commons ('+g.photoCredit.license+')</a>'+
      '</div>';
  }).join("");
  document.querySelectorAll("#transportGalleryWrap .city-card-photo").forEach(function(img){
    img.addEventListener("click", function(){
      var g = TRANSPORT_GALLERY_DUBLIN[img.dataset.idx];
      var cap = g.name+' — <a href="'+g.photoCredit.url+'" target="_blank" rel="noopener">Foto: '+g.photoCredit.name+' / Wikimedia Commons ('+g.photoCredit.license+')</a>';
      openLightbox(g.photo, cap);
    });
  });
}
var TRANSPORT_OVERNIGHT_DUBLIN = {
  intro:"Fora do horário normal, a rede encolhe bastante — vale planejar com antecedência quando o compromisso terminar tarde.",
  items:[
    {name:"Nitelink", detail:"Serviço noturno que complementa parte da rede em determinados dias/horários (normalmente noites de sexta e sábado). Referência de tarifa: ~€2,40 com Leap, ~€3,10 em dinheiro — confirme dias, horários e rotas vigentes antes de contar com ele."},
    {name:"Algumas linhas Dublin Bus 24h", detail:"Um pequeno número de linhas urbanas opera de madrugada em parte do trajeto — confira no TFI Live se a sua rota específica está entre elas antes de contar com isso no retorno."},
    {name:"Táxi / FreeNow", detail:"A alternativa mais confiável de madrugada quando não há ônibus/Luas/DART operando — vale reservar o valor no orçamento se seus horários envolverem chegadas ou saídas noturnas com frequência."}
  ],
  sourceUrl:"https://www.dublinbus.ie/journey-information/night-time-services"
};
var TRANSPORT_METROLINK = {
  title:"MetroLink",
  body:"Dublin ainda não possui metrô em operação. O MetroLink é um projeto de metrô futuro, ainda em planejamento/construção — não deve ser considerado uma opção de transporte disponível hoje.",
  sourceUrl:"https://www.metrolink.ie/"
};
var TRANSPORT_INTERCITY = [
  {route:"Dublin Heuston → Cork Kent", note:"Principal ligação de trem entre as duas cidades — várias partidas por dia. Confira duração, frequência e preço atualizados no Irish Rail antes de comprar; passagem antecipada costuma sair mais barata."},
  {route:"Dublin Heuston → Galway Ceannt", note:"Principal ligação de trem entre as duas cidades. Mesma recomendação: confira horários e preço no Irish Rail, e compre com antecedência quando possível."}
];
var TRANSPORT_AIRPORT_DIRECT = [
  {city:"Cork", note:"Se seu destino final é Cork, vale comparar um ônibus direto do próprio Aeroporto de Dublin (operadoras como Aircoach/Citylink têm linhas para Cork) antes de ir primeiro ao centro de Dublin — confira rota, horário e preço atual no site de cada operadora."},
  {city:"Galway", note:"Da mesma forma, para quem vai direto a Galway, existem ônibus diretos do Aeroporto de Dublin (Citylink/Aircoach) que evitam a ida ao centro — confira rota, horário e preço atual no site de cada operadora."}
];
function renderTransportOvernight(){
  var wrap = document.getElementById("transportOvernightWrap");
  if(!wrap) return;
  var d = TRANSPORT_OVERNIGHT_DUBLIN;
  wrap.innerHTML = '<div class="callout">'+d.intro+'</div>'+
    '<div class="card">'+d.items.map(function(it){ return tipRow(it.name, it.detail); }).join("")+'</div>'+
    officialSourceHtml(d.sourceUrl, TRANSPORT_VERIFIED_AT);
}
function renderTransportMetrolink(){
  var wrap = document.getElementById("transportMetrolinkWrap");
  if(!wrap) return;
  wrap.innerHTML = '<div class="callout warn"><strong>'+TRANSPORT_METROLINK.title+':</strong> '+TRANSPORT_METROLINK.body+'</div>'+
    officialSourceHtml(TRANSPORT_METROLINK.sourceUrl, TRANSPORT_VERIFIED_AT);
}
function renderTransportIntercity(){
  var wrap = document.getElementById("transportIntercityWrap");
  if(!wrap) return;
  wrap.innerHTML = '<div class="card">'+TRANSPORT_INTERCITY.map(function(r){ return tipRow(r.route, r.note); }).join("")+
    '<div class="callout" style="margin-top:14px;">Se o destino final é Cork ou Galway, vale verificar ônibus direto do próprio Aeroporto de Dublin antes de ir ao centro:</div>'+
    TRANSPORT_AIRPORT_DIRECT.map(function(a){ return tipRow("Direto para "+a.city, a.note); }).join("")+
    '</div>'+
    officialSourceHtml("https://www.irishrail.ie/", TRANSPORT_VERIFIED_AT);
}
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
  var html = "";
  if(t.photo){
    html += '<div class="card" style="padding:0;overflow:hidden;margin-bottom:16px;">'+
      '<img src="'+t.photo+'" alt="Transporte em '+t.mapQuery+'" style="width:100%;max-height:260px;object-fit:cover;display:block;" loading="lazy" onerror="this.parentElement.remove()">'+
      '<a class="city-card-credit" style="display:block;padding:6px 12px;" href="'+t.photoCredit.url+'" target="_blank" rel="noopener">Foto: '+t.photoCredit.name+' / Wikimedia Commons ('+t.photoCredit.license+')</a>'+
      '</div>';
  }
  html += '<div class="grid cols-2" style="margin-bottom:16px;">'+
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
      '<button type="button" class="btn btn-ghost reveal-toggle" data-reveal-toggle="luas-red" data-show-label="Mostrar Linha Vermelha" data-hide-label="Ocultar Linha Vermelha" style="width:auto;padding:8px 14px;font-size:12.5px;margin-bottom:8px;">Mostrar Linha Vermelha</button>'+
      '<div data-reveal-box="luas-red" hidden style="margin-bottom:12px;"><p style="margin:0;font-size:13px;">'+t.luasStops.red+'</p></div>'+
      '<button type="button" class="btn btn-ghost reveal-toggle" data-reveal-toggle="luas-green" data-show-label="Mostrar Linha Verde" data-hide-label="Ocultar Linha Verde" style="width:auto;padding:8px 14px;font-size:12.5px;margin-bottom:8px;">Mostrar Linha Verde</button>'+
      '<div data-reveal-box="luas-green" hidden><p style="margin:0;font-size:13px;">'+t.luasStops.green+'</p></div>'+
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
  wireRevealToggles("transportRoutesWrap");
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
}
function renderConverter(){
  var eurEl = document.getElementById("convEur"), brlEl = document.getElementById("convBrl");
  if(!eurEl) return;
  var rateNote = document.getElementById("convRateNote");
  if(rateNote){
    var updated = ls("cotacaoUpdatedAt");
    rateNote.textContent = "1 € = R$ "+getCotacao().toFixed(2).replace(".",",")+(updated?" (cotação de "+updated.split("-").reverse().join("/")+")":"");
  }
  eurEl.addEventListener("input", function(){
    var v = parseFloat(eurEl.value);
    brlEl.value = isNaN(v) ? "" : (v*getCotacao()).toFixed(2);
  });
  brlEl.addEventListener("input", function(){
    var v = parseFloat(brlEl.value);
    eurEl.value = isNaN(v) ? "" : (v/getCotacao()).toFixed(2);
  });
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
  {group:"Trabalho & impostos", icon:"briefcase", label:"IrishJobs", url:"https://www.irishjobs.ie/", desc:"Grande volume de vagas profissionais e operacionais"},
  {group:"Trabalho & impostos", icon:"briefcase", label:"Indeed Ireland", url:"https://ie.indeed.com/", desc:"Busca ampla de vagas — ótimo para alertas por cidade e palavra-chave"},
  {group:"Trabalho & impostos", icon:"briefcase", label:"LinkedIn Jobs", url:"https://www.linkedin.com/jobs/", desc:"TI, suporte, finanças, vendas, multilíngue e networking"},
  {group:"Trabalho & impostos", icon:"briefcase", label:"Jobs.ie", url:"https://www.jobs.ie/", desc:"Hotelaria, varejo, atendimento, administração e entrada"},
  {group:"Trabalho & impostos", icon:"briefcase", label:"HotelJobs", url:"https://www.hoteljobs.ie/", desc:"Hotéis, restaurantes, cozinha, recepção e gestão"},
  {group:"Trabalho & impostos", icon:"briefcase", label:"EURES", url:"https://eures.europa.eu/", desc:"Mobilidade dentro da UE, vagas e orientação para cidadãos europeus"},
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
  {id:"trinity", name:"Trinity College + Book of Kells", cat:"Cidades", region:"Dublin", country:"IE", desc:"Campus histórico com o Book of Kells, manuscrito medieval de mais de mil anos. Reserva recomendada.", top15:true},
  {id:"temple-bar", name:"Temple Bar", cat:"Pubs e experiências", region:"Dublin", country:"IE", free:true, desc:"Bairro turístico com pubs, música ao vivo e ruas movimentadas — mais caro, não limite a experiência de pub só a ele."},
  {id:"grafton", name:"Grafton Street", cat:"Cidades", region:"Dublin", country:"IE", free:true, desc:"Uma das áreas comerciais mais importantes do centro, com lojas, cafés e artistas de rua."},
  {id:"stephens-green", name:"St Stephen's Green", cat:"Natureza", region:"Dublin", country:"IE", free:true, desc:"Parque central gratuito, ótimo para caminhada e descanso."},
  {id:"dublin-castle", name:"Dublin Castle", cat:"Castelos e história", region:"Dublin", country:"IE", desc:"Complexo histórico fundamental para entender a história política da Irlanda."},
  {id:"christchurch", name:"Christ Church Cathedral", cat:"Castelos e história", region:"Dublin", country:"IE", desc:"Catedral histórica com arquitetura impressionante no centro de Dublin."},
  {id:"stpatricks", name:"St Patrick's Cathedral", cat:"Castelos e história", region:"Dublin", country:"IE", desc:"Maior catedral da Irlanda, ligada à história de São Patrício."},
  {id:"hapenny", name:"Ha'penny Bridge", cat:"Cidades", region:"Dublin", country:"IE", free:true, desc:"Ponte histórica e gratuita sobre o River Liffey — cartão-postal clássico de Dublin."},
  {id:"kilmainham", name:"Kilmainham Gaol", cat:"Castelos e história", region:"Dublin", country:"IE", desc:"Antiga prisão ligada à luta pela independência irlandesa. Reserva fortemente recomendada."},
  {id:"phoenix-park", name:"Phoenix Park", cat:"Natureza", region:"Dublin", country:"IE", free:true, desc:"Grande parque urbano gratuito — caminhada, bicicleta e piquenique."},
  {id:"epic", name:"EPIC — The Irish Emigration Museum", cat:"Cidades", region:"Dublin", country:"IE", desc:"Museu interativo sobre a emigração irlandesa e sua influência pelo mundo."},
  {id:"guinness", name:"Guinness Storehouse", cat:"Pubs e experiências", region:"Dublin", country:"IE", desc:"Tour sobre a cerveja mais famosa da Irlanda, terminando no Gravity Bar com vista de Dublin.", top15:true},
  {id:"howth", name:"Howth", cat:"Bate-voltas", region:"Dublin (DART)", country:"IE", desc:"Vila costeira com porto, trilhas, falésias e frutos do mar — chegue de DART. Meio dia ou dia inteiro.", top15:true},
  {id:"glendalough", name:"Wicklow &amp; Glendalough", cat:"Natureza", region:"~50km de Dublin", country:"IE", desc:"Antigo assentamento monástico entre montanhas e lagos (Round Tower, Upper/Lower Lake). Bate-volta clássico.", top15:true},
  {id:"kilkenny-castle", name:"Kilkenny (Castelo + Medieval Mile)", cat:"Cidades", region:"Kilkenny", country:"IE", desc:"Cidade medieval fácil de explorar a pé, com castelo visitável e catedral de St Canice.", top15:true},
  {id:"galway-centro", name:"Galway (Latin Quarter + Spanish Arch)", cat:"Cidades", region:"Galway", country:"IE", free:true, desc:"Centro boêmio com pubs de música ao vivo, Spanish Arch e Salthill Promenade ao pôr do sol.", top15:true},
  {id:"cliffs", name:"Cliffs of Moher", cat:"Natureza", region:"County Clare", country:"IE", desc:"Falésias voltadas para o Atlântico — um dos cartões-postais da Irlanda. Depende do clima; nunca ultrapasse as barreiras de segurança.", top15:true},
  {id:"doolin", name:"Doolin", cat:"Bate-voltas", region:"County Clare", country:"IE", free:true, desc:"Vila conhecida pela música tradicional, perto dos Cliffs of Moher — boa opção de pernoite."},
  {id:"burren", name:"The Burren", cat:"Natureza", region:"County Clare", country:"IE", desc:"Paisagem calcária única, com o Poulnabrone Dolmen e estradas panorâmicas."},
  {id:"connemara", name:"Connemara &amp; Kylemore Abbey", cat:"Natureza", region:"County Galway", country:"IE", desc:"Paisagens rurais, montanhas e lagos; Kylemore Abbey é uma construção histórica à beira de um lago.", top15:true},
  {id:"aran", name:"Aran Islands", cat:"Natureza", region:"Balsa de Galway", country:"IE", desc:"Inis Mór (recomendada para primeira visita), fortalezas pré-históricas e muros de pedra — ferry + bicicleta.", top15:true},
  {id:"cork-market", name:"Cork (English Market)", cat:"Cidades", region:"Cork", country:"IE", free:true, desc:"Mercado gastronômico imperdível em Cork, com St Anne's Church e Cork City Gaol por perto."},
  {id:"blarney", name:"Blarney Castle", cat:"Castelos e história", region:"perto de Cork", country:"IE", desc:"Castelo famoso pela Blarney Stone e pelos jardins.", top15:true},
  {id:"cobh", name:"Cobh", cat:"Bate-voltas", region:"perto de Cork", country:"IE", free:true, desc:"Último porto de escala do Titanic — Titanic Experience, St Colman's Cathedral e Deck of Cards."},
  {id:"kinsale", name:"Kinsale", cat:"Bate-voltas", region:"perto de Cork", country:"IE", free:true, desc:"Cidade costeira de gastronomia, porto e casas coloridas."},
  {id:"killarney-np", name:"Killarney National Park", cat:"Natureza", region:"Killarney", country:"IE", free:true, desc:"Ross Castle, Muckross House/Gardens, Torc Waterfall, Ladies View e Gap of Dunloe."},
  {id:"ring-kerry", name:"Ring of Kerry", cat:"Natureza", region:"County Kerry", country:"IE", desc:"Road trip circular de ~1 a 2 dias: Killorglin → Cahersiveen → Waterville → Sneem → Kenmare.", top15:true},
  {id:"dingle", name:"Dingle Peninsula", cat:"Natureza", region:"County Kerry", country:"IE", desc:"Slea Head Drive (Dingle → Ventry → Slea Head → Dunquin → Ballyferriter), Inch Beach e Gallarus Oratory.", top15:true},
  {id:"cashel", name:"Rock of Cashel", cat:"Castelos e história", region:"County Tipperary", country:"IE", desc:"Complexo medieval no alto de uma colina — boa parada na rota Dublin → Kilkenny → Cork."},
  {id:"belfast-centro", name:"Belfast (centro)", cat:"Cidades", region:"Irlanda do Norte", country:"NI", free:true, desc:"City Hall, Cathedral Quarter, St George's Market e Peace Walls — moeda Libra, parte do Reino Unido.", top15:true},
  {id:"titanic-belfast", name:"Titanic Belfast", cat:"Castelos e história", region:"Belfast", country:"NI", desc:"Museu sobre a história do Titanic no estaleiro onde foi construído."},
  {id:"giants-causeway", name:"Giant's Causeway", cat:"Natureza", region:"Irlanda do Norte", country:"NI", free:true, desc:"Milhares de colunas de basalto vulcânico (UNESCO) — o acesso à costa é livre; só o centro de visitantes e o estacionamento são pagos. Combine com Carrick-a-Rede e Dunluce Castle.", top15:true},
  {id:"carrick-a-rede", name:"Carrick-a-Rede Rope Bridge", cat:"Natureza", region:"Irlanda do Norte", country:"NI", desc:"Ponte de corda sobre penhascos — combine com Giant's Causeway e Dunluce Castle."},
  {id:"dunluce", name:"Dunluce Castle", cat:"Castelos e história", region:"Irlanda do Norte", country:"NI", desc:"Ruínas de castelo junto a falésias na Causeway Coast."}
];
function attrState(id){ return ls("attr_"+id) || {want:false, visited:false, fav:false}; }
function setAttrState(id, patch){ var s = attrState(id); Object.assign(s, patch); ls("attr_"+id, s); }
var attrCatView = ls("attrCatView") || "Todos";
var attrFreeOnly = ls("attrFreeOnly") || false;
function renderAttrCatTabs(){
  var cats = ["Todos"].concat(ATTR_CATS);
  document.getElementById("attrCatTabs").innerHTML = cats.map(function(c){
    return '<button class="subtab'+(attrCatView===c?' active':'')+'" data-cat="'+c+'">'+c+'</button>';
  }).join("")+
  '<button class="subtab'+(attrFreeOnly?' active':'')+'" id="attrFreeToggle" type="button" style="margin-left:6px;">€0 Só grátis</button>';
  document.querySelectorAll("#attrCatTabs .subtab[data-cat]").forEach(function(b){
    b.addEventListener("click", function(){ attrCatView = b.dataset.cat; ls("attrCatView", attrCatView); renderAttrCatTabs(); renderAttrGrid(); });
  });
  document.getElementById("attrFreeToggle").addEventListener("click", function(){
    attrFreeOnly = !attrFreeOnly; ls("attrFreeOnly", attrFreeOnly); renderAttrCatTabs(); renderAttrGrid();
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
  if(attrFreeOnly) list = list.filter(function(a){ return a.free; });
  document.getElementById("attrGridWrap").innerHTML = list.length ? list.map(function(a){
    var s = attrState(a.id);
    var countryBadge = a.country==="NI" ? '<span class="pill" style="background:var(--warn-soft);color:var(--warn-strong);">🇬🇧 Reino Unido</span>' : '<span class="pill" style="background:var(--accent-soft);color:var(--accent-strong);">🇮🇪 Irlanda</span>';
    return '<div class="exp-card">'+
      (a.top15?'<div class="eyebrow-alt" style="margin-bottom:6px;">TOP 15</div>':'')+
      '<h4>'+a.name+'</h4><p style="margin-bottom:4px;color:var(--gold-text);font-size:12.5px;font-weight:700;">'+a.region+'</p>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">'+countryBadge+(a.free?'<span class="pill" style="background:var(--accent-soft);color:var(--accent-strong);">Grátis</span>':'')+'</div>'+
      '<p>'+a.desc+'</p>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">'+
      '<button class="btn-ghost btn" data-id="'+a.id+'" data-f="want" style="width:auto;padding:6px 10px;font-size:12.5px;'+(s.want?'background:var(--accent-soft);border-color:var(--accent);':'')+'">Quero ir</button>'+
      '<button class="btn-ghost btn" data-id="'+a.id+'" data-f="visited" style="width:auto;padding:6px 10px;font-size:12.5px;'+(s.visited?'background:var(--accent-soft);border-color:var(--accent);':'')+'">Já visitei</button>'+
      '<button class="btn-ghost btn" data-id="'+a.id+'" data-f="fav" style="width:auto;padding:6px 10px;font-size:12.5px;'+(s.fav?'background:var(--warn-soft);border-color:var(--warn);':'')+'">'+STAR_ICON+' Favorito</button>'+
      '</div></div>';
  }).join("") : '<div class="empty">Nenhuma atração gratuita nesta categoria — tente outra categoria ou desmarque "Só grátis".</div>';
  document.querySelectorAll("#attrGridWrap [data-f]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var s = attrState(btn.dataset.id);
      var patch = {}; patch[btn.dataset.f] = !s[btn.dataset.f];
      setAttrState(btn.dataset.id, patch);
      renderAttrGrid(); renderAttrProgress(); renderMyItinerary();
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
function renderMyItinerary(){
  var wrap = document.getElementById("myItineraryWrap");
  if(!wrap) return;
  var wanted = ATTRACTIONS.filter(function(a){ return attrState(a.id).want; });
  if(!wanted.length){
    wrap.innerHTML = '<div class="empty">Nenhuma atração marcada como "Quero ir" ainda — volte à grade acima e escolha algumas.</div>';
    return;
  }
  var rows = wanted.map(function(a){
    var day = attrState(a.id).day || "";
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">'+
      '<input type="number" min="1" placeholder="Dia" value="'+day+'" data-day-id="'+a.id+'" style="width:56px;padding:6px 8px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:13px;">'+
      '<div style="flex:1;"><b style="font-size:13.5px;">'+a.name+'</b><span style="color:var(--muted);font-size:12px;margin-left:6px;">'+a.region+'</span></div>'+
      '</div>';
  }).join("");
  var grouped = {};
  var noDay = [];
  wanted.forEach(function(a){
    var day = attrState(a.id).day;
    if(day){ (grouped[day] = grouped[day] || []).push(a.name); }
    else noDay.push(a.name);
  });
  var days = Object.keys(grouped).map(Number).sort(function(a,b){ return a-b; });
  var summary = days.map(function(d){ return tipRow("Dia "+d, grouped[d].join(", ")); }).join("")+
    (noDay.length ? tipRow("Sem dia definido", noDay.join(", ")) : "");
  wrap.innerHTML =
    '<div class="card" style="margin-bottom:14px;">'+
    '<h3 style="font-size:15px;">Atribuir dias</h3>'+rows+
    '</div>'+
    '<div class="card"><h3 style="font-size:15px;">Resumo do seu roteiro</h3>'+(summary||'<div class="empty">Defina um dia para cada atração acima.</div>')+'</div>';
  document.querySelectorAll("#myItineraryWrap [data-day-id]").forEach(function(inp){
    inp.addEventListener("change", function(){
      setAttrState(inp.dataset.dayId, {day: parseInt(inp.value)||null});
      renderMyItinerary();
    });
  });
}
var TOURISM_VERIFIED_AT = "2026-09-11";
function renderNiInfo(){
  var wrap = document.getElementById("niInfoWrap");
  if(!wrap) return;
  wrap.innerHTML =
    '<div class="grid cols-2">'+
    '<div class="card"><h3>Moeda</h3><p style="margin:0;">Na <b>República da Irlanda</b> (Dublin, Cork, Galway, Kerry, Clare etc.) usa-se o <b>Euro (€)</b>. Na <b>Irlanda do Norte</b> (Belfast, Giant\'s Causeway, Carrick-a-Rede, Dunluce Castle, Derry), a moeda é a <b>Libra Esterlina (£)</b> — é outro país, faz parte do Reino Unido. Nunca some valores em € e £ direto no orçamento sem converter.</p></div>'+
    '<div class="card"><h3>Preciso de autorização para visitar a Irlanda do Norte?</h3><p style="margin:0;">Viajantes que não precisam de visto para entrar no Reino Unido — o que inclui brasileiros — geralmente precisam solicitar o <b>UK ETA (Electronic Travel Authorisation)</b> antes da viagem, mesmo cruzando por terra a partir da República da Irlanda. Cidadãos da UE/EEE e quem já reside legalmente no Reino Unido ou na Irlanda podem ter regras diferentes. Confirme sua situação específica antes de ir.</p></div>'+
    '</div>'+
    officialSourceHtml("https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta", TOURISM_VERIFIED_AT);
}
var TOURISM_CALENDAR = [
  {month:"Janeiro", clima:"Frio, ~5–8°C", luz:"~8h de luz", turistas:"Baixo", preco:"Baixo", obs:"Pós-Natal calmo; dias curtos."},
  {month:"Fevereiro", clima:"Frio, ~5–9°C", luz:"~9h de luz", turistas:"Baixo", preco:"Baixo", obs:"Ainda tranquilo e barato."},
  {month:"Março", clima:"Ameno, ~7–11°C", luz:"~11h de luz", turistas:"Baixo-médio", preco:"Baixo", obs:"St. Patrick's Day (17/03) lota Dublin por poucos dias."},
  {month:"Abril", clima:"Ameno, ~8–13°C", luz:"~13h de luz", turistas:"Médio", preco:"Médio", obs:"Páscoa pode elevar preços pontualmente."},
  {month:"Maio", clima:"Agradável, ~10–15°C", luz:"~16h de luz", turistas:"Médio", preco:"Médio", obs:"Um dos melhores meses: bom clima, menos gente que o verão."},
  {month:"Junho", clima:"Agradável, ~12–17°C", luz:"~18h de luz", turistas:"Alto", preco:"Alto", obs:"Dias muito longos; comece a reservar com antecedência."},
  {month:"Julho", clima:"Mais quente, ~13–19°C", luz:"~17h de luz", turistas:"Muito alto", preco:"Alto", obs:"Pico de temporada — mais caro e mais cheio."},
  {month:"Agosto", clima:"Mais quente, ~13–18°C", luz:"~16h de luz", turistas:"Muito alto", preco:"Alto", obs:"Ainda pico; férias escolares europeias."},
  {month:"Setembro", clima:"Agradável, ~11–16°C", luz:"~13h de luz", turistas:"Médio", preco:"Médio", obs:"Outro dos melhores meses: bom clima, menos turistas que julho/agosto."},
  {month:"Outubro", clima:"Fresco, ~9–13°C", luz:"~11h de luz", turistas:"Médio-baixo", preco:"Médio-baixo", obs:"Paisagens de outono; chuva aumenta."},
  {month:"Novembro", clima:"Frio, ~6–10°C", luz:"~8h de luz", turistas:"Baixo", preco:"Baixo", obs:"Dias curtos e chuvosos, mas preços melhores."},
  {month:"Dezembro", clima:"Frio, ~5–9°C", luz:"~7h de luz", turistas:"Médio (feriados)", preco:"Médio-alto", obs:"Mercados de Natal, mas Réveillon/véspera de Natal encarece hospedagem."}
];
function renderTourismCalendar(){
  var el = document.getElementById("tourismCalendarTable");
  if(!el) return;
  var rows = TOURISM_CALENDAR.map(function(m){
    return '<tr><td data-label="Mês"><strong>'+m.month+'</strong></td><td data-label="Clima">'+m.clima+'</td><td data-label="Luz do dia">'+m.luz+'</td><td data-label="Turistas">'+m.turistas+'</td><td data-label="Preço">'+m.preco+'</td><td data-label="Observação">'+m.obs+'</td></tr>';
  }).join("");
  el.innerHTML = '<thead><tr><th>Mês</th><th>Clima</th><th>Luz do dia</th><th>Turistas</th><th>Preço</th><th>Observação</th></tr></thead><tbody>'+rows+'</tbody>';
}
var HERITAGE_CARD = {
  adulto:40, senior:30, estudante:10, jovem:10, familia:90,
  sourceUrl:"https://heritageireland.ie/"
};
function renderTourismPasses(){
  var wrap = document.getElementById("tourismPassesWrap");
  if(!wrap) return;
  wrap.innerHTML =
    '<div class="card">'+
    '<h3>OPW Heritage Card</h3>'+
    '<p style="margin:0 0 10px;">Dá acesso a dezenas de sítios históricos administrados pelo OPW (castelos, abadias, sítios arqueológicos) por até um ano. Vale a pena se você for visitar vários desses locais na mesma viagem.</p>'+
    '<div class="tablewrap" style="margin-bottom:14px;"><table><tbody>'+
    '<tr><td>Adulto</td><td class="num tabular">€'+HERITAGE_CARD.adulto+'</td></tr>'+
    '<tr><td>Senior (65+)</td><td class="num tabular">€'+HERITAGE_CARD.senior+'</td></tr>'+
    '<tr><td>Estudante</td><td class="num tabular">€'+HERITAGE_CARD.estudante+'</td></tr>'+
    '<tr><td>12–18 anos</td><td class="num tabular">€'+HERITAGE_CARD.jovem+'</td></tr>'+
    '<tr><td>Família</td><td class="num tabular">€'+HERITAGE_CARD.familia+'</td></tr>'+
    '</tbody></table></div>'+
    '<h4 style="font-size:14px;margin:0 0 8px;">Vale a pena para o meu roteiro?</h4>'+
    '<div class="mini-form-grid" style="margin-bottom:10px;">'+
    '<div><label>Quantos sítios OPW você vai visitar?</label><input type="number" id="heritageSites" value="3" min="0"></div>'+
    '<div><label>Preço médio do ingresso avulso (€)</label><input type="number" id="heritagePrice" value="8" step="0.5" min="0"></div>'+
    '</div>'+
    '<div id="heritageResult" class="callout" style="margin-top:0;"></div>'+
    '</div>';
  function updateHeritage(){
    var n = parseInt(document.getElementById("heritageSites").value)||0;
    var price = parseFloat(document.getElementById("heritagePrice").value)||0;
    var totalAvulso = n*price;
    var diff = totalAvulso - HERITAGE_CARD.adulto;
    var msg = totalAvulso===0 ? "Informe quantos sítios pretende visitar para comparar."
      : diff > 0 ? "Ingressos avulsos sairiam por €"+totalAvulso.toFixed(2)+" — o Heritage Card (€"+HERITAGE_CARD.adulto+") economizaria cerca de €"+diff.toFixed(2)+"."
      : "Ingressos avulsos sairiam por €"+totalAvulso.toFixed(2)+" — mais barato que o Heritage Card (€"+HERITAGE_CARD.adulto+") neste caso.";
    document.getElementById("heritageResult").textContent = msg;
  }
  document.getElementById("heritageSites").addEventListener("input", updateHeritage);
  document.getElementById("heritagePrice").addEventListener("input", updateHeritage);
  updateHeritage();
  wrap.insertAdjacentHTML("beforeend", officialSourceHtml(HERITAGE_CARD.sourceUrl, TOURISM_VERIFIED_AT));
}
var TOURISM_CHECKLIST = [
  {id:"passaporte-tur", label:"Passaporte válido (mín. 6 meses após a viagem)"},
  {id:"seguro-tur", label:"Seguro viagem contratado para todo o período"},
  {id:"passagem-tur", label:"Passagem aérea e conexões confirmadas"},
  {id:"hospedagem-tur", label:"Hospedagem reservada para todas as noites"},
  {id:"esim-tur", label:"eSIM ou chip local providenciado"},
  {id:"cartao-tur", label:"Cartão internacional habilitado para uso na Irlanda/Reino Unido"},
  {id:"eta-tur", label:"Verificou se precisa de UK ETA (caso vá à Irlanda do Norte)"},
  {id:"cnh-tur", label:"Carteira de motorista + permissão internacional, se for alugar carro"},
  {id:"adaptador-tur", label:"Adaptador de tomada (padrão britânico/irlandês, tipo G)"},
  {id:"impermeavel-tur", label:"Roupa impermeável e casaco corta-vento"},
  {id:"powerbank-tur", label:"Power bank carregado"},
  {id:"medicamentos-tur", label:"Medicamentos de uso contínuo, com receita se necessário"}
];
function renderTourismChecklist(){
  var wrap = document.getElementById("tourismChecklistWrap");
  if(!wrap) return;
  var state = ls("turistChecklist") || {};
  wrap.innerHTML = TOURISM_CHECKLIST.map(function(it){ return checkItemHtml(it.id, it.label, null, !!state[it.id]); }).join("");
  document.querySelectorAll("#tourismChecklistWrap .checkitem").forEach(function(el){
    el.querySelector(".checkitem-input").addEventListener("change", function(){
      var st = ls("turistChecklist") || {};
      st[el.dataset.id] = !st[el.dataset.id];
      ls("turistChecklist", st);
      el.classList.toggle("checked", st[el.dataset.id]);
    });
  });
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
  "Montar roteiros sem considerar o horário do pôr do sol no inverno.",
  "Achar que a Irlanda do Norte usa Euro — lá a moeda é a Libra Esterlina (GBP), e é parte do Reino Unido.",
  "Não verificar se seu passaporte precisa de autorização de viagem (ETA) para entrar no Reino Unido antes de ir a Belfast/Causeway Coast.",
  "Ignorar o custo e a disponibilidade de estacionamento ao planejar um dia de carro em cidades pequenas."
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
  renderComeceAqui();
  renderComoEscolherEscola();
  renderSchoolTabs(); renderSchoolsTable(); renderSchoolAddForm();
  renderAssessoria();
  renderJobTypes();
  renderJobRoleTabs(); renderJobRoleContent(); renderJobAddForm();
  renderAgencias();
  renderGlossario();
  renderEnglish();
  renderTouristEntry(); renderTouristCities(); renderTouristBudget(); renderTouristTips(); renderTouristExperiences();
  renderNiInfo(); renderTourismCalendar(); renderTourismPasses(); renderTourismChecklist();
  renderAttrCatTabs(); renderAttrGrid(); renderAttrProgress();
  renderItineraryTabs(); renderItinerary(); renderMyItinerary(); renderMistakes();
  renderMoradia();
  renderScamChecklist();
  renderTransportApps(); renderLeapCards(); renderTransportGallery(); renderTransportOvernight(); renderTransportMetrolink(); renderTransportIntercity();
  renderTransportCityTabs(); renderTransportRoutes();
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
if("serviceWorker" in navigator){
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js").catch(function(){ /* offline/PWA é um extra — sem service worker o site continua funcionando normal */ });
  });
}
