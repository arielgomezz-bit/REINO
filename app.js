document.addEventListener("DOMContentLoaded", () => {
  initClockAndDate();
  calculateSunAndMoon();
  fetchDailyQuote();
  fetchInfobaeNews();
});

// 1. Reloj y Saludo Inmediatos
function initClockAndDate() {
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date-display");
  const greetingEl = document.getElementById("greeting-bar");

  function update() {
    try {
      const now = new Date();
      if (clockEl) clockEl.textContent = now.toLocaleTimeString("es-AR");

      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const dateStr = now.toLocaleDateString("es-AR", options);
      const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      
      if (dateEl) dateEl.textContent = formattedDate;

      const hours = now.getHours();
      let saludo = "Pax vobiscum";
      if (hours >= 6 && hours < 12) saludo = "¡Buenos días en el Reino!";
      else if (hours >= 12 && hours < 20) saludo = "¡Buenas tardes!";
      else saludo = "¡Buenas noches bajo el firmamento!";

      if (greetingEl) greetingEl.textContent = `${saludo} — Hoy es ${formattedDate}.`;
    } catch (e) {
      console.error("Error al actualizar reloj:", e);
    }
  }

  update();
  setInterval(update, 1000);
}

// 2. Cálculo Aproximado de Efemérides Astronómicas para San Juan (-31.53° S, -68.53° W)
function calculateSunAndMoon() {
  try {
    const now = new Date();
    const month = now.getMonth(); // 0 - 11
    
    let sunriseHours = 7.5 - Math.cos((month / 11) * Math.PI) * 0.8;
    let sunsetHours = 19.5 + Math.cos((month / 11) * Math.PI) * 0.8;
    
    const dawnEl = document.getElementById("astro-dawn");
    const sunriseEl = document.getElementById("astro-sunrise");
    const sunsetEl = document.getElementById("astro-sunset");
    const moonEl = document.getElementById("astro-moon-phase");
    const constEl = document.getElementById("astro-constellations");

    if (dawnEl) dawnEl.textContent = formatHour(sunriseHours - 0.5);
    if (sunriseEl) sunriseEl.textContent = formatHour(sunriseHours);
    if (sunsetEl) sunsetEl.textContent = formatHour(sunsetHours);

    // Fase Lunar
    const year = now.getFullYear();
    const day = now.getDate();
    const m = month + 1;
    const c = Math.floor(3.65 * year);
    const e = Math.floor(30.6 * m);
    const jd = c + e + day - 694039.09;
    const phase = (jd / 29.5305882) % 1;

    let moonPhaseText = "🌑 Nueva";
    if (phase > 0.03 && phase <= 0.22) moonPhaseText = "🌒 Creciente";
    else if (phase > 0.22 && phase <= 0.28) moonPhaseText = "🌓 Cuarto Creciente";
    else if (phase > 0.28 && phase <= 0.47) moonPhaseText = "🌔 Gibosa Creciente";
    else if (phase > 0.47 && phase <= 0.53) moonPhaseText = "🌕 Llena";
    else if (phase > 0.53 && phase <= 0.72) moonPhaseText = "🌖 Gibosa Menguante";
    else if (phase > 0.72 && phase <= 0.78) moonPhaseText = "🌗 Cuarto Menguante";
    else if (phase > 0.78 && phase <= 0.97) moonPhaseText = "🌘 Menguante";

    if (moonEl) moonEl.textContent = moonPhaseText;

    // Constelaciones visibles según época del año
    let skyDesc = "";
    if (month >= 11 || month <= 2) {
      skyDesc = "✨ <strong>Destacan:</strong> Orión (Las Tres Marías), Tauro, Las Pléyades. <strong>Visibles:</strong> Júpiter y Sirio al zénit.";
    } else if (month >= 3 && month <= 5) {
      skyDesc = "✨ <strong>Destacan:</strong> La Cruz del Sur alta, Centauro, Leo. <strong>Visibles:</strong> Marte al anochecer.";
    } else if (month >= 6 && month <= 8) {
      skyDesc = "✨ <strong>Destacan:</strong> Escorpio en lo alto, Sagitario, Centro Galáctico. <strong>Visibles:</strong> Saturno radiante.";
    } else {
      skyDesc = "✨ <strong>Destacan:</strong> Pegaso, Acuario, La Cruz del Sur descendiendo. <strong>Visibles:</strong> Venus al crepúsculo.";
    }

    if (constEl) constEl.innerHTML = skyDesc;
  } catch (e) {
    console.error("Error en cálculos astronómicos:", e);
  }
}

function formatHour(decimalHours) {
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  return `${hrs < 10 ? '0' : ''}${hrs}:${mins < 10 ? '0' : ''}${mins} hs`;
}

// 3. Noticias de Infobae con Proxy Alternativo y Respaldo
async function fetchInfobaeNews() {
  const container = document.getElementById("news-container");
  if (!container) return;

  const rssUrl = "https://www.infobae.com/arc/outboundfeeds/rss/";
  
  // Usamos un conector confiable para transformar el RSS a JSON
  const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    
    if (data.contents) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data.contents, "text/xml");
      const items = xmlDoc.querySelectorAll("item");

      if (items.length > 0) {
        let html = "";
        let count = 0;
        items.forEach(item => {
          if (count < 7) {
            const title = item.querySelector("title")?.textContent || "Sin título";
            const link = item.querySelector("link")?.textContent || "https://www.infobae.com";
            const pubDate = item.querySelector("pubDate")?.textContent || "";
            
            html += `
              <div class="news-item">
                <a href="${link}" target="_blank">&bull; ${title}</a>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">Publicado: ${pubDate ? new Date(pubDate).toLocaleString("es-AR") : "Reciente"}</div>
              </div>
            `;
            count++;
          }
        });
        container.innerHTML = html;
        return;
      }
    }
    throw new Error("No se pudieron parsear los elementos.");
  } catch (err) {
    console.warn("Fallo en la carga del feed directo, usando portal de respaldo:", err);
    // Respaldo visual elegante si la API externa falla o bloquea la red
    container.innerHTML = `
      <div class="news-item">
        <a href="https://www.infobae.com" target="_blank">&bull; Acceso directo a las Noticias de Infobae en Vivo</a>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">Consulta la portada principal de Infobae.</div>
      </div>
      <div class="news-item">
        <a href="https://www.diariodecuyo.com.ar" target="_blank">&bull; Diario de Cuyo — Noticias de San Juan</a>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">Edición digital San Juan.</div>
      </div>
    `;
  }
}

// 4. Frase / Sentencia del Día Garantizada
function fetchDailyQuote() {
  const quoteEl = document.getElementById("quote");
  const authorEl = document.getElementById("quote-author");

  if (!quoteEl || !authorEl) return;

  const spanishQuotes = [
    { quote: "No es que tengamos poco tiempo, sino que perdemos mucho.", author: "Séneca" },
    { quote: "El sabio no dice todo lo que piensa, pero siempre piensa todo lo que dice.", author: "Aristóteles" },
    { quote: "La fe es la sustancia de las cosas que se esperan, la demostración de las cosas que no se ven.", author: "San Pablo" },
    { quote: "El valor de las cosas no está en el tiempo que duran, sino en la intensidad con que se viven.", author: "San Agustín" },
    { quote: "Solo con el corazón se puede ver bien; lo esencial es invisible a los ojos.", author: "Antoine de Saint-Exupéry" },
    { quote: "Caminante, no hay camino, se hace camino al andar.", author: "Antonio Machado" }
  ];

  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const selected = spanishQuotes[dayOfYear % spanishQuotes.length];
  
  quoteEl.textContent = `"${selected.quote}"`;
  authorEl.textContent = `— ${selected.author}`;
}

// 5. Envío del Libro de Visitas (Epi Stola Ex Corde)
function sendGuestMessage(event) {
  event.preventDefault();

  const name = document.getElementById("gb-name").value;
  const email = document.getElementById("gb-email").value;
  const phone = document.getElementById("gb-phone").value;
  const message = document.getElementById("gb-message").value;
  const legacy = document.getElementById("gb-legacy").value;

  const subject = encodeURIComponent(`Epi Stola Ex Corde de ${name}`);
  const bodyText = `Hola Ariel,\n\nHas recibido una nueva epístola desde el libro de visitas de tu sitio web:\n\n` +
    `👤 Nombre: ${name}\n` +
    `✉️ Email: ${email}\n` +
    `📱 WhatsApp: ${phone || 'No especificado'}\n\n` +
    `📜 Mensaje Ex Corde:\n${message}\n\n` +
    `❓ Reflexión Quo Vadis? (Legado):\n${legacy || 'Sin mensaje de legado.'}\n`;

  const mailtoUrl = `mailto:arielgomezz@gmail.com?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

  window.location.href = mailtoUrl;

  alert("¡Gracias por tu mensaje! Se abrirá tu aplicación de correo para enviar la epístola.");
}
