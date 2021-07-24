(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var grUtils = global.GlideRecordUtils;
    var Template = global.StringTemplate;

    var currentInstanceAddress = global.PipelineEnvUtils.currentInstanceAddress;

    var ENTRIES_AWAITING_TRANSFER_TABLE = 'u_entries_awaiting_transfer';

    var data = request.body.data;

    if (!data) {
        throw 'Request body is not valid.';
    }

    try {
        var entryAwaitingTransferRec = grUtils.insertRecord(
            ENTRIES_AWAITING_TRANSFER_TABLE,
            data
        );

        if (!entryAwaitingTransferRec) {
            throw 'Error creating deployment entry awaiting transfer';
        }

        response.setStatus(200);
        response.setBody({
            status: 'success',
            message: Template.inject(
                'Successfully added deployment {{number}} to awaiting transfer in {{instance}}',
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
