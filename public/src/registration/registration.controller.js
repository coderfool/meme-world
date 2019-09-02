angular.module('MemeWorld')
.controller('RegistrationController', RegistrationController);

RegistrationController.$inject = ['$http'];

function RegistrationController($http) {
    const ctrl = this;
    ctrl.username = '';
    ctrl.email = '';
    ctrl.password = '';

    ctrl.messages = {
        usernameTaken: 'Username is taken',
        invalidEmail: 'Please enter valid email',
        imageTooLarge: 'Max. image size should be 15 MB'
    }

    ctrl.uploadImage = function() {
        const file = document.querySelector('#profilePic').files[0];
        const fr = new FileReader();
        fr.onload = function() {
            ctrl.profilePic = 'data:image/png;base64,' + fr.result;
            console.log(ctrl.profilePic);
        }
        fr.readAsDataURL(file);
    }

    ctrl.clearErrors = function() {
        ctrl.err = '';
    }
    
    ctrl.submit = function(valid) {
        if (!valid) {
            return;
        }

        $http.post('../users/signup', {
            username: ctrl.username,
            email: ctrl.email, 
            password: ctrl.password
        })
        .then(res => {
            ctrl.success = 'You have been registered';
        })
        .catch(err => {
            ctrl.err = err.data.error.message;
        });
    }
}