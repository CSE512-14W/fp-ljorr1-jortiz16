
    
var doc = document.documentElement;
var clientWidth = Math.min(doc.clientWidth, 1700);
//global replace all non-digits with nothing to get the height number
var leftPanelHeight = document.getElementById("leftPanel").style.height;
leftPanelHeight = +leftPanelHeight.replace(/\D/g,"");
var margin = {top: 70, right: 20, bottom: 20, left: 20},
width = clientWidth - margin.right - margin.left,
height = doc.clientHeight - margin.top - margin.bottom - leftPanelHeight - 60; //60 for header

d3.select("#header").style("width", clientWidth+"px");
d3.select("#header").style("height", 60+"px");
d3.select("#windowDiv").style("width", clientWidth+"px");
//d3.select("#windowDiv").style("height", (doc.clientHeight-60)+"px");

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

var nodeMouseDown = false;
var tooltipShown = false;

var tip = d3.tip()
  .attr("class", "d3-tip")
  .direction("n")
  .offset([-10,0])
  .html(function(d) {
    var color = "black";
    return "Halo Group: <span style='color:" + color +"'>"  + d.GrpID + "</span><br/>" 
	      + "Halo Mass: <span style='color:" + color +"'>" + d.HaloMass + "</span><br/>" 
		  + "Total Particles: <span style='color:" + color +"'>" + d.TotalParticles + "</span><br/>"
		  + "Total Dark Particles: <span style='color:" + color +"'>" + d.TotalDarkParticles + "</span><br/>";
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
var	x = d3.scale.linear().range([0, 450]);
var	y = d3.scale.linear().range([75, 0]);
var	xParticle = d3.scale.linear().range([0, 450]);
var	yParticle = d3.scale.linear().range([75, 0]);

//axes
var exponentFormat = function (x) {return x.toExponential(1);};
var	xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10).tickFormat(function(d) { return  exponentFormat(d); });
var	yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);
var xAxisParticle = d3.svg.axis().scale(xParticle).orient("bottom").tickFormat(d3.format("s"));
var	yAxisParticle = d3.svg.axis().scale(yParticle).orient("left").ticks(5);

//areas- based on respective domains
var area = d3.svg.area()
	.interpolate("monotone")
    .x(function(d) { return x(d.x); })
    .y0(75)
    .y1(function(d) { return y(d.y); }); 
var areaParticle = d3.svg.area()
	.interpolate("monotone")
    .x(function(d) { return xParticle(d.x); })
    .y0(75)
    .y1(function(d) { return yParticle(d.y); });

//initialize brushes
var brush = d3.svg.brush()
    .x(x)
    .on("brush", brushed);
var brushParticle = d3.svg.brush()
    .x(xParticle)
    .on("brush", brushed);
	
//adding brushes to panels
var svgBrush = d3.select("#massPanel").append("svg")
    .attr("width", 550) //width a bit more b/c of text
    .attr("height", 200);
var svgBrushParticle = d3.select("#particlePanel").append("svg")
    .attr("width", 550) //width a bit more b/c of text
    .attr("height", 200);

//getter used for line 
var	valueline = d3.svg.line()
	.x(function(d) { return x(d.x); })
	.y(function(d) { return y(d.y); });
	
//transform position to brush 
var context = svgBrush.append("g")
    .attr("transform", "translate(" + 45 + "," + 10 + ")"); //staring position
	
var contextParticle = svgBrushParticle.append("g")
    .attr("transform", "translate(" + 45 + "," + 10 + ")"); //staring position


//******************************LOAD DATA
d3.csv("links2.csv", function(error1, raw_links) {
d3.csv("nodes2.csv", function(error2, raw_nodes) {

    //CREATE DATA DEPENDENT VARIABLES
    var maxMass = 0, minMass, maxParticle = 0, minParticle, maxSharedParticle = 0, minSharedParticle;
    var haloMassValues = [], haloParticleValues = [];
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
        haloParticleValues.push(+d.TotalParticles);
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
    update(root);

    x.domain([minMass, maxMass + 10]);
    xParticle.domain([minParticle, maxParticle + 10]); //a bit of buffer
    //make buckets
    var dataBin = d3.layout.histogram()
    	.bins(10)(haloMassValues);
    var dataBinParticle = d3.layout.histogram()
    	.bins(10)(haloParticleValues);

    var finalArray = [];
    for(var i=0; i< dataBin.length; i++){
    	var min = d3.min(dataBin[i], function(d) { return d; });
    	finalArray[i] = {x: min, y: dataBin[i].length};
    }
    var finalArrayParticle = [];
    for(var i=0; i< dataBinParticle.length; i++){
        var min = d3.min(dataBinParticle[i], function(d) { return d; });
        finalArrayParticle[i] = {x: min, y: dataBinParticle[i].length };
    }
    //set y domains based on bin values
    y.domain([0, d3.max(finalArray, function(d) { return d.y; })]);
    yParticle.domain([0, d3.max(finalArrayParticle, function(d) { return d.y; })]);
    //console.log(finalArrayParticle);
    //tie context to area
    context.append("path")
        .datum(finalArray)
        .attr("class", "area")
        .attr("d", area);
    		
    contextParticle.append("path")
        .datum(finalArrayParticle)
        .attr("class", "area")
        .attr("d", areaParticle);
    	
    //x, y axes and calling brush
    context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + 75 + ")") //axis position
        .call(xAxis);
    	  
    context.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
    	.style("font-size", "11px")
        .attr("x", 250)
        .attr("y", 110)
        .text("Mass");
    	
    context.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0," + 0 + ")") //axis position
        .call(yAxis);

    context.attr("class", "x brush")
        .call(brush)
        .selectAll("rect")
        .attr("height", 80)
    	.attr("y", -6);   

    context.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
    	.style("font-size", "11px")
    	.attr("transform", "rotate(-90)")
        .attr("x", -15)
        .attr("y", -35)
        .text("Frequency");

    contextParticle.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + 75 + ")") //axis position
        .call(xAxisParticle);
    	  
    contextParticle.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
    	.style("font-size", "11px")
        .attr("x", 250)
        .attr("y", 110)
        .text("Total Particle Count");
    	  
    contextParticle.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0," + 0 + ")") //axis position
        .call(yAxisParticle);
    	
    contextParticle.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
    	.style("font-size", "11px")
    	.attr("transform", "rotate(-90)")
        .attr("x", -15)
        .attr("y", -35)
        .text("Frequency");
    	  
    contextParticle.attr("class", "x brush")
        .call(brushParticle)
        .selectAll("rect")
        .attr("height", 80)
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
    	//.on("mouseover", tip.show)
        .on("mouseout", function(d) { 
            tip.hide(d);
            tooltipShown = false;
        })
        .on("mouseup", function(d) { nodeMouseDown = false; })
        .on("mousedown", function(d) { nodeMouseDown = true; })
        .on("mousemove", function(d) { 
            //console.log(nodeMouseDown, tooltipShown);
            // if (nodeMouseDown && tooltipShown) {
            //     tip.hide();
            //     tooltipShown = false;
            // } else 
            if (!nodeMouseDown && !tooltipShown) {
                tip.show(d);
                tooltipShown = true;
            }
        });

    nodeEnter.append("path") //0 0 is center of circle
        .attr("class", "children")
        .attr("d", "M 0 0")
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", function(d) { return massScale(d.HaloMass); })
        .style("stroke", function(d) { return d.Prog=='1' ? "#D44848" : "lightsteelblue"; })
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
	 nodeUpdate.selectAll("circle")
        .style("fill", function(d) {
            var not_selected = "#3B3B3B";
            var selected = "#E3C937";
            if(brush.empty() && brushParticle.empty()) {
                return not_selected;
            } else if (!brush.empty() && brushParticle.empty()) {
                if (d.HaloMass < brush.extent()[0] || d.HaloMass > brush.extent()[1]) {
                    return not_selected;
                }
            } else if (brush.empty() && !brushParticle.empty()) {
                if (d.TotalParticles < brushParticle.extent()[0] || d.TotalParticles > brushParticle.extent()[1]) {
                    return not_selected;
                }
            } else {
                if (d.HaloMass < brush.extent()[0] || d.HaloMass > brush.extent()[1] || d.TotalParticles < brushParticle.extent()[0] || d.TotalParticles > brushParticle.extent()[1]) {
                    return not_selected;
                }
            }
            return selected;
        });
	
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
        //if node moved with click, we don't want to display tooltip
        //movement via drag is handled with transform, not d.x and d.y
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
    //hide tooltip on zoom and drag; will be shown again when user moved mouse
    tip.hide();
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
    //console.log(brush.extent(), "vs", brushParticle.extent());
    //console.log(brush.empty(), "vs", brushParticle.empty());
    update(root);
}
