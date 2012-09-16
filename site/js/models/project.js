window.Project = Backbone.Model.extend({

    urlRoot:"/projects",

    idAttribute: 'name',
    
    defaults: {    	
    	repository: "",    	
    	description: "",
    	forks:0
  }
});