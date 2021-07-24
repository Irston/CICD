var GlideRecordUtils = (function () {
    //uses
    var TypeUtils = global.TypeUtils;

    var __isGlideRecord = TypeUtils.isGlideRecord;

    var __setFields = function (/*GlideRecord*/ record, /*object*/ fields) {
        if (!__isGlideRecord(record)) {
            return;
        }

        TypeUtils.isObject(fields) &&
            Object.keys(fields).forEach(function (fieldName) {
                if (fieldName == 'sys_id') {
                    record.setNewGuidValue(fields.sys_id + '');
                    return;
                }
                record[fieldName] = fields[fieldName] + '';
            });

        return record;
    };

    var __setWfAndAutoSys = function (
        /*GlideRecord*/ record,
        /*optional object*/ options
    ) {
        if (!__isGlideRecord(record)) {
            return;
        }

        if (TypeUtils.isObject(options)) {
            TypeUtils.isBoolean(options.autoSysFields) &&
                record.autoSysFields(options.autoSysFields);
            TypeUtils.isBoolean(options.setWorkflow) &&
                record.setWorkflow(options.setWorkflow);
        }

        return record;
    };

    var __insertRecord = function (
        /*string*/ tableName,
        /*object*/ fields,
        /*optional object*/ options
    ) {
        var record =
            options && options.secure
                ? new GlideRecordSecure(tableName)
                : new GlideRecord(tableName);

        __setFields(record, fields);
        __setWfAndAutoSys(record, options);

        return record.insert() ? record : null;
    };

    var __updateRecord = function (
        /*GlideRecord*/ record,
        /*object*/ fields,
        /*optional object*/ options
    ) {
        if (!__isGlideRecord(record)) {
            return null;
        }

        __setFields(record, fields);
        __setWfAndAutoSys(record, options);

        return record.update() ? record : null;
    };

    var __deleteRecord = function (/*GlideRecord*/ record, /*object*/ options) {
        if (!__isGlideRecord(record)) {
            return null;
        }

        __setWfAndAutoSys(record, options);

        return record.deleteRecord() ? true : false;
    };

    var __queryWithHandler = function (
        /*GlideRecord*/ records,
        /*function*/ handleRecord
    ) {
        if (!__isGlideRecord(records)) {
            return null;
        }
        if (!TypeUtils.isFunction(handleRecord)) {
            return records;
        }

        var count = 0;

        while (records.next()) {
            handleRecord(records, count);
            count++;
        }

        return count;
    };

    var __queryMapHandler = function (
        /*GlideRecord*/ records,
        /*function*/ createElement
    ) {
        if (!__isGlideRecord(records)) {
            return null;
        }
        var elementCreator = TypeUtils.isFunction(createElement)
            ? createElement
            : undefined;
        var result = [];

        __queryWithHandler(records, function (record, index) {
            result.push(
                (createElement && createElement(record, index)) || undefined
            );
        });

        return result;
    };

    var __getValuesHandler = function (
        /*GlideRecord*/ records,
        /*string or array*/ fieldNames
    ) {
        if (!fieldNames) {
            return __queryMapHandler(records);
        }
        var fNames = TypeUtils.isString(fieldNames)
            ? fieldNames.split(',').map(function (fieldName) {
                  return fieldName.trim();
              })
            : fieldNames;

        return (
            TypeUtils.isArray(fNames) &&
            __queryMapHandler(records, function (record) {
                var result = {};
                fNames.forEach(function (fieldName) {
                    result[fieldName] = record[fieldName] + '';
                });
                return result;
            })
        );
    };

    var __getDisplayValuesHandler = function (
        /*GlideRecord*/ records,
        /*string or array*/ fieldNames
    ) {
        if (!fieldNames) {
            return __queryMapHandler(records);
        }
        var fNames = TypeUtils.isString(fieldNames)
            ? fieldNames.split(',')
            : fieldNames;

        return (
            TypeUtils.isArray(fNames) &&
            __queryMapHandler(records, function (record) {
                var result = {};
                fNames.forEach(function (fieldName) {
                    result[fieldName] = TypeUtils.isFunction(
                        record[fieldName].getDisplayValue
                    )
                        ? record[fieldName].getDisplayValue() ||
                          record[fieldName] + ''
                        : record[fieldName] + '';
                });
                return result;
            })
        );
    };

    var __query = function (
        /*GlideRecord*/ records,
        /*optional function*/ handleRecords
    ) {
        if (!__isGlideRecord(records)) {
            return null;
        }
        records._query();

        if (!TypeUtils.isFunction(handleRecords)) {
            return {
                getGlideRecord: function () {
                    return records;
                },
                insertOrUpdate: function (/*object*/ fields) {
                    if (records.getRowCount() > 0) {
                        while (records.next()) {
                            __updateRecord(records, fields);
                        }
                        return records;
                    }

                    return __insertRecord(records.getTableName(), fields);
                },
                each: function (/*function*/ iterate) {
                    return __queryWithHandler(records, iterate);
                },
                forEach: function (/*function*/ iterate) {
                    return __queryWithHandler(records, iterate);
                },
                map: function (/*function*/ createElement) {
                    return __queryMapHandler(records, createElement);
                },
                then: function (/*function*/ afterQueryHandler) {
                    if (!TypeUtils.isFunction(afterQueryHandler)) {
                        return records;
                    }

                    return afterQueryHandler(records);
                },
                getValues: function (/*string or array*/ fieldNames) {
                    return __getValuesHandler(records, fieldNames);
                },
                getDisplayValues: function (/*string or array*/ fieldNames) {
                    return __getDisplayValuesHandler(records, fieldNames);
                },
                updateRecords: function (
                    /*object*/ fields,
                    /*object*/ options
                ) {
                    return (
                        __queryMapHandler(records, function (record) {
                            return __updateRecord(record, fields, options)
                                ? true
                                : false;
                        }).filter(function (actionSuccessful) {
                            return actionSuccessful;
                        }).length > 0
                    );
                },
                deleteRecords: function (/*object*/ options) {
                    return (
                        __queryMapHandler(records, function (record) {
                            return __deleteRecord(record, options);
                        }).filter(function (actionSuccessful) {
                            return actionSuccessful;
                        }).length > 0
                    );
                },
            };
        }

        return __queryWithHandler(records, handleRecords);
    };

    var __genericFindMethods = function (
        /*GlideRecord*/ record,
        /*GlideQueryCondition*/ query
    ) {
        return {
            and: function (
                /*string*/ fieldName,
                /*string*/ queryParamOne,
                /*string*/ queryParamTwo
            ) {
                var q = record.addQuery(
                    fieldName,
                    queryParamOne,
                    queryParamTwo
                );
                return __genericFindMethods(record, q);
            },
            where: function (
                /*string*/ fieldName,
                /*string*/ queryParamOne,
                /*string*/ queryParamTwo
            ) {
                var q = record.addQuery(
                    fieldName,
                    queryParamOne,
                    queryParamTwo
                );
                return __genericFindMethods(record, q);
            },
            or: function (
                /*string*/ fieldName,
                /*string*/ queryParamOne,
                /*string*/ queryParamTwo
            ) {
                query.addOrCondition(fieldName, queryParamOne, queryParamTwo);
                return __genericFindMethods(record, query);
            },
            encoded: function (/*string*/ encodedQuery) {
                record.addEncodedQuery(encodedQuery);
                return __genericFindMethods(record, query);
            },
            sort: function (/*string or array*/ fieldNames) {
                if (
                    !TypeUtils.isString(fieldNames) &&
                    !TypeUtils.isArray(fieldNames)
                ) {
                    return __genericFindMethods(record, query);
                }
                var fNames = TypeUtils.isString(fieldNames)
                    ? fieldNames.split(',')
                    : fieldNames;

                fNames.forEach(function (fieldName) {
                    if (fieldName[0] == '-') {
                        record.orderByDesc(
                            fieldName.substring(1, fieldName.length)
                        );
                        return;
                    }
                    record.orderBy(fieldName);
                });

                return __genericFindMethods(record, query);
            },
            limit: function (/*number*/ limit) {
                record.setLimit(limit);
                return __genericFindMethods(record, query);
            },
            query: function (/*optional function*/ handleRecords) {
                return __query(record, handleRecords);
            },
            exec: function (/*optional function*/ handleRecords) {
                return __query(record, handleRecords);
            },
        };
    };

    var __find = function (/*string*/ tableName, /*object*/ options) {
        var records =
            options && options.secure
                ? new GlideRecordSecure(tableName)
                : new GlideRecord(tableName);
        if (TypeUtils.isObject(options)) {
            __setWfAndAutoSys(records, options);
        }

        return __genericFindMethods(records, {});
    };

    var __findOne = function (/*string*/ tableName, /*object*/ options) {
        return __find(tableName, options).limit(1);
    };

    var __recordMeetsConditions = function (
        /*GlideRecord*/ record,
        /*string*/ conditions,
        /*boolean*/ strict
    ) {
        return GlideFilter.checkRecord(record, conditions, strict || false);
    };

    var __recordMeetsConditionsStrict = function (
        /*GlideRecord*/ record,
        /*string*/ conditions
    ) {
        return __meetsConditions(record, conditions, true);
    };

    return {
        insertRecord: __insertRecord,
        updateRecord: __updateRecord,
        deleteRecord: __deleteRecord,
        query: __query,
        isGlideRecord: __isGlideRecord,
        find: __find,
        findOne: __findOne,
        recordMeetsConditions: __recordMeetsConditions,
        recordMeetsConditionsStrict: __recordMeetsConditionsStrict,
    };
})();
