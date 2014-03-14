//FOR DEMO
var roots = ["15","16"];
var rootIndex = 1;

//REAL STUFF
var doc = document.documentElement;
var clientWidth = Math.min(doc.clientWidth, 1600);
var clientHeight = doc.clientHeight;
//global replace all non-digits with nothing to get the height number
// var leftPanelHeight = document.getElementById("leftPanel").style.height;
// leftPanelHeight = +leftPanelHeight.replace(/\D/g,"");
var margin = {top: 60, right: 20, bottom: 20, left: 20},
width = clientWidth - margin.right - margin.left,
height = clientHeight - margin.top - margin.bottom - clientHeight/6 - 120; //leftPanelHeight, header, buttons, and padding for header
//console.log(clientHeight);
d3.select("#leftPanel").style("height", clientHeight/6+"px")
d3.select("#header").style("width", clientWidth+"px");
d3.select("#windowDiv").style("width", clientWidth+"px");
d3.select("#table").style("width", clientWidth+"px");
//d3.select("#windowDiv").style("height", (clientHeight-60)+"px");

//******************************SET UP SVG GRAPH WINDOW
var i = 0,
duration = 600,root;

var haloMap, nodesMap, linksMap;

var maxMass = 0, minMass, maxParticle = 0, minParticle;

var maxTime = 0;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var nodeDistance;
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
    .attr("height", height + margin.top + margin.bottom);

svg.append("g")
    .attr("class","timeaxislabel")
    .append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", margin.top - margin.bottom);

svg = svg.insert("g",".timeaxislabel")
    .call(zoom)
    .on("dblclick.zoom", null);
	
svg.call(tip);

svg.append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + 2*margin.bottom)
    .attr("transform", "translate(" + 0 + "," + (margin.top-margin.bottom) + ")");

//just for margin barriers, can remove
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
//scales for both charts
var xHeight = clientHeight/6-70; //used for various sections of the graph/areas
var	x = d3.scale.linear().range([0, clientWidth/3-100]);
var	y = d3.scale.linear().range([xHeight, 0]);
var	xParticle = d3.scale.linear().range([0, clientWidth/3-100]);
var	yParticle = d3.scale.linear().range([xHeight, 0]);

//axes formatting
var exponentFormat = function (x) {return x.toExponential(1);};
var kformat = d3.format(".1s");

var	xAxisMass = d3.svg.axis().scale(x).orient("bottom").ticks(10).tickFormat(function(d) { return exponentFormat(Math.exp(d)); });
var	yAxisMass = d3.svg.axis().scale(y).orient("left").ticks(5);

var xAxisParticle = d3.svg.axis().scale(xParticle).orient("bottom").tickFormat(function(d) { return kformat(Math.exp(d)); });
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
    .attr("width", clientWidth/3) //width a bit more b/c of text
    .attr("height", clientHeight/6);
var svgBrushParticle = d3.select("#particlePanel").append("svg")
    .attr("width", clientWidth/3) //width a bit more b/c of text
    .attr("height", clientHeight/6);
	
//transform position to brush 
var contextMass = svgBrushMass.append("g")
    .attr("transform", "translate(" + 70 + "," + 10 + ")"); //staring position
	
var contextParticle = svgBrushParticle.append("g")
    .attr("transform", "translate(" + 70 + "," + 10 + ")"); //staring position


//******************************LOAD DATA
d3.csv("links2.csv", function(error1, raw_links) {
d3.csv("nodes2.csv", function(error2, raw_nodes) {

    //CREATE DATA DEPENDENT VARIABLES
    var maxSharedParticle = 0, minSharedParticle;
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

    //scale to fit all timesteps
    nodeDistance = width/maxTime

    massScale.domain([minMass, maxMass]).range([2,12]);
    linkScale.domain([minSharedParticle, maxSharedParticle]).range([2,12]);

    timeScale.domain([1,maxTime]).range([0,(maxTime-1)*nodeDistance]);
    //calculates the max scale factor
    zoom.x(timeScale).scaleExtent([1,(width/5)/nodeDistance]).on("zoom", zoomed);

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
        .call(xAxisMass);
    	  
    contextMass.append("text")
        .attr("class", "brushxlabel")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", clientWidth/6-35)
        .attr("y", clientHeight/6-30)
        .text("Mass");
    	
    contextMass.append("g")
        .attr("class", "brushyaxis")
        .attr("transform", "translate(0," + 0 + ")") //axis position
        .call(yAxisMass);

    contextMass.attr("class", "xbrush")
        .call(brushMass)
        .selectAll("rect")
        .attr("height", xHeight + 10)
    	.attr("y", -6);   

    contextMass.append("text")
        .attr("class", "brushylabel")
        .attr("text-anchor", "middle")
    	.attr("transform", "rotate(-90)")
        .attr("x", -xHeight/2)
        .attr("y", -45)
        .text("Frequency");

    contextParticle.append("g")
        .attr("class", "brushxaxis")
        .attr("transform", "translate(0," + xHeight + ")") //axis position
        .call(xAxisParticle);
    	  
    contextParticle.append("text")
        .attr("class", "brushxlabel")
        .attr("text-anchor", "middle")
    	//.style("font-size", "20px")
        .attr("x", clientWidth/6-35)
        .attr("y", clientHeight/6-30)
        .text("Total Particle Count");
    	  
    contextParticle.append("g")
        .attr("class", "brushyaxis")
        .attr("transform", "translate(0," + 0 + ")") //axis position
        .call(yAxisParticle);
    	
    contextParticle.append("text")
        .attr("class", "brushylabel")
        .attr("text-anchor", "middle")
    	//.style("font-size", "20px")
    	.attr("transform", "rotate(-90)")
        .attr("x", -xHeight/2)
        .attr("y", -45)
        .text("Frequency");
    	  
    contextParticle.attr("class", "xbrush")
        .call(brushParticle)
        .selectAll("rect")
        .attr("height", xHeight + 10)
    	.attr("y", -6);

    update(root);
    //start at zoomed out state
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
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });

    nodeEnter.append("circle")
        .attr("class", "shadow")
        .attr("r", 1e-6)
        //.on("mouseover", tip.show)
        .on("mouseout", function(d) { 
            tip.hide(d);
            tooltipShown = false;
        })
        .on("mouseup", function(d) { nodeMouseDown = false; })
        .on("mousedown", function(d) { nodeMouseDown = true; })
        .on("mousemove", function(d) { 
            if (!nodeMouseDown && !tooltipShown) {
                tip.show(d);
                tooltipShown = true;
            }
        })
        .on("click", click);

    nodeEnter.append("circle")
        .attr("class", "visible")
        .attr("r", 1e-6);

    nodeEnter.append("path") //0 0 is center of circle
        .attr("class", "children")
        .attr("d", "M 0 0")
        .style("fill-opacity", 1e-6);

    //transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle.visible")
        .attr("r", function(d) { return massScale(d.HaloMass); })
        .style("stroke", function(d) { return d.Prog=='1' ? "#D44848" : "lightsteelblue"; })
    	.style("stroke-width", "2");

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


    counterSel = 0;
    nodeUpdate.selectAll("circle.visible")
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
    //console.log(counterSel);

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
            tip.hide();
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
        d3.select(".timeaxislabel").selectAll("g.timeaxisgroup")
            .attr("transform", function(d) {
                return "translate(" + timeScale(d) + ", 0)";
            });
        }
}

function changeTree() {
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
            rootIndex = (rootIndex+1)%2;
            var halo = haloMap.get(roots[rootIndex]);
            root = halo.root;
            nodesMap = halo.nodes;
            linksMap = halo.links;
            changeGraph();
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

    console.log(dataBinMassCurrentHalo);

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

function brushed() {
    var oldDuration = duration;
    //set duration to 0 so the color change is automatic
    duration = 0;
    update(root);
    duration = oldDuration;
}
