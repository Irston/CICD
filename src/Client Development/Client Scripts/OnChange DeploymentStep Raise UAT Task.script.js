function onChange(control, oldValue, newValue, isLoading, isTemplate) {
   if (isLoading || newValue === '') {
      return;
   }
	
	if(newValue == 'true') {
		g_form.setSectionDisplay('user_acceptancetesting', true);
		g_tabs2Sections.setActive(g_form.getSectionNames().indexOf('user_acceptancetesting'));
	} else {
		g_form.setSectionDisplay('user_acceptancetesting', false);
		g_form.setValue('u_uat_test_group', '');
		g_form.setValue('u_uat_test_user', '');
	}
}