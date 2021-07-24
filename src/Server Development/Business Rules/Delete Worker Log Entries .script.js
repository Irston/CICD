(function executeRule(current, previous /*null when async*/) {
	
	global.GlideRecordUtils
		.find('u_worker_log_entry')
		.where('u_pipeline_worker', current.sys_id + '')
		.exec()
		.deleteRecords();

})(current, previous);