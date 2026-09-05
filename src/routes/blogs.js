const express = require('express');
const {
    getBlogs,
    getBlogBySlug,
    createBlog,
    updateBlog,
    deleteBlog,
} = require('../controllers/blogs');

const { optionalProtect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(getBlogs)
    .post(optionalProtect, createBlog);

router.route('/:slug')
    .get(getBlogBySlug);

router.route('/id/:id')
    .put(optionalProtect, updateBlog)
    .delete(optionalProtect, deleteBlog);

// Direct :id fallbacks for PUT and DELETE
router.route('/:id')
    .put(optionalProtect, updateBlog)
    .delete(optionalProtect, deleteBlog);

module.exports = router;
