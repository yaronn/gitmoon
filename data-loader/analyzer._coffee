regexp = require('xregexp').XRegExp

extractUsage = (text) ->
	exp = regexp "(var)?\\s*?(\\w*?)\\s*?=\\s*?require\\(?[\\s'\"]+((\\w|-|\\.)+?)[\\s'\"]+\\)?", "gm"
	res = []
	history = {}
	regexp.forEach text, exp, (match, i) ->						
		var_name = match[2]
		if (!history[var_name])
			history[var_name] = "1"
			module_name = match[3]		
			match = extractModuleUsage text, var_name, module_name
			res = res.concat match		
	res
    
extractModuleUsage = (text, var_name, module_name) ->		
	res = []
	exp = regexp "\\s+#{var_name}\\.|\\s+new #{var_name}(\s|\\()+", "gm"
	regexp.forEach text, exp, (match, i) ->										
		snippet = getArea text, match.index, var_name, 4		
		res.push {module: module_name, var_name: var_name, code: snippet}	
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
	#res = res.replace(re, "<b>" + bold + "</b>")
	res

exports.extractUsage = extractUsage