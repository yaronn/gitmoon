utils = require './utils'
inj = require './injection'
neo4j = require 'neo4j'
config = require '../common/config'
db = new neo4j.GraphDatabase(config.neo4j)

exports.index = (req, res, _) ->
  console.log "startGetProjectUsersIndex"
  login = req.query.$login ? ""
  key = "proj_users_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}_#{login}"  
  utils.handleRequestCache res, req, key, getProjUsers, _ 

getProjUsers = (req, _) ->  
  result = ""
  prj_name = inj.sanitizeString req.params.project
  qry = "START  n=node:node_auto_index(name='#{prj_name}')
        MATCH (n)<-[depends_on*0..#{utils.max_depth}]-(x)<-[:watches]-(u)\n"

  params = {}
  login = req.query['$login']
  
  if (login)    
    login = inj.sanitizeString login    
    login = utils.encodeStringCypher login
    qry += "WHERE u.login+' '+u.full_name =~ /(?i).*?#{login}.*?/\n"
    #params.login = ".*?" + login + ".*?"      


  qry +=    "WITH distinct u as u, n as n
            MATCH p = shortestPath( n<-[*..#{utils.max_depth}]-u )
            RETURN u as user, p as path, length(p) as len
            ORDER BY LENGTH(u.gravatar_id) DESC, u.login_lower\n"
  
  _skip = req.query['$skip']

  if (_skip)
    _skip = inj.ensureInt _skip
    qry += "SKIP #{_skip}\n"
    params._skip = parseInt(_skip)

  top = req.query['$top']  
  if (top)
    top = inj.ensureInt top
    qry += "LIMIT #{top}\n"
    params.top = parseInt(top)
    
  #console.log(qry)
  #console.log(params)

  start = utils.startTiming()  
  users = db.query qry, params, _
  utils.endTiming(start, "getProjUsers main query")
  result += '[\n'
  first = true;      
  start = utils.startTiming()
  users.forEach_ _, (_, u) ->  
    if first then first = false 
    else result += ","
    u.user.data.dependency_path = utils.fillPathNodeNames u, _    
    u.user.data.id = u.user.id    
    result += JSON.stringify(u.user.data, null, 4) + "\n"
  utils.endTiming(start, "getProjUsers loop")
  result += ']'
  result
