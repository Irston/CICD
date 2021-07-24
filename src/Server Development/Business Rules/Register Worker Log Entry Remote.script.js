(function executeRule(current, previous /*null when async*/) {
	//if this is not the source env - do not send to target envs (avoid duplicating log entries)
	if (gs.getProperty('glide.servlet.uri') != current.u_source_environment + '/') {
		return;
	}

	var typeUtils = global.TypeUtils;
	var deploymentPlanUtils = global.DeploymentPlanUtils;
	var Template = global.StringTemplate;
	var Request = global.RESTRequest;
	var plUtils = global.PipelineUtils;

	var JSONConfig = current.u_pipeline_worker.u_deployment_config + '';
	var config = (typeUtils.isJSONString(JSONConfig) && JSON.parse(JSONConfig)) || null;

	//if config cannot be parsed - log entry cannot be sent remotely
	if (!config) {
		return;
	}

	var targetEnvs = deploymentPlanUtils.getPreviousEnvsFromConfig(config);

	typeUtils.isArray(targetEnvs) &&
		targetEnvs.forEach(function(step) {
			Request.post(
				{
					endpoint: Template.inject(
						'{{address}}/api/zjsc/ci_cd_pipeline_api/worker_log_entry',
						{
							address: step.envConfig.envAddress
						}
					),
					body: {
						u_type: current.u_type + '',
						u_message: current.u_message + '',
						u_pipeline_worker: current.u_pipeline_worker + '',
						u_source_environment: plUtils.getCurrentInstanceAddress()
					},
					auth: {
						username: step.envConfig.auth.username,
						password: new GlideEncrypter().decrypt(step.envConfig.auth.password)
					}
				},
				function(err, body) {
					// success/fail silently
				}
			);
		});
})(current, previous);
