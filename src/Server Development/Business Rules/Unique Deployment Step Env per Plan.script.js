(function executeRule(current, previous /*null when async*/) {
	
	global.GlideRecordUtils.findOne(current.getTableName())
		.where('u_deployment_plan', current.u_deployment_plan + '')
		.and('sys_id', '!=', current.sys_id + '')
		.encoded('u_environment.u_env_address=' + current.u_environment.u_env_address)
		.exec(function(record) {
			gs.addErrorMessage('A deployment step can be configured for an environment only once per deployment plan.');
			current.setAbortAction(true);
		});
	
})(current, previous);
