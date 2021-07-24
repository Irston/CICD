function onLoad() {
   //Type appropriate comment here, and begin script below
	g_form.getValue('u_raise_change_request') == 'false' && g_form.setSectionDisplay('change_section', false)
		|| g_form.setSectionDisplay('change_section', true);
}