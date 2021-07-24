var grUtils = global.GlideRecordUtils;
var typeUtils = global.TypeUtils;
var plUtils = global.PipelineUtils;

var __DEPLOYMENT_ENTRY_TABLE = 'u_deployment_entry';
var __DEPLOYMENT_PLAN_TABLE = 'u_deployment_plan';

var PipelineClientUtils = Class.create();
PipelineClientUtils.prototype = Object.extendsObject(
	global.AbstractAjaxProcessor,
	{
		getCurrentInstanceAddress: function () {
			return global.PipelineEnvUtils.currentInstanceAddress;
		},

		validateDeploymentPlanConfig: function () {
			var answer = false;

			var deploymentPlanId = this.getParameter('deploymentPlanId') || '';

			grUtils
				.findOne(__DEPLOYMENT_PLAN_TABLE)
				.where('sys_id', deploymentPlanId)
				.exec(function (record) {
				answer = typeUtils.isJSONString(record.u_config + '');
			});

			return answer;
		},

		deployEntry: function () {
			var deploymentEntryId = this.getParameter('deploymentEntryId');

			var worker = null;

			grUtils
				.findOne(__DEPLOYMENT_ENTRY_TABLE)
				.where('sys_id', deploymentEntryId)
				.exec(function (record) {
				worker = plUtils.deployEntry(record);
			});

			return (worker && (worker.getLink() || 'success')) || null;
		},

		terminateDeployment: function() {

			plUtils.terminateDeployment({
				deploymentEntryId: this.getParameter('deploymentEntryId'),
				rollback: this.getParameter('rollback')
			});
		},


		getQualityGatesStatus: function() {

			var updateSet = this.getParameter('sysparm_updateSet');

			var liveCheckQC = new GlideRecord('x_qucl_qc_snow_quality_clouds_live_check');
			liveCheckQC.addQuery('update_set', updateSet);
			liveCheckQC.orderByDesc('sys_created_on');
			liveCheckQC.setLimit(1);
			liveCheckQC.query();

			if(liveCheckQC.next()) {
				return liveCheckQC.u_qg_status.toString();
			}
		},


		generateLiveCheckResults: function() {
			/* Update set Id */
			var updateSetId = this.getParameter('sysparm_updateSet');

			/* Get Update Set glide record */
			var updateSet = new GlideRecord('sys_update_set');	
			if(updateSet.get('sys_id', updateSetId)) {
				/* Get all child Update sets */
				var childUpdateSet = new GlideRecord('sys_update_set');
				childUpdateSet.addQuery('parent', updateSet.sys_id);
				childUpdateSet.addQuery('state', '!=', 'ignore');
				childUpdateSet.query();

				var result = true;

				if (new x_qucl_qc_snow.QCConfigurationManager().isSynchronousCheckActivated()) {
					updateSet.update();

					/* Analyse current Update set for any issues */
					result = new x_qucl_qc_snow.QCLiveCheckManager().updateSetCheck(updateSet.sys_id, gs.getUserName());

					/* Analyse child Update sets for any issues */
					while (childUpdateSet.next()) {
						result = new x_qucl_qc_snow.QCLiveCheckManager().updateSetCheck(childUpdateSet.sys_id, gs.getUserName());
					}
				} else {
					updateSet.update();

					/* Analyse current Update set for any issues */
					gs.eventQueue('qc.trigger.update.set.check', updateSet, updateSet.sys_id, gs.getUserName()); 
					/* Analyse child Update sets for any issues */
					while (childUpdateSet.next()) {
						gs.eventQueue('qc.trigger.update.set.check', childUpdateSet, childUpdateSet.sys_id, gs.getUserName()); 
					}			
				}
			}
		},


		getQGDecision: function() {
			var updateSetId = this.getParameter('sysparm_updateSet');

			var liveCheckQC = new GlideRecord('x_qucl_qc_snow_quality_clouds_live_check');
			liveCheckQC.addQuery('update_set', updateSetId);
			liveCheckQC.orderByDesc('sys_created_on');
			liveCheckQC.setLimit(1);
			liveCheckQC.query();

			return liveCheckQC.u_qg_status.toString();
		},

		type: 'PipelineClientUtils',
	}
);