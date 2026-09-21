/* Aba Finanças: meta de reserva, rota mês a mês, primeiro mês, reserva (runway) e
   "Quanto dinheiro preciso". Carregado antes de app.js; usa ls(), getBudget(), sumExpenses(),
   gastosLinhas(), gastosTotais(), tripDaysLeft() etc. só em tempo de execução.
   Ícones: Phosphor Icons (MIT), peso regular. */

var PHI = {"plane":"<path d=\"M185.33,114.21l29.14-27.42.17-.17a32,32,0,0,0-45.26-45.26c0,.06-.11.11-.17.17L141.79,70.67l-83-30.2a8,8,0,0,0-8.39,1.86l-24,24a8,8,0,0,0,1.22,12.31l63.89,42.59L76.69,136H56a8,8,0,0,0-5.65,2.34l-24,24A8,8,0,0,0,29,175.42l36.82,14.73,14.7,36.75.06.16a8,8,0,0,0,13.18,2.47l23.87-23.88A8,8,0,0,0,120,200V179.31l14.76-14.76,42.59,63.89a8,8,0,0,0,12.31,1.22l24-24a8,8,0,0,0,1.86-8.39Zm-.07,97.23-42.59-63.88A8,8,0,0,0,136.8,144c-.27,0-.53,0-.79,0a8,8,0,0,0-5.66,2.35l-24,24A8,8,0,0,0,104,176v20.69L90.93,209.76,79.43,181A8,8,0,0,0,75,176.57l-28.74-11.5L59.32,152H80a8,8,0,0,0,5.66-2.34l24-24a8,8,0,0,0-1.22-12.32L44.56,70.74l13.5-13.49,83.22,30.26a8,8,0,0,0,8.56-2L180.78,52.6A16,16,0,0,1,203.4,75.23l-32.87,30.93a8,8,0,0,0-2,8.56l30.26,83.22Z\"/>","cap":"<path d=\"M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87v48.42a15.91,15.91,0,0,0,4.06,10.65C49.16,191.53,78.51,216,128,216a130,130,0,0,0,48-8.76V240a8,8,0,0,0,16,0V199.51a115.63,115.63,0,0,0,27.94-22.57A15.91,15.91,0,0,0,224,166.29V117.87l27.76-14.81a8,8,0,0,0,0-14.12ZM128,200c-43.27,0-68.72-21.14-80-33.71V126.4l76.24,40.66a8,8,0,0,0,7.52,0L176,143.47v46.34C163.4,195.69,147.52,200,128,200Zm80-33.75a97.83,97.83,0,0,1-16,14.25V134.93l16-8.53ZM188,118.94l-.22-.13-56-29.87a8,8,0,0,0-7.52,14.12L171,128l-43,22.93L25,96,128,41.07,231,96Z\"/>","shield":"<path d=\"M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z\"/>","house":"<path d=\"M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,120l80-80,80,80v88H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48Zm96,88H112V160h32Z\"/>","key":"<path d=\"M216.57,39.43A80,80,0,0,0,83.91,120.78L28.69,176A15.86,15.86,0,0,0,24,187.31V216a16,16,0,0,0,16,16H72a8,8,0,0,0,8-8V208H96a8,8,0,0,0,8-8V184h16a8,8,0,0,0,5.66-2.34l9.56-9.57A79.73,79.73,0,0,0,160,176h.1A80,80,0,0,0,216.57,39.43ZM224,98.1c-1.09,34.09-29.75,61.86-63.89,61.9H160a63.7,63.7,0,0,1-23.65-4.51,8,8,0,0,0-8.84,1.68L116.69,168H96a8,8,0,0,0-8,8v16H72a8,8,0,0,0-8,8v16H40V187.31l58.83-58.82a8,8,0,0,0,1.68-8.84A63.72,63.72,0,0,1,96,95.92c0-34.14,27.81-62.8,61.9-63.89A64,64,0,0,1,224,98.1ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z\"/>","food":"<path d=\"M224,104h-8.37a88,88,0,0,0-175.26,0H32a8,8,0,0,0-8,8,104.35,104.35,0,0,0,56,92.28V208a16,16,0,0,0,16,16h64a16,16,0,0,0,16-16v-3.72A104.35,104.35,0,0,0,232,112,8,8,0,0,0,224,104Zm-24.46,0H148.12a71.84,71.84,0,0,1,41.27-29.57A71.45,71.45,0,0,1,199.54,104ZM173.48,56.23q2.75,2.25,5.27,4.75a87.92,87.92,0,0,0-49.15,43H100.1A72.26,72.26,0,0,1,168,56C169.83,56,171.66,56.09,173.48,56.23ZM128,40a71.87,71.87,0,0,1,19,2.57A88.36,88.36,0,0,0,83.33,104H56.46A72.08,72.08,0,0,1,128,40Zm36.66,152A8,8,0,0,0,160,199.3V208H96v-8.7A8,8,0,0,0,91.34,192a88.29,88.29,0,0,1-51-72H215.63A88.29,88.29,0,0,1,164.66,192Z\"/>","bus":"<path d=\"M184,32H72A32,32,0,0,0,40,64V208a16,16,0,0,0,16,16H80a16,16,0,0,0,16-16V192h64v16a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V64A32,32,0,0,0,184,32ZM56,176V120H200v56Zm0-96H200v24H56ZM72,48H184a16,16,0,0,1,16,16H56A16,16,0,0,1,72,48Zm8,160H56V192H80Zm96,0V192h24v16Zm-72-60a12,12,0,1,1-12-12A12,12,0,0,1,104,148Zm72,0a12,12,0,1,1-12-12A12,12,0,0,1,176,148Zm72-68v24a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0ZM24,80v24a8,8,0,0,1-16,0V80a8,8,0,0,1,16,0Z\"/>","phone":"<path d=\"M176,16H80A24,24,0,0,0,56,40V216a24,24,0,0,0,24,24h96a24,24,0,0,0,24-24V40A24,24,0,0,0,176,16ZM72,64H184V192H72Zm8-32h96a8,8,0,0,1,8,8v8H72V40A8,8,0,0,1,80,32Zm96,192H80a8,8,0,0,1-8-8v-8H184v8A8,8,0,0,1,176,224Z\"/>","id":"<path d=\"M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm40-80V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56ZM216,200V56H40V200H216Zm-80.26-34a8,8,0,1,1-15.5,4c-2.63-10.26-13.06-18-24.25-18s-21.61,7.74-24.25,18a8,8,0,1,1-15.5-4,39.84,39.84,0,0,1,17.19-23.34,32,32,0,1,1,45.12,0A39.76,39.76,0,0,1,135.75,166ZM96,136a16,16,0,1,0-16-16A16,16,0,0,0,96,136Z\"/>","lifebuoy":"<path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm39.1,131.79a47.84,47.84,0,0,0,0-55.58l28.5-28.49a87.83,87.83,0,0,1,0,112.56ZM96,128a32,32,0,1,1,32,32A32,32,0,0,1,96,128Zm88.28-67.6L155.79,88.9a47.84,47.84,0,0,0-55.58,0L71.72,60.4a87.83,87.83,0,0,1,112.56,0ZM60.4,71.72l28.5,28.49a47.84,47.84,0,0,0,0,55.58L60.4,184.28a87.83,87.83,0,0,1,0-112.56ZM71.72,195.6l28.49-28.5a47.84,47.84,0,0,0,55.58,0l28.49,28.5a87.83,87.83,0,0,1-112.56,0Z\"/>","check":"<path d=\"M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z\"/>","pencil":"<path d=\"M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z\"/>","wallet":"<path d=\"M216,64H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,56V184a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64Zm0,128H56a8,8,0,0,1-8-8V78.63A23.84,23.84,0,0,0,56,80H216Zm-48-60a12,12,0,1,1,12,12A12,12,0,0,1,168,132Z\"/>","calendar":"<path d=\"M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z\"/>","info":"<path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z\"/>"};
function phi(name, cls){
  return '<svg class="phi'+(cls?' '+cls:'')+'" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">'+(PHI[name]||"")+'</svg>';
}

/* ---------- formatação padrão da área: € 2.100 · R$ 4.124 · 20/10/2026 ---------- */
function fmtEur(v){
  var n = Number(v)||0;
  if(n<0) return "-"+fmtEur(-n);
  var  cents = Math.abs(n-Math.round(n)) > 0.004;
  return "€ "+n.toLocaleString("pt-BR",{minimumFractionDigits:cents?2:0, maximumFractionDigits:cents?2:0});
}
function fmtBrl(v){ return "R$ "+Math.round(Number(v)||0).toLocaleString("pt-BR"); }
function fmtDay(d){ return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear(); }
function addMonthsClamped(d, k){
  var y = d.getFullYear(), m = d.getMonth()+k, last = new Date(y, m+1, 0).getDate();
  return new Date(y, m, Math.min(d.getDate(), last));
}

/* ---------- meta ---------- */
/* €833/mês × 8 meses = €6.665: valor oficial do ISD para curso de inglês de até 8 meses (conferido em 20/09/2026). */
var PROOF_OF_FUNDS_EUR = 6665, PROOF_CHECKED_AT = "2026-09-20";
function goalIsCustom(){
  var g = ls("savingsGoal");
  return g!==null && g!==undefined && g!=="" && parseFloat(g)!==PROOF_OF_FUNDS_EUR;
}
function savingsGoalValue(){
  var g = ls("savingsGoal");
  if(g!==null && g!==undefined && g!=="") return parseFloat(g) || 0;
  return getProfile()==="non-eu" ? PROOF_OF_FUNDS_EUR : 0;
}
/* Depósitos mensais no mesmo dia do mês de hoje, até a data da viagem (o último cai antes do embarque). */
function savingsPlan(goal, saved){
  var days = tripDaysLeft();
  if(days===null || days<=0) return {days:days};
  var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var trip = new Date(ls("tripDate")+"T00:00:00");
  var n = 0;
  while(addMonthsClamped(today, n+1) <= trip) n++;
  var missing = Math.max(0, goal - saved), deposits = Math.max(1, n);
  var monthly = Math.ceil(missing / deposits), rows = [];
  for(var k=1; k<=deposits; k++){
    rows.push({date: n===0 ? trip : addMonthsClamped(today, k), total: Math.min(goal, saved + monthly*k)});
  }
  return {days:days, n:n, deposits:deposits, missing:missing, monthly:monthly, rows:rows, trip:trip};
}
var EXPENSE_LABELS = {rent:"Aluguel", phone:"Celular e contas", transport:"Transporte", groceries:"Mercado", englishCourse:"Escola de inglês", insurance:"Seguro-saúde", gym:"Academia", leisure:"Lazer", other:"Outros gastos", deposit:"Depósito (1 aluguel)"};
function finState(){
  var goal = savingsGoalValue(), saved = parseFloat(ls("travelReserve"))||0, pace = parseFloat(ls("savingsPace"))||0;
  var b = getBudget(), monthlyCost = sumExpenses(b), days = tripDaysLeft();
  var st = {goal:goal, saved:saved, pace:pace, budget:b, monthlyCost:monthlyCost, firstMonth:monthlyCost + b.rent, days:days,
    missing:Math.max(0, goal-saved), over:Math.max(0, saved-goal), kind:"", plan:null};
  if(goal<=0) st.kind = "nogoal";
  else if(saved>=goal) st.kind = "done";
  else if(days===null) st.kind = "nodate";
  else if(days<=0) st.kind = "past";
  else { st.plan = savingsPlan(goal, saved); st.kind = st.plan.n===0 ? "soon" : "plan"; }
  return st;
}

/* ---------- números que "correm" até o novo valor ---------- */
var finLast = {};
function finTweenNumbers(root){
  root.querySelectorAll("[data-tween]").forEach(function(el){
    var key = el.dataset.tween, to = parseFloat(el.dataset.to), from = finLast[key];
    finLast[key] = to;
    if(reduceMotion || from===undefined || from===to || isNaN(from) || isNaN(to)) return;
    var t0 = null, dur = 380;
    function step(ts){
      if(t0===null) t0 = ts;
      var k = Math.min(1, (ts-t0)/dur), e = 1-Math.pow(1-k, 3);
      el.textContent = (el.dataset.fmt==="brl" ? fmtBrl : fmtEur)(k<1 ? Math.round(from + (to-from)*e) : to);
      if(k<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}
function tw(key, value, fmt){ return '<span data-tween="'+key+'" data-to="'+value+'" data-fmt="'+(fmt||"eur")+'">'+(fmt==="brl" ? fmtBrl(value) : fmtEur(value))+'</span>'; }

/* ---------- bloco 1: meta + ritmo ---------- */
function renderFinPlanShell(){
  var el = document.getElementById("finPlanWrap");
  if(!el) return;
  var savedRaw = ls("travelReserve"), paceRaw = ls("savingsPace");
  el.innerHTML =
    '<div class="fin-hero">'+
      '<div class="fin-goal">'+
        '<div class="fin-lbl">Meta para viajar</div>'+
        '<div class="fin-goal-row">'+
          '<button type="button" class="fin-goal-btn" id="finGoalBtn" title="Clique para alterar a meta"><span class="fin-goal-num" id="finGoalNum"></span><span class="fin-goal-edit">'+phi("pencil")+'<span>alterar</span></span></button>'+
          '<input type="number" min="0" step="1" id="svGoal" class="fin-goal-input" aria-label="Meta em euros" hidden>'+
        '</div>'+
        '<p class="fin-goal-note" id="finGoalNote"></p>'+
        '<div class="fin-saved"><label for="svSaved">Você já guardou</label><span class="fin-money-in"><span aria-hidden="true">€</span><input type="number" min="0" step="1" id="svSaved" placeholder="0" value="'+(savedRaw==null?"":savedRaw)+'"></span></div>'+
        '<div id="finRouteBox" hidden>'+
          '<div class="fin-route" id="finRoute" style="--p:0"><div class="fin-route-track"><i class="fin-route-tick" style="left:25%"></i><i class="fin-route-tick" style="left:50%"></i><i class="fin-route-tick" style="left:75%"></i><div class="fin-route-fill"></div></div><div class="fin-route-plane">'+phi("plane")+'</div></div>'+
          '<div class="fin-route-ends"><span>Brasil</span><span>Irlanda</span></div>'+
          '<div class="fin-figs" id="finFigs"></div>'+
        '</div>'+
      '</div>'+
      '<div class="fin-pace">'+
        '<div id="finTripOut"></div>'+
        '<div id="finPaceOut"></div>'+
        '<div class="fin-pace-in" id="finPaceIn"><label for="svPace">Consigo guardar</label><span class="fin-money-in"><span aria-hidden="true">€</span><input type="number" min="0" step="1" id="svPace" placeholder="0" value="'+(paceRaw==null?"":paceRaw)+'"></span><span>por mês</span></div>'+
        '<p class="fin-pace-fb" id="finPaceFb" role="status"></p>'+
      '</div>'+
    '</div>';
  var goalIn = document.getElementById("svGoal"), goalBtn = document.getElementById("finGoalBtn");
  function openGoal(){
    goalIn.value = savingsGoalValue() || "";
    goalIn.hidden = false; goalBtn.hidden = true; goalIn.focus(); goalIn.select();
  }
  function closeGoal(){ goalIn.hidden = true; goalBtn.hidden = false; refreshFinPlan(); }
  goalBtn.addEventListener("click", openGoal);
  goalIn.addEventListener("input", function(){ ls("savingsGoal", goalIn.value); refreshFinPlan(true); });
  goalIn.addEventListener("blur", closeGoal);
  goalIn.addEventListener("keydown", function(e){ if(e.key==="Enter" || e.key==="Escape"){ e.preventDefault(); goalIn.blur(); } });
  document.getElementById("svSaved").addEventListener("input", function(e){ ls("travelReserve", e.target.value); refreshFinPlan(true); });
  document.getElementById("svPace").addEventListener("input", function(e){ ls("savingsPace", e.target.value); refreshFinPlan(true); });
  el.addEventListener("click", function(e){
    var a = e.target.closest("[data-fin]");
    if(!a) return;
    if(a.dataset.fin==="date") openOnboarding("date");
    if(a.dataset.fin==="goal-reset"){ ls("savingsGoal", null); refreshFinPlan(); }
  });
}
function refreshFinPlan(keepInputs){
  var el = document.getElementById("finPlanWrap");
  if(!el || !document.getElementById("finGoalNum")) return;
  var st = finState(), nonEU = getProfile()==="non-eu";
  document.getElementById("finGoalNum").textContent = st.goal>0 ? fmtEur(st.goal) : "Definir meta";
  document.getElementById("finGoalNum").classList.toggle("is-empty", st.goal<=0);
  var note = "";
  if(nonEU && !goalIsCustom()){
    note = 'Valor oficial do ISD para curso de inglês de até 8 meses (€ 833 × 8). Não substitui seu orçamento e muda para estadias mais longas. Conferido em '+formatDateBR(PROOF_CHECKED_AT)+'. <a href="'+F_FIN+'" target="_blank" rel="noopener">Fonte oficial ↗</a>';
  } else if(nonEU){
    note = 'Meta ajustada por você. <button type="button" class="fin-link" data-fin="goal-reset">Voltar ao valor oficial ('+fmtEur(PROOF_OF_FUNDS_EUR)+')</button>';
  } else {
    note = st.goal>0 ? 'Meta definida por você.' : 'Defina quanto quer levar. O total de "Quanto dinheiro preciso", mais abaixo, ajuda a chegar num número.';
  }
  document.getElementById("finGoalNote").innerHTML = note;
  var routeBox = document.getElementById("finRouteBox");
  routeBox.hidden = st.goal<=0;
  if(st.goal>0){
    var pct = Math.min(100, Math.round(st.saved/st.goal*100));
    document.getElementById("finRoute").style.setProperty("--p", pct);
    document.getElementById("finFigs").innerHTML = st.saved>=st.goal
      ? '<span><b>'+fmtEur(st.saved)+'</b> guardados ('+pct+'%)</span>'+(st.over>0 ? '<span>'+fmtEur(st.over)+' além da meta</span>' : '')
      : '<span><b>'+fmtEur(st.saved)+'</b> guardados ('+pct+'%)</span><span>Faltam <b>'+tw("missing", st.missing)+'</b></span>';
  }

  var trip = document.getElementById("finTripOut");
  if(st.days===null) trip.innerHTML = '<div class="fin-trip">'+phi("calendar")+'<span>Sem data de viagem.</span><button type="button" class="fin-link" data-fin="date">Definir data</button></div>';
  else if(st.days<0) trip.innerHTML = '<div class="fin-trip">'+phi("calendar")+'<span>Viagem em '+tripDateShort()+' (já passou).</span><button type="button" class="fin-link" data-fin="date">Atualizar data</button></div>';
  else trip.innerHTML = '<div class="fin-trip">'+phi("calendar")+'<span>Viagem em <b>'+tripDateShort()+'</b>, '+(st.days===0?'é hoje':st.days===1?'falta 1 dia':'faltam '+st.days+' dias')+'.</span><button type="button" class="fin-link" data-fin="date">editar data</button></div>';

  var out = document.getElementById("finPaceOut"), showPace = false;
  if(st.kind==="plan"){
    showPace = true;
    out.innerHTML = '<div class="fin-lbl">Para chegar à meta, guarde</div>'+
      '<div class="fin-pace-num">'+tw("monthly", st.plan.monthly)+'<small>por mês</small></div>'+
      '<div class="fin-pace-brl">≈ '+tw("monthlybrl", st.plan.monthly*getCotacao(), "brl")+' <span>(€ 1 = R$ '+getCotacao().toFixed(2).replace(".",",")+')</span></div>'+
      '<p class="fin-pace-sub">'+st.plan.deposits+(st.plan.deposits===1?' depósito mensal':' depósitos mensais')+' até a viagem.</p>';
  } else if(st.kind==="soon"){
    showPace = true;
    out.innerHTML = '<div class="fin-lbl">A viagem é em menos de 1 mês</div>'+
      '<p class="fin-pace-sub" style="margin-top:6px;">Para chegar à meta até a viagem, seria preciso guardar <b>'+fmtEur(st.missing)+'</b> agora.</p>';
  } else if(st.kind==="done"){
    out.innerHTML = '<div class="fin-done">'+phi("check")+'<div><b>Meta alcançada</b><span>Você já reservou o valor planejado para a viagem.'+(st.over>0 ? ' Sobram '+fmtEur(st.over)+' além da meta.' : '')+'</span></div></div>';
  } else if(st.kind==="nodate"){
    out.innerHTML = '<div class="fin-lbl">Ritmo</div><p class="fin-pace-sub" style="margin-top:6px;">Informe a data da viagem para ver quanto guardar por mês.</p><button type="button" class="btn btn-accent fin-cta" data-fin="date">Definir data da viagem</button>';
  } else if(st.kind==="past"){
    out.innerHTML = '<div class="fin-lbl">Ritmo</div><p class="fin-pace-sub" style="margin-top:6px;">A data da viagem já passou. Atualize a data para recalcular.</p><button type="button" class="btn btn-accent fin-cta" data-fin="date">Atualizar data</button>';
  } else {
    out.innerHTML = '<div class="fin-lbl">Ritmo</div><p class="fin-pace-sub" style="margin-top:6px;">Defina uma meta para ver quanto guardar por mês.</p>';
  }
  document.getElementById("finPaceIn").hidden = !showPace;
  var fb = document.getElementById("finPaceFb");
  if(showPace && st.pace>0){
    var deposits = st.plan ? st.plan.deposits : 1, projected = st.saved + st.pace*deposits;
    fb.innerHTML = projected>=st.goal
      ? phi("check")+'Com '+fmtEur(st.pace)+' por mês você chega à meta antes da viagem.'
      : phi("info")+'Com '+fmtEur(st.pace)+' por mês você junta '+fmtEur(projected)+' até a viagem. Faltam '+fmtEur(st.goal-projected)+'.';
    fb.hidden = false;
  } else { fb.innerHTML = ""; fb.hidden = true; }
  finTweenNumbers(el);
  renderFinRoute(st);
  renderFinDuo(st);
}
function tripDateShort(){
  var td = ls("tripDate"); return td ? formatDateBR(td) : "";
}

/* ---------- bloco 2: rota mês a mês ---------- */
function renderFinRoute(st){
  var el = document.getElementById("finRouteWrap");
  if(!el) return;
  st = st || finState();
  if(st.kind!=="plan"){ el.hidden = true; el.innerHTML = ""; return; }
  el.hidden = false;
  var nodes = '<li class="rota-node is-start"><span class="rota-dot">'+phi("wallet")+'</span><span class="rota-m">Hoje</span><span class="rota-v">'+fmtEur(st.saved)+'</span></li>';
  st.plan.rows.forEach(function(r, i){
    var last = i===st.plan.rows.length-1;
    nodes += '<li class="rota-node'+(last?' is-goal':'')+'"><span class="rota-dot"></span><span class="rota-m">'+MONTHS[r.date.getMonth()]+(r.date.getMonth()===0 || i===0 ? ' '+String(r.date.getFullYear()).slice(2) : '')+'</span><span class="rota-v">'+fmtEur(r.total)+'</span></li>';
  });
  nodes += '<li class="rota-node is-trip"><span class="rota-dot">'+phi("plane")+'</span><span class="rota-m">Viagem</span><span class="rota-v">'+fmtDay(st.plan.trip)+'</span></li>';
  el.innerHTML = '<div class="fin-block-h"><h3>Rota até a Irlanda</h3><p>Quanto você terá guardado ao fim de cada mês, se seguir o ritmo acima.</p></div>'+
    '<div class="rota-scroll" tabindex="0" role="region" aria-label="Rota mês a mês"><ol class="rota">'+nodes+'</ol></div>';
}

/* ---------- bloco 3: primeiro mês + reserva ---------- */
var FIN_TONES = ["#0B5C3B","#0F7A51","#1B9C6B","#5DBB94","#9BD3B7","#C8E5D6"];
function stackHtml(parts){
  var total = parts.reduce(function(s,p){ return s+p.v; }, 0);
  if(total<=0) return "";
  return '<div class="fin-stack" role="img" aria-label="Composição do custo">'+parts.map(function(p, i){
    return '<span style="flex:'+p.v+' 1 0;background:'+p.color+'" title="'+escapeHtml(p.l)+': '+fmtEur(p.v)+'"></span>';
  }).join("")+'</div>'+
  '<ul class="fin-legend">'+parts.map(function(p){
    return '<li><i style="background:'+p.color+'"></i><span>'+escapeHtml(p.l)+'</span><b>'+fmtEur(p.v)+'</b><em>'+Math.round(p.v/total*100)+'%</em></li>';
  }).join("")+'</ul>';
}
function renderFinDuo(st){
  var el = document.getElementById("finDuoWrap");
  if(!el) return;
  st = st || finState();
  var b = st.budget, c = currentCity();
  var parts = EXPENSE_KEYS.map(function(k){ return {k:k, l:EXPENSE_LABELS[k], v:b[k]||0}; }).filter(function(p){ return p.v>0; });
  if(b.rent>0) parts.push({k:"deposit", l:EXPENSE_LABELS.deposit, v:b.rent});
  parts.sort(function(a,b2){ return b2.v-a.v; });
  if(parts.length>6){
    var rest = parts.slice(5).reduce(function(s,p){ return s+p.v; }, 0);
    parts = parts.slice(0,5).concat([{k:"rest", l:"Outros itens", v:rest}]);
  }
  parts.forEach(function(p, i){ p.color = FIN_TONES[i]; });
  var runway;
  if(st.saved>0 && st.monthlyCost>0){
    var months = st.saved/st.monthlyCost, days = Math.round(months*30);
    var cells = Math.max(1, Math.min(6, Math.ceil(months)));
    var cellHtml = "";
    for(var i=0; i<cells; i++){ cellHtml += '<span class="rw-cell"><i style="transform:scaleX('+Math.max(0, Math.min(1, months-i))+')"></i></span>'; }
    var big = months<2 ? '≈ '+days+(days===1?' dia':' dias') : '≈ '+(Math.round(months*10)/10).toString().replace(".",",")+' meses';
    var small = months<2 ? (Math.round(months*10)/10).toString().replace(".",",")+' mês' : days+' dias';
    runway = '<div class="fin-lbl">Sua reserva sustenta você por</div>'+
      '<div class="fin-big">'+big+'</div>'+
      '<p class="fin-eq">'+fmtEur(st.saved)+' ÷ '+fmtEur(st.monthlyCost)+' por mês = '+small+'</p>'+
      '<div class="rw-track" aria-hidden="true">'+cellHtml+'</div>'+
      '<p class="fin-cap">Cada quadro é um mês de despesas.'+(months>6?' Mostrando os 6 primeiros.':'')+'</p>';
  } else {
    runway = '<div class="fin-lbl">Sua reserva sustenta você por</div>'+
      '<p class="fin-cap" style="margin-top:8px;">Informe quanto você já guardou para ver quantos dias ela cobre.</p>';
  }
  el.innerHTML =
    '<div class="fin-duo">'+
      '<div class="fin-col">'+
        '<div class="fin-lbl">Primeiro mês '+(c ? 'em '+escapeHtml(c.name) : 'na Irlanda')+'</div>'+
        '<div class="fin-big">'+tw("firstmonth", st.firstMonth)+'</div>'+
        '<p class="fin-cap">Seus gastos mensais mais um depósito equivalente a 1 aluguel.</p>'+
        stackHtml(parts)+
      '</div>'+
      '<div class="fin-col">'+runway+'</div>'+
    '</div>';
  finTweenNumbers(el);
}

/* ---------- bloco 4: quanto dinheiro preciso ---------- */
var FIN_GROUPS = [
  {name:"Antes de viajar", rows:[0,1,2]},
  {name:"Na chegada", rows:[3,4,5,9]},
  {name:"Primeiro mês", rows:[6,7,8]},
  {name:"Segurança", rows:[10]}
];
var FIN_ROW_ICONS = {0:"plane",1:"cap",2:"shield",3:"house",4:"key",5:"house",6:"food",7:"bus",8:"phone",9:"id",10:"lifebuoy"};
var FIN_SCENARIO_NOTES = [
  "Para gastar o mínimo possível.",
  "Um meio-termo entre custo e folga.",
  "Mais folga para imprevistos."
];
function finScenario(){ var s = ls("gastosCenario"); return (s===0||s===1||s===2) ? s : 1; }
function finGroupOf(line){
  var idx = line.custom ? -1 : parseInt(line.id, 10);
  for(var i=0; i<FIN_GROUPS.length; i++){ if(FIN_GROUPS[i].rows.indexOf(idx)>=0) return i; }
  return FIN_GROUPS.length; /* itens do usuário */
}
function renderGastosIniciais(){
  var wrap = document.getElementById("gastosIniciaisWrap");
  if(!wrap) return;
  if(gastosEditOpen){ renderGastosEditTable(wrap); return; }
  var g = GASTOS_INICIAIS_CENARIOS, sc = finScenario(), pagos = getGastosPagos(), linhas = gastosLinhas(), tot = gastosTotais();
  var groups = FIN_GROUPS.map(function(x){ return {name:x.name, lines:[]}; }).concat([{name:"Meus itens", lines:[]}]);
  linhas.forEach(function(l){ groups[finGroupOf(l)].lines.push(l); });
  var grandTotal = linhas.reduce(function(s,l){ return s+(parseFloat(l.v[sc])||0); }, 0);
  var parts = [];
  groups.forEach(function(gr, i){
    var sum = gr.lines.reduce(function(s,l){ return s+(parseFloat(l.v[sc])||0); }, 0);
    gr.sum = sum;
    if(sum>0) parts.push({l:gr.name, v:sum, color:FIN_TONES[Math.min(parts.length, FIN_TONES.length-1)]});
  });
  var seg = g.cols.map(function(name, ci){
    var on = ci===sc;
    return '<button type="button" role="radio" aria-checked="'+on+'" class="fin-seg-btn'+(on?' is-on':'')+'" data-sc="'+ci+'"><span class="fin-seg-name">'+name+'</span><span class="fin-seg-total">'+tw("sc"+ci, tot.aPagar[ci])+'</span></button>';
  }).join("");
  var body = groups.map(function(gr){
    if(!gr.lines.length) return "";
    return '<section class="fin-group"><header><h4>'+gr.name+'</h4><span class="tabular">'+fmtEur(gr.sum)+'</span></header>'+
      gr.lines.map(function(l){
        var paid = !!pagos[l.id], icon = l.custom ? "wallet" : (FIN_ROW_ICONS[parseInt(l.id,10)] || "wallet");
        return '<div class="fin-row'+(paid?' is-paid':'')+'" data-id="'+l.id+'">'+
          '<span class="fin-row-ico">'+phi(icon)+'</span>'+
          '<span class="fin-row-name">'+escapeHtml(l.item)+'</span>'+
          '<span class="fin-row-amt tabular">'+fmtEur(parseFloat(l.v[sc])||0)+'</span>'+
          '<button type="button" class="fin-pay" data-pay="'+l.id+'" aria-pressed="'+paid+'" aria-label="'+(paid?'Desfazer pago: ':'Marcar como pago: ')+escapeHtml(l.item)+'">'+phi("check")+'<span class="fin-pay-t">'+(paid?'Pago':'Já paguei')+'</span></button>'+
        '</div>';
      }).join("")+'</section>';
  }).join("");
  var compare = '<details class="fin-compare"><summary>Comparar os três cenários item a item</summary><div class="tablewrap"><table><thead><tr><th>Item</th>'+g.cols.map(function(c, ci){ return '<th class="num'+(ci===sc?' is-sel':'')+'">'+c+'</th>'; }).join("")+'</tr></thead><tbody>'+
    linhas.map(function(l){ return '<tr><td data-label="Item">'+escapeHtml(l.item)+'</td>'+l.v.map(function(v, ci){ return '<td class="num tabular'+(ci===sc?' is-sel':'')+'" data-label="'+g.cols[ci]+'">'+fmtEur(parseFloat(v)||0)+'</td>'; }).join("")+'</tr>'; }).join("")+
    '<tr class="fin-cmp-total"><td data-label="Item">Total</td>'+[0,1,2].map(function(ci){ var s = linhas.reduce(function(a,l){ return a+(parseFloat(l.v[ci])||0); }, 0); return '<td class="num tabular'+(ci===sc?' is-sel':'')+'" data-label="'+g.cols[ci]+'">'+fmtEur(s)+'</td>'; }).join("")+'</tr>'+
    '</tbody></table></div></details>';
  wrap.innerHTML =
    '<div class="fin-need">'+
      '<div class="fin-block-h"><h3>Quanto dinheiro preciso</h3><p>Valores de referência. Seus gastos reais podem variar. Marque o que você já pagou e ajuste os números ao seu caso.</p></div>'+
      '<div class="fin-seg" role="radiogroup" aria-label="Cenário de custos">'+seg+'</div>'+
      '<p class="fin-seg-note">'+FIN_SCENARIO_NOTES[sc]+' O total de cada cenário já desconta o que você marcou como pago.</p>'+
      (parts.length>1 ? '<div class="fin-split"><div class="fin-lbl">Para onde vai o dinheiro</div>'+stackHtml(parts)+'</div>' : '')+
      '<div class="fin-groups">'+(body || '<p class="fin-cap">Nenhum item na lista. Use "Ajustar meu orçamento" para adicionar os seus.</p>')+'</div>'+
      '<div class="fin-need-foot"><div><span class="fin-lbl">Ainda falta pagar</span><div class="fin-big fin-foot-num">'+tw("needtotal", tot.aPagar[sc])+'</div></div>'+
        (tot.qtdPagos ? '<div class="fin-paid-sum">Já pago: <b>'+fmtEur(tot.pago[sc])+'</b> em '+tot.qtdPagos+(tot.qtdPagos===1?' item':' itens')+'</div>' : '')+
      '</div>'+
      '<div class="fin-need-actions"><button type="button" class="btn btn-ghost fin-adjust" id="gastosEditBtn">'+phi("pencil")+'Ajustar meu orçamento</button><span>Edite valores ou adicione despesas suas.</span></div>'+
      compare+
    '</div>';
  wrap.querySelectorAll(".fin-seg-btn").forEach(function(b){
    b.addEventListener("click", function(){ ls("gastosCenario", parseInt(b.dataset.sc,10)); renderGastosIniciais(); });
  });
  wrap.querySelectorAll(".fin-pay").forEach(function(b){
    b.addEventListener("click", function(){
      var p = getGastosPagos(), id = b.dataset.pay;
      if(p[id]) delete p[id]; else p[id] = true;
      saveGastosPagos(p);
      renderGastosIniciais();
      var row = document.querySelector('#gastosIniciaisWrap .fin-row[data-id="'+id+'"]');
      if(row){ row.classList.add("just-toggled"); var nb = row.querySelector(".fin-pay"); if(nb && document.activeElement===document.body) nb.focus(); }
    });
  });
  document.getElementById("gastosEditBtn").addEventListener("click", function(){ gastosEditOpen = true; renderGastosIniciais(); });
  finTweenNumbers(wrap);
}
/* Modo de edição: mesma tabela de antes (valores dos três cenários, adicionar e remover itens). */
function renderGastosEditTable(wrap){
  var g = GASTOS_INICIAIS_CENARIOS, pagos = getGastosPagos(), linhas = gastosLinhas();
  var rows = linhas.map(function(l){
    var paid = !!pagos[l.id];
    var tds = l.v.map(function(v, ci){
      return '<td class="num" data-label="'+g.cols[ci]+'"><input type="number" step="1" style="width:68px;text-align:right;" value="'+v+'" data-id="'+l.id+'" data-ci="'+ci+'" aria-label="'+escapeHtml(l.item)+', '+g.cols[ci]+'"></td>';
    }).join("");
    var nome = escapeHtml(l.item);
    return '<tr><td data-label="Item">'+nome+'</td>'+tds+
      '<td class="num" data-label="Já pago?"><input type="checkbox" class="gasto-pago" data-id="'+l.id+'" aria-label="Já paguei: '+nome+'"'+(paid?' checked':'')+' style="width:18px;height:18px;"></td>'+
      '<td class="num" data-label="Remover"><button type="button" class="gasto-remover btn-ghost btn" data-id="'+l.id+'" aria-label="Remover '+nome+'" style="width:auto;padding:4px 10px;font-size:15px;line-height:1;">✕</button></td></tr>';
  }).join("");
  if(!linhas.length) rows = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:18px;">Nenhum item na lista. Adicione os seus abaixo.</td></tr>';
  var t = gastosTotais();
  var totalRow = '<tr style="font-weight:700;"><td data-label="Item">Total a pagar</td>'+t.aPagar.map(function(v,ci){ return '<td class="num tabular" data-label="'+g.cols[ci]+'" id="gastosTotal-'+ci+'">'+fmtEur(v)+'</td>'; }).join("")+'<td></td><td></td></tr>';
  var nRem = Object.keys(getGastosRemovidos()).length;
  var inputStyle = 'padding:9px 11px;border-radius:9px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:14px;';
  wrap.innerHTML =
    '<div class="fin-need">'+
      '<div class="fin-block-h"><h3>Ajustar meu orçamento</h3><p>Mude os valores de cada cenário, remova o que não se aplica ou adicione despesas suas.</p></div>'+
      '<div class="tablewrap"><table><thead><tr><th>Item</th>'+g.cols.map(function(c){ return '<th class="num">'+c+'</th>'; }).join("")+'<th class="num">Já pago?</th><th class="num">Remover</th></tr></thead><tbody>'+rows+totalRow+'</tbody></table></div>'+
      '<div class="fin-add"><h4>Adicionar item</h4>'+
        '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">'+
          '<input type="text" id="gNovoNome" maxlength="60" placeholder="Nome do item (ex.: Visto)" aria-label="Nome do novo item" style="flex:1 1 200px;min-width:160px;'+inputStyle+'">'+
          g.cols.map(function(c, ci){ return '<input type="number" step="1" id="gNovoV'+ci+'" placeholder="'+c+' €" aria-label="Valor '+c+'" style="width:110px;text-align:right;'+inputStyle+'">'; }).join("")+
          '<button type="button" class="btn btn-accent" id="gastosAddBtn" style="width:auto;padding:9px 16px;">Adicionar</button>'+
        '</div></div>'+
      '<div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px;">'+
        '<button type="button" class="btn btn-accent" id="gastosDoneBtn" style="width:auto;padding:9px 16px;">Concluir edição</button>'+
        (nRem ? '<button type="button" class="btn-ghost btn" id="gastosRestoreRemBtn" style="width:auto;padding:8px 14px;">Reexibir '+nRem+(nRem>1?' itens removidos':' item removido')+'</button>' : '')+
        '<button type="button" class="btn-ghost btn" id="gastosResetBtn" style="width:auto;padding:8px 14px;">Restaurar padrão</button>'+
      '</div>'+
    '</div>';
  wrap.querySelectorAll(".gasto-pago").forEach(function(cb){
    cb.addEventListener("change", function(){
      var p = getGastosPagos();
      if(cb.checked) p[cb.dataset.id] = true; else delete p[cb.dataset.id];
      saveGastosPagos(p);
      renderGastosIniciais();
    });
  });
  wrap.querySelectorAll("input[data-id][data-ci]").forEach(function(inp){
    inp.addEventListener("input", function(){
      var val = parseFloat(inp.value)||0, id = inp.dataset.id, ci = parseInt(inp.dataset.ci,10);
      if(id.charAt(0)==="x"){
        var ex = getGastosExtras();
        ex.forEach(function(x){ if(x.id===id) x.v[ci] = val; });
        saveGastosExtras(ex);
      } else {
        var ov = getGastosOverrides();
        ov[id+"_"+ci] = val;
        saveGastosOverrides(ov);
      }
      var tt = gastosTotais();
      [0,1,2].forEach(function(c){ var cell = document.getElementById("gastosTotal-"+c); if(cell) cell.textContent = fmtEur(tt.aPagar[c]); });
    });
  });
  wrap.querySelectorAll(".gasto-remover").forEach(function(btn){
    btn.addEventListener("click", function(){
      var id = btn.dataset.id;
      if(id.charAt(0)==="x") saveGastosExtras(getGastosExtras().filter(function(x){ return x.id!==id; }));
      else { var rem = getGastosRemovidos(); rem[id] = true; saveGastosRemovidos(rem); }
      var p = getGastosPagos(); delete p[id]; saveGastosPagos(p);
      renderGastosIniciais();
    });
  });
  document.getElementById("gastosAddBtn").addEventListener("click", function(){
    var nomeEl = document.getElementById("gNovoNome"), nome = nomeEl.value.trim();
    if(!nome){ nomeEl.focus(); nomeEl.style.borderColor = "var(--warn)"; return; }
    var ex = getGastosExtras();
    ex.push({id:"x"+Date.now().toString(36)+Math.floor(Math.random()*1000).toString(36), item:nome, v:[0,1,2].map(function(ci){ return parseFloat(document.getElementById("gNovoV"+ci).value)||0; })});
    saveGastosExtras(ex);
    renderGastosIniciais();
    document.getElementById("gNovoNome").focus();
  });
  document.getElementById("gNovoNome").addEventListener("keydown", function(e){ if(e.key==="Enter"){ e.preventDefault(); document.getElementById("gastosAddBtn").click(); } });
  var rr = document.getElementById("gastosRestoreRemBtn");
  if(rr) rr.addEventListener("click", function(){ saveGastosRemovidos({}); renderGastosIniciais(); });
  document.getElementById("gastosDoneBtn").addEventListener("click", function(){ gastosEditOpen = false; renderGastosIniciais(); });
  document.getElementById("gastosResetBtn").addEventListener("click", function(){
    if(!window.confirm("Restaurar a lista padrão? Isso desfaz seus valores editados, reexibe os itens removidos e apaga os itens que você adicionou. O que você marcou como já pago é mantido.")) return;
    saveGastosOverrides({}); saveGastosRemovidos({}); saveGastosExtras([]);
    renderGastosIniciais();
  });
}

/* ---------- entrada ---------- */
function renderFinancas(){
  var a = document.activeElement;
  if(a && a.closest && a.closest("#finPlanWrap") && document.getElementById("finGoalNum")){ refreshFinPlan(true); return; }
  renderFinPlanShell();
  refreshFinPlan();
  renderGastosIniciais();
}
/* chamado quando o orçamento mensal muda */
function refreshFinancas(){
  if(document.getElementById("finGoalNum")) refreshFinPlan(true);
}
