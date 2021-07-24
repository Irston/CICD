(function executeRule(current, previous /*null when async*/) {
	var planRecord = current.u_deployment_plan.getRefRecord();

	global.GlideRecordUtils.updateRecord(
		planRecord,
		{
			u_config: JSON.stringify(global.DeploymentPlanUtils.createDeploymentPlanConfig(planRecord), null, 4)
		},
		{
			setWorkflow: false
		}
	);
	
})(current, previous);
