(function executeRule(current, previous /*null when async*/) {
	
	var config = global.DeploymentPlanUtils.createDeploymentPlanConfig(current);
	
	//disable running of additional workflows
	current.setWorkflow(false);
	
	//if config is not an object - deployment plan is unusable
	if(!config) {
		gs.addErrorMessage('Deployment plan has errors in its configuration. Please ensure Deployment Plan and its Deployment Steps have all mandatory fields correctly filled in.');
		current.setAbortAction(true);
		return;
	}
	
	current.u_config = JSON.stringify(config, null, 4);
	
})(current, previous);