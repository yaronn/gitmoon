var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474')
var async = require('async')

function cleanDb(cbx) {
	async.series([ deleteAllLinkedNodesAndRelations
				 , deleteOrphanNode], cbx)
}

function deleteAllLinkedNodesAndRelations(cbx) {
	var qry = "START n = node(*)\n" +
	      	  "MATCH n-[r]-()\n" +
	      	  "DELETE n, r"

	db.query(qry, function (err, results) {		
		if (err) console.log(err)
		cbx()
	})
}

function deleteOrphanNode(cbx) {
	var qry = "START n = node(*)\n" +      	  
	      	   "DELETE n"

	db.query(qry, function (err, results) {
		if (err) console.log(err)			
		cbx()
	})
}

function addDummyData(cbx) {
	var xmldom = db.createNode({name: 'xmldom', type: 'project', last_update_date: 0});	
	var xmlcrypto = db.createNode({name: 'xml-crypto', type: 'project', last_update_date: 0});
	var wsjs = db.createNode({name: 'ws.js', type: 'project', last_update_date: 0});
	var wcfjs = db.createNode({name: 'wcf.js', type: 'project', last_update_date: 0});

	var yaron = db.createNode({name: 'yaron naveh', type: 'user', last_update_date: 0});
	var mike = db.createNode({name: 'mike', type: 'user', last_update_date: 0});

	async.series([
    	function(cbx){ xmldom.save(cbx) },
    	function(cbx){ xmlcrypto.save(cbx) } ,
    	function(cbx){ wsjs.save(cbx) } ,
    	function(cbx){ wcfjs.save(cbx) } ,
    	function(cbx){ yaron.save(cbx) } ,
    	function(cbx){ mike.save(cbx) } ,
    	function(cbx){ xmlcrypto.createRelationshipTo(xmldom, 'depends_on', {}, cbx)} ,
    	function(cbx){ wsjs.createRelationshipTo(xmldom, 'depends_on', {}, cbx)} ,
    	function(cbx){ wsjs.createRelationshipTo(xmlcrypto, 'depends_on', {}, cbx)} ,
    	function(cbx){ wcfjs.createRelationshipTo(wsjs, 'depends_on', {}, cbx)},
    	function(cbx){ yaron.createRelationshipTo(xmlcrypto, 'watches', {}, cbx)},
    	function(cbx){ yaron.createRelationshipTo(wcfjs, 'watches', {}, cbx)},
    	function(cbx){ mike.createRelationshipTo(xmlcrypto, 'watches', {}, cbx)} 
	], cbx);
}


async.series([ cleanDb, addDummyData])


//dummy
/*var qry = 'START n=node:node_auto_index(name="wcf.js")\n' +
	      	  'MATCH (n)-[:depends_on]->(x), (x)-[:depends_on]->(y)\n' +
	      	  'RETURN y'

db.query(qry, function (err, results) {		
	if (err) console.log(err)
	//if (results) console.log(results[1].y.data)		
	if (results) console.log(results[1].y.id)
})
*/

/*
//11 - ws.js
//get number of projects that ws.js depends on
db.getNodeById(11, function (err, node) {
	console.log(node.data.name + " has number of outgoing: ")
	node.getRelationshipNodes({type: 'depends_on', direction: 'out'}, function (err, results) {		
		if (err) console.log(err)	
		if (results) console.log(results.length)
	})	
})
*/


/*
//how many projects depend on xmldom (using cypher)
var qry = 'START n=node:node_auto_index(name="xmldom")\n' +
	      	  'MATCH (n)<-[:depends_on*1..5]-(x)\n' +
	      	  'RETURN count(distinct x)'
*/


/*
//get number of projects that depend on xmldom (using api)
db.getNodeById(9, function (err, node) {
	console.log(node.data.name + " has number of incoming: ")
	node.getRelationshipNodes({type: 'depends_on', direction: 'in'}, function (err, results) {		
		if (err) console.log(err)	
		if (results) console.log(results.length)
	})	
})
*/


//get number of people that watch xmldom or child
/*
db.getNodeById(48, function (err, node) {
	console.log(node.data.name + " has number of watchers: ")
	node.getRelationshipNodes([{type: 'depends_on', direction: 'in'}
							  ,{type: 'watchers', direction: 'in'}], function (err, results) {		
		if (err) console.log(err)	
		if (results) console.log(results.length)
	})	
})
*/



//how many followers watchers ws.js has
/*
var qry = 'START n=node:node_auto_index(name="xmldom")\n' +
	      	  'MATCH (n)<-[:depends_on*0..5]-(x)<-[:watches]-(y)\n' +
	      	  'RETURN count(y)'

db.query(qry, function (err, results) {		
	if (err) console.log(err)
	//if (results) console.log(results[1].y.data)		
console.log(results)
	//console.log(results[0].y.data)
})
*/


//all projects
/*
var qry = 'START n=node(*)\n' +	      	  
		  'WHERE n.type="project"\n' + 
	      'RETURN n'

db.query(qry, function (err, results) {		
	if (err) console.log(err)
	console.log(results.length)
})
*/

/*
//specific project
var qry = 'START n=node:node_auto_index(name="xmldom")\n' +
		  'RETURN n'

db.query(qry, function (err, results) {		
	if (err) console.log(err)
	console.log(results.length)
})

*/
