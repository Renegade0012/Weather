const apiKey = "bc6acdffacba3d92ee8ed037555f9c19";
const weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather?q=";
const uvApiUrl = "https://api.openweathermap.org/data/2.5/uvi?";

const canvas = document.getElementById("weatherCanvas");
const ctx = canvas.getContext("2d");
const body = document.body;

// Ensure canvas dimensions are set
if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
} else {
    console.error("Canvas element not found!");
}

let particles = [];
let sunData = {};
let humidityLevel = 0;
let isCelsius = true;
let currentTempCelsius = 0;

// Start animation loop immediately (in case no weather is fetched yet)
animateWeather();

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

// ... (toggleTempUnit, updateWeather, createClouds, createRain, createSnow, createSunEffect unchanged) ...

function animateWeather() {
    if (!ctx) return; // Exit if canvas context isn’t ready
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
