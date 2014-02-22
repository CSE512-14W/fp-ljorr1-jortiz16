//Parallel Coordinates Layout
/*d3.csv("small.csv", function(error, data) {
    var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    };
    var width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var color = d3.scale.category10();

    var svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var pc = d3.parcoords()("#example")
      .data(data)
      .render()
      .ticks(3)
      .createAxes();
});*/

var nodesByName = {};

var i = 0, duration = 750, root, lnk;

var margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
};

var width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var force = d3.layout.force()
    .linkDistance(10)
    .charge(-20)
    .gravity(0.05)
    .size([height, width])
    .on("tick", tick);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var link = svg.selectAll(".link");
var node = svg.selectAll(".node");

d3.csv("nodes.csv", function(node_data) {

d3.csv("links.csv", function(links) {
    lnk=links;
    // Create nodes for each unique source and target.
    links.forEach(function(link) {
        var parent = link.source = nodeByName(link.source);
        var child = link.target = nodeByName(link.target);
        if (parent.children) {
            parent.children.push(child);
        } else {
            parent.children = [child];
        }
    });

    root = links[0].source;
    root.x = 0;
    root.y = width/2;

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }
    //root.children.forEach(collapse);
    update();   
});
});
//d3.select(self.frameElement).style("height", "500px");
function update() {
    var nodes = flatten(root);
    var links = lnk;
    //nodes.forEach(function (n) { console.log(n);});
    //nodes = flatten(root);
    //links.forEach(function (n) { console.log(n);});
    //links.forEach(function (n) { console.log(n.source.name + "-" + n.target.name);});
    force.nodes(nodes).links(links).start();

    link = link.data(links, function(d) { return d.i; })
    link.exit().remove();
    link.enter().insert("line", ".node")
        .attr("class", "link")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node = node.data(nodes, function(d) { return d.i; })
        .style("fill", color);
    node.exit().remove();
    node.enter().append("circle")
      .attr("class", "node")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return 2; })
      .style("fill", color)
      .on("click", click)
      .call(force.drag);
    
    /*
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", click);

    nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", 4.5)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
    });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

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
    });*/
}

function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
}
// Toggle children on click.
function click(d) {
    console.log(d);
    if (d3.event.defaultPrevented) return;
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    console.log(d);
    update();
}

function color(d) {
    if (d.i == '0') {
        return "red";
    } else if (d._children) {
        return "#3182bd";
    } else if (d.children) {
        return "#c6dbef";
    } else {
        return "#fd8d3c";
    }
}

function nodeByName(name) {
    return nodesByName[name] || (nodesByName[name] = {i: name});
}

function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function flatten(root) {
    var nds = [], i = 0;
    function recurse(n) {
        if (n.children) {
            n.children.forEach(recurse);
        }
        nds.push(n);
    }
    recurse(root);
    return nds;
}
