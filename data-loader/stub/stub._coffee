url = require 'url'
http = require 'http'
ProxyRequest = require('./proxyRequest').ProxyRequest
Db = require('mongodb').Db
Server = require('mongodb').Server
pause = require('../utils').pause

Modes = {
    PROXY : 0,
    STUB : 1,
    HYBRID: 2
}

class Stub
  constructor: (@port, @mode, _) ->        
    @client = new Db 'stubs', new Server("127.0.0.1", 27017, {})
    @client.open _ 
    @keyMap = @client.collection 'keyMap', _
    @stubData = @client.collection 'stubData', _    

  start: (_) =>        
    http.createServer(@handler).listen @port
    console.log "server listening on port #{@port}"

  handler: (request, response, _) =>      
    try      
      @handler_inner request, response, _
    catch error
      console.log error

  handler_inner: (request, response, _) =>
    console.log "got request"  

    #workaround to keep the stream events after async call
    paused = pause(request)

    key = request.headers['host']
    console.log "key: #{key}"
    entry = @getEntry key, _  

    if !entry
      console.log "host not found for key"
      response.end("could not find host for key " + key)
      return
    
    console.log "host: #{entry.host}"

    new_url = "#{entry.scheme}://#{entry.host}#{request.url}"
    console.log new_url

    if (@mode==Modes.STUB || @mode==Modes.HYBRID)            
      console.log "work as stub"
      success = @tryActAsStub key, new_url, response, _
      console.log "try as stub: #{success}"
      if (!success && @mode==Modes.STUB)
        response.writeHead 500, {}
        response.end()
    
    if (@mode==Modes.PROXY || (@mode==Modes.HYBRID && !success))     
      console.log "work as proxy"
      @tryActAsProxy key, new_url, request, response, paused, _           

  tryActAsStub: (key, new_url, response, _) ->
    canned = @getCannedResponse key, new_url, _          
    return false if (!canned)      
    #console.log canned.body.length
    canned.headers.connection = "close"
    response.writeHead canned.statusCode, canned.headers
    
    #body can be a buffer (e.g binary file was downloaded) or a string (normal json)
    if canned.body.buffer
      response.write canned.body.buffer, 'binary'     
    else if canned.body
      response.write canned.body, 'binary'     

    response.end()       
    return true
  
  tryActAsProxy: (key, new_url, request, response, paused, _) ->
     try
       proxy_request = new ProxyRequest                 
       proxy_request.on 'response', (data, _) =>                    
         try
           if data.statusCode<=404
            @deleteEntries key, new_url, _
            @addEntry key, new_url, data, _                     
         catch error
           console.log error           
       proxy_request.send paused, request, response, new_url, _
     catch error
       console.log "error:" + error        

  getEntry: (key, _) =>        
    cursor = @keyMap.find {key: key}, {}, _  
    return cursor.nextObject _        

  addEntry: (key, url_str, data, _) =>    
    @stubData.insert {key: key, url: url_str, data: data}, {safe: true},  _

  deleteEntries: (key, url, _) =>
    res = @stubData.remove {key: key, url: url}, {safe: true}, _
    console.log("removed #{res} documents") if res>0

  getCannedResponse: (key, url, _) =>
    console.log "find key:#{key}, url:#{url}"
    #res=@stubData.find().toArray _
    #console.log "first row:#{res[0].key}, url:#{res[0].url}"    
    cursor = @stubData.find {key: key, url: url}, {}, _    
    item = cursor.nextObject _    
    #if item then console.log item.data
    if item then item.data

  init: (_) =>
    @keyMap.remove _    
    @stubData.remove _
    @keyMap.insert {key: "npm_search:8081", scheme:"http", host: "search.npmjs.org"}, _    
    @keyMap.insert {key: "npm_registry:8081", scheme:"http", host: "registry.npmjs.org"}, _
    @keyMap.insert {key: "github:8081", scheme:"https", host: "api.github.com"}, _
    console.log "init done"

  dump: (_) =>
    res = @keyMap.find().toArray _
    console.log res
    res1 = @stubData.find().toArray _
    console.log res1

exports.Modes = Modes
exports.Stub = Stub
