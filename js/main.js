
// create the map object and set the center and zoom
var map = L.map('map', {
    center: [44.997778, -90.130186], zoomControl: false,
    zoom: 7,
});

L.control.zoom({
    position: 'topleft'
}).addTo(map);



// tiles!
var tilesTiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);


// layers: we want them and we want them here 
var wellSitesStyle = {
    radius: 3,
    fillColor: "midnightblue",
    color: "teal",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.7

};

var countyStyle = {
    fill: false,
    weight: .5,
    opacity: 1,
    color: "black",
    dashArray: '3',
    fillOpacity: 0.1

};

var wellPoints;
var censusTracts;
var nitrateLevels;
var errors;

var wellLayer = L.geoJSON(null, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, wellSitesStyle);
    }
}).addTo(map);
var legendControl = L.control({position: 'bottomleft'});


var censusLayer = L.geoJSON(null, {style:styleTracts}).addTo(map);
var countiesLayer = L.geoJSON(null, {style:countyStyle}).addTo(map);
var nitrateLayer = L.geoJSON(null, {style:styleInterpolation});
var errorLayer = L.geoJSON(null, {style:styleError});

var legend;

var legendControl = L.control({position: 'bottomleft'});

// HTML Elements
var exponentInput = document.getElementById("exponent");
var cellSizeInput = document.getElementById("cellSize");
var interpolateButton = document.getElementById("interpolate");
var removeInterpolateButton = document.getElementById("removeInterpolate");
var calculateButton = document.getElementById("calculate");
var loader = document.getElementById("loader");
var regressionLoader = document.getElementById("regressionLoader");
var results = document.getElementById("results");
var slopeDisplay = document.getElementById("slope");
var intersectDisplay = document.getElementById("intersect");
var errorLoader = document.getElementById("errorLoader");
var errorButton = document.getElementById("errorButton");

loader.hidden = true;
regressionLoader.hidden = true;
errorLoader.hidden = true;
interpolateButton.disabled = true;
errorButton.disabled = true;

// User Editable Variables
var exponent = 1;
var cellSize = 5;

// Calculated Values
var regressionEq;


// END DEFINE GLOBAL VARIABLES
// ----------------------------------------------------------------------x----

// --------------------------------------------------------------------------
// BUILD MAP

map.addLayer(tilesTiles);


// addLayers(layers);
addWellSites();
addCensusTracts();
addCounties();

var legendLayers = {
    "Nitrate Samples": wellLayer,
    "Census Tracts" : censusLayer,
    "Counties Outline" : countiesLayer
};


L.control.layers(null, legendLayers, {position: 'topleft'}).addTo(map);

exponentInput.addEventListener("change", function(){
    exponent = Number(exponentInput.value);
});

cellSizeInput.addEventListener("change", function(){
    cellSize = Number(cellSizeInput.value);
});

interpolateButton.addEventListener("click", function(){
    loader.hidden = false;
    $.ajax({
        success:function(){
            createInterpolation(wellPoints);
            nitrateLayer.addTo(map);
            addInterpolateLegend();
            loader.hidden = true;
            calculateButton.disabled = false;
//            addCensusLegend();
//	       results.hidden = true;
	       errorButton.disabled = true;

//	       removeInterpolateButton.disabled = true;
        }
    });
});

// reset the map and start over (remove non-tiles layers, add back in the well sites, census tracts, counties, and legend)
removeInterpolateButton.addEventListener("click",function(){
    map.eachLayer(function (layer) {
        if (layer !== tilesTiles) { // Keep the base tile layer
            map.removeLayer(layer);
        }
    });
    
    addWellSites(); 
    addCensusTracts();
    addCounties();
    addCensusLegend(); 
    results.hidden = true;
    errorButton.disabled = true;
    interpolateButton.disabled = false;

});

calculateButton.addEventListener("click", function(){
    regressionLoader.hidden = false;
    $.ajax({
        success:function(){
            regressionEq = calculateRegression();
            regressionLoader.hidden = true;
            results.hidden = false;
            slopeDisplay.innerText = Number(regressionEq.m).toFixed(2);
            intersectDisplay.innerText = Number(regressionEq.b).toFixed(2);
            errorButton.disabled = false;
        }
    });
});

errorButton.addEventListener("click", function(){
    errorLoader.hidden = false;
    $.ajax({
        success:function(){
            calculateError();
            errorLayer.addTo(map);
            addErrorLegend();
            errorLoader.hidden = true;
//			removeResidualsButton.disabled = false;
        }
    });

});

function addCounties(){
    $.ajax("data/cancer_county.geojson", {
        dataType: "json",
        success: createCountyLayer
    });
};

function createCountyLayer(response, status, jqXHRobject){
    countiesLayer.addData(response);
    countiesLayer.bringToBack(map);
};

// Rename all functions and variables
function addCensusTracts(){
    $.ajax("data/cancer_tracts_join.geojson", {
        dataType: "json",
        success: createCensusLayer
    });
};

function createCensusLayer(response, status, jqXHRobject){

    censusTracts = response;

    censusLayer.addData(response)
    censusLayer.bringToBack(map);

    addCensusLegend();
};


function addWellSites(){
    $.ajax("data/well_nitrate.geojson", {
        dataType: "json",
        success: createWellSitesLayer
    });
};

function createWellSitesLayer(response, status, jqXHRobject){
    wellPoints = response;

    wellLayer.addData(wellPoints, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, wellSitesStyle);
        }
    });
    wellLayer.bringToFront(map);


    // Make the interpolation button active
    interpolateButton.disabled = false;

    // createInterpolation(wellPoints);
};


function createInterpolation(wellPoints){

    nitrateLayer.clearLayers();

    var options = {gridType: 'hex', property: 'nitr_ran', units: 'miles', weight: exponent};
    nitrateLevels = turf.interpolate(wellPoints, cellSize, options);


    nitrateLayer.addData(nitrateLevels);

    loader.hidden = true;
   
};


function getInterpolationColor(d) {
    return d > 5 ? '#02818a' :
        d > 4  ? '#3690c0' :
            d > 3  ? '#67a9cf' :
                d > 1  ? '#a6bddb' :
                    '#ece2f0';
}


function styleInterpolation(feature) {
    return {
        fillColor: getInterpolationColor(feature.properties.nitr_ran),
        weight: .5,
        opacity: 1,
        color: 'cornsilk',
        dashArray: '3',
        fillOpacity: 0.9
    };
}

function getTractsColor(d) {
    return d > .8 ? '#bd0026' :
        d > .6  ? '#f03b20' :
        d > .4  ? '#fd8d3c' :
        d > .2  ? '#fecc5c' :
                  '#ffffb2';
}


function styleTracts(feature) {
    return {
        fillColor: getTractsColor(feature.properties.canrate),
        weight: 0.5,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.7
    };
};

// try 1
function styleError(feature){
    return {
        fillColor: getErrorsColor(feature.properties.errorLevel),
        weight: .5,
        opacity: 1,
        color: 'white',
//        dashArray: '3',
        fillOpacity: 1
    };
};

//
// function getErrorsColor(d){
//     return d > 12 ? '#49006a' :
//         d > 9  ? '#ae017e' :
//             d > 6  ? '#f768a1' :
//                 d > 3  ? '#fcc5c0' :
//                     '#fff7f3';
// }


function getErrorsColor(d){
    return d > .8 ? '#6e016b' :
        d > .6  ? '#88419d' :
        d > .4  ? '#8c6bb1' :
        d > .2  ? '#8c96c6' :
        d >  0  ? '#9ebcda' :
                  '#ffffff';

}




function calculateRegression(){

    var tractCentroids = [];

        turf.featureEach(censusTracts, function(currentFeature, featureIndex){
        var centroid = turf.centroid(currentFeature);
        centroid.properties = {canrate:currentFeature.properties.canrate};
        tractCentroids.push(centroid);
    });

    var collected = turf.collect(nitrateLevels, turf.featureCollection(tractCentroids), 'canrate', 'canrate');

    var emptyBins = []
    var bins = []
    turf.featureEach(collected, function(currentFeature, featureindex){
        if(currentFeature.properties.canrate.length > 0){
            var sum = 0
            for (var i = 0; i < currentFeature.properties.canrate.length; i++){
                sum += currentFeature.properties.canrate[i];
            }
            var canRate = sum / currentFeature.properties.canrate.length

//             currentFeature.properties.canrate = canRate;
            bins.push([currentFeature.properties.nitr_ran, canRate]);
            console.log(currentFeature.properties.nitr_ran)
        }
        else {
            emptyBins.push(currentFeature);
        }
    });

     console.log('bins:', bins);
//    console.log(ss.linearRegression(bins));
    return ss.linearRegression(bins);
};

function calculateError(){
    errors = censusTracts;
    var min = 0, max = 0;
    turf.featureEach(errors, function(currentFeature, featureindex) {
        console.log('Current Feature:', currentFeature)
//        console.log(currentFeature.properties.nitr_ran)
        var canRate = Number(currentFeature.properties.canrate);
        var nitrate = Number(currentFeature.properties.nitrate);
//        console.log('Nitrate:', nitrate);
        var calcCancer = Number((regressionEq.m * nitrate) + regressionEq.b).toFixed(2)
//        console.log(currentFeature.properties.nitr_ran)
        var error = canRate - calcCancer;

        currentFeature.properties.errorLevel = Math.abs(error);
    });

    errorLayer.addData(errors);
//    console.log(errors);
};

function addCensusLegend(){
    legendControl.onAdd = function (map) {

         var div = L.DomUtil.create('div', 'info legend'),
            grades = [0, .2, .4, .6, .8],
            labels = [];
		
		div.innerHTML += '<b>Cancer Rates<br>per 100,000 residents </br>by Census Tract</b><br>'  

        for (var i = 0; i < grades.length; i++) {
			div.innerHTML += '<i style="background:' + getTractsColor(grades[i] + .1) + '"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : ' and above');
		}
		return div;
		};

    legendControl.addTo(map);
    legend = document.getElementsByClassName('legend')[0];

};


function addInterpolateLegend(){
    legend.innerHTML = "";

    var grades = [0, 1, 3, 4, 5],
        labels = [];
	
	legend.innerHTML += '<b>Results</b><br>' 

    for (var i = 0; i < grades.length; i++) {
        legend.innerHTML +=
            '<i style="background:' + getInterpolationColor(grades[i] + .1) + '"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
		}
};

function addErrorLegend(){
    legend.innerHTML = "";

    var grades = [0, .2, .4, .6, .8],
        labels = [];
	
	legend.innerHTML += '<b>Residuals</b><br>' 


    for (var i = 0; i < grades.length; i++) {
        legend.innerHTML +=
            '<i style="background:' + getErrorsColor(grades[i] + .1) + '"></i> ' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
		}
};

