var PipelineWorkflowUtils = Class.create();
PipelineWorkflowUtils.prototype = {
	initialize: function() {

	},

	getUKReleaseWindowTime: function() {

		var gdt = new GlideDateTime();
		var weekDay = gdt.getDayOfWeek();

		var plannedDate = '';
		var plannedStartTime = new GlideDateTime();
		var plannedEndTime = new GlideDateTime();
		var startTime = '';
		var endTime = '';

		if (weekDay == 5 || weekDay == 6) {

			var integerValForToday = gdt.getDayOfWeek();
			var adderForMonday = 8 - integerValForToday;
			//            gdt.addDays(adderForMonday);
			plannedDate = gdt.getDate();

			startTime = plannedDate + ' ' + '00:00:00';
			plannedStartTime.setDisplayValue(startTime);

			endTime = plannedDate + ' ' + '23:00:00';
			plannedEndTime.setDisplayValue(endTime);


			//         } else {
			//             var todayDate = gdt.getDate();
			//             gdt.addSeconds(1800);

			//             if (todayDate.getNumericValue() != gdt.getDate().getNumericValue()) {

			//                 var glideDate = new GlideDateTime();
			//                 glideDate.addDays(2);
			//                 plannedDate = glideDate.getDate();

			//                 startTime = plannedDate + ' ' + '00:00:00';
			//                 plannedStartTime.setDisplayValue(startTime);

			//                 endTime = plannedDate + ' ' + '08:00:00';
			//                 plannedEndTime.setDisplayValue(endTime);

		} else {

			gdt.addDays(1);
			plannedDate = gdt.getDate();

			startTime = plannedDate + ' ' + '00:00:00';
			plannedStartTime.setDisplayValue(startTime);

			endTime = plannedDate + ' ' + '08:00:00';
			plannedEndTime.setDisplayValue(endTime);

			//            }

		}

		var objTime = {};
		objTime.startTime = plannedStartTime;
		objTime.endTime = plannedEndTime;

		return objTime;



	},

	getPlannedStartTimeInSeconds: function(changeNumber) {

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
	},

	moveSTDChangeToReview: function(pipelineWorker) {

		var deployConfig = JSON.parse(pipelineWorker.u_deployment_config.toString());
		var changeNumber = deployConfig.changeRequest.toString();

		var changeGr = new GlideRecord('change_request');
		changeGr.addQuery('number', changeNumber);
		changeGr.query();

		if (changeGr.next()) {

			changeGr.state = 0;
			changeGr.work_end = new GlideDateTime();
			changeGr.close_code = 'successful';
			changeGr.close_notes = 'Automated Deployment Successful';
			changeGr.update();

			changeGr.state = 3;
			changeGr.update();

			//// notify Dev
			var deployedBy = deployConfig.deploymentEntry.deployedBy;
			var deployedByID = deployedBy.substring(deployedBy.lastIndexOf('(') + 1, deployedBy.lastIndexOf(')'));

			var userGr = new GlideRecord('sys_user');
			userGr.addQuery('user_name', deployedByID);
			userGr.query();
			userGr.next();

		}
	},

	createIncidentAndCancelChange: function(deployConfig) {

		var changeNumber = deployConfig.changeRequest.toString();
		var updateSet = deployConfig.updateSet.name;
		var developer = deployConfig.deploymentEntry.deployedBy;
		var description = deployConfig.deploymentEntry.description;

		var changeGr = new GlideRecord('change_request');
		changeGr.addQuery('number', changeNumber);
		changeGr.query();

		if (changeGr.next()) {

			var incidentGr = new GlideRecord('incident');
			incidentGr.initialize();
			incidentGr.short_description = changeGr.number.toString() + ' for Automated Deployment is unsuccessful';
			incidentGr.description = 'Contained update set: ' + updateSet + '\n' + 'Developer: ' + developer + '\n' + 'Description: ' + description;
			incidentGr.assignment_group = 'f45d10fddbcb9f007ef6bae76896193e';
			incidentGr.priority = 4;
			incidentGr.cmdb_ci = '9513026edb4b53407ef6bae768961939';
			incidentGr.contact_type = 'self-service';
			incidentGr.insert();

			changeGr.state = 4;
			changeGr.close_notes = 'Automated Deployment is not successful.' + '\n' + 'Created Incident: ' + incidentGr.number.toString();
			changeGr.update();

			var returnObj = {};
			returnObj.incident = incidentGr;
			returnObj.change = changeGr;

			return returnObj;

		}
	},

	createSTDChangeRestAPI: function(pipelineWorker) {
		var r = new sn_ws.RESTMessageV2('CI/CD Create STD Change', 'Create Change');

		var reqBody = {
			'u_deployment_config': pipelineWorker.u_deployment_config.toString(),
			'u_number': pipelineWorker.u_number.toString(),
			'u_state': pipelineWorker.u_state.toString(),
		};

		r.setRequestBody(JSON.stringify(reqBody));

		var response = r.execute();
		var responseBody = response.getBody();
		var httpStatus = response.getStatusCode();
		var body = JSON.parse(responseBody);

		return body;

	},




	updSetFailEventRestAPI: function(pipelineWorker, retrievedSet) {

		var instanceName = gs.getProperty('instance_name');


		var retUpdateSet = JSON.parse(retrievedSet.toString());
		var deployConfig = JSON.parse(pipelineWorker.u_deployment_config.toString());

		/* Developer information */
		var deployedByRaw = deployConfig.deploymentEntry.deployedBy;
		var deployedByID = deployedByRaw.substring(deployedByRaw.lastIndexOf('(') + 1 , deployedByRaw.lastIndexOf(')'));
		var deployedByName;
		var deployedByEmail;

		var user = new GlideRecord('sys_user');
		if(user.get('user_name', deployedByID)) {
			deployedByEmail = user.email.toString();
			deployedByName = user.u_fullname.toString();
		}


		var deploymentDetails = {
			'updateSet': deployConfig.updateSet.name.toString(),
			'createdByEmail': deployedByEmail,
			'createdByName': deployedByName,
			'prevFailedOn': gs.nowDateTime().toString(),
			'instance': instanceName.toString(),
			'instanceLink': "https://" + instanceName + ".service-now.com/marketplace?id=update_set_conflict_previewer&upd_id=" + retUpdateSet.sys_id.toString()
		};



		if (instanceName != 'bp') {
			var r = new sn_ws.RESTMessageV2('CI/CD Update Set Fail - Create Event', 'Fire Event');
			r.setRequestBody(JSON.stringify(deploymentDetails));
			var response = r.execute();
			var responseBody = response.getBody();
			var httpStatus = response.getStatusCode();
			var body = JSON.parse(responseBody);

			return body;
		} else {
			gs.eventQueue('cicd_deployment_has_conflicts', null, deploymentDetails.createdByEmail.toString(), JSON.stringify(deploymentDetails));
		}
	},

	type: 'PipelineWorkflowUtils'
};