const params = new URLSearchParams(window.location.search);

const id = params.get("id");
const passedUrl = String(params.get("url") || "").trim();
const passedTitle = params.get("title");
const passedDescription = params.get("description");


// ===============================
// DOM ELEMENTS
// ===============================

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
const likeCount = document.getElementById("likeCount");

const viewCount = document.getElementById("viewCount");

const actionMessage = document.getElementById("actionMessage");


// ===============================
// SUPABASE CONFIG
// ===============================

const config = window.DOT_VIDEO_SUPABASE;


// ===============================
// MESSAGE FUNCTIONS
// ===============================

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


// ===============================
// TIME FORMAT
// ===============================

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const total = Math.floor(seconds);

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}


// ===============================
// VIDEO TIME
// ===============================

function updateTime() {
  currentTimeEl.textContent = formatTime(player.currentTime);
  durationEl.textContent = formatTime(player.duration);

  if (
    Number.isFinite(player.duration) &&
    player.duration > 0
  ) {
    progress.value = String(
      (player.currentTime / player.duration) * 100
    );
  }
}


// ===============================
// PLAY BUTTON
// ===============================

function updatePlayButtons() {
  const paused = player.paused || player.ended;

  playPauseBtn.textContent = paused ? "▶" : "❚❚";

  playPauseBtn.setAttribute(
    "aria-label",
    paused ? "Play" : "Pause"
  );

  centerPlayBtn.classList.toggle(
    "hidden",
    !paused || player.ended
  );
}


async function togglePlay() {
  try {
    if (player.paused || player.ended) {
      await player.play();
    } else {
      player.pause();
    }
  } catch (error) {
    console.error("PLAY ERROR:", error);
    showMessage("Tap Play again to start the video.");
  }

  updatePlayButtons();
}


// ===============================
// SEEK
// ===============================

function seekBy(seconds) {
  if (!Number.isFinite(player.duration)) {
    return;
  }

  player.currentTime = Math.min(
    player.duration,
    Math.max(0, player.currentTime + seconds)
  );

  updateTime();
}


// ===============================
// MUTE
// ===============================

function toggleMute() {
  player.muted = !player.muted;

  muteBtn.textContent = player.muted
    ? "🔇"
    : "🔊";

  muteBtn.setAttribute(
    "aria-label",
    player.muted ? "Unmute" : "Mute"
  );
}


// ===============================
// FULLSCREEN
// ===============================

async function toggleFullscreen() {
  try {

    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement
    ) {

      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }

      return;
    }


    if (playerWrap.requestFullscreen) {

      await playerWrap.requestFullscreen({
        navigationUI: "hide"
      });

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


// ===============================
// SET VIDEO
// ===============================

function setVideo(url) {

  const cleanUrl = String(url || "").trim();

  if (!cleanUrl) {
    throw new Error("Video URL is empty.");
  }

  showMessage("Loading video...");

  player.pause();

  player.removeAttribute("src");

  player.load();

  player.src = cleanUrl;

  player.load();
}


// ===============================
// DATABASE VIDEO
// ===============================

async function getVideoFromDatabase() {

  if (
    !config ||
    !config.url ||
    !config.publishableKey
  ) {
    throw new Error(
      "Supabase configuration not found."
    );
  }

  if (!id) {
    throw new Error("No video selected.");
  }


  const endpoint =
    `${config.url}/rest/v1/videos` +
    `?select=title,description,video_url,published,views,likes` +
    `&id=eq.${encodeURIComponent(id)}` +
    `&published=eq.true`;


  const response = await fetch(endpoint, {

    method: "GET",

    headers: {
      apikey: config.publishableKey,
      Authorization: `Bearer ${config.publishableKey}`,
      Accept: "application/json"
    }

  });


  if (!response.ok) {
    throw new Error(
      "Database request failed: " +
      response.status
    );
  }


  const rows = await response.json();


  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    throw new Error(
      "Video was not found or is not published."
    );
  }


  return rows[0];
}


// ===============================
// SUPABASE RPC
// ===============================

async function callRpc(functionName, body) {

  if (
    !config ||
    !config.url ||
    !config.publishableKey
  ) {
    throw new Error(
      "Supabase configuration not found."
    );
  }


  const response = await fetch(
    `${config.url}/rest/v1/rpc/${functionName}`,
    {
      method: "POST",

      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },

      body: JSON.stringify(body)
    }
  );


  if (!response.ok) {

    const errorText = await response.text();

    throw new Error(
      `RPC ${functionName} failed: ${response.status} ${errorText}`
    );
  }


  return await response.json();
}


// ===============================
// DEVICE / USER ID
// ===============================

function getVoterId() {

  const storageKey = "dot_video_voter_id";

  let voterId = localStorage.getItem(storageKey);


  if (!voterId) {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {

      voterId = window.crypto.randomUUID();

    } else {

      voterId =
        Date.now().toString(36) +
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2);
    }


    localStorage.setItem(
      storageKey,
      voterId
    );
  }


  return voterId;
}


// ===============================
// LOAD LIKE / VIEW COUNTS
// ===============================

function setCounts(views, likes) {

  viewCount.textContent =
    Number(views || 0).toLocaleString();

  likeCount.textContent =
    Number(likes || 0).toLocaleString();
}


// ===============================
// INCREMENT VIEW
// ===============================

async function incrementView() {

  if (!id) {
    return;
  }


  try {

    const newViews = await callRpc(
      "increment_video_views",
      {
        p_video_id: id
      }
    );


    viewCount.textContent =
      Number(newViews || 0).toLocaleString();

  } catch (error) {

    console.error(
      "VIEW ERROR:",
      error
    );
  }
}


// ===============================
// CHECK LIKE STATUS
// ===============================

async function checkLikeStatus() {

  if (!id) {
    return;
  }


  try {

    const voterId = getVoterId();


    const alreadyLiked = await callRpc(
      "has_video_like",
      {
        p_video_id: id,
        p_voter_id: voterId
      }
    );


    if (alreadyLiked === true) {

      likeBtn.classList.add("liked");

      likeBtn.setAttribute(
        "aria-pressed",
        "true"
      );

    } else {

      likeBtn.classList.remove("liked");

      likeBtn.setAttribute(
        "aria-pressed",
        "false"
      );
    }


  } catch (error) {

    console.error(
      "LIKE STATUS ERROR:",
      error
    );
  }
}


// ===============================
// LIKE VIDEO
// ===============================

async function likeVideo() {

  if (!id) {

    showActionMessage(
      "Like is not available for this video."
    );

    return;
  }


  if (
    likeBtn.disabled ||
    likeBtn.classList.contains("liked")
  ) {

    showActionMessage(
      "You already liked this video."
    );

    return;
  }


  try {

    likeBtn.disabled = true;


    const voterId = getVoterId();


    const newLikes = await callRpc(
      "like_video_once",
      {
        p_video_id: id,
        p_voter_id: voterId
      }
    );


    likeCount.textContent =
      Number(newLikes || 0).toLocaleString();


    likeBtn.classList.add("liked");

    likeBtn.setAttribute(
      "aria-pressed",
      "true"
    );


    showActionMessage(
      "Liked ❤️"
    );


  } catch (error) {

    console.error(
      "LIKE ERROR:",
      error
    );

    showActionMessage(
      "Like failed. Please try again."
    );

  } finally {

    likeBtn.disabled = false;
  }
}


// ===============================
// SHARE VIDEO
// ===============================

async function shareVideo() {

  const shareUrl =
    new URL(
      "Player.html",
      window.location.href
    );


  if (id) {
    shareUrl.searchParams.set(
      "id",
      id
    );
  } else if (passedUrl) {

    shareUrl.searchParams.set(
      "url",
      passedUrl
    );
  }


  if (title.textContent) {

    shareUrl.searchParams.set(
      "title",
      title.textContent
    );
  }


  const finalUrl =
    shareUrl.href;


  const shareTitle =
    `${title.textContent || "Video"} — Dot Video`;


  const shareText =
    `${shareTitle}\n${finalUrl}`;


  try {

    if (
      navigator.share &&
      typeof navigator.share === "function"
    ) {

      await navigator.share({

        title: shareTitle,

        text: shareText,

        url: finalUrl

      });

      return;
    }


    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {

      await navigator.clipboard.writeText(
        finalUrl
      );

      showActionMessage(
        "Video link copied."
      );

      return;
    }


    showActionMessage(
      "Share is not supported here."
    );


  } catch (error) {

    if (
      error &&
      error.name === "AbortError"
    ) {
      return;
    }


    console.error(
      "SHARE ERROR:",
      error
    );


    showActionMessage(
      "Share could not be opened."
    );
  }
}


// ===============================
// DOWNLOAD
// ===============================

function safeFileName() {

  const clean =
    (title.textContent || "Dot-Video")
      .replace(
        /[^a-z0-9\-_ ]/gi,
        ""
      )
      .trim();


  return clean || "Dot-Video";
}


function makeDownloadUrl(
  url,
  filename
) {

  try {

    const u = new URL(url);

    u.searchParams.set(
      "download",
      filename
    );

    return u.toString();

  } catch {

    return url;
  }
}


function formatBytes(bytes) {

  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "";
  }


  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];


  let value = bytes;
  let unit = 0;


  while (
    value >= 1024 &&
    unit < units.length - 1
  ) {

    value /= 1024;
    unit++;
  }


  return `${value.toFixed(
    value >= 100 || unit === 0
      ? 0
      : 1
  )} ${units[unit]}`;
}


function setDownloadProgress(
  percent,
  loaded,
  total
) {

  const safePercent =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) || 0
      )
    );


  downloadProgress.hidden = false;

  downloadProgressBar.style.width =
    safePercent + "%";


  downloadProgressText.textContent =
    `Downloading ${Math.round(
      safePercent
    )}%`;


  downloadProgressSize.textContent =
    total > 0
      ? `${formatBytes(loaded)} / ${formatBytes(total)}`
      : formatBytes(loaded);
}


function finishDownloadProgress() {

  downloadProgressBar.style.width =
    "100%";

  downloadProgressText.textContent =
    "Download 100%";
}


function resetDownloadProgress() {

  downloadProgress.hidden = true;

  downloadProgressBar.style.width =
    "0%";

  downloadProgressText.textContent =
    "Downloading 0%";

  downloadProgressSize.textContent =
    "";
}


function triggerBrowserDownload(
  blob,
  filename
) {

  const objectUrl =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = objectUrl;

  link.download = filename;

  link.style.display = "none";


  document.body.appendChild(link);

  link.click();

  link.remove();


  setTimeout(() => {

    URL.revokeObjectURL(
      objectUrl
    );

  }, 60000);
}


function downloadWithProgress(
  downloadUrl,
  filename
) {

  return new Promise(
    (resolve, reject) => {

      const xhr =
        new XMLHttpRequest();


      xhr.open(
        "GET",
        downloadUrl,
        true
      );


      xhr.responseType =
        "blob";


      xhr.onprogress =
        (event) => {

          if (
            event.lengthComputable &&
            event.total > 0
          ) {

            setDownloadProgress(
              (
                event.loaded /
                event.total
              ) * 100,
              event.loaded,
              event.total
            );

          } else {

            downloadProgress.hidden =
              false;

            downloadProgressText.textContent =
              "Downloading...";

            downloadProgressSize.textContent =
              formatBytes(
                event.loaded
              );
          }
        };


      xhr.onload = () => {

        if (
          xhr.status >= 200 &&
          xhr.status < 300
        ) {

          const total =
            Number(
              xhr.getResponseHeader(
                "Content-Length"
              )
            ) ||
            xhr.response.size;


          setDownloadProgress(
            100,
            total,
            total
          );


          finishDownloadProgress();


          try {

            triggerBrowserDownload(
              xhr.response,
              filename
            );

            resolve();

          } catch (error) {

            reject(error);
          }


        } else {

          reject(
            new Error(
              `Download failed (${xhr.status})`
            )
          );
        }
      };


      xhr.onerror = () => {

        reject(
          new Error(
            "Network error while downloading."
          )
        );
      };


      xhr.onabort = () => {

        reject(
          new Error(
            "Download cancelled."
          )
        );
      };


      xhr.send();
    }
  );
}


async function downloadVideo() {

  try {

    const url =
      String(
        player.currentSrc ||
        player.src ||
        ""
      ).trim();


    if (!url) {

      showActionMessage(
        "Video is not ready for download."
      );

      return;
    }


    downloadBtn.disabled =
      true;

    playerDownloadBtn.disabled =
      true;


    const downloadText =
      downloadBtn.querySelector("span");


    if (downloadText) {
      downloadText.textContent =
        "Downloading...";
    }


    playerDownloadBtn.textContent =
      "…";


    moreMenu.hidden =
      true;


    const filename =
      safeFileName() + ".mp4";


    const downloadUrl =
      makeDownloadUrl(
        url,
        filename
      );


    setDownloadProgress(
      0,
      0,
      0
    );


    showActionMessage(
      "Downloading video..."
    );


    await downloadWithProgress(
      downloadUrl,
      filename
    );


    showActionMessage(
      "Download successfully"
    );


    downloadProgressText.textContent =
      "Download 100%";


  } catch (error) {

    console.error(
      "DOWNLOAD ERROR:",
      error
    );


    showActionMessage(
      error.message ===
      "Download cancelled."
        ? "Download cancelled."
        : "Download failed. Please try again."
    );


  } finally {

    downloadBtn.disabled =
      false;

    playerDownloadBtn.disabled =
      false;


    const downloadText =
      downloadBtn.querySelector("span");


    if (downloadText) {
      downloadText.textContent =
        "Download";
    }


    playerDownloadBtn.textContent =
      "⇩";
  }
}


// ===============================
// LOAD VIDEO
// ===============================

async function loadVideo() {

  try {

    if (passedTitle) {

      title.textContent =
        passedTitle;
    }


    if (passedDescription) {

      description.textContent =
        passedDescription;
    }


    let videoUrl =
      passedUrl;


    if (id) {

      const data =
        await getVideoFromDatabase();


      title.textContent =
        data.title ||
        passedTitle ||
        "Dot Video";


      description.textContent =
        data.description ||
        passedDescription ||
        "";


      videoUrl =
        data.video_url;


      setCounts(
        data.views,
        data.likes
      );


      // Count this page opening as one view
      await incrementView();


      // Check whether this device already liked it
      await checkLikeStatus();

    } else {

      setCounts(
        0,
        0
      );
    }


    setVideo(
      videoUrl
    );


  } catch (error) {

    console.error(
      "PLAYER ERROR:",
      error
    );


    showMessage(
      "Error: " +
      (
        error.message ||
        error
      )
    );
  }
}


// ===============================
// EVENT LISTENERS
// ===============================

centerPlayBtn.addEventListener(
  "click",
  togglePlay
);


playPauseBtn.addEventListener(
  "click",
  togglePlay
);


back10Btn.addEventListener(
  "click",
  () => seekBy(-10)
);


forward10Btn.addEventListener(
  "click",
  () => seekBy(10)
);


muteBtn.addEventListener(
  "click",
  toggleMute
);


fullscreenBtn.addEventListener(
  "click",
  toggleFullscreen
);


downloadBtn.addEventListener(
  "click",
  downloadVideo
);


playerDownloadBtn.addEventListener(
  "click",
  downloadVideo
);


shareBtn.addEventListener(
  "click",
  shareVideo
);


likeBtn.addEventListener(
  "click",
  likeVideo
);


// ===============================
// MORE MENU
// ===============================

moreBtn.addEventListener(
  "click",
  (event) => {

    event.stopPropagation();

    moreMenu.hidden =
      !moreMenu.hidden;
  }
);


document.addEventListener(
  "click",
  (event) => {

    if (
      !moreMenu.contains(
        event.target
      ) &&
      event.target !== moreBtn
    ) {

      moreMenu.hidden =
        true;
    }
  }
);


moreMenu
  .querySelectorAll(
    "button[data-speed]"
  )
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        player.playbackRate =
          Number(
            button.dataset.speed
          );

        moreMenu.hidden =
          true;
      }
    );
  });


// ===============================
// PROGRESS
// ===============================

progress.addEventListener(
  "input",
  () => {

    if (
      !Number.isFinite(
        player.duration
      ) ||
      player.duration <= 0
    ) {
      return;
    }


    player.currentTime =
      (
        Number(progress.value) /
        100
      ) *
      player.duration;


    updateTime();
  }
);


// ===============================
// VIDEO EVENTS
// ===============================

player.addEventListener(
  "loadedmetadata",
  () => {

    hideMessage();

    updateTime();

    updatePlayButtons();
  }
);


player.addEventListener(
  "canplay",
  () => {

    hideMessage();

    updatePlayButtons();
  }
);


player.addEventListener(
  "timeupdate",
  updateTime
);


player.addEventListener(
  "durationchange",
  updateTime
);


player.addEventListener(
  "play",
  updatePlayButtons
);


player.addEventListener(
  "playing",
  () => {

    hideMessage();

    updatePlayButtons();
  }
);


player.addEventListener(
  "pause",
  updatePlayButtons
);


player.addEventListener(
  "ended",
  () => {

    updateTime();

    updatePlayButtons();
  }
);


player.addEventListener(
  "volumechange",
  () => {

    muteBtn.textContent =
      player.muted ||
      player.volume === 0
        ? "🔇"
        : "🔊";
  }
);


player.addEventListener(
  "error",
  () => {

    showMessage(
      "Video could not be loaded in this preview."
    );
  }
);


// ===============================
// FULLSCREEN EVENTS
// ===============================

document.addEventListener(
  "fullscreenchange",
  () => {

    const active =
      Boolean(
        document.fullscreenElement
      );


    if (active) {

      fullscreenBtn.textContent =
        "✕";

    } else if (
      !playerWrap.classList.contains(
        "app-fullscreen"
      )
    ) {

      fullscreenBtn.textContent =
        "⛶";
    }
  }
);


document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      playerWrap.classList.contains(
        "app-fullscreen"
      )
    ) {

      playerWrap.classList.remove(
        "app-fullscreen"
      );

      document.body.classList.remove(
        "player-fullscreen"
      );

      fullscreenBtn.textContent =
        "⛶";
    }
  }
);


// ===============================
// BACK / HOME
// ===============================

document.getElementById(
  "backBtn"
).onclick = () => {

  history.back();
};


document.getElementById(
  "homeBtn"
).onclick = () => {

  location.href =
    "Dot Video.html";
};


// ===============================
// START
// ===============================

showMessage(
  "Loading video..."
);

updatePlayButtons();

loadVideo();
