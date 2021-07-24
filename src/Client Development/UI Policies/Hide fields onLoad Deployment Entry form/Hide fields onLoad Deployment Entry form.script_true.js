function onCondition() {
	g_form.setVisible('u_parent', false);
	g_form.setVisible('u_atf_execution', false);
	g_form.setVisible('u_manual_investigation_link', false);
	g_form.getValue('u_feedback') == '' ? g_form.setVisible('u_feedback', false) : g_form.setVisible('u_feedback', true);
	
	!g_form.isNewRecord() &&
		['u_deployment_plan', 'u_update_set', 'u_description', 'u_work_reference', 'u_external_work_reference', 'u_release_window', 'u_product'].forEach(function(field) {
			g_form.setReadOnly(field, true);
		});
}