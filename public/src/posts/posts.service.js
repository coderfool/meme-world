angular.module('MemeWorld')
.service('PostsService', PostsService);

PostsService.$inject = ['$http', '$q', '$rootScope'];

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
    };

    service.getPost = function(postId) {
        const cancel = $q.defer();
        return $http({
            method: 'GET',
            url: `../posts/${postId}`,
            timeout: cancel.promise,
            cancel: cancel
        });
    };

    service.getComments = function(postId) {
        const cancel = $q.defer();
        return $http({
            method: 'GET',
            url: `../../posts/${postId}/comments`,
            timeout: cancel.promise,
            cancel: cancel
        });
    };

    service.addComment = function(postId, comment) {
        if (comment.text === '' && !comment.image) {
            return;
        }
        const formData = new FormData();
        formData.append('postId', postId);
        if (comment.text) {
            formData.append('text', comment.text);
        }
        if (comment.image) {
            formData.append('image', comment.image);
        }
    
        return $http.post(`../posts/${postId}/comments`, formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        });
    };

    service.editComment = function(comment) {
        if (comment.text === '' && !comment.image) {
            return Promise.reject('Comment cannot be empty');
        }
        
        return $http.put(`../posts/comments/${comment.id}`, comment);
    };
}