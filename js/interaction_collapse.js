//REAL STUFF
var doc = document.documentElement;
var clientWidth = Math.min(doc.clientWidth, 1600);
var clientHeight = doc.clientHeight;
//global replace all non-digits with nothing to get the height number
// var panelContentHeight = document.getElementById("panelContent").style.height;
// panelContentHeight = +panelContentHeight.replace(/\D/g,"");
var margin = {top: 60, right: 20, bottom: 20, left: 20},
width = clientWidth - margin.right - margin.left,
height = clientHeight - margin.top - margin.bottom - 120; //panelContentHeight, header, buttons, and padding for header
//console.log(clientHeight);
d3.select("#panelContent").style("width", clientWidth+"px")
d3.select("#topContainer").style("width", clientWidth +"px")
d3.select("#legend").style("height", 50+"px");
d3.select("#header").style("width", clientWidth+"px");
d3.select("#windowDiv").style("width", clientWidth+"px");
d3.select("#table").style("width", clientWidth+"px");
d3.select("#sliderContent").style("width", (clientWidth-200)+"px"); 
d3.select("#massInformation").style("width", clientWidth/2 +"px");
d3.select("#particleInformation").style("width", clientWidth/2 +"px");
//d3.select("#windowDiv").style("height", (clientHeight-60)+"px");

//textboxes and buttons
var textBoxMinMass = document.getElementById('textboxMinMass');
var textBoxMaxMass = document.getElementById('textboxMaxMass');
var textBoxMinParticle = document.getElementById('textboxMinParticle');
var textBoxMaxParticle = document.getElementById('textboxMaxParticle');
var buttonMass = d3.select("#buttonMass");
var buttonParticle = d3.select("#buttonParticle");
var textBoxSelected = document.getElementById('haloTextSelected');
var checkBoxToggleGraphs = document.getElementById('checkedRemoveGraphs');
var checkBoxToggleTooltips = document.getElementById('checkedRemoveTooltips');
var checkBoxToggleLuminosity = document.getElementById('checkedLuminosity');

//******************************SET UP SVG GRAPH WINDOW
var i = 0,
duration = 600,root;

var haloMap, nodesMap, linksMap;

var maxMass = 0, minMass, maxParticle = 0, minParticle;

var	haloLums = [];

var maxTime = 0;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var nodeDistance;
var massScale = d3.scale.log();
var linkScale = d3.scale.log();
var lumScale = d3.scale.linear();
var timeScale = d3.scale.linear();

var zoom = d3.behavior.zoom();

var nodeMouseDown = false;
var tooltipShown = false;
var tooltipEdgesShown = false;

//Generate tool tips
var tip_n = d3.tip()
  .attr("class", "d3-tip")
  .direction("n")
  .offset([-10,0])
  .html(function(d) { return tipHtml(d) });

var tip_s = d3.tip()
  .attr("class", "d3-tip")
  .direction("s")
  .offset([10,0])
  .html(function(d) { return tipHtml(d) });

var tip_e = d3.tip()
  .attr("class", "d3-tip e")
  .direction("n")
  .offset([-10,98])
  .html(function(d) { return tipHtml(d) });

var tip_w = d3.tip()
  .attr("class", "d3-tip w")
  .direction("w")
  .offset([-55,15])
  .html(function(d) { return tipHtml(d) });
  
/* var tipEdges = d3.tip()
  .attr("class", "d3-tipPath")
  .direction("n")
  .offset([-10,0])
  .html(function(d) {
    //console.log("in tool tip function object", d);
    var color = "black";
    return "Shared Total Particles: <span style='color:" + color +"'>"  + d.sharedParticleCount + "</span><br/>"
	+ "Shared Total Dark Particles: <span style='color:" + color +"'>"  + d.sharedDarkParticleCount + "</span><br/>";
  });*/

var svg = d3.select("#svgContent")
    .style("width", width + margin.left + margin.right)
    .style("height", height + margin.top + margin.bottom)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

svg.append("g")
    .attr("class","timeaxislabel")
    .append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", margin.top - margin.bottom);

svg = svg.insert("g",".timeaxislabel")
    .call(zoom)
    .on("dblclick.zoom", null);
	

//svg.call(tipEdges);
svg.call(tip_n);
svg.call(tip_s);
svg.call(tip_e);
svg.call(tip_w);

svg.append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + 2*margin.bottom)
    .attr("transform", "translate(" + 0 + "," + (margin.top-margin.bottom) + ")");

//just for margin barriers, can remove
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
// filters defined
var defs = svg.append("defs");
var filter = defs.append("filter")
    .attr("id", "blur")
    .attr("height", "130%")
	.attr("width", "130%");
	
filter.append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", 2)
    .attr("result", "blur");

svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "transform")
    .append("g")
    .attr("class", "timeaxis");

svg.select(".transform").append("g")
    .attr("class", "graph") 

var graph = svg.select(".graph");	

//******************************SET UP LEFT PANEL
//scales for both charts
var xHeight = clientHeight/6-90; //used for various sections of the graph/areas
var	x = d3.scale.linear().range([0, clientWidth/3-150]);
var	y = d3.scale.linear().range([xHeight, 0]);
var	xParticle = d3.scale.linear().range([0, clientWidth/3-150]);
var	yParticle = d3.scale.linear().range([xHeight, 0]);

//axes formatting
var exponentFormat = function (x) {return x.toExponential(2)/(1e10);};
var kformat = d3.format(".1s");

var	xAxisMass = d3.svg.axis().scale(x).orient("bottom").ticks(10).tickFormat(function(d) { return exponentFormat(Math.exp(d)); });
var	yAxisMass = d3.svg.axis().scale(y).orient("left").ticks(0).tickFormat("");

var xAxisParticle = d3.svg.axis().scale(xParticle).orient("bottom").tickFormat(function(d) { return kformat(Math.exp(d)); });
var	yAxisParticle = d3.svg.axis().scale(yParticle).orient("left").ticks(0).tickFormat("");

//areas- based on respective domains
var area = d3.svg.area()
	.interpolate("monotone")
    .x(function(d) { return x(d.x); })
    .y0(xHeight)
    .y1(function(d) { return y(d.y); }); 
	
var areaParticle = d3.svg.area()
	.interpolate("monotone")
    .x(function(d) { return xParticle(d.x); })
    .y0(xHeight)
    .y1(function(d) { return yParticle(d.y); });
	
//initialize brushes
var brushMass = d3.svg.brush()
    .x(x)
    .on("brush", brushedMass);
var brushParticle = d3.svg.brush()
    .x(xParticle)
    .on("brush", brushedParticle);
	
//adding brushes to panels
var svgBrushMass = d3.select("#massPanel").append("svg")
    .attr("width", clientWidth/3-100) //width a bit more b/c of text
    .attr("height", clientHeight/8+10);
var svgBrushParticle = d3.select("#particlePanel").append("svg")
    .attr("width", clientWidth/3-100) //width a bit more b/c of text
    .attr("height", clientHeight/8);
	
//transform position to brush 
var contextMass = svgBrushMass.append("g")
    .attr("transform", "translate(" + 10 + "," + 10 + ")"); //staring position
	
var contextParticle = svgBrushParticle.append("g")
    .attr("transform", "translate(" + 10 + "," + 10 + ")"); //staring position


//******************************LOAD DATA
d3.csv("links2.csv", function(error1, raw_links) {
d3.csv("nodes2.csv", function(error2, raw_nodes) {
d3.csv("similarities.csv", function(error3, raw_sims) {
    //CREATE DATA DEPENDENT VARIABLES
    var maxSharedParticle = 0, minSharedParticle;
    var haloMassValues = [], haloParticleValues = [], haloMassValuesLog = [], haloParticleValuesLog = [];
    minMass = raw_nodes[0].HaloMass;
    minParticle = raw_nodes[0].TotalParticles;
    minSharedParticle = raw_links[0].sharedParticleCount;
	minLum = raw_nodes[0].lum;
	maxLum = raw_nodes[0].lum;
	

    raw_links.forEach(function(d) {
        maxSharedParticle = Math.max(maxSharedParticle, +d.sharedParticleCount);
        minSharedParticle = Math.min(minSharedParticle, +d.sharedParticleCount);
    });


    raw_nodes.forEach(function(d){
        maxTime = Math.max(maxTime, +d.Timestep);
        maxMass = Math.max(maxMass, +d.HaloMass);
        minMass = Math.min(minMass, +d.HaloMass);
        maxParticle = Math.max(maxParticle, +d.TotalParticles);
        minParticle = Math.min(minParticle, +d.TotalParticles);
		minLum = Math.min(minLum, +d.lum);
		maxLum = Math.max(maxLum, +d.lum);
        haloMassValues.push(+d.HaloMass);
		haloMassValuesLog.push(+Math.log(d.HaloMass));
        haloParticleValues.push(+d.TotalParticles);
		haloParticleValuesLog.push(+Math.log(d.TotalParticles));
		haloLums.push(+d.lum);
    });
	
    //scale to fit all timesteps
    nodeDistance = width/maxTime

    massScale.domain([minMass, maxMass]).range([2,12]);
    linkScale.domain([minSharedParticle, maxSharedParticle]).range([2,12]);
	lumScale.domain([minLum, maxLum]).range([.09, 1]); //for opacity

    timeScale.domain([1,maxTime]).range([0,(maxTime-1)*nodeDistance]);
    //calculates the max scale factor
    zoom.x(timeScale).scaleExtent([1,(width/8)/nodeDistance]).on("zoom", zoomed);

    var yaxis = svg.select(".timeaxis")
        .selectAll("g.timeaxisgroup")
        .data(d3.range(1, maxTime+1))
        .enter().append("g")
        .attr("class","timeaxisgroup")
        .attr("transform", function(d) {
            return "translate(" + timeScale(d) + ", 0)"; });
        
    yaxis.append("line")
        .attr("class", "timeaxisline")
        .attr("y1", -margin.bottom)
        .attr("y2", height+margin.bottom);

    var yaxislabel = d3.select(".timeaxislabel")
        .selectAll("g.timeaxisgroup")
        .data(d3.range(1, maxTime+1))
        .enter().append("g")
        .attr("class", "timeaxisgroup")
        .attr("transform", function(d) {
            return "translate(" + timeScale(d) + ", 0)"; });

    yaxislabel.append("text")
        .attr("x", margin.left)
        .attr("y", margin.top/2-5)
        .attr("text-anchor", "middle")
        .text(function(d) { return d; });

    //CREATE HALO TREE MAPS
    //basically makes an associative array but it's called a d3.map
    //for each HaloID key, had an array of nodes with that key
    //each array will be of length one
    haloMap = d3.map();
    var similaritiesMap = d3.nest().key(function(d) { return d.from_Group; }).map(raw_sims, d3.map);
    var tempHaloNodesMap = d3.nest().key(function(d) { return d.NowGroup; }).map(raw_nodes, d3.map);
    var tempHaloLinksMap = d3.nest().key(function(d) { return d.NowGroup; }).map(raw_links, d3.map);
    var tempNodesMap, tempLinksMap, tempRoot;
    tempHaloNodesMap.forEach(function(k, v) {
        tempNodesMap = d3.nest().key(function(d) { return d.HaloID; }).map(v, d3.map);
        tempLinksMap = d3.nest().key(function(d) { return d.NextHalo; }).map(tempHaloLinksMap.get(k), d3.map);

        //make tree structure from links
        tempHaloLinksMap.get(k).forEach(function(link) {
            //nodesMap array for each key has only one element
            var parent = tempNodesMap.get(link.CurrentHalo)[0];
            var child = tempNodesMap.get(link.NextHalo)[0];
            if (parent.children) {
                parent.children.push(child);
            } else {
                parent.children = [child];
            }
        });
        tempRoot = tempNodesMap.get(tempHaloLinksMap.get(k)[0].NowHalo)[0];
        tempRoot.x0 = height/2;
        tempRoot.y0 = 0;
        haloMap.set(k, {root: tempRoot, nodes: tempNodesMap, links: tempLinksMap, similarities: similaritiesMap.get(k)});
    });
    //default group
    //updateTree("16");
    var halo = haloMap.get("16");
    root = halo.root;
    nodesMap = halo.nodes;
    linksMap = halo.links;
	haloMassValuesCurrentHalo = [], haloParticleValuesCurrentHalo = [];
	nodesMap.values().forEach(function(d) {
		haloMassValuesCurrentHalo.push(+Math.log(d[0].HaloMass))
		haloParticleValuesCurrentHalo.push(+Math.log(d[0].TotalParticles));
	});
    	
    x.domain([Math.log(minMass), Math.log(maxMass)]);
    xParticle.domain([Math.log(minParticle), Math.log(maxParticle)]); //a bit of buffer
	
    //make buckets
    var dataBinMassAllHalos = d3.layout.histogram()
    .bins(10)(haloMassValuesLog);

    var temp = [];
    temp.x = +Math.log(maxMass);
    temp.y = 0;
    dataBinMassAllHalos.push(temp);


    var dataBinMassCurrentHalo = d3.layout.histogram()
    .bins(10)(haloMassValuesCurrentHalo);

    dataBinMassCurrentHalo.push(temp);
    temp = []; 
    temp.x = +Math.log(minMass);
    temp.y = 0;
    dataBinMassCurrentHalo.unshift(temp);

    //console.log(dataBinMassCurrentHalo);

    var dataBinParticleAllHalos = d3.layout.histogram()
    .bins(10)(haloParticleValuesLog);
    temp = [];
    temp.y = 0;
    temp.x = +Math.log(maxParticle);
    temp.y = 0;
    dataBinParticleAllHalos.push(temp);

    var dataBinParticleCurrentHalo = d3.layout.histogram()
    .bins(10)(haloParticleValuesCurrentHalo);

    dataBinParticleCurrentHalo.push(temp);

    temp = [];

    temp.x = +Math.log(minParticle);
    temp.y = 0;
    dataBinParticleCurrentHalo.unshift(temp);

    //set y domains based on bin values
    y.domain([0, d3.max(dataBinMassAllHalos, function(d) { return d.y; })]);
    yParticle.domain([0, d3.max(dataBinParticleAllHalos, function(d) { return d.y; })]);
    //console.log(d3.max(dataBinMassAllHalos, function(d) { return d.y; }));
    //tie context to area
    contextMass.append("path")
        .datum(dataBinMassAllHalos)
        .attr("class", "area")
        .attr("d", area);
				
	contextMass.append("path")
        .datum(dataBinMassCurrentHalo)
        .attr("class", "areaTop")
        .attr("d", area);
		
    contextParticle.append("path")
        .datum(dataBinParticleAllHalos)
        .attr("class", "area")
        .attr("d", areaParticle);
		
	contextParticle.append("path")
        .datum(dataBinParticleCurrentHalo)
        .attr("class", "areaTop")
        .attr("d", areaParticle);
    	
    //x, y axes and calling brush
    contextMass.append("g")
        .attr("class", "brushxaxis")
        .attr("transform", "translate(0," + xHeight + ")") //axis position
        .call(xAxisMass)
			.selectAll("text")
			.style("font-size", "10px")
			.attr("transform","rotate(0) translate(0,0)");

    contextMass.append("text")
        .attr("class", "brushxlabel")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
		.style("font-size", "14px")
		.style("font-weight", "bold")
        .attr("x", clientWidth/8-35)
        .attr("y", clientHeight/8-10)
        .text("Log Mass (x e");
	//this is probably not the best way to add the script
	contextMass.append("text")
        .attr("class", "brushxlabel")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
		.style("font-size", "10px")
		.style("font-weight", "bold")
        .attr("x", clientWidth/8 + 19)
        .attr("y", clientHeight/8-13)
        .text("10");
		
	contextMass.append("text")
		.attr("class", "brushxlabel")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
		.style("font-size", "14px")
		.style("font-weight", "bold")
        .attr("x", clientWidth/8 + 27)
        .attr("y", clientHeight/8-10)
        .text(")");
    	
    contextMass.append("g")
        .attr("class", "brushyaxis")
        .attr("transform", "translate(0," + 0 + ")") //axis position
        .call(yAxisMass);

    contextMass.attr("class", "xbrush")
        .call(brushMass)
        .selectAll("rect")
        .attr("height", xHeight + 10)
    	.attr("y", -6);   
		
    /*contextMass.append("text")
        .attr("class", "brushylabel")
        .attr("text-anchor", "middle")
    	.attr("transform", "rotate(-90)")
        .attr("x", -xHeight/2)
        .attr("y", -45)
        .text("Frequency");*/

    contextParticle.append("g")
        .attr("class", "brushxaxis")
        .attr("transform", "translate(0," + xHeight + ")") //axis position
        .call(xAxisParticle)
			.selectAll("text")
			.style("font-size", "10px")
			.attr("transform","rotate(0) translate(0,0)");
    	  
    contextParticle.append("text")
        .attr("class", "brushxlabel")
        .attr("text-anchor", "middle")
    	.style("font-size", "14px")
		.style("font-weight", "bold")
        .attr("x", clientWidth/8-35)
        .attr("y", clientHeight/8-10)
        .text("Total Particle Count");
    	  
    contextParticle.append("g")
        .attr("class", "brushyaxis")
        .attr("transform", "translate(0," + 0 + ")") //axis position
        .call(yAxisParticle);
    	
   /* contextParticle.append("text")
        .attr("class", "brushylabel")
        .attr("text-anchor", "middle")
    	//.style("font-size", "20px")
    	.attr("transform", "rotate(-90)")
        .attr("x", -xHeight/2)
        .attr("y", -45)
        .text("Frequency");*/
	
	
    	  
    contextParticle.attr("class", "xbrush")
        .call(brushParticle)
        .selectAll("rect")
        .attr("height", xHeight + 10)
    	.attr("y", -6);
		
	//adding the legend	
	var areaColors = [{text: "All Halos", color:"lightsteelblue"}, {text: "Current Halo", color:"darkblue"}];
	var legend =  d3.select("#legend").append("svg")
		  .attr("class","legend")
	      .attr("width", 300)
		  .attr("height", 20)
		.selectAll("g")
			.data(areaColors)
		.enter().append("g")
			.attr("transform", function(d, i) { return "translate(" + i * 100 + ", 0)"; });
			
		legend.append("rect")
        .attr("width", 12)
        .attr("height", 12)
		.style("stroke", "black")
		.style("stroke-width", "2px")
        .style("fill", function(d) {return d.color});

		legend.append("text")
		.attr("x", 24)
		.attr("y", 9)
		.attr("dy", ".35em")
		.text(function(d) {return d.text});

    populateSlider();
    update(root);
    //start at zoomed out state
});
});
});

function update(source) {
    //compute the new tree layout.
    var nodes = tree.nodes(root);
    var links = tree.links(nodes);
    //console.log(nodes);
    //console.log(links)
    //normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * nodeDistance; });

    // Update the nodes…
    var node = graph.selectAll("g.node")
        .data(nodes, function(d, i) { return d.HaloID; });

    //enter any new nodes at the parent's previous position.
	
	//var test = d3.select("#testing").append("svg").attr("width", 50).attr("height",50);
	//var one =  test.append("circle").style("fill","black")
	//		   .attr("r", 18).attr("cx", 15).attr("cy", 15);	   
	//var two = test.append("circle").style("fill","blue")
	//		   .attr("r", 12).attr("cx", 15).attr("cy", 15);

    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });

    // nodeEnter.append("circle")
    //     .attr("class", "shadow")
    //     .attr("r", 1e-6)
        //.on("mouseover", tip.show)
        // .on("mouseout", function(d) { 
        //     tip.hide(d);
        //     tooltipShown = false;
        // })
        // .on("mouseup", function(d) { nodeMouseDown = false; })
        // .on("mousedown", function(d) { nodeMouseDown = true; })
        // .on("mousemove", function(d) { 
        //     if (!nodeMouseDown && !tooltipShown) {
        //         tip.show(d);
        //         tooltipShown = true;
        //     }
        // })
        // .on("click", click);

    nodeEnter.append("circle")
        .attr("class", "shadow")
        .attr("r", 1e-6);
		
	nodeEnter.append("circle")
        .attr("class", "visible")
        .attr("r", 1e-6);
		
    nodeEnter.append("path") //0 0 is center of circle
        .attr("class", "children")
        .attr("d", "M 0 0")
        .style("fill-opacity", 1e-6);
		
	nodeEnter.append("circle")
		.attr("class", "hover")
		.attr("r", 1e-6)
		.on("mouseover", function(d) {
            if (d.y <= 125) {
                tip_e.show(d);
            } else if (d.x <= 35) {
                tip_s.show(d);
            } else if (d.y >= width-60) {
                tip_w.show(d);
            } else {
                tip_n.show(d);
            }
            tooltipShown = true;
        })
        .on("mouseout", function(d) { 
            tip_n.hide(d);
            tip_s.hide(d);
            tip_e.hide(d);
            tip_w.hide(d);
            tooltipShown = false;
        })
        .on("mouseup", function(d) { nodeMouseDown = false; })
        .on("mousedown", function(d) { nodeMouseDown = true; })
        .on("mousemove", function(d) { 
            if (!nodeMouseDown && !tooltipShown) {
                if (d.y <= 125) {
                    tip_e.show(d);
                } else if (d.x <= 35) {
                    tip_s.show(d);
                } else if (d.y >= width-60) {
                    tip_w.show(d);
                } else {
                    tip_n.show(d);
                }
                tooltipShown = true;
            }
        })
        .on("click", click)
		.style("opacity", ".001");
		
	/*var hoverLink = d3.selectAll("path.link")				
		.on("mousemove", function(d) { 
		//console.log(linksMap.get(d.target.HaloID)[0]);
		   if(!tooltipEdgesShown) {
                tipEdges.show(linksMap.get(d.target.HaloID)[0]);
				tooltipShown = true;
           }
        })
		.on("mouseout", function(d) {
			tipEdges.hide(d);
            tooltipEdgesShown = false;
		});*/
		
    //transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle.visible")
        .attr("r", function(d) { return massScale(d.HaloMass); })
        .style("stroke", function(d) { return d.Prog=='1' ? "#D44848" : "lightsteelblue"; })
    	.style("stroke-width", "2")
		.style("opacity", "1");
		
	nodeUpdate.select("circle.shadow") //make a scale instead?
        .attr("r", function(d)
			{
			 var scaledMass = massScale(d.HaloMass); //up to 12
			 switch(true)
			 {
				case (scaledMass <= 4): return scaledMass+5;
				case (scaledMass <= 5): return scaledMass*2;
				case (scaledMass <= 7): return 12;
				case (scaledMass < 12): return scaledMass+6;
				
			 }
			})
		.style("opacity", ".01");
		
	nodeUpdate.select("circle.hover")
        .attr("r", function(d)
			{
			  if(massScale(d.HaloMass) < 9)
			   {
			       return 15;
			   }
			   else 
			   {
			     return 25;
			   }
			});
	
    nodeUpdate.select("path.children")
        .style("fill-opacity", function(d) { return d._children ? 0.7 : 1e-6; })
        .attr("d", function(d) {
            var r = massScale(d.HaloMass)+2; //2 for stroke width
            var p = 10;
            var str = "M " + r + " -" + p + " L " + r + " " + p + " L " + (1.5*p+r) + " 0 z";
            return str;
        });
		

	
	//color filters based on brushes
    var brushExtentMin = Math.exp(brushMass.extent()[0]);
    var brushExtentMax = Math.exp(brushMass.extent()[1]);

    var brushExtentMinP = Math.exp(brushParticle.extent()[0]);
    var brushExtentMaxP = Math.exp(brushParticle.extent()[1]);
	



    counterHaloSelected = 0;
	
	nodeUpdate.selectAll("circle.shadow")
		.filter(function (d)  //if selected
					{
						if(
						   (!brushMass.empty() && brushParticle.empty() && ((d.HaloMass >= brushExtentMin) && (d.HaloMass <= brushExtentMax))) || //mass brush and conditions
						   (brushMass.empty() && !brushParticle.empty()  && ((d.TotalParticles >= brushExtentMinP) && (d.TotalParticles <= brushExtentMax))) || //particle brush and conditions
						   (((d.HaloMass >= brushExtentMin) && (d.HaloMass <= brushExtentMax)) && ((d.TotalParticles >= brushExtentMinP) && (d.TotalParticles <= brushExtentMaxP)))) //both selected
						   {
						     counterHaloSelected = counterHaloSelected + 1;
						     return d;
						   }
					})
		.style("fill", "#E3C937")
		.style("opacity", ".5")
		.style("filter", "url(#blur)");
	
	//blur filter 
	nodeEnter.select("circle.shadow").append("defs")  
	 .append("filter")  
	 .attr("id", "blur")  
	 .attr("stdDeviation", 15);  

		
	textBoxSelected.innerHTML = counterHaloSelected + "/" + nodes.length + " Halos selected";
	
    //transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle.visible")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    //update the links…
    var link = graph.selectAll("path.link")
        .data(links, function(d) { return d.target.HaloID; });

    //enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        });

    //transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", function(d) {
            return diagonal(d);
        })
        .style("stroke-width", function(d) { return linkScale(+linksMap.get(d.target.HaloID)[0].sharedParticleCount); })
        .style("opacity","0.4")
        .style("stroke-linecap", "round"); //can be butt or square

    //transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
           var o = {x: source.x, y: source.y};
           return diagonal({source: o, target: o});
        })
        .remove();

    //stash the old positions for transition.
    nodes.forEach(function(d) {
        //if node moved with click, we don't want to display tooltip
        //movement via drag is handled with transform, not d.x and d.y
        if (d.x0 != d.x || d.y0 != d.y) {
            tip_n.hide();
            tip_s.hide();
            tip_e.hide();
            tip_w.hide();
        }
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

//returns a list of all nodes under the root.
function flatten(root) {
    var nodes = [];

    function recurse(node) {
        if (node.children) {
            node.children.forEach(recurse);
        }
        nodes.push(node);
    }
    recurse(root);
    return nodes;
}

//function d3 uses when calling tree.links(nodes)
function linkage(nodes) {
    return d3.merge(nodes.map(function(parent) {
        return (parent.children || []).map(function(child) {
            return {
                source: parent,
                target: child
            };
        });
    }));
}

//toggle children on click.
function click(d) {
if( checkBoxToggleLuminosity.checked)
{ 
 checkBoxToggleLuminosity.checked = false;
}


    if (d3.event.defaultPrevented ) {
		
        return;
    }
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

function zoomed() {
    //hide tooltip on zoom and drag; will be shown again when user moved mouse
    tip_n.hide();
    tip_s.hide();
    tip_e.hide();
    tip_w.hide();
    tooltipShown = false;
    var currentTransform = graph.attr("transform");
    var scale = d3.event.scale;
    var tx = d3.event.translate[0];
    var ty = d3.event.translate[1];

    //100 for padding
    ty = Math.min(Math.max(ty, -scale*height+scale*height/5), height-scale*height/5);
    tx = Math.min(Math.max(tx, -scale*(maxTime-4)*nodeDistance), width-3*scale*nodeDistance);
    //set the zoom translate so if user keeps on scrolling, it doesn't register with zoom
    zoom.translate([tx,ty]);
    graph.attr("transform", "translate(" + [tx,ty] + ")scale(" + scale + ")");
    if (tx == d3.event.translate[0]) {
        svg.select(".timeaxis").selectAll("g.timeaxisgroup")
            .attr("transform", function(d) {
                return "translate(" + timeScale(d) + ", 0)";
            });
        d3.select(".timeaxislabel").selectAll("g.timeaxisgroup")
            .attr("transform", function(d) {
                return "translate(" + timeScale(d) + ", 0)";
            });
        }
}

function changeTree(grp) {

	if (checkBoxToggleLuminosity.checked)
	{
	  checkBoxToggleLuminosity.checked = false;
	}

    var timeOut1, timeOut2 = 0;
    if (zoom.scale() != 1 || zoom.translate()[0] != 0 || zoom.translate()[1] != 0) {
        timeOut1 = duration;
        zoom.scale(1);
        zoom.translate([0,0]);
        graph.transition().duration(duration).attr("transform", "translate(" + [0,0] + ")scale(" + 1 + ")");
        svg.select(".timeaxis").selectAll("g.timeaxisgroup").transition().duration(duration)
            .attr("transform", function(d) {
                //console.log(d, timeScale(d)); 
                return "translate(" + timeScale(d) + ", 0)";
            });
        d3.select(".timeaxislabel").selectAll("g.timeaxisgroup")
            .attr("transform", function(d) {
                return "translate(" + timeScale(d) + ", 0)";
            });
    }

    setTimeout(function(){
        function expand(d) {
            //must check if children and _children so don't expand leaf
            if (d._children) {
                timeOut2 = duration;
                d.children = d._children;
                d._children = null;
                update(d);
                d.children.forEach(expand);
            }
            else if (d.children) {
                d.children.forEach(expand);
            }
        }
        expand(root)
        //pause for the transition to complete
        setTimeout(function(){
            var halo = haloMap.get(grp);
            root = halo.root;
            nodesMap = halo.nodes;
            linksMap = halo.links;
            changeGraph();
            changeSlider();
            //exit current tree
            var node = graph.selectAll("g.node")
            .data([]);
            //transition exiting nodes
            var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + root.y0 + "," + root.x0 + ")"; })
            .remove();

            nodeExit.select("circle")
            .attr("r", 1e-6);

            nodeExit.select("text")
            .style("fill-opacity", 1e-6);

            //exit link
            var link = graph.selectAll("path.link")
            .data([]);

            // Transition exiting nodes
            link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
               var o = {x: root.x0, y: root.y0};
               return diagonal({source: o, target: o});
            })
            .remove();
            setTimeout(function() {
                update(root);
            }, duration);
        }, timeOut2);
    }, timeOut1);
}

function changeGraph() {
    var haloMassValuesCurrentHalo = [], haloParticleValuesCurrentHalo = [];
    nodesMap.values().forEach(function(d) {
        haloMassValuesCurrentHalo.push(+Math.log(d[0].HaloMass))
        haloParticleValuesCurrentHalo.push(+Math.log(d[0].TotalParticles));
    });
    
    var dataBinMassCurrentHalo = d3.layout.histogram()
        .bins(10)(haloMassValuesCurrentHalo);
    var dataBinParticleCurrentHalo = d3.layout.histogram()
        .bins(10)(haloParticleValuesCurrentHalo);

    var temp = [];
    temp.x = +Math.log(maxMass);
    temp.y = 0;
    dataBinMassCurrentHalo.push(temp);

    temp = [];
    temp.x = +Math.log(minMass);
    temp.y = 0;
    dataBinMassCurrentHalo.unshift(temp);

    //console.log(dataBinMassCurrentHalo);

    temp = [];
    temp.x = +Math.log(maxParticle);
    temp.y = 0;
    dataBinParticleCurrentHalo.push(temp);

    temp = [];
    temp.x = +Math.log(minParticle);
    temp.y = 0;
    dataBinParticleCurrentHalo.unshift(temp);
        
    contextMass.select(".areaTop")
        .datum(dataBinMassCurrentHalo)
        .transition()
        .duration(duration)
        .attr("d", area);

    contextParticle.select(".areaTop")
        .datum(dataBinParticleCurrentHalo)
        .transition()
        .duration(duration)
        .attr("d", areaParticle);
}

function resetTree() {
    var timeOut1 = 0;
    if (zoom.scale() != 1 || zoom.translate()[0] != 0 || zoom.translate()[1] != 0) {
        timeOut1 = duration;
        zoom.scale(1);
        zoom.translate([0,0]);
        graph.transition().duration(duration).attr("transform", "translate(" + [0,0] + ")scale(" + 1 + ")");
        svg.select(".timeaxis").selectAll("g.timeaxisgroup").transition().duration(duration)
            .attr("transform", function(d) {
                //console.log(d, timeScale(d)); 
                return "translate(" + timeScale(d) + ", 0)";
            });
        d3.select(".timeaxislabel").selectAll("g.timeaxisgroup")
            .attr("transform", function(d) {
                return "translate(" + timeScale(d) + ", 0)";
            });
    }
    //pause for the transition to complete
    setTimeout(function(){
        function expand(d) {
            //must check if children and _children so don't expand leaf
            if (d._children) {
                d.children = d._children;
                d._children = null;
                update(d);
                setTimeout(function() { d.children.forEach(expand); }, duration);
                //update(d);
            }
            else if (d.children) {
                d.children.forEach(expand);
            }
        }
        expand(root)
    }, timeOut1);
}


function brushedMass() {
	//console.log(brushMass.extent());
	
	if (checkBoxToggleLuminosity.checked)
	{
	  checkBoxToggleLuminosity.checked = false;
	}
	if(brushMass.extent()[0] != brushMass.extent()[1] )
	{
	var expFormatText = function (x) {return x.toExponential(3);};
	textBoxMinMass.value = expFormatText(Math.exp(brushMass.extent()[0]));
	textBoxMaxMass.value = expFormatText(Math.exp(brushMass.extent()[1]));
	}
	else{
	textBoxMinMass.value = 0;
	textBoxMaxMass.value = 0;
	}
	
	
    var oldDuration = duration;
    //set duration to 0 so the color change is automatic
    duration = 0;
    update(root);
    duration = oldDuration;
}

function brushedParticle()
{
	if (checkBoxToggleLuminosity.checked)
	{
	  checkBoxToggleLuminosity.checked = false;
	}
	if(brushParticle.extent()[0] !=  brushParticle.extent()[1])
	{
    var decimalFormat = d3.format(".2f");
	textBoxMinParticle.value = decimalFormat(Math.exp(brushParticle.extent()[0]));
	textBoxMaxParticle.value = decimalFormat(Math.exp(brushParticle.extent()[1]));
	}
	else {
	textBoxMinParticle.value = 0;
	textBoxMaxParticle.value = 0;
	}

    var oldDuration = duration;
    //set duration to 0 so the color change is automatic
    duration = 0;
    update(root);
    duration = oldDuration;
}

buttonMass.on("click", function(d) {

   var high = +textboxMaxMass.value;
   var low = +textboxMinMass.value;
   if(low < minMass || low > high)
   {
		low = minMass;
   }
   if(high > maxMass || high < low)
   {
		high = maxMass;
   }
   svgBrushMass
		.select(".xbrush")
		.transition()
		.call(brushMass.extent([Math.log(low), Math.log(high)]));
	brushedMass();
});

buttonParticle.on("click", function(d) {
   var high = +textboxMaxParticle.value;
   var low = +textboxMinParticle.value;
   if(low < minParticle || low > high)
   {
		low = minParticle;
   }
   if(high > maxParticle || high < low)
   {
		high = maxParticle;
   }
   svgBrushParticle
		.select(".xbrush")
		.transition()
		.call(brushParticle.extent([Math.log(low), Math.log(high)]));
	brushedParticle();

});

function toggleGraphs() {
	   svgBrushMass.select(".xbrush").call(brushMass.clear());
	   svgBrushParticle.select(".xbrush").call(brushParticle.clear());
	   brushedMass();
	   brushedParticle();
	   $('#panelContent').toggle();
	 
};

function toggleTooltips() {
	if(checkBoxToggleTooltips.checked)
	{
	  d3.selectAll(".d3-tip").remove();
	}
	else{
	  svg.call(tip);
	}
};

function toggleLuminosity() {
	if(checkBoxToggleLuminosity.checked)
	{
	   svgBrushMass.select(".xbrush").call(brushMass.clear());
	   svgBrushParticle.select(".xbrush").call(brushParticle.clear());
	   textBoxMinParticle.value = 0;
	   textBoxMaxParticle.value = 0;
	   textBoxMinMass.value = 0;
	   textBoxMaxMass.value = 0;
	   
	   var nodesStroke = d3.selectAll("circle.visible")
						 .transition()
					 	 .style("stroke", "white")
						 .style("stroke-width", "1")
						 .style("opacity", function(d)
							{
								if(d.lum == 0)
								{
									return ".5";
								}
								else
								{
									return ".07";
								}
							})
						 .attr("r",  10); //slightly smaller due to blur of circle.shadow
	   

		var nodesShadow = d3.selectAll("circle.shadow")
						 .transition()
						 .filter(function(d) {if(d.lum !=0) {return d;}})
					     .style("fill", "white")
						 .attr("r",  13)
						 .style("opacity", function (d) 
						 {
							return lumScale(d.lum);
						 })
						 .style("filter", "url(#blur)");
						 
						 
		var otherShade = d3.selectAll("circle.shadow")
						 .filter(function(d) {if(d.lum ==0) { console.log("retruned", d); return d;}})
					     .style("fill", "black")
						 .style("opacity", 1)
						 .attr("r",  10);
		
		
							
		var edges = d3.selectAll("path.link")
					.transition()
					 .style("stroke", "gray")
					.style("opacity", ".1");
		
	}
	else {
	//toggleGraphs();
	update(root);
	}
};

function tipHtml(d) {
    var color = "black";
    return "Halo Group: <span style='color:" + color +"'>"  + d.GrpID + "</span><br/>" 
          + "Halo Mass: <span style='color:" + color +"'>" + d.HaloMass + "</span><br/>" 
          + "Total Particles: <span style='color:" + color +"'>" + d.TotalParticles + "</span><br/>"
          + "Total Dark Particles: <span style='color:" + color +"'>" + d.TotalDarkParticles + "</span><br/>"
		  + "Total Luminosity: <span style='color:" + color +"'>" + d.lum + "</span><br/>";
}

function populateSlider() {
    var curGrp = root.GrpID;
    var similarities = haloMap.get(curGrp).similarities;
    current = similarities[0];
    similarities = similarities.slice(1,8);
    
    var currentImage = d3.select("#sliderContent")
        .append("div")
        .attr("id", "current")
        .attr("class", "viewer ui-corner-all")
        .selectAll(".item")
        .data([current])
        .enter()
        .append("div")
        .attr("class", "item");

    currentImage.append("img")
        .attr("src", function(d) {
            return "images/halo"+8+".png"; //replace num with d.to_Group
        });

    currentImage = currentImage.append("div")
        .attr("class", "text ui-helper-clearfix")
        .style("font-size", "12px")
        .text(function(d) { return "Group ID: " + d.to_Group; });

    var slider = d3.select("#sliderContent")
        .attr("class", "ui-corner-all")
        .append("div")
        .attr("class", "viewer ui-corner-all")
        .attr("id", "similarities")
        .append("div")
        .attr("class", "content-conveyor ui-helper-clearfix")
        .selectAll(".item")
        .data(similarities) //don't specify key function because was to be joined on index
        .enter()
        .append("div")
        .attr("class", "item");

    slider.append("img")
        .attr("src", function(d) {
            return "images/halo"+8+".png"; //replace num with d.to_Group
        })
        .on("click", function(d) { changeTree(d.to_Group); });

    slider = slider.append("div")
        .attr("class", "text ui-helper-clearfix")
        .style("font-size", "12px")
        .text(function(d) { return "Group ID: " + d.to_Group; });

    d3.select("#sliderContent")
        .append("div")
        .attr("id", "slider");
    activateSlider();
}

function changeSlider() {
    var curGrp = root.GrpID;
    // console.log("cure", curGrp);
    var similarities = haloMap.get(curGrp).similarities;
    current = similarities[0];
    similarities = similarities.slice(1,8);

    //console.log(similarities);
    var currentImage = d3.select("#sliderContent")
        .select("#current")
        .selectAll(".item")
        .data([current]);

    currentImage.select("img")
        .attr("src", function(d) {
            return "images/halo"+8+".png"; //replace num with d.to_Group
        });

    currentImage.select(".text")
        .text(function(d) { return "Group ID: " + d.to_Group; });

    var slider = d3.select("#sliderContent")
        .select(".content-conveyor")
        .selectAll(".item")
        .data(similarities);

    slider.select("img")
        .attr("src", function(d) {
            return "images/halo"+8+".png"; //change to d.to_Group
        });

    slider.select(".text")
        .text(function(d) { return "Group ID: " + d.to_Group; });
        
}
