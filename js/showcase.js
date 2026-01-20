(function () {
    var isFirst = true;

    window.vitBack = function (backLink) {
        backInFrame(backLink);
    };

    function backInFrame(backLink) {
        if (getUrlVar('frame') === 1 || isInIframe()) return;

        let url = new URL(location.href);
        backLink = backLink.replace(/{([^}]*)}/gm, function (all, key) {
            if (url.searchParams.has(key)) {
                return url.searchParams.get(key);
            }
            return ``;
        });
        console.log(backLink);

        var frame = document.createElement('iframe');
        frame.style.width = '100%';
        frame.id = 'newsFrame';
        frame.name = 'newsFrame';
        frame.style.height = '100vh';
        frame.style.position = 'fixed';
        frame.style.top = 0;
        frame.style.left = 0;
        frame.style.border = 'none';
        frame.style.zIndex = 999997;
        frame.style.display = 'none';
        frame.style.backgroundColor = '#fff';
        document.body.append(frame);

        if (!isIos()) {
            checkUserGesture(function () {
                for (var t = 0; 20 > t; ++t) window.history.pushState({EVENT: "MIXER"}, "", window.location);
            });
        } else {
            for (var t = 0; 20 > t; ++t) window.history.pushState({EVENT: "MIXER"}, "", window.location);
        }

        window.onpopstate = function (t) {
            if (!window.has_hash) {
                console.log("t.state", t.state);
                var url = backLink;
                console.log("backLink", url);
                console.log("isIos", isIos());
                if (!isIos() && !!!t.state) return;

                document.body.style.overflow = 'hidden';
                frame.style.display = "block";
                document.querySelectorAll("body > *:not(#newsFrame)").forEach(function (e) {
                    e.setAttribute('style', 'display:none;');
                });

                console.log('back url in frame', url);
                frames['newsFrame'].window.location.replace(url);
                isFirst = false;
            }
        };

        window.onhashchange = function(e) {
            window.has_hash = !!window.location.hash;
        }
    }

    function getQuery() {
        var url = location.search;
        var qs = url.substring(url.indexOf('?') + 1).split('&');
        for (var i = 0, result = {}; i < qs.length; i++) {
            qs[i] = qs[i].split('=');
            try {
                result[qs[i][0]] = (qs[i][1] !== null) ?
                    decodeURIComponent(qs[i][1]) : '';
            } catch (e) {
                result[qs[i][0]] = qs[i][1];
            }
        }
        return result;
    }

    function backNotUserGesture(backLink) {
        window.history.pushState({EVENT: "MIXER"}, "", window.location);
        window.onpopstate = function () {
            window.location.replace(backLink);
        }
    }

    function getUrlVar(key) {
        var p = window.location.search;
        p = p.match(new RegExp('[?&]{1}(?:' + key + '=([^&$#=]+))'));
        return p ? p[1] : '';
    }

    function isInIframe() {
        try {
            return window != window.top || document != top.document || self.location != top.location;
        } catch (e) {
            return true;
        }
    }

    function checkUserGesture(callback) {

        var st = setInterval(function () {
            var audio = document.createElement('audio');
            var playPromise = audio.play();
            if (playPromise instanceof Promise) {
                if (!audio.paused) {
                    clearInterval(st);
                    callback();
                }
                playPromise.then(function (e) {

                }).catch(function (error) {

                });
            } else {
                if (!audio.paused) {
                    clearInterval(st);
                    callback();
                }
            }
        }, 100);
    }

    function isIos() {
        console.log("navigator.platform", navigator.platform);
        return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod',
            'Macintosh',
            'MacIntel',
            'MacPPC',
            'Mac68K',
            'Mac68K'
        ].some(function (exactPlatformString) {
            return navigator.platform === exactPlatformString
        });
    }
})(window);
