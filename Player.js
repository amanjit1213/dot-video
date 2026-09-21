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

const rotateBtn =
  document.getElementById("rotateBtn");

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
  document.getElement
