(function executeRule(current, previous /*null when async*/) {

	var typeUtils = global.TypeUtils;
	var deploymentPlanUtils = global.DeploymentPlanUtils;
	var Template = global.StringTemplate;
	var plUtils = global.PipelineUtils;
	
	var JSONConfig = current.u_deployment_config + '';
	var config = (typeUtils.isJSONString(JSONConfig) && JSON.parse(JSONConfig)) || null;

	//if config cannot be parsed - log entry cannot be sent remotely
	if (!config || config.originEnv != plUtils.getCurrentInstanceAddress()) {
		return;
	}

	plUtils.updateDeploymentEntry({
		sys_id: config.deploymentEntry.sysId,
		u_state: current.u_state + '',
		u_manual_investigation_link: current.u_manual_investigation_link + ''
	});

})(current, previous);