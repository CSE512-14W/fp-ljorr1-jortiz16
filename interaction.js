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

var i = 0, duration = 750, root, links, nodes;

var margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
};

var width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;



var force = d3.layout.force()
    .linkDistance(3)
    .charge(-120)
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
d3.csv("links.csv", function(link_data) {
    nodes = node_data;
    link_data.forEach(function (l) {
        l.target = +l.target;
        l.source = +l.source;
    });
    links = link_data;

    link = link.data(links, function(d) { return d.i; })
    link.exit().remove();
    link.enter().insert("line", ".node")
        .attr("class", "link");
    node = node.data(nodes, function(d) { return d.i; })
        .style("fill", color);
    node.exit().remove();
    node.enter().append("circle")
        .attr("class", "node")
        .attr("r", function(d) { return 3; })
        .style("fill", color)
        .on("click", click)
        .call(force.drag);
  
    force.nodes(nodes).links(links).start();
});
});

function tick(e) {

var y_max = d3.max(nodes, function(d) { return d.Timestep; });

var y = d3.scale.linear()
    .domain([1, y_max])
    .range([0, height-50]);

var x = d3.scale.linear()
    .domain([0, 100])
    .range([0, width-50]);

var target_axis_position = x(50);

var adjust_y = function(d) {
    return y(d.Timestep);
};

var adjust_x = function(d) {
    // if (d.Timestep == '1') {
    //     return x(50);
    // }
    return d.x;
};

force.on("tick", function () {
    link.attr("x1", function (d) {
        return adjust_x(d.source);
    })
    .attr("y1", function (d) {
        return adjust_y(d.source);
    })
    .attr("x2", function (d) {
        return adjust_x(d.target);
    })
    .attr("y2", function (d) {
        return adjust_y(d.target);
    });

    node.attr("cx", function (d) {
        return adjust_x(d);
    })
    .attr("cy", function (d) {
        return adjust_y(d);
    });
});

    /*var k = 0.5 * e.alpha; 
    nodes.forEach(function(d) { 
        d.cy = ((27 - d.Timestep) * 100) * k; 
    });
    //console.log(links);
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });*/
}
 
// Toggle children on click.
function click(d) {
    //console.log(d);
    if (d3.event.defaultPrevented) return;
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    //console.log(d);
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
