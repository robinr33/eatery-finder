let map;
let infoWindow; // Create ONE infoWindow to be reused for all markers
const placedMarkerIds = new Set(); // Use a Set to track placed markers and avoid duplicates
const statusDiv = document.getElementById('status');

// This function is called by the Google Maps script when it's ready.
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
            () => {
                handleLocationError('Error: The Geolocation service failed.');
            }
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
        mapId: 'eatery-finder-map' // Optional: For custom styling in the future
    });

    // Initialize the single InfoWindow object.
    infoWindow = new google.maps.InfoWindow();

    // Create a custom marker for the user's location.
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
    
    // Create the 3km radius circle.
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

    // *** NEW LOGIC: Search for multiple types of eateries ***
    findNearbyEateries(location);
}

// NEW: This function runs multiple searches, one for each type.
function findNearbyEateries(location) {
    statusDiv.textContent = 'Searching for nearby eateries...';
    
    // Define the types we want to search for.
    const eateryTypes = ['restaurant', 'cafe', 'bar', 'bakery'];
    const service = new google.maps.places.PlacesService(map);
    
    // Loop through each type and perform a separate search.
    eateryTypes.forEach(type => {
        const request = {
            location: location,
            radius: '3000',
            type: [type] // Use the 'type' parameter for better results
        };

        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                // Process the results from this specific search
                results.forEach(place => {
                    // Check if we've already added this place (to avoid duplicates)
                    if (!placedMarkerIds.has(place.place_id)) {
                        placedMarkerIds.add(place.place_id); // Add its unique ID to our Set
                        createMarker(place); // Create the marker
                    }
                });
            }
            // Update the status with the total number of unique places found so far
            statusDiv.textContent = `Found ${placedMarkerIds.size} unique places.`;
        });
    });

    // Hide the status message after all searches are likely complete.
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 7000); // Increased timeout to allow for multiple API calls
}


// FIXED: This function now correctly uses the single infoWindow.
function createMarker(place) {
    if (!place.geometry || !place.geometry.location) return;

    const marker = new google.maps.Marker({
        map,
        position: place.geometry.location,
        title: place.name,
        animation: google.maps.Animation.DROP // Add a nice drop animation
    });

    // Add a click listener to EACH marker.
    google.maps.event.addListener(marker, "click", () => {
        // When clicked, set the content for our single infoWindow
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