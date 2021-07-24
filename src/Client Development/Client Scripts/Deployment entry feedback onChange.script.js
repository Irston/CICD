function onChange(control, oldValue, newValue, isLoading, isTemplate) {
   if (isLoading) {
      return;
   }
	
	newValue == '' ? g_form.setVisible('u_feedback', false) : g_form.setVisible('u_feedback', true);

   //Type appropriate comment here, and begin script below
   
}