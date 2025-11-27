import { serve } from "http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

serve(async (req: Request) => {
  try {
    // 1. Validate Environment Variables
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    // 2. Parse Auth Hook Payload
    const payload = await req.json();
    const { user } = payload;

    if (!user || !user.email) {
      throw new Error("Missing user email in payload");
    }

    console.log(`📧 Sending welcome email to: ${user.email}`);

    // Extract user name from metadata or email
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || '朋友';

    // 4. Welcome Email HTML Template
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans TC', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9466EE; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #eee; }
        .feature { margin-bottom: 15px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #9466EE; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .feature h3 { margin-top: 0; color: #2c3e50; }
        .feature p { margin-bottom: 0; }
        .button { display: inline-block; background-color: #9466EE; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; transition: background-color 0.2s; }
        .button:hover { background-color: #8250d6; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }
        .footer a { color: #888; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>歡迎使用 ToDo - 待辦清單 👋</h1>
        </div>
        <div class="content">
            <h2>嗨 ${userName}，</h2>
            <p>感謝您選擇 ToDo - 待辦清單！我們打造這個 App 是因為相信簡單、直覺的待辦清單能讓生活更有條理。</p>
            
            <div class="feature">
                <h3>📝 建立您的第一個任務</h3>
                <p>點擊右下角的 + 按鈕，開始記錄您的待辦事項。設定日期和時間，讓 App 在適當時機提醒您。</p>
            </div>

            <div class="feature">
                <h3>📱 將 Widget 加入主畫面</h3>
                <p>長按 iPhone 主畫面，新增 Widget，即可直接在桌面查看今日待辦事項，無需開啟 App。</p>
            </div>

            <div class="feature">
                <h3>☁️ 自動雲端同步</h3>
                <p>您的任務會自動同步到雲端，換裝置也不怕資料遺失。隨時隨地都能掌握您的待辦清單。</p>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                    <td align="center">
                        <a href="https://to-do-mvp.vercel.app" style="display: inline-block; background-color: #9466EE; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">立即使用</a>
                    </td>
                </tr>
                <tr>
                    <td align="center">
                        <a href="https://docs.google.com/forms/d/e/1FAIpQLSclqPkboMn_BVtOHojyIsS47ydbZaU7MEjca_Qvkh_eHqpM5w/viewform" style="display: inline-block; background-color: transparent; color: #9466EE !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; border: 2px solid #9466EE;">提供意見回饋</a>
                    </td>
                </tr>
            </table>
        </div>
        <div class="footer">
            <p>ToDo - 待辦清單 團隊 敬上</p>
        </div>
    </div>
</body>
</html>
    `;

    // 5. Send Email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ToDo-待辦清單 <onboarding@resend.dev>",
        to: [user.email],
        subject: "歡迎使用 ToDo！",
        html: html,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`✅ Welcome email sent successfully to ${user.email}`);
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.error(`❌ Failed to send welcome email: ${JSON.stringify(data)}`);
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }
  } catch (error: any) {
    console.error("❌ Error in send-welcome-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
