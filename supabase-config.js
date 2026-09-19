window.DOT_VIDEO_SUPABASE = {
  url: "https://fjggecynhdxvafaqrtxf.supabase.co",
  publishableKey: "sb_publishable_JG73txrt8kS9nGVaosqWJA_FB2ajCE-"
};

// Supabase JS is loaded explicitly by the admin pages before this file.
// Public pages use the REST API directly, which avoids CDN/client timing issues.
if (window.supabase && window.supabase.createClient) {
  window.supabaseClient = window.supabase.createClient(
    window.DOT_VIDEO_SUPABASE.url,
    window.DOT_VIDEO_SUPABASE.publishableKey
  );
}
