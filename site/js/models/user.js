window.User = Backbone.Model.extend({
	
	urlRoot:"/users",        

    defaults: {    
    	"login": "",
    	"full_name": "",
    	"blog": "",
    	"company": "",
    	"bio": "",    	
    	"location": "",
    	"gravatar_id": ""	
  	}
});