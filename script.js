// Anime Weather Window - GLA 5
// Live weather for Calgary from the Open-Meteo API (free, no API key needed).

const API_URL = "https://api.open-meteo.com/v1/forecast?latitude=51.0447&longitude=-114.0719&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl,visibility&timezone=America%2FEdmonton";

// Short helper so we don't write document.querySelector every time
const $ = (selector) => document.querySelector(selector);

const room = $("#room");
const header = $(".site-header");

// What the page is showing right now
const state = {
  weather: null,    // last data received from the API
  unit: "celsius",  // "celsius" or "fahrenheit"
  preview: "live"   // "live" or one of the keys in previews
};

// Open-Meteo weather codes. "scene" is the room photo to use:
// clear, cloudy, rain, snow, storm or fog
const weatherCodes = {
  0: { name: "Clear sky", text: "A clear sky over Calgary.", icon: "☀️", scene: "clear" },
  1: { name: "Mainly clear", text: "Mostly clear with a little cloud.", icon: "🌤️", scene: "clear" },
  2: { name: "Partly cloudy", text: "Sunshine and clouds share the sky.", icon: "⛅", scene: "cloudy" },
  3: { name: "Overcast", text: "Clouds cover most or all of the sky.", icon: "☁️", scene: "cloudy" },
  45: { name: "Fog", text: "Fog is reducing visibility.", icon: "🌫️", scene: "fog" },
  48: { name: "Freezing fog", text: "Freezing fog may make surfaces slippery.", icon: "🌫️", scene: "fog" },
  51: { name: "Light drizzle", text: "A little drizzle is falling.", icon: "🌦️", scene: "rain" },
  53: { name: "Moderate drizzle", text: "Steady drizzle is falling.", icon: "🌦️", scene: "rain" },
  55: { name: "Dense drizzle", text: "Dense drizzle is falling.", icon: "🌧️", scene: "rain" },
  56: { name: "Freezing drizzle", text: "Freezing drizzle may create slippery surfaces.", icon: "🌧️", scene: "rain" },
  57: { name: "Heavy freezing drizzle", text: "Heavy freezing drizzle is possible.", icon: "🌧️", scene: "rain" },
  61: { name: "Light rain", text: "Light rain is falling outside.", icon: "🌦️", scene: "rain" },
  63: { name: "Moderate rain", text: "Rain is falling steadily.", icon: "🌧️", scene: "rain" },
  65: { name: "Heavy rain", text: "Heavy rain is falling outside.", icon: "🌧️", scene: "rain" },
  66: { name: "Light freezing rain", text: "Freezing rain may make surfaces slippery.", icon: "🌧️", scene: "rain" },
  67: { name: "Heavy freezing rain", text: "Heavy freezing rain is possible.", icon: "🌧️", scene: "rain" },
  71: { name: "Light snow", text: "Light snowflakes are drifting down.", icon: "🌨️", scene: "snow" },
  73: { name: "Moderate snow", text: "Snow is falling steadily.", icon: "❄️", scene: "snow" },
  75: { name: "Heavy snow", text: "Heavy snow is falling outside.", icon: "🌨️", scene: "snow" },
  77: { name: "Snow grains", text: "Small ice and snow grains are falling.", icon: "❄️", scene: "snow" },
  80: { name: "Light rain showers", text: "Short bursts of rain are passing through.", icon: "🌦️", scene: "rain" },
  81: { name: "Moderate rain showers", text: "Rain showers are moving through.", icon: "🌧️", scene: "rain" },
  82: { name: "Violent rain showers", text: "Intense rain showers are occurring.", icon: "🌧️", scene: "rain" },
  85: { name: "Light snow showers", text: "Snow showers are passing through.", icon: "🌨️", scene: "snow" },
  86: { name: "Heavy snow showers", text: "Heavy snow showers are passing through.", icon: "❄️", scene: "snow" },
  95: { name: "Thunderstorm", text: "Thunder and lightning are possible.", icon: "⛈️", scene: "storm" },
  96: { name: "Thunderstorm with hail", text: "A thunderstorm with small hail is possible.", icon: "⛈️", scene: "storm" },
  99: { name: "Thunderstorm with heavy hail", text: "A strong storm with hail is possible.", icon: "⛈️", scene: "storm" }
};

// Example conditions for the manual preview menu
const previews = {
  "clear-day": { name: "Sunny", text: "A bright, clear day.", icon: "☀️", scene: "clear", night: false, temp: 22 },
  "rain-day": { name: "Rainy", text: "Rain is falling outside the window.", icon: "🌧️", scene: "rain", night: false, temp: 8 },
  "cloudy-day": { name: "Cloudy", text: "A blanket of clouds covers the sky.", icon: "☁️", scene: "cloudy", night: false, temp: 12 },
  "snow-day": { name: "Snowing", text: "Snowflakes are drifting through the air.", icon: "🌨️", scene: "snow", night: false, temp: -3 },
  "storm-day": { name: "Thunderstorm", text: "Dark clouds, rain and lightning fill the sky.", icon: "⛈️", scene: "storm", night: false, temp: 16 },
  "fog-day": { name: "Foggy", text: "A soft veil of fog reduces visibility.", icon: "🌫️", scene: "fog", night: false, temp: 8 },
  "clear-night": { name: "Clear night", text: "The moon shines over a quiet city.", icon: "🌙", scene: "clear", night: true, temp: 7 },
  "rain-night": { name: "Rainy night", text: "Rain falls under the city lights.", icon: "🌧️", scene: "rain", night: true, temp: 6 },
  "cloudy-night": { name: "Cloudy night", text: "Clouds cover the night sky.", icon: "☁️", scene: "cloudy", night: true, temp: 4 },
  "snow-night": { name: "Snowy night", text: "Snow drifts through the moonlit night.", icon: "❄️", scene: "snow", night: true, temp: -5 },
  "storm-night": { name: "Thunderstorm night", text: "Lightning briefly lights the dark sky.", icon: "⛈️", scene: "storm", night: true, temp: 13 },
  "fog-night": { name: "Foggy night", text: "Fog hangs low over the city after dark.", icon: "🌫️", scene: "fog", night: true, temp: 2 }
};

// Line icons for the controls panel (small 24 x 24 SVG drawings)
const sceneIcons = {
  clear: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  cloudy: '<path d="M7 18h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.5A3.3 3.3 0 0 0 7 18z"/>',
  rain: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>',
  storm: '<path d="M13 2 5 13.5h6L10 22l9-12.5h-6z"/>',
  snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5M3.6 10.3l3.2-.4-1.3-3M20.4 13.7l-3.2.4 1.3 3M3.6 13.7l3.2.4-1.3 3M20.4 10.3l-3.2-.4 1.3-3"/>',
  fog: '<path d="M3 7h12M7 11h14M3 15h14M8 19h10"/>'
};

// Lets the CSS know the header height, so the room photo starts below it
function fitRoomUnderHeader() {
  document.documentElement.style.setProperty("--header-height", header.offsetHeight + "px");
}

function getWeatherInfo(code) {
  return weatherCodes[code] || { name: "Changing conditions", text: "Current weather conditions in Calgary.", icon: "🌡️", scene: "cloudy" };
}

// Rounds the temperature and converts it to °F if needed
function formatTemp(celsius) {
  if (state.unit === "fahrenheit") return Math.round(celsius * 9 / 5 + 32);
  return Math.round(celsius);
}

function unitLabel() {
  return state.unit === "fahrenheit" ? "°F" : "°C";
}

// Status text and dot colour in the header
function setStatus(text, color) {
  $("#connection-status").textContent = text;
  $(".live-dot").style.background = color;
}

// Calgary time and date for the clock
function updateClock() {
  const now = new Date();
  $("#local-time").textContent = now.toLocaleTimeString("en-CA", { timeZone: "America/Edmonton", hour: "numeric", minute: "2-digit", second: "2-digit" });
  $("#local-date").textContent = now.toLocaleDateString("en-CA", { timeZone: "America/Edmonton", weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

// The API sends Calgary time like "2026-10-23T21:45", this turns it into "9:45 p.m."
function formatApiTime(apiTime) {
  const hours = Number(apiTime.slice(11, 13));
  const minutes = apiTime.slice(14, 16);
  const suffix = hours >= 12 ? "p.m." : "a.m.";
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

// Fills the window with raindrops or snowflakes, each with a random position and speed
function makeRainOrSnow(scene) {
  const layer = $(".precip");
  if (layer.dataset.scene === scene) return; // already showing this weather
  layer.dataset.scene = scene;
  layer.innerHTML = "";

  let count = 0;
  let minTime = 0;
  let extraTime = 0;
  if (scene === "rain") { count = 70; minTime = 0.8; extraTime = 0.4; }
  if (scene === "storm") { count = 180; minTime = 0.3; extraTime = 0.15; }
  if (scene === "snow") { count = 80; minTime = 5; extraTime = 5; }

  for (let i = 0; i < count; i++) {
    const drop = document.createElement("i");
    const duration = minTime + Math.random() * extraTime;
    drop.style.left = Math.random() * 130 + "%"; // some start off to the right because the rain blows left
    drop.style.animationDuration = duration + "s";
    // A negative delay starts the drop part-way down, so the window isn't empty at first
    drop.style.animationDelay = -Math.random() * duration + "s";
    if (scene === "snow") {
      const size = 0.2 + Math.random() * 0.35;
      drop.style.width = size + "rem";
      drop.style.height = size + "rem";
    }
    layer.appendChild(drop);
  }
}

// Changes the room photo, the animations and the icons that depend on the weather
function setScene(scene, night, label) {
  // Only fade between photos after the first one, so the page doesn't load on the wrong photo
  const canFade = room.className.includes("weather-");
  room.className = "room weather-" + scene;
  if (night) room.classList.add("is-night");
  if (canFade) room.classList.add("can-fade");

  makeRainOrSnow(scene);
  room.setAttribute("aria-label", label + ", seen through the bedroom window");
  $("#brand-icon").textContent = night ? "🌙" : "☀️";
  $("#condition-symbol").innerHTML = sceneIcons[scene];
}

// Shows the real weather from the API
function showLiveWeather(data) {
  const current = data.current;
  const info = getWeatherInfo(current.weather_code);
  const night = current.is_day === 0;
  const wind = current.wind_speed_10m;
  const name = wind >= 40 ? info.name + " · Windy" : info.name;

  $("#temperature").textContent = formatTemp(current.temperature_2m);
  $("#temperature-unit").textContent = unitLabel();
  $("#feels-like").textContent = formatTemp(current.apparent_temperature);
  $("#feels-unit").textContent = unitLabel();
  $("#condition-name").textContent = name;
  $("#weather-icon").textContent = night && info.scene === "clear" ? "🌙" : info.icon;
  $("#weather-description").textContent = info.text;
  $("#humidity").textContent = Math.round(current.relative_humidity_2m) + "%";
  $("#wind").textContent = Math.round(wind) + " km/h";
  $("#visibility").textContent = (current.visibility / 1000).toFixed(1) + " km";
  $("#pressure").textContent = Math.round(current.pressure_msl) + " hPa";
  $("#weather-updated").textContent = "Weather data from " + formatApiTime(current.time);

  setScene(info.scene, night, name);
  setStatus("Live weather connected", "#5de0a0");
  $("#error-message").hidden = true;
}

// Shows one of the example conditions from the preview menu
function showPreview(key) {
  const item = previews[key];

  $("#temperature").textContent = formatTemp(item.temp);
  $("#temperature-unit").textContent = unitLabel();
  $("#feels-like").textContent = formatTemp(item.temp - 2);
  $("#feels-unit").textContent = unitLabel();
  $("#condition-name").textContent = item.name;
  $("#weather-icon").textContent = item.icon;
  $("#weather-description").textContent = item.text;
  $("#humidity").textContent = item.scene === "rain" || item.scene === "fog" ? "91%" : "62%";
  $("#wind").textContent = item.scene === "storm" ? "38 km/h" : "14 km/h";
  $("#visibility").textContent = item.scene === "fog" ? "1.2 km" : "10.0 km";
  $("#pressure").textContent = item.scene === "storm" ? "998 hPa" : "1015 hPa";
  $("#weather-updated").textContent = "Manual preview · live data unchanged";

  setScene(item.scene, item.night, item.name);
  setStatus(state.weather ? "Live data available · preview mode" : "Manual preview mode", "#f5c86a");
}

// Shows whatever the user picked: the live weather or a preview
function showCurrentChoice() {
  if (state.preview !== "live") showPreview(state.preview);
  else if (state.weather) showLiveWeather(state.weather);
}

// Gets the current weather from the API, or shows an error message if it fails
async function fetchWeather() {
  const button = $("#refresh-button");
  button.disabled = true;
  button.innerHTML = "<span aria-hidden='true'>↻</span> Loading weather…";
  $("#error-message").hidden = true;
  setStatus("Loading live weather…", "#f5c86a");

  try {
    const response = await fetch(API_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Weather service returned HTTP " + response.status + ".");
    const data = await response.json();
    state.weather = data;
    showCurrentChoice();
  } catch (error) {
    setStatus("Weather service unavailable", "#ff7777");
    $("#error-message").textContent = "Sorry, we couldn't load Calgary's current weather. Check your internet connection and try refreshing. The condition preview still works. Details: " + error.message;
    $("#error-message").hidden = false;
    if (!state.weather && state.preview === "live") {
      $("#condition-name").textContent = "Weather unavailable";
      $("#weather-description").textContent = "Try refreshing, or choose a condition in the manual preview menu.";
      setScene("cloudy", false, "Weather unavailable");
    }
  } finally {
    button.disabled = false;
    button.innerHTML = "<span aria-hidden='true'>↻</span> Refresh weather";
  }
}

// Refresh button: goes back to live mode and asks the API again
$("#refresh-button").addEventListener("click", () => {
  state.preview = "live";
  $("#condition-select").value = "live";
  fetchWeather();
});

// Preview menu
$("#condition-select").addEventListener("change", (event) => {
  state.preview = event.target.value;
  if (state.preview === "live" && !state.weather) fetchWeather();
  else showCurrentChoice();
});

// °C / °F radio buttons
document.querySelectorAll('input[name="unit"]').forEach((input) => {
  input.addEventListener("change", (event) => {
    state.unit = event.target.value;
    showCurrentChoice();
  });
});

// Hide / show the two panels to see the whole room
$("#panels-toggle").addEventListener("click", () => {
  const hidden = document.body.classList.toggle("panels-hidden");
  $("#panels-toggle").textContent = hidden ? "Show panels" : "Hide panels";
  $("#panels-toggle").setAttribute("aria-pressed", hidden);
});

// Load all 12 photos early so changing the weather doesn't flicker
["clear", "cloudy", "rain", "storm", "snow", "fog"].forEach((scene) => {
  new Image().src = "images/room-" + scene + "-day.webp";
  new Image().src = "images/room-" + scene + "-night.webp";
});

// Start-up
fitRoomUnderHeader();
window.addEventListener("resize", fitRoomUnderHeader);

// While the API loads, show a clear sky that matches Calgary's time (night before 7 a.m. and after 7 p.m.)
const calgaryHour = Number(new Date().toLocaleString("en-CA", { timeZone: "America/Edmonton", hour: "numeric", hourCycle: "h23" }));
setScene("clear", calgaryHour < 7 || calgaryHour >= 19, "Loading weather");

$("#year").textContent = new Date().getFullYear();
updateClock();
setInterval(updateClock, 1000);
fetchWeather();
setInterval(() => { if (state.preview === "live") fetchWeather(); }, 15 * 60 * 1000); // every 15 minutes
