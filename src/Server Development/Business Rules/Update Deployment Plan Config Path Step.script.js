(function executeRule(current, previous /*null when async*/) {
	
	global.GlideRecordUtils.find('u_deployment_plan')
		.where('u_deployment_path', current.u_deployment_path + '')
		.exec(function(record) {
			record.u_config = JSON.stringify(global.DeploymentPlanUtils.createDeploymentPlanConfig(record), null, 4);
			record.setWorkflow(false);
			record.update();
		});
	
})(current, previous);