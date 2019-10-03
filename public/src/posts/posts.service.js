angular.module('MemeWorld')
.service('PostsService', PostsService);

PostsService.$inject = ['$http', '$q', '$rootScope'];

function PostsService ($http, $q) {
    const service = this;
    
    service.getPosts = function(index) {
        const cancel = $q.defer();
        return  $http({
            method: 'GET',
            url: `../posts/index/${index}`,
            timeout: cancel.promise,
            cancel: cancel
        })
        .then(res => {
            if (service.allPosts) {
                service.allPosts = [...service.allPosts, ...res.data];
            }
            else {
                service.allPosts = res.data;
            }
            return res.data;
        })
        .catch(err => {
            return Promise.reject(err);
        });
    };

    service.getPost = function(postId) {
        const cancel = $q.defer();
        return $http({
            method: 'GET',
            url: `../posts/${postId}`,
            timeout: cancel.promise,
            cancel: cancel
        })
        .then(res => {
            return res.data;
        })
        .catch(err => {
            return Promise.reject(err);
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
        const formData = new FormData();
        if (comment.text) {
            formData.append('text', comment.text);
        }
        if (comment.image) {
            formData.append('image', comment.image);
        }
        return $http.put(`../posts/comments/${comment.id}`, formData, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        });
    };

    service.getMyPosts = function(userId) {
        const cancel = $q.defer();
        return  $http({
            method: 'GET',
            url: `../posts/by/${userId}`,
            timeout: cancel.promise,
            cancel: cancel
        })
        .then(res => {
            return res.data;
        })
        .catch(err => {
            return Promise.reject(err);
        });
    };
    
    service.removePost = function(postId) {
        if (!service.allPosts) {
            return;
        }
        
        const index = service.allPosts.findIndex(post => post._id === postId);
        service.allPosts.splice(index, 1);
    };
}
