var utils = require('./utils')
var inj = require('./injection')
var neo4j = require('neo4j');
var config = require('../common/config')
var db = utils.db
var async = require('async')

exports.index = function(req, res, _) {
  console.log("startGetSimilarProjects")
  var key = "similar_projects_" + req.params.project
  console.log(key)
  utils.handleRequestCache(res, req, key, getSimilarProjects, _)
}

function getSimilarProjects(req, cbx, _) {	        
  prj_name = inj.sanitizeString(req.params.project)
  var node = db.getIndexedNodes('node_auto_index', 'name', prj_name, _)[0]  
  var min_threashold = node.data.rating>0.02? 0.02 : 0.002  

  var projects = []

  var qry = "START n=node:node_auto_index(name=\""+prj_name+"\") MATCH (n)<-[:watches]-(y) WITH n as n, count(distinct y) as project_watchers\n" +
     "MATCH (n)<-[:watches]-(y) with DISTINCT y as y, project_watchers as project_watchers\n" +
     "MATCH (y)-[:watches]->(x) with x as x, count(*) as local_num_watchers, project_watchers as project_watchers WHERE HAS(x.rating)\n" +
     "with x as x, local_num_watchers/project_watchers*100 as local_rating, x.rating as global_rating\n" +
     "with x as x, global_rating as global_rating, local_rating/global_rating as delta \n" +
     "where x.name<>'"+prj_name+"' and global_rating>" + min_threashold + " return x.name as name, x.description as description, ID(x) as id, delta order by delta desc limit 4"   

  var startMain = utils.startTiming()      
  db.query(qry, function (err, results) {      
    if (err) console.log(err)        
    if (results) {
      utils.endTiming(startMain, "getSimilarProjects main query")
      var startLoop = utils.startTiming()      

      async.forEach(results, function(item, callback) {
         var similar_project =
              { "name": item.name
              , "description": item.description ? item.description : ""
              , "id": item.id
              , "count": item.count
              }

          //fetch users per project    
          utils.getProjectUsers(item.id, 4, function(err, users) {   
            similar_project.users = users 
            projects.push(similar_project)             
            callback()
          })
        }, function(error) {
          utils.endTiming(startLoop, "getSimilarProjects loop")
          cbx(error, JSON.stringify(projects))
      })
    }
  })
}
