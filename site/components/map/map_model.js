
var MapModel = function(options) {

         this.initialize = function(options) {
            
            this.USData = []
            this.worldData = []
            this.is_us = false
            this.url = options.url
         }

         this.fetch = function(cbx) {   
            var self = this
            
               
               //check if data is cached
               if ((this.is_us && this.USData.length>0)                              
                  || (!this.is_us && this.worldData.length>0))
               {            
                  cbx()
                  return
               }               

               var url = this.url + "?project1="+this.project1+"&project2="+this.project2
               if (this.is_us) url+="&by_us_states=true"
               
               $.get(url, function(data) {                                    
                  data.splice(0, 0, ["country", ""])                                                       
                  if (self.is_us) self.USData = data
                  else self.worldData = data                        

                  cbx()
               })                           
         }

         this.getMapData = function() {                             
               return this.is_us ? this.USData : this.worldData
         }     


         this.initialize(options)
}