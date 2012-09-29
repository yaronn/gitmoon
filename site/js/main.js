
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
        "compare": "compare"
    },

    initialize: function () {    
        this.headerView = new HeaderView();                                
        $('.header').html(this.headerView.render().el);     
    },

    home: function () {
       this.homeView = new HomeView();       
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

    compare: function() {      
      this.compareView = new CompareView()
      window.controller.showView(this.compareView, $("#content"))
    }

});

function startApp() {
    app = new Router();
    Backbone.history.start();
};


templateLoader.load(["HomeView", "HeaderView", "ProjectMasterView", "ProjectListView", 
                     "ProjectListItemView", "ProjectView", "ProjectUserListView",
                     "ProjectUserListItemView", "DepProjectListView", 
                     "DepProjectListItemView", "SampleCodeListView", "SampleCodeListItemView",
                     "SimilarProjectListItemView", "SimilarProjectListView", "ProjectUsersMasterView",
                     "SampleCodeMasterView", ["ListViewItemView", "../components/listview/"], 
                     ["ListViewView", "../components/listview/"], "DepProjectMasterView",
                     ["CompareView", "../compare/"],["DiagramView", "../compare/"],
                     ["MapView", "../components/map/"]],
    function () {
            $('#wait').css("display", "none")            
            app = new Router();            
            Backbone.history.start();                   
    });
