// Ordered page registry & prototype links loaded directly by canvas.html (file:// & http:// safe)
window.CANVAS_CONFIG = {
  title: "Project Prototype",
  snap: 20
};

window.CANVAS_MANIFEST = [
  {
    id: "home",
    title: "Home",
    file: "./pages/01-home.html",
    width: 390,
    height: 844,
    device: "mobile",
    links: [{ to: "detail", label: "Open" }],
    x: 0,
    y: 0
  },
  {
    id: "detail",
    title: "Detail",
    file: "./pages/02-detail.html",
    width: 390,
    height: 844,
    device: "mobile",
    links: [{ to: "home", label: "Back" }],
    x: 486,
    y: 0
  }
];
