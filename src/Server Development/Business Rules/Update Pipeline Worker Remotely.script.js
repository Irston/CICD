(function executeRule(current, previous /*null when async*/) {
	var typeUtils = global.TypeUtils;
	var deploymentPlanUtils = global.DeploymentPlanUtils;
	var Template = global.StringTemplate;
	var plUtils = global.PipelineUtils;

	//if update is not from current instance or is from origin env- don't resend
	if(current.u_current_env + '' != plUtils.getCurrentInstanceAddress()) {
		return;
	}
	
	var JSONConfig = current.u_deployment_config + '';
	var config = (typeUtils.isJSONString(JSONConfig) && JSON.parse(JSONConfig)) || null;

	//if config cannot be parsed - log entry cannot be sent remotely
	if (!config) {
		return;
	}

	var targetEnvs = deploymentPlanUtils.getPreviousEnvsFromConfig(config);

	typeUtils.isArray(targetEnvs) &&
		targetEnvs.forEach(function(step) {
			plUtils.registerWorkerRemotely(current, {
				address: step.envConfig.envAddress,
				username: step.envConfig.auth.username,
				password: new GlideEncrypter().decrypt(step.envConfig.auth.password)
			});
		});
})(current, previous);
