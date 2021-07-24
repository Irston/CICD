function onLoad() {
   //Type appropriate comment here, and begin script below
   var formId = g_form.getParameter('sysparm_formid');
	if(formId){
		g_form.setValue('form',formId);
		g_form.setReadOnly('form',true);
	}
	else{
		g_form.setMandatory('auto_updateset_name',true);
	}
	var updateSetName = g_form.getParameter('sysparm_updatesetName');
	
	if(updateSetName){
		var msg=[];
		msg.push('The configurations will be captured in the updatesets:');
		msg.push(updateSetName.replace('CD Form Engine(G):','CD Form Engine(S):'));
		msg.push(updateSetName);
		
		g_form.setValue('auto_updateset_name',updateSetName.replace('CD Form Engine(G):','CD Form Engine${scope}:'));
		g_form.setReadOnly('auto_updateset_name',true);

		for(var i=0;i<msg.length; i++)
		{
		g_form.showFieldMsg("auto_updateset_name",msg[i],"info");

		}
	}
	else{
		g_form.setMandatory('auto_updateset_name',true);
	}
}