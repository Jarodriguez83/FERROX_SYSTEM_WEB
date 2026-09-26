// Coordenadas de Simijaca, Cundinamarca, Colombia
const simijacaLat = 5.5041595; 
const simijacaLng = -73.8533906; 

const OPENWEATHER_API_KEY = ''; 

// Mapa con Leaflet
function initMap() {
    const map = L.map('map').setView([simijacaLat, simijacaLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Agregar marcador en Simijaca
    L.marker([simijacaLat, simijacaLng]).addTo(map)
        .bindPopup('SIMIJACA, CUNDINAMARCA')
        .openPopup();
}

// Obtener datos del clima
async function fetchWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${simijacaLat}&lon=${simijacaLng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod === 200) {
            document.getElementById('temp').textContent = `${Math.round(data.main.temp)}°C`;
            document.getElementById('desc').textContent = data.weather[0].description.toUpperCase();
            document.getElementById('humidity').textContent = `${data.main.humidity}%`;
            document.getElementById('wind').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // Convertir m/s a km/h
        } else {
            console.error('Error al obtener clima:', data.message);
            document.getElementById('desc').textContent = 'Error al cargar';
        }
    } catch (error) {
        console.error('Error de red:', error);
        document.getElementById('desc').textContent = 'Error de conexión';
    }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    fetchWeather();
});