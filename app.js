document.addEventListener("DOMContentLoaded", () => {
  initClockAndDate();
  calculateSunAndMoon();
  calculateLunarCalendar();
  fetchDailyQuote();
  fetchInfobaeNews();
});

// 1. Reloj y Saludo
function initClockAndDate() {
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date-display");
  const greetingEl = document.getElementById("greeting-bar");

  function update() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString("es-AR");

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString("es-AR", options);
    dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    const hours = now.getHours();
    let saludo = "Pax vobiscum";
    if (hours >= 6 && hours < 12) saludo = "¡Buenos días en el Reino!";
    else if (hours >= 12 && hours < 20) saludo = "¡Buenas tardes!";
    else saludo = "¡Buenas noches bajo el firmamento!";

    greetingEl.textContent = `${saludo} — Hoy es ${dateEl.textContent}.`;
  }

  update();
  setInterval(update, 1000);
}

// 2. Cálculo Astronómico Diario para San Juan (-31.53° S, -68.53° W)
function calculateSunAndMoon() {
  const now = new Date();
  const month = now.getMonth();
  
  let sunriseHours = 7.5 - Math.cos((month / 11) * Math.PI) * 0.8;
  let sunsetHours = 19.5 + Math.cos((month / 11) * Math.PI) * 0.8;
  
  document.getElementById("astro-dawn").textContent = formatHour(sunriseHours - 0.5);
  document.getElementById("astro-sunrise").textContent = formatHour(sunriseHours);
  document.getElementById("astro-sunset").textContent = formatHour(sunsetHours);

  // Fase Lunar y Porcentaje de Iluminación
  const phase = getMoonPhaseFraction(now);

  let moonPhaseText = "🌑 Nueva";
  if (phase > 0.03 && phase <= 0.22) moonPhaseText = "🌒 Creciente";
  else if (phase > 0.22 && phase <= 0.28) moonPhaseText = "🌓 Cuarto Creciente";
  else if (phase > 0.28 && phase <= 0.47) moonPhaseText = "🌔 Gibosa Creciente";
  else if (phase > 0.47 && phase <= 0.53) moonPhaseText = "🌕 Llena";
  else if (phase > 0.53 && phase <= 0.72) moonPhaseText = "🌖 Gibosa Menguante";
  else if (phase > 0.72 && phase <= 0.78) moonPhaseText = "🌗 Cuarto Menguante";
  else if (phase > 0.78 && phase <= 0.97) moonPhaseText = "🌘 Menguante";

  const illum = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);

  document.getElementById("astro-moon-phase").textContent = moonPhaseText;
  document.getElementById("astro-moon-illum").textContent = `${illum}%`;

  let skyDesc = "";
  if (month >= 11 || month <= 2) {
    skyDesc = "✨ **Destacan:** Orión (Las Tres Marías), Tauro, Las Pléyades. **Visibles:** Júpiter y Sirio.";
  } else if (month >= 3 && month <= 5) {
    skyDesc = "✨ **Destacan:** La Cruz del Sur alta, Centauro, Leo. **Visibles:** Marte al anochecer.";
  } else if (month >= 6 && month <= 8) {
    skyDesc = "✨ **Destacan:** Escorpio en lo alto, Sagitario, Centro Galáctico. **Visibles:** Saturno radiante.";
  } else {
    skyDesc = "✨ **Destacan:** Pegaso, Acuario, La Cruz del Sur descendiendo. **Visibles:** Venus al crepúsculo.";
  }

  document.getElementById("astro-constellations").innerHTML = skyDesc;
}

// 3. Calendario de Cambios de Fase Lunar del Mes
function calculateLunarCalendar() {
  const container = document.getElementById("lunar-calendar");
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let phasesFound = [];
  
  // Recorremos los 30 días del mes evaluando la fase
  for (let day = 1; day <= 30; day++) {
    let testDate = new Date(currentYear, currentMonth, day);
    let frac = getMoonPhaseFraction(testDate);

    if (Math.abs(frac - 0.0) < 0.02 || Math.abs(frac - 1.0) < 0.02) {
      phasesFound.push(`🌑 <strong>Luna Nueva:</strong> ${day}/${currentMonth+1}`);
    } else if (Math.abs(frac - 0.25) < 0.02) {
      phasesFound.push(`🌓 <strong>Cuarto Creciente:</strong> ${day}/${currentMonth+1}`);
    } else if (Math.abs(frac - 0.50) < 0.02) {
      phasesFound.push(`🌕 <strong>Luna Llena:</strong> ${day}/${currentMonth+1}`);
    } else if (Math.abs(frac - 0.75) < 0.02) {
      phasesFound.push(`🌗 <strong>Cuarto Menguante:</strong> ${day}/${currentMonth+1}`);
    }
  }

  if (phasesFound.length > 0) {
    container.innerHTML = phasesFound.map(item => `<div style="margin-bottom:3px;">&bull; ${item}</div>`).join('');
  } else {
    container.innerHTML = `<p style="margin:0; color:#555;">Consultando efemérides del ciclo actual...</p>`;
  }
}

function getMoonPhaseFraction(dateObj) {
  const year = dateObj.getFullYear();
  const day = dateObj.getDate();
  const m = dateObj.getMonth() + 1;
  const c = Math.floor(3.65 * year);
  const e = Math.floor(30.6 * m);
  const jd = c + e + day - 694039.09;
  return (jd / 29.5305882) % 1;
}

function formatHour(decimalHours) {
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  return `${hrs < 10 ? '0' : ''}${hrs}:${mins < 10 ? '0' : ''}${mins} hs`;
}

// 4. Noticias de Infobae
async function fetchInfobaeNews() {
  const container = document.getElementById("news-container");
  const rssUrl = "https://www.infobae.com/arc/outboundfeeds/rss/";

  try {
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      container.innerHTML = data.items.slice(0, 7).map(item => `
        <div class="news-item">
          <a href="${item.link}" target="_blank">&bull; ${item.title}</a>
          <div style="font-size: 11px; color: #666; margin-top: 4px;">Publicado: ${new Date(item.pubDate).toLocaleString("es-AR")}</div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `<p style="color:red;">No se pudieron obtener las noticias en este momento.</p>`;
    }
  } catch (err) {
    container.innerHTML = `<p style="color:red;">Error de conexión con el feed de noticias.</p>`;
  }
}

// 5. Frase / Sentencia
async function fetchDailyQuote() {
  const quoteEl = document.getElementById("quote");
  const authorEl = document.getElementById("quote-author");

  try {
    const res = await fetch("https://dummyjson.com/quotes/random");
    const data = await res.json();
    quoteEl.textContent = `"${data.quote}"`;
    authorEl.textContent = `— ${data.author}`;
  } catch (err) {
    quoteEl.textContent = '"Sola fides sufficit."';
    authorEl.textContent = '— Santo Tomás de Aquino';
  }
}
