import { mapboxgl } from 'mapbox-gl';
const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);


const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
    center: [-74.5, 40], // starting position [lng, lat]
    zoom: 9 // starting zoom
});