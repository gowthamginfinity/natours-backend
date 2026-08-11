/* global mapboxgl */
// const mapElement = document.getElementById('map');
// const locations = JSON.parse(mapElement.dataset.locations);

const displayMap = (locations) => {
  mapboxgl.accessToken = '';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/gowthamng/cmqyrwbcj000001phc474cubb',
    scrollZoom: false,
  });

  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({ element: el, anchor: 'bottom' }) // anchor bottom is to represent the where to show like bottom of the image pointer
      .setLngLat(loc.coordinates)
      .addTo(map);

    new mapboxgl.Popup({ offset: 30, closeOnClick: false })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 },
  });
};

module.exports = { displayMap };
