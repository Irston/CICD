function terminate() {
	if(confirm('Are you sure you want to terminate the deployment?')) {
		
		glideAjaxRequest('PipelineClientUtils', 'terminateDeployment', {
            deploymentEntryId: g_form.getUniqueValue(),
			rollback: confirm('Terminating deployment has been triggered. Do you wish to rollback the changes?')
        }).then(function (answer) {});
		
	} else {
		return false;
	}
}