angular.module('MemeWorld')
.controller('RegistrationController', RegistrationController);

RegistrationController.$inject = ['$http', '$mdToast'];

function RegistrationController($http, $mdToast) {
    const ctrl = this;
    ctrl.username = '';
    ctrl.email = '';
    ctrl.password = '';
    ctrl.image = null;
    ctrl.imgSrc = '';

    ctrl.messages = {
        invalidEmail: 'Please enter a valid email',
        imageTooLarge: 'Max. image size should be 15 MB'
    }

    ctrl.setImageSrc = function(src, imgFile) {
        ctrl.imgSrc = src;
        ctrl.image = imgFile;
    };

    ctrl.removeImage = function() {
        ctrl.image = null;
        ctrl.imgSrc = '';
        ctrl.clearErrors();
    }

    ctrl.clearErrors = function() {
        ctrl.err = '';
    }
    
    ctrl.submit = function(valid) {
        if (!valid) {
            return;
        }
        
        const formData = new FormData();
        formData.append('email', ctrl.email);
        formData.append('username', ctrl.username);
        formData.append('password', ctrl.password);

        if (ctrl.image) {
            formData.append('image', ctrl.image);
        } 
        
        $http.post('../users/signup', formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .then(res => {
            registration.reset();
            ctrl.removeImage();
            $mdToast.show(
                $mdToast.simple()
                .textContent('You have been registered successfully')
                .position('left right bottom')
                .hideDelay(3000)
                .action('Close')
                .actionKey('c')
                .highlightAction(true)
                .highlightClass('md-accent'))
            .then(function(res) {
                $mdToast.hide();
            })
            .catch(angular.noop);
        })
        .catch(err => {
            if (err.data && err.data.error && err.data.error.status === 413) {
                ctrl.err = 'Max. image size should be 15 MB';
            }
            else if (err.data && err.data.error) {
                ctrl.err = err.data.error.message;
            }
            else {
                console.error(err);
            }
        });
    }
}