

window.DependsView = BaseView.extend({

    initialize: function (options) {
       this.title="Shared Dependencies"
       this.help = "This map shows which dependencies both projecst share"       
       BaseView.prototype.initialize.call(this, options)
    },

    showData: function (data, cbx) {              
      this.drawVisualizationInternal(data)
      cbx()
    },

   drawVisualizationInternal: function(links) {
      
      var self = this

      var nodes = {};

      // Compute the distinct nodes from the links.
      links.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
      });

      if (!nodes[this.project1]) nodes[this.project1] = {name: this.project1}
      if (!nodes[this.project2]) nodes[this.project2] = {name: this.project2}

      var w = 600,
          h = Math.min(600, 200 + links.length*12)

      var force = d3.layout.force()
          .nodes(d3.values(nodes))            
          .links(links)
          .size([w, h])
          .linkDistance(60)
          .charge(-450)
          .on("tick", tick)
          .start();

      var root = $("#diagram", this.el)[0]
      
      var svg = d3.select(root).append("svg:svg")
          .attr("width", w)
          .attr("height", h);

      // Per-type markers, as they don't inherit styles.
      svg.append("svg:defs").selectAll("marker")
          .data(["depends_on"])
        .enter().append("svg:marker")
          .attr("id", String)
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 15)
          .attr("refY", -1.5)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
        .append("svg:path")
          .attr("d", "M0,-5L10,0L0,5");

      var path = svg.append("svg:g").selectAll("path")
          .data(force.links())
        .enter().append("svg:path")
          .attr("class", function(d) { return "link " + d.type; })
          .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });      

      var circle = svg.append("svg:g").selectAll("circle")
          .data(force.nodes())
        .enter().append("svg:circle")
          .attr("r", 6)                        
          .attr("class", "directed")
          .style("fill", function(d, i) {
            if (d.name==self.project1) return "red"
            else if (d.name==self.project2) return "blue"
            return "#aaa"
          })
          .call(force.drag);
      
      var text = svg.append("svg:g").selectAll("g")
          .data(force.nodes())
        .enter().append("svg:g");

      //var links = text.append("a").attr("xlink:href", "http://www.google.com/");

      // A copy of the text with a thick white stroke for legibility.
      text.append("svg:text")
          .attr("x", 8)
          .attr("y", ".31em")
          .attr("class", "shadow")
          .text(function(d) { return d.name; })
          
      
      text.append("svg:text")
          .attr("x", 8)
          .attr("y", ".31em")
          .text(function(d) { return d.name; })
          


      // Use elliptical arc path segments to doubly-encode directionality.
      function tick() {
        path.attr("d", function(d) {
          var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
        });
       

        circle.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

        text.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
      }
  },


});