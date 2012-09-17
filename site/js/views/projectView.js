
window.ProjectView = Backbone.View.extend({
    
    events: {
      "show #myTab": "changeTab",          
    },

    changeTab: function(e) { 
      this.depProjectsListView.trackScroll(false)
      this.projectUserListView.trackScroll(false)
      this.sampleCodeMasterView.trackScroll(false)

      if (e.target.href.indexOf('users')!=-1) this.changeTabHelper("projectUser")
      if (e.target.href.indexOf('projects')!=-1) this.changeTabHelper("depProjects")
      if (e.target.href.indexOf('code')!=-1) this.sampleCodeMasterView.tabVisible()
    },

    changeTabHelper: function(name) {
      var listView = this[name + 'ListView']
      var list = this[name + 'List']
      listView.trackScroll(true)
        if (!this[name + 'Loaded']) {
         list.fetch()
         this[name + 'Loaded'] = true
        }
    },

    initialize: function() {                     
      var self = this
            
      this.projectUserLoaded = false
      this.depProjectsLoaded = false
      //this.sampleCodeLoaded = false
      
      this.similarProjectList = new PagedList(null, 
        {model: SimilarProject
        , "url": "/projects/" + this.model.get("name") + "/similar_projects"
        , "page_size": 20})

      this.similarProjectsListView = new SimilarProjectListView({model: this.similarProjectList })
      this.similarProjectList.fetch()

      this.depProjectsList = new PagedList(null, 
        { "model": DepProject
        , "url": "/projects/" + this.model.get("name") + "/dep_projects"
        , "page_size": 7})           

      this.depProjectsListView = new DepProjectListView({model: this.depProjectsList})            
      //this.depProjectsList.fetch()

      this.projectUserList = new PagedList(null, 
        { "model": ProjectUser
        , "url": "/projects/" + this.model.get("name") + "/users"
        , "page_size": 7})      

      this.projectUserListView = new ProjectUserListView({model: this.projectUserList})                  
      //this.projectUserList.fetch()
      

      this.sampleCodeMasterView = new SampleCodeMasterView({projectName: this.model.get("name")})                  
      //this.sampleCodeList.fetch()       

    },

    close: function() {            
        this.unbind(); 
        this.depProjectsListView.close()
        this.projectUserListView.close()
        this.sampleCodeMasterView.close()
        this.similarProjectsListView.close()
    },

    render: function () {            

        $(this.el).html(this.template(this.model.toJSON()));            
        var url = encodeURIComponent(window.location.href)        
        var url_no_hash = encodeURIComponent(window.location.href.replace(/#/g, "?"))        
        var text = "Check out " + this.model.get("name")      

        $("#tweet", this.el).attr('src',
          "//platform.twitter.com/widgets/tweet_button.html?counturl="+url_no_hash+"&url="+url_no_hash+"&text=" + 
          text)
        
        $("#like", this.el).attr('src', //$("#like", this.el).attr('src')+'')
          "//www.facebook.com/plugins/like.php?href=" + url + "&send=false&layout=button_count&width=450&show_faces=false&action=like&colorscheme=light&font&height=21")
        
        this.projectUserListView.render()
        $("#user-list", this.el).html(this.projectUserListView.el);

        this.depProjectsListView.render()
        $("#dep-projects-list", this.el).html(this.depProjectsListView.el);

        this.sampleCodeMasterView.render()
        $("#sample-code-list", this.el).html(this.sampleCodeMasterView.el);
        
        $('#myTab a[href="#users"]', this.el).text("Users ("+this.model.get("total_watch")+")")        
        $('#myTab a[href="#projects"]', this.el).text("Projects ("+this.model.get("total_deps")+")")
        
        $("#similar-projects", this.el).html(this.similarProjectsListView.el)        

        var self = this
        
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


