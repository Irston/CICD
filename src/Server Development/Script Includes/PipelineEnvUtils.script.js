var PipelineEnvUtils = (function () {
    var __envTypes = {
        DEV: 'Development',
        PROD: 'Production',
        TEST: 'Test',
        UAT: 'User Acceptance Testing',
    };

    var __CURRENT_ENV_ADDRESS = (function () {
        var servletUri = gs.getProperty('glide.servlet.uri');

        return servletUri.slice(0, servletUri.length - 1);
    })();
    var __CURRENT_ENV_TYPE = gs.getProperty('ci.cd.pipeline.env.type') + '';
    var __CURRENT_ENV_RUN_TESTS =
        gs.getProperty('ci.cd.pipeline.run.tests') + '' == 'true';

    function __canCurrentEnvRunTests() {
        return __CURRENT_ENV_TYPE != __envTypes.PROD && __CURRENT_ENV_RUN_TESTS;
    }

    function __getCurrentEnvRecord() {
        var envRecord;
        global.GlideRecordUtils.findOne('u_environments')
            .where('u_env_address', __CURRENT_ENV_ADDRESS)
            .exec(function (record) {
                envRecord = record;
            });

        return envRecord;
    }

    return {
        currentInstanceAddress: __CURRENT_ENV_ADDRESS,
        canCurrentEnvRunTests: __canCurrentEnvRunTests,
        getCurrentEnvRecord: __getCurrentEnvRecord,
    };
})();
