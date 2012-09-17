
window.Router = Backbone.Router.extend({

    routes: {
        "": "home",        
    },

    initialize: function () {    

    },

    home: function () {              
      var list = new ListViewModel(null, {model: ListItemModel, 
        url: 'http://localhost:3000/projects/async/sample_code_using_projects',
        getCountUrl: "http://localhost:3000/projects/async/sample_code/count"});

      //list.models.push(new ListItemModel({"name": "item1", "count": "1"}))
      //list.models.push(new ListItemModel({"name": "item2", "count": "2"}))
      //list.models.push(new ListItemModel({"name": "item3", "count": "3"}))
      //list.models.push(new ListItemModel({"name": "item4", "count": "4"}))

      var v = new ListViewView({model: list})

      v.bind("projectChosen", function(name) {
        alert(name)
      })

      v.bind("allProjectsChosen", function() {
        alert("all")
      })
      
      //v.render();
      list.fetch({success: function(data) {
        
      }});

      $("#root").html(v.el);  
    }
    
});

function loadTemplates(views, callback) {

        var deferreds = [];

        $.each(views, function(index, view) {
            if (window[view]) {         
                var url = '/components/listview/' + view + '.html'                                     
                deferreds.push($.get(url, function(data) {
                    window[view].prototype.template = _.template(data);
                }, 'html'));                
            } else {
                alert(view + " not found");
            }
        });

        $.when.apply(null, deferreds).done(callback);
}

loadTemplates(["ListViewItemView", "ListViewView"],
    function () {
            app = new Router();            
            Backbone.history.start();                   
    });