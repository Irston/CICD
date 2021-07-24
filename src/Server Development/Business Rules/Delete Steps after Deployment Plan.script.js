(function executeRule(current, previous /*null when async*/) {
	
	global.GlideRecordUtils.find('u_deployment_step')
		.where('u_deployment_plan', current + '')
		.exec()
		.deleteRecords();

})(current, previous);