const Blog = require('../models/Blog');

// Helper function to generate slug from title
const slugify = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res, next) => {
    try {
        const { category, tag, all, limit } = req.query;
        let query = {};

        // If not requesting all (for admin), only return published blogs
        if (all !== 'true') {
            query.isPublished = true;
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        if (tag) {
            query.tags = tag;
        }

        let blogQuery = Blog.find(query).sort({ createdAt: -1 });

        if (limit) {
            blogQuery = blogQuery.limit(parseInt(limit, 10));
        }

        const blogs = await blogQuery;

        res.status(200).json({
            success: true,
            count: blogs.length,
            data: blogs,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        
        // Find by slug or by Mongo ID
        let blog;
        if (slug.match(/^[0-9a-fA-F]{24}$/)) {
            blog = await Blog.findById(slug);
        }
        if (!blog) {
            blog = await Blog.findOne({ slug: slug.toLowerCase() });
        }

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog post not found' });
        }

        res.status(200).json({ success: true, data: blog });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Create new blog post
// @route   POST /api/blogs
// @access  Private (Admin)
exports.createBlog = async (req, res, next) => {
    try {
        const { title, slug, content, excerpt, category, coverImage, author, readTime, tags, metaTitle, metaDescription, isPublished } = req.body;

        if (!title || !content || !excerpt) {
            return res.status(400).json({ success: false, message: 'Title, excerpt, and content are required.' });
        }

        let generatedSlug = slug ? slugify(slug) : slugify(title);
        if (!generatedSlug) {
            generatedSlug = `article-${Date.now()}`;
        }

        // Check if slug already exists
        const existingBlog = await Blog.findOne({ slug: generatedSlug });
        let finalSlug = generatedSlug;
        if (existingBlog) {
            finalSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
        }

        const processedTags = Array.isArray(tags) 
            ? tags 
            : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);

        const blog = await Blog.create({
            title,
            slug: finalSlug,
            content,
            excerpt,
            category: category || 'Functional Fitness',
            coverImage: coverImage || '',
            author: author || 'Athlion Team',
            readTime: readTime || '5 min read',
            tags: processedTags,
            metaTitle: metaTitle || title,
            metaDescription: metaDescription || excerpt,
            isPublished: isPublished !== undefined ? isPublished : true,
        });

        res.status(201).json({ success: true, data: blog });
    } catch (err) {
        console.error('❌ [Blog Creation Error]:', err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'An article with this title or slug already exists.' });
        }
        res.status(400).json({ success: false, message: err.message || 'Failed to create blog post.' });
    }
};

// @desc    Update blog post
// @route   PUT /api/blogs/:id
// @access  Private (Admin)
exports.updateBlog = async (req, res, next) => {
    try {
        let blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog post not found' });
        }

        if (req.body.title && !req.body.slug) {
            req.body.slug = slugify(req.body.title);
        } else if (req.body.slug) {
            req.body.slug = slugify(req.body.slug);
        }

        if (typeof req.body.tags === 'string') {
            req.body.tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
        }

        req.body.updatedAt = Date.now();

        blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: blog });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete blog post
// @route   DELETE /api/blogs/:id
// @access  Private (Admin)
exports.deleteBlog = async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog post not found' });
        }

        await Blog.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
