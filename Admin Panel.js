const client =
  window.supabaseClient ||
  window.supabase.createClient(
    window.DOT_VIDEO_SUPABASE.url,
    window.DOT_VIDEO_SUPABASE.publishableKey
  );

const $ = id => document.getElementById(id);

let allVideos = [];


/* =========================
   HELPERS
========================= */

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}


function safe(name) {
  return String(name || "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}


function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}


function getStoragePath(url, bucket) {

  try {

    if (!url) return "";

    const u = new URL(url);

    const marker =
      `/storage/v1/object/public/${bucket}/`;

    const index =
      u.pathname.indexOf(marker);

    if (index < 0) return "";

    return decodeURIComponent(
      u.pathname.slice(index + marker.length)
    );

  } catch (error) {

    return "";

  }
}


function formatBytes(bytes) {

  if (!bytes) return "";

  let number = bytes;

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  let index = 0;

  while (
    number >= 1024 &&
    index < 3
  ) {

    number /= 1024;
    index++;

  }

  return `${number.toFixed(index ? 1 : 0)} ${units[index]}`;
}


/* =========================
   ADMIN LOGIN CHECK
========================= */

async function guard() {

  const {
    data,
    error
  } = await client.auth.getSession();

  if (
    error ||
    !data.session
  ) {

    location.href =
      "Admin Login.html";

    return;
  }

  if ($("items")) {

    $("items").innerHTML =
      '<div class="loading">Loading your videos...</div>';

  }

  await load();
}


/* =========================
   LOAD VIDEOS
========================= */

async function load() {

  try {

    $("items").innerHTML =
      '<div class="loading">Loading your videos...</div>';


    const {
      data,
      error
    } = await client
      .from("videos")
      .select(
        "id,title,category,description,created_at,video_path,video_url,poster_url,published"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


    if (error) {

      console.error(
        "ADMIN LOAD ERROR:",
        error
      );

      $("items").innerHTML = `
        <div class="loading error-box">
          Database error:
          ${esc(error.message || "Unknown error")}
          <br>
          <small>
            Please refresh the page.
          </small>
        </div>
      `;

      return;
    }


    allVideos =
      Array.isArray(data)
        ? data
        : [];


    render(allVideos);


  } catch (error) {

    console.error(
      "ADMIN LOAD EXCEPTION:",
      error
    );


    $("items").innerHTML = `
      <div class="loading error-box">
        Could not load videos:
        ${esc(error.message || error)}
        <br>
        <small>
          Please refresh the page.
        </small>
      </div>
    `;

  }

}


/* =========================
   RENDER VIDEOS
========================= */

function render(list) {

  if (!list.length) {

    $("items").innerHTML =
      '<div class="loading">No uploaded videos found.</div>';

    return;
  }


  $("items").innerHTML =
    list.map(
      (video, index) => `

      <div class="item">

        <span>
          ${index + 1}
        </span>


        <span>

          <img
            class="poster-thumb"
            src="${esc(video.poster_url || "")}"
            alt=""
          >

        </span>


        <span class="item-title">

          <b>
            ${esc(video.title)}
          </b>

          <small>
            ${esc(video.description || "")}
          </small>

        </span>


        <span>

          <span class="pill">

            ${
              video.category === "english"
                ? "English Movies"
                : "Desi Videos"
            }

          </span>

        </span>


        <span>

          <span class="pill green">

            ${
              video.published === false
                ? "Draft"
                : "Published"
            }

          </span>

        </span>


        <span>
          ${formatDate(video.created_at)}
        </span>


        <span class="actions">

          <button
            class="edit-btn"
            onclick="openEdit('${video.id}')"
          >
            ✎ Edit
          </button>


          <button
            class="delete-btn"
            onclick="deleteVideo('${video.id}')"
          >
            🗑 Delete
          </button>

        </span>

      </div>

    `
    ).join("");

}


/* =========================
   SEARCH
========================= */

$("search").oninput = event => {

  const query =
    event.target.value
      .trim()
      .toLowerCase();


  const filtered =
    allVideos.filter(video => {

      const text =
        `${video.title || ""} ${
          video.description || ""
        }`.toLowerCase();

      return text.includes(query);

    });


  render(filtered);

};


/* =========================
   CHOOSE FILE
   BROWSE REMAINS SAME
========================= */

function hookFile(
  buttonId,
  inputId,
  nameId
) {

  $(buttonId).onclick = () => {

    $(inputId).click();

  };


  $(inputId).onchange = () => {

    const file =
      $(inputId).files[0];

    $(nameId).textContent =
      file
        ? file.name
        : "No file chosen";

  };

}


/* POSTER */

hookFile(
  "choosePoster",
  "poster",
  "posterName"
);


/* BROWSE POSTER */

hookFile(
  "browsePoster",
  "poster",
  "posterName"
);


/* VIDEO */

hookFile(
  "chooseVideo",
  "video",
  "videoName"
);


/* BROWSE VIDEO */

hookFile(
  "browseVideo",
  "video",
  "videoName"
);


/* =========================
   POSTER PREVIEW
========================= */

$("poster").addEventListener(
  "change",
  () => {

    const file =
      $("poster").files[0];

    $("posterName").textContent =
      file
        ? file.name
        : "No file chosen";


    if (!file) {

      $("posterPreview").style.display =
        "none";

      return;
    }


    const previewURL =
      URL.createObjectURL(file);


    $("posterPreview").src =
      previewURL;


    $("posterPreview").style.display =
      "block";

  }
);


/* =========================
   UPLOAD PROGRESS
========================= */

function progress(
  percent,
  loaded,
  total
) {

  $("uploadProgress").hidden =
    false;


  $("uploadProgressBar").style.width =
    `${Math.min(100, percent)}%`;


  $("uploadProgressText").textContent =
    `Uploading ${Math.round(percent)}%`;


  $("uploadProgressSize").textContent =
    total
      ? `${formatBytes(loaded)} / ${formatBytes(total)}`
      : "";

}


/* =========================
   SUPABASE STORAGE UPLOAD
========================= */

async function uploadFile(
  bucket,
  path,
  file,
  token,
  callback
) {

  return new Promise(
    (resolve, reject) => {

      const xhr =
        new XMLHttpRequest();


      xhr.open(
        "POST",
        `${
          window.DOT_VIDEO_SUPABASE.url
        }/storage/v1/object/${bucket}/${encodeURIComponent(path).replace(/%2F/g, "/")}`
      );


      xhr.setRequestHeader(
        "apikey",
        window.DOT_VIDEO_SUPABASE.publishableKey
      );


      xhr.setRequestHeader(
        "Authorization",
        `Bearer ${token}`
      );


      xhr.setRequestHeader(
        "x-upsert",
        "false"
      );


      xhr.setRequestHeader(
        "Content-Type",
        file.type ||
        "application/octet-stream"
      );


      xhr.upload.onprogress =
        event => {

          if (
            event.lengthComputable
          ) {

            callback(
              event.loaded,
              event.total
            );

          }

        };


      xhr.onload = () => {

        if (
          xhr.status >= 200 &&
          xhr.status < 300
        ) {

          resolve();

        } else {

          reject(
            new Error(
              `Upload failed (${xhr.status})`
            )
          );

        }

      };


      xhr.onerror = () => {

        reject(
          new Error(
            "Network error while uploading."
          )
        );

      };


      xhr.send(file);

    }
  );

}


/* =========================
   UPLOAD NEW VIDEO
========================= */

$("save").onclick =
  async () => {

    const title =
      $("title").value.trim();

    const posterFile =
      $("poster").files[0];

    const videoFile =
      $("video").files[0];


    if (
      !title ||
      !videoFile
    ) {

      $("msg").textContent =
        "Title and video are required.";

      return;

    }


    $("save").disabled =
      true;


    try {

      const {
        data: sessionData,
        error: sessionError
      } =
        await client.auth.getSession();


      if (
        sessionError ||
        !sessionData.session
      ) {

        throw new Error(
          "Admin session expired."
        );

      }


      const token =
        sessionData.session.access_token;


      const timestamp =
        Date.now();


      const totalSize =
        videoFile.size +
        (posterFile
          ? posterFile.size
          : 0);


      const videoPath =
        `${timestamp}-${safe(videoFile.name)}`;


      /* VIDEO */

      await uploadFile(
        "videos",
        videoPath,
        videoFile,
        token,
        (loaded, total) => {

          progress(
            (loaded / totalSize) * 100,
            loaded,
            totalSize
          );

        }
      );


      /* POSTER */

      let posterPath = "";
      let posterURL = "";


      if (posterFile) {

        posterPath =
          `${timestamp}-${safe(posterFile.name)}`;


        await uploadFile(
          "posters",
          posterPath,
          posterFile,
          token,
          (loaded, total) => {

            progress(
              (
                videoFile.size +
                loaded
              ) /
              totalSize *
              100,

              videoFile.size +
              loaded,

              totalSize
            );

          }
        );


        posterURL =
          client
            .storage
            .from("posters")
            .getPublicUrl(
              posterPath
            )
            .data
            .publicUrl;

      }


      const videoURL =
        client
          .storage
          .from("videos")
          .getPublicUrl(
            videoPath
          )
          .data
          .publicUrl;


      /* DATABASE */

      const {
        error
      } =
        await client
          .from("videos")
          .insert({

            title,

            category:
              $("category").value,

            description:
              $("description")
                .value
                .trim(),

            video_path:
              videoPath,

            video_url:
              videoURL,

            poster_url:
              posterURL,

            published:
              $("publish").checked

          });


      if (error) {

        throw error;

      }


      $("uploadProgressText").textContent =
        "Upload 100%";


      $("uploadProgressBar").style.width =
        "100%";


      $("msg").textContent =
        "Uploaded successfully.";


      /* CLEAR FORM */

      $("title").value = "";

      $("description").value = "";

      $("poster").value = "";

      $("video").value = "";

      $("posterName").textContent =
        "No file chosen";

      $("videoName").textContent =
        "No file chosen";

      $("posterPreview").style.display =
        "none";


      await load();


    } catch (error) {

      console.error(
        "UPLOAD ERROR:",
        error
      );


      $("msg").textContent =
        error.message ||
        "Upload failed.";


    } finally {

      $("save").disabled =
        false;

    }

  };


/* =========================
   EDIT VIDEO
========================= */

window.openEdit =
  id => {

    const video =
      allVideos.find(
        item => item.id === id
      );


    if (!video) return;


    $("editModal").hidden =
      false;


    $("editModal").dataset.id =
      id;


    $("editTitle").value =
      video.title || "";


    $("editCategory").value =
      video.category || "desi";


    $("editDescription").value =
      video.description || "";


    $("editPoster").value =
      "";


    $("editVideo").value =
      "";


    $("editMsg").textContent =
      "";

  };


$("closeEdit").onclick =
  () => {

    $("editModal").hidden =
      true;

  };


/* =========================
   SAVE EDIT
========================= */

$("saveEdit").onclick =
  async () => {

    const id =
      $("editModal").dataset.id;


    const video =
      allVideos.find(
        item => item.id === id
      );


    if (!video) return;


    $("saveEdit").disabled =
      true;


    try {

      const {
        data: sessionData,
        error: sessionError
      } =
        await client.auth.getSession();


      if (
        sessionError ||
        !sessionData.session
      ) {

        throw new Error(
          "Admin session expired."
        );

      }


      const token =
        sessionData.session.access_token;


      const update = {

        title:
          $("editTitle")
            .value
            .trim(),

        category:
          $("editCategory")
            .value,

        description:
          $("editDescription")
            .value
            .trim()

      };


      const posterFile =
        $("editPoster").files[0];


      const videoFile =
        $("editVideo").files[0];


      const timestamp =
        Date.now();


      /* NEW POSTER */

      if (posterFile) {

        const posterPath =
          `${timestamp}-${safe(posterFile.name)}`;


        await uploadFile(
          "posters",
          posterPath,
          posterFile,
          token,
          () => {}
        );


        update.poster_url =
          client
            .storage
            .from("posters")
            .getPublicUrl(
              posterPath
            )
            .data
            .publicUrl;

      }


      /* NEW VIDEO */

      if (videoFile) {

        const videoPath =
          `${timestamp}-${safe(videoFile.name)}`;


        await uploadFile(
          "videos",
          videoPath,
          videoFile,
          token,
          () => {}
        );


        update.video_path =
          videoPath;


        update.video_url =
          client
            .storage
            .from("videos")
            .getPublicUrl(
              videoPath
            )
            .data
            .publicUrl;

      }


      const {
        error
      } =
        await client
          .from("videos")
          .update(update)
          .eq("id", id);


      if (error) {

        throw error;

      }


      $("editMsg").textContent =
        "Saved successfully.";


      await load();


      setTimeout(
        () => {

          $("editModal").hidden =
            true;

        },
        500
      );


    } catch (error) {

      console.error(
        "EDIT ERROR:",
        error
      );


      $("editMsg").textContent =
        error.message ||
        "Update failed.";


    } finally {

      $("saveEdit").disabled =
        false;

    }

  };


/* =========================
   DELETE VIDEO
========================= */

window.deleteVideo =
  async id => {

    const video =
      allVideos.find(
        item => item.id === id
      );


    if (!video) return;


    const confirmed =
      confirm(
        `Delete "${video.title}"?\n\nThis will remove the video from the website.`
      );


    if (!confirmed) return;


    try {

      const {
        error
      } =
        await client
          .from("videos")
          .delete()
          .eq("id", id);


      if (error) {

        throw error;

      }


      const videoPath =
        video.video_path ||
        getStoragePath(
          video.video_url,
          "videos"
        );


      const posterPath =
        getStoragePath(
          video.poster_url,
          "posters"
        );


      if (videoPath) {

        await client
          .storage
          .from("videos")
          .remove([
            videoPath
          ]);

      }


      if (posterPath) {

        await client
          .storage
          .from("posters")
          .remove([
            posterPath
          ]);

      }


      await load();


      $("msg").textContent =
        "Deleted successfully.";


    } catch (error) {

      console.error(
        "DELETE ERROR:",
        error
      );


      $("msg").textContent =
        "Delete failed: " +
        (
          error.message ||
          error
        );

    }

  };


/* =========================
   LOGOUT
========================= */

$("logout").onclick =
  async () => {

    await client.auth.signOut();

    location.href =
      "Admin Login.html";

  };


/* =========================
   START
========================= */

guard();
