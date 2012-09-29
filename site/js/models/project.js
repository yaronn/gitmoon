window.Project = Backbone.Model.extend({

    urlRoot:"/projects",

    url: function() {return this.urlRoot + '/' + this.id + '?' + this.query},

    idAttribute: 'name',
    
    query: "include_stat=true",

    defaults: {    	
    	repository: "",    	
    	description: "",
    	forks:0,
      users: []
  },
 
});