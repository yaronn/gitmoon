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
  platform = utils.getEdition req

  project1 = inj.sanitizeString req.query.project1
  project2 = inj.sanitizeString req.query.project2
  
  p1count = getWatchersCount platform, project1, _
  p2count = getWatchersCount platform, project2, _

  
  if project1!=project2
    qry = "START  n1=node:node_auto_index(name='#{project1}'),
                  n2=node:node_auto_index(name='#{project2}')           
           MATCH (n1)<-[:watches]-(u),
                 (n2)<-[:watches]-(u)
           WHERE HAS(n1.platform) AND n1.platform='#{platform}'
           AND   HAS(n2.platform) AND n2.platform='#{platform}'
           RETURN count(distinct u) as count"         

    start = utils.startTiming()  
    data = db.query qry, {}, _  
    utils.endTiming(start, "projectsUsersOverlapInternal")
    overlap = data[0].count
  else
    overlap = p1count

  JSON.stringify { project1: p1count
                 , project2: p2count
                 , overlap: overlap}


getWatchersCount = (platform, project, _) ->
  
  qry = "START  n=node:node_auto_index(name='#{project}')
         MATCH (n)<-[:watches]-(u)
         WHERE HAS(n.platform) AND n.platform='#{platform}'
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

exports.projectsCompaniesOverlap = (req, res, _) ->      
  res.writeHead 200, {"Content-Type": "application/json"}
  project1 = req.query.project1 ? ""
  project2 = req.query.project2 ? ""
  key = "projects_companies_overlap_#{project1}_#{project2}"
  utils.handleRequestCache res, req, key, projectsCompaniesOverlapInternal, _ 

projectsCompaniesOverlapInternal = (req, _) ->
  project1 = inj.sanitizeString req.query.project1
  project2 = inj.sanitizeString req.query.project2
  
  params1 = {"query": {"$top": "10"}}

  ###
  companies array is

  [
    {name: "company1", count: 12}
  ]
  ###
  companies1 = utils.projectUsersFilterDimentionInternal params1, 
    { name: req.query.project1
    , dimention: "company"
    , direct_only: true }, _
  companies1 = JSON.parse companies1
  companies2 = utils.projectUsersFilterDimentionInternal params1, 
    { name: req.query.project2
    , dimention: "company"
    , direct_only: true }, _
  companies2 = JSON.parse companies2

  ###
  res is this hash:
    
    {
      "[company1_name]": {project1: 10, project2: 3},
      "[company2_name]": {project1: 10},
    }

  ###  
  projects_hash = {}
  push companies1, "project1", projects_hash
  push companies2, "project2", projects_hash
  ###
    project_array is this:

    [
      {
        company_name: "[company1]", project1_count: 12, project2_count: 8
      },
      {
        company_name: "[company2]", project1_count: 12
      }
    ]
  ###
  projects_array = (arrayify projects_hash).sort sort
  max_results = 8  
  return JSON.stringify(projects_array.reverse().slice(0, max_results))

push = (list, list_name, hash) ->      
  for company in list
    if !hash[company.name] then hash[company.name] = {}
    hash[company.name][list_name] = company.count        

arrayify = (hash) ->
  companies = []
  for h of hash
    companies.push { 
        "name": h
      , "project1_count": hash[h].project1
      , "project2_count": hash[h].project2}
  companies

count = (count) ->  
  return 0 if !count
  count

sort = (a,b) ->
  #only company a has form both project
  if (a["project1_count"] && a["project2_count"]) && (!b["project1_count"] || !b["project2_count"])
    return 1
  #only company b has form both project    
  else if (b["project1_count"] && b["project2_count"]) && (!a["project1_count"] || !a["project2_count"])
    return -1
  #both projects have only one company - return where there are max users
  else 
    sum = count(a["project1_count"]) + count(a["project2_count"]) - count(b["project1_count"]) - count(b["project2_count"]) 
    return sum