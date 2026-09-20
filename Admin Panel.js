const client = window.supabaseClient || window.supabase.createClient(
  window.DOT_VIDEO_SUPABASE.url,
  window.DOT_VIDEO_SUPABASE.publishableKey
);

const $ = id => document.getElementById(id);

async function guard(){
  const {data,error} = await client.auth.getSession();

  if(error || !data.session){
    location.href = "Admin Login.html";
    return;
  }

  load();
}


/* =========================
   LOAD CONTENT
========================= */

async function load(){

  const {data,error} = await client
    .from("videos")
    .select(
      "id,title,category,description,created_at,video_path,video_url,poster_url"
    )
    .order("created_at",{ascending:false});

  if(error){
    $("items").innerHTML =
      "Database error: " + esc(error.message);
    return;
  }

  $("items").innerHTML = data?.length
    ? data.map(v => `
      <div class="item">

        <div class="item-info">

          <b>${esc(v.title)}</b>
          — ${esc(v.category)}

          <br>

          <small>
            ${esc(v.description || "")}
          </small>

        </div>

        <div style="display:flex;gap:8px;margin-top:8px;">

          <button
            class="edit-btn"
            data-id="${esc(v.id)}"
            data-title="${esc(v.title)}"
            data-category="${esc(v.category)}"
            data-description="${esc(v.description || "")}"
            data-video-path="${esc(v.video_path || "")}"
            data-video-url="${esc(v.video_url || "")}"
            data-poster-url="${esc(v.poster_url || "")}"
            style="width:auto;padding:9px 14px;background:#2563eb;"
          >
            Edit
          </button>

          <button
            class="delete-btn"
            data-id="${esc(v.id)}"
            data-video-path="${esc(v.video_path || "")}"
            data-video-url="${esc(v.video_url || "")}"
            data-poster-url="${esc(v.poster_url || "")}"
            style="width:auto;padding:9px 14px;"
          >
            Delete
          </button>

        </div>

      </div>
    `).join("")
    : "No content yet.";


  document.querySelectorAll(".delete-btn")
    .forEach(btn => {
      btn.onclick = () => deleteVideo(btn);
    });


  document.querySelectorAll(".edit-btn")
    .forEach(btn => {
      btn.onclick = () => openEdit(btn);
    });
}


/* =========================
   ESCAPE HTML
========================= */

function esc(s){

  return String(s ?? "").replace(/[&<>"']/g,c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#39;"
  }[c]));

}


/* =========================
   SAFE FILE NAME
========================= */

function safe(name){

  return String(name || "")
    .replace(/[^a-zA-Z0-9._-]/g,"_");

}


/* =========================
   STORAGE PATH
========================= */

function getStoragePath(publicUrl,bucket){

  if(!publicUrl) return "";

  try{

    const url = new URL(publicUrl);

    const marker =
      `/storage/v1/object/public/${bucket}/`;

    const index =
      url.pathname.indexOf(marker);

    if(index === -1) return "";

    return decodeURIComponent(
      url.pathname.slice(index + marker.length)
    );

  }catch(e){

    return "";

  }

}


/* =========================
   CREATE EDIT BOX
========================= */

function createEditBox(){

  if($("editBox")) return;

  const box = document.createElement("div");

  box.id = "editBox";

  box.style.cssText = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.55);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:9999;
    padding:16px;
  `;

  box.innerHTML = `

    <div style="
      background:#fff;
      width:100%;
      max-width:520px;
      max-height:90vh;
      overflow:auto;
      border-radius:18px;
      padding:18px;
      box-shadow:0 20px 60px rgba(0,0,0,.25);
    ">

      <h2 style="margin-top:0;">
        Edit Video
      </h2>

      <input
        id="editTitle"
        placeholder="Title"
        style="width:100%;padding:12px;margin:6px 0;"
      >

      <select
        id="editCategory"
        style="width:100%;padding:12px;margin:6px 0;"
      >
        <option value="desi">
          Desi Videos
        </option>

        <option value="english">
          English Movies
        </option>
      </select>

      <textarea
        id="editDescription"
        placeholder="Description"
        style="
          width:100%;
          min-height:120px;
          padding:12px;
          margin:6px 0;
          resize:vertical;
        "
      ></textarea>


      <div style="
        border:1px solid #ddd;
        border-radius:12px;
        padding:12px;
        margin-top:10px;
      ">

        <b>Replace Poster (optional)</b>

        <input
          id="editPoster"
          type="file"
          accept="image/*"
          style="width:100%;margin-top:8px;"
        >

      </div>


      <div style="
        border:1px solid #ddd;
        border-radius:12px;
        padding:12px;
        margin-top:10px;
      ">

        <b>Replace Video (optional)</b>

        <input
          id="editVideo"
          type="file"
          accept="video/*"
          style="width:100%;margin-top:8px;"
        >

      </div>


      <div
        id="editMsg"
        style="
          margin-top:12px;
          font-weight:700;
        "
      ></div>


      <div style="
        display:flex;
        gap:10px;
        margin-top:15px;
      ">

        <button
          id="cancelEdit"
          style="
            background:#6b7280;
            flex:1;
          "
        >
          Cancel
        </button>

        <button
          id="saveEdit"
          style="
            background:#2563eb;
            flex:1;
          "
        >
          Save Changes
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(box);


  $("cancelEdit").onclick = () => {
    box.remove();
  };

}


/* =========================
   OPEN EDIT
========================= */

function openEdit(btn){

  createEditBox();

  $("editTitle").value =
    btn.dataset.title || "";

  $("editCategory").value =
    btn.dataset.category || "desi";

  $("editDescription").value =
    btn.dataset.description || "";

  $("editPoster").value = "";
  $("editVideo").value = "";

  $("editMsg").textContent = "";

  $("saveEdit").onclick = () =>
    saveEdit(btn);

}


/* =========================
   SAVE EDIT
========================= */

async function saveEdit(btn){

  const id =
    btn.dataset.id;

  const title =
    $("editTitle").value.trim();

  const category =
    $("editCategory").value;

  const description =
    $("editDescription").value.trim();

  const newPoster =
    $("editPoster").files[0];

  const newVideo =
    $("editVideo").files[0];


  if(!title){

    $("editMsg").textContent =
      "Title is required.";

    return;

  }


  const saveBtn =
    $("saveEdit");

  saveBtn.disabled = true;

  $("editMsg").textContent =
    "Saving changes...";


  try{

    const {
      data:sessionData,
      error:sessionError
    } = await client.auth.getSession();


    if(
      sessionError ||
      !sessionData.session
    ){

      throw new Error(
        "Admin session expired. Please login again."
      );

    }


    const token =
      sessionData.session.access_token;


    let videoPath =
      btn.dataset.videoPath || "";

    let videoUrl =
      btn.dataset.videoUrl || "";

    let posterUrl =
      btn.dataset.posterUrl || "";

    let oldVideoPath =
      videoPath;

    let oldPosterPath =
      getStoragePath(
        posterUrl,
        "posters"
      );


    const stamp =
      Date.now();


    /* =====================
       NEW VIDEO
    ===================== */

    if(newVideo){

      const newPath =
        `${stamp}-${safe(newVideo.name)}`;


      $("editMsg").textContent =
        "Uploading new video...";


      await uploadFileWithProgress(
        "videos",
        newPath,
        newVideo,
        token,
        () => {}
      );


      videoPath =
        newPath;


      videoUrl =
        client.storage
          .from("videos")
          .getPublicUrl(newPath)
          .data.publicUrl;


      /* Remove old video */

      if(oldVideoPath){

        const {error} =
          await client.storage
            .from("videos")
            .remove([oldVideoPath]);

        if(error)
          console.warn(
            "Old video delete:",
            error.message
          );

      }

    }


    /* =====================
       NEW POSTER
    ===================== */

    if(newPoster){

      const newPosterPath =
        `${stamp}-${safe(newPoster.name)}`;


      $("editMsg").textContent =
        "Uploading new poster...";


      await uploadFileWithProgress(
        "posters",
        newPosterPath,
        newPoster,
        token,
        () => {}
      );


      posterUrl =
        client.storage
          .from("posters")
          .getPublicUrl(
            newPosterPath
          )
          .data.publicUrl;


      /* Remove old poster */

      if(oldPosterPath){

        const {error} =
          await client.storage
            .from("posters")
            .remove([
              oldPosterPath
            ]);

        if(error)
          console.warn(
            "Old poster delete:",
            error.message
          );

      }

    }


    /* =====================
       UPDATE DATABASE
    ===================== */

    $("editMsg").textContent =
      "Updating information...";


    const {error:updateError} =
      await client
        .from("videos")
        .update({

          title:title,

          category:category,

          description:description,

          video_path:videoPath,

          video_url:videoUrl,

          poster_url:posterUrl

        })
        .eq("id",id);


    if(updateError)
      throw updateError;


    $("editMsg").textContent =
      "Updated successfully.";


    await load();


    setTimeout(() => {

      if($("editBox"))
        $("editBox").remove();

    },1000);


  }catch(e){

    console.error(
      "EDIT ERROR:",
      e
    );

    $("editMsg").textContent =
      "Edit failed: " +
      (e.message || e);

    saveBtn.disabled = false;

  }

}


/* =========================
   DELETE VIDEO
========================= */

async function deleteVideo(btn){

  const id =
    btn.dataset.id;

  const title =
    btn.parentElement
      .parentElement
      .querySelector("b")
      ?.textContent ||
    "this video";


  if(!confirm(
    `Delete "${title}"?\n\n` +
    `This will remove the video from the website.`
  )) return;


  btn.disabled = true;

  btn.textContent =
    "Deleting...";


  $("msg").style.display =
    "block";

  $("msg").textContent =
    "Deleting...";


  let deleteProgress =
    $("deleteProgress");


  if(!deleteProgress){

    deleteProgress =
      document.createElement("div");

    deleteProgress.id =
      "deleteProgress";

    deleteProgress.style.cssText = `
      margin-top:10px;
      padding:10px 12px;
      background:#f3f4f6;
      border:1px solid #e5e7eb;
      border-radius:12px;
    `;

    deleteProgress.innerHTML = `

      <div style="
        display:flex;
        justify-content:space-between;
        margin-bottom:7px;
        font-size:14px;
      ">

        <span id="deleteProgressText">
          Deleting 0%
        </span>

      </div>

      <div style="
        height:9px;
        background:#d1d5db;
        border-radius:999px;
        overflow:hidden;
      ">

        <div
          id="deleteProgressBar"
          style="
            width:0%;
            height:100%;
            background:#111827;
            border-radius:999px;
          "
        ></div>

      </div>
    `;

    $("msg")
      .insertAdjacentElement(
        "afterend",
        deleteProgress
      );

  }


  deleteProgress.hidden =
    false;


  try{

    const videoPath =
      btn.dataset.videoPath ||
      getStoragePath(
        btn.dataset.videoUrl,
        "videos"
      );

    const posterPath =
      getStoragePath(
        btn.dataset.posterUrl,
        "posters"
      );


    $("deleteProgressBar")
      .style.width = "15%";

    $("deleteProgressText")
      .textContent =
      "Deleting 15%";


    const {error:dbError} =
      await client
        .from("videos")
        .delete()
        .eq("id",id);


    if(dbError)
      throw dbError;


    $("deleteProgressBar")
      .style.width = "50%";

    $("deleteProgressText")
      .textContent =
      "Deleting 50%";


    if(videoPath){

      const {error} =
        await client
          .storage
          .from("videos")
          .remove([videoPath]);

      if(error)
        console.warn(
          "Video delete:",
          error.message
        );

    }


    if(posterPath){

      const {error} =
        await client
          .storage
          .from("posters")
          .remove([posterPath]);

      if(error)
        console.warn(
          "Poster delete:",
          error.message
        );

    }


    $("deleteProgressBar")
      .style.width = "100%";

    $("deleteProgressText")
      .textContent =
      "Delete 100%";


    $("msg").textContent =
      "Deleted successfully.";


    await load();


    setTimeout(() => {

      if($("deleteProgress"))
        $("deleteProgress").hidden = true;

      $("msg").style.display =
        "none";

      $("msg").textContent =
        "";

    },1500);


  }catch(e){

    console.error(
      "DELETE ERROR:",
      e
    );

    $("msg").style.display =
      "block";

    $("msg").textContent =
      "Delete failed: " +
      (e.message || e);

    btn.disabled = false;

    btn.textContent =
      "Delete";

  }

}


/* =========================
   POSTER PREVIEW
========================= */

$("poster").onchange = () => {

  const f =
    $("poster").files[0];

  if(!f){

    $("posterPreview")
      .style.display = "none";

    return;

  }


  $("posterPreview").src =
    URL.createObjectURL(f);

  $("posterPreview")
    .style.display = "block";

};


/* =========================
   VIDEO INFO
========================= */

$("video").onchange = () => {

  const f =
    $("video").files[0];

  $("videoInfo").textContent =
    f
      ? `${f.name} (${(f.size/1024/1024).toFixed(1)} MB)`
      : "";

};


/* =========================
   FORMAT BYTES
========================= */

function formatBytes(bytes){

  if(
    !Number.isFinite(bytes) ||
    bytes <= 0
  )
    return "";

  const units =
    ["B","KB","MB","GB"];

  let value =
    bytes;

  let unit =
    0;

  while(
    value >= 1024 &&
    unit < units.length - 1
  ){

    value /= 1024;
    unit++;

  }

  return `${value.toFixed(
    value >= 100 || unit === 0
      ? 0
      : 1
  )} ${units[unit]}`;

}


/* =========================
   UPLOAD PROGRESS
========================= */

function setUploadProgress(
  percent,
  loaded,
  total
){

  const safePercent =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) || 0
      )
    );


  $("uploadProgress")
    .hidden = false;


  $("uploadProgressBar")
    .style.width =
    safePercent + "%";


  $("uploadProgressText")
    .textContent =
    `Uploading ${Math.round(
      safePercent
    )}%`;


  $("uploadProgressSize")
    .textContent =
    total > 0
      ? `${formatBytes(loaded)} / ${formatBytes(total)}`
      : formatBytes(loaded);

}


function finishUploadProgress(){

  $("uploadProgressBar")
    .style.width = "100%";

  $("uploadProgressText")
    .textContent =
    "Upload 100%";

}


function resetUploadProgress(){

  $("uploadProgress")
    .hidden = true;

  $("uploadProgressBar")
    .style.width = "0%";

  $("uploadProgressText")
    .textContent =
    "Uploading 0%";

  $("uploadProgressSize")
    .textContent = "";

}


/* =========================
   UPLOAD FILE
========================= */

async function uploadFileWithProgress(
  bucket,
  path,
  file,
  token,
  onProgress
){

  return new Promise(
    (resolve,reject) => {

      const xhr =
        new XMLHttpRequest();


      xhr.open(
        "POST",
        `${window.DOT_VIDEO_SUPABASE.url}` +
        `/storage/v1/object/${bucket}/` +
        `${encodeURIComponent(path)
          .replace(/%2F/g,"/")}`,
        true
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
        e => {

          if(e.lengthComputable)
            onProgress(
              e.loaded,
              e.total
            );

        };


      xhr.onload = () => {

        if(
          xhr.status >= 200 &&
          xhr.status < 300
        ){

          resolve();

        }else{

          let message =
            `Upload failed (${xhr.status})`;

          try{

            const data =
              JSON.parse(
                xhr.responseText
              );

            if(data.message)
              message =
                data.message;

            else if(data.error)
              message =
                data.error;

          }catch(_){}

          reject(
            new Error(message)
          );

        }

      };


      xhr.onerror = () =>
        reject(
          new Error(
            "Network error while uploading."
          )
        );


      xhr.onabort = () =>
        reject(
          new Error(
            "Upload cancelled."
          )
        );


      xhr.send(file);

    }
  );

}


/* =========================
   UPLOAD NEW VIDEO
========================= */

$("save").onclick =
async () => {

  const t =
    $("title").value.trim();

  const pf =
    $("poster").files[0];

  const vf =
    $("video").files[0];


  if(!t || !vf){

    $("msg").style.display =
      "block";

    $("msg").textContent =
      "Title and video are required.";

    return;

  }


  $("save").disabled =
    true;

  $("msg").style.display =
    "block";


  resetUploadProgress();


  setUploadProgress(
    0,
    0,
    vf.size +
    (pf ? pf.size : 0)
  );


  $("msg").textContent =
    "Uploading video...";


  try{

    const {
      data:sessionData,
      error:sessionError
    } =
      await client.auth.getSession();


    if(
      sessionError ||
      !sessionData.session
    ){

      throw new Error(
        "Admin session expired. Please login again."
      );

    }


    const token =
      sessionData.session.access_token;


    const stamp =
      Date.now();


    const vp =
      `${stamp}-${safe(vf.name)}`;


    const totalBytes =
      vf.size +
      (pf ? pf.size : 0);


    await uploadFileWithProgress(
      "videos",
      vp,
      vf,
      token,
      (loaded,total) => {

        setUploadProgress(
          (loaded / totalBytes) * 100,
          loaded,
          totalBytes
        );

      }
    );


    let posterUrl = "";

    let posterPath = "";


    if(pf){

      posterPath =
        `${stamp}-${safe(pf.name)}`;


      $("msg").textContent =
        "Uploading poster...";


      await uploadFileWithProgress(
        "posters",
        posterPath,
        pf,
        token,
        (loaded,total) => {

          setUploadProgress(
            (
              (vf.size + loaded)
              / totalBytes
            ) * 100,

            vf.size + loaded,

            totalBytes
          );

        }
      );


      posterUrl =
        client.storage
          .from("posters")
          .getPublicUrl(
            posterPath
          )
          .data.publicUrl;

    }


    const videoUrl =
      client.storage
        .from("videos")
        .getPublicUrl(vp)
        .data.publicUrl;


    const r =
      await client
        .from("videos")
        .insert({

          title:t,

          category:
            $("category").value,

          description:
            $("description")
              .value
              .trim(),

          video_path:
            vp,

          video_url:
            videoUrl,

          poster_url:
            posterUrl,

          published:true

        });


    if(r.error)
      throw r.error;


    finishUploadProgress();


    $("msg").textContent =
      "Uploaded successfully.";


    $("uploadProgress")
      .hidden = true;


    $("msg").style.display =
      "none";


    $("title").value = "";

    $("description").value = "";

    $("poster").value = "";

    $("video").value = "";

    $("posterPreview")
      .style.display = "none";

    $("videoInfo")
      .textContent = "";


    load();


  }catch(e){

    $("msg").style.display =
      "block";

    console.error(
      "UPLOAD ERROR:",
      e
    );

    $("msg").textContent =
      e.message ||
      "Upload failed.";

  }finally{

    $("save").disabled =
      false;

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
