function onLoad() {
	//Type appropriate comment here, and begin script below

	g_form.setReadOnly('u_atf_execution','true');
	//for citizen developers, default the deployment plan to citizen developer path
	var updateSet = g_form.getParameter('sysparm_updateset');
	if(updateSet&& updateSet!=''){
		g_form.setValue('u_update_set',updateSet);
	}
	g_form.setReadOnly('u_update_set','true');
	if(!g_user.hasRoleExactly('admin') && (g_user.hasRoleExactly('citizendeveloper_plus') || g_user.hasRoleExactly('citizendeveloper_pro'))){
		g_form.setMandatory('u_deployment_plan','false');
		g_form.setReadOnly('u_deployment_plan','true');
		g_form.showFieldMsg('u_deployment_plan','Updateset will be deployed with default Citizen Developer deployment plan','info');
	}
	else{
		g_form.setMandatory('u_deployment_plan','true');
		g_form.setVisible('u_deployment_plan','true');
	}
}