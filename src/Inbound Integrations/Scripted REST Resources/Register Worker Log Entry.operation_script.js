(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
	var plUtils = global.PipelineUtils;
	var Template = global.StringTemplate;
	
	var reqBody = request.body.data;
	
	try {
		var logEntry = plUtils.log(reqBody);
		
		if(!logEntry) {
			throw 'Error creating Worker Log Entry';
		}
		
		response.setStatus(200);
		response.setBody({
			status: 'success',
			message: 'Successfully created Worker Log Entry'
		});
		
	} catch(err) {
		response.setStatus(500);
		response.setBody({
			status: 'error',
			message: err
		});
	}
	
})(request, response);