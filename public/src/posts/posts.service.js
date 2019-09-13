angular.module('MemeWorld')
.service('PostsService', PostsService);

PostsService.$inject = ['$http', '$q'];

function PostsService ($http, $q) {
    const service = this;

    service.getPosts = function() {
        const cancel = $q.defer();
        return $http({
            method: 'GET',
            url: '../posts',
            timeout: cancel.promise,
            cancel: cancel
        });
    } 
}