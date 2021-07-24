function triggerDeployment() {
    g_form.addInfoMessage('Validating deployment. Please wait..');

    //validate deployment config before we trigger deployment
    glideAjaxRequest('PipelineClientUtils', 'validateDeploymentPlanConfig', {
        deploymentPlanId: g_form.getValue('u_deployment_plan'),
    }).then(function (answer) {
        g_form.clearMessages();
        //if config is not a valid JSON - deployment cannot init
        if (answer + '' != 'true') {
            g_form.addErrorMessage(
                'Cannot deploy using current deployment plan: Deployment plan config is not a valid JSON. Please check the plan and its steps for errors.'
            );
            return;
        }

        g_form.addInfoMessage(
            'Validating deployment complete. Creating worker..'
        );

        //trigger deployment
        glideAjaxRequest('PipelineClientUtils', 'deployEntry', {
            deploymentEntryId: g_form.getUniqueValue(),
        }).then(function (answer) {
            g_form.clearMessages();

            //if answer is null - worker creation failed
            if (answer + '' == 'null') {
                g_form.addErrorMessage(
                    'Deployment trigger failed: unable to create a pipeline worker.'
                );
                return;
            }

            g_form.addInfoMessage(
                'Deployment has been triggered. Refresh page to see active workers.'
            );

            if (
                answer != 'success' &&
                confirm(
                    'Deployment has been triggered. Do you wish to be redirected to the created pipeline worker?'
                )
            ) {
                top.window.location = answer;
            }
        });
    });
}
