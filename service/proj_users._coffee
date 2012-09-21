utils = require './utils'
inj = require './injection'
neo4j = require 'neo4j'
config = require '../common/config'
db = new neo4j.GraphDatabase {url: config.neo4j, proxy: config.proxy}

exports.index = (req, res, _) ->
  
  login = req.query.$login ? ""
  company = req.query.company ? ""
  country = req.query.country ? ""
  key = "proj_users_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}_#{login}_#{company}_#{country}"
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

  country = req.query['country']
  
  if (country)    
    country = inj.sanitizeString country    
    country = utils.encodeStringCypher country
    qry += "AND HAS(u.country) AND u.country =~ /(?i)#{country}/\n"
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

exports.projectUsersCountries = (req, res, _) ->  
  key = "projectUsersCountires_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}"
  utils.handleRequestCache res, req, key, projectUsersCountriesInternal, _ 

exports.projectUsersUSStates = (req, res, _) ->  
  key = "projectUsersUSStates_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}"
  utils.handleRequestCache res, req, key, projectUsersUSStatesInternal, _ 
  

projectUsersCompaniesInternal = (req, _) ->   
  projectUsersFilterDimentionInternal req, "company", "", _

projectUsersCountriesInternal = (req, _) ->   
  projectUsersFilterDimentionInternal req, "country", "", _

projectUsersUSStatesInternal = (req, _) ->   
  projectUsersFilterDimentionInternal req, "state", "AND HAS(u.country) AND u.country='United States'", _

projectUsersFilterDimentionInternal = (req, dimention, filter, _) ->   
  prj_name = inj.sanitizeString req.params.project  
  
  #u.company should have at least one letter, to avoid just spcaes
  qry = "START  n=node:node_auto_index(name='#{prj_name}')
         MATCH (n)<-[depends_on*0..2]-(x)<-[:watches]-(u)
         WHERE HAS(u.#{dimention}) AND u.#{dimention}<>'' "
  qry += filter
  qry += " WITH u as user, count(*) as tmp
         RETURN user.#{dimention} as name, count(*) as count
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
  utils.endTiming(start, "projectUsers#{dimention}Internal main query")  
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
  data[0].count.toString()
