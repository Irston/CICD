(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var grUtils = global.GlideRecordUtils;
    var plUtils = global.PipelineUtils;
    var Template = global.StringTemplate;

    var DEPLOYMENT_TEST_TASK_TABLE = 'u_deployment_test_task';

    var data = request.body.data;

    if (!data) {
        throw 'Request body is not valid.';
    }

    try {
        var currentInstanceAddress = plUtils.getCurrentInstanceAddress();
        var taskRec = grUtils.insertRecord(
            DEPLOYMENT_TEST_TASK_TABLE,
            data /*, { setWorkflow: false }*/
        );

        if (!taskRec) {
            throw Template.inject(
                "Couldn't raise a deployment test task on {{env}}",
                {
                    env: currentInstanceAddress,
                }
            );
        }

        response.setStatus(200);
        response.setBody({
            status: 'success',
            message: Template.inject(
                'Successfully created task {{number}} in {{instance}}',
                {
                    number: taskRec.number + '',
                    instance: currentInstanceAddress,
                }
            ),
            currentEnv: currentInstanceAddress,
        });
    } catch (err) {
        response.setStatus(500);
        response.setBody({
            status: 'error',
            message: err,
        });
    }
})(request, response);
