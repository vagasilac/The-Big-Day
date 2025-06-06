
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

interface GuestDetails {
  name: string;
  plusOneAllowed?: boolean;
  plusOneName?: string;
  headOfFamily?: boolean;
  personalMessage?: string;
}

interface WeddingDetails {
  title: string;
  dateISO: string; // Date as ISO string
  location: string;
}

export async function POST(req: Request) {
  try {
    const {
      email, // Guest's email
      link,  // Wedding website link
      preview,
      guestDetails,
      weddingDetails,
    } = await req.json() as {
      email: string;
      link: string;
      preview?: boolean;
      guestDetails: GuestDetails;
      weddingDetails: WeddingDetails;
    };

    if (!email || !link || !guestDetails || !weddingDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { name: guestName, plusOneAllowed, plusOneName, headOfFamily, personalMessage } = guestDetails;
    const { title: weddingTitle, dateISO, location: weddingLocation } = weddingDetails;

    let formattedDate = 'Date to be announced';
    let formattedTime = 'Time to be announced';

    if (dateISO) {
      try {
        const dateObj = new Date(dateISO);
        formattedDate = format(dateObj, "EEEE, MMMM do, yyyy");
        formattedTime = format(dateObj, "h:mm a");
      } catch (e) {
        console.error("Error formatting date:", e);
        // Keep default values if formatting fails
      }
    }
    
    const currentYear = new Date().getFullYear();

    // Email theme colors (approximations from your globals.css)
    const primaryColor = "#e6a4b4"; // Soft Pink
    const textColor = "#23262b"; // Dark Gray-Blue
    const mutedTextColor = "#8a8c91"; // Gray
    const sectionBgColor = "#fcf5ed"; // Very Light Peach/Cream
    const headerTextColor = "#795548"; // Brownish for headings on light bg

    const html = `
      <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: ${textColor}; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="background-color: ${primaryColor}; padding: 25px 20px; text-align: center; border-bottom: 1px solid #eee;">
          <h1 style="font-family: 'Times New Roman', Times, serif; color: white; margin: 0; font-size: 28px; font-weight: bold;">${weddingTitle}</h1>
        </div>
        <div style="padding: 25px 30px;">
          <p style="font-size: 1.1em; margin-bottom: 20px;">Dearest ${guestName},</p>
          <p style="font-size: 1.05em;">We joyfully invite you to celebrate with us as we exchange vows and begin our new life together.</p>
          <p style="font-size: 1.05em; margin-bottom: 25px;">Your presence would mean the world to us on this special day.</p>

          <div style="margin: 30px 0; padding: 20px; background-color: ${sectionBgColor}; border-radius: 6px; border-left: 5px solid ${primaryColor};">
            <h2 style="font-family: 'Times New Roman', Times, serif; color: ${headerTextColor}; margin-top: 0; margin-bottom: 15px; font-size: 1.5em;">Event Details</h2>
            <p style="margin-bottom: 8px;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin-bottom: 8px;"><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Location:</strong> ${weddingLocation}</p>
          </div>

          ${plusOneAllowed ? `
            <p style="font-size: 1.05em; margin-bottom: 15px;">
              You are welcome to bring a guest.
              ${plusOneName ? ` We look forward to celebrating with ${plusOneName} too!` : ''}
            </p>
          ` : ''}

          ${headOfFamily ? `
            <p style="font-size: 1.05em; margin-bottom: 15px;">
              We are also delighted to extend this invitation to your family.
            </p>
          ` : ''}

          ${personalMessage ? `
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px dashed #ddd;">
              <h3 style="font-family: 'Times New Roman', Times, serif; color: ${headerTextColor}; margin-top: 0; margin-bottom: 8px; font-size: 1.25em;">A Special Note for You:</h3>
              <p style="font-style: italic; color: ${mutedTextColor};">"${personalMessage}"</p>
            </div>
          ` : ''}

          <p style="margin-top: 30px; font-size: 1.05em;">For more details, including directions, accommodations, and our gift registry, please visit our wedding website:</p>
          <p style="text-align: center; margin-top: 20px; margin-bottom: 25px;">
            <a href="${link}" target="_blank" style="background-color: ${primaryColor}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 1.05em;">
              Visit Our Website
            </a>
          </p>

          <p style="margin-top: 30px; font-size: 1.05em;">With love and excitement,</p>
          <p style="font-family: 'Times New Roman', Times, serif; font-size: 1.3em; color: ${primaryColor}; margin-top: 5px;">The Happy Couple</p>
        </div>
        <div style="background-color: #f8f8f8; padding: 15px 20px; text-align: center; font-size: 0.85em; color: #777; border-top: 1px solid #eee;">
          <p style="margin:0;">&copy; ${currentYear} ${weddingTitle}</p>
        </div>
      </div>
    `;

    if (preview) {
      return NextResponse.json({ success: true, html });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true', //
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `You're Invited to ${weddingTitle}!`,
      html,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error('Error sending invitation:', err);
    // Try to return a JSON error even if parsing req.json() fails or other errors occur early
    let errorMessage = 'Failed to send invitation';
    if (err instanceof SyntaxError && err.message.includes("JSON")) {
        errorMessage = "Invalid request format.";
    } else if (err.message) {
        errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
