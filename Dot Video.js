/* =========================================
   DOT VIDEO - HOME PAGE JAVASCRIPT
   ========================================= */

const menu = document.getElementById("menu");
const menuBtn = document.getElementById("menuBtn");
const closeMenu = document.getElementById("closeMenu");


/* =========================================
   MENU
   ========================================= */

if (menuBtn && menu) {
  menuBtn.addEventListener("click", () => {
    menu.classList.remove("hidden");
  });
}

if (closeMenu && menu) {
  closeMenu.addEventListener("click", () => {
    menu.classList.add("hidden");
  });
}


/* Close menu when clicking outside */

document.addEventListener("click", (event) => {

  if (
    menu &&
    menuBtn &&
    !menu.contains(event.target) &&
    !menuBtn.contains(event.target)
  ) {
    menu.classList.add("hidden");
  }

});


/* =========================================
   SUPABASE
   ========================================= */

const config = window.DOT_VIDEO_SUPABASE;

let allVideos = [];


/* =========================================
   LOAD VIDEOS
   ========================================= */

async function loadVideos() {

  const desiResults =
    document.getElementById("desiResults");

  const englishResults =
    document.getElementById("englishResults");


  try {

    if (!config || !config.url || !config.publishableKey) {
      throw new Error("Supabase configuration is missing.");
    }


    const endpoint =
      `${config.url}/rest/v1/videos` +
      `?select=id,title,description,category,poster_url,video_url,published,created_at` +
      `&published=eq.true` +
      `&order=created_at.desc`;


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
        `Database request failed (${response.status})`
      );
    }


    allVideos = await response.json();


    /* =====================================
       DESI VIDEOS - LATEST 3
       ===================================== */

    const desiVideos = allVideos
      .filter(video =>
        video.category === "desi" ||
        video.category === "Desi Videos"
      )
      .slice(0, 3);


    /* =====================================
       ENGLISH MOVIES - LATEST 3
       ===================================== */

    const englishVideos = allVideos
      .filter(video =>
        video.category === "english" ||
        video.category === "English Movies"
      )
      .slice(0, 3);


    renderVideos(
      desiResults,
      desiVideos
    );


    renderVideos(
      englishResults,
      englishVideos
    );


  } catch (error) {

    console.error(
      "Dot Video database error:",
      error
    );


    if (desiResults) {
      desiResults.innerHTML = `
        <div class="empty">
          Unable to load Desi Videos.
        </div>
      `;
    }


    if (englishResults) {
      englishResults.innerHTML = `
        <div class="empty">
          Unable to load English Movies.
        </div>
      `;
    }

  }

}


/* =========================================
   CREATE VIDEO CARDS
   ========================================= */

function renderVideos(container, videos) {

  if (!container) return;


  container.innerHTML = "";


  if (!videos || videos.length === 0) {

    container.innerHTML = `
      <div class="empty">
        No videos available yet.
      </div>
    `;

    return;

  }


  videos.forEach(video => {

    const card =
      document.createElement("article");

    card.className =
      "poster-card";


    /* =====================================
       POSTER
       ===================================== */

    const posterWrap =
      document.createElement("div");

    posterWrap.className =
      "poster-wrap";


    const poster =
      document.createElement("div");

    poster.className =
      "poster";


    const image =
      document.createElement("img");


    image.alt =
      video.title || "Video";


    image.loading =
      "lazy";


    if (video.poster_url) {

      image.src =
        video.poster_url;

    } else {

      image.alt =
        "No poster available";

    }


    image.onerror = () => {
      image.style.display = "none";
    };


    poster.appendChild(image);
    posterWrap.appendChild(poster);


    /* =====================================
       NEW BADGE
       ===================================== */

    const badge =
      document.createElement("span");

    badge.className =
      "new-badge";

    badge.textContent =
      "NEW";


    posterWrap.appendChild(badge);


    /* =====================================
       VIDEO INFORMATION
       ===================================== */

    const info =
      document.createElement("div");

    info.className =
      "poster-info";


    const title =
      document.createElement("h3");

    title.textContent =
      video.title || "Untitled";


    const category =
      document.createElement("p");


    if (
      video.category === "english" ||
      video.category === "English Movies"
    ) {

      category.textContent =
        "English Movies";

    } else {

      category.textContent =
        "Desi Videos";

    }


    info.appendChild(title);
    info.appendChild(category);


    card.appendChild(posterWrap);
    card.appendChild(info);


    /* =====================================
       OPEN PLAYER
       ===================================== */

    card.addEventListener("click", () => {

      const params =
        new URLSearchParams();


      params.set(
        "id",
        video.id
      );


      location.href =
        "Player.html?" +
        params.toString();

    });


    container.appendChild(card);

  });

}


/* =========================================
   SEARCH
   ========================================= */

const searchInput =
  document.getElementById("searchInput");

const searchBtn =
  document.getElementById("searchBtn");

const searchSection =
  document.getElementById("searchSection");

const searchResults =
  document.getElementById("searchResults");

const clearSearch =
  document.getElementById("clearSearch");


function performSearch() {

  if (!searchInput) return;


  const query =
    searchInput.value
      .trim()
      .toLowerCase();


  /* Empty search */

  if (!query) {

    if (searchSection) {
      searchSection.classList.add("hidden");
    }

    if (searchResults) {
      searchResults.innerHTML = "";
    }

    return;

  }


  /* Search title, description and category */

  const results =
    allVideos.filter(video => {

      const title =
        String(
          video.title || ""
        ).toLowerCase();


      const description =
        String(
          video.description || ""
        ).toLowerCase();


      const category =
        String(
          video.category || ""
        ).toLowerCase();


      return (
        title.includes(query) ||
        description.includes(query) ||
        category.includes(query)
      );

    });


  if (searchSection) {
    searchSection.classList.remove("hidden");
  }


  renderVideos(
    searchResults,
    results
  );


  if (searchSection) {

    searchSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}


/* Search button */

if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    performSearch
  );

}


/* Enter key */

if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Enter") {
        performSearch();
      }

    }
  );

}


/* Clear search */

if (clearSearch) {

  clearSearch.addEventListener(
    "click",
    () => {

      if (searchInput) {
        searchInput.value = "";
      }

      if (searchSection) {
        searchSection.classList.add("hidden");
      }

      if (searchResults) {
        searchResults.innerHTML = "";
      }

    }
  );

}


/* =========================================
   START
   ========================================= */

loadVideos();
