utils = require './utils'
inj = require './injection'
neo4j = require 'neo4j'
config = require '../common/config'
db = utils.db

exports.projectsUsersOverlap = (req, res, _) ->      
  res.writeHead 200, {"Content-Type": "application/json"}
  project1 = req.query.project1 ? ""
  project2 = req.query.project2 ? ""
  key = "projects_users_overlap_#{project1}_#{project2}"
  utils.handleRequestCache res, req, key, projectsUsersOverlapInternal, _ 

projectsUsersOverlapInternal = (req, _) ->
  project1 = inj.sanitizeString req.query.project1
  project2 = inj.sanitizeString req.query.project2
  
  p1count = getWatchersCount project1, _
  p2count = getWatchersCount project2, _

  if project1!=project2
    qry = "START  n1=node:node_auto_index(name='#{project1}'),
                  n2=node:node_auto_index(name='#{project2}')
           MATCH (n1)<-[:watches]-(u),
                 (n2)<-[:watches]-(u)
           RETURN count(distinct u) as count"         

    start = utils.startTiming()  
    data = db.query qry, {}, _  
    utils.endTiming(start, "getOverlap")
    overlap = data[0].count
  else
    overlap = p1count

  JSON.stringify { project1: p1count
                 , project2: p2count
                 , overlap: overlap}


getWatchersCount = (project, _) ->
  qry = "START  n=node:node_auto_index(name='#{project}')
         MATCH (n)<-[:watches]-(u)
         RETURN count(distinct u) as count"         

  start = utils.startTiming()  
  data = db.query qry, {}, _
  utils.endTiming(start, "getWatchersCount")
  data[0].count

exports.projectsCountriesOverlap = (req, res, _) ->        
  res.writeHead 200, {"Content-Type": "application/json"}
  project1 = req.query.project1 ? ""
  project2 = req.query.project2 ? ""
  by_us_states = req.query.by_us_states ? "false"
  key = "projects_countries_overlap_#{project1}_#{project2}_#{by_us_states}"
  utils.handleRequestCache res, req, key, projectsCountriesOverlapInternal, _ 

projectsCountriesOverlapInternal = (req, _) ->  

  project1 = inj.sanitizeString req.query.project1
  project2 = inj.sanitizeString req.query.project2
  
  countries1 = getCountries req.query.project1, req, _
  countries2 = getCountries req.query.project2, req, _

  c1_hash = []
  countries1.forEach (c) -> c1_hash[c.name] = c.count

  c2_hash = []
  countries2.forEach (c) -> c2_hash[c.name] = c.count

  res = []
  used_countries = {}

  COUNTRY1_WINS = 1
  TIE = 2
  COUNTRY2_WINS = 3
  addCountries = (list, other, win, loose) ->    
    for curr of list
      if !used_countries[curr]
        used_countries[curr] = true
        if !other[curr]
          intensity_value = win
        else        
          intensity_value = TIE
          if list[curr]>other[curr]
            intensity_value = win
          else if list[curr]<other[curr]
            intensity_value = loose

        res.push [curr, intensity_value]
        
  addCountries c1_hash, c2_hash, COUNTRY1_WINS, COUNTRY2_WINS
  addCountries c2_hash, c1_hash, COUNTRY2_WINS, COUNTRY1_WINS
  JSON.stringify(res)

getCountries = (name, req, _) ->
  options =  { dimention: "country"
    , name: name
    , direct_only: true} 

  if req.query.by_us_states=="true"
    options.dimention = "state"
    options.filter = "AND HAS(u.country) AND u.country='United States'"

  countries = utils.projectUsersFilterDimentionInternal req, options, _  
  countries = JSON.parse(countries)

