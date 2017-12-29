var turf = require('@turf/turf'),
  flatten = require('geojson-flatten'),
  normalize = require('@mapbox/geojson-normalize'),
  tilebelt = require('@mapbox/tilebelt'),
  fs = require('fs');

module.exports = function(data, tile, writeData, done) {
  var refDeltas = turf.featureCollection([]);

  try {
    var osmData = normalize(data.ref.source_osm);
    if (data.source) {
      var refRoads = normalize(data.source.traces_as_points);

      osmData = flatten(osmData);
      refRoads = flatten(refRoads);

      // buffer streets
      var streetBuffers = osmData.features.map(function(f) {
        var buffer = turf.buffer(f, 0.02);
        if (buffer) return buffer;
      });

      var merged = streetBuffers[0];
      for (var i = 1; i < streetBuffers.length; i++) {
        merged = turf.union(merged, streetBuffers[i]);
      }

      var options = {tolerance: 0.00001, highQuality: false};
      merged = turf.simplify(merged, options);

      streetBuffers = normalize(merged);
      if (refRoads && streetBuffers) {
        refRoads.features.forEach(function(refRoad) {
          streetBuffers.features.forEach(function(streetsRoad) {
            var point_inside = turf.pointsWithinPolygon(refRoad, streetsRoad) // return an empty geojson if the point is not inside
            if (point_inside.features.length != 1) {
              refDeltas.features.push(refRoad);
            };
          });
        });
      }
    } else {
      refDeltas = refRoads;
    }

  } catch (e) {
    var tileName = tile[2] + "-" + tile[0] + "-" + tile[1];
    console.log("Could not process tile " + tileName + ": " + e.message);
  }

  done(null, refDeltas);
};
