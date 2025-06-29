let map;
let infoWindow;
const placedMarkerIds = new Set();
const statusDiv = document.getElementById('status');

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                statusDiv.textContent = 'Location found!';
                createMap(userLocation);
            },
            () => handleLocationError('Error: The Geolocation service failed.')
        );
    } else {
        handleLocationError("Error: Your browser doesn't support geolocation.");
    }
}

function handleLocationError(errorMessage) {
    statusDiv.textContent = errorMessage + ' Defaulting to New York City.';
    createMap({ lat: 40.7128, lng: -74.0060 });
}

function createMap(location) {
    map = new google.maps.Map(document.getElementById("map"), {
        center: location,
        zoom: 15,
    });

    infoWindow = new google.maps.InfoWindow();

    new google.maps.Marker({
        position: location,
        map: map,
        title: "You are here",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
        }
    });
    
    new google.maps.Circle({
        strokeColor: "#4285F4",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#4285F4",
        fillOpacity: 0.1,
        map,
        center: location,
        radius: 3000,
    });

    findNearbyEateries(location);
}

function findNearbyEateries(location) {
    statusDiv.textContent = 'Searching for nearby eateries...';
    
    const eateryTypes = ['restaurant', 'cafe', 'bar', 'bakery'];
    const service = new google.maps.places.PlacesService(map);
    
    eateryTypes.forEach(type => {
        service.nearbySearch({
            location: location,
            radius: '3000',
            type: [type]
        }, (results, status, pagination) => {
            // This function handles the results from a search
            processPlaces(results, status);
            
            // *** THIS IS THE NEW PAGINATION LOGIC ***
            // If there is a next page, wait 2 seconds and fetch it.
            // We wait to avoid hitting the API too quickly.
            if (pagination && pagination.hasNextPage) {
                setTimeout(() => {
                    pagination.nextPage(); // This will call the same callback function again
                }, 2000);
            }
        });
    });

    // Hide the status message after all searches are likely complete
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 10000); // Increased timeout to allow for pagination
}

// NEW: A dedicated function to process search results
function processPlaces(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach(place => {
            if (!placedMarkerIds.has(place.place_id)) {
                placedMarkerIds.add(place.place_id);
                createMarker(place);
            }
        });
        statusDiv.textContent = `Found ${placedMarkerIds.size} unique places...`;
    }
}

function createMarker(place) {
    if (!place.geometry || !place.geometry.location) return;

    const marker = new google.maps.Marker({
        map,
        position: place.geometry.location,
        title: place.name,
        animation: google.maps.Animation.DROP
    });

    google.maps.event.addListener(marker, "click", () => {
        const content = `
            <div>
                <strong>${place.name}</strong><br>
                ${place.vicinity}<br>
                Rating: ${place.rating || 'N/A'} (${place.user_ratings_total || 0} reviews)
            </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    });
}