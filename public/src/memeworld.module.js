angular.module('MemeWorld', ['ngMaterial', 'ngMessages', 'ui.router', 'ui.router.state.events'])
.config(config)
.factory('jwtInterceptor', jwtInterceptor)
.factory('loadingHttpInterceptor', loadingHttpInterceptor)
.controller('AppController', AppController)
.run(['$rootScope', '$http', function($rootScope, $http) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        $http.pendingRequests.forEach(function(request) {
            if (request.cancel) {
                request.cancel.resolve();
            }
        });
    });
}]);

config.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider'];

function config($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $stateProvider
    .state('home', {
        url: '/',
        templateUrl: '/src/home/home.template.html'
    })
    .state('registration', {
        url: '/registration',
        templateUrl: 'src/registration/registration.template.html',
        controller: 'RegistrationController as ctrl'
    })
    .state('post', {
        url: '/posts/{postId}',
        templateUrl: 'src/posts/post-expanded.template.html',
        controller: 'ExpandedPostController as ctrl',
        resolve: {
            postId: ['$stateParams', function($stateParams) {
                return $stateParams.postId;
            }]
        }
    });

    $urlRouterProvider.otherwise('/');
    $locationProvider.hashPrefix('');
    $httpProvider.interceptors.push('jwtInterceptor');
    $httpProvider.interceptors.push('loadingHttpInterceptor');
}

AppController.$inject = ['$mdDialog', '$mdMedia', '$rootScope', '$http'];

function AppController($mdDialog, $mdMedia, $rootScope, $http) {
    const ctrl = this;
    const jwt = localStorage.getItem('jwt');
    if (jwt === null) {
        $rootScope.loggedIn = false;
    }
    else {
        $http.get(`../users/verifyJWT/${jwt}`)
        .then(res => {
            if (res.data.expired) {
                $rootScope.loggedIn = false;
                localStorage.removeItem('jwt');
                localStorage.removeItem('user');
            }
            else {
                $rootScope.loggedIn = true;
                $rootScope.user = JSON.parse(localStorage.getItem('user'));
            }
        })
        .catch(err => {
            console.error(err);
        })
    }
    
    $rootScope.loginPrompt = function() {
        $mdDialog.show({
            templateUrl: 'src/login/login.template.html',
            clickOutsideToClose: true,
            fullscreen: !$mdMedia('gt-sm'),
            controller: LoginController,
            controllerAs: 'ctrl'
        });
    }

    ctrl.showUserMenu = function($mdMenu, $event) {
        $mdMenu.open($event);
    }

    ctrl.logOut = function() {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        $http.get('../users/logout')
        .then(res => {
            $rootScope.loggedIn = false;
            $rootScope.user = null;
        })
        .catch(err => {
            console.error(err);
        });
        window.location.reload();
    }
}

LoginController.$inject = ['$mdDialog', '$http', '$rootScope'];

function LoginController($mdDialog, $http, $rootScope) {
    const ctrl = this;
    ctrl.username = '';
    ctrl.password = '';
    ctrl.err = {};
    ctrl.messages = {
        unauthorized: 'Invalid username or password',
        invalidUsername: 'Please enter your correct username',
        passwordReset: 'Your new password has been sent to your registered email ID',
        default: 'Something went wrong. Please check your internet connection and try again.'
    }

    ctrl.close = function() {
        $mdDialog.hide();
    }
    
    ctrl.clearErrors = function() {
        ctrl.err = {};
    }

    ctrl.resetPassword = function() {
        ctrl.clearErrors();
        if (!ctrl.username || ctrl.username.trim() === '') {
            ctrl.err.invalidUsername = true;
            return;
        }
        $http.get(`../users/${ctrl.username}/resetPassword`)
        .then(res => {
            ctrl.err.passwordReset = true;
        })
        .catch(err => {
            if (err.data && err.data.error.status === 404) {
                ctrl.err.invalidUsername = true;
            }
            else {
                ctrl.err.default = true;
            }
        });
    }

    ctrl.submit = function(valid) {
        if (!valid) {
            return;
        }

        $http.post('../users/login', {
            username: ctrl.username,
            password: ctrl.password
        })
        .then(res => {
            localStorage.setItem('jwt', res.data.token);
            $http.get(`../users/${res.data.userId}`)
            .then(res => {
                localStorage.setItem('user', JSON.stringify(res.data));
                $rootScope.user = res.data;
                ctrl.close();
                setTimeout(function() {
                    $rootScope.loggedIn = true;
                }, 1000);
                window.location.reload();
            })
            .catch(err => {
                console.error(err);
            })
        })
        .catch(err => {
            ctrl.err.unauthorized = true;
        });
    }
}

jwtInterceptor.$inject = ['$q'];

function jwtInterceptor($q) {
    return {
        request: function(config) {
            const jwt = localStorage.getItem('jwt');
            if (jwt) {
                config.headers['Authorization'] = 'bearer ' + jwt;
            }
            return config;
        },
        requestError: function(err) {
            return $q.reject(err);
        }
    };
}

loadingHttpInterceptor.$inject = ['$rootScope', '$q'];

function loadingHttpInterceptor($rootScope, $q) {
    let loadingCount = 0;
    const eventName = 'httpLoading';

    return {
        request: function(config) {
            if (++loadingCount === 1) {
                $rootScope.$broadcast(eventName, {on: true});
            }
            return config;
        },
        response: function(res) {
            if (--loadingCount === 0) {
                $rootScope.$broadcast(eventName, {on: false});
            }
            return res;
        },
        responseError: function(err) {
            if (--loadingCount === 0) {
                $rootScope.$broadcast(eventName, {on: false});
            }
            return $q.reject(err);
        }
    };
}