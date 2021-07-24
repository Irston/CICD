(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var grUtils = global.GlideRecordUtils;
    var plUtils = global.PipelineUtils;
    var Template = global.StringTemplate;

    var DEPLOYMENT_ENTRY_TABLE = 'u_deployment_entry';

    var data = request.body.data;

    if (!data) {
        throw 'Request body is not valid.';
    }

    try {
        var currentInstanceAddress = plUtils.getCurrentInstanceAddress();
        var result = grUtils
            .findOne(DEPLOYMENT_ENTRY_TABLE)
            .where('sys_id', data.sys_id)
            .or('u_number', data.u_number)
            .exec()
            .updateRecords(data);

        if (!result) {
            throw Template.inject(
                "Couldn't update Deployment Entry ({{number}}) on {{env}}",
                {
                    number: data.u_number,
                    env: currentInstanceAddress,
                }
            );
        }

        response.setStatus(200);
        response.setBody({
            status: 'success',
            message: Template.inject(
                'Successfully updated Deployment Entry {{number}} in {{instance}}',
                {
                    number: data.u_number,
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
