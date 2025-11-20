import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { customerCount = 1000 } = body;
    
    const result = await convex.mutation(api.seed.seedDatabase, {
      userId: body.convexUserId,
      customerCount,
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}
