angular.module('MemeWorld')
.controller('ResetPasswordController', ResetPasswordController);

const baseUrl = 'https://meme-world.herokuapp.com';

ResetPasswordController.$inject = ['$location', '$http', '$mdToast', '$state'];

function ResetPasswordController($location, $http, $mdToast, $state) {
    const ctrl = this;
    ctrl.password = '';
    ctrl.confirmPassword = '';
    
    ctrl.clearErrors = function() {
        ctrl.err = '';
    };

    ctrl.submit = function(valid) {
        if (!valid) {
            return;
        }
        
        if (ctrl.password !== ctrl.confirmPassword) {
            ctrl.err = 'Passwords do not match';
            return;
        }
        
        ctrl.processing = true;

        $http.post($location.absUrl(), {
            password: ctrl.password
        })
        .then(res => {
            resetPassword.reset();
            $mdToast.show(
                $mdToast.simple()
                .textContent('You password was reset successfully')
                .position('left right bottom')
                .hideDelay(2000)
                .action('Close')
                .actionKey('c')
                .highlightAction(true)
                .highlightClass('md-accent'))
            .then(function(res) {
                $mdToast.hide();
                window.location.href = baseUrl;
            })
            .catch(angular.noop);
            ctrl.processing = false;
        })
        .catch(err => {
            if (err.data && err.data.error) {
                ctrl.err = err.data.error.message;
            }
            else {
                console.error(err);
            }
            ctrl.processing = false;
        });
    };
}