/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  uniqueId?: string;
  redirectTo?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") ?? "";

    const body = (await req.json().catch(() => ({}))) as Body;
    const uniqueIdRaw = (body.uniqueId ?? "").trim();

    if (uniqueIdRaw.length < 3 || uniqueIdRaw.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow safe characters to avoid query issues.
    if (!/^[a-zA-Z0-9\-_]+$/.test(uniqueIdRaw)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const redirectTo = (() => {
      const candidate = (body.redirectTo ?? "").trim();
      if (!candidate) return origin || "/";
      // Prevent open-redirect: only allow redirecting back to the caller origin when present.
      if (origin && candidate.startsWith(origin)) return candidate;
      return origin || "/";
    })();

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const variants = Array.from(
      new Set([uniqueIdRaw, uniqueIdRaw.toLowerCase(), uniqueIdRaw.toUpperCase()]),
    );

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("email, unique_id")
      .in("unique_id", variants)
      .maybeSingle();

    if (profileError) {
      return new Response(JSON.stringify({ error: "Lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = profile?.email;
    if (!email) {
      return new Response(JSON.stringify({ error: "Account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (linkError || !linkData?.properties?.action_link) {
      return new Response(JSON.stringify({ error: "Could not generate login link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ actionLink: linkData.properties.action_link }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
