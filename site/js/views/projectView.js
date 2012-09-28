
window.ProjectView = Backbone.View.extend({
    
    events: {
      "show #myTab": "changeTab",          
    },

    changeTab: function(e) { 
      this.projectUsersMasterView.trackScroll(false)
      this.depProjectMasterView.trackScroll(false)      
      this.sampleCodeMasterView.trackScroll(false)

      fragmant = '/project/' + this.model.get("name") + '/'
      if (e.target.href.indexOf('users')!=-1) {        
        utils.reportVisit(fragmant + "users")
      }
      else if (e.target.href.indexOf('projects')!=-1) {
        $("#dep-projects-tab", this.el).html(this.depProjectMasterView.el);
        this.depProjectMasterView.render()
        utils.reportVisit(fragmant + "projects")
      }
      else if (e.target.href.indexOf('code')!=-1) {
        $("#sample-code-tab", this.el).html(this.sampleCodeMasterView.el);
        this.sampleCodeMasterView.render()
        utils.reportVisit(fragmant + "code")
      }
      else if (e.target.href.indexOf('general')!=-1) {        
        this.activateGeneralTab()
        utils.reportVisit(fragmant + "general")
      }
    },    

    activateGeneralTab: function() {
      var self = this

      this.similarProjectList = new PagedList(null, 
        {model: SimilarProject
        , "url": "/projects/" + this.model.get("name") + "/similar_projects"
        , "page_size": 20})

      this.similarProjectsListView = new SimilarProjectListView({model: this.similarProjectList })
      this.similarProjectList.fetch()

      $("#similar-projects", this.el).html(this.similarProjectsListView.el)
      
      window.setTimeout(function() {
          self.drawDepends(self, "direct_deps", "total_deps", 
                          "#depends", "Dependent Projects", 
                          "projects can depend on this project directly or depend on one of its dependencies (network)")
          }, 0)

      window.setTimeout(function() {
          self.drawDepends(self, "direct_watch", "total_watch", 
                          "#watches", "Github Stars", 
                          "users can star this project directly or star one of its dependencies (network)")
          }, 0)

      window.setTimeout(function() {
          self.drawDepends(self, "forks", "total_forks", 
                          "#forks", "Forks", 
                          "forks can be for this project or for its dependencies (network)")
          }, 0)

    },

    initialize: function() {
      var self = this
                        
      this.depProjectMasterView = new DepProjectMasterView({projectName: this.model.get("name")})                        
      this.projectUsersMasterView = new ProjectUsersMasterView({projectName: this.model.get("name")})                        
      this.sampleCodeMasterView = new SampleCodeMasterView({projectName: this.model.get("name")})                        

    },

    close: function() {            
        this.unbind(); 
        this.depProjectMasterView.close()
        this.projectUsersMasterView.close()
        this.sampleCodeMasterView.close()
        this.similarProjectsListView.close()
    },

    render: function () {            

        $(this.el).html(this.template(this.model.toJSON()));            
        var url = encodeURIComponent(window.location.href)        
        var url_no_hash = encodeURIComponent(window.location.href.replace(/#/g, "?"))        
        var text = "Check out " + this.model.get("name")      
                      
        $("#user-tab", this.el).html(this.projectUsersMasterView.el);        
        this.projectUsersMasterView.render()
          
        $('#myTab a[href="#users"]', this.el).text("Users ("+this.model.get("total_watch")+")")        
        $('#myTab a[href="#projects"]', this.el).text("Projects ("+this.model.get("total_deps")+")")              
      
        return this;
    },

    drawDepends: function (self, direct_name, network_name,
                            container_name, title, help) {   

      var direct = self.model.get(direct_name)
      var total = self.model.get(network_name)
      var network = total - direct

            
      $(container_name+"Title", this.el).text( title + ' (' + total + ')')      
      $(container_name+"Help", this.el).attr("title", help)
      $(container_name+"Help", this.el).tooltip()      

      var data = google.visualization.arrayToDataTable([
        ['', 'direct (' + direct + ')', 'network (' + network + ')'],
        ['',  direct, network]
      ])
      
      new google.visualization.BarChart($(container_name, self.el).get()[0]).
          draw(data,
               {isStacked: true, //title: title + ' (' + total + ')',
                 width:300, height:127,
                 fontSize: "13",
                bar: {groupWidth: 15},
                backgroundColor: 'transparent',
                chartArea:{left:0,top:20,width:"60%",height:"52%"},
                vAxis: {title: ""},
                hAxis: {title: ""}}
          )
  }

})


