require.config({
    shim : {
        bootstrap : { deps :['jquery', 'popper'] }
    },
    paths: {
        jquery: '/lib/jquery/jquery.min',
        bootstrap: '/lib/bootstrap-material-design/bootstrap-material-design.min',
        popper: '/lib/popper.js/popper',
        knockout: '/lib/knockout/knockout-latest',
        'perfect-scrollbar': '/lib/perfect-scrollbar/js/perfect-scrollbar.min',
        'socket.io': '/lib/socket.io/socket.io',
        babel: '/lib/babel/polyfill.min',
        'feather-icons': '/lib/feather-icons/feather.min'
    }
});
