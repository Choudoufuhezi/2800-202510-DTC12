export async function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by your browser');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    address: await getAddress(position.coords.latitude, position.coords.longitude)
                };
                console.log('Geolocation data:', location);
                resolve(location); 
            },
            (error) => {
                console.error('Error getting geolocation:', error);
                resolve(null);
            },
            {
                enableHighAccuracy: false,
                timeout: 20000
            }
        );
    });
}

async function getAddress(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      console.log(data.address);
      return {
        city: data.address.city || data.address.town || data.address.village,
        country: data.address.country
      };
    } catch (error) {
      console.error("Error fetching location data:", error);
      return null;
    }
  }