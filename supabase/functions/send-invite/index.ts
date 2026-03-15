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

// Auto-injected by Supabase
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
    const { email, token, projectTitle } = await req.json()
    console.log(`Sending invite to ${email} for project ${projectTitle} via Gmail SMTP`)

    if (!email || !token || !projectTitle) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate invite link (handle existing users gracefully)
    let magicLink: string | undefined
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: `${APP_URL}/invite?token=${token}` },
    })
    
    if (linkError) {
      console.log('User might exist, trying fallback...')
      const { data: fallbackData, error: fallbackError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${APP_URL}/invite?token=${token}` },
      })
      
      if (fallbackError) {
        console.error('Auth error:', fallbackError)
        return new Response(JSON.stringify({ error: `Supabase Auth Error: ${fallbackError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      magicLink = fallbackData.properties.action_link
    } else {
      magicLink = linkData.properties.action_link
    }

    console.log('Generated link successfully')

    // Send email via Gmail SMTP
    console.log('Connecting to Gmail SMTP...')
    const client = new SmtpClient()
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: GMAIL_USER,
      password: GMAIL_APP_PASSWORD,
    })

    console.log('Sending email...')
    await client.send({
      from: `Pink Gazelle <${GMAIL_USER}>`,
      to: email,
      subject: `You've been invited to ${projectTitle}`,
      content: "text/html",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#000;">Project Invitation</h2>
          <p>You've been invited to access the <strong>${projectTitle}</strong> client portal on PinkGazelle.</p>
          <p style="margin:30px 0;">
            <a href="${magicLink}" style="background:#000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Accept Invitation</a>
          </p>
          <p style="color:#666;font-size:12px;border-top:1px solid #eee;padding-top:20px;">
            If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
      `,
    })

    await client.close()

    console.log('Invitation email sent successfully via Gmail')
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-invite unexpected error:', err)
    return new Response(JSON.stringify({ error: `SMTP Error: ${(err as Error).message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
