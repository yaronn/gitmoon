utils = require './utils'
inj = require './injection'
neo4j = require 'neo4j'
config = require '../common/config'
db = new neo4j.GraphDatabase {url: config.neo4j, proxy: config.proxy}

exports.index = (req, res, _) ->  
  key = "sample_code_#{req.params.project}_#{req.query.$skip}_#{req.query.$top}"
  utils.handleRequestCache res, req, key, getReferencingProjects, _ 
  
getReferencingProjects = (req, _) ->   
  prj_name = inj.sanitizeString req.params.project  
  qry = "START n=node:node_auto_index(project_used_name='#{prj_name}') 
        return n.project_using_name as name, count(*) as count order by n.project_using_name\n"

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
  utils.endTiming(start, "getCodeSamples main query")  
  JSON.stringify(refs, null, 4)