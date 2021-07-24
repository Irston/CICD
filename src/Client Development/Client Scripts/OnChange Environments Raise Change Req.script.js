function onChange(control, oldValue, newValue, isLoading, isTemplate) {
   if (isLoading || newValue === '') {
      return;
   }

	if(newValue == 'true') {
		g_form.setSectionDisplay('change_section', true);
		g_tabs2Sections.setActive(g_form.getSectionNames().indexOf('change_section'));
	} else {
		g_form.setSectionDisplay('change_section', false);
	}
}