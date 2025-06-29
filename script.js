document.addEventListener('DOMContentLoaded', () => {

    const statusDiv = document.getElementById('status');
    const mapDiv = document.getElementById('map');
    let map;

    if (!navigator.geolocation) {
        statusDiv.textContent = 'Geolocation is not supported by your browser.';
        return;
    }

    navigator.geolocation.getCurrentPosition(success, error);

    function success(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        statusDiv.textContent = 'Location found!';
        initMap(latitude, longitude);
    }

    function error() {
        statusDiv.textContent = 'Unable to retrieve your location. Please allow location access.';
    }

    function initMap(lat, lon) {
        map = L.map('map').setView([lat, lon], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        L.marker([lat, lon]).addTo(map)
            .bindPopup('<b>You are here</b>')
            .openPopup();

        L.circle([lat, lon], {
            radius: 3000,
            color: 'blue',
            fillColor: '#3388ff',
            fillOpacity: 0.1
        }).addTo(map);

        findEatingEstablishments(lat, lon);
    }

    async function findEatingEstablishments(lat, lon) {
        statusDiv.textContent = 'Searching for eating establishments...';
        
        const eateryTypes = "restaurant|cafe|fast_food|bar|pub|food_court";
        const radius = 3000; // 3km in meters

        const overpassQuery = `
            [out:json];
            (
              node["amenity"~"${eateryTypes}"](around:${radius},${lat},${lon});
              way["amenity"~"${eateryTypes}"](around:${radius},${lat},${lon});
              relation["amenity"~"${eateryTypes}"](around:${radius},${lat},${lon});
            );
            out center;
        `;
        
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

        try {
            const response = await fetch(overpassUrl);
            const data = await response.json();
            
            statusDiv.textContent = `Found ${data.elements.length} places.`;

            data.elements.forEach(element => {
                if (element.tags && element.tags.name) {
                    let centerLat, centerLon;
                    if (element.type === 'node') {
                        centerLat = element.lat;
                        centerLon = element.lon;
                    } else if (element.center) {
                        centerLat = element.center.lat;
                        centerLon = element.center.lon;
                    }

                    if (centerLat && centerLon) {
                        const marker = L.marker([centerLat, centerLon]).addTo(map);
                        marker.bindPopup(`<b>${element.tags.name}</b><br>${element.tags.cuisine || ''}`);
                    }
                }
            });

            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);

        } catch (err) {
            statusDiv.textContent = 'Could not fetch data for eating places.';
            console.error(err);
        }
    }
});