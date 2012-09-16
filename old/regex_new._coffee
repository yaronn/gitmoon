fs = require 'fs'
regexp = require('xregexp').XRegExp

extractUsage = (str) ->
	exp = regexp "(var)?\\s*?(\\w*?)\\s*?=\\s*?require\\(?[\\s'\"]+(\\w|-)+?[\\s'\"]+\\)?", "gm"
	res = []
	variables = {}
	regexp.forEach str, exp, (match, i) ->		
		#console.log match[2]
		variables[match[2]] = ""

		
	for i of variables	
		match = extractModuleUsage str, i
		res = res.concat match	
	res
    
extractModuleUsage = (str, variable) ->		
	res = []
	exp = regexp "\\s+#{variable}\\.|\\s+new #{variable}(\s|\\()+", "gm"
	regexp.forEach str, exp, (match, i) ->										
		snippet = getArea str, match.index, variable, 4		
		res.push {module: variable, code: snippet}	
	res	

getArea = (text, position, bold, num_of_lines) ->	
	before = text.substring 0, position		
	i = num_of_lines
	start = 0
	pos = before.lastIndexOf "\n"		
	while pos!=-1 and pos!=0 and i>0
		start = pos
		before = text.substring 0, pos-1
		pos = before.lastIndexOf "\n"				
		start=0 if pos==-1
		i--
	
	i = num_of_lines
	end = text.length-1
	pos = text.indexOf "\n", position	
	while pos!=-1 and i>0
		end = pos
		pos = text.indexOf "\n", end+1
		i--
		
	res = text.substring start, end
	re = new RegExp(bold,"g");
	res = res.replace(re, "<b>" + bold + "</b>")
	res


str = fs.readFileSync('c:/temp/node._coffee.txt').toString()
res = extractUsage str
console.log "#{r.module} : #{r.code}\n******\n" for r in res
