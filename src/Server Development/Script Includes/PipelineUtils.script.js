var PipelineUtils = (function() {
	var grUtils = global.GlideRecordUtils;
	var typeUtils = global.TypeUtils;
	var Request = global.RESTRequest;
	var Template = global.StringTemplate;

	var __DEPLOYMENT_ENTRY_TABLE = 'u_deployment_entry';
	var __WORKER_TABLE = 'u_pipeline_worker';
	var __WORKER_LOG_ENTRY_TABLE = 'u_worker_log_entry';
	var __UPDATE_XML_TABLE = 'sys_update_xml';
	var __UPDATE_SET_TABLE = 'sys_update_set';

	var __workerLogEntryTypes = {
		INFO: 'info',
		WARNING: 'warning',
		ERROR: 'error',
	};

	var __workerTypes = {
		PROCESSING: 'processing',
	};

	var __updateSetTypes = {
		COMPLETE: 'complete',
		IGNORE: 'ignore',
	};

	function __registerWorker( /*object*/ data) {
		if (!typeUtils.isObject(data)) {
			return null;
		}

		return grUtils
			.findOne(__WORKER_TABLE)
			.where('sys_id', data.sys_id)
			.exec()
			.insertOrUpdate(data);
	}

	function __registerWorkerRemotely(
	/*GlideRecord*/
	worker,
	 /*object*/
	 remoteEnvConfig
	) {
		if (!grUtils.isGlideRecord(worker)) {
			return null;
		}

		var config = JSON.parse(worker.u_deployment_config + '');

		return Request.post({
			endpoint: Template.inject(
				'{{address}}/api/zjsc/ci_cd_pipeline_api/pipeline_worker', {
					address: remoteEnvConfig.address,
				}
			),
			auth: {
				username: remoteEnvConfig.username,
				password: remoteEnvConfig.password,
			},
			body: {
				sys_id: worker.sys_id + '',
				u_number: worker.u_number + '',
				u_deployment_config: worker.u_deployment_config + '',
				u_state: worker.u_state + '',
				u_manual_investigation_link: worker.u_manual_investigation_link + '',
				u_current_env: worker.u_current_env + '',
			},
		},
							function(err, resBody) {
			if (err) {
				__error({
					u_message: Template.inject(
						'Error pushing worker changes to {{address}}: Server responded with:\n{{message}}', {
							address: remoteEnvConfig.address,
							message: err,
						}
					),
					u_source_environment: __getCurrentInstanceAddress(),
				},
						worker
					   );
				return false;
			}

			__log({
				u_message: Template.inject(
					'Successfully pushed worker changes to {{address}}.', {
						address: remoteEnvConfig.address,
					}
				),
				u_source_environment: __getCurrentInstanceAddress(),
			},
				  worker
				 );

			return true;
		}
						   );
	}

	function __deployEntry( /*string or GlideRecord*/ entry) {
		var entryRec = (typeUtils.isGlideRecord(entry) && entry) || null;
		//if entry is not a GlideRecord - attempt to retrieve it
		!entryRec &&
			grUtils
			.findOne(__DEPLOYMENT_ENTRY_TABLE)
			.where('u_number', entry)
			.or('sys_id', entry)
			.exec(function(record) {
			entryRec = record;
		});

		//cannot init deployment if entry is not retrieved from DB
		if (!typeUtils.isGlideRecord(entryRec)) {
			return null;
		}

		var configJSON = entryRec.u_deployment_plan.u_config + '';
		var config =
			(typeUtils.isJSONString(configJSON) && JSON.parse(configJSON)) ||
			null;

		//cannot deploy without a valid config
		if (!config) {
			return null;
		}

		var deployedBy = Template.inject('{{name}} ({{username}})', {
			name: gs.getUserDisplayName(),
			username: gs.getUserName(),
		});

		//populate 'Deployed by' field
		grUtils.updateRecord(entryRec, {
			u_deployed_by: deployedBy,
		});

		//add info for current update set if needed
		config.updateSet = {
			name: entryRec.u_update_set.name + '',
			sysId: entryRec.u_update_set.sys_id + '',
			envs: {},
		};

		config.updateSet.envs[__getCurrentInstanceAddress()] =
			entryRec.u_update_set.sys_id + '';

		// Add info for the deployment entry
		config.deploymentEntry = {
			sysId: entryRec.sys_id + '',
			number: entryRec.u_number + '',
			description: entryRec.u_description + '',
			deployedBy: deployedBy,
			executeATF: entryRec.u_atf_execution + '',
			product: entryRec.u_product + '',
			workRef: entryRec.u_work_reference + '',
			extWorkRef: entryRec.u_external_work_reference + '',
			desiredReleaseWindow: entryRec.u_release_window + ''
		};

		if (
			entryRec.u_parent.sysId ||
			entryRec.u_parent.u_number ||
			entryRec.u_parent.u_description ||
			entryRec.u_parent.u_atf_execution ||
			entryRec.u_parent.u_product ||
			entryRec.u_parent.u_work_reference ||
			entryRec.u_parent.u_external_work_reference ||
			entryRec.u_parent.u_release_window

		) {
			config.deploymentEntry.parent = {
				sysId: entryRec.u_parent.sysId || '',
				number: entryRec.u_parent.u_number || '',
				description: entryRec.u_parent.u_description || '',
				executeATF: entryRec.u_parent.u_atf_execution || '',
				product: entryRec.u_parent.u_product || '',
				workRef: entryRec.u_parent.u_work_reference || '',
				extWorkRef: entryRec.u_parent.u_external_work_reference || '',
				desiredReleaseWindow: entryRec.u_parent.u_release_window || ''
			};
		}

		var worker = __registerWorker({
			u_deployment_config: JSON.stringify(config, null, 4),
			u_deployment_plan: entryRec.u_deployment_plan + '',
			u_deployment_entry: entryRec.sys_id + '',
			u_update_set: entryRec.u_update_set + '',
		});

		if (!grUtils.isGlideRecord(worker)) {
			return null;
		}

		grUtils.updateRecord(worker, {
			u_state: __workerTypes.PROCESSING,
		});

		return worker;
	}

	function __terminateDeployment( /* object */ data) {
		grUtils.findOne('u_pipeline_worker')
			.where('u_deployment_entry', data.deploymentEntryId)
			.exec(function(record) {
			// get current env - terminate the wf
			// if rollback is true go through all environments passed and rollback he update set
			var depConfig = JSON.parse(record.getValue('u_deployment_config'));
			var currentEnv = record.getValue('u_current_env');
			var currentStep = -1;
			for (var i = 0; i < depConfig.deploymentSteps.length; i++) {
				if (depConfig.deploymentSteps[0].envConfig.envAddress == currentEnv) {
					currentStep = i;
					break;
				}
			}
			if (currentStep == -1) {
				return;
			}
			envConfig = depConfig.deploymentSteps[currentStep].envConfig;
			var Encrypter = new GlideEncrypter();
			var decryptedPass = Encrypter.decrypt(envConfig.auth.password);
			return Request.post({
				endpoint: Template.inject(
					'{{env}}/api/zjsc/ci_cd_pipeline_api/cancel_deployment', {
						env: envConfig.envAddress,
					}
				),
				auth: {
					username: envConfig.auth.username,
					password: decryptedPass,
				},
				body: data,
			},
								function(error, resBody) {
				if (error) {
					// log
					return false;
				}
				return true;
			}
							   );
		});
	}

	function __updateDeploymentEntry( /* object */ data) {
		if (!typeUtils.isObject(data)) {
			return null;
		}

		return grUtils
			.findOne(__DEPLOYMENT_ENTRY_TABLE)
			.where('sys_id', data.sys_id)
			.exec()
			.updateRecords(data);
	}

	function __mergeUpdateSets(localUpdSetId, parentUpdSetId) {
		var parentRecord = null;
		grUtils
			.findOne(__UPDATE_SET_TABLE)
			.where('sys_id', parentUpdSetId)
			.exec(function(record) {
			parentRecord = record;
		});
		var localUpdSet = null;
		grUtils
			.findOne(__UPDATE_SET_TABLE)
			.where('sys_id', localUpdSetId)
			.exec(function(record) {
			localUpdSet = record;
		});
		var mergedUpdates = {};

		grUtils
			.find(__UPDATE_XML_TABLE)
			.encoded(
			Template.inject(
				'update_set={{localSet}}^ORupdate_set={{parentSet}}', {
					localSet: localUpdSetId,
					parentSet: parentUpdSetId,
				}
			)
		)
			.exec()
			.forEach(function(update) {
			var existingUpdate = mergedUpdates[update.name + ''];
			if (existingUpdate) {
				var incomming = new GlideDateTime(
					update.sys_created_on + ''
				);
				var existing = new GlideDateTime(
					existingUpdate.sys_created_on
				);

				if (incomming.compareTo(existing) >= 0) {
					existingUpdate.sys_id = update.sys_id + '';
					existingUpdate.sys_created_on =
						update.sys_created_on + '';
				}
			}

			mergedUpdates[update.name + ''] = {
				sys_id: update.sys_id + '',
				sys_created_on: update.sys_created_on + '',
			};
		});
		var parentNameMergerSubstrIndex = (parentRecord.name + '').indexOf(
			' Merger'
		);
		var parentComparer =
			parentNameMergerSubstrIndex == -1 ?
			parentRecord.name + '' :
		(parentRecord.name + '').substring(
			0,
			parentNameMergerSubstrIndex
		);

		// Get parent update set name count containing the name + Merger
		var mergersCount = new GlideAggregate(__UPDATE_SET_TABLE);
		mergersCount.addAggregate('COUNT');
		mergersCount.addQuery('name', 'CONTAINS', parentComparer + ' Merger');
		mergersCount.query();
		var count = mergersCount.next() && mergersCount.getAggregate('COUNT');

		var mergedUpdateSet = grUtils.insertRecord(__UPDATE_SET_TABLE, {
			name: count == 0 ?
			parentComparer + ' Merger' : parentComparer + ' Merger ' + count,
			state: __updateSetTypes.COMPLETE,
		});

		Object.keys(mergedUpdates).forEach(function(name) {
			grUtils
				.findOne(__UPDATE_XML_TABLE)
				.where('sys_id', mergedUpdates[name].sys_id)
				.exec()
				.updateRecords({
				update_set: mergedUpdateSet.sys_id + '',
			});
		});

		grUtils
			.findOne(__UPDATE_SET_TABLE)
			.where('sys_id', parentUpdSetId)
			.exec()
			.updateRecords({
			state: __updateSetTypes.IGNORE,
		});

		grUtils
			.findOne(__UPDATE_SET_TABLE)
			.where('sys_id', localUpdSetId)
			.exec()
			.updateRecords({
			state: __updateSetTypes.IGNORE,
		});

		return mergedUpdateSet;
	}

	function __updateDeploymentEntryOnEnv(data, envConfig) {
		var Encrypter = new GlideEncrypter();
		var decryptedPass = Encrypter.decrypt(envConfig.auth.password);

		return Request.put({
			endpoint: Template.inject(
				'{{env}}/api/zjsc/ci_cd_pipeline_api/update_entry', {
					env: envConfig.envAddress,
				}
			),
			auth: {
				username: envConfig.auth.username,
				password: decryptedPass,
			},
			body: data,
		},
						   function(error, resBody) {
			if (error) {
				// log
				return false;
			}

			return true;
		}
						  );
	}

	function _createSTDChange(worker, remoteEnvConfig) {

		if (!grUtils.isGlideRecord(worker)) {
			return null;
		}

		var config = JSON.parse(worker.u_deployment_config + '');

		return Request.post({
			endpoint: Template.inject(
				'{{address}}/api/zjsc/ci_cd_pipeline_api/std_change', {
					address: remoteEnvConfig.address,
				}
			),
			auth: {
				username: remoteEnvConfig.username,
				password: remoteEnvConfig.password,
			},
			body: {
				sys_id: worker.sys_id + '',
				u_number: worker.u_number + '',
				u_deployment_config: worker.u_deployment_config + '',
				u_state: worker.u_state + '',
				u_manual_investigation_link: worker.u_manual_investigation_link + '',
				u_current_env: worker.u_current_env + '',
			},
		});
	}
	function getPlannedStartTimeInSeconds(changeNumber) {

		var changeGr = new GlideRecord('change_request');
		changeGr.addQuery('number', changeNumber);
		changeGr.query();

		if (changeGr.next()) {

			var plannedStartTime = changeGr.start_date.toString();
			var startOfReleaseWindow = new GlideDateTime(plannedStartTime);
			var nowDate = new GlideDateTime();

			var dur = GlideDateTime.subtract(nowDate, startOfReleaseWindow);
			var secondsToReleaseWindow = dur.getNumericValue() / 1000;

			return secondsToReleaseWindow;
		}
	}

	function __getCurrentInstanceAddress() {
		return global.PipelineEnvUtils.currentInstanceAddress;
	}

	function __logLocally( /*object*/ data, /*optional GlideRecord*/ worker) {
		data.u_pipeline_worker =
			(grUtils.isGlideRecord(worker) && worker.sys_id + '') ||
			data.u_pipeline_worker;
		data.u_type = data.u_type || __workerLogEntryTypes.INFO;

		return grUtils.insertRecord(__WORKER_LOG_ENTRY_TABLE, data);
	}

	function __log( /*object*/ data, /*optional GlideRecord*/ worker) {
		return __logLocally(data, worker);
	}

	function __info( /*object*/ data, /*optional GlideRecord*/ worker) {
		data.u_type = __workerLogEntryTypes.INFO;

		return __logLocally(data, worker);
	}

	function __warn( /*object*/ data, /*optional GlideRecord*/ worker) {
		data.u_type = __workerLogEntryTypes.WARNING;

		return __logLocally(data, worker);
	}

	function __error( /*object*/ data, /*optional GlideRecord*/ worker) {
		data.u_type = __workerLogEntryTypes.ERROR;

		return __logLocally(data, worker);
	}

	return {
		getCurrentInstanceAddress: __getCurrentInstanceAddress,
		log: __log,
		info: __info,
		warn: __warn,
		error: __error,
		registerWorker: __registerWorker,
		createSTDChange: _createSTDChange,
		registerWorkerRemotely: __registerWorkerRemotely,
		deployEntry: __deployEntry,
		updateDeploymentEntry: __updateDeploymentEntry,
		updateDeploymentEntryOnEnv: __updateDeploymentEntryOnEnv,
		mergeUpdateSets: __mergeUpdateSets,
		terminateDeployment: __terminateDeployment
	};
})();