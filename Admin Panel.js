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

async function load(){
  const {data,error} = await client
    .from("videos")
    .select("id,title,category,description,created_at,video_path,video_url,poster_url")
    .order("created_at",{ascending:false});

  if(error){
    $("items").innerHTML = "Database error: " + esc(error.message);
    return;
  }

  $("items").innerHTML = data?.length
    ? data.map(v => `
      <div class="item">
        <div class="item-info">
          <b>${esc(v.title)}</b> — ${esc(v.category)}<br>
          <small>${esc(v.description || "")}</small>
        </div>
        <button class="delete-btn" data-id="${esc(v.id)}" data-video-path="${esc(v.video_path || "")}" data-video-url="${esc(v.video_url || "")}" data-poster-url="${esc(v.poster_url || "")}">Delete</button>
      </div>
    `).join("")
    : "No content yet.";

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = () => deleteVideo(btn);
  });
}

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g,c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}

function safe(name){
  return String(name || "").replace(/[^a-zA-Z0-9._-]/g,"_");
}

function getStoragePath(publicUrl, bucket){
  if(!publicUrl) return "";
  try{
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = url.pathname.indexOf(marker);
    if(index === -1) return "";
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  }catch(e){
    return "";
  }
}

async function deleteVideo(btn){
  const id = btn.dataset.id;
  const title = btn.parentElement.querySelector("b")?.textContent || "this video";

  if(!confirm(`Delete "${title}"?\n\nThis will remove the video from the website.`)) return;

  btn.disabled = true;
  btn.textContent = "Deleting...";
  $("msg").style.display = "block";
  $("msg").textContent = "Deleting...";

  let deleteProgress = $("deleteProgress");
  if (!deleteProgress) {
    deleteProgress = document.createElement("div");
    deleteProgress.id = "deleteProgress";
    deleteProgress.style.cssText =
      "margin-top:10px;padding:10px 12px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:12px;";
    deleteProgress.innerHTML =
      '<div style="display:flex;justify-content:space-between;gap:10px;font-size:14px;margin-bottom:7px;">' +
      '<span id="deleteProgressText">Deleting 0%</span><span id="deleteProgressSize"></span></div>' +
      '<div style="height:9px;background:#d1d5db;border-radius:999px;overflow:hidden;">' +
      '<div id="deleteProgressBar" style="width:0%;height:100%;background:#111827;border-radius:999px;"></div>' +
      '</div>';
    $("msg").insertAdjacentElement("afterend", deleteProgress);
  }

  deleteProgress.hidden = false;
  $("deleteProgressBar").style.width = "15%";
  $("deleteProgressText").textContent = "Deleting 15%";

  try{
    const videoPath = btn.dataset.videoPath || getStoragePath(btn.dataset.videoUrl,"videos");
    const posterPath = getStoragePath(btn.dataset.posterUrl,"posters");

    const {error: dbError} = await client.from("videos").delete().eq("id", id);
    if(dbError) throw dbError;

    $("deleteProgressBar").style.width = "50%";
    $("deleteProgressText").textContent = "Deleting 50%";

    if(videoPath){
      const {error} = await client.storage.from("videos").remove([videoPath]);
      if(error) console.warn("Video storage delete:", error.message);
    }

    if(posterPath){
      const {error} = await client.storage.from("posters").remove([posterPath]);
      if(error) console.warn("Poster storage delete:", error.message);
    }

    $("deleteProgressBar").style.width = "100%";
    $("deleteProgressText").textContent = "Delete 100%";
    $("msg").style.display = "block";
    $("msg").textContent = "Deleted successfully.";

    await load();

    setTimeout(() => {
      if ($("deleteProgress")) $("deleteProgress").hidden = true;
      $("msg").style.display = "none";
      $("msg").textContent = "";
    }, 1500);

  }catch(e){
    if ($("deleteProgress")) $("deleteProgress").hidden = true;
    $("msg").style.display = "block";
    console.error("DELETE ERROR:", e);
    $("msg").textContent = "Delete failed: " + (e.message || e);
    btn.disabled = false;
    btn.textContent = "Delete";
  }
}

$("poster").onchange = () => {
  const f = $("poster").files[0];
  if(!f){
    $("posterPreview").style.display="none";
    return;
  }
  $("posterPreview").src = URL.createObjectURL(f);
  $("posterPreview").style.display="block";
};

$("video").onchange = () => {
  const f = $("video").files[0];
  $("videoInfo").textContent = f ? `${f.name} (${(f.size/1024/1024).toFixed(1)} MB)` : "";
};

function formatBytes(bytes){
  if(!Number.isFinite(bytes) || bytes <= 0) return "";
  const units=["B","KB","MB","GB"];
  let value=bytes, unit=0;
  while(value>=1024 && unit<units.length-1){
    value/=1024;
    unit++;
  }
  return `${value.toFixed(value>=100 || unit===0 ? 0 : 1)} ${units[unit]}`;
}

function setUploadProgress(percent, loaded, total){
  const safePercent=Math.max(0,Math.min(100,Number(percent)||0));
  $("uploadProgress").hidden=false;
  $("uploadProgressBar").style.width=safePercent+"%";
  $("uploadProgressText").textContent=`Uploading ${Math.round(safePercent)}%`;
  $("uploadProgressSize").textContent=total>0
    ? `${formatBytes(loaded)} / ${formatBytes(total)}`
    : formatBytes(loaded);
}

function finishUploadProgress(){
  $("uploadProgressBar").style.width="100%";
  $("uploadProgressText").textContent="Upload 100%";
}

function resetUploadProgress(){
  $("uploadProgress").hidden=true;
  $("uploadProgressBar").style.width="0%";
  $("uploadProgressText").textContent="Uploading 0%";
  $("uploadProgressSize").textContent="";
}

async function uploadFileWithProgress(bucket,path,file,token,onProgress){
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();

    xhr.open(
      "POST",
      `${window.DOT_VIDEO_SUPABASE.url}/storage/v1/object/${bucket}/${encodeURIComponent(path).replace(/%2F/g,"/")}`,
      true
    );

    xhr.setRequestHeader("apikey",window.DOT_VIDEO_SUPABASE.publishableKey);
    xhr.setRequestHeader("Authorization",`Bearer ${token}`);
    xhr.setRequestHeader("x-upsert","false");
    xhr.setRequestHeader("Content-Type",file.type || "application/octet-stream");

    xhr.upload.onprogress=e=>{
      if(e.lengthComputable) onProgress(e.loaded,e.total);
    };

    xhr.onload=()=>{
      if(xhr.status>=200 && xhr.status<300){
        resolve();
      }else{
        let message=`Upload failed (${xhr.status})`;
        try{
          const data=JSON.parse(xhr.responseText);
          if(data.message) message=data.message;
          else if(data.error) message=data.error;
        }catch(_){}
        reject(new Error(message));
      }
    };

    xhr.onerror=()=>reject(new Error("Network error while uploading."));
    xhr.onabort=()=>reject(new Error("Upload cancelled."));
    xhr.send(file);
  });
}

$("save").onclick = async () => {
  const t = $("title").value.trim();
  const pf = $("poster").files[0];
  const vf = $("video").files[0];

  if(!t || !vf){
    $("msg").textContent = "Title and video are required.";
    return;
  }

  $("save").disabled = true;
  $("msg").style.display = "block";
  resetUploadProgress();

  setUploadProgress(
    0,
    0,
    vf.size + (pf ? pf.size : 0)
  );

  $("msg").textContent = "Uploading video...";

  try{
    const {data:sessionData,error:sessionError}=await client.auth.getSession();

    if(sessionError || !sessionData.session){
      throw new Error("Admin session expired. Please login again.");
    }

    const token=sessionData.session.access_token;
    const stamp=Date.now();

    const vp=`${stamp}-${safe(vf.name)}`;
    const totalBytes=vf.size+(pf ? pf.size : 0);

    await uploadFileWithProgress(
      "videos",
      vp,
      vf,
      token,
      (loaded,total)=>{
        setUploadProgress(
          (loaded/totalBytes)*100,
          loaded,
          totalBytes
        );
      }
    );

    let posterUrl="";
    let posterPath="";

    if(pf){
      posterPath=`${stamp}-${safe(pf.name)}`;
      $("msg").textContent="Uploading poster...";

      await uploadFileWithProgress(
        "posters",
        posterPath,
        pf,
        token,
        (loaded,total)=>{
          setUploadProgress(
            ((vf.size+loaded)/totalBytes)*100,
            vf.size+loaded,
            totalBytes
          );
        }
      );

      posterUrl=client.storage
        .from("posters")
        .getPublicUrl(posterPath)
        .data.publicUrl;
    }

    const videoUrl=client.storage
      .from("videos")
      .getPublicUrl(vp)
      .data.publicUrl;

    const r=await client.from("videos").insert({
      title:t,
      category:$("category").value,
      description:$("description").value.trim(),
      video_path:vp,
      video_url:videoUrl,
      poster_url:posterUrl,
      published:true
    });

    if(r.error) throw r.error;

    finishUploadProgress();

    $("msg").textContent="Uploaded successfully.";
    $("uploadProgress").hidden=true;
    $("msg").style.display="none";

    $("title").value="";
    $("description").value="";
    $("poster").value="";
    $("video").value="";
    $("posterPreview").style.display="none";
    $("videoInfo").textContent="";

    load();

  }catch(e){
    $("msg").style.display = "block";
    console.error("UPLOAD ERROR:",e);
    $("msg").textContent=e.message || "Upload failed.";
  }finally{
    $("save").disabled=false;
  }
};

$("logout").onclick = async () => {
  await client.auth.signOut();
  location.href = "Admin Login.html";
};

guard();
