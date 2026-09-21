const params = new URLSearchParams(location.search);

const id = params.get("id");

const passedUrl =
  String(params.get("url") || "").trim();

const passedTitle =
  params.get("title");

const passedDescription =
  params.get("description");

const config =
  window.DOT_VIDEO_SUPABASE;


const player =
  document.getElementById("videoPlayer");

const noVideo =
  document.getElementById("noVideo");

const title =
  document.getElementById("title");

const description =
  document.getElementById("description");

const centerPlayBtn =
  document.getElementById("centerPlayBtn");

const playPauseBtn =
  document.getElementById("playPauseBtn");

const back10Btn =
  document.getElementById("back10Btn");

const forward10Btn =
  document.getElementById("forward10Btn");

const muteBtn =
  document.getElementById("muteBtn");

const fullscreenBtn =
  document.getElementById("fullscreenBtn");

const fullscreenDownloadBtn =
  document.getElementById(
    "fullscreenDownloadBtn"
  );

const moreBtn =
  document.getElementById("moreBtn");

const moreMenu =
  document.getElementById("moreMenu");

const progress =
  document.getElementById("progress");

const currentTimeEl =
  document.getElementById("currentTime");

const durationEl =
  document.getElementById("duration");

const playerWrap =
  document.getElementById("playerWrap");

const controls =
  document.getElementById("controls");

const viewsCount =
  document.getElementById("viewsCount");

const likesCount =
  document.getElementById("likesCount");

const likeBtn =
  document.getElementById("likeBtn");

const shareBtn =
  document.getElementById("shareBtn");

const downloadBtn =
  document.getElementById("downloadBtn");

const message =
  document.getElementById("message");

const likeMessage =
  document.getElementById("likeMessage");

const newVideos =
  document.getElementById("newVideos");


let hideTimer = null;


function msg(t){
  message.textContent = t || "";
}


function likeMsg(t){
  likeMessage.textContent = t || "";
}


function time(s){

  if(
    !Number.isFinite(s) ||
    s < 0
  ){
    return "0:00";
  }

  const n =
    Math.floor(s);

  const h =
    Math.floor(n / 3600);

  const m =
    Math.floor(
      (n % 3600) / 60
    );

  const x =
    n % 60;

  return h
    ? `${h}:${String(m).padStart(2,"0")}:${String(x).padStart(2,"0")}`
    : `${m}:${String(x).padStart(2,"0")}`;
}


function voterId(){

  const k =
    "dot_video_voter_id";

  let v =
    localStorage.getItem(k);

  if(!v){

    v =
      crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) +
          Math.random()
            .toString(36)
            .slice(2);

    localStorage.setItem(k,v);
  }

  return v;
}


function updateTime(){

  currentTimeEl.textContent =
    time(player.currentTime);

  durationEl.textContent =
    time(player.duration);

  if(
    Number.isFinite(player.duration) &&
    player.duration > 0
  ){

    progress.value =
      String(
        player.currentTime /
        player.duration *
        100
      );
  }
}


function updatePlay(){

  const paused =
    player.paused ||
    player.ended;

  playPauseBtn.textContent =
    paused
      ? "▶"
      : "❚❚";

  centerPlayBtn.classList.toggle(
    "hidden",
    !paused
  );
}


async function togglePlay(){

  try{

    if(
      player.paused ||
      player.ended
    ){

      if(player.ended){
        player.currentTime = 0;
      }

      await player.play();

    }else{

      player.pause();

    }

  }catch(e){

    msg(
      "Tap Play again to start the video."
    );
  }

  updatePlay();
}


function seek(s){

  if(
    Number.isFinite(
      player.duration
    )
  ){

    player.currentTime =
      Math.min(
        player.duration,
        Math.max(
          0,
          player.currentTime + s
        )
      );
  }

  updateTime();
}


function mute(){

  player.muted =
    !player.muted;

  muteBtn.textContent =
    player.muted
      ? "🔇"
      : "🔊";
}


function showControls(force = false){

  controls.classList.remove(
    "auto-hidden"
  );

  clearTimeout(hideTimer);

  if(
    force ||
    player.paused
  ){
    return;
  }

  hideTimer =
    setTimeout(
      () => {

        if(
          moreMenu.hidden
        ){

          controls.classList.add(
            "auto-hidden"
          );
        }

      },
      3000
    );
}


async function toggleFullscreen(){

  if(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    playerWrap.classList.contains(
      "is-fullscreen"
    )
  ){

    try{

      if(
        document.exitFullscreen
      ){

        await document.exitFullscreen();

      }else if(
        document.webkitExitFullscreen
      ){

        document.webkitExitFullscreen();
      }

    }catch(e){}

    playerWrap.classList.remove(
      "is-fullscreen"
    );

    document.body.classList.remove(
      "player-fullscreen"
    );

    fullscreenBtn.textContent =
      "⛶";

    return;
  }


  try{

    if(
      playerWrap.requestFullscreen
    ){

      await playerWrap.requestFullscreen({
        navigationUI:"hide"
      });

    }else if(
      playerWrap.webkitRequestFullscreen
    ){

      playerWrap.webkitRequestFullscreen();

    }else{

      playerWrap.classList.add(
        "is-fullscreen"
      );

      document.body.classList.add(
        "player-fullscreen"
      );
    }

  }catch(e){

    playerWrap.classList.add(
      "is-fullscreen"
    );

    document.body.classList.add(
      "player-fullscreen"
    );
  }

  fullscreenBtn.textContent =
    "✕";

  showControls(true);
}


function setVideo(url){

  if(
    !String(url || "").trim()
  ){

    throw new Error(
      "Video URL is empty."
    );
  }

  player.pause();

  player.removeAttribute(
    "src"
  );

  player.load();

  player.src = url;

  player.load();
}


async function getVideo(){

  if(
    !config?.url ||
    !config?.publishableKey
  ){

    throw new Error(
      "Supabase configuration not found."
    );
  }

  if(!id){

    throw new Error(
      "No video selected."
    );
  }


  const ep =
    `${config.url}/rest/v1/videos?select=id,title,description,video_url,poster_url,category,views,likes,published,created_at&id=eq.${encodeURIComponent(id)}&published=eq.true`;


  const r =
    await fetch(
      ep,
      {
        headers:{
          apikey:
            config.publishableKey,

          Authorization:
            `Bearer ${config.publishableKey}`,

          Accept:
            "application/json"
        }
      }
    );


  if(!r.ok){

    throw new Error(
      "Database request failed: " +
      r.status
    );
  }


  const rows =
    await r.json();


  if(!rows.length){

    throw new Error(
      "Video was not found or is not published."
    );
  }


  return rows[0];
}


async function incrementViews(){

  if(
    !id ||
    !config
  ){
    return;
  }


  try{

    const r =
      await fetch(
        `${config.url}/rest/v1/rpc/increment_video_views`,
        {
          method:"POST",

          headers:{
            apikey:
              config.publishableKey,

            Authorization:
              `Bearer ${config.publishableKey}`,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              p_video_id:id
            })
        }
      );


    if(r.ok){

      const v =
        await r.json();

      if(
        typeof v === "number"
      ){

        viewsCount.textContent =
          `${v} ${v === 1 ? "view" : "views"}`;
      }
    }

  }catch(e){}
}


async function loadLikeState(){

  if(
    !id ||
    !config
  ){
    return;
  }


  try{

    const r =
      await fetch(
        `${config.url}/rest/v1/rpc/has_video_like`,
        {
          method:"POST",

          headers:{
            apikey:
              config.publishableKey,

            Authorization:
              `Bearer ${config.publishableKey}`,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              p_video_id:id,
              p_voter_id:voterId()
            })
        }
      );


    if(
      r.ok &&
      await r.json()
    ){

      likeBtn.classList.add(
        "liked"
      );

      likeBtn.setAttribute(
        "aria-label",
        "Already liked"
      );
    }

  }catch(e){}
}


async function likeVideo(){

  if(
    !id ||
    !config
  ){
    return;
  }


  likeBtn.disabled =
    true;

  likeMsg("");


  try{

    const r =
      await fetch(
        `${config.url}/rest/v1/rpc/like_video_once`,
        {
          method:"POST",

          headers:{
            apikey:
              config.publishableKey,

            Authorization:
              `Bearer ${config.publishableKey}`,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              p_video_id:id,
              p_voter_id:voterId()
            })
        }
      );


    if(!r.ok){

      throw new Error(
        "Like request failed."
      );
    }


    const v =
      await r.json();


    if(
      typeof v === "number"
    ){

      likesCount.textContent =
        v;
    }


    likeBtn.classList.add(
      "liked"
    );

    likeBtn.setAttribute(
      "aria-label",
      "Already liked"
    );

    likeMsg(
      "You already liked this video."
    );


  }catch(e){

    likeMsg(
      "Could not like this video. Try again."
    );

  }finally{

    likeBtn.disabled =
      false;
  }
}


async function shareVideo(){

  const u =
    new URL(
      "Player.html",
      location.href
    );


  if(id){
    u.searchParams.set(
      "id",
      id
    );
  }


  const t =
    `${title.textContent || "Video"} — Dot Video`;


  try{

    if(navigator.share){

      await navigator.share({
        title:t,
        text:
          `${t}\n${u.href}`,
        url:u.href
      });

      return;
    }


    await navigator.clipboard.writeText(
      u.href
    );

    msg(
      "Video link copied!"
    );


  }catch(e){

    if(
      e?.name === "AbortError"
    ){

      return;
    }


    try{

      await navigator.clipboard.writeText(
        u.href
      );

      msg(
        "Video link copied!"
      );

    }catch(_){

      msg(
        "Unable to share or copy the link."
      );
    }
  }
}


/* =========================================
   DOWNLOAD
   ONLY DOWNLOAD LOGIC CHANGED
   ========================================= */

function getDownloadUrl(){

  const u =
    String(
      player.currentSrc ||
      player.src ||
      passedUrl ||
      ""
    ).trim();


  if(!u){
    return "";
  }


  try{

    const url =
      new URL(u);


    const rawName =
      decodeURIComponent(
        url.pathname
          .split("/")
          .pop() ||
        ""
      ) ||
      "Dot-Video.mp4";


    const safeName =
      rawName
        .replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        ) ||
      "Dot-Video.mp4";


    /*
      Supabase public Storage:
      ?download=filename
      forces the browser to download
      instead of opening the video page.
    */

    url.searchParams.set(
      "download",
      safeName
    );


    return url.href;


  }catch(e){

    return u;
  }
}


function downloadVideo(){

  const downloadUrl =
    getDownloadUrl();


  if(!downloadUrl){

    msg(
      "Video is not ready for download."
    );

    return;
  }


  const buttons = [
    downloadBtn,
    fullscreenDownloadBtn
  ];


  buttons.forEach(
    btn => {
      if(btn){
        btn.disabled = true;
      }
    }
  );


  try{

    const a =
      document.createElement("a");


    a.href =
      downloadUrl;

    a.rel =
      "noopener";


    document.body.appendChild(a);

    a.click();

    a.remove();


    msg(
      "Download started."
    );


  }catch(e){

    msg(
      "Download could not be started."
    );
  }


  setTimeout(
    () => {

      buttons.forEach(
        btn => {

          if(btn){
            btn.disabled = false;
          }

        }
      );

    },
    1200
  );
}


/* =========================================
   NEW VIDEOS
   ========================================= */

async function loadNewVideos(){

  if(
    !newVideos ||
    !config
  ){
    return;
  }


  try{

    const ep =
      `${config.url}/rest/v1/videos?select=id,title,description,poster_url,video_url,category,created_at,published&published=eq.true&order=created_at.desc&limit=7`;


    const r =
      await fetch(
        ep,
        {
          headers:{
            apikey:
              config.publishableKey,

            Authorization:
              `Bearer ${config.publishableKey}`,

            Accept:
              "application/json"
          }
        }
      );


    if(!r.ok){

      throw new Error(
        "Request failed"
      );
    }


    const rows =
      (
        await r.json()
      )
      .filter(
        v => v.id !== id
      )
      .slice(0,6);


    newVideos.innerHTML =
      "";


    if(!rows.length){

      newVideos.innerHTML =
        '<div class="empty-card">No new videos available yet.</div>';

      return;
    }


    rows.forEach(
      v => {

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


        if(v.poster_url){

          const img =
            document.createElement(
              "img"
            );

          img.src =
            v.poster_url;

          img.alt =
            v.title ||
            "Video";

          img.loading =
            "lazy";


          img.onerror =
            () => {
              img.style.display =
                "none";
            };


          poster.appendChild(
            img
          );
        }


        const info =
          document.createElement(
            "div"
          );

        info.className =
          "new-info";


        const h =
          document.createElement(
            "h3"
          );

        h.textContent =
          v.title ||
          "Untitled";


        const p =
          document.createElement(
            "p"
          );


        p.textContent =
          (
            v.category === "english" ||
            v.category === "English Movies"
          )
            ? "English Movies"
            : "Desi Videos";


        info.append(
          h,
          p
        );


        card.append(
          poster,
          info
        );


        card.onclick =
          () => {

            const u =
              new URL(
                "Player.html",
                location.href
              );

            u.searchParams.set(
              "id",
              v.id
            );

            location.href =
              u.href;
          };


        newVideos.appendChild(
          card
        );
      }
    );


  }catch(e){

    newVideos.innerHTML =
      '<div class="empty-card">New videos could not be loaded.</div>';
  }
}


async function loadVideo(){

  try{

    let data;


    if(passedTitle){

      title.textContent =
        passedTitle;
    }


    if(passedDescription){

      description.textContent =
        passedDescription;
    }


    if(passedUrl){

      setVideo(
        passedUrl
      );

    }else{

      data =
        await getVideo();


      title.textContent =
        data.title ||
        "Dot Video";


      description.textContent =
        data.description ||
        "";


      viewsCount.textContent =
        `${Number(data.views || 0)} ${
          Number(data.views || 0) === 1
            ? "view"
            : "views"
        }`;


      likesCount.textContent =
        Number(
          data.likes || 0
        );


      setVideo(
        data.video_url
      );
    }


    await Promise.all([
      incrementViews(),
      loadLikeState(),
      loadNewVideos()
    ]);


  }catch(e){

    msg(
      "Error: " +
      (e.message || e)
    );
  }
}


/* =========================================
   BUTTONS
   ========================================= */

centerPlayBtn.onclick =
  togglePlay;


playPauseBtn.onclick =
  togglePlay;


back10Btn.onclick =
  () => seek(-10);


forward10Btn.onclick =
  () => seek(10);


muteBtn.onclick =
  mute;


fullscreenBtn.onclick =
  toggleFullscreen;


likeBtn.onclick =
  likeVideo;


shareBtn.onclick =
  shareVideo;


/* NORMAL DOWNLOAD */
downloadBtn.onclick =
  downloadVideo;


/* FULLSCREEN DOWNLOAD */
if(fullscreenDownloadBtn){

  fullscreenDownloadBtn.onclick =
    downloadVideo;
}


moreBtn.onclick =
  e => {

    e.stopPropagation();

    moreMenu.hidden =
      !moreMenu.hidden;

    showControls(true);
  };


document.addEventListener(
  "click",
  e => {

    if(
      !moreMenu.contains(e.target) &&
      e.target !== moreBtn
    ){

      moreMenu.hidden =
        true;
    }
  }
);


moreMenu
  .querySelectorAll(
    "button[data-speed]"
  )
  .forEach(
    b => {

      b.onclick =
        () => {

          player.playbackRate =
            Number(
              b.dataset.speed
            );

          moreMenu.hidden =
            true;
        };
    }
  );


progress.oninput =
  () => {

    if(
      Number.isFinite(
        player.duration
      ) &&
      player.duration > 0
    ){

      player.currentTime =
        Number(
          progress.value
        ) /
        100 *
        player.duration;
    }

    updateTime();

    showControls(true);
  };


player.onloadedmetadata =
  () => {

    noVideo.style.display =
      "none";

    updateTime();

    updatePlay();
  };


player.oncanplay =
  () => {

    noVideo.style.display =
      "none";

    updatePlay();
  };


player.ontimeupdate =
  updateTime;


player.ondurationchange =
  updateTime;


player.onplay =
  () => {

    updatePlay();

    showControls();
  };


player.onplaying =
  () => {

    noVideo.style.display =
      "none";

    updatePlay();
  };


player.onpause =
  () => {

    updatePlay();

    showControls(true);
  };


player.onended =
  () => {

    updateTime();

    updatePlay();

    showControls(true);
  };


player.onvolumechange =
  () => {

    muteBtn.textContent =
      player.muted ||
      player.volume === 0
        ? "🔇"
        : "🔊";
  };


player.onerror =
  () => {

    noVideo.style.display =
      "block";

    noVideo.textContent =
      "Video could not be loaded.";
  };


playerWrap.ontouchstart =
  () => showControls(true);


playerWrap.onmousemove =
  () => showControls(true);


document.addEventListener(
  "fullscreenchange",
  () => {

    if(
      document.fullscreenElement ===
      playerWrap
    ){

      playerWrap.classList.add(
        "is-fullscreen"
      );

      document.body.classList.add(
        "player-fullscreen"
      );

      fullscreenBtn.textContent =
        "✕";

    }else{

      playerWrap.classList.remove(
        "is-fullscreen"
      );

      document.body.classList.remove(
        "player-fullscreen"
      );

      fullscreenBtn.textContent =
        "⛶";
    }
  }
);


document.getElementById(
  "backBtn"
).onclick =
  () => history.back();


document.getElementById(
  "homeBtn"
).onclick =
  () => location.href =
    "index.html";


loadVideo();
