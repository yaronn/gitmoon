utils = require './utils'
inj = require './injection'
neo4j = require 'neo4j'
config = require '../common/config'
db = new neo4j.GraphDatabase {url: config.neo4j, proxy: config.proxy}

exports.index = (req, res, _) ->    
  name = req.query.$name ? ""
  key = "dep_projects_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}_#{name}"
  utils.handleRequestCache res, req, key, getDependantBy, _   

getDependantBy = (req, _) ->    
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

exports.getDependsOn = (req, res, _) ->    
  project = req.query.$project ? ""
  key = "dependsOn_#{req.params.project}"
  utils.handleRequestCache res, req, key, getDependsOnInternal, _   

getDependsOnInternal = (req, _) ->    
  nesting_level = 10
  prj_name = inj.sanitizeString req.params.project
  prj_name = utils.encodeStringCypher prj_name
  qry = "START n=node:node_auto_index(name='#{prj_name}')
         MATCH (n)-[:depends_on*0..#{nesting_level}]->(x),
         (n)-[:depends_on*0..#{nesting_level}]->(y)
         With x as x, y as y
         MATCH z = x-[depends_on*1..1]->y
         RETURN DISTINCT EXTRACT(n in nodes(z) : n.name) as link"
  start = utils.startTiming()  
  data = db.query qry, {}, _  
  result = []
  data.forEach_ _, (_, p) ->      
    result.push {source: p.link[0], target: p.link[1], type: 'depends_on'}

  utils.endTiming(start, "getDependsOnInternal")  
  JSON.stringify(result)