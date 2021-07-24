function onChange(control, oldValue, newValue, isLoading, isTemplate) {
   if (isLoading || newValue === '') {
      return;
   }
	
	if(newValue == 'true') {
		g_form.setSectionDisplay('automated_testing', true);
		g_tabs2Sections.setActive(g_form.getSectionNames().indexOf('automated_testing'));
	} else {
		g_form.setSectionDisplay('automated_testing', false);
		g_form.setValue('u_tests', '');
	}
}