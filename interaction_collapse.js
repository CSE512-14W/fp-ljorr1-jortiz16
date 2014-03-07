
    
var doc = document.documentElement;
var leftPanelWidth = 450;
var margin = {top: 20, right: 20, bottom: 20, left: 20},
width = doc.clientWidth - margin.right - margin.left - leftPanelWidth,
height = doc.clientHeight - margin.top - margin.bottom - 100;//400 for search bar

d3.select("#header").style("width", doc.clientWidth+"px");
d3.select("#header").style("height", 80+"px");
d3.select("#windowDiv").style("width", doc.clientWidth+"px");
d3.select("#leftPanel").style("height", height+"px");
var i = 0,
duration = 600,
root;

var nodesMap, linksMap;

var zoom = d3.behavior.zoom().on("zoom", zoomed);

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.x, d.y]; });

//know that maximum halo mass is 83751473296264 and minimum is 875591334
var massScale = d3.scale.log().domain([875591334,835751473296264]).range([1,18]);

var svg = d3.select("#svgContent")
    .style("width", width)
    .style("height", height)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    //.attr("pointer-events", "all")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom)
    .on("dblclick.zoom", null);

var infoBox = d3.select("#leftPanel");
	
var textBox0 = infoBox.append("div").append("text")
    .attr("x", 950)
    .attr("y", 320)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .style("font", "300 20px Helvetica Neue")
	.style("font-size", "25px")
	.style("font-weight", "bold")
    .text("Halo Properties");
	
var textBox = infoBox.append("div").append("text")
    .attr("x", 950)
    .attr("y", 350)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .style("font", "300 20px Helvetica Neue")
    .text("Hover over a node to see halo properties");

var textBox2 = infoBox.append("div").append("text")
    .attr("x", 950)
    .attr("y", 375)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .style("font", "300 20px Helvetica Neue")
    .text("");
	
var textBox3 = infoBox.append("div").append("text")
    .attr("x", 950)
    .attr("y", 400)
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
    .style("font", "300 20px Helvetica Neue")
    .text("");

svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("stroke", "black")
    .attr("fill", "white");

var graph = svg.append("g");

d3.csv("links.csv", function(error1, raw_links) {
d3.csv("nodes.csv", function(error2, raw_nodes) {
    //basically makes an associative array but it's called a d3.map
    //for each HaloID key, had an array of nodes with that key
    //each array will be of length one
    nodesMap = d3.nest().key(function(d) { return d.HaloID; }).map(raw_nodes, d3.map);

    //since tree, each ancestor node will only have one descendant
    linksMap = d3.nest().key(function(d) { return d.NextHalo; }).map(raw_links, d3.map);
    // linksMap.forEach(function(k, v) {
    //     //if bad link
    //     if (v.length > 1) {
    //         for (var i = 0; i < v.length; i++) {
    //             v[i].NextHalo = k+'_'+i;
    //             linksMap.set(k+'_'+i,[v[i]]);
    //             nodesMap.set(k+'_'+i,nodesMap.get(k));
    //         };
    //         linksMap.remove(k);
    //         nodesMap.remove(k);
    //     }
    // });
    // var badLinks = linksMap.values().filter(function(d) { return d.length > 1; });
    //console.log(nodesMap);
    
    //console.log(linksMap);
    raw_links.forEach(function(link) {
        //console.log(link);
        //nodesMap array for each key has only one element
        var parent = nodesMap.get(link.CurrentHalo)[0];
        var child = nodesMap.get(link.NextHalo)[0];
        if (parent.children) {
            parent.children.push(child);
        } else {
            parent.children = [child];
        }
    });
    root = nodesMap.get(raw_links[0].CurrentHalo)[0];
    //console.log(root);
    links = raw_links;
    //console.log(root);
    root.x0 = width / 2;
    root.y0 = 0;

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }
    //root.children.forEach(collapse);
    update(root);
});
});

function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root);
    var links = tree.links(nodes);
    console.log(nodes);
    console.log(links)
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 150; });

    // Update the nodes…
    var node = graph.selectAll("g.node")
    .data(nodes, function(d, i) { return d.HaloID+i; });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
    .on("click", click);

    nodeEnter.append("circle")
    .attr("r", 1e-6)
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
    .style("stroke", function(d) { return (d.Prog==1) ? "red" : "lightsteelblue"; })
	.on("mouseover", function(d) {updateBox(d);});

    nodeEnter.append("text")
    .attr("x", function(d) { return -massScale(d.HaloMass)-5; })
    .attr("dy", ".35em")
    .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
    .text(function(d) { return d.HaloID; })
	.style("font-size", "20px")
    .style("fill-opacity", 1e-6)
	;

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    nodeUpdate.select("circle")
    .attr("r", function(d) { return massScale(d.HaloMass); })
	
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
    .style("stroke", function(d) { return d.Prog=='1' ? "red" : "lightsteelblue"; })
	.style("stroke-width", "2");
	

    nodeUpdate.select("text")
    .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
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
        //console.log(d);
        return diagonal(d);
        //return diagonal({source: nodesMap.get(d.CurrentHalo)[0], target:nodesMap.get(d.NextHalo)[0]});
    });
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
        d.x0 = d.x;
        d.y0 = d.y;
    });

}

function updateBox(d)
{
//update the text box
   //textBox.text("");
   textBox.html("Halo Grp: " + d.GrpID);
   textBox2.html("Halo Mass: " + d.HaloMass);
   textBox3.html("Halo Particle Count: " + d.TotalParticles);
   //textBox.append("Halo Mass " + d.HaloMass);
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
    graph.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}