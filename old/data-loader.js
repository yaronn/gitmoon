var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474')
require('date-utils')
var request = require('request').defaults({'proxy':'http://web-proxy.israel.hp.com:8080/'})


/*

var loaders = {
	'project': loadProject,
	'user': loadUser
}

var qry = 'START n=node(*)\n' +
          'WHERE n.name="ws.js" and n.last_update_date<' + getStartTimestamp() +
          'RETURN distinct n'

*/
/*

function loadProject() {
  db.query(qry, function (err, results) {   
      if (err) console.log(err)    
      if (results) {
        for (var r in results) {        
          db.getNodeById(results[r].n.id, function(err, node) {
            if (err) {
                console.error(err);
            } else {  
              console.log("working on: " + node.data.name)          
              node.data.id = node.id
              loaders[node.data.type](node)
              //node.data.last_update_date = Date.now()
              node.save(function(err) {console.log("saved " + node.data.name)})
            }
          })
        }
      }
    })
}
*/



function getStartTimestamp() {
  var _24HoursAgo = new Date().add({hours: -24})
  return Date.parse(_24HoursAgo)
}

function loadAllProjects() {  
  var ctx = {}

  async.series([ fetchNodesToUpdate(ctx)
               , handleNodes(ctx.nodes) ])

}

function handleNodes(nodes) {
  return function(callback) {    
    var ctx = {}
    async.forEach(nodes, function(cb) {
      async.series([ getNodeById(ctx)                   
                   , updateNpmDetails(ctx)
                   , downloadDependencies(ctx)
                   , handleDependencies(ctx)
                   , saveNode(ctx) ]
                   , cb)
    }
    , callback)
  }
}

function handleDependencies(ctx) {
  var myctx = {}
  return function(callback) {   
    async.forEach(ctx.dependencies, function(cb) {
      async.series([ fetchDependencyNode(myctx)
                   , creatDependencyNodeIfNotExists(myctx)
                   , ensureLink(myctx)
                   , loadIncomingLinks(myctx)
                   , deleteObsoleteLinks(myctx)])
    }, callback)
  }
}

function deleteObsoleteLinks(ctx) {
  var myctx = {}
  return function(callback) {   
      async.forEach(ctx.links, function(cb) {
         deleteLinkIfNotUsed(myctx, cb)
      }, callback)
  }
}



/*
function loadProject(proj, cbx) {
	console.log("load project " + proj.data.name)

  async.parallel([ function(callback) { fillNpmDetails(proj, callback) }
               , function(callback) { fillDependencies(proj, callback) } ], function(err, results) {
    console.log("done")
    })	
}
*/

/*
function fillDependencies(proj, cbxmain) {
  
  getUrl('http://search.npmjs.org/_view/dependencies?reduce=false&key=%22' + proj.name + '%22', function(err, res, body) {
    deps = JSON.parse(body)
    async.forEach(deps.rows, function(item, callback) {
      ensureDependency(proj, r.id, callback)
    }, function(err, restuls) {     
        deleteObsoleteLinks(proj, deps, cbxmain)
       })

     cbxmain() 
    })
  }

}

function deleteObsoleteLinks(proj, deps, cbxmain) {
  proj.incoming("depends_on", function(err, results) {  
    async.forEach(results, function(item, cbx) {
      if (findProject(deps, item.from.name) == null) item.from.del()
      cbx()
    })
    cbxmain()
  })
}

function findProject(list, proj) {
  for (var i in list) {
    if (list[i].name == proj.name) return list[i]
  }
  return null
}


function handleDependency(proj, depends_on_id, cbxmain) {
  var depends_on

  async.series([
    
    //fetch deependency
    function(cbx) {    
      db.getIndexedNode("node_auto_index", "name", depends_on_id, function(err, node) {
        if (!node) {
            //dependency does not exist, create it, set node to be new one
            depends_on = db.createNode({name: depends_on_id, type: 'project', last_update_date: 0});
            depends_on.save(function(err, restuls) { cbx() })
        }
        else {
          cbx()
          depends_on = node
        }

      })
    },
  
  //add link
  function(cbx) {
    proj.path(depends_on, "depends_on", "incoming", function(callback, restuls) {
      //no link yet - add it
      if (results==null) {
        depends_on.createRelationshipTo(proj, 'depends_on', {}, callback)}
      }
    })
  }

  ], cbxmain)

}      



function fillNpmDetails(proj, cbx) {
  getUrl('http://search.npmjs.org/api/' + proj.data.name, function(err, res, body) {
    proj.data.deleted = res.statusCode==404
    var npm = JSON.parse(body)
    proj.data.description = npm.description
    proj.data.repository = npm.repository.url
    cbx()
  })
}
*/


function getUrl(url, cbx) {
  console.log(url)
  request.get(url, function (error, response, body) {        
    if (!error && response.statusCode == 200) {            
      cbx(error, response, body)
    }
    else {
      console.log(response.statusCode + " : " + error)
      cbx(error, null)
    }
  })	
}

function loadUser(user) {
	console.log("load user " + user.name)
}

loadAllProjects()
