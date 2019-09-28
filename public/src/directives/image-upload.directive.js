angular.module('MemeWorld')
.directive('imageUpload', ['$rootScope', function($rootScope) {
    return {
        restrict: 'A',
        scope: {
            previewImage: '<'
        },
        link: function(scope, element, attrs) {
            element.on('click', function(event) {
                event.target.value = '';
            });

            element.on('change', function(event) {
                const targetElem = event.target;
                
                if (targetElem.files && targetElem.files[0]) {                    
                    const file = targetElem.files[0];
                    const regex = /\.(jpg|jpeg|png|gif)$/i;
                    if (!regex.test(file.name)) {
                        return;
                    }
                    
                    const reader = new FileReader();
                    const eventName = 'httpLoading';   
                    reader.onload = function(event) {        
                        const imgSrc = 'data:image/png;base64,' + window.btoa(event.target.result);
                        scope.previewImage(imgSrc, file);
                        $rootScope.$broadcast(eventName, {on: false});
                        $rootScope.$digest();
                    };
                    reader.readAsBinaryString(file);
                    $rootScope.$broadcast(eventName, {on: true});
                    $rootScope.$digest();
                }
            }); 
        }
    };
}]);