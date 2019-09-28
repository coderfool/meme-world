angular.module('MemeWorld')
.controller('ProfileController', ProfileController);

ProfileController.$inject = ['$rootScope', '$mdDialog', '$mdToast', '$http'];

function ProfileController($rootScope, $mdDialog, $mdToast, $http) {
    const ctrl = this;
    ctrl.delete = false;

    ctrl.messages = {
        invalidEmail: 'Please enter a valid email',
        imageTooLarge: 'Max. image size should be 8 MB',
        incorrectPassword: 'Please enter your correct password',
        newPassword: 'Please enter a new password'
    };

    ctrl.err = {};

    ctrl.$onInit = function() {
        ctrl.initializeForm();
    };

    ctrl.initializeForm = function() {
        ctrl.username = $rootScope.user.username;
        ctrl.email = $rootScope.user.email;
        ctrl.image = $rootScope.user.image;
        ctrl.password = '';
        ctrl.newPassword = '';
        ctrl.passwordConfirm = '';
        ctrl.imgSrc = $rootScope.user.image ? `data:image/png;base64,${$rootScope.user.image}` : '';
        ctrl.clearErrors();
    };

    ctrl.close = function() {
        $mdDialog.hide();
    };

    ctrl.setImageSrc = function(src, imgFile) {
        ctrl.imgSrc = src;
        ctrl.image = imgFile;
    };

    ctrl.removeImage = function() {
        ctrl.image = null;
        ctrl.imgSrc = '';
        ctrl.clearErrors();
    };

    ctrl.clearErrors = function() {
        ctrl.err = {};
    };

    ctrl.submit = function(valid) {
        if (!valid) {
            return;
        }
        if (ctrl.password === '' && ctrl.newPassword !== '') {
            ctrl.err.passwordErr = true;
            return;
        }
        if (ctrl.password !== '' && ctrl.newPassword === '') {
            ctrl.err.newPasswordErr = true;
            return;
        }

        const formData = new FormData();
        formData.append('image', ctrl.image);
        formData.append('username', ctrl.username);
        formData.append('email', ctrl.email);

        if (ctrl.password && ctrl.newPassword) {
            formData.append('oldPassword', ctrl.password);
            formData.append('newPassword', ctrl.newPassword);
        }

        $http.put(`../users/${$rootScope.user._id}`, formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .then(res => {
            $rootScope.user = res.data;
            localStorage.setItem('user', JSON.stringify(res.data));
            $mdToast.show(
                $mdToast.simple()
                .textContent('Details updated successfully')
                .position('left right')
                .hideDelay(3000)
                .action('Close')
                .actionKey('c')
                .highlightAction(true)
                .highlightClass('md-accent'))
            .then(function(res) {
                $mdToast.hide();
            })
            .catch(angular.noop);
            ctrl.close();
        })
        .catch(err => {
            if (err.data && err.data.error && err.data.error.status === 413) {
                ctrl.err.imageErr = true;
            }
            else if (err.data && err.data.error) {
                ctrl.err.other = true;
                ctrl.messages.other = err.data.error.message;
            }
            else {
                console.error(err);
            }
        });
    };

    ctrl.deleteAccount = function() {
        $http.post('../users/login', {
            username: $rootScope.user.username,
            password: ctrl.passwordConfirm
        })
        .then(res => {
            $http.delete(`../users/${$rootScope.user._id}`)
            .then(res => {
                $rootScope.loggedIn = false;
                $rootScope.user = null;
                localStorage.removeItem('jwt');
                localStorage.removeItem('user');
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('Account deleted successfully')
                    .position('left right')
                    .hideDelay(3000)
                    .action('Close')
                    .actionKey('c')
                    .highlightAction(true)
                    .highlightClass('md-accent'))
                .then(function(res) {
                    $mdToast.hide();
                })
                .catch(angular.noop);
                ctrl.close();
                setTimeout(function() {
                    window.location.reload();
                }, 1000);
            })
            .catch(err => {
                console.error(err);
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('Could not delete your account :(')
                    .position('left right')
                    .hideDelay(3000)
                    .action('Close')
                    .actionKey('c')
                    .highlightAction(true)
                    .highlightClass('md-accent'))
                .then(function(res) {
                    $mdToast.hide();
                })
                .catch(angular.noop);
            });
        })
        .catch(err => {
            ctrl.err.deleteErr = true;
        });
    };
}