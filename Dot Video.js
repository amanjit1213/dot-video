const menu = document.getElementById("menu");
const menuBtn = document.getElementById("menuBtn");
const closeMenu = document.getElementById("closeMenu");
menuBtn.addEventListener("click", () => menu.classList.remove("hidden"));
closeMenu.addEventListener("click", () => menu.classList.add("hidden"));
document.getElementById("desiBtn").onclick = () => location.href = "Desi Videos.html";
document.getElementById("englishBtn").onclick = () => location.href = "English Movies.html";
document.querySelectorAll("[data-go]").forEach(btn => btn.onclick = () => location.href = btn.dataset.go);
