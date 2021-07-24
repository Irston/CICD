(function executeRule(current, previous /*null when async*/) {
	var typeUtils = global.TypeUtils;
	var grUtils = global.GlideRecordUtils;
	var plUtils = global.PipelineUtils;
	var Template = global.StringTemplate;

	var CURRENT_ENV = plUtils.getCurrentInstanceAddress();

	var configJSON = current.u_deployment_config + '';
	var config = typeUtils.isJSONString(configJSON) && JSON.parse(configJSON);

	//if config is not a valid json - it is unusable, set error on the worker
	if (!config) {
		grUtils.updateRecord(current, {
			u_state: 'error'
		});

		plUtils.error(
			{
				u_message: Template.inject('Cannot read configuration from Worker [{{num}}]', {
					num: current.u_number + ''
				}),
				u_source_environment: CURRENT_ENV
			},
			current
		);
		return;
	}

	var originEnv = config.originEnv;

	//if worker is created on the origin env - push it in the pipeline
	if (originEnv == CURRENT_ENV) {
		var step = config.deploymentSteps[0] || null;

		(step &&
			plUtils.registerWorkerRemotely(current, {
				address: step.envConfig.envAddress,
				username: step.envConfig.auth.username,
				password: new GlideEncrypter().decrypt(step.envConfig.auth.password)
			})) ||
			//if pushing fails - set error to current record (reasons logged from registerWorkerRemotely)
			grUtils.updateRecord(current, {
				u_state: 'error'
			});
	} else {
		//if worker is created from another env - run deployment wf
		//get deployment wf sys_id
		var wfId = null;
		var wfName = 'CI/CD Pipeline Deployment Step v2';//CI/CD Pipeline Deployment Step

		grUtils
			.findOne('wf_workflow')
			.where('name', wfName) 
			.exec(function(wfRecord) {
				wfId = wfRecord.sys_id + '';
			});

		//cannot find wf - log it and terminate
		if(!wfId) {
			grUtils.updateRecord(current, {
				u_state: 'error'
			});
			plUtils.error({
				u_message: 'Cannot run ' + wfName + ' - workflow not found on the environment',
				u_source_environment: CURRENT_ENV
			}, current);
			return;
		}

		new Workflow().startFlow(wfId, current);

		plUtils.info({
			u_message: Template.inject('Worker registered on {{env}}. {{name}} workflow initialized.', {
				env: CURRENT_ENV,
				name: wfName
			}),
			u_source_environment: CURRENT_ENV
		});
	}
	
})(current, previous);
