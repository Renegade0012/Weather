const apiKey = "bc6acdffacba3d92ee8ed037555f9c19";
const weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather?q=";
const uvApiUrl = "https://api.openweathermap.org/data/2.5/uvi?";

const canvas = document.getElementById("weatherCanvas");
const ctx = canvas.getContext("2d");
const body = document.body;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let sunData = {};
let humidityLevel = 0;
let isCelsius = true; // Default to Celsius
let currentTempCelsius = 0; // Store temp in Celsius for conversion

function getWeather() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        alert("Please enter a city!");
        return;
    }

    fetch(`${weatherApiUrl}${city}&appid=${apiKey}&units=metric`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) throw new Error("City not found");
                if (response.status === 401) throw new Error("Invalid API key");
                throw new Error("Network error");
            }
            return response.json();
        })
        .then(weatherData => {
            // Fetch UV Index using lat/lon from weather data
            const lat = weatherData.coord.lat;
            const lon = weatherData.coord.lon;
            return fetch(`${uvApiUrl}lat=${lat}&lon=${lon}&appid=${apiKey}`)
                .then(uvResponse => uvResponse.json())
                .then(uvData => ({ weatherData, uvData }));
        })
        .then(({ weatherData, uvData }) => {
            updateWeather(weatherData, uvData);
        })
        .catch(error => {
            console.error("Error fetching data:", error.message);
            alert(`Oops! ${error.message}. Try checking the city name or your internet connection.`);
        });
}

function toggleTempUnit() {
    isCelsius = !isCelsius;
    const tempToggle = document.getElementById("tempToggle");
    tempToggle.textContent = isCelsius ? "°C" : "°F";
    const temperature = document.getElementById("temperature");
    temperature.textContent = isCelsius 
        ? `${Math.round(currentTempCelsius)}°C`
        : `${Math.round(currentTempCelsius * 9/5 + 32)}°F`;
}

function updateWeather(weatherData, uvData) {
    const cityName = document.getElementById("cityName");
    const temperature = document.getElementById("temperature");
    const description = document.getElementById("description");
    const humidity = document.getElementById("humidity");
    const chanceOfRain = document.getElementById("chanceOfRain");
    const possibleRain = document.getElementById("possibleRain");
    const fireDanger = document.getElementById("fireDanger");
    const uvIndex = document.getElementById("uvIndex");
    const weatherMood = document.getElementById("weatherMood");
    const weatherIcon = document.getElementById("weatherIcon");

    cityName.textContent = weatherData.name;
    currentTempCelsius = Math.round(weatherData.main.temp);
    temperature.textContent = isCelsius 
        ? `${currentTempCelsius}°C`
        : `${Math.round(currentTempCelsius * 9/5 + 32)}°F`;
    description.textContent = weatherData.weather[0].description;
    humidity.textContent = `Humidity: ${weatherData.main.humidity}%`;
    humidityLevel = weatherData.main.humidity / 100;

    sunData = {
        sunrise: weatherData.sys.sunrise * 1000,
        sunset: weatherData.sys.sunset * 1000,
        currentTime: Date.now()
    };

    const weatherMain = weatherData.weather[0].main.toLowerCase();
    body.className = "";
    particles = [];

    // Chance of Rain
    const cloudiness = weatherData.clouds.all;
    chanceOfRain.textContent = `Chance of Rain: ${cloudiness}% (est.)`;

    // Possible Rain
    const recentRain = weatherData.rain ? (weatherData.rain["1h"] || 0) : 0;
    if (weatherMain.includes("rain") || recentRain > 0 || cloudiness > 70) {
        possibleRain.textContent = recentRain > 0 ? `Rain possible! (${recentRain} mm in last hour)` : "Rain possible!";
        possibleRain.style.display = "block";
    } else {
        possibleRain.textContent = "";
        possibleRain.style.display = "none";
    }

    // Fire Danger Rating (heuristic based on temp, humidity, wind)
    const tempC = weatherData.main.temp;
    const windSpeed = weatherData.wind.speed; // m/s
    let fireRisk = 0;
    fireRisk += tempC > 30 ? 2 : tempC > 20 ? 1 : 0; // Hotter = higher risk
    fireRisk += weatherData.main.humidity < 30 ? 2 : weatherData.main.humidity < 50 ? 1 : 0; // Drier = higher risk
    fireRisk += windSpeed > 5 ? 2 : windSpeed > 2 ? 1 : 0; // Windier = higher risk
    fireDanger.textContent = `Fire Danger: ${
        fireRisk >= 5 ? "Extreme" : fireRisk >= 3 ? "High" : fireRisk >= 1 ? "Moderate" : "Low"
    }`;

    // UV Index
    uvIndex.textContent = `UV Index: ${uvData.value} (${uvData.value < 3 ? "Low" : uvData.value < 6 ? "Moderate" : uvData.value < 8 ? "High" : "Very High"})`;

    // Weather Mood and Effects
    if (weatherMain.includes("clear")) {
        body.classList.add("sunny");
        weatherIcon.innerHTML = "☀️";
        weatherMood.innerHTML = "😊";
        createSunEffect();
    } else if (weatherMain.includes("cloud")) {
        body.classList.add("cloudy");
        weatherIcon.innerHTML = "☁️";
        weatherMood.innerHTML = "😐";
        createClouds();
    } else if (weatherMain.includes("rain")) {
        body.classList.add("rainy");
        weatherIcon.innerHTML = "🌧️";
        weatherMood.innerHTML = "🌧️😟";
        createRain();
    } else if (weatherMain.includes("snow")) {
        body.classList.add("snowy");
        weatherIcon.innerHTML = "❄️";
        weatherMood.innerHTML = "❄️🥶";
        createSnow();
    }

    if (sunData.currentTime < sunData.sunrise || sunData.currentTime > sunData.sunset) {
        body.classList.add("night");
    }

    animateWeather();
}

// Weather effect functions (unchanged from previous version)
function createClouds() {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.3,
            radius: 40 + Math.random() * 20,
            speed: 1 + Math.random() * 2
        });
    }
}

function createRain() {
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 2,
            speed: 5 + Math.random() * 3
        });
    }
}

function createSnow() {
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 3 + Math.random() * 2,
            speed: 1 + Math.random() * 2,
            drift: Math.random() - 0.5
        });
    }
}

function createSunEffect() {
    const dayLength = sunData.sunset - sunData.sunrise;
    const timeSinceSunrise = sunData.currentTime - sunData.sunrise;
    const sunProgress = Math.min(Math.max(timeSinceSunrise / dayLength, 0), 1);

    const sunX = canvas.width * (0.2 + sunProgress * 0.6);
    const sunY = canvas.height * (0.3 - sunProgress * 0.2);

    particles.push({
        x: sunX,
        y: sunY,
        radius: 70,
        glow: 0,
        isSun: true
    });

    for (let i = 0; i < 8; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.4,
            radius: 10 + Math.random() * 15,
            speed: 0.5 + Math.random() * 1.5,
            isSun: false
        });
    }
}

function animateWeather() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (humidityLevel > 0.7) {
        ctx.fillStyle = `rgba(200, 200, 200, ${humidityLevel * 0.2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (body.classList.contains("night")) {
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = "rgba(255, 255, 255, " + (Math.random() * 0.5 + 0.5) + ")";
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    particles.forEach((p, i) => {
        if (body.classList.contains("cloudy")) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.speed;
            if (p.x > canvas.width + p.radius) p.x = -p.radius;
        } else if (body.classList.contains("rainy")) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            p.y += p.speed;
            if (p.y > canvas.height) p.y = -p.radius;
        } else if (body.classList.contains("snowy")) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            p.y += p.speed;
            p.x += p.drift;
            if (p.y > canvas.height) p.y = -p.radius;
            if (p.x > canvas.width || p.x < 0) p.drift *= -1;
        } else if (body.classList.contains("sunny")) {
            if (p.isSun) {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
                gradient.addColorStop(0, `rgba(255, 235, 0, ${0.9 + Math.sin(p.glow) * 0.1})`);
                gradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.6 + Math.sin(p.glow) * 0.2})`);
                gradient.addColorStop(1, "rgba(255, 215, 0, 0)");

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "rgba(255, 255, 0, 1)";
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius / 2, 0, Math.PI * 2);
                ctx.fill();

                p.glow += 0.05;
            } else {
                ctx.fillStyle = `rgba(255, 235, 0, ${0.3 + Math.sin(p.glow || 0) * 0.1})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                p.x += p.speed;
                if (p.x > canvas.width + p.radius) p.x = -p.radius;
            }
        }
    });

    requestAnimationFrame(animateWeather);
}
