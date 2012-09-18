utils = require './utils'
inj = require './injection'
neo4j = require 'neo4j'
config = require '../common/config'
db = new neo4j.GraphDatabase(config.neo4j)

exports.index = (req, res, _) ->
  
  console.log "startGetProjectUsersIndex"
  login = req.query.$login ? ""
  company = req.query.company ? ""
  key = "proj_users_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}_#{login}_#{company}"    
  utils.handleRequestCache res, req, key, getProjUsers, _ 

getProjUsers = (req, _) ->  
  result = ""
  prj_name = inj.sanitizeString req.params.project
  qry = "START  n=node:node_auto_index(name='#{prj_name}')
        MATCH (n)<-[depends_on*0..#{utils.max_depth}]-(x)<-[:watches]-(u)
        WHERE 1=1\n"

  params = {}
  login = req.query['$login']
  
  if (login)    
    login = inj.sanitizeString login    
    login = utils.encodeStringCypher login
    qry += "AND u.login+' '+u.full_name =~ /(?i).*?#{login}.*?/\n"
    #params.login = ".*?" + login + ".*?"      


  company = req.query['company']
  
  if (company)    
    company = inj.sanitizeString company    
    company = utils.encodeStringCypher company
    qry += "AND u.company =~ /(?i)#{company}/\n"
    #params.company = ".*?" + company + ".*?"      

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


exports.projectUsersCompanies = (req, res, _) ->  
  key = "projectUsersCompanies_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}"
  utils.handleRequestCache res, req, key, projectUsersCompaniesInternal, _ 
  
projectUsersCompaniesInternal = (req, _) ->   
  prj_name = inj.sanitizeString req.params.project  
  qry = "start n=node:node_auto_index(type='user') WHERE n.company<>'' 
         return n.company, count(n) as count order by count DESC\n"

  params = {}
  
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
    
  start = utils.startTiming()  
  refs = db.query qry, params, _  
  utils.endTiming(start, "projectUsersCompaniesInternal main query")  
  JSON.stringify(refs, null, 4)

exports.projectUserCount = (req, res, _) ->  
  res.writeHead 200, {"Content-Type": "text/plain"}
  key = "project_user_#{req.params.project}_count"
  utils.handleRequestCache res, req, key, getProjectUserCountInternal, _ 

getProjectUserCountInternal = (req, _) ->
  prj_name = inj.sanitizeString req.params.project
  qry = "START  n=node:node_auto_index(name='#{prj_name}')
         MATCH (n)<-[depends_on*0..#{utils.max_depth}]-(x)<-[:watches]-(u)
         RETURN count(distinct u) as count\n"
  start = utils.startTiming()  
  data = db.query qry, {}, _  
  utils.endTiming(start, "getProjectUserCountInternal")
  console.log data[0]
  data[0].count.toString()
