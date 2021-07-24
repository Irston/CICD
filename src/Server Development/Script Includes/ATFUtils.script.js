var ATFUtils = (function () {
    var typeUtils = global.TypeUtils;
    var grUtils = global.GlideRecordUtils;
    var Template = global.StringTemplate;

    var testRunner = new sn_atf.ExecuteUserTest();
    var __definition = Class.create();
    __definition.__TEST_STATES = {
        Pending: 0,
        Running: 1,
        Successful: 2,
        Failed: 3,
        Cancelled: 4,
    };
    __definition.__EXECUTION_TRACKER_TABLE = 'sys_execution_tracker';
    __definition.prototype = {
        initialize: function (
            /* string or array */ testIds,
            /* string or array */ testExecIds
        ) {
            if (typeUtils.isString(testIds)) {
                this.tests = testIds.split(',');
            } else if (typeUtils.isArray(testIds)) {
                this.tests = testIds;
            } else {
                this.tests = null;
            }

            if (typeUtils.isString(testExecIds)) {
                this.trackerIds = testExecIds.split(',');
            } else if (typeUtils.isArray(testExecIds)) {
                this.trackerIds = testExecIds;
            } else {
                this.trackerIds = undefined;
            }

            return this;
        },
        getTrackerIds: function () {
            return this.trackerIds;
        },
        getTestIds: function () {
            return this.tests;
        },
        runTests: function () {
            if (!this.tests) {
                throw Template.inject('No tests were found');
            }

            var notFoundTests = [];
            // array of test exec tracker sys_ids
            this.trackerIds = this.tests
                .map(function (test) {
                    try {
                        return testRunner
                            .setCapturePageData(test, true)
                            .setTestRecordSysId(test)
                            .start();
                    } catch (error) {
                        notFoundTests.push(test);
                        return null;
                    }
                })
                .filter(Boolean);
            if (notFoundTests.length != 0) {
                throw Template.inject(
                    'Tests with ids [{{testIds}}] were not found/failed being executed.',
                    {
                        testIds: notFoundTests.join(','),
                    }
                );
            }
            return this;
        },
        gatherResults: function () {
            if (!this.trackerIds) {
                throw 'There are no test tracker ids to get results of';
            }

            this.results = grUtils
                .find(__definition.__EXECUTION_TRACKER_TABLE)
                .where('sys_id', 'IN', this.trackerIds.join(','))
                .exec()
                .map(function (record) {
                    return {
                        testName: record.source.name + '',
                        testSysId: record.source.sys_id + '',
                        msg: record.message + '',
                        state: record.state + '',
                        result: record.result + '',
                        details: record.detail_message + '',
                        execTrackerId: record.sys_id + '',
                    };
                });

            if (!this.results) {
                throw Template.inject(
                    'Failed collecting results for runned tests with execution tracker ids: [{{trackerIds}}]',
                    {
                        trackerIds: this.trackerIds,
                    }
                );
            }

            return this;
        },
        hasError: function () {
            if (!this.results) {
                throw 'Cannot check for error. Results missing. Check if you called method (gatherResults) to collect the results';
            }

            this.error = this.results.some(function (res) {
                return res.state == __definition.__TEST_STATES.Failed;
            });

            return this.error;
        },
        isResultSuccessfull: function () {
            if (!this.results) {
                throw 'Cannot check if tests finished successfull. Results missing. Check if method (gatherResults) was called to collect the results';
            }

            this.isSuccessfull = !this.results.some(function (res) {
                return res.state != __definition.__TEST_STATES.Successful;
            });

            return this.isSuccessfull;
        },
        collectFailedTestsInfo: function () {
            if (!this.results) {
                throw 'Cannot check if tests finished successfull. Results missing. Check if method (gatherResults) was called to collect the results';
            }

            var atfResultIds = this.results
                .filter(function (testRes) {
                    return (
                        testRes.state != __definition.__TEST_STATES.Successful
                    );
                })
                .map(function (testRes) {
                    return JSON.parse(testRes.result).result_id;
                })
                .join(',');

            var failedTestsOutput = grUtils
                .find('sys_atf_test_result')
                .where('sys_id', 'IN', atfResultIds)
                .exec()
                .map(function (rec) {
                    return Template.inject('{{testName}}\n{{testOutput}}', {
                        testName: rec.test_name + '',
                        testOutput: rec.output + '',
                    });
                })
                .join('\n\n');

            return failedTestsOutput;
        },
        hasFinished: function () {
            if (!this.trackerIds) {
                throw 'Cannot check if tests finished. Tracker ids of running tests are missing. Check if method (runTests) was called to run the tests';
            }

            var aggTracker = new GlideAggregate(
                __definition.__EXECUTION_TRACKER_TABLE
            );
            aggTracker.addEncodedQuery(
                'sys_idIN' +
                    this.trackerIds +
                    '^state=' +
                    __definition.__TEST_STATES.Pending +
                    '^ORstate=' +
                    __definition.__TEST_STATES.Running
            );
            aggTracker.addAggregate('COUNT');
            aggTracker.query();
            aggTracker.next();

            return aggTracker.getAggregate('COUNT') == 0 ? true : false;
        },

        type: 'ATFUtils',
    };

    return __definition;
})();
