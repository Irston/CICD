function onLoad() {
	g_form.setVisible('u_tests', false);
	g_form.setVisible('u_uat_test_user', false);
	g_form.setVisible('u_uat_test_group', false);
	
   //Type appropriate comment here, and begin script below  User Acceptance Testing
	g_form.getValue('u_raise_uat_task') == 'false' && g_form.setSectionDisplay('user_acceptancetesting', false);
	g_form.getValue('u_run_tests') == 'false' && g_form.setSectionDisplay('automated_testing', false);
	g_form.getValue('u_raise_change_request') == 'false' && g_form.setSectionDisplay('change_request', false);
}