
function AppController() {

    //ensure .close() is called on the previous view so it detaches events
    this.showView = function(view, selector) {
      if (this.currentView){        
        this.currentView.close();
      }
      this.currentView = view;
      this.currentView.render();
      $(selector).html(this.currentView.el);
    }
}

window.controller = new AppController()

window.Router = Backbone.Router.extend({

    routes: {
        "": "home",
        "project/:id": "project",          
        "compare/": "compare",
        "compare": "compare",
        "compare/:id1/:id2": "compare"
    },

    initialize: function () {    
        this.headerView = new HeaderView();                                
        $('.header').html(this.headerView.render().el);     
    },

    home: function () {
       var options = utils.getParameterByName("start")=="h2h"?{startTab: "h2h"}:{};       
       this.homeView = new HomeView(options);       
       window.controller.showView(this.homeView, $("#content"))
    },

    project: function(name) {    
        $("#body").css("background-image", "none")
        document.title = "GitMoon - " + name                                                                 
        
        if (!this.projectMasterView) {
            this.projectMasterView = new ProjectMasterView({name: name})
            window.controller.showView(this.projectMasterView, $("#content"))            
        }
        else {
            this.projectMasterView.show({name: name})
        }
    },  

    compare: function(project1, project2) {               
      this.compareView = new CompareView()
      window.controller.showView(this.compareView, $("#content"))    
      if (project1 && project1!="" && project2 && project2!="")
        this.compareView.showProjects(project1, project2)
    }

});


/*
templateLoader.load(["HomeView", "HeaderView", "ProjectMasterView", "ProjectListView", 
                     "ProjectListItemView", "ProjectView", "ProjectUserListView",
                     "ProjectUserListItemView", "DepProjectListView", 
                     "DepProjectListItemView", "SampleCodeListView", "SampleCodeListItemView",
                     "SimilarProjectListItemView", "SimilarProjectListView", "ProjectUsersMasterView",
                     "SampleCodeMasterView", ["ListViewItemView", "../components/listview/"], 
                     ["ListViewView", "../components/listview/"], "DepProjectMasterView",
                     ["CompareView", "../compare/"],["DiagramView", "../compare/"],
                     ["MapView", "../components/map/"], ["ProjectMiniView", "../compare/"],
                     ["RandomUserView", "../compare/"],["UserView", "../compare/"],
                     ["CompanyOverlapView", "../compare/"],],
    function () {
            $('#wait').css("display", "none")            
            app = new Router();            
            Backbone.history.start();                   
    });
*/

utils.loadTemplates(function() {
    $('#wait').css("display", "none")            
    app = new Router();            
    Backbone.history.start();
})

