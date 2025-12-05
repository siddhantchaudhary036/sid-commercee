import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { subject, htmlContent } = await request.json();

    if (!subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Subject and HTML content are required' },
        { status: 400 }
      );
    }

    // Get authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get user's email from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    const userEmail = user.emailAddresses.find((email: any) => email.id === user.primaryEmailAddressId)?.emailAddress;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unable to verify user email' },
        { status: 400 }
      );
    }

    // Validate SMTP configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUsername = process.env.SMTP_USERNAME;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const senderEmail = process.env.SMTP_SENDER_EMAIL_ADDRESS;
    const senderName = process.env.SMTP_SENDER_NAME;

    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !senderEmail) {
      return NextResponse.json(
        { error: 'SMTP configuration is incomplete. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Clean HTML content - remove markdown code fences if present
    let cleanHtml = htmlContent.trim();
    
    // Remove ```html at the start and ``` at the end
    if (cleanHtml.startsWith('```html')) {
      cleanHtml = cleanHtml.replace(/^```html\s*\n?/, '');
    } else if (cleanHtml.startsWith('```')) {
      cleanHtml = cleanHtml.replace(/^```\s*\n?/, '');
    }
    
    if (cleanHtml.endsWith('```')) {
      cleanHtml = cleanHtml.replace(/\n?```\s*$/, '');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
    });

    // Send email to user's own email address
    const info = await transporter.sendMail({
      from: `"${senderName || 'Test Email'}" <${senderEmail}>`,
      to: userEmail,
      subject: subject,
      html: cleanHtml,
    });

    console.log('Email sent:', info.messageId);

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId 
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
