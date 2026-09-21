const grid =
  document.getElementById("videoGrid");

const status =
  document.getElementById("status");

const searchForm =
  document.getElementById("searchForm");

const searchInput =
  document.getElementById("searchInput");

const menuBtn =
  document.getElementById("menuBtn");

const closeMenu =
  document.getElementById("closeMenu");

const menuPanel =
  document.getElementById("menuPanel");

const menuOverlay =
  document.getElementById("menuOverlay");


const {
  url,
  publishableKey
} = window.DOT_VIDEO_SUPABASE;


let allVideos = [];


/* =========================
   MENU
========================= */

function openMenu(){

  menuPanel.classList.add("show");

  menuOverlay.classList.add("show");

  menuPanel.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeMenuPanel(){

  menuPanel.classList.remove("show");

  menuOverlay.classList.remove("show");

  menuPanel.setAttribute(
    "aria-hidden",
    "true"
  );
}


menuBtn.addEventListener(
  "click",
  openMenu
);


closeMenu.addEventListener(
  "click",
  closeMenuPanel
);


menuOverlay.addEventListener(
  "click",
  closeMenuPanel
);


/* =========================
   RENDER VIDEOS
========================= */

function render(videos){

  grid.innerHTML = "";


  if(!videos.length){

    status.textContent =
      searchInput.value.trim()
        ? "No matching English Movies found."
        : "No English Movies found.";

    return;
  }


  status.textContent = "";


  videos.forEach(video => {

    const card =
      document.createElement("article");

    card.className =
      "card";


    /* POSTER */

    const posterWrap =
      document.createElement("div");

    posterWrap.className =
      "poster-wrap";


    if(video.poster_url){

      const img =
        document.createElement("img");

      img.className =
        "poster";

      img.src =
        video.poster_url;

      img.alt =
        video.title ||
        "English Movie";

      img.loading =
        "lazy";


      img.onerror =
        () => {

          posterWrap.remove();

        };


      posterWrap.appendChild(
        img
      );

    }else{

      posterWrap.textContent =
        "🎬";

      posterWrap.style.fontSize =
        "42px";
    }


    /* CARD BODY */

    const body =
      document.createElement("div");

    body.className =
      "card-body";


    const title =
      document.createElement("h3");

    title.className =
      "card-title";

    title.textContent =
      video.title ||
      "Untitled";


    const meta =
      document.createElement("p");

    meta.className =
      "card-meta";


    const date =
      video.created_at
        ? new Date(
            video.created_at
          ).toLocaleDateString(
            undefined,
            {
              day:"numeric",
              month:"short",
              year:"numeric"
            }
          )
        : "";


    meta.textContent =
      date
        ? `English Movie • ${date}`
        : "English Movie";


    body.append(
      title,
      meta
    );


    card.append(
      posterWrap,
      body
    );


    /* PLAYER LINK */

    const q =
      new URLSearchParams();


    q.set(
      "id",
      video.id
    );


    if(video.video_url){

      q.set(
        "url",
        video.video_url
      );
    }


    if(video.title){

      q.set(
        "title",
        video.title
      );
    }


    if(video.description){

      q.set(
        "description",
        video.description
      );
    }


    card.addEventListener(
      "click",
      () => {

        location.href =
          "Player.html?" +
          q.toString();

      }
    );


    grid.appendChild(card);

  });
}


/* =========================
   LOAD ENGLISH MOVIES
========================= */

async function loadEnglishMovies(){

  try{

    status.textContent =
      "Loading English Movies...";


    const endpoint =
      `${url}/rest/v1/videos` +
      `?select=id,title,description,poster_url,video_url,category,published,created_at` +
      `&published=eq.true` +
      `&category=in.(english,%22English%20Movies%22)` +
      `&order=created_at.desc`;


    const response =
      await fetch(
        endpoint,
        {
          headers:{

            apikey:
              publishableKey,

            Authorization:
              `Bearer ${publishableKey}`,

            Accept:
              "application/json"
          }
        }
      );


    if(!response.ok){

      throw new Error(
        `Database request failed (${response.status})`
      );
    }


    allVideos =
      await response.json();


    /* DEFAULT:
       LATEST 3 VIDEOS */

    render(
      allVideos.slice(0,3)
    );


  }catch(error){

    console.error(error);

    status.textContent =
      "Database error: " +
      error.message;
  }
}


/* =========================
   SEARCH
========================= */

function doSearch(){

  const term =
    searchInput.value
      .trim()
      .toLowerCase();


  if(!term){

    render(
      allVideos.slice(0,3)
    );

    return;
  }


  const matches =
    allVideos.filter(
      video => {

        const title =
          String(
            video.title || ""
          ).toLowerCase();


        const description =
          String(
            video.description || ""
          ).toLowerCase();


        return (
          title.includes(term) ||
          description.includes(term)
        );

      }
    );


  render(matches);
}


/* SEARCH BUTTON */

searchForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    doSearch();

  }
);


/* CLEAR SEARCH */

searchInput.addEventListener(
  "input",
  () => {

    if(
      !searchInput.value.trim()
    ){

      render(
        allVideos.slice(0,3)
      );

    }

  }
);


/* START */

loadEnglishMovies();
