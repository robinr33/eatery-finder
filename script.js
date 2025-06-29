let map;
let infoWindow;
const placedMarkerIds = new Set();
const statusDiv = document.getElementById('status');

// This is the main function called by the Google Maps script tag
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

// The main map creation and search initiation function is now "async"
async function createMap(location) {
    map = new google.maps.Map(document.getElementById("map"), {
        center: location,
        zoom: 15,
    });

    infoWindow = new google.maps.InfoWindow();

    // User location marker
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
    
    // Radius circle
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

    // *** NEW SEQUENTIAL SEARCH LOGIC ***
    statusDiv.textContent = 'Searching for nearby eateries...';
    const eateryTypes = ['restaurant', 'cafe', 'bar', 'bakery', 'food'];
    const service = new google.maps.places.PlacesService(map);

    // This loop waits for each search to complete before starting the next
    for (const type of eateryTypes) {
        statusDiv.textContent = `Searching for type: ${type}...`;
        await searchForType(location, type, service);
    }

    statusDiv.textContent = `Search complete! Found ${placedMarkerIds.size} total places.`;
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

// This new function performs a search for ONE type and handles its pagination
// It returns a "Promise", which means the `await` keyword will wait for it to finish
function searchForType(location, type, service) {
    return new Promise((resolve) => {
        const request = {
            location: location,
            radius: '3000',
            type: [type]
        };

        service.nearbySearch(request, (results, status, pagination) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                processPlaces(results);

                if (pagination && pagination.hasNextPage) {
                    // Wait 2 seconds before fetching the next page, as required by the API
                    setTimeout(() => pagination.nextPage(), 2000);
                } else {
                    // If no more pages, this search type is done, so we resolve the promise
                    resolve();
                }
            } else {
                // If there's an error or no results, we are also done with this type
                if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    console.error(`Places API error for type "${type}": ${status}`);
                }
                resolve();
            }
        });
    });
}

// This helper function adds markers to the map
function processPlaces(results) {
    results.forEach(place => {
        if (!placedMarkerIds.has(place.place_id)) {
            placedMarkerIds.add(place.place_id);
            createMarker(place);
        }
    });
    console.log(`Total unique places found so far: ${placedMarkerIds.size}`);
}

// This function creates a single marker and its click listener
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