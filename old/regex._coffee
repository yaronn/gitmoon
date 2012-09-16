fs = require('fs')

script = "var bla = require('bla')\n
var foo = require('foo')\n
moo\n
too\n
goo\n
joo\n
bla.zoo(1,2,3)\n
loo\n
hoo\n
coo\n
soo\n
pbla.loo(4,5,6)\n
moo\n
hoo"

findUsage = (script, module) ->
	definition = new RegExp "var?\\s*?(\\w*?)\\s*?=\\s*?require\\([ '\"]*?\\w*?#{module}\\w*?[ '\"]*?\\)", "gm"			

	while next_definition = definition.exec script
		variable = next_definition[1]				
		usage = new RegExp "\\s+?#{variable}\\.", "gm"
		while next_usage = usage.exec script
			printArea script, next_definition.index + next_usage.index, module
			console.log "\n*******\n"			
			throw "e"

printArea = (text, position, bold) ->	

	before = text.substring 0, position		
	i = 2
	start = 0
	pos = before.lastIndexOf "\n"	
	while pos!=-1 and i>0
		start = pos
		before = text.substring 0, pos-1
		pos = before.lastIndexOf "\n"
		i--		
	
	i = 4
	end = text.length-1
	pos = script.indexOf "\n", position
	console.log pos
	while pos!=-1 and i>0
		end = pos
		pos = script.indexOf "\n", end+1
		i--

		
	res = text.substring start, end

	re = new RegExp(bold,"g");
	res = res.replace(re, "<b>" + bold + "</b>")
	
	#console.log res
	#console.log text.length
	console.log position
	#console.log start
	#console.log end
	



#findUsage script, "bla"
#findUsage fs.readFileSync('C:/Users/naveh/Documents/features/projects/oss/service/project.js').toString(), "async"

#try to use this regex engine
#the js one returns not correct positions (index) for a reaon
#https://github.com/slevithan/XRegExp/blob/master/README.md#usage-examples