(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

	var grUtils = global.GlideRecordUtils;
	// implement resource here
	var requestBody = request.body.data;
	var deploymentEntry = requestBody.deploymentEntryId;

	//Get the workflow context of the pipelineworker
	var grDepEntry = new GlideRecord('u_deployment_entry_tracker');
	grDepEntry.addEncodedQuery('u_deployment_entry_id='+deploymentEntry);
	grDepEntry.query();
	if(grDepEntry.next()){
		var workflowUtil = new Workflow();
		var grWorkflowContext = new GlideRecord('wf_context');
		grWorkflowContext.addEncodedQuery('active=true^id='+grDepEntry.getValue('u_pipeline_worker'));
		grWorkflowContext.query();
		if(grWorkflowContext.next()){
			workflowUtil.cancelContext(grWorkflowContext);
		}	
		if(grDepEntry.getValue('u_local_update_set') && grDepEntry.getDisplayValue('u_local_update_set')!=''){
			//trigger the backout process workflow
			grUtils.findOne('u_pipeline_worker')
				.where('sys_id',grDepEntry.getValue('u_pipeline_worker'))
				.exec(function(record) {
				var w = new Workflow();
				var context = w.startFlow('de030edd1b2028182a2d202e6e4bcb2c', record);
			});	
		}
		else{
			grUtils.findOne('u_pipeline_worker')
				.where('sys_id',grDepEntry.getValue('u_pipeline_worker'))
				.exec(function(record) {
				record.u_state='cancelled';
				record.update();
			});
			grUtils.updateRecord(grDepEntry,{
				u_state:'cancelled',
				u_rejection_note:'Deployment was cancelled by user'
			});
		}
	}
	else{
		//return 404 deployment entry not found
	}

	return 'Success';
})(request, response);