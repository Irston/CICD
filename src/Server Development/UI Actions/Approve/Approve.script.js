function approve() {
    g_form.clearMessages();

    gsftSubmit(null, g_form.getFormElement(), 'approve_deployment');
}

if (typeof window == 'undefined') approveDeployment();

function approveDeployment() {
    var RESTRequest = global.RESTRequest;
    var Template = global.StringTemplate;
    var UATUtils = global.UATUtils;

    var targetEnvConfig =
        current.u_sender_env_config + ''
            ? JSON.parse(current.u_sender_env_config + '')
            : null;

    if (!targetEnvConfig) {
        gs.addErrorMessage("There was an error getting the sender's config");
        return;
    }

    current.u_state = 'approved';
	
	var result = UATUtils.updateTrackerOnEnv({
		u_deployment_entry_id: current.u_deployment_id + '',
		u_uat_state: current.u_state + ''
	}, targetEnvConfig);

    if (!result) {
        return;
    }

    current.update();
    gs.addInfoMessage(
        'Deplyoment ' + current.u_deployment_number + ' approved.'
    );
    action.setRedirectURL(current);
}
