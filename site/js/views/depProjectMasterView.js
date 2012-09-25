
window.DepProjectMasterView = Backbone.View.extend({

     events: {        
            "click #byDependsOn": "setDependsOn",
            "click #byDependantBy": "setDependantBy"
        },

    initialize: function(options) {                                   
        var self = this
        
        self.isLoaded = false    
        this.projectName = options.projectName;
        this.isLoadedDependsOn = false
        this.isLoadedDependantBy = false
        this.depProjectsList = new PagedList(null, 
            { "model": DepProject
            , "url": "/projects/" + options.projectName + "/dep_projects"
            , "page_size": 7})           

        this.depProjectsListView = new DepProjectListView({model: this.depProjectsList})

        this.isLoaded = false                            
    },
        
    render:function () {
        var self = this 

        if (!this.isLoaded) {
            $(this.el).html(this.template())            
            this.setDependsOn()  
            this.isLoaded = true
        }                

        return this
    },

    setDependsOn: function(e) {
        var self = this

        if (e) utils.reportVisit("/project/" + self.projectName + "/dependencies/depends_on")
        $("#depends-on-graph", this.el).show()
        $("#dependant-by-list", this.el).hide()        

        this.flipLinks("depends-on")

        if (!this.isLoadedDependsOn) {
           $("#loading", this.el).show()
           this.drawVisualization()
           this.isLoadedDependsOn = true
        }
        return false;
    },

    drawVisualization: function() {
        
        var self = this

        url = "/projects/"+this.projectName+"/depends_on"
        $.get(url, function(data) {  
            var dataj = JSON.parse(data)
            $("#loading", self.el).hide()
            
            if (dataj.length==0) {
                $("#wrapper", self.el).hide()
                $("#noDepends", self.el).show()
            }
            else {
                $("#noDepends", self.el).hide()
                $("#wrapper", self.el).show()
            }

            self.drawVisualizationInternal(dataj)   
        })

    },

    drawVisualizationInternal: function(links) {

        var self = this

        var nodes = {};

        // Compute the distinct nodes from the links.
        links.forEach(function(link) {
          link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
          link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
        });

        var w = 958,
            h = 500;

        var force = d3.layout.force()
            .nodes(d3.values(nodes))            
            .links(links)
            .size([w, h])
            .linkDistance(60)
            .charge(-450)
            .on("tick", tick)
            .start();

        var svg = d3.select("#wrapper", this.el).append("svg:svg")
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
            .style("fill", function(d, i) {return d.name==self.projectName?"#4E803B":"#aaa"})
            .call(force.drag);
        
        var text = svg.append("svg:g").selectAll("g")
            .data(force.nodes())
          .enter().append("svg:g");

        var links = text.append("a").attr("xlink:href", "http://www.google.com/");

        // A copy of the text with a thick white stroke for legibility.
        links.append("svg:text")
            .attr("x", 8)
            .attr("y", ".31em")
            .attr("class", "shadow")
            .text(function(d) { return d.name; })
            //.on("click", function() {alert(1)})

        links.append("svg:text")
            .attr("x", 8)
            .attr("y", ".31em")
            .text(function(d) { return d.name; })
            //.on("click", function() {alert(2)})

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

    setDependantBy: function(e) {
        
        var self = this
        
        if (e) utils.reportVisit("/project/" + self.projectName + "/dependencies/dependant_by")

        $("#depends-on-graph", this.el).hide()
        $("#dependant-by-list", this.el).show()        

        this.flipLinks("dependant-by")    
        
        if (!this.isLoadedDependantBy) {           
           $('#dependant-by-list', self.el).html(self.depProjectsListView.el);
           this.depProjectsList.fetch({success: function(data) {
            
           }})
           this.isLoadedDependantBy = true

        }

        this.depProjectsListView.trackScroll(true)        

        return false;
    },

     flipLinks: function(name) {
        var buttons = ["depends-on", "dependant-by"]
        var icons = ["edit", "share"]
        for (i in buttons) {
            var current = buttons[i]
            var selected = (current==name) 
            $("#li_" + current, this.el).attr("class", selected?"active":"")
            $("#icon_"+current, this.el).attr("class", "icon-"+icons[i]+(selected?" icon-white":""))
        }
    },

    close: function() {
        this.depProjectsListView.close()
    },

    trackScroll: function(shouldTrack) {        
        this.depProjectsListView.trackScroll(shouldTrack)
    }

})