utils = require './utils'
inj = require './injection'
neo4j = require 'neo4j'
config = require '../common/config'
db = utils.db

exports.index = (req, res, _) ->
  
  login = req.query.$login ? ""
  company = req.query.company ? ""
  country = req.query.country ? ""
  dependency = req.query.dependency ? ""
  key = "proj_users_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}_#{login}_#{company}_#{country}_#{dependency}"
  utils.handleRequestCache res, req, key, getProjUsers, _ 

getProjUsers = (req, _) ->  
  result = ""
  prj_name = inj.sanitizeString req.params.project
  qry = "START  n=node:node_auto_index(name='#{prj_name}')
        MATCH (n)<-[depends_on*0..#{utils.max_depth}]-(x)<-[:watches]-(u)
        WHERE HAS(x.name) AND x.name<>'hoarders'\n"

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

  country = req.query['country']
  
  if (country)    
    country = inj.sanitizeString country    
    country = utils.encodeStringCypher country
    qry += "AND HAS(u.country) AND u.country =~ /(?i)#{country}/\n"
    #params.country = ".*?" + country + ".*?"   


  dependency = req.query['dependency']
  
  if (dependency)    
    dependency = inj.sanitizeString dependency    
    dependency = utils.encodeStringCypher dependency
    qry += "AND HAS(x.name) AND x.name='#{dependency}'\n"
    #params.country = ".*?" + country + ".*?"         


  qry +=    "WITH distinct u as u, n as n
            MATCH p = shortestPath( n<-[*..#{utils.max_depth+1}]-u )
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
    
  #zzconsole.log(qry)
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

exports.projectUsersCountries = (req, res, _) ->  
  res.writeHead 200, {"Content-Type": "application/json"}
  key = "projectUsersCountires_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}"
  utils.handleRequestCache res, req, key, projectUsersCountriesInternal, _ 

exports.projectUsersUSStates = (req, res, _) ->  
  res.writeHead 200, {"Content-Type": "application/json"}
  key = "projectUsersUSStates_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}"
  utils.handleRequestCache res, req, key, projectUsersUSStatesInternal, _ 
  

projectUsersCompaniesInternal = (req, _) ->   
  utils.projectUsersFilterDimentionInternal req, 
    { name: req.params.project
    , dimention: "company"}, _

projectUsersCountriesInternal = (req, _) ->  
  utils.projectUsersFilterDimentionInternal req, 
  { name: req.params.project
  , dimention: "country"}, _

projectUsersUSStatesInternal = (req, _) ->     
  utils.projectUsersFilterDimentionInternal req, 
    { name: req.params.project
    , dimnetion: "state"
    , filter: "AND HAS(u.country) AND u.country='United States'"}
    , _

exports.projectUsersByDepProject = (req, res, _) ->  
  res.writeHead 200, {"Content-Type": "application/json"}
  key = "projectUsersByDepProject_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}"
  utils.handleRequestCache res, req, key, projectUsersByDepProjectInternal, _ 

projectUsersByDepProjectInternal = (req, _) ->   
  prj_name = inj.sanitizeString req.params.project  
    
  qry = "START  n=node:node_auto_index(name='#{prj_name}')
         MATCH (n)<-[depends_on*0..2]-(x)<-[:watches]-(u)  
         WHERE HAS(x.name) AND n.name<>x.name and x.name<>'hoarders'
         WITH u as user, x as dep, count(*) as tmp
         RETURN dep.name as name, count(*) as count
         ORDER BY count(*) DESC\n"

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
  utils.endTiming(start, "projectUsersByDepProjectInternal main query")  
  JSON.stringify(refs, null, 4)

exports.projectUserCount = (req, res, _) ->  
  res.writeHead 200, {"Content-Type": "text/plain"}
  key = "project_user_#{req.params.project}_count"
  utils.handleRequestCache res, req, key, getProjectUserCountInternal, _ 

getProjectUserCountInternal = (req, _) ->
  (getProjectUserCountInternalByProject req.params.project, "network", _).toString()  

getProjectUserCountInternalByProject = (project, mode, _) ->  
  prj_name = inj.sanitizeString project
  qry = "START  n=node:node_auto_index(name='#{prj_name}')
         MATCH (n)<-"
  if mode=="network"
    qry += "[depends_on*0..#{utils.max_depth}]-(x)<-"
  qry += "[:watches]-(u)\n"
  if mode=="network"
    qry += "WHERE HAS(x.name) AND x.name<>'hoarders'\n"
  qry += "RETURN count(distinct u) as count\n"
  
  start = utils.startTiming()  
  data = db.query qry, {}, _  
  utils.endTiming(start, "getProjectUserCountInternalByProject")  
  data[0].count

exports.projectRandomUsers = (req, res, _) ->  
  res.writeHead 200, {"Content-Type": "application/json"}
  random = utils.random 4
  key = "project_random_user_#{req.params.project}_#{random}"
  utils.handleRequestCache res, req, key, projectRandomUsersInternal, _ 

projectRandomUsersInternal = (req, _) ->  
  prj_name = inj.sanitizeString req.params.project
  count = getProjectUserCountInternalByProject prj_name, "direct", _  
  
  rnd = utils.random count-1

  qry = "START  n=node:node_auto_index(name='#{prj_name}')
         MATCH (n)<-[:watches]-(u)
         WHERE HAS(u.gravatar_id) and LENGTH(u.gravatar_id)>0
         RETURN u.login as login, u.full_name as full_name, u.gravatar_id as gravatar_id,
                u.location as location, u.blog as blog, u.company as company , u.bio as bio
         SKIP #{rnd} LIMIT #{req.query.limit}"  

  start = utils.startTiming()  
  data = db.query qry, {}, _  
  utils.endTiming(start, "projectRandomUsersInternal")
  JSON.stringify data