function redirectMe() {
    (window &&
        window.open(
            g_form.getValue('u_manual_investigation_link'),
            '_blank'
        )) ||
        top.window.open(
            g_form.getValue('u_manual_investigation_link'),
            '_blank'
        );
}
