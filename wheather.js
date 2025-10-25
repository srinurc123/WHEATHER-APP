// API Configuration
const API_KEY = "d04d2429a23b0cf18c66158377aee8b2"; // OpenWeatherMap API key
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// DOM Elements
const weatherForm = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const weatherResult = document.getElementById("weatherResult");
const errorMessage = document.getElementById("errorMessage");
const loadingSpinner = document.getElementById("loadingSpinner");
const themeToggle = document.querySelector(".theme-toggle");
const contactForm = document.getElementById("contactForm");

// Weather Icon Mapping
const weatherIcons = {
  "Clear": "https://openweathermap.org/img/wn/01d@2x.png",
  "Clouds": "https://openweathermap.org/img/wn/03d@2x.png",
  "Rain": "https://openweathermap.org/img/wn/10d@2x.png",
  "Drizzle": "https://openweathermap.org/img/wn/09d@2x.png",
  "Thunderstorm": "https://openweathermap.org/img/wn/11d@2x.png",
  "Snow": "https://openweathermap.org/img/wn/13d@2x.png",
  "Mist": "https://openweathermap.org/img/wn/50d@2x.png",
  "Haze": "https://openweathermap.org/img/wn/50d@2x.png",
};

// Set Background Image
document.body.style.backgroundImage = "url('weather.jpg')";
document.body.style.backgroundSize = "cover";
document.body.style.backgroundPosition = "center";
document.body.style.backgroundRepeat = "no-repeat";

// Local Storage for Recent Searches
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];

// Utility: Show Loading Spinner
function showLoading() {
  loadingSpinner.style.display = "block";
  errorMessage.style.display = "none";
  weatherResult.style.display = "none";
}

// Utility: Hide Loading Spinner
function hideLoading() {
  loadingSpinner.style.display = "none";
  weatherResult.style.display = "block";
}

// Utility: Show Error Message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  weatherResult.style.display = "none";
  hideLoading();
}

// Utility: Format Date
function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

// Utility: Format Time
function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// Fetch Current Weather
async function getCurrentWeather(city) {
  const url = `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`;
  try {
    showLoading();
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found");
    const data = await response.json();

    // Update Recent Searches
    if (!recentSearches.includes(city)) {
      recentSearches.push(city);
      if (recentSearches.length > 5) recentSearches.shift();
      localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
    }

    // Update Current Weather
    updateCurrentWeather(data);
    hideLoading();
  } catch (error) {
    showError(error.message);
  }
}

// Fetch Hourly and Daily Forecast
async function getForecast(city) {
  const url = `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Unable to fetch forecast");
    const data = await response.json();

    // Update Hourly and Daily Forecasts
    updateHourlyForecast(data.list);
    updateDailyForecast(data.list);
  } catch (error) {
    showError(error.message);
  }
}

// Update Current Weather UI
function updateCurrentWeather(data) {
  const icon = weatherIcons[data.weather[0].main] || "https://openweathermap.org/img/wn/02d@2x.png";
  document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("currentTemp").textContent = `Temperature: ${Math.round(data.main.temp)}°C`;
  document.getElementById("currentDescription").textContent = `Weather: ${data.weather[0].main} (${data.weather[0].description})`;
  document.getElementById("currentHumidity").textContent = `Humidity: ${data.main.humidity}%`;
  document.getElementById("currentWind").textContent = `Wind Speed: ${data.wind.speed} m/s`;
  document.getElementById("currentWeatherIcon").src = icon;
  document.getElementById("currentWeatherIcon").alt = `Weather: ${data.weather[0].description}`;
}

// Update Hourly Forecast UI
function updateHourlyForecast(list) {
  const hourlyContainer = document.getElementById("hourlyForecast");
  hourlyContainer.innerHTML = "";
  const nextHours = list.slice(0, 4); // Next 12 hours (4 intervals of 3 hours)
  nextHours.forEach(item => {
    const icon = weatherIcons[item.weather[0].main] || "https://openweathermap.org/img/wn/02d@2x.png";
    const hourlyItem = document.createElement("div");
    hourlyItem.classList.add("hourly-item");
    hourlyItem.innerHTML = `
      <p class="hour">${formatTime(item.dt)}</p>
      <img src="${icon}" alt="${item.weather[0].description}" class="hourly-icon" />
      <p class="hourly-temp">${Math.round(item.main.temp)}°C</p>
    `;
    hourlyContainer.appendChild(hourlyItem);
  });
}

// Update Daily Forecast UI
function updateDailyForecast(list) {
  const dailyContainer = document.getElementById("dailyForecast");
  dailyContainer.innerHTML = "";
  const dailyData = {};
  
  // Aggregate daily data
  list.forEach(item => {
    const date = formatDate(item.dt);
    if (!dailyData[date]) {
      dailyData[date] = {
        temps: [],
        descriptions: [],
        icon: weatherIcons[item.weather[0].main] || "https://openweathermap.org/img/wn/02d@2x.png",
      };
    }
    dailyData[date].temps.push(item.main.temp);
    dailyData[date].descriptions.push(item.weather[0].description);
  });

  // Display 5 days
  Object.keys(dailyData).slice(0, 5).forEach((date, index) => {
    const dayData = dailyData[date];
    const high = Math.round(Math.max(...dayData.temps));
    const low = Math.round(Math.min(...dayData.temps));
    const description = dayData.descriptions[0];
    const dailyItem = document.createElement("div");
    dailyItem.classList.add("daily-item");
    dailyItem.innerHTML = `
      <p class="day">${date}</p>
      <img src="${dayData.icon}" alt="${description}" class="daily-icon" />
      <p class="daily-temp">High: ${high}°C | Low: ${low}°C</p>
      <p class="daily-description">Description: ${description}</p>
    `;
    dailyContainer.appendChild(dailyItem);
  });
}

// Handle Weather Form Submission
weatherForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name");
    return;
  }
  await getCurrentWeather(city);
  await getForecast(city);
});

// Theme Toggle Functionality
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  themeToggle.querySelector(".theme-icon").textContent = isDark ? "☀️" : "🌙";
  document.body.style.backgroundImage = isDark ? "url('weather-dark.jpg')" : "url('weather.jpg')";
});

// Contact Form Submission
contactForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const message = document.getElementById("contactMessage").value.trim();
  
  if (!name || !email || !message) {
    showError("Please fill out all fields");
    return;
  }
  
  // Simulate sending contact form (replace with actual API call)
  console.log("Contact Form Submitted:", { name, email, message });
  alert("Thank you for your message! We'll get back to you soon.");
  contactForm.reset();
});

// Display Recent Searches
function displayRecentSearches() {
  if (recentSearches.length > 0) {
    const recentContainer = document.createElement("div");
    recentContainer.classList.add("recent-searches");
    recentContainer.innerHTML = "<h3>Recent Searches</h3>";
    const ul = document.createElement("ul");
    recentSearches.forEach(city => {
      const li = document.createElement("li");
      li.textContent = city;
      li.style.cursor = "pointer";
      li.addEventListener("click", () => {
        cityInput.value = city;
        getCurrentWeather(city);
        getForecast(city);
      });
      ul.appendChild(li);
    });
    recentContainer.appendChild(ul);
    weatherResult.appendChild(recentContainer);
  }
}

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  // Set default city
  const defaultCity = "London";
  cityInput.value = defaultCity;
  getCurrentWeather(defaultCity);
  getForecast(defaultCity);
  displayRecentSearches();

  // Update weather every 10 minutes
  setInterval(() => {
    const city = cityInput.value.trim() || defaultCity;
    getCurrentWeather(city);
    getForecast(city);
  }, 600000);
});

// Handle Offline State
window.addEventListener("offline", () => {
  showError("You are offline. Please check your internet connection.");
});

window.addEventListener("online", () => {
  errorMessage.style.display = "none";
  const city = cityInput.value.trim() || "London";
  getCurrentWeather(city);
  getForecast(city);
});

// Geolocation Support
function getLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const url = `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;
        try {
          showLoading();
          const response = await fetch(url);
          if (!response.ok) throw new Error("Unable to fetch location weather");
          const data = await response.json();
          cityInput.value = data.name;
          updateCurrentWeather(data);
          await getForecast(data.name);
          hideLoading();
        } catch (error) {
          showError(error.message);
        }
      },
      () => {
        showError("Geolocation permission denied");
      }
    );
  } else {
    showError("Geolocation is not supported by this browser");
  }
}

// Add Geolocation Button
const geoButton = document.createElement("button");
geoButton.textContent = "Use My Location";
geoButton.addEventListener("click", getLocationWeather);
weatherForm.appendChild(geoButton);

// Smooth Scroll for Navigation Links
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const targetId = link.getAttribute("href").substring(1);
    const targetElement = document.getElementById(targetId);
    targetElement.scrollIntoView({ behavior: "smooth" });
  });
});

// Debounce Input for Search
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

cityInput.addEventListener("input", debounce(() => {
  const city = cityInput.value.trim();
  if (city.length > 2) {
    getCurrentWeather(city);
    getForecast(city);
  }
}, 500));