(function executeRule(current, previous /*null when async*/) {

	global.GlideRecordUtils.find('u_deployment_path_step')
		.where('u_deployment_path', current + '')
		.exec()
		.deleteRecords();

})(current, previous);