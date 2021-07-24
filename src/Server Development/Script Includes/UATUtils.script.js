var UATUtils = (function () {
    var grUtils = global.GlideRecordUtils;
    var Template = global.StringTemplate;
    var RESTRequest = global.RESTRequest;
    var Encrypter = new GlideEncrypter();

    function __raiseTaskOnEnv(taskData, envConfig) {
        if (!taskData || !envConfig) {
            return null;
        }

        var decrypted = Encrypter.decrypt(envConfig.auth.password);

        return RESTRequest.post(
            {
                endpoint: Template.inject(
                    '{{nextEnv}}/api/zjsc/ci_cd_pipeline_api/testing_task',
                    {
                        nextEnv: envConfig.envAddress,
                    }
                ),
                auth: {
                    username: envConfig.auth.username,
                    password: decrypted,
                },
                body: taskData,
            },
            function (error, resBody) {
                if (error) {
                    // log
                    return false;
                }

                return true;
            }
        );
    }
	
	function __updateTrackerOnEnv(data, targetEnvConfig) {
		var decrypted = Encrypter.decrypt(targetEnvConfig.auth.password);

        return RESTRequest.put(
            {
                endpoint: Template.inject(
                    '{{envAddress}}/api/zjsc/ci_cd_pipeline_api/deployment_entry_tracker',
                    {
                        envAddress: targetEnvConfig.envAddress,
                    }
                ),
                auth: {
                    username: targetEnvConfig.auth.username,
                    password: decrypted,
                },
                body: data,
            },
            function (error, resBody) {
                if (error) {
                    gs.addErrorMessage(
                        'Error registering deployment for transfer'
                    );
                    return false;
                }

                return true;
            }
        );
	}

    function __registerDeploymentEntryAwaitingTransferToEnv(
        data,
        targetEnvConfig
    ) {
        var decrypted = Encrypter.decrypt(targetEnvConfig.auth.password);

        return RESTRequest.post(
            {
                endpoint: Template.inject(
                    '{{envAddress}}/api/zjsc/ci_cd_pipeline_api/entry_awaiting_transfer',
                    {
                        envAddress: targetEnvConfig.envAddress,
                    }
                ),
                auth: {
                    username: targetEnvConfig.auth.username,
                    password: decrypted,
                },
                body: data,
            },
            function (error, resBody) {
                if (error) {
                    gs.addErrorMessage(
                        'Error registering deployment for transfer'
                    );
                    return false;
                }

                return true;
            }
        );
    }

    function __isUserAnApprover(approverId, assignmentGroupId) {
        var currentUserId = gs.getUserID();

        if (currentUserId == approverId) {
            return true;
        }

        return (
            grUtils
                .findOne('sys_user_grmember')
                .where('user', currentUserId)
                .and('group', assignmentGroupId)
                .exec(function (count) {
                    return count;
                }) == 1
        );
    }

    return {
        raiseTaskOnEnv: __raiseTaskOnEnv,
        registerDeploymentEntryAwaitingTransferToEnv: __registerDeploymentEntryAwaitingTransferToEnv,
        isUserAnApprover: __isUserAnApprover,
		updateTrackerOnEnv: __updateTrackerOnEnv
    };
})();
