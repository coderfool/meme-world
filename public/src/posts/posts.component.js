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
    const posts = PostsService.getPosts();
    posts.then(res => {
        ctrl.posts = res.data;
    })
    .catch(err => {
        ctrl.err = true;
    });
}