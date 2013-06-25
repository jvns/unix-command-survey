function parse_get_params() {
    var prmstr = window.location.search.substr(1),
        prmarr = prmstr.split ("&"),
        params = {};

    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }
    return params;
}

function set_links(graph) {
  var links = graph.links;
  var nodes = graph.nodes;
  for (i = 0; i < links.length; ++i) {
    o = links[i];
    if (typeof o.source == "number") o.source = nodes[o.source];
    if (typeof o.target == "number") o.target = nodes[o.target];
  }
}

function subgraph_neighborhood(graph, centre, degree) {
    var nodes = neighborhood(graph, centre, degree);
    var new_nodes = [];
    var new_links = [];
    for (var i = 0; i < graph.nodes.length; i++) {
        var node = graph.nodes[i];
        if (nodes[node.name] === 1) {
            new_nodes.push(node);
        }
    }

    for (var i = 0; i < graph.links.length; i++) {
      var link = graph.links[i];
      if ((nodes[link.source.name] === 1) && (nodes[link.target.name] === 1)) {
          new_links.push(link);
      }
    }
    return {
        "nodes": new_nodes,
        "links": new_links
    };
}

// wants a graph with edge names, not edge ids
function neighborhood(graph, node, degree) {
    if (degree == 1) {
        var neighbors = {};
        neighbors[node] = 1;
        for (var i = 0; i < graph.links.length; i++) {
            var link = graph.links[i];
            if (link.source.name === node) {
              neighbors[link.target.name] = 1;
            } else if (link.target.name === node) {
              neighbors[link.source.name] = 1;
            }
        }
        return neighbors;
    } else {
      var immediate_neighbors = neighborhood(graph, node, 1);
      var all_neighbors = {};
      for (neighbor in immediate_neighbors) {
          var its_neighbors = neighborhood(graph, neighbor, degree-1);
          obj_merge(all_neighbors, its_neighbors);
      }
      obj_merge(all_neighbors, immediate_neighbors);
      return all_neighbors;
    }
}
function obj_merge(obj1, obj2)  {
    for (var attrname in obj2) { 
      obj1[attrname] = obj2[attrname]; 
    }
}

function subgraph(graph, min_correlation) {
    min_correlation = +min_correlation;
    var new_links = [];
    for (var i = 0; i < graph.links.length; i++) {
      if (graph.links[i].value >= min_correlation) {
        new_links.push(graph.links[i]);
      }
    }
    return {
      "nodes": graph.nodes,
      "links": new_links
    };
}

function display_graph(graph) {
  force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

  var link = svg.selectAll(".link")
      .data(graph.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return d.value * 10; });

  var node = svg.selectAll(".node")
      .data(graph.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 15)
      .style("fill", function(d) { return color(d.group); })
      .call(force.drag);

  var text = svg.selectAll(".nodetext")
      .data(graph.nodes)
    .enter().append("text")
      .attr("class", "nodetext")
      // .attr("width", 10)
      // .attr("height", 10)
      .text(function(d) {return d.name.substr(0, 5)})
      .style("fill", "white")
      .style("text-anchor", "middle")
      .style("font-size", "8px")
      .style("font-family", "monospace")
      .call(force.drag);

  node.on('mouseover', function() {
    d3.select(this).style("r", "30")
  })
  text.on('mouseover', function() {
    d3.select(this).style("font-size", "22px")
    d3.select(this).style("font-weight", "bold")
    d3.select(this).style("fill", "black")
    d3.select(this).text(function(d) {return d.name})
  })

  node.on('mouseout', function() {
    d3.select(this).style("r", "15")
  })
  text.on('mouseout', function() {
    d3.select(this)
    .style("font-size", "8px")
    .style("fill", "white")
    .style("font-weight", "normal")
    .text(function(d) {return d.name.substr(0, 5)})
  })
    

  node.append("title")
      .text(function(d) { return d.name; });
  text.append("title")
      .text(function(d) { return d.name; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    text.attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y + 5; });
  });

}