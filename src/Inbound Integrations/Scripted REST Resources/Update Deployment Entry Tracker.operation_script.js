(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
	
     var grUtils = global.GlideRecordUtils;
    var Template = global.StringTemplate;

    var currentInstanceAddress = global.PipelineEnvUtils.currentInstanceAddress;

    var DEPLOYMENT_ENTRY_TRACKER_TABLE = 'u_deployment_entry_tracker';

    var data = request.body.data;

    if (!data) {
        throw 'Request body is not valid.';
    }

    try {
        var entryAwaitingTransferRec = grUtils.findOne(DEPLOYMENT_ENTRY_TRACKER_TABLE)
			.where('u_deployment_entry_id', data.u_deployment_entry_id)
			.exec()
			.updateRecords(
				data
			);

        if (!entryAwaitingTransferRec) {
            throw 'Error creating deployment entry awaiting transfer';
        }

        response.setStatus(200);
        response.setBody({
            status: 'success',
            message: Template.inject(
                'Successfully updated deployment {{number}}\'s tracker in {{instance}}',
                {
                    number: '',
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