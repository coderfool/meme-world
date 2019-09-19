angular.module('MemeWorld')
.component('posts', {
    templateUrl: 'src/posts/posts.template.html',
    controller: PostsController,
});

PostsController.$inject = ['PostsService'];

function PostsController(PostsService) {
    const ctrl = this;
    ctrl.messages = {
        default: 'Something went wrong. Please check your internet connection and try again.'
    };
    ctrl.posts = [];
    posts = PostsService.getPosts();
    posts.then(res => {
        ctrl.posts = res.data;
        console.log(ctrl.posts);
    })
    .catch(err => {
        if (err.xhrStatus !== 'abort') {
            ctrl.err = true;
        }
    });
}