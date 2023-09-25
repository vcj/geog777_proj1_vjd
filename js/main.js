/* Map */

var map = L.map('map', {
        center: [44.437778, -90.130186],
        zoom: 6.5,
});

    //add OSM base tilelayer
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
//
//function createLegend(map, data, attributes,viztype) {
//	var legend = L.control( { position: 'topleft' } );
//	legend.onAdd = function(map) {
//		var legendContainer = L.DomUtil.create("div", "legend");  
//		var symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
//		var margin;
//		L.DomEvent.addListener(legendContainer, 'mousedown', function(e) { 
//			L.DomEvent.stopPropagation(e); 
//		});  
//		$(legendContainer).append("<h2 id='legendTitle'>Insufficient Food <br>Consumption (IFC)<br>& Education Levels</h2>");
//		$(legendContainer).append(symbolsContainer); 
//        //add the color legend inside the existing legend.
//        var div = L.DomUtil.create('div', 'colorLegend'),
//        grades = ["High and Rising IFC, High Edu","High IFC, High Edu","High IFC, Low Edu","Lower  IFC, High Edu","Lower IFC, Low Edu"];
//        for (var i = 0; i < canrate.length; i++) {
//        div.innerHTML +=  '<i style="background-color:' + initColor(canrate[i]) + '; border: 2px solid '+ legendColorBorder(canrate[i])+'"></i> ' + canrate[i] + '<br>';};
//        
//        $(legendContainer).append(div); 
//
//		return legendContainer; 
//		};
//        
//		legend.addTo(map)}; 

function getData(map){
    //load the data
    var data = $.ajax("https://github.com/vcj/geog777_proj1_vjd/blob/main/data/cancer_tracts.json", {
        dataType: "json",
        success: function(response){
             //create an attributes array
            var attributes = ['FID','shape','GEOID10','canrate'];
            var viztype = "canrate"
            symbolize(response, map,attributes,viztype);
//            symbolizeLines(data, map);
//            addSearch(map, data);
//            createLegend(map, data, attributes,viztype);
            selectVizType(map,data,attributes,viztype);

        }
    
    });
};
