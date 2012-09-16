utils = require './utils'
inj = require './injection'
neo4j = require 'neo4j'
config = require '../common/config'
db = new neo4j.GraphDatabase config.neo4j

exports.index = (req, res, _) ->    
  name = req.query.$name ? ""
  key = "dep_projects_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}_#{name}"
  utils.handleRequestCache res, req, key, getDeps, _   

getDeps = (req, _) ->    
  result = ""
  prj_name = inj.sanitizeString req.params.project
  qry = "START  n=node:node_auto_index(name='#{prj_name}')\n
        MATCH (n)<-[depends_on*1..#{utils.max_depth}]-(x)
        WHERE x.type='project' "

  params = {}
  
  name = req.query.$name
  if (name)
    name = inj.sanitizeString name
    name = utils.encodeStringCypher(name)
    qry += "AND x.name =~ /(?i).*?#{name}.*?/"
    params.name = ".*?" + name + ".*?"  

  qry += "\n"
  
  qry +=    'WITH distinct x as x, n as n\n' +
            'MATCH p = shortestPath( n<-[*..15]-x )\n'+
            'RETURN distinct x as project, p as path, length(p) as len\n'
            'ORDER BY x.name_lower\n'   

  _skip = req.query.$skip
  if (_skip)
    _skip = inj.ensureInt _skip
    qry += "SKIP #{_skip}\n"
    params._skip = parseInt(_skip)
  
  top = req.query.$top
  if (top)
    top = inj.ensureInt top
    qry += "LIMIT #{top}\n"
    params.top = parseInt(top)
    
  #console.log(qry)
  #console.log(params)
  
  start = utils.startTiming()      
  projects = db.query qry, params, _
  utils.endTiming(start, "getDeps main query")
  
  result += '[\n'
  first = true;      
  start = utils.startTiming()
  projects.forEach_ _, (_, p) ->  
    if first then first = false 
    else result += (",")
    
    p.project.data.users = utils.getProjectUsers db, p.project.id, _
    p.project.data.dependency_path = utils.fillPathNodeNames p, _        
    
    p.project.data.id = p.project.id
    result += JSON.stringify(p.project.data, null, 4) + "\n"
  utils.endTiming(start, "getDeps loop")
  result += ']'
  result  
