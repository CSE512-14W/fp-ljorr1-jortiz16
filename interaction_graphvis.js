
var margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
};

var width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


d3.csv("nodes.csv", function(node_data) {
d3.csv("links.csv", function(links) {
    

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

      });
});
