const client=window.supabaseClient||window.supabase.createClient(window.DOT_VIDEO_SUPABASE.url,window.DOT_VIDEO_SUPABASE.publishableKey);
const $=id=>document.getElementById(id);
let allVideos=[];

function esc(s){return String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function safe(name){return String(name||"").replace(/[^a-zA-Z0-9._-]/g,"_");}
function formatDate(s){if(!s)return"";return new Date(s).toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});}
function getStoragePath(url,bucket){try{if(!url)return"";const u=new URL(url),m=`/storage/v1/object/public/${bucket}/`;const i=u.pathname.indexOf(m);return i<0?"":decodeURIComponent(u.pathname.slice(i+m.length));}catch(e){return"";}}

async function guard(){
 const {data,error}=await client.auth.getSession();
 if(error||!data.session){location.href="Admin Login.html";return;}
 $("items").innerHTML='<div class="loading">Loading your videos...</div>';
 await load();
}

async function load(){
 try{
  $("items").innerHTML='<div class="loading">Loading your videos...</div>';

  const {data,error}=await client
    .from("videos")
    .select("id,title,category,description,created_at,video_path,video_url,poster_url,published")
    .order("created_at",{ascending:false});

  if(error){
    console.error("ADMIN LOAD ERROR:",error);
    $("items").innerHTML=`<div class="loading error-box">Database error: ${esc(error.message||"Unknown error")}<br><small>Please refresh the page.</small></div>`;
    return;
  }

  allVideos=Array.isArray(data)?data:[];
  render(allVideos);
 }catch(error){
  console.error("ADMIN LOAD EXCEPTION:",error);
  $("items").innerHTML=`<div class="loading error-box">Could not load videos: ${esc(error.message||error)}<br><small>Please refresh the page.</small></div>`;
 }
}
function render(list){
 if(!list.length){$("items").innerHTML='<div class="loading">No uploaded videos found.</div>';return;}
 $("items").innerHTML=list.map((v,i)=>`
 <div class="item">
  <span>${i+1}</span>
  <span><img class="poster-thumb" src="${esc(v.poster_url||"")}" alt=""></span>
  <span class="item-title"><b>${esc(v.title)}</b><small>${esc(v.description||"")}</small></span>
  <span><span class="pill">${v.category==="english"?"English Movies":"Desi Videos"}</span></span>
  <span><span class="pill green">${v.published===false?"Draft":"Published"}</span></span>
  <span>${formatDate(v.created_at)}</span>
  <span class="actions">
   <button class="edit-btn" onclick="openEdit('${v.id}')">✎ Edit</button>
   <button class="delete-btn" onclick="deleteVideo('${v.id}')">🗑 Delete</button>
  </span>
 </div>`).join("");
}

$("search").oninput=e=>{const q=e.target.value.trim().toLowerCase();render(allVideos.filter(v=>`${v.title||""} ${v.description||""}`.toLowerCase().includes(q)));};

function hookFile(button,input,nameEl){$(button).onclick=()=>$(input).click();$(input).onchange=()=>{const f=$(input).files[0];$(nameEl).textContent=f?f.name:"No file chosen";};}
// Choose File: use a separate media input so Android can open its image/video picker.
// Browse: keep the existing browser/file picker input unchanged.
$("choosePoster").onclick=()=>$("posterGallery").click();
$("posterGallery").onchange=()=>{
 const f=$("posterGallery").files[0];
 if(!f)return;
 const dt=new DataTransfer();dt.items.add(f);$("poster").files=dt.files;
 $("posterName").textContent=f.name;
 $("posterPreview").src=URL.createObjectURL(f);
 $("posterPreview").style.display="block";
};
$("chooseVideo").onclick=()=>$("videoGallery").click();
$("videoGallery").onchange=()=>{
 const f=$("videoGallery").files[0];
 if(!f)return;
 const dt=new DataTransfer();dt.items.add(f);$("video").files=dt.files;
 $("videoName").textContent=f.name;
};
// Browse buttons — unchanged behavior.
hookFile("browsePoster","poster","posterName");
hookFile("browseVideo","video","videoName");
$("poster").onchange=()=>{const f=$("poster").files[0];$("posterName").textContent=f?f.name:"No file chosen";if(f){$("posterPreview").src=URL.createObjectURL(f);$("posterPreview").style.display="block";}};

function formatBytes(bytes){if(!bytes)return"";let n=bytes,u=["B","KB","MB","GB"],i=0;while(n>=1024&&i<3){n/=1024;i++;}return`${n.toFixed(i?1:0)} ${u[i]}`;}
function progress(p,loaded,total){$("uploadProgress").hidden=false;$("uploadProgressBar").style.width=`${Math.min(100,p)}%`;$("uploadProgressText").textContent=`Uploading ${Math.round(p)}%`;$("uploadProgressSize").textContent=total?`${formatBytes(loaded)} / ${formatBytes(total)}`:"";}
async function uploadFile(bucket,path,file,token,cb){return new Promise((resolve,reject)=>{const x=new XMLHttpRequest();x.open("POST",`${window.DOT_VIDEO_SUPABASE.url}/storage/v1/object/${bucket}/${encodeURIComponent(path).replace(/%2F/g,"/")}`);x.setRequestHeader("apikey",window.DOT_VIDEO_SUPABASE.publishableKey);x.setRequestHeader("Authorization",`Bearer ${token}`);x.setRequestHeader("x-upsert","false");x.setRequestHeader("Content-Type",file.type||"application/octet-stream");x.upload.onprogress=e=>e.lengthComputable&&cb(e.loaded,e.total);x.onload=()=>x.status>=200&&x.status<300?resolve():reject(new Error(`Upload failed (${x.status})`));x.onerror=()=>reject(new Error("Network error while uploading."));x.send(file);});}

$("save").onclick=async()=>{
 const t=$("title").value.trim(),pf=$("poster").files[0],vf=$("video").files[0];
 if(!t||!vf){$("msg").textContent="Title and video are required.";return;}
 $("save").disabled=true;
 try{
  const {data:s,error:se}=await client.auth.getSession();if(se||!s.session)throw new Error("Admin session expired.");
  const token=s.session.access_token,stamp=Date.now(),total=vf.size+(pf?.size||0),vp=`${stamp}-${safe(vf.name)}`;
  await uploadFile("videos",vp,vf,token,(l)=>progress(l/total*100,l,total));
  let pp="",pu="";
  if(pf){pp=`${stamp}-${safe(pf.name)}`;await uploadFile("posters",pp,pf,token,(l)=>progress((vf.size+l)/total*100,vf.size+l,total));pu=client.storage.from("posters").getPublicUrl(pp).data.publicUrl;}
  const vu=client.storage.from("videos").getPublicUrl(vp).data.publicUrl;
  const {error}=await client.from("videos").insert({title:t,category:$("category").value,description:$("description").value.trim(),video_path:vp,video_url:vu,poster_url:pu,published:$("publish").checked});
  if(error)throw error;
  $("uploadProgressText").textContent="Upload 100%";$("uploadProgressBar").style.width="100%";$("msg").textContent="Uploaded successfully.";
  $("title").value="";$("description").value="";$("poster").value="";$("video").value="";$("posterName").textContent="No file chosen";$("videoName").textContent="No file chosen";$("posterPreview").style.display="none";
  await load();
 }catch(e){console.error(e);$("msg").textContent=e.message||"Upload failed.";}finally{$("save").disabled=false;}
};

window.openEdit=id=>{const v=allVideos.find(x=>x.id===id);if(!v)return;$("editModal").hidden=false;$("editModal").dataset.id=id;$("editTitle").value=v.title||"";$("editCategory").value=v.category||"desi";$("editDescription").value=v.description||"";$("editPoster").value="";$("editVideo").value="";$("editMsg").textContent="";};
$("closeEdit").onclick=()=>{$("editModal").hidden=true;};
$("saveEdit").onclick=async()=>{
 const id=$("editModal").dataset.id,v=allVideos.find(x=>x.id===id);if(!v)return;
 $("saveEdit").disabled=true;
 try{
  const {data:s,error:se}=await client.auth.getSession();if(se||!s.session)throw new Error("Admin session expired.");
  const token=s.session.access_token,update={title:$("editTitle").value.trim(),category:$("editCategory").value,description:$("editDescription").value.trim()};
  const pf=$("editPoster").files[0],vf=$("editVideo").files[0],stamp=Date.now();
  if(pf){const p=`${stamp}-${safe(pf.name)}`;await uploadFile("posters",p,pf,token,()=>{});update.poster_url=client.storage.from("posters").getPublicUrl(p).data.publicUrl;}
  if(vf){const p=`${stamp}-${safe(vf.name)}`;await uploadFile("videos",p,vf,token,()=>{});update.video_path=p;update.video_url=client.storage.from("videos").getPublicUrl(p).data.publicUrl;}
  const {error}=await client.from("videos").update(update).eq("id",id);if(error)throw error;
  $("editMsg").textContent="Saved successfully.";await load();setTimeout(()=>$("editModal").hidden=true,500);
 }catch(e){$("editMsg").textContent=e.message||"Update failed.";}finally{$("saveEdit").disabled=false;}
};

window.deleteVideo=async id=>{
 const v=allVideos.find(x=>x.id===id);if(!v||!confirm(`Delete "${v.title}"?\n\nThis will remove the video from the website.`))return;
 try{
  const {error}=await client.from("videos").delete().eq("id",id);if(error)throw error;
  const vp=v.video_path||getStoragePath(v.video_url,"videos"),pp=getStoragePath(v.poster_url,"posters");
  if(vp)await client.storage.from("videos").remove([vp]);if(pp)await client.storage.from("posters").remove([pp]);
  await load();$("msg").textContent="Deleted successfully.";
 }catch(e){$("msg").textContent="Delete failed: "+(e.message||e);}
};

$("logout").onclick=async()=>{await client.auth.signOut();location.href="Admin Login.html";};
guard();

