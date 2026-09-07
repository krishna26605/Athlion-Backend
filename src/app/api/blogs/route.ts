import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Blog from '@/lib/models/Blog';
import { requireRole } from '@/lib/auth';
import { jsonResponse, errorResponse } from '@/lib/api-response';

function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const all = searchParams.get('all');
    const limit = searchParams.get('limit');

    await connectDB();
    const query: any = {};

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

    return jsonResponse({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin', 'staff');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    await connectDB();
    const body = await req.json();
    const {
      title,
      slug,
      content,
      excerpt,
      category,
      coverImage,
      author,
      readTime,
      tags,
      metaTitle,
      metaDescription,
      isPublished,
    } = body;

    if (!title || !content || !excerpt) {
      return errorResponse('Title, excerpt, and content are required.', 400);
    }

    let generatedSlug = slug ? slugify(slug) : slugify(title);
    if (!generatedSlug) {
      generatedSlug = `article-${Date.now()}`;
    }

    const existingBlog = await Blog.findOne({ slug: generatedSlug });
    let finalSlug = generatedSlug;
    if (existingBlog) {
      finalSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
    }

    const processedTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

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

    return jsonResponse({ success: true, data: blog }, 201);
  } catch (err: any) {
    if (err.code === 11000) {
      return errorResponse('An article with this title or slug already exists.', 400);
    }
    return errorResponse(err.message || 'Failed to create blog post.', 400);
  }
}
