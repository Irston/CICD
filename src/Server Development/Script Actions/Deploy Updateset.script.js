(function() {
	//create a deployment entry
	var dpEntry = new GlideRecord('u_deployment_entry');
	if(dpEntry.get(current.getUniqueValue())){
		//deploy
		global.PipelineUtils.deployEntry(dpEntry);
	}
})();