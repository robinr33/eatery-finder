let map;
let infoWindow;
const statusDiv = document.getElementById('status');

// This function is called by the Google Maps script when it has finished loading.
function initMap() {
    // 1. GET USER'S LOCATION
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
            () => {
                // Handle location error (e.g., user denies permission)
                statusDiv.textContent = 'Error: The Geolocation service failed. Please allow location access.';
                // Default to a central location if user denies
                createMap({ lat: 40.7128, lng: -74.0060 }); // New York City
            }
        );
    } else {
        // Browser doesn't support Geolocation
        statusDiv.textContent = 'Error: Your browser doesn\'t support geolocation.';
        createMap({ lat: 40.7128, lng: -74.0060 }); // New York City
    }
}

// 2. CREATE THE MAP AND FIND PLACES
function createMap(location) {
    map = new google.maps.Map(document.getElementById("map"), {
        center: location,
        zoom: 15, // A good zoom level for city neighborhoods
    });

    // Create a marker for the user's location
    new google.maps.Marker({
        position: location,
        map: map,
        title: "You are here",
        icon: { // Make the user's marker a bit different
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
        }
    });
    
    // Create a circle to show the 3km radius
    new google.maps.Circle({
        strokeColor: "#4285F4",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#4285F4",
        fillOpacity: 0.1,
        map,
        center: location,
        radius: 3000, // 3km in meters
    });

    // 3. USE THE GOOGLE PLACES SERVICE TO FIND EATERIES
    const request = {
        location: location,
        radius: '3000', // 3km radius
        // You can be more specific here, e.g., type: ['restaurant']
        keyword: 'eating establishment food restaurant cafe bar' 
    };

    statusDiv.textContent = 'Searching for nearby eateries...';
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            statusDiv.textContent = `Found ${results.length} places!`;
            for (let i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
        } else {
            statusDiv.textContent = 'Could not find any places nearby.';
        }

        // Hide the status message after a few seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    });
}

// 4. CREATE A MARKER FOR EACH PLACE FOUND
function createMarker(place) {
    if (!place.geometry || !place.geometry.location) return;

    const marker = new google.maps.Marker({
        map,
        position: place.geometry.location,
    });

    // Create an InfoWindow to show details when a marker is clicked
    infoWindow = new google.maps.InfoWindow();
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