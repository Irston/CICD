var grUtils = global.GlideRecordUtils;
var PipelineReferenceQualifiers = Class.create();
PipelineReferenceQualifiers.prototype = {
    initialize: function () {},
    deploymentStepEnvironmentReferenceQualifier: function () {
        var envs = grUtils
            .find('u_deployment_path_step')
            .where(
                'u_deployment_path',
                current.u_deployment_plan.u_deployment_path + ''
            )
            .exec()
            .map(function (pathStep) {
                return pathStep.u_environment + '';
            })
            .join(',');

        return 'sys_idIN' + envs;
    },
    type: 'PipelineReferenceQualifiers',
};
