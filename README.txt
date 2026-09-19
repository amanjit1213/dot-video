DOT VIDEO - FINAL PACKAGE

All website files are inside this single folder.

Public home:
- Dot Video.html

Public pages:
- Desi Videos.html
- English Movies.html
- Player.html

Admin pages:
- Admin Login.html
- Admin Panel.html

JavaScript/CSS/config:
- Dot Video.js
- Dot Video.css
- Desi Videos.js / Desi Videos.css
- English Movies.js / English Movies.css
- Player.js / Player.css
- Admin Login.js / Admin Login.css
- Admin Panel.js / Admin Panel.css
- supabase-config.js

Database:
- Supabase RLS Setup.sql

Included test video:
- Amannya_Web_Compatible.mp4

IMPORTANT:
1. The website uses the Supabase project configured in supabase-config.js.
2. The videos and posters Supabase Storage buckets must be Public for public playback.
3. Run Supabase RLS Setup.sql in Supabase SQL Editor.
4. Upload Amannya_Web_Compatible.mp4 to the videos bucket if you want to use it as the Amannya video.
5. Update the corresponding videos table row's video_url to the new public Storage URL after upload.
6. Only upload/stream content you have the legal rights or permission to distribute.
7. Never put a Supabase service_role/secret key in browser files.


PLAYER NOTES (latest)
- Full-screen now has a CSS fallback for Acode/local preview frames that block the browser Fullscreen API.
- The 3-dot Download starts a normal browser download of the public MP4 URL. Android browsers normally place downloaded files in Downloads; a plain HTML website cannot force-save a file directly into the Gallery. Direct Gallery/Photos saving requires a native Android wrapper/app using Android MediaStore.
