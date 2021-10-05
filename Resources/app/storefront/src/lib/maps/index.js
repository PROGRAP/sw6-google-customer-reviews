const GOOGLE_MAPS_VERSION = '3.46';
const GOOGLE_MAPS_LIBRARIES = 'places';

export const boostrapGoogleMaps = function(apiKey) {
    const callback = `gmc_${Date.now()}`;

    return new Promise((resolve) => {
        window[callback] = () => {
            resolve(window.google.maps);
            delete window[callback];
            document.body.removeChild(script);
        };

        const googleMapsUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=${GOOGLE_MAPS_VERSION}&callback=${callback}&libraries=${GOOGLE_MAPS_LIBRARIES}`;
        const script = document.createElement('script');

        script.src = googleMapsUrl;
        document.body.appendChild(script);
    });
};
