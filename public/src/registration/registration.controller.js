angular.module('MemeWorld')
.controller('RegistrationController', RegistrationController);

RegistrationController.$inject = ['$http'];

function RegistrationController($http) {
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

    ctrl.removeImage = function() {
        ctrl.image = null;
        ctrl.imgSrc = '';
        document.getElementById('image').value = '';
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
            ctrl.success = 'You have been registered. Please login to continue.';
        })
        .catch(err => {
            if (err.data.error.status === 413) {
                ctrl.err = ctrl.messages.imageTooLarge;
            }
            else {
                ctrl.err = err.data.error.message;
            }
        });
    }
}