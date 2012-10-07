var utils = require('./utils')
var inj = require('./injection')
var neo4j = require('neo4j');
var config = require('../common/config')
var db = utils.db
var async = require('async')
var request = require('request')


exports.index = function(req, res, _) {
  res.writeHead(200, {"Content-Type": "application/json"})
  console.log("write json")
  name = req.query.$name ? req.query.$name : ""
  mode = req.query.$mode ? req.query.$mode : ""
  key = "all_projects_" + req.query.$skip + "_"+req.query.$top + "_" + name  + "_" + mode
  utils.handleRequestCache(res, req, key, getAllProjects, _)
}

function getAllProjects(req, _) {   
  var qry = 'START n=node(*)\n'

  var params = {}
  var name = req.query['$name']

  if  (name) {
    //ERROR: qry += ' AND n.name =~ /{name}/'
    //qry += ' AND n.name =~ {name}'
    //params.name = "(?i).*?" + name + ".*?"
    name = name.toLowerCase()
    name = inj.sanitizeString(name)
    name = utils.encodeStringCypher(name)
  
    var mode = req.query['$mode']    

    var filter = name+"*"
    if (mode!="starts") filter="*" + filter

    qry = 'START n=node:node_auto_index("name_lower:'+filter+'")\n'
  }

  var platform = utils.getEdition(req)
  qry += 'WHERE HAS(n.type) and n.type="project"\n'
  qry += 'AND HAS(n.platform) AND n.platform="'+platform+'"\n'
  qry += 'WITH n.name as name, n.name_lower as name_lower, count(*) as count\n'
  qry += 'RETURN name\n' +
         'ORDER BY name_lower\n'
  
  var skip = req.query['$skip']

  if (skip) {
    qry += "SKIP " + skip + "\n"
    params._skip = parseInt(skip)
  }

  var top = req.query['$top']  
  if (top) {
    qry += "LIMIT " + top + "\n"
    params.top = parseInt(top)
  }

  //console.log(qry)
  //console.log(params)
  
  var start = utils.startTiming()        
  results = db.query(qry, params, _)  
  utils.endTiming(start, "getAllProjects query")
  return JSON.stringify(results)
}

exports.show = function(req, res, _) {  
  res.writeHead(200, {"Content-Type": "application/json"})
  var getStat = req.query.include_stat=="true"?"stat":"no_stat"
  var getUsers = req.query.include_users=="true"?"users":"no_users"
  var key = "show_project_" + req.params.project + "_" + getStat + "_" + getUsers
  utils.handleRequestCache(res, req, key, getProject, _)
}

function getProject(req, _) {  
  var name = req.params.project  
  name = inj.sanitizeString(name)
  var start = utils.startTiming()        
  var node = utils.getProject(req, name, _)
  utils.endTiming(start, "getProject query")

  if (node==null) {
    var msg = "no items found for project " + name
    console.log(msg)
    throw new Error(msg)
  }

  var data = node.data
  data.id = node.id
  
  if (req.query.include_users=="true")
    data.users = utils.getProjectUsers(req, node.id, 8, _)


  var getStat = req.query.include_stat=="true"
  if (getStat) {
  var start = utils.startTiming()        
    getDirectDeps(data, _)        
    getTotalDeps(data, _)
    getDirectWatch(data, _)    
    getTotalForks(req, data, _)
    getTotalWatch(data, _)              
    utils.endTiming(start, "getProject inner queries")
  }


  var val = JSON.stringify(data, null, 4)        
  //console.log("val: " + val)
  return val  
}

function getDirectDeps(node, cbx)
{
  node.direct_deps = 0

  var qry = 'START n=node(' + node.id + ')\n' +
            'MATCH (n)<-[:depends_on]-(x)\n' +
            'RETURN count(distinct x) as count'

  db.query(qry, function (err, results) {   
    if (err) console.log(err)    
    if (results && results.length>0) node.direct_deps = results[0].count
    cbx()
  })
}

function getTotalForks(req, node, cbx)
{
  var platform = utils.getEdition(req)
  node.total_forks = 0
  qry = 'START n=node(' + node.id + ')\n' +
        'MATCH (n)<-[:depends_on*0..'+utils.max_depth+']-(x)\n' +
        'WHERE HAS(x.forks) AND HAS(x.platform)\n' +
        'AND x.platform="'+platform+'"\n' +
        'WITH x as y, count(*) as count\n' +
        'MATCH (y)<-[:depends_on*0]-(z)\n' + //trick so that z will be each one of the y's (dependent projects)
        'RETURN sum(z.forks) as sum'

  db.query(qry, function (err, results) {   
    if (err) console.log(err)    
    if (results && results.length>0) node.total_forks = results[0].sum
    cbx()
  })
}

function getTotalDeps(node, cbx)
{
  node.total_deps = 0

  var qry = 'START n=node(' + node.id + ')\n' +
            'MATCH (n)<-[:depends_on*1..'+utils.max_depth+']-(x)\n' +
            'RETURN count(distinct x) as count'

  db.query(qry, function (err, results) {   
    if (err) console.log(err)    
    if (results && results.length>0) node.total_deps = results[0].count
    cbx()
  })
}

function getDirectWatch(node, cbx)
{
  node.direct_watch = 0

  var qry = 'START n=node(' + node.id + ')\n' +
            'MATCH (n)<-[:watches]-(y)\n' +
            'RETURN count(distinct y) as count'

  db.query(qry, function (err, results) {   
    if (err) console.log(err)       
    if (results && results.length>0) node.direct_watch = results[0].count      
    cbx()
  })
}

function getTotalWatch(node, cbx)
{
  node.total_watch = 0

  var qry = 'START n=node(' + node.id + ')\n' +
            'MATCH (n)<-[:depends_on*0..'+utils.max_depth+']-(x)<-[:watches]-(y)\n' +
            'WHERE HAS(x.name) AND x.name<>"hoarders"\n' +
            'RETURN count(distinct y) as count'

  db.query(qry, function (err, results) {   
    if (err) console.log(err)    
    if (results && results.length>0) node.total_watch = results[0].count
    cbx()
  })
}


function isInt(s) {
  return /^[0-9]+$/.test(s)
}

function secure(s) { 
  if (!s) return s

  var replacements = [ ["/", "\/'"] ]
  
  for (var r in replacements) {
    var rep = replacements[r]
    s = s.replace(rep[0], rep[1])
  }

  return s
}
