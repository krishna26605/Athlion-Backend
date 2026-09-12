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

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await connectDB();

    let blog;
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(slug);
    }
    if (!blog) {
      blog = await Blog.findOne({ slug: slug.toLowerCase() });
    }

    if (!blog) {
      return errorResponse('Blog post not found', 404);
    }

    return jsonResponse({ success: true, data: blog });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin', 'staff');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { slug } = await params;
    await connectDB();
    const body = await req.json();

    let blog;
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(slug);
    }
    if (!blog) {
      blog = await Blog.findOne({ slug: slug.toLowerCase() });
    }

    if (!blog) {
      return errorResponse('Blog post not found', 404);
    }

    if (body.title && !body.slug) {
      body.slug = slugify(body.title);
    } else if (body.slug) {
      body.slug = slugify(body.slug);
    }

    if (typeof body.tags === 'string') {
      body.tags = body.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    body.updatedAt = new Date();

    const updatedBlog = await Blog.findByIdAndUpdate(blog._id, body, {
      new: true,
      runValidators: true,
    });

    return jsonResponse({ success: true, data: updatedBlog });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { errorResponse: authError } = await requireRole(req, 'admin', 'staff');
    if (authError) {
      return errorResponse(authError.message, authError.status);
    }

    const { slug } = await params;
    await connectDB();

    let blog;
    if (slug.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(slug);
    }
    if (!blog) {
      blog = await Blog.findOne({ slug: slug.toLowerCase() });
    }

    if (!blog) {
      return errorResponse('Blog post not found', 404);
    }

    await Blog.findByIdAndDelete(blog._id);
    return jsonResponse({ success: true, data: {} });
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }
}
