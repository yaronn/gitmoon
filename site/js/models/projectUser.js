window.ProjectUser = User.extend({
        
    defaults: _.extend({},User.prototype.defaults,
         {
             dependency_path: []
         }
    )

});