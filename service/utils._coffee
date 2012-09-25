neo4j = require 'neo4j'
config = require '../common/config'
db = new neo4j.GraphDatabase {url: config.neo4j, proxy: config.proxy}

exports.db = db

nMemcached = require( 'memcached' )
mem = if config.memcached then new nMemcached else null

exports.max_depth = 2

exports.getProjectUsers = (db, projectId, _) ->
  #return []
  qry = "START n=node(#{projectId})
        MATCH (n)<-[depends_on*0..#{module.exports.max_depth}]-(x)<-[:watches]-(u)
        RETURN u.login as login, ID(u) as id, u.gravatar_id? as gravatar_id, count(*) as count
        ORDER BY gravatar_id DESC
        LIMIT 4"
  
  results = db.query qry, _
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
