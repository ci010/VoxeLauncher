function getReleases() {
    fetch('https://api.github.com/repos/ci010/voxelauncher/releases')
        .then(resp => resp.json());
}

i18next.init({
    lng: 'en',
    resources: { en, cn },
}, function (err, t) {
    jqueryI18next.init(i18next, $);
    $('.section').localize();
    $('.bar').localize();
});

const releases = getReleases();
const latest = releases[0];

$('#version').text(latest.tag_name);

$(document).ready(function () {
    $('#fullpage').fullpage({
        // onLeave: function (index, nextIndex, direction) {
        // },
    });
});
$('.menu .item').tab();
$('#languages')
    .dropdown({
        onChange: function (src, _, elem) {
            i18next.changeLanguage(elem.attr('value'), (err, r) => {
                $('.section').localize();
                $('.bar').localize();
            })
        }
    });



function getLatestYml(assets) {
    const os = platform.os;
    switch (os.family) {
        case 'Windows':
            return assets.filter(a => a.name === 'latest.yml')[0];
        case 'Mac':
            return assets.filter(a => a.name === 'latest-mac.yml')[0];
        case 'Linux':
            return assets.filter(a => a.name === 'latest-linux.yml')[0];
    }
    return '';
}
