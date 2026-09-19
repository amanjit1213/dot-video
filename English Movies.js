const list = document.getElementById("list");
const status = document.getElementById("status");
const { url, publishableKey } = window.DOT_VIDEO_SUPABASE;

async function load() {
  try {
    status.textContent = "Loading English Movies...";
    const endpoint = `${url}/rest/v1/videos?select=id,title,description,poster_url,video_url,category,published,created_at&published=eq.true&category=in.(english,%22English%20Movies%22)&order=created_at.desc`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        Accept: "application/json"
      }
    });
    if (!response.ok) throw new Error(`Database request failed (${response.status})`);

    const data = await response.json();
    list.innerHTML = "";
    if (!data.length) {
      status.textContent = "No English movies yet.";
      return;
    }
    status.textContent = "";
    data.forEach(addCard);
  } catch (e) {
    console.error(e);
    status.textContent = "Database error: " + e.message;
  }
}

function addCard(v) {
  const el = document.createElement("article");
  el.className = "card";

  if (v.poster_url) {
    const img = document.createElement("img");
    img.src = v.poster_url;
    img.alt = v.title || "Video";
    img.loading = "lazy";
    img.onerror = () => img.remove();
    el.appendChild(img);
  }

  const body = document.createElement("div");
  body.className = "card-body";
  const h = document.createElement("h2");
  h.textContent = v.title || "Untitled";
  const p = document.createElement("p");
  p.textContent = v.description || "";
  body.append(h, p);
  el.appendChild(body);

  const query = new URLSearchParams();
  query.set("id", v.id);
  if (v.video_url) query.set("url", v.video_url);
  if (v.title) query.set("title", v.title);
  if (v.description) query.set("description", v.description);
  el.onclick = () => location.href = "Player.html?" + query.toString();

  list.appendChild(el);
}

document.getElementById("backBtn").onclick = () => history.back();
document.getElementById("homeBtn").onclick = () => location.href = "Dot Video.html";
load();
