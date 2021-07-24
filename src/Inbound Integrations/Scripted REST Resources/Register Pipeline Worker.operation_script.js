(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var plUtils = global.PipelineUtils;
    var Template = global.StringTemplate;

    var reqBody = request.body.data;

    try {
        var worker = plUtils.registerWorker(reqBody);
        var currentInstanceAddress = plUtils.getCurrentInstanceAddress();

        if (!worker) {
            throw Template.inject(
                'Creating/ updating worker {{number}} in {{instance}} not successful',
                {
                    number: reqBody.u_number,
                    instance: currentInstanceAddress,
                }
            );
        }

        response.setStatus(200);
        response.setBody({
            status: 'success',
            message: Template.inject(
                'Successfully created/ updated {{number}} in {{instance}}',
                {
                    number: reqBody.u_number,
                    instance: currentInstanceAddress,
                }
            ),
            currentEnv: currentInstanceAddress,
        });

        //log that worker has been registered
        plUtils.info(
            {
                u_message: Template.inject(
                    'Successfully registered/ edited Worker {{num}} in {{address}}',
                    {
                        num: worker.u_number + '',
                        address: currentInstanceAddress,
                    }
                ),
                u_source_environment: currentInstanceAddress,
            },
            worker
        );
    } catch (err) {
        response.setStatus(500);
        response.setBody({
            status: 'error',
            message: err,
        });
    }
})(request, response);
