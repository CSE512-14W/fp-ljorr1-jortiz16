var doc = document.documentElement;
var clientWidth = Math.min(doc.clientWidth, 1400);
//global replace all non-digits with nothing to get the height number
var leftPanelHeight = document.getElementById("leftPanel").style.height;
leftPanelHeight = +leftPanelHeight.replace(/\D/g,"");
var margin = {top: 70, right: 20, bottom: 20, left: 20},
width = clientWidth - margin.right - margin.left,
height = doc.clientHeight - margin.top - margin.bottom - leftPanelHeight - 80; //80 for header

d3.select("#header").style("width", clientWidth+"px");
d3.select("#header").style("height", 80+"px");
d3.select("#windowDiv").style("width", clientWidth+"px");
//d3.select("#windowDiv").style("height", (doc.clientHeight-80)+"px");

//******************************SET UP SVG GRAPH WINDOW
var i = 0,
duration = 600,root;

var haloMap, nodesMap, linksMap;

var haloMassExtent, haloParticleExtent;

var maxTime = 0;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var nodeDistance = 100;
var massScale = d3.scale.log();
var linkScale = d3.scale.log();
var timeScale = d3.scale.linear();

var zoom = d3.behavior.zoom();

var tip = d3.tip()
  .attr("class", "d3-tip")
  .direction("n")
  .offset([-10,0])
  .style("font-color", "#FF0000")
  .html(function(d) {
    return "Halo Grp: "  + d.GrpID + "<br/>" 
	      + "Halo Mass: " + d.HaloMass + "<br/>" 
		  + "Total Particles: " + d.TotalParticles + "<br/>"
		  + "Total Dark Particles: " + d.TotalDarkParticles + "<br/>";
  });

var svg = d3.select("#svgContent")
    .style("width", width + margin.left + margin.right)
    .style("height", height + margin.top + margin.bottom)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .call(zoom)
    .on("dblclick.zoom", null);
	
svg.call(tip);

svg.append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "transform")
    .append("g")
    .attr("class", "timeaxis");

svg.select(".transform").append("g")
    .attr("class", "graph") 

var graph = svg.select(".graph");	

//******************************SET UP LEFT PANEL
//brushing details
//var infoBox = d3.select("#leftPanel");
//scales for both charts -- scaled properly later
var xHeight = 120; //used for various sections of the graph/areas
var	x = d3.scale.linear().range([0, 700]);
var	y = d3.scale.linear().range([xHeight, 0]);
var	xParticle = d3.scale.linear().range([0, 700]);
var	yParticle = d3.scale.linear().range([xHeight, 0]);

//axes
//formatting
var exponentFormat = function (x) {return x.toExponential(1);};
var kformat = d3.format(".1s");

var	xAxisMass = d3.svg.axis().scale(x).orient("bottom").ticks(10).tickFormat(function(d) {
console.log(d); 
return  exponentFormat(Math.exp(d)); });
var	yAxisMass = d3.svg.axis().scale(y).orient("left").ticks(5);

var xAxisParticle = d3.svg.axis().scale(xParticle).orient("bottom").tickFormat(function (d) { return kformat(Math.exp(d)); });
var	yAxisParticle = d3.svg.axis().scale(yParticle).orient("left").ticks(5);

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
    .on("brush", brushed);
var brushParticle = d3.svg.brush()
    .x(xParticle)
    .on("brush", brushed);
	
//adding brushes to panels
var svgBrushMass = d3.select("#massPanel").append("svg")
    .attr("width", 800) //width a bit more b/c of text
    .attr("height", 200);
var svgBrushParticle = d3.select("#particlePanel").append("svg")
    .attr("width", 750) //width a bit more b/c of text
    .attr("height", 200);
	
//transform position to brush 
var contextMass = svgBrushMass.append("g")
    .attr("transform", "translate(" + 45 + "," + 10 + ")"); //staring position
	
var contextParticle = svgBrushParticle.append("g")
    .attr("transform", "translate(" + 45 + "," + 10 + ")"); //staring position


//******************************LOAD DATA
d3.csv("links2.csv", function(error1, raw_links) {
d3.csv("nodes2.csv", function(error2, raw_nodes) {

    //CREATE DATA DEPENDENT VARIABLES
    var maxMass = 0, minMass, maxParticle = 0, minParticle, maxSharedParticle = 0, minSharedParticle;
    var haloMassValues = [], haloParticleValues = [], haloMassValuesLog = [], haloParticleValuesLog = [];
    minMass = raw_nodes[0].HaloMass;
    minParticle = raw_nodes[0].TotalParticles;
    minSharedParticle = raw_links[0].sharedParticleCount;

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
        haloMassValues.push(+d.HaloMass);
		haloMassValuesLog.push(+Math.log(d.HaloMass));
        haloParticleValues.push(+d.TotalParticles);
		haloParticleValuesLog.push(+Math.log(d.TotalParticles));
    });
    //know that maximum halo mass is 83751473296264 and minimum is 875591334
    massScale.domain([minMass, maxMass]).range([1,18]);
    linkScale.domain([minSharedParticle, maxSharedParticle]).range([2,20]);

    timeScale.domain([1,maxTime]).range([0,(maxTime-1)*nodeDistance]);
    //calculates the scale factor to fit all timesteps
    //height/26 is how far apart nodes need to be from eachother to fit
    //nodes are currently nodeDistancepx apart
    var shrink = (width/maxTime)/nodeDistance;
    //graph.attr("transform", "translate(" + [(width/2)*(1-shrink),0] + ")scale(" + (height/26)/nodeDistance + ")");
    zoom.x(timeScale).scaleExtent([shrink,(width/5)/nodeDistance]).on("zoom", zoomed);

    var yaxis = svg.select(".timeaxis").selectAll("g.timeaxisgroup")
        .data(d3.range(1, maxTime+1))
        .enter().append("g")
        .attr("class","timeaxisgroup")
        .attr("transform", function(d) {
            return "translate(" + timeScale(d) + ", 0)"; });
        
    yaxis.append("line")
        .attr("class", "timeaxisline")
        .attr("y1", -margin.top)
        .attr("y2", height+margin.top);

    yaxis.append("text")
        .attr("class", "timeaxislabel")
        .attr("y", -35)
        .attr("dx", "0.35em")
        .attr("text-anchor", "end")
        .text(function(d) { return d; });

    //CREATE HALO TREE MAPS
    //basically makes an associative array but it's called a d3.map
    //for each HaloID key, had an array of nodes with that key
    //each array will be of length one
    haloMap = d3.map();
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
        tempRoot = tempNodesMap.get(tempHaloLinksMap.get(k)[0].CurrentHalo)[0];
        tempRoot.x0 = height/2;
        tempRoot.y0 = 0;

        haloMap.set(k, {root: tempRoot, nodes: tempNodesMap, links: tempLinksMap});
    });
    //default group
    //updateTree("16");
    var halo = haloMap.get("16");
    root = halo.root;
    nodesMap = halo.nodes;
    linksMap = halo.links;
    haloMassExtent = d3.extent(nodesMap.values(), function(d) { return +d[0].HaloMass; });
    haloParticleExtent = d3.extent(nodesMap.values(), function(d) { return +d[0].TotalParticles; });
	haloMassValuesCurrentHalo = [], haloParticleValuesCurrentHalo = [];
	nodesMap.values().forEach(function(d) {
		haloMassValuesCurrentHalo.push(+Math.log(d[0].HaloMass))
		haloParticleValuesCurrentHalo.push(+Math.log(d[0].TotalParticles));
	});
    update(root);
	
	//HACKY FIX
	haloMassValuesCurrentHalo.push(+31);
	haloMassValuesLog.push(+31);
    haloMassValuesCurrentHalo.push(+24);
	haloMassValuesLog.push(+24);
	
	haloParticleValuesCurrentHalo.push(+5);
	haloParticleValuesLog.push(+5);
    haloParticleValuesCurrentHalo.push(+13);
	haloParticleValuesLog.push(+13);

    x.domain([Math.log(minMass), Math.log(maxMass+ 10)]);
    xParticle.domain([Math.log(minParticle), Math.log(maxParticle + 10)]); //a bit of buffer
	
    //make buckets
    var dataBinMassAllHalos = d3.layout.histogram()
			.bins(10)(haloMassValuesLog);
		
		
	var dataBinMassCurrentHalo = d3.layout.histogram()
			.bins(10)(haloMassValuesCurrentHalo);
	
    var dataBinParticleAllHalos = d3.layout.histogram()
    	.bins(10)(haloParticleValuesLog);
		console.log(dataBinParticleAllHalos);
		
	var dataBinParticleCurrentHalo = d3.layout.histogram()
		.bins(10)(haloParticleValuesCurrentHalo);

    var finalArrayMassAllHalos = [];
    for(var i=0; i< dataBinMassAllHalos.length; i++){
    	var min = d3.min(dataBinMassAllHalos[i], function(d) { return d; });
    	finalArrayMassAllHalos[i] = {x: min, y: dataBinMassAllHalos[i].length};
    }
	
	var finalArrayMassCurrentHalo = [];
    for(var i=0; i< dataBinMassCurrentHalo.length; i++){
	//if the bucket was empty, min has a problem
	if(dataBinMassCurrentHalo[i].length!=0)
		{
    	var min = d3.min(dataBinMassCurrentHalo[i], function(d) { return d; });
    	finalArrayMassCurrentHalo[i] = {x: min, y: dataBinMassCurrentHalo[i].length};
		}
		else
		{
		finalArrayMassCurrentHalo[i] = {x: dataBinMassCurrentHalo[i], y: 0};
		}
    }
	
	
	
    var finalArrayParticleAllHalos = [];
	console.log(dataBinParticleAllHalos);
    for(var i=0; i< dataBinParticleAllHalos.length; i++){
        if(dataBinParticleAllHalos[i].length!=0)
		{
		
    	var min = d3.min(dataBinParticleAllHalos[i], function(d) { return d; });
    	finalArrayParticleAllHalos[i] = {x: min, y: dataBinParticleAllHalos[i].length};
	
		}
		else
		{
		finalArrayParticleAllHalos[i] = {x: dataBinParticleAllHalos[i], y: 0};

		}
    }
	
	console.log(finalArrayParticleAllHalos);
	
	var finalArrayParticleCurrentHalo = [];
    for(var i=0; i< dataBinParticleCurrentHalo.length; i++){
	if(dataBinParticleCurrentHalo[i].length!=0)
		{
    	var min = d3.min(dataBinParticleCurrentHalo[i], function(d) { return d; });
    	finalArrayParticleCurrentHalo[i] = {x: min, y: dataBinParticleCurrentHalo[i].length};
		}
		else{
		finalArrayParticleCurrentHalo[i] = {x: dataBinParticleCurrentHalo[i], y: 0};
		}
    }
	
    //set y domains based on bin values
    y.domain([0, d3.max(finalArrayMassAllHalos, function(d) { return d.y; })]);
    yParticle.domain([0, d3.max(finalArrayParticleAllHalos, function(d) { return d.y; })]);
    //console.log(finalArrayParticle);
    //tie context to area
    contextMass.append("path")
        .datum(finalArrayMassAllHalos)
        .attr("class", "area")
        .attr("d", area);
		
	
    		
	contextMass.append("path")
        .datum(finalArrayMassCurrentHalo)
        .attr("class", "areaTop")
        .attr("d", area);
		console.log(finalArrayParticleAllHalos);
		
    contextParticle.append("path")
        .datum(finalArrayParticleAllHalos)
        .attr("class", "area")
        .attr("d", areaParticle);
		
	contextParticle.append("path")
        .datum(finalArrayParticleCurrentHalo)
        .attr("class", "areaTop")
        .attr("d", areaParticle);
    	
    //x, y axes and calling brush
    contextMass.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + xHeight + ")") //axis position
        .call(xAxisMass);
    	  
    /*context.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
    	.style("font-size", "11px")
        .attr("x", 250)
        .attr("y", 110)
        .text("Mass");*/
    	
    contextMass.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0," + 0 + ")") //axis position
        .call(yAxisMass);

    contextMass.attr("class", "x brush")
        .call(brushMass)
        .selectAll("rect")
        .attr("height", xHeight + 10)
    	.attr("y", -6);   

   /* context.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
    	.style("font-size", "11px")
    	.attr("transform", "rotate(-90)")
        .attr("x", -15)
        .attr("y", -35)
        .text("Frequency");*/

    contextParticle.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + xHeight + ")") //axis position
        .call(xAxisParticle);
    	  
    /*contextParticle.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
    	.style("font-size", "11px")
        .attr("x", 250)
        .attr("y", 110)
        .text("Total Particle Count");*/
    	  
    contextParticle.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0," + 0 + ")") //axis position
        .call(yAxisParticle);
    	
    /*contextParticle.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
    	.style("font-size", "11px")
    	.attr("transform", "rotate(-90)")
        .attr("x", -15)
        .attr("y", -35)
        .text("Frequency");*/
    	  
    contextParticle.attr("class", "x brush")
        .call(brushParticle)
        .selectAll("rect")
        .attr("height", xHeight + 10)
    	.attr("y", -6);
});
});

function update(source) {
    // Compute the new tree layout.
    var nodes = tree.nodes(root);
    var links = tree.links(nodes);
    //console.log(nodes);
    //console.log(links)
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * nodeDistance; });

    // Update the nodes…
    var node = graph.selectAll("g.node")
        .data(nodes, function(d, i) { return d.HaloID; });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", click);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
    	.on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        .on("mouseup", tip.show);

    nodeEnter.append("path") //0 0 is center of circle
        .attr("class", "children")
        .attr("d", "M 0 0")
        .style("fill-opacity", 1e-6);

    // nodeEnter.append("text")
    //     .attr("x", function(d) { return -massScale(d.HaloMass)-5; })
    //     .attr("dy", ".35em")
    //     .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
    //     .text(function(d) { return d.HaloID; })
    //     .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", function(d) { return massScale(d.HaloMass); })
        .style("stroke", function(d) { return d.Prog=='1' ? "#D28378" : "lightsteelblue"; })
    	.style("stroke-width", "3");

    nodeUpdate.select("path.children")
        .style("fill-opacity", function(d) { return d._children ? 0.7 : 1e-6; })
        .attr("d", function(d) {
            var r = massScale(d.HaloMass)+2; //2 for stroke width
            var p = 10;
            var str = "M " + r + " -" + p + " L " + r + " " + p + " L " + (1.5*p+r) + " 0 z";
            return str;
        });
	
	// color filters based on brushes
		 var brushExtentMin = Math.exp(brushMass.extent()[0]);
	 var brushExtentMax = Math.exp(brushMass.extent()[1]);
	 
	 var brushExtentMinP = Math.exp(brushParticle.extent()[0]);
	 var brushExtentMaxP = Math.exp(brushParticle.extent()[1]);
	
	
	 counterSel = 0;
	 nodeUpdate.selectAll("circle")
        .style("fill", function(d) {
            var not_selected = "#3B3B3B";
            var selected = "#E3C937";
            if(brushMass.empty() && brushParticle.empty()) {
				 
                return not_selected;
            } else if (!brushMass.empty() && brushParticle.empty()) {
                if (d.HaloMass < brushExtentMin || d.HaloMass > brushExtentMax) {
                    return not_selected;
                }
            } else if (brushMass.empty() && !brushParticle.empty()) {
                if (d.TotalParticles < brushExtentMinP || d.TotalParticles > brushExtentMaxP) {
                    return not_selected;
                }
            } else {
                if (d.HaloMass < brushExtentMin || d.HaloMass > brushExtentMax || d.TotalParticles < brushExtentMinP || d.TotalParticles > brushExtentMaxP) {
                    return not_selected;
                }
            }
			counterSel = counterSel +1;
            return selected;
        });
		console.log(counterSel);
	
    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    //console.log(links);
    // Update the links…
    var link = graph.selectAll("path.link")
        .data(links, function(d) { return d.target.HaloID; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        });
    //console.log("here");
    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", function(d) {
            return diagonal(d);
            //return diagonal({source: nodesMap.get(d.CurrentHalo)[0], target:nodesMap.get(d.NextHalo)[0]});
        })
        .style("stroke-width", function(d) { return linkScale(+linksMap.get(d.target.HaloID)[0].sharedParticleCount); })
        .style("opacity","0.4")
        .style("stroke-linecap", "round"); //can be butt or square
    //console.log("her3e");
    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
           var o = {x: source.x, y: source.y};
           return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        //if node moved, we don't want to display tooltip
        if (d.x0 != d.x || d.y0 != d.y) {
            tip.hide();
        }
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Returns a list of all nodes under the root.
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

// Toggle children on click.
function click(d) {
    if (d3.event.defaultPrevented) {
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
    //hide tooltip for transformation (will display again if no zoom but that happens in node)
    tip.hide();
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
        }
}

function updateTree(grp) {
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
            haloMassExtent = d3.extent(nodesMap, function(k, v) { return v.HaloMass; });
            haloParticleExtent = d3.extent(nodesMap, function(k, v) { return v.TotalParticles; });

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

function brushed() {
    console.log(brushParticle.extent(), "vs", brushParticle.extent());
    //console.log(brush.empty(), "vs", brushParticle.empty());
    update(root);
}
