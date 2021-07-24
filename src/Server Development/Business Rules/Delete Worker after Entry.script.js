(function executeRule(current, previous /*null when async*/) {
	
	global.GlideRecordUtils
		.find('u_pipeline_worker')
		.where('u_deployment_entry', current.sys_id + '')
		.exec()
		.deleteRecords();

})(current, previous);