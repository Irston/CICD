(function() {

	var currentScopeId = gs.getCurrentApplicationId();
	var formScope = current.getValue('u_scope');
	if(currentScopeId!=formScope){
		gs.addErrorMessage('The form does not belong to the selected application.Please choose the correct application scope before deploying');
		action.setRedirectURL(current);
		return;
	}
	var cicdUpdateSetUtil = new global.cicdUpdateSetUtils();
	//create update set
	///Default format for the updateset name : Formname :-v{0}
	var appName = current.getDisplayValue('u_application');
	var updateSetName ='CD Form Engine(G):'+appName+'-v';
	var currentVersion=1;
	var prevUpdateSet = new GlideRecord('sys_update_set');
	prevUpdateSet.addEncodedQuery('nameSTARTSWITH'+updateSetName);
	prevUpdateSet.orderByDesc('sys_created_on');
	prevUpdateSet.query();
	if(prevUpdateSet.next()){
		var upsetNameArr = prevUpdateSet.getValue('name').toString().split('-v');
		if(upsetNameArr.length>1){
			if(!isNaN(upsetNameArr[1])){
				currentVersion = parseInt(upsetNameArr[1])+1;
			}
		}
	}
	updateSetName=updateSetName+ currentVersion.toString();

	//The form , category and subcategory are in global scope 
	var formScope = 'global';

	var newUpdateSet = new GlideRecord('sys_update_set');
	newUpdateSet.name = updateSetName;
	newUpdateSet.application = formScope;
	newUpdateSet.description = 'Updateset '+updateSetName.toUpperCase()+' created for Form:'+current.u_name+'\n ON '+gs.nowDateTime();
	var updateSetId = newUpdateSet.insert();

	//set current
	new GlideUpdateSet().set(updateSetId);

	//start saving changes
	var manager = new GlideUpdateManager2();
	//save current form
	manager.saveRecord(current);


	//save category
	var category = current.u_cat_subcat.getRefRecord();
	manager.saveRecord(category);


	//save subcategory
	var subcategory = current.u_subcategory.getRefRecord();
	manager.saveRecord(subcategory);

	gs.eventQueue('form.engine.deploy.update_set', newUpdateSet);

	//newUpdateSet.setValue('state','complete');
//	newUpdateSet.update();


	//Create a new updateset for the form's application and add form's artifacts
	//Items to be added 
	//u_flow =>sys_hub_flow
	//u_question_set=>item_option_new_set
	//u_generated_catalog_item=>sc_cat_item
	//Catalog UI policies
	//Catalog client scripts


	var catalogUpdateSet = new GlideRecord('sys_update_set');
	catalogUpdateSet.initialize();

	catalogUpdateSet.name = updateSetName.replace("CD Form Engine(G):","CD Form Engine(S):");
	catalogUpdateSet.application =current.getValue('u_scope');
	catalogUpdateSet.description = 'Updateset '+catalogUpdateSet.name.toString().toUpperCase()+' created for form:'+current.u_name+'\n ON '+gs.nowDateTime();

	var catalogUpdateSetId = catalogUpdateSet.insert();
	//set current
	new GlideUpdateSet().set(catalogUpdateSetId);

	//add the flow
	var flow = current.u_flow.getRefRecord();
	if(flow.isValidRecord() ){
		manager.saveRecord(flow); 
	}
	
	var variableSetList=[];
	//question set
	var questionSet = current.u_question_set.getRefRecord();
	if(questionSet.isValidRecord()){
		manager.saveRecord(questionSet); 
		variableSetList.push(questionSet.sys_id.toString());
	}

	//multirow variable set
	var multiRowSet = current.u_multi_row_question_set.getRefRecord();
	if(multiRowSet.isValidRecord()){
		manager.saveRecord(multiRowSet); 
		variableSetList.push(multiRowSet.sys_id.toString());
	}


	//Catalog item dependencies will be added seperately
	var catalogItem = current.u_generated_catalog_item.getRefRecord();
	if(catalogItem.isValidRecord()){
		manager.saveRecord(catalogItem);
		//cicdUpdateSetUtil._addCatItem(catalogItem,'sc_cat_item',["variable_set"]);
	}

	//add variable sets
	var variableSetM2M = new GlideRecord("io_set_item");
	variableSetM2M.addQuery("sc_cat_item", catalogItem.getValue('sys_id'));
	variableSetM2M.query();
	while (variableSetM2M.next()) {
		manager.saveRecord(variableSetM2M);
	}	

	
	
	var variableQuery = "cat_item=" + catalogItem.getValue('sys_id');
	if (variableSetList.length > 0) {
		variableQuery = variableQuery + "^ORvariable_setIN" + variableSetList.join(',');
	}


	var variableList = [];
	var variables = new GlideRecord("item_option_new");
	variables.addEncodedQuery(variableQuery);
	variables.query();
	while (variables.next()) {
		manager.saveRecord(variables);

		if ((variables.getValue("map_to_field") == true && variables.field.toString().startsWith("u_")) || variables.name.toString().startsWith("u_"))  {
			var catItem = variables.cat_item.getRefRecord();
			var warningMessage = '<a href="' + catItem.getLink() + '" target="_blank">' + catItem.getDisplayValue() + ' ' + catItem.getClassDisplayValue() + '</a>';
			warningMessage = warningMessage + " contains variables mapped to custom fields that may need to be added to your update set.";
			if (warningMessages.indexOf(warningMessage) == -1) {
				warningMessages.push(warningMessage);
			}
		}
		variableList.push(variables.getValue("sys_id"));
	}


	var questionChoice = new GlideRecord("question_choice");
	questionChoice.addQuery("question", "IN", variableList.toString());
	questionChoice.query();
	while (questionChoice.next()) {
		manager.saveRecord(questionChoice);
	}

	var clientScript = new GlideRecord("catalog_script_client");
	clientScript.addEncodedQuery(variableQuery);
	clientScript.query();
	while (clientScript.next()) {
		manager.saveRecord(clientScript);
	}

	var uiPolicyList = [];
	var uiPolicyQuery =variableQuery.replace("cat_item=", "catalog_item=");
	var uiPolicy = new GlideRecord("catalog_ui_policy");
	uiPolicy.addEncodedQuery(uiPolicyQuery);
	uiPolicy.query();
	while (uiPolicy.next()) {
		manager.saveRecord(uiPolicy);
		uiPolicyList.push(uiPolicy.sys_id.toString());
	}

	var uiPolicyAction = new GlideRecord("catalog_ui_policy_action");
	uiPolicyAction.addQuery("ui_policy", "IN", uiPolicyList.toString());
	uiPolicyAction.query();
	while (uiPolicyAction.next()) {
		manager.saveRecord(uiPolicyAction);
	}

	//fire deployment event
	gs.eventQueue('form.engine.deploy.update_set', catalogUpdateSet);

	//catalogUpdateSet.setValue('state','complete');
	//catalogUpdateSet.update();

	
	
	/*
	//save catalog item

	//save question set
	var questionSetId = current.u_question_set + '';
	var questionSet = current.u_question_set.getRefRecord();
	manager.saveRecord(questionSet);

// 	//save flow
// 	var flow = current.u_flow.getRefRecord();
// 	if(flow && flow.sys_scope + '' === currentScopeId && flow.u_flow.status + '' === 'published' ) {
// 		manager.saveRecord(flow);
// 	}
	//save questions if they're defined in the same scope
	if(current.u_question_set.sys_scope + '' === currentScopeId) {
		//get questions and save them
		var questionsIds = [];
		var questions = new GlideRecord('item_option_new');
		questions.addQuery('variable_set', questionSetId);
		questions.query();

		while(questions.next()) {
			questionsIds.push(questions.sys_id + '');
			manager.saveRecord(questions);
		}

		//get question choices and save them
		var questionChoices = new GlideRecord('question_choice');
		questionChoices.addEncodedQuery('question=' + questionsIds.join('^ORquestion='));
		questionChoices.query();

		while(questionChoices.next()) {
			manager.saveRecord(questionChoices);
		}
	}



	*/
})();