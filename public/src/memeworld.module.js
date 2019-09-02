angular.module('MemeWorld', ['ngMaterial', 'ngMessages', 'ui.router'])
.config(config)
.factory('jwtInterceptor', jwtInterceptor)
.controller('AppController', AppController);

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
    });

    $urlRouterProvider.otherwise('/');
    $locationProvider.hashPrefix('');
    $httpProvider.interceptors.push('jwtInterceptor');
}

AppController.$inject = ['$mdDialog', '$mdMedia', '$rootScope'];

function AppController($mdDialog, $mdMedia, $rootScope) {
    const ctrl = this;
    $rootScope.loggedIn = (localStorage.getItem('jwt') !== null);
    $rootScope.user = JSON.parse(localStorage.getItem('user'));
    
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
        window.location.reload();
        setTimeout(function() {
            $rootScope.loggedIn = false;
            $rootScope.user = null;
        }, 1000);
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
            console.log('password reset');
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
            })
            .catch(err => {
                console.error(err.data);
            })
            $rootScope.loggedIn = true;
            ctrl.close();
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