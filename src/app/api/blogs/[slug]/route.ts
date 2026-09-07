import { NextRequest } from 'next/server';
import connectDB from '@/lib/db';
import Blog from '@/lib/models/Blog';
import { jsonResponse, errorResponse } from '@/lib/api-response';

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
