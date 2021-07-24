function reject() {
    g_form.clearMessages();

    if (
        g_form.getValue('u_reject_reason') == '' ||
        g_form.getValue('u_rejection_note') == ''
    ) {
        g_form.setVisible('u_reject_reason', true);
        g_form.setVisible('u_rejection_note', true);
        g_form.setMandatory('u_reject_reason', true);
        g_form.setMandatory('u_rejection_note', true);

        g_form.addErrorMessage(
            'Please fill in information regarding the rejection'
        );

        return false;
    }

    gsftSubmit(null, g_form.getFormElement(), 'reject_deployment');
}

if (typeof window == 'undefined') rejectDeployment();

function rejectDeployment() {
    var RESTRequest = global.RESTRequest;
    var Template = global.StringTemplate;
    var UATUtils = global.UATUtils;
    //Set the 'State' to 'Active', update and reload the record
    var targetEnvConfig =
        current.u_sender_env_config + ''
            ? JSON.parse(current.u_sender_env_config + '')
            : null;

    if (!targetEnvConfig) {
        gs.addErrorMessage("There was an error getting the sender's config");
        return;
    }

    current.u_state = 'rejected';

    var result = UATUtils.updateTrackerOnEnv(
        {
            u_uat_state: current.u_state + '',
            u_rejection_reason: current.u_reject_reason + '',
            u_rejection_note: current.u_rejection_note + '',
            u_deployment_entry_id: current.u_deployment_id + '',
        },
        targetEnvConfig
    );

    if (!result) {
        return;
    }

    current.update();
    gs.addInfoMessage(
        'Deplyoment ' + current.u_deployment_number + ' rejected.'
    );
    action.setRedirectURL(current);
}
