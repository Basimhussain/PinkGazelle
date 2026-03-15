import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"
import { writeAll } from "https://deno.land/std@0.177.0/streams/write_all.ts"
import { readAll } from "https://deno.land/std@0.177.0/streams/read_all.ts"

// Polyfill missing Deno functions required by the old smtp library
if (!Deno.writeAll) {
  (Deno as any).writeAll = writeAll
}
if (!Deno.readAll) {
  (Deno as any).readAll = readAll
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:5173'
const GMAIL_USER = Deno.env.get('GMAIL_USER')!
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    console.log(`Verifying email eligibility for ${email}`)

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if email is invited or already a user
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    const { data: invite } = await adminClient
      .from('project_invites')
      .select('id')
      .eq('email', email)
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (!profile && !invite) {
      console.log(`Unauthorized login attempt for: ${email}`)
      return new Response(JSON.stringify({ error: 'This email is not registered or invited to any projects.' }), {
        status: 403, // Forbidden
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Sending magic link to eligible user: ${email} via Gmail SMTP`)

    // Generate magic link
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${APP_URL}/client` },
    })
    
    if (error) {
      console.error('Auth error:', error)
      return new Response(JSON.stringify({ error: `Supabase Auth Error: ${error.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const magicLink = data.properties.action_link

    // Send email via Gmail SMTP
    const client = new SmtpClient()
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: GMAIL_USER,
      password: GMAIL_APP_PASSWORD,
    })

    await client.send({
      from: `Pink Gazelle <${GMAIL_USER}>`,
      to: email,
      subject: `Your Secure Login Link for Pink Gazelle`,
      content: "text/html",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;border:1px solid #eee;border-radius:12px;text-align:center;">
          <div style="background:#000;width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto;color:#fff;font-weight:600;font-size:18px;">PG</div>
          <h2 style="color:#111;margin-bottom:12px;font-size:24px;">Secure Login Link</h2>
          <p style="color:#444;font-size:16px;line-height:1.5;margin-bottom:32px;">
            Click the button below to sign in to your Pink Gazelle client portal.<br/>
            This link will expire soon and can only be used once.
          </p>
          <p style="margin:32px 0;">
            <a href="${magicLink}" style="background:#000;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;">Sign In to Portal</a>
          </p>
          <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:24px;margin-top:40px;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>
      `,
    })

    await client.close()

    console.log('Magic link email sent successfully')
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-login-link unexpected error:', err)
    return new Response(JSON.stringify({ error: `SMTP Error: ${(err as Error).message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
