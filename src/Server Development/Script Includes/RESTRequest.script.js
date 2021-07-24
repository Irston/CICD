var RESTRequest = (function () {
    var typeUtils = global.TypeUtils;

    var __DEFAULT_CONTENT_HEADER = 'application/json';
    var __httpMethods = {
        POST: 'POST',
        GET: 'GET',
        PUT: 'PUT',
        PATCH: 'PATCH',
        DELETE: 'DELETE',
    };

    function __request(/*object*/ options, /*optional function*/ onResponse) {
        var req = new sn_ws.RESTMessageV2();
        req.setEndpoint(options.endpoint);
        options.authProfile &&
            req.setAuthenticationProfile(
                options.authProfile.type,
                options.authProfile.id
            );
        options.auth &&
            req.setBasicAuth(options.auth.username, options.auth.password);
        req.setHttpMethod(options.httpMethod || __httpMethods.GET);
        options.midServer && req.setMIDServer(options.midServer);

        //apply headers
        var headers = options.headers || {
            'Content-Type': __DEFAULT_CONTENT_HEADER,
            Accept: __DEFAULT_CONTENT_HEADER,
        };

        Object.keys(headers).forEach(function (headerName) {
            req.setRequestHeader(headerName, headers[headerName]);
        });

        options.body &&
            req.setRequestBody(
                (typeUtils.isString(options.body) && options.body) ||
                    (headers.Accept == __DEFAULT_CONTENT_HEADER
                        ? JSON.stringify(options.body)
                        : options.body + '')
            );

        var res = req.execute();

        if (!typeUtils.isFunction(onResponse)) {
            return res;
        }

        var hasError = res.getStatusCode().toString()[0] != '2';
        var resBody = res.getBody();

        var error = (hasError && resBody) || null;
        var body =
            (!hasError &&
                (typeUtils.isJSONString(resBody)
                    ? JSON.parse(resBody)
                    : resBody)) ||
            null;

        return onResponse(error, body);
    }

    function __requestWithMethod(
        /*string*/ httpMethod,
        /*object*/ options,
        /*function*/ onResponse
    ) {
        options.httpMethod = httpMethod;

        return __request(options, onResponse);
    }

    function __post(/*object*/ options, /*optional function*/ onResponse) {
        return __requestWithMethod(__httpMethods.POST, options, onResponse);
    }

    function __get(/*object*/ options, /*optional function*/ onResponse) {
        return __requestWithMethod(__httpMethods.GET, options, onResponse);
    }

    function __put(/*object*/ options, /*optional function*/ onResponse) {
        return __requestWithMethod(__httpMethods.PUT, options, onResponse);
    }

    function __patch(/*object*/ options, /*optional function*/ onResponse) {
        return __requestWithMethod(__httpMethods.PATCH, options, onResponse);
    }

    function __delete(/*object*/ options, /*optional function*/ onResponse) {
        return __requestWithMethod(__httpMethods.DELETE, options, onResponse);
    }

    return {
        request: __request,
        post: __post,
        get: __get,
        put: __put,
        patch: __patch,
        del: __delete,
    };
})();
