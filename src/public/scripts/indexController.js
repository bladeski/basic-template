import idb from 'idb';
const feather = require('feather-icons');

function openDatabase() {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
        return Promise.resolve();
    }

    return idb.open('wittr', 1, function(upgradeDb) {
        var store = upgradeDb.createObjectStore('basicDb', {
            keyPath: 'id'
        });
        store.createIndex('by-date', 'time');
    });
}

export default function IndexController(container) {
    this._container = container;
    this._dbPromise = openDatabase();
    this._registerServiceWorker();
}

IndexController.prototype._registerServiceWorker = function() {
    if (!navigator.serviceWorker) return;

    var indexController = this;

    navigator.serviceWorker.register('/sw.js').then(function(reg) {
        if (!navigator.serviceWorker.controller) {
            return;
        }

        if (reg.waiting) {
            indexController._updateReady(reg.waiting);
            return;
        }

        if (reg.installing) {
            indexController._trackInstalling(reg.installing);
          return;
        }

        reg.addEventListener('updatefound', function() {
            indexController._trackInstalling(reg.installing);
        });
    });

    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    var refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
    });
};

IndexController.prototype._trackInstalling = function(worker) {
    var indexController = this;
    worker.addEventListener('statechange', function() {
        if (worker.state == 'installed') {
            indexController._updateReady(worker);
        }
    });
};

IndexController.prototype._updateReady = function(worker) {

};

// open a connection to the server for live updates
IndexController.prototype._openSocket = function() {

};

// called when the web socket sends message data
IndexController.prototype._onSocketMessage = function(data) {

};
