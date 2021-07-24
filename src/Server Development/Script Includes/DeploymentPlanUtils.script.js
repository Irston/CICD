var DeploymentPlanUtils = (function () {
    var grUtils = global.GlideRecordUtils;
    var typeUtils = global.TypeUtils;
    var plEnvUtils = global.PipelineEnvUtils;

    var __DEPLOYMENT_PLAN_TABLE = 'u_deployment_plan';
    var __DEPLOYMENT_STEP_TABLE = 'u_deployment_step';
    var __BASIC_AUTH_TABLE = 'sys_auth_profile_basic';

    function __createDeploymentPlanConfig(/*GlideRecord or string*/ plan) {
        if (!plan) {
            return null;
        }

        //assign plan record or retrieve it
        var planRecord = (grUtils.isGlideRecord(plan) && plan) || null;

        !planRecord &&
            grUtils
                .findOne(__DEPLOYMENT_PLAN_TABLE)
                .where('sys_id', plan + '')
                .or('u_name', plan + '')
                .exec(function (record) {
                    planRecord = record;
                });

        //if plan record is not retrieved - config cannot be built
        if (!planRecord) {
            return null;
        }

        var currentEnv = plEnvUtils.getCurrentEnvRecord();
		
        if (!currentEnv) {
            return null;
        }

        var deploymentSteps = grUtils
            .find(__DEPLOYMENT_STEP_TABLE)
            .where('u_deployment_plan', planRecord.sys_id + '')
            .exec()
            .map(function (stepRecord) {
                return {
                    u_name: stepRecord.u_name + '',
                    u_tests: stepRecord.u_tests + '',
                    u_env_address: stepRecord.u_environment.u_env_address + '',
                    u_uat_test_user_reference: stepRecord.u_uat_test_user_reference + '',
                    u_uat_test_group_reference: stepRecord.u_uat_test_group_reference + '',
                    uatTargetEnv:
                        stepRecord.u_uat_target_environment + ''
                            ? {
                                  envAddress:
                                      stepRecord.u_uat_target_environment
                                          .u_env_address + '',
                                  auth: {
                                      username:
                                          stepRecord.u_uat_target_environment
                                              .u_auth_profile.username + '',
                                      password:
                                          stepRecord.u_uat_target_environment
                                              .u_auth_profile.password + '',
                                  },
                              }
                            : '',
                };
            });

        var config = {
            originEnv:
                currentEnv.u_env_address + '' ||
                plEnvUtils.currentInstanceAddress,
            originEnvAuth: {
                username: currentEnv.u_auth_profile.username + '',
                password: currentEnv.u_auth_profile.password + '',
            },
			changeRequest: '',
            deploymentSteps: grUtils
                .find('u_deployment_path_step')
                .where('u_deployment_path', planRecord.u_deployment_path + '')
                .sort('u_order')
                .exec()
                .map(function (pathStep) {
                    var deploymentStep;
                    deploymentSteps.some(function (step) {
                        if (
                            step.u_env_address ==
                            pathStep.u_environment.u_env_address + ''
                        ) {
                            deploymentStep = step;
                            return true;
                        }

                        return false;
                    });

                    return {
                        name:
                            deploymentStep.u_name ||
                            pathStep.u_environment.u_env_address + '',
                        order: pathStep.u_order + '',
                        tests: deploymentStep.u_tests,
                        uat: {
                            targetEnvConfig: deploymentStep.uatTargetEnv,
                            uatAssignee: deploymentStep.u_uat_test_user_reference,
                            uatAssignmentGroup: deploymentStep.u_uat_test_group_reference,
                        },
                        releaseWindows: (function () {
                            return grUtils
                                .find('u_deployment_release_windows')
                                .where(
                                    'sys_id',
                                    'IN',
                                    pathStep.u_release_windows + ''
                                )
                                .exec()
                                .map(function (releaseWindow) {
                                    return {
                                        startDay:
                                            releaseWindow.u_start_day + '',
                                        startTime: releaseWindow.u_start_hour.getDisplayValue(),
                                        endDay: releaseWindow.u_end_day + '',
                                        endTime: releaseWindow.u_end_hour.getDisplayValue(),
                                    };
                                });
                        })(),
                        envConfig: {
                            envAddress:
                                pathStep.u_environment.u_env_address + '',
                            auth: {
                                username:
                                    pathStep.u_environment.u_auth_profile
                                        .username + '',
                                password:
                                    pathStep.u_environment.u_auth_profile
                                        .password + '',
                            },
                        },
                    };
                })
                .filter(Boolean),
        };

        return config;
    }

    function __getPreviousEnvsFromConfig(/*object or JSON string*/ c) {
        if (!c) {
            return null;
        }

        var config = (typeUtils.isJSONString(c) && JSON.parse(c)) || c;

        var currentEnv = global.PipelineUtils.getCurrentInstanceAddress();
        var passCurrent = false;

        var deploymentSteps = config && config.deploymentSteps;

        deploymentSteps.unshift({
            envConfig: {
                envAddress: config.originEnv,
                auth: {
                    username: config.originEnvAuth.username,
                    password: config.originEnvAuth.password,
                },
            },
        });

        //get authentication information about all previous instances
        return (
            deploymentSteps
                .map(function (step) {
                    if (
                        passCurrent ||
                        step.envConfig.envAddress == currentEnv
                    ) {
                       passCurrent = true;
                        return false;
                    }

                    return {
                        envConfig: step.envConfig,
                    };
                })
                .filter(function (step) {
                    return step.envConfig ? true : false;
                })
                .filter(function (env, index, self) {
                    return self.indexOf(env) == index;
                }) || null
        );
    }

    return {
        createDeploymentPlanConfig: __createDeploymentPlanConfig,
        getPreviousEnvsFromConfig: __getPreviousEnvsFromConfig,
    };
})();
