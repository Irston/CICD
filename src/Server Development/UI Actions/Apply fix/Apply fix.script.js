(function () {
	var __DEPLOYMENT_ENTRY_TABLE = 'u_deployment_entry';
	var grUtils = global.GlideRecordUtils;

	var deploymentEntryRec = grUtils.insertRecord(__DEPLOYMENT_ENTRY_TABLE, {
			u_deployment_plan: current.u_deployment_plan + ''
		});
	
		if(!deploymentEntryRec) {
			return;
		}

		
		deploymentEntryRec.u_parent.u_number = current.u_number + '';
		deploymentEntryRec.u_parent.sysId = current.sys_id + '';
		deploymentEntryRec.u_parent.u_description = current.u_description + '';
	
		var link = deploymentEntryRec.update()
			? gs.getProperty("glide.servlet.uri") + deploymentEntryRec.getLink(false)
			: null;
	
		link && action.setRedirectURL(link);
})();