var glideAjaxRequest = function(/*string*/ scriptInclude, /*string*/ methodName, /*string*/ params, /*optional function*/ onAnswer) {
	var req = new GlideAjax(scriptInclude);
	req.addParam('sysparm_name', methodName);
	if(params) {
		for(var paramName in params) {
			paramName != 'sysparm_name' && req.addParam(paramName, params[paramName]);
		}
	}
	
	if(typeof onAnswer == 'function') {
		return req.getXMLAnswer(onAnswer);
	}
	
	return {
		then: function(onA) {
			return req.getXMLAnswer(onA);
		}
	};
};