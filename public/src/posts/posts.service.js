angular.module('MemeWorld')
.service('PostsService', PostsService);

PostsService.$inject = ['$http'];

function PostsService ($http) {
    const service = this;

    service.getPosts = function() {
        return $http.get('../posts');
    } 
}