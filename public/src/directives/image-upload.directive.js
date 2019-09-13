angular.module('MemeWorld')
.directive('imageUpload', ['$rootScope', function($rootScope) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {            
            element.on('change', function(event) {
                const targetElem = event.target;
                if (targetElem.files && targetElem.files[0]) {
                    const file = targetElem.files[0];
                    const reader = new FileReader();
                    const eventName = 'httpLoading';   
                    reader.onload = function(event) {        
                        scope.ctrl.imgSrc = 'data:image/png;base64,' + window.btoa(event.target.result);
                        scope.ctrl.image = file;
                        $rootScope.$broadcast(eventName, {on: false});
                        $rootScope.$digest();
                    }
                    reader.readAsBinaryString(file);
                    $rootScope.$broadcast(eventName, {on: true});
                    $rootScope.$digest();
                }
            }); 
        }
    };
}]);