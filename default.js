let resetBtn = document.querySelector('.reset');
let openBtn = document.querySelector('.open');
let copyBtn = document.querySelector('.copy');
let saveBtn = document.querySelector('.save');
let sortAscBtn = document.querySelector('.sortAsc');
let sortDescBtn = document.querySelector('.sortDesc');
let resetFilterBtn = document.querySelector('.resetFilter');
let urlText = document.querySelector('.urlText');
let filterInput = document.querySelector('.filterInput');
let filterWarning = document.querySelector('.filterWarning');
let iFile = document.querySelector('.ifile');
let fopenBtn = document.querySelector('.fopen');
var fInput = false;

function listTabs() {
    disableFilterMode();

    browser.tabs.query({ currentWindow: true }).then((tabs) => {
        let urls = '';
        for (let tab of tabs) {
            urls += tab.title + "\n" + tab.url + '\n\n';
        }
        urlText.value = urls;
    });
}

//https://stackoverflow.com/questions/42274304/is-there-a-list-of-url-schemes
scheme_list = ["https://", "http://", "file://", "ftps://", "ftp://", "mailto:", "news:", "telnet://"]

function isURL(urlcand) {
    for (let scheme of scheme_list)
        if (urlcand.startsWith(scheme))
            return true;
    return false;
}

function open() {
    browser.tabs.query({ currentWindow: true }).then((tabs) => {
        // save list of current urls
        let currentUrls = [];
        for (let tab of tabs) {
            currentUrls.push(tab.url);
        }
        // take urls from text in extension window
        let linesList;

        if (!fInput) {
            linesList = urlText.value.split('\n');
        } else {
            linesList = fInput.split('\n');
        }
        //linesList = "http://aaaa.com".split('\n');
        /* // Currently this step is optional
        // filter out URL lines, ignoring other lines, like: title line and empty line delimiters
        newUrls = linesList.filter(function(line) {
          return isURL(line);
        });
        */
        newUrls = linesList;
        for (let newurl of newUrls) {
            // Open only if line is not empty string, is actually URL, and is not currently opened
            if (newurl == "")
                continue;
            if (!isURL(newurl))
                continue;
            if (currentUrls.indexOf(newurl) >= 0)
                continue;
            browser.tabs.create({ url: newurl });
        }
        fInput = false;
    });
}

function copy() {
    let tmp = urlText.value;
    urlText.select();
    document.execCommand('Copy');

    // workaround to not have text selected after button click
    urlText.value = '';
    urlText.value = tmp;
}

function save() {
    let dl = document.createElement('a');

    dl.download = 'urls-list-' + Date.now() + '.txt'; // filename
    dl.href = window.URL.createObjectURL(
        new Blob([urlText.value], { type: 'text/plain' }) // file content
    );
    dl.onclick = event => document.body.removeChild(event.target);
    dl.style.display = 'none';
    document.body.appendChild(dl);
    dl.click();
}

function sort(desc = false) {
    let urls = urlText.value.split('\n');
    let cleanUrls = [];
    for (let i in urls) {
        let clean = urls[i].trim();
        if (clean !== '') {
            cleanUrls.push(clean);
        }
    }
    cleanUrls.sort();
    if (desc) {
        cleanUrls.reverse();
    }
    urlText.value = cleanUrls.join('\n') + '\n';
}

function sortAsc() {
    sort(false);
}

function sortDesc() {
    sort(true);
}

let filterBackup = '';
let filterMode = false;

function enableFilterMode() {
    if (!filterMode) {
        filterBackup = urlText.value;
        urlText.readOnly = true;
        urlText.style.backgroundColor = '#ddd';
        filterWarning.style.display = 'block';
        filterMode = true;
    }
}

function disableFilterMode() {
    if (filterMode) {
        urlText.value = filterBackup;
        urlText.readOnly = false;
        urlText.style.backgroundColor = '#fff';
        filterWarning.style.display = 'none';
        filterInput.style.backgroundColor = '#fff';
        filterInput.value = '';
        filterMode = false;
    }
}

function filter(e) {
    let val = e.target.value;
    filterInput.style.backgroundColor = '#fff';
    if (val !== '') {
        enableFilterMode();
        try {
            let re = new RegExp(val, 'i');
            let urls = filterBackup.split('\n');
            let filteredUrls = [];
            for (let i in urls) {
                let clean = urls[i].trim();
                if (clean !== '' && re.test(clean)) {
                    filteredUrls.push(clean);
                }
            }
            urlText.value = filteredUrls.join('\n') + '\n';
        } catch (ex) {
            filterInput.style.backgroundColor = '#fbb';
        }
    } else {
        disableFilterMode();
    }
}

function resetFilter() {
    disableFilterMode();
}

function readFile(e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        //savefl(e.target.result);
        let openfl = function(arg) {
            fInput = arg;
            open();
        }
        openfl(e.target.result);
    };
    reader.readAsText(file);
}


document.addEventListener('DOMContentLoaded', listTabs);
resetBtn.addEventListener('click', listTabs);
openBtn.addEventListener('click', open);
copyBtn.addEventListener('click', copy);
saveBtn.addEventListener('click', save);
sortAscBtn.addEventListener('click', sortAsc);
sortDescBtn.addEventListener('click', sortDesc);
resetFilterBtn.addEventListener('click', resetFilter);
filterInput.addEventListener('input', filter);
fopenBtn.addEventListener('click', function() { iFile.click(); });
iFile.addEventListener('change', readFile);