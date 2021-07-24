function redirectMe() {
    var senderConfig = g_form.getValue('u_sender_env_config');
    var senderConfigParsed = (senderConfig && JSON.parse(senderConfig)) || null;

    if (window) {
        window.open(senderConfigParsed.envAddress, '_blank');
    } else {
        top.window.open(senderConfigParsed.envAddress, '_blank');
    }
}
