neo4j = require 'neo4j'
config = require '../common/config'
db = new neo4j.GraphDatabase {url: config.neo4j, proxy: config.proxy}
inj = require './injection'

exports.db = db

nMemcached = require( 'memcached' )
mem = if config.memcached then new nMemcached else null

exports.max_depth = 2

exports.getProjectUsers = (projectId, limit, _) ->
  #return []
  qry = "START n=node(#{projectId})
        MATCH (n)<-[:watches]-(u)
        RETURN u.login as login, ID(u) as id, u.gravatar_id? as gravatar_id, count(*) as count
        ORDER BY gravatar_id DESC
        LIMIT #{limit}"
  
  results = module.exports.db.query qry, _
  users = []
  for n in results
    users.push
      id: n.id
      login: n.login
      gravatar_id: n.gravatar_id ? null
  users

exports.fillPathNodeNames = (node, _) ->  
  path = []

  node.path.nodes.forEach_ _, (_, r) ->
    n = db.getNode r._data.self, _
    path.push {name: n.data.name, id: n.id}          
  path.slice(0, path.length-1).reverse()

exports.answerFromCache = (response, key, _) ->    
  if mem
    key = module.exports.encodeMemcached key
    try    
      cache = mem.get key, _    
      if cache
         #console.log "cache hit #{key}"
         response.end cache
         return true  
    catch e    
      #console.log e
    
  #console.log "cache miss #{key}"
  return false

exports.getCache = (key, _) ->
  if mem
    key = module.exports.encodeMemcached key
    cache = mem.get key, _    
    if cache
       return cache
    
  return null

exports.addCache = (key, value, _) ->
  if mem
    key = module.exports.encodeMemcached key
    mem.set key, value, 0, _

exports.insertCacheAndAnswer = (key, result, response, _) ->
  if mem
    key = module.exports.encodeMemcached key
    try
      #60*60*24 - a day, 0 - never expires
      mem.set key, result, 0, _
    catch e
      console.log e

  response.end(result)
  
exports.handleRequestCache = (response, request, key, handler, _) ->  
  isCache = module.exports.answerFromCache response, key, _    
  if isCache then return      
  output = handler request, _  
  module.exports.insertCacheAndAnswer key, output, response, _ 

exports.startTiming = () ->
  new Date()

exports.endTiming = (start, title) ->
  end = new Date()
  span = new Date(end-start)
  mili = span.getMilliseconds()/100
  mili = mili.toString().replace '.', ''
  console.log "#{title} took #{span.getSeconds()}.#{mili}"
  #console.log "#{title} took #{span.toString()}"

exports.encodeStringCypher = (s) ->
  return s.replace /["]/g, ""

exports.encodeMemcached = (s) ->
  return s.replace /[ ]/g, ""  


exports.projectUsersFilterDimentionInternal = (req, options, _) ->   
  prj_name = inj.sanitizeString options.name
  
  #u.company should have at least one letter, to avoid just spcaes
  qry = "START  n=node:node_auto_index(name='#{prj_name}')
         MATCH (n)<-"
  if !options.direct_only
    qry += "[depends_on*0..2]-(x)<-"
  qry += "[:watches]-(u)         
         WHERE HAS(u.#{options.dimention}) AND u.#{options.dimention}<>''"
         
  if !options.direct_only
         qry += " AND HAS(x.name) AND x.name<>'hoarders' "
         
  if options.filter then qry += options.filter
  qry += " WITH u as user, count(*) as tmp
         RETURN user.#{options.dimention} as name, count(*) as count
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
    
  start = module.exports.startTiming()  
  refs = db.query qry, params, _  
  module.exports.endTiming(start, "projectUsers#{options.dimention}Internal main query")  
  JSON.stringify(refs, null, 4)
