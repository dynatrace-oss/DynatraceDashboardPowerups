/*chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.sync.set(
        {
            Powerups: {
                tooltipPU: true,
                colorPU: true,
                svgPU: true,
                worldmapPU: true,
                bannerPU: true
            }

        }, function () {
            console.log('Powerup: added to storage');
        });

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { urlMatches: '(?:/e/)|(?:dynatracelabs.com)|(?:live.dynatrace.com)'}
            })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});
*/