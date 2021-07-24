function onCondition() {
	if(g_form.isNewRecord() == true) {
		g_form.setSectionDisplay('tests_section', false);
		g_form.setSectionDisplay('uat_assignee', false);
		g_form.setSectionDisplay('uat_assignmentgroup', false);
	}
	
	g_form.setVisible('u_tests', false);
	g_form.setVisible('u_uat_test_user', false);
	g_form.setVisible('u_uat_test_group', false);
}