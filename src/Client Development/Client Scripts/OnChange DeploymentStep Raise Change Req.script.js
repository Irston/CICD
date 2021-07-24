function onChange(control, oldValue, newValue, isLoading, isTemplate) {
   if (isLoading || newValue === '') {
      return;
   }
	
	if(newValue == 'true') {
		g_form.setSectionDisplay('change_request', true);
		g_tabs2Sections.setActive(g_form.getSectionNames().indexOf('change_request'));
	} else {
		g_form.setSectionDisplay('change_request', false);
	}
}