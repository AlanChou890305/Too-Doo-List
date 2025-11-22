import { serve } from "http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  subject: string;
  html: string;
  testEmail?: string; // If provided, only send to this email
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validate Environment Variables
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase Configuration");
    }

    // 2. Parse Request Body
    const { subject, html, testEmail }: EmailRequest = await req.json();

    if (!subject || !html) {
      throw new Error("Missing 'subject' or 'html' in request body");
    }

    // 3. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // 4. Fetch Users
    let recipients: { email: string; id: string }[] = [];

    if (testEmail) {
      console.log(`🧪 Test Mode: Sending only to ${testEmail}`);
      // For testing, we just use a dummy ID or try to find the user
      recipients = [{ email: testEmail, id: "test-user-id" }];
    } else {
      // Fetch all users from auth.users
      const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000 // Adjust as needed
      });

      if (userError) throw userError;

      // Filter out unsubscribed users
      recipients = users
        .filter((u: any) => {
          const isUnsubscribed = u.user_metadata?.unsubscribed === true;
          if (isUnsubscribed) {
            console.log(`🚫 Skipping unsubscribed user: ${u.email}`);
          }
          return !isUnsubscribed && !!u.email;
        })
        .map((u: any) => ({ email: u.email!, id: u.id }));
      
      console.log(`📢 Found ${recipients.length} subscribed users to email.`);
    }

    // 5. Send Emails via Resend API
    const results = [];
    
    for (const recipient of recipients) {
        // Generate Unsubscribe Link
        const unsubscribeUrl = `${SUPABASE_URL}/functions/v1/unsubscribe?uid=${recipient.id}`;
        
        // Inject Link into HTML
        // We replace {unsubscribe_url} with the actual link
        const personalizedHtml = html.replace(/{unsubscribe_url}/g, unsubscribeUrl);

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "ToDo-待辦清單 <onboarding@resend.dev>", 
                to: [recipient.email],
                subject: subject,
                html: personalizedHtml,
                headers: {
                  "List-Unsubscribe": `<${unsubscribeUrl}>`
                }
            }),
        });
        
        const data = await res.json();
        results.push({ email: recipient.email, status: res.status, data });
    }

    return new Response(
      JSON.stringify({ message: "Emails processed", count: results.length, results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
