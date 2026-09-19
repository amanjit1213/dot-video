const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const passedUrl = String(params.get("url") || "").trim();
const passedTitle = params.get("title");
const passedDescription = params.get("description");

const player = document.getElementById("videoPlayer");
const noVideo = document.getElementById("noVideo");
const title = document.getElementById("title");
const description = document.getElementById("description");
const centerPlayBtn = document.getElementById("centerPlayBtn");
const playPauseBtn = document.getElementById("playPauseBtn");
const back10Btn = document.getElementById("back10Btn");
const forward10Btn = document.getElementById("forward10Btn");
const muteBtn = document.getElementById("muteBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const moreBtn = document.getElementById("moreBtn");
const moreMenu = document.getElementById("moreMenu");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const playerWrap = document.getElementById("playerWrap");
const controls = document.getElementById("controls");
const downloadBtn = document.getElementById("downloadBtn");
const playerDownloadBtn = document.getElementById("playerDownloadBtn");
const downloadProgress = document.getElementById("downloadProgress");
const downloadProgressBar = document.getElementById("downloadProgressBar");
const downloadProgressText = document.getElementById("downloadProgressText");
const downloadProgressSize = document.getElementById("downloadProgressSize");
const shareBtn = document.getElementById("shareBtn");
const likeBtn = document.getElementById("likeBtn");
const dislikeBtn = document.getElementById("dislikeBtn");
const actionMessage = document.getElementById("actionMessage");

function showMessage(text) {
  noVideo.textContent = text;
  noVideo.style.display = "block";
}

function hideMessage() {
  noVideo.style.display = "none";
}

function showActionMessage(text) {
  actionMessage.textContent = text;
  clearTimeout(showActionMessage.timer);
  showActionMessage.timer = setTimeout(() => {
    actionMessage.textContent = "";
  }, 2500);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  return `${minutes}:${String(secs).padStart(2,"0")}`;
}

function updateTime() {
  currentTimeEl.textContent = formatTime(player.currentTime);
  durationEl.textContent = formatTime(player.duration);
  if (Number.isFinite(player.duration) && player.duration > 0) {
    progress.value = String((player.currentTime / player.duration) * 100);
  }
}

function updatePlayButtons() {
  const paused = player.paused || player.ended;
  playPauseBtn.textContent = paused ? "▶" : "❚❚";
  playPauseBtn.setAttribute("aria-label", paused ? "Play" : "Pause");
  centerPlayBtn.classList.toggle("hidden", !paused || player.ended);
}

async function togglePlay() {
  try {
    if (player.paused || player.ended) await player.play();
    else player.pause();
  } catch (error) {
    console.error("PLAY ERROR:", error);
    showMessage("Tap Play again to start the video.");
  }
  updatePlayButtons();
}

function seekBy(seconds) {
  if (!Number.isFinite(player.duration)) return;
  player.currentTime = Math.min(player.duration, Math.max(0, player.currentTime + seconds));
  updateTime();
}

function toggleMute() {
  player.muted = !player.muted;
  muteBtn.textContent = player.muted ? "🔇" : "🔊";
  muteBtn.setAttribute("aria-label", player.muted ? "Unmute" : "Mute");
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      return;
    }
    if (playerWrap.requestFullscreen) {
      await playerWrap.requestFullscreen({navigationUI:"hide"});
      return;
    }
    if (playerWrap.webkitRequestFullscreen) {
      playerWrap.webkitRequestFullscreen();
      return;
    }
    playerWrap.classList.add("app-fullscreen");
    document.body.classList.add("player-fullscreen");
    fullscreenBtn.textContent = "✕";
  } catch (error) {
    console.warn("FULLSCREEN ERROR:", error);
    playerWrap.classList.add("app-fullscreen");
    document.body.classList.add("player-fullscreen");
    fullscreenBtn.textContent = "✕";
  }
}

function setVideo(url) {
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl) throw new Error("Video URL is empty.");
  showMessage("Loading video...");
  player.pause();
  player.removeAttribute("src");
  player.load();
  player.src = cleanUrl;
  player.load();
}

async function getVideoFromDatabase() {
  const config = window.DOT_VIDEO_SUPABASE;
  if (!config || !config.url || !config.publishableKey) throw new Error("Supabase configuration not found.");
  if (!id) throw new Error("No video selected.");

  const endpoint = `${config.url}/rest/v1/videos?select=title,description,video_url,published&id=eq.${encodeURIComponent(id)}&published=eq.true`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, Accept: "application/json"}
  });
  if (!response.ok) throw new Error("Database request failed: " + response.status);
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Video was not found or is not published.");
  return rows[0];
}

function safeFileName() {
  const clean = (title.textContent || "Dot-Video").replace(/[^a-z0-9\-_ ]/gi, "").trim();
  return clean || "Dot-Video";
}

function makeDownloadUrl(url, filename) {
  try {
    const u = new URL(url);
    u.searchParams.set("download", filename);
    return u.toString();
  } catch {
    return url;
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 100 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function setDownloadProgress(percent, loaded, total) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  downloadProgress.hidden = false;
  downloadProgressBar.style.width = safePercent + "%";
  downloadProgressText.textContent = `Downloading ${Math.round(safePercent)}%`;
  downloadProgressSize.textContent = total > 0
    ? `${formatBytes(loaded)} / ${formatBytes(total)}`
    : formatBytes(loaded);
}

function finishDownloadProgress() {
  downloadProgressBar.style.width = "100%";
  downloadProgressText.textContent = "Download 100%";
}

function resetDownloadProgress() {
  downloadProgress.hidden = true;
  downloadProgressBar.style.width = "0%";
  downloadProgressText.textContent = "Downloading 0%";
  downloadProgressSize.textContent = "";
}

function triggerBrowserDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}

function downloadWithProgress(downloadUrl, filename) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", downloadUrl, true);
    xhr.responseType = "blob";

    xhr.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        setDownloadProgress((event.loaded / event.total) * 100, event.loaded, event.total);
      } else {
        downloadProgress.hidden = false;
        downloadProgressText.textContent = "Downloading...";
        downloadProgressSize.textContent = formatBytes(event.loaded);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const total = Number(xhr.getResponseHeader("Content-Length")) || xhr.response.size;
        setDownloadProgress(100, total, total);
        finishDownloadProgress();
        try {
          triggerBrowserDownload(xhr.response, filename);
          resolve();
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`Download failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error while downloading."));
    xhr.onabort = () => reject(new Error("Download cancelled."));
    xhr.send();
  });
}

async function downloadVideo() {
  try {
    const url = String(player.currentSrc || player.src || "").trim();
    if (!url) {
      showActionMessage("Video is not ready for download.");
      return;
    }

    downloadBtn.disabled = true;
    playerDownloadBtn.disabled = true;
    downloadBtn.querySelector("span").textContent = "Downloading...";
    playerDownloadBtn.textContent = "…";
    moreMenu.hidden = true;

    const filename = safeFileName() + ".mp4";
    const downloadUrl = makeDownloadUrl(url, filename);

    setDownloadProgress(0, 0, 0);
    showActionMessage("Downloading video...");

    await downloadWithProgress(downloadUrl, filename);

    showActionMessage("Download successfully");
    downloadProgressText.textContent = "Download 100%";
  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);
    showActionMessage(error.message === "Download cancelled."
      ? "Download cancelled."
      : "Download failed. Please try again.");
  } finally {
    downloadBtn.disabled = false;
    playerDownloadBtn.disabled = false;
    downloadBtn.querySelector("span").textContent = "Download";
    playerDownloadBtn.textContent = "⇩";
  }
}

async function shareVideo() {
  const shareData = {
    title: title.textContent || "Dot Video",
    text: description.textContent || "Watch this video on Dot Video.",
    url: window.location.href
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      showActionMessage("Video link copied.");
    } else {
      showActionMessage("Share is not supported here.");
    }
  } catch (error) {
    if (error && error.name !== "AbortError") showActionMessage("Share could not be opened.");
  }
}

async function loadVideo() {
  try {
    if (passedTitle) title.textContent = passedTitle;
    if (passedDescription) description.textContent = passedDescription;
    if (passedUrl) {
      setVideo(passedUrl);
      return;
    }
    const data = await getVideoFromDatabase();
    title.textContent = data.title || "Dot Video";
    description.textContent = data.description || "";
    setVideo(data.video_url);
  } catch (error) {
    console.error("PLAYER ERROR:", error);
    showMessage("Error: " + (error.message || error));
  }
}

centerPlayBtn.addEventListener("click", togglePlay);
playPauseBtn.addEventListener("click", togglePlay);
back10Btn.addEventListener("click", () => seekBy(-10));
forward10Btn.addEventListener("click", () => seekBy(10));
muteBtn.addEventListener("click", toggleMute);
fullscreenBtn.addEventListener("click", toggleFullscreen);
downloadBtn.addEventListener("click", downloadVideo);
playerDownloadBtn.addEventListener("click", downloadVideo);
shareBtn.addEventListener("click", shareVideo);

likeBtn.addEventListener("click", () => {
  likeBtn.classList.toggle("active");
  dislikeBtn.classList.remove("active");
  likeBtn.firstChild.textContent = likeBtn.classList.contains("active") ? "♥ " : "♡ ";
});

dislikeBtn.addEventListener("click", () => {
  dislikeBtn.classList.toggle("active");
  likeBtn.classList.remove("active");
  dislikeBtn.firstChild.textContent = dislikeBtn.classList.contains("active") ? "♣ " : "♧ ";
});

moreBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  moreMenu.hidden = !moreMenu.hidden;
});

document.addEventListener("click", (event) => {
  if (!moreMenu.contains(event.target) && event.target !== moreBtn) moreMenu.hidden = true;
});

moreMenu.querySelectorAll("button[data-speed]").forEach((button) => {
  button.addEventListener("click", () => {
    player.playbackRate = Number(button.dataset.speed);
    moreMenu.hidden = true;
  });
});

progress.addEventListener("input", () => {
  if (!Number.isFinite(player.duration) || player.duration <= 0) return;
  player.currentTime = (Number(progress.value) / 100) * player.duration;
  updateTime();
});

player.addEventListener("loadedmetadata", () => { hideMessage(); updateTime(); updatePlayButtons(); });
player.addEventListener("canplay", () => { hideMessage(); updatePlayButtons(); });
player.addEventListener("timeupdate", updateTime);
player.addEventListener("durationchange", updateTime);
player.addEventListener("play", updatePlayButtons);
player.addEventListener("playing", () => { hideMessage(); updatePlayButtons(); });
player.addEventListener("pause", updatePlayButtons);
player.addEventListener("ended", () => { updateTime(); updatePlayButtons(); });
player.addEventListener("volumechange", () => { muteBtn.textContent = player.muted || player.volume === 0 ? "🔇" : "🔊"; });
player.addEventListener("error", () => showMessage("Video could not be loaded in this preview."));

document.addEventListener("fullscreenchange", () => {
  const active = Boolean(document.fullscreenElement);
  if (active) {
    fullscreenBtn.textContent = "✕";
  } else if (!playerWrap.classList.contains("app-fullscreen")) {
    fullscreenBtn.textContent = "⛶";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && playerWrap.classList.contains("app-fullscreen")) {
    playerWrap.classList.remove("app-fullscreen");
    document.body.classList.remove("player-fullscreen");
    fullscreenBtn.textContent = "⛶";
  }
});

document.getElementById("backBtn").onclick = () => history.back();
document.getElementById("homeBtn").onclick = () => location.href = "Dot Video.html";

showMessage("Loading video...");
updatePlayButtons();
loadVideo();
