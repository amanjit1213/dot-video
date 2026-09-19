const list = document.getElementById("list");
const status = document.getElementById("status");
const { url, publishableKey } = window.DOT_VIDEO_SUPABASE;

async function loadDesi() {
  try {
    status.textContent = "Loading Desi Videos...";
    const endpoint = `${url}/rest/v1/videos?select=id,title,category,description,poster_url,video_url,published,created_at&published=eq.true&category=in.(desi,%22Desi%20Videos%22)&order=created_at.desc`;
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
      status.textContent = "No Desi videos found.";
      return;
    }

    status.textContent = "";
    data.forEach(addCard);
  } catch (error) {
    console.error(error);
    status.textContent = "Database error: " + error.message;
  }
}

function addCard(video) {
  const card = document.createElement("article");
  card.className = "card";

  if (video.poster_url) {
    const img = document.createElement("img");
    img.src = video.poster_url;
    img.alt = video.title || "Video";
    img.loading = "lazy";
    img.onerror = () => img.remove();
    card.appendChild(img);
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h2");
  title.textContent = video.title || "Untitled";

  const desc = document.createElement("p");
  desc.textContent = video.description || "";

  body.append(title, desc);
  card.appendChild(body);

  // Pass the already verified video_url directly to Player.html.
  // The Player can still fall back to the database when this parameter is absent.
  const query = new URLSearchParams();
  query.set("id", video.id);
  if (video.video_url) query.set("url", video.video_url);
  if (video.title) query.set("title", video.title);
  if (video.description) query.set("description", video.description);

  card.onclick = () => {
    location.href = "Player.html?" + query.toString();
  };

  list.appendChild(card);
}

document.getElementById("backBtn").onclick = () => history.back();
document.getElementById("homeBtn").onclick = () => location.href = "Dot Video.html";

loadDesi();
