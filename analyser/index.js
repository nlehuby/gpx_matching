var tileReduce = require('@mapbox/tile-reduce');
var bbox = [-4.3834083,5.256455,-4.1116333,5.386335];
var fs = require('fs');

var args = process.argv.slice(2);

var outputStream = fs.createWriteStream(args[2]);

var opts = {
  zoom: 14,
  bbox: bbox,
  sources: [
    {
      name: 'ref',
      mbtiles: args[1],
      layers: ["source_osm"]
    },
    {
      name: 'source',
      mbtiles: args[0],
      layers: ["traces_as_points"]
    }
  ],
  requireData: 'any',
  map: __dirname + '/difference_point.js'
};

var firstFeature = true;
tileReduce(opts).on('reduce', function(arg1) {

  for (var i = 0; i < arg1.features.length; i++) {
    if (!firstFeature) {
      outputStream.write(',');
    }
    firstFeature = false;
    outputStream.write(JSON.stringify(arg1.features[i]));
  }
})
.on('start', function () {
  outputStream.write('{ "type": "FeatureCollection", "features": [');
})
.on('error', function(err){
  throw err;
})
.on('end', function() {

  outputStream.write('] }');
  outputStream.end();
});
