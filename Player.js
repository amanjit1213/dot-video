const params = new URLSearchParams(window.location.search);

const videoId = params.get("id");
const passedUrl = params.get("url");
const passedTitle = params.get("title");
const passedDescription = params.get("description");

const config = window.DOT_VIDEO_SUPABASE;

const player = document.getElementById("videoPlayer");
const playerWrap = document.getElementById("playerWrap");
const noVideo = document.getElementById("noVideo");

const title = document.getElementById("title");
const description = document.getElementById("description");

const centerPlayBtn = document.getElementById("centerPlayBtn");
const playPauseBtn = document.getElementById("playPauseBtn");

const back10Btn = document.getElementById("back10Btn");
const forward10Btn = document.getElementById("forward10Btn");

const muteBtn = document.getElementById("muteBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const rotateBtn = document.getElementById("rotateBtn");

const moreBtn = document.getElementById("moreBtn");
const moreMenu = document.getElementById("moreMenu");

const progress = document.getElementById("progress");

const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

const viewsCount = document.getElementById("viewsCount");
const likesCount = document.getElementById("likesCount");

const likeBtn = document.getElementById("likeBtn");
const shareBtn = document.getElementById("shareBtn");
const downloadBtn = document.getElementById("downloadBtn");

const message = document.getElementById("message");
const likeMessage = document.getElementById("likeMessage");

const newVideos = document.getElementById("newVideos");

let currentVideo = null;
let rotated = false;
let hideTimer = null;


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text) {
    if (message) {
        message.textContent = text || "";
    }
}

function showLikeMessage(text) {
    if (likeMessage) {
        likeMessage.textContent = text || "";
    }
}


/* =========================================================
   TIME
========================================================= */

function formatTime(seconds) {

    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    const total = Math.floor(seconds);

    const minutes = Math.floor(total / 60);
    const secs = total % 60;

    return `${minutes}:${String(secs).padStart(2, "0")}`;
}


/* =========================================================
   VOLUME ICON
========================================================= */

function updateVolumeIcon() {

    if (!muteBtn) return;

    if (player.muted || player.volume === 0) {

        muteBtn.innerHTML = `
            <svg
                class="volume-icon"
                viewBox="0 0 64 64"
                aria-hidden="true">

                <path d="M9 25h12l15-13v40L21 39H9z"></path>
                <path d="m47 24 11 11m0-11L47 35"></path>

            </svg>
        `;

    } else {

        muteBtn.innerHTML = `
            <svg
                class="volume-icon"
                viewBox="0 0 64 64"
                aria-hidden="true">

                <path d="M9 25h12l15-13v40L21 39H9z"></path>
                <path d="M47 24c4 4 6 7 6 11s-2 7-6 11"></path>
                <path d="M52 17c7 6 10 12 10 18s-3 12-10 18"></path>

            </svg>
        `;
    }
}


/* =========================================================
   PLAY / PAUSE
========================================================= */

function updatePlayButton() {

    const paused = player.paused || player.ended;

    if (playPauseBtn) {
        playPauseBtn.textContent = paused ? "▶" : "❚❚";
    }

    if (centerPlayBtn) {
        centerPlayBtn.classList.toggle(
            "hidden",
            !paused
        );
    }
}


async function togglePlay() {

    try {

        if (player.paused || player.ended) {

            if (player.ended) {
                player.currentTime = 0;
            }

            await player.play();

        } else {

            player.pause();
        }

    } catch (error) {

        showMessage(
            "Tap Play again to start the video."
        );
    }

    updatePlayButton();
}


/* =========================================================
   SEEK
========================================================= */

function seek(seconds) {

    if (
        Number.isFinite(player.duration) &&
        player.duration > 0
    ) {

        player.currentTime = Math.min(
            player.duration,
            Math.max(
                0,
                player.currentTime + seconds
            )
        );
    }

    updateTime();
}


/* =========================================================
   TIME UPDATE
========================================================= */

function updateTime() {

    currentTimeEl.textContent =
        formatTime(player.currentTime);

    durationEl.textContent =
        formatTime(player.duration);

    if (
        Number.isFinite(player.duration) &&
        player.duration > 0
    ) {

        progress.value =
            (
                player.currentTime /
                player.duration
            ) * 100;
    }
}


/* =========================================================
   MUTE
========================================================= */

function toggleMute() {

    player.muted = !player.muted;

    updateVolumeIcon();
}


/* =========================================================
   CONTROLS
========================================================= */

function showControls(force = false) {

    if (!controls) return;

    controls.classList.remove("auto-hidden");

    clearTimeout(hideTimer);

    if (force || player.paused) {
        return;
    }

    hideTimer = setTimeout(() => {

        if (moreMenu.hidden) {
            controls.classList.add(
                "auto-hidden"
            );
        }

    }, 3000);
}

const controls =
    document.getElementById("controls");


/* =========================================================
   VOTER ID
========================================================= */

function getVoterId() {

    const key = "dot_video_voter_id";

    let id =
        localStorage.getItem(key);

    if (!id) {

        id =
            crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36) +
              Math.random()
                  .toString(36)
                  .slice(2);

        localStorage.setItem(
            key,
            id
        );
    }

    return id;
}


/* =========================================================
   SUPABASE HEADERS
========================================================= */

function supabaseHeaders() {

    return {
        apikey:
            config.publishableKey,

        Authorization:
            `Bearer ${config.publishableKey}`,

        Accept:
            "application/json"
    };
}


/* =========================================================
   LOAD VIDEO FROM PASSED URL
========================================================= */

function loadPassedVideo() {

    if (!passedUrl) {
        return false;
    }

    try {

        player.src = passedUrl;

        player.load();

        title.textContent =
            passedTitle ||
            "Dot Video";

        description.textContent =
            passedDescription ||
            "";

        noVideo.textContent =
            "Loading video...";

        noVideo.style.display =
            "block";

        return true;

    } catch (error) {

        console.error(
            "Passed video error:",
            error
        );

        return false;
    }
}


/* =========================================================
   LOAD VIDEO FROM SUPABASE
========================================================= */

async function loadVideoFromSupabase() {

    if (!videoId) {

        throw new Error(
            "Video ID is missing."
        );
    }

    if (
        !config ||
        !config.url ||
        !config.publishableKey
    ) {

        throw new Error(
            "Supabase configuration is missing."
        );
    }


    const endpoint =
        `${config.url}/rest/v1/videos` +
        `?select=id,title,description,video_url,poster_url,category,views,likes,published,created_at` +
        `&id=eq.${encodeURIComponent(videoId)}` +
        `&published=eq.true`;


    const response =
        await fetch(
            endpoint,
            {
                method: "GET",
                headers:
                    supabaseHeaders()
            }
        );


    if (!response.ok) {

        throw new Error(
            `Video request failed (${response.status})`
        );
    }


    const data =
        await response.json();


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        throw new Error(
            "Video not found."
        );
    }


    const video =
        data[0];

    currentVideo =
        video;


    title.textContent =
        video.title ||
        "Dot Video";


    description.textContent =
        video.description ||
        "";


    const views =
        Number(video.views || 0);


    viewsCount.textContent =
        `${views} ${views === 1 ? "view" : "views"}`;


    likesCount.textContent =
        Number(video.likes || 0);


    if (!video.video_url) {

        throw new Error(
            "Video URL is missing."
        );
    }


    player.src =
        video.video_url;

    player.load();


    noVideo.textContent =
        "Loading video...";

    noVideo.style.display =
        "block";
}


/* =========================================================
   LOAD MAIN VIDEO
========================================================= */

async function loadMainVideo() {

    try {

        /*
          IMPORTANT:
          Desi Videos / English Movies already
          send the actual video URL.

          So use that first.
        */

        if (passedUrl) {

            loadPassedVideo();

            /*
              If ID is also available,
              get database information in background.
            */

            if (videoId) {

                try {

                    await loadVideoFromSupabase();

                } catch (error) {

                    /*
                      Do NOT break the video if
                      the URL already works.
                    */

                    console.warn(
                        "Database info skipped:",
                        error
                    );
                }
            }

        } else {

            await loadVideoFromSupabase();
        }


    } catch (error) {

        console.error(
            "Player loading error:",
            error
        );

        noVideo.style.display =
            "block";

        noVideo.textContent =
            "Video could not be loaded.";

        showMessage(
            error.message ||
            "Unable to load video."
        );
    }
}


/* =========================================================
   INCREMENT VIEWS
========================================================= */

async function incrementViews() {

    if (
        !videoId ||
        !config
    ) {
        return;
    }

    try {

        const response =
            await fetch(
                `${config.url}/rest/v1/rpc/increment_video_views`,
                {
                    method: "POST",

                    headers: {
                        ...supabaseHeaders(),

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            p_video_id:
                                videoId
                        })
                }
            );


        if (response.ok) {

            const value =
                await response.json();

            if (
                typeof value === "number"
            ) {

                viewsCount.textContent =
                    `${value} ${
                        value === 1
                        ? "view"
                        : "views"
                    }`;
            }
        }

    } catch (error) {

        console.warn(
            "Views error:",
            error
        );
    }
}


/* =========================================================
   CHECK LIKE
========================================================= */

async function checkLike() {

    if (
        !videoId ||
        !config
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                `${config.url}/rest/v1/rpc/has_video_like`,
                {
                    method: "POST",

                    headers: {
                        ...supabaseHeaders(),

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            p_video_id:
                                videoId,

                            p_voter_id:
                                getVoterId()
                        })
                }
            );


        if (!response.ok) {
            return;
        }


        const liked =
            await response.json();


        if (liked) {

            likeBtn.classList.add(
                "liked"
            );

            likeBtn.setAttribute(
                "aria-label",
                "Already liked"
            );
        }

    } catch (error) {

        console.warn(
            "Like check error:",
            error
        );
    }
}


/* =========================================================
   LIKE
========================================================= */

async function likeVideo() {

    if (
        !videoId ||
        !config
    ) {
        return;
    }


    likeBtn.disabled = true;


    try {

        const response =
            await fetch(
                `${config.url}/rest/v1/rpc/like_video_once`,
                {
                    method: "POST",

                    headers: {
                        ...supabaseHeaders(),

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            p_video_id:
                                videoId,

                            p_voter_id:
                                getVoterId()
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Like request failed."
            );
        }


        const value =
            await response.json();


        likesCount.textContent =
            Number(value || 0);


        likeBtn.classList.add(
            "liked"
        );


        likeMessage.textContent =
            "You already liked this video.";


    } catch (error) {

        console.error(
            "Like error:",
            error
        );

        showLikeMessage(
            "Could not like this video."
        );

    } finally {

        likeBtn.disabled =
            false;
    }
}


/* =========================================================
   NEW VIDEOS
========================================================= */

async function loadNewVideos() {

    if (!newVideos) {
        return;
    }


    if (
        !config ||
        !config.url ||
        !config.publishableKey
    ) {

        newVideos.innerHTML = `
            <div class="empty-card">
                Videos are unavailable.
            </div>
        `;

        return;
    }


    try {

        const endpoint =
            `${config.url}/rest/v1/videos` +
            `?select=id,title,description,poster_url,video_url,category,created_at,published` +
            `&published=eq.true` +
            `&order=created_at.desc` +
            `&limit=10`;


        const response =
            await fetch(
                endpoint,
                {
                    method: "GET",
                    headers:
                        supabaseHeaders()
                }
            );


        if (!response.ok) {

            throw new Error(
                `New videos request failed (${response.status})`
            );
        }


        const data =
            await response.json();


        const rows =
            data.filter(
                video =>
                    video.id !== videoId
            ).slice(0, 6);


        newVideos.innerHTML = "";


        if (!rows.length) {

            newVideos.innerHTML = `
                <div class="empty-card">
                    No new videos available yet.
                </div>
            `;

            return;
        }


        rows.forEach(
            createNewVideoCard
        );


    } catch (error) {

        console.error(
            "New videos error:",
            error
        );


        newVideos.innerHTML = `
            <div class="empty-card">
                New videos could not be loaded.
            </div>
        `;
    }
}


/* =========================================================
   CREATE NEW VIDEO CARD
========================================================= */

function createNewVideoCard(video) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "new-video-card";


    const poster =
        document.createElement(
            "div"
        );

    poster.className =
        "new-poster";


    if (video.poster_url) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            video.poster_url;

        image.alt =
            video.title ||
            "Video";

        image.loading =
            "lazy";


        image.onerror =
            () => {

                image.style.display =
                    "none";
            };


        poster.appendChild(
            image
        );
    }


    const info =
        document.createElement(
            "div"
        );

    info.className =
        "new-info";


    const heading =
        document.createElement(
            "h3"
        );

    heading.textContent =
        video.title ||
        "Untitled";


    const category =
        document.createElement(
            "p"
        );

    category.textContent =
        (
            video.category === "english" ||
            video.category === "English Movies"
        )
        ? "English Movies"
        : "Desi Videos";


    info.append(
        heading,
        category
    );


    card.append(
        poster,
        info
    );


    card.onclick =
        () => {

            const url =
                new URL(
                    "Player.html",
                    window.location.href
                );


            url.searchParams.set(
                "id",
                video.id
            );


            if (video.video_url) {

                url.searchParams.set(
                    "url",
                    video.video_url
                );
            }


            if (video.title) {

                url.searchParams.set(
                    "title",
                    video.title
                );
            }


            if (video.description) {

                url.searchParams.set(
                    "description",
                    video.description
                );
            }


            window.location.href =
                url.href;
        };


    newVideos.appendChild(
        card
    );
}


/* =========================================================
   SHARE
========================================================= */

async function shareVideo() {

    const shareUrl =
        new URL(
            "Player.html",
            window.location.href
        );


    if (videoId) {

        shareUrl.searchParams.set(
            "id",
            videoId
        );
    }


    if (passedUrl) {

        shareUrl.searchParams.set(
            "url",
            passedUrl
        );
    }


    const shareTitle =
        `${title.textContent || "Video"} — Dot Video`;


    try {

        if (navigator.share) {

            await navigator.share({

                title:
                    shareTitle,

                text:
                    `${shareTitle}\n${shareUrl.href}`,

                url:
                    shareUrl.href
            });

            return;
        }


        await navigator.clipboard.writeText(
            shareUrl.href
        );


        showMessage(
            "Video link copied!"
        );


    } catch (error) {

        if (
            error &&
            error.name === "AbortError"
        ) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                shareUrl.href
            );

            showMessage(
                "Video link copied!"
            );

        } catch (e) {

            showMessage(
                "Unable to share video."
            );
        }
    }
}


/* =========================================================
   DOWNLOAD
   ONLY THIS FUNCTION HAS BEEN CHANGED
========================================================= */

function downloadVideo() {

    const url =
        player.currentSrc ||
        player.src ||
        passedUrl;


    if (!url) {

        showMessage(
            "Video is not ready."
        );

        return;
    }


    const filename =
        (
            title.textContent ||
            "Dot Video"
        )
        .replace(
            /[^a-z0-9-_ ]/gi,
            ""
        )
        .trim()
        .replace(
            /\s+/g,
            "-"
        ) ||
        "Dot-Video";


    try {

        const downloadUrl =
            new URL(url);


        /*
          Supabase Public Storage download.
          This makes the public video URL
          request a file download.
        */

        downloadUrl.searchParams.set(
            "download",
            `${filename}.mp4`
        );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            downloadUrl.href;

        link.rel =
            "noopener";


        document.body.appendChild(
            link
        );

        link.click();

        link.remove();


        showMessage(
            "Download started."
        );


    } catch (error) {

        console.error(
            "Download error:",
            error
        );

        showMessage(
            "Download could not be started."
        );
    }
}


/* =========================================================
   FULLSCREEN
========================================================= */

function isFullscreen() {

    return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        playerWrap.classList.contains(
            "is-fullscreen"
        )
    );
}


async function enterFullscreen() {

    try {

        if (
            playerWrap.requestFullscreen
        ) {

            await playerWrap.requestFullscreen({
                navigationUI:
                    "hide"
            });

        } else if (
            playerWrap.webkitRequestFullscreen
        ) {

            playerWrap.webkitRequestFullscreen();

        } else {

            playerWrap.classList.add(
                "is-fullscreen"
            );

            document.body.classList.add(
                "player-fullscreen"
            );
        }


        /*
          Try landscape only after
          fullscreen starts.
        */

        if (
            screen.orientation &&
            screen.orientation.lock
        ) {

            try {

                await screen.orientation.lock(
                    "landscape"
                );

            } catch (error) {

                console.log(
                    "Orientation lock not supported."
                );
            }
        }


    } catch (error) {

        playerWrap.classList.add(
            "is-fullscreen"
        );

        document.body.classList.add(
            "player-fullscreen"
        );
    }
}


async function exitFullscreen() {

    try {

        if (
            document.exitFullscreen
        ) {

            await document.exitFullscreen();

        } else if (
            document.webkitExitFullscreen
        ) {

            document.webkitExitFullscreen();
        }

    } catch (error) {}


    playerWrap.classList.remove(
        "is-fullscreen"
    );

    document.body.classList.remove(
        "player-fullscreen"
    );


    try {

        if (
            screen.orientation &&
            screen.orientation.unlock
        ) {

            screen.orientation.unlock();
        }

    } catch (error) {}


    rotated = false;

    rotateBtn.classList.remove(
        "active"
    );
}


async function toggleFullscreen() {

    if (isFullscreen()) {

        await exitFullscreen();

    } else {

        await enterFullscreen();
    }
}


/* =========================================================
   ROTATE
========================================================= */

async function rotateScreen() {

    /*
      IMPORTANT:
      No CSS transform rotation.
      This prevents the broken layout.
    */

    if (!isFullscreen()) {

        showMessage(
            "Open Fullscreen first, then tap Rotate."
        );

        return;
    }


    try {

        if (
            !screen.orientation ||
            !screen.orientation.lock
        ) {

            showMessage(
                "Screen rotation is not supported here."
            );

            return;
        }


        const target =
            rotated
            ? "portrait"
            : "landscape";


        await screen.orientation.lock(
            target
        );


        rotated =
            !rotated;


        rotateBtn.classList.toggle(
            "active",
            rotated
        );


    } catch (error) {

        console.log(
            "Rotate error:",
            error
        );


        showMessage(
            "Please allow screen rotation on your phone."
        );
    }
}


/* =========================================================
   PLAYBACK SPEED
========================================================= */

function setupSpeedMenu() {

    if (!moreMenu) return;


    moreMenu
        .querySelectorAll(
            "button[data-speed]"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        player.playbackRate =
                            Number(
                                button.dataset.speed
                            );

                        moreMenu.hidden =
                            true;
                    };
            }
        );
}


/* =========================================================
   EVENTS
========================================================= */

centerPlayBtn.onclick =
    togglePlay;

playPauseBtn.onclick =
    togglePlay;

back10Btn.onclick =
    () => seek(-10);

forward10Btn.onclick =
    () => seek(10);

muteBtn.onclick =
    toggleMute;

fullscreenBtn.onclick =
    toggleFullscreen;

rotateBtn.onclick =
    rotateScreen;

likeBtn.onclick =
    likeVideo;

shareBtn.onclick =
    shareVideo;

downloadBtn.onclick =
    downloadVideo;


moreBtn.onclick =
    event => {

        event.stopPropagation();

        moreMenu.hidden =
            !moreMenu.hidden;

        showControls(true);
    };


document.addEventListener(
    "click",
    event => {

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


/* =========================================================
   PROGRESS
========================================================= */

progress.oninput =
    () => {

        if (
            Number.isFinite(
                player.duration
            ) &&
            player.duration > 0
        ) {

            player.currentTime =
                (
                    Number(
                        progress.value
                    ) / 100
                ) *
                player.duration;
        }

        updateTime();

        showControls(true);
    };


/* =========================================================
   VIDEO EVENTS
========================================================= */

player.onloadedmetadata =
    () => {

        noVideo.style.display =
            "none";

        updateTime();

        updatePlayButton();
    };


player.oncanplay =
    () => {

        noVideo.style.display =
            "none";

        updatePlayButton();
    };


player.ontimeupdate =
    updateTime;


player.ondurationchange =
    updateTime;


player.onplay =
    () => {

        updatePlayButton();

        showControls();
    };


player.onplaying =
    () => {

        noVideo.style.display =
            "none";

        updatePlayButton();
    };


player.onpause =
    () => {

        updatePlayButton();

        showControls(true);
    };


player.onended =
    () => {

        updateTime();

        updatePlayButton();

        showControls(true);
    };


player.onvolumechange =
    updateVolumeIcon;


player.onerror =
    () => {

        noVideo.style.display =
            "block";

        noVideo.textContent =
            "Video could not be loaded.";

        showMessage(
            "Video could not be loaded."
        );
    };


playerWrap.onclick =
    event => {

        if (
            event.target === player
        ) {

            showControls(true);
        }
    };


playerWrap.onmousemove =
    () => showControls(true);


/* =========================================================
   FULLSCREEN EVENTS
========================================================= */

document.addEventListener(
    "fullscreenchange",
    () => {

        if (
            document.fullscreenElement ===
            playerWrap
        ) {

            playerWrap.classList.add(
                "is-fullscreen"
            );

            document.body.classList.add(
                "player-fullscreen"
            );

        } else {

            playerWrap.classList.remove(
                "is-fullscreen"
            );

            document.body.classList.remove(
                "player-fullscreen"
            );

            rotated = false;

            rotateBtn.classList.remove(
                "active"
            );
        }
    }
);


/* =========================================================
   BACK / HOME
========================================================= */

document.getElementById(
    "backBtn"
).onclick =
    () => history.back();


document.getElementById(
    "homeBtn"
).onclick =
    () => {

        window.location.href =
            "index.html";
    };


/* =========================================================
   START
========================================================= */

updateVolumeIcon();

setupSpeedMenu();


/*
  IMPORTANT:
  New Videos loads independently.
*/

loadNewVideos();


/*
  Main video loads separately.
*/

loadMainVideo();


/*
  Views + Like state can load
  without blocking the video.
*/

incrementViews();

checkLike();
