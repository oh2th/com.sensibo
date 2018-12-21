function onHomeyReady(homeyReady) {
    Homey = homeyReady;
    Homey.ready();

    var apikeyElement = document.getElementById('apikey');
    var saveElement = document.getElementById('save');

    Homey.get('apikey', function (err, apikey) {
        if (err) return Homey.alert(err);
        apikeyElement.value = apikey;
    });

    saveElement.addEventListener('click', function (e) {
        Homey.set('apikey', apikeyElement.value, function (err) {
            if (err) return Homey.alert(err);
        });
    });
}
