Stub = require('./stub').Stub
Modes = require('./stub').Modes
request = require 'request'

dummyClient = (_) ->
  #console.log "client sends request..."  
  res = request.get "http://npm_search:8081/api/a3", _  
  #res = request.get "http://github:8081/repos/yaronn/ws.js", _
  console.log "client got response: #{res.body}"

port = process.argv[2]

mode = null
switch process.argv[3].toLowerCase()
  when "proxy" then mode = Modes.PROXY
  when "stub" then mode = Modes.STUB
  when "hybrid" then mode = Modes.HYBRID

s = new Stub port, mode, _
###############DO NOT USE#########s.init _
#s.dump _
s.start _
#dummyClient _  


#http://npm_search:8081/api/#{name}