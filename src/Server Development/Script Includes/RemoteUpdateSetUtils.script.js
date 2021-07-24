var RemoteUpdateSetUtils = (function() {
    //uses
    var Thennable = global.Thennable;
    var grUtils = global.GlideRecordUtils;
    var Template = global.StringTemplate;

    var __UPDATE_SET_TABLE = 'sys_update_set';
    var __REMOTE_UPDATE_SET_TABLE = 'sys_remote_update_set';
    var __UPDATE_XML_TABLE = 'sys_update_xml';
    var __CURRENT_INSTANCE_ADDRESS =
        global.PipelineEnvUtils.currentInstanceAddress;

    var __remoteUpdateSetStates = {
        LOADING: 'loading',
        LOADED: 'loaded',
        PREVIEWED: 'previewed',
    };

    function __retrieveRemoteUpdates(
        /*object*/
        data,
        /*GlideRecord or string*/
        retrievedUpdateSet
    ) {
        var remoteData = [];

        var retrievedSetId = grUtils.isGlideRecord(retrievedUpdateSet) ?
            retrievedUpdateSet.sys_id + '' :
            retrievedUpdateSet + '';

        var remoteUpdates = new GlideRemoteGlideRecord(
            data.envAddress,
            __UPDATE_XML_TABLE
        );
        remoteUpdates.setBasicAuth(data.auth.username, data.auth.password);
        remoteUpdates.addQuery('update_set', data.updateSet);
        remoteUpdates.query();

        while (remoteUpdates.next()) {
            remoteData.push({
                remote_update_set: retrievedSetId,
                name: remoteUpdates.getValue('name'),
                category: remoteUpdates.getValue('category'),
                payload: remoteUpdates.getValue('payload'),
                type: remoteUpdates.getValue('type'),
                target_name: remoteUpdates.getValue('target_name'),
                comments: remoteUpdates.getValue('comments'),
                action: remoteUpdates.getValue('action'),
                view: remoteUpdates.getValue('view'),
                table: remoteUpdates.getValue('table'),
                application: remoteUpdates.getValue('application'),
                update_set: retrievedSetId,
            });
        }

        return remoteData.map(function(remoteUpdate) {
            var localUpdate = grUtils.insertRecord(
                __UPDATE_XML_TABLE,
                remoteUpdate
            );

            if (!grUtils.isGlideRecord(localUpdate)) {
                remoteUpdate.isSuccessul = false;
            } else {
                remoteUpdate.isSuccessful = true;
                remoteUpdate.sys_id = localUpdate.sys_id + '';
            }

            return remoteUpdate;
        });
    }

    function __retrieveRemoteUpdateSet( /*object*/ data) {
        var result = {
            error: null,
            message: 'Retrieving remote update set',
            data: {},
            warning: null,
        };

        try {
            var remoteUpdateSet = new GlideRemoteGlideRecord(
                data.envAddress,
                __UPDATE_SET_TABLE
            );
            remoteUpdateSet.setBasicAuth(
                data.auth.username,
                data.auth.password
            );
            remoteUpdateSet.addQuery('sys_id', data.updateSet);
            remoteUpdateSet.query();

            if (!remoteUpdateSet.next()) {
                //cannot retrieve update set - not found
                throw Template.inject(
                    'Error retrieving remote update set [{{updateSet}}] from {{env}}: could not find update set in environment.', {
                        updateSet: data.updateSet,
                        env: data.envAddress,
                    }
                );
            }

            var retrievedSet = grUtils.insertRecord(__REMOTE_UPDATE_SET_TABLE, {
                name: remoteUpdateSet.getValue('name'),
                description: remoteUpdateSet.getValue('description'),
                release_date: remoteUpdateSet.getValue('release_date'),
                install_date: gs.now(),
                state: __remoteUpdateSetStates.LOADING,
                origin_sys_id: data.updateSet,
                application: remoteUpdateSet.getValue('application'),
            });

            if (!grUtils.isGlideRecord(retrievedSet)) {
                //did not register set locally
                throw Template.inject(
                    'Error retrieving remote update set [{{updateSet}}] from {{env}}: did not register update set in {{localEnv}}', {
                        updateSet: data.updateSet,
                        env: data.envAddress,
                        localEnv: __CURRENT_INSTANCE_ADDRESS,
                    }
                );
            }

            result.data.retrievedSet = {
                name: retrievedSet.name + '',
                sys_id: retrievedSet.sys_id + '',
                record: retrievedSet,
            };

            var retrievedUpdates = __retrieveRemoteUpdates(data, retrievedSet);

            if (
                retrievedUpdates.filter(function(update) {
                    return !update.isSuccessful;
                }).length != 0
            ) {
                throw Template.inject(
                    'Error retrieving remote update set [{{updateSet}}] from {{env}}: could not retrieve remote updates in {{localEnv}}:\n{{data}}', {
                        updateSet: data.updateSet,
                        env: data.envAddress,
                        localEnv: __CURRENT_INSTANCE_ADDRESS,
                        data: JSON.stringify(retrievedUpdates, null, 4),
                    }
                );
            }

            grUtils.updateRecord(retrievedSet, {
                state: __remoteUpdateSetStates.LOADED,
            });

            result.data.retrievedUpdates = retrievedUpdates;
            result.message = Template.inject(
                'Successfully retrieved update set [{{updateSet}}] in {{localEnv}}', {
                    updateSet: data.updateSet,
                    localEnv: __CURRENT_INSTANCE_ADDRESS,
                }
            );
        } catch (err) {
            result.error = err;
            result.message = err + '';
        }

        return new Thennable(result);
    }

    function __copyLocalUpdates(
        /*GlideRecord*/
        retrievedSet,
        /*GlideRecord*/
        localSet
    ) {
        var skippedQuery =
            grUtils
            .find('sys_update_preview_xml')
            .where(
                'remote_update.remote_update_set',
                retrievedSet.sys_id + ''
            )
            .exec()
            .map(function(previewRec) {
                if (previewRec.proposed_action + '' != 'skip') {
                    return;
                }

                return previewRec.proposed_action + '' != 'skip' ?
                    false :
                    previewRec.remote_update + '';
            })
            .filter(function(id, index, self) {
                return id && self.indexOf(id) == index ? true : false;
            })
            .map(function(remoteUpdateId) {
                var query = '';

                grUtils
                    .findOne(__UPDATE_XML_TABLE)
                    .where('sys_id', remoteUpdateId)
                    .exec(function(r) {
                        query = 'name!=' + r.name;
                    });

                return query;
            })
            .filter(function(query) {
                return query ? true : false;
            })
            .join('^') || 'sys_idISNOTEMPTY';

        return grUtils
            .find(__UPDATE_XML_TABLE)
            .where('remote_update_set', retrievedSet.sys_id + '')
            .encoded(skippedQuery)
            .exec()
            .getValues(
                'update_set,name,action,view,update_domain,table,category,application,replace_on_upgrade,payload,type,target_name,comments'
            )
            .map(function(updateData) {
                updateData.update_set = localSet.sys_id + '';
                var localUpdate = grUtils.insertRecord(
                    __UPDATE_XML_TABLE,
                    updateData
                );

                if (!grUtils.isGlideRecord(localUpdate)) {
                    updateData.isSuccessul = false;
                } else {
                    updateData.isSuccessful = true;
                    updateData.sys_id = localUpdate.sys_id + '';
                }

                return updateData;
            });
    }

    function __applyRemoteChanges( /*GlideRecord or string*/ retSet) {
        var retrievedSet = (grUtils.isGlideRecord(retSet) && retSet) || null;

        !retrievedSet &&
            grUtils
            .findOne(__REMOTE_UPDATE_SET_TABLE)
            .where('sys_id', retSet)
            .or('name', retSet)
            .exec(function(record) {
                retrievedSet = record;
            });

        var result = {
            error: null,
            message: 'Applying remote changes',
            data: {},
            warning: null,
        };

        try {
            if (!grUtils.isGlideRecord(retrievedSet)) {
                throw Template.inject(
                    'Error applying remote changes in {{env}}: RemoteUpdateSetUtils.applyRemoteChanges did not find an update set [{{us}}]', {
                        env: __CURRENT_INSTANCE_ADDRESS,
                        us: retSet,
                    }
                );
            }

            var previewer = new UpdateSetPreviewer();
            previewer.removePreviewRecords(retrievedSet.sys_id + '');
            previewer.generatePreviewRecordsWithUpdate(
                retrievedSet.sys_id + ''
            );

            //Check whether the updateset is previewed 
            if (!previewer.previewExists(retrievedSet.sys_id + '')) {
                result.message = Template.inject(
                    'Updateset not yet previewed {{updateSet}} on {{localEnv}}', {
                        updateSet: retrievedSet.name + '',
                        localEnv: __CURRENT_INSTANCE_ADDRESS,
                    }
                );
                result.warning = true;

                return new Thennable(result);
            }

            //indicate there are problems requiring manual resolving
            if (
                GlidePreviewProblemHandler.hasUnresolvedProblems(
                    retrievedSet.sys_id + ''
                )
            ) {
                result.message = Template.inject(
                    'Error previewing {{updateSet}} on {{localEnv}}: There were some preview problems that require manual investigation', {
                        updateSet: retrievedSet.name + '',
                        localEnv: __CURRENT_INSTANCE_ADDRESS,
                    }
                );
                result.warning = true;

                return new Thennable(result);
            }

            //if no conflicts - commit update set
            var localUpdateSet = new GlideRecord(__UPDATE_SET_TABLE);
            var updateSetWorker = new GlideUpdateSetWorker();
            var localSetId = updateSetWorker.remoteUpdateSetCommit(
                localUpdateSet,
                retrievedSet,
                ''
            );
            localUpdateSet.get(localSetId);

            result.data.localSetId = localSetId;

            var localUpdates = __copyLocalUpdates(retrievedSet, localUpdateSet);

            if (
                localUpdates.filter(function(update) {
                    return !update.isSuccessful;
                }).length != 0
            ) {
                throw Template.inject(
                    'Error committing remote update set [{{updateSet}}] from {{env}}: could not copy remote updates locally in {{localEnv}}:\n{{data}}', {
                        updateSet: data.updateSet,
                        env: data.envAddress,
                        localEnv: __CURRENT_INSTANCE_ADDRESS,
                        data: JSON.stringify(localUpdates, null, 4),
                    }
                );
            }

            result.data.retrievedSetId = retrievedSet.origin_sys_id;
            result.localUpdateSet = localUpdateSet;
            result.message = Template.inject(
                'Initiated commit of {{updateSet}} on {{env}}', {
                    updateSet: retrievedSet.name + '',
                    env: __CURRENT_INSTANCE_ADDRESS,
                }
            );

            updateSetWorker.setUpdateSetSysId(localSetId);
            updateSetWorker.setBackground(false);
            updateSetWorker.start();
        } catch (err) {
            result.error = err;
            result.message = err + '';
        }

        return new Thennable(result);
    }

    function __previewRemoteChanges( /*GlideRecord or string*/ retSet) {
        var retrievedSet = (grUtils.isGlideRecord(retSet) && retSet) || null;

        !retrievedSet &&
            grUtils
            .findOne(__REMOTE_UPDATE_SET_TABLE)
            .where('sys_id', retSet)
            .or('name', retSet)
            .exec(function(record) {
                retrievedSet = record;
            });

        var result = {
            error: null,
            message: 'Previewing remote changes',
            data: {},
            warning: null,
        };

        try {
            if (!grUtils.isGlideRecord(retrievedSet)) {
                throw Template.inject(
                    'Error applying remote changes in {{env}}: RemoteUpdateSetUtils.previewRemoteChanges did not find an update set [{{us}}]', {
                        env: __CURRENT_INSTANCE_ADDRESS,
                        us: retSet,
                    }
                );
            }

            var previewer = new UpdateSetPreviewer();
            previewer.removePreviewRecords(retrievedSet.sys_id + '');
            previewer.generatePreviewRecordsWithUpdate(
                retrievedSet.sys_id + ''
            );

            //Check whether the updateset is previewed 
            if (!previewer.previewExists(retrievedSet.sys_id + '')) {
                result.message = Template.inject(
                    'Updateset not yet previewed {{updateSet}} on {{localEnv}}', {
                        updateSet: retrievedSet.name + '',
                        localEnv: __CURRENT_INSTANCE_ADDRESS,
                    }
                );
                result.warning = true;

                return new Thennable(result);
            }

            //indicate there are problems requiring manual resolving
            if (
                GlidePreviewProblemHandler.hasUnresolvedProblems(
                    retrievedSet.sys_id + ''
                )
            ) {
                result.message = Template.inject(
                    'Error previewing {{updateSet}} on {{localEnv}}: There were some preview problems that require manual investigation', {
                        updateSet: retrievedSet.name + '',
                        localEnv: __CURRENT_INSTANCE_ADDRESS,
                    }
                );
                result.warning = true;

                return new Thennable(result);
            }
        } catch (err) {
            result.error = err;
            result.message = err + '';
        }

        return new Thennable(result);
    }

    function __commitUpdateSet(retSet) {
        var retrievedSet = (grUtils.isGlideRecord(retSet) && retSet) || null;

        !retrievedSet &&
            grUtils
            .findOne(__REMOTE_UPDATE_SET_TABLE)
            .where('sys_id', retSet)
            .or('name', retSet)
            .exec(function(record) {
                retrievedSet = record;
            });

        var result = {
            error: null,
            message: 'Commiting remote changes',
            data: {},
            warning: null,
        };

        try {
            if (!grUtils.isGlideRecord(retrievedSet)) {
                throw Template.inject(
                    'Error applying remote changes in {{env}}: RemoteUpdateSetUtils.commitUpdateSet did not find an update set [{{us}}]', {
                        env: __CURRENT_INSTANCE_ADDRESS,
                        us: retSet,
                    }
                );
            }

            var localUpdateSet = new GlideRecord(__UPDATE_SET_TABLE);
            var updateSetWorker = new GlideUpdateSetWorker();
            var localSetId = updateSetWorker.remoteUpdateSetCommit(
                localUpdateSet,
                retrievedSet,
                ''
            );
            localUpdateSet.get(localSetId);

            result.data.localSetId = localSetId;

            var localUpdates = __copyLocalUpdates(retrievedSet, localUpdateSet);

            if (
                localUpdates.filter(function(update) {
                    return !update.isSuccessful;
                }).length != 0
            ) {
                throw Template.inject(
                    'Error committing remote update set [{{updateSet}}] from {{env}}: could not copy remote updates locally in {{localEnv}}:\n{{data}}', {
                        updateSet: data.updateSet,
                        env: data.envAddress,
                        localEnv: __CURRENT_INSTANCE_ADDRESS,
                        data: JSON.stringify(localUpdates, null, 4),
                    }
                );
            }

            result.data.retrievedSetId = retrievedSet.origin_sys_id;
            result.localUpdateSet = localUpdateSet;
            result.message = Template.inject(
                'Initiated commit of {{updateSet}} on {{env}}', {
                    updateSet: retrievedSet.name + '',
                    env: __CURRENT_INSTANCE_ADDRESS,
                }
            );

            updateSetWorker.setUpdateSetSysId(localSetId);
            updateSetWorker.setBackground(false);
            updateSetWorker.start();
        } catch (er) {
            result.error = err;
            result.message = err + '';
        }

        return new Thennable(result);
    }

    return {
        retrieveRemoteUpdateSet: __retrieveRemoteUpdateSet,
        applyRemoteChanges: __applyRemoteChanges,
        previewRemoteChanges: __previewRemoteChanges,
        commitRemoteChanges: __commitUpdateSet
    };
})();