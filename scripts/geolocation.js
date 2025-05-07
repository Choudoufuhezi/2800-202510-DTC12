export async function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by your browser');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                console.log('Geolocation data:', {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                console.error('Error getting geolocation:', error);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000
            }
        );
    });
}