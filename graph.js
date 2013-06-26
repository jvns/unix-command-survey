function random_node() {
  var i = Math.round(Math.random() * complete_graph.nodes.length)
  var node = complete_graph.nodes[i];
  return node.name;
}

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

function subset(node_list, node_names) {
  var new_nodes = [];
  for (var i = 0; i < node_list.length; i++) {
       var node = node_list[i];
       if (node_names[node.name] === 1) {
           new_nodes.push(node);
       }
  }
  return new_nodes;
}

function subgraph_neighborhood(graph, centre, degree) {
    var nodes = neighborhood(graph, centre, degree);
    var new_links = [];
    var new_nodes = subset(graph.nodes, nodes);
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
    var new_nodes = [];
    var node_names = {};
    for (var i = 0; i < graph.links.length; i++) {
      var link = graph.links[i];
      if (link.value >= min_correlation) {
        new_links.push(link);
        node_names[link.source.name] = 1;
        node_names[link.target.name] = 1;
      }
    }

    var new_nodes = subset(graph.nodes, node_names);
    return {
      "nodes": new_nodes,
      "links": new_links
    };
}

function find_components(graph) {
  var components = [];
  for (var i = 0; i < graph.links.length; i++) {
    var link = graph.links[j];
    var found = false;
    for (var j = 0; j < components.length; j++) {
      var component = component[j];
      if (component[link.source.name] == 1) {
          component[link.target.name] = 1;
          found = true;
      } else if (component[link.target.name == 1]) {
          component[link.source.name] = 1;
          found = true;
      } 
    }
    if (found == false) {
        var new_component = {};
        new_component[link.source.name] = 1;
        new_component[link.target.name] = 1;
        components.push(new_component);
    }
  }
  return components;
}

function set_component_ids(graph) {
  var components = find_components(graph);
  for (var i = 0; i < components.length; i++) {

  }
}

function display_graph(graph, zoom) {
  var node_size = 16 * zoom, 
      node_text_size = 8 * zoom + "px";
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
    .enter()
      .append("g")
      .attr("class", "node")
      .call(force.drag);

  node.append("circle")
      .attr("r", node_size)
      .style("fill", function(d) { return color(d.group); });

  node.append("text")
      .text(function(d) {return d.name.substr(0, 5)})
      .style("fill", "white")
      .style("text-anchor", "middle")
      .style("font-size", node_text_size)
      .style("font-family", "monospace");

  node.on('mousedown', function(d) {
    console.log("double click!");
    var params = {center: d.name, degree: 2};
    console.log(params);
    reload(params);
  });

  node.on('mouseover', function() {
    d3.select(this)
      .select('circle')
      .style('stroke-width', 2)
      .style('z-index', 5)
      .style('stroke', '#333')
      .attr("r", function(d) {
          var len = d.name.length;
          return Math.max(node_size * 1.2, node_size * len / 5);
      });

    d3.select(this)
      .select('text')
      .text(function(d) {return d.name});
  })

  node.on('mouseout', function() {
    d3.select(this)
      .select('circle')
      .style('stroke-width', 0)
      .attr("r", node_size);

    d3.select(this)
      .select('text')
      .text(function(d) {return d.name.substr(0, 5)});
  
  })

  // node.append("title")
  //     .text(function(d) { return d.name; });
  // text.append("title")
  //     .text(function(d) { return d.name; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.selectAll('circle')
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    node.selectAll('text')
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y + 5; });
  });

}