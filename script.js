// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile nav
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector("[data-nav]");
toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

/**
 * PROJECTS
 * category: "docs" | "embedded" | "ml" | "ui" | "web"
 * status: "shipped" | "inprogress" | "planned"
 *
 * links:
 * - github: repo url
 * - docs: documentation url (can be a PDF in /assets or a GitHub file link)
 * - report: report/case study pdf url
 * - demo: live demo url
 */
const projects = [
  {
  title: "GetOut — Emergency Evacuation Decision Support",
  tagline: "Research-driven system to improve evacuation communication, coordination, and safety.",
  category: "docs",
  status: "completed",
  tech: ["Research", "Stakeholders", "Emergency Systems", "Accessibility"],
  links: {
    github: "",
    docs: "assets/getout/brief.pdf",
    report: "assets/getout/final-report.pdf",
    demo: "getout.html"
  },
  highlights: [
    "Analyzed real disaster evacuation failures and communication breakdowns",
    "Identified gaps in existing emergency management tools and workflows",
    "Designed a system focused on accessibility, clarity, and coordination",
  ],
},
  {
  title: "LocalShare — Local Network File Sharing App",
  tagline: "A full-stack web app for sharing files across devices on the same Wi-Fi network with a clean and responsive interface.",
  category: "web",
  status: "completed",
  tech: ["Python", "HTML", "CSS", "JavaScript", "http.server"],
  links: {
    github: "https://github.com/YOUR_USERNAME/file-sharing-app",
    docs: "",
    report: "",
    demo: ""
  },
  highlights: [
    "Built a full-stack file sharing system using Python's built-in HTTP server with a custom frontend UI",
    "Implemented multi-file upload with drag-and-drop support and manual multipart/form-data parsing (Python 3.12 compatible)",
    "Designed a responsive interface with file cards, search functionality, and real-time UI interactions using vanilla JavaScript",
    "Added file management features including download, delete, and automatic duplicate filename handling",
    "Enabled seamless cross-device access by exposing the app over local network IP for mobile and desktop use",
  ],
},
  {
    title: "Smart Night-Path LED Aid",
    tagline: "Assistive path lighting concept with sensor input + PWM control.",
    category: "embedded",
    status: "inprogress",
    tech: ["C/C++", "MCU", "PWM", "ADC"],
    links: {
      github: "https://github.com/YOUR_GITHUB_USERNAME",
      docs: "",
      report: "",
      demo: "",
    },
    highlights: [
      "Signal conditioning + safe voltage ranges",
      "PWM-to-analog style control and hardware integration",
      "Focused on usability and safety constraints",
    ],
  },

  {
  title: "PulseBoard — Smart Daily Dashboard",
  tagline: "A clean and customizable dashboard that combines productivity and utility tools into one interface.",
  category: "web",
  status: "inprogress",
  tech: ["HTML", "CSS", "JavaScript", "LocalStorage", "REST API"],
  links: {
    github: "https://github.com/arushigopinath/github-portfolio",
    docs: "",
    report: "",
    demo: ""
  },
  highlights: [
    "Built a live clock and greeting system for a more personalized dashboard experience",
    "Added a to-do list and quick notes with LocalStorage persistence",
    "Integrated weather data and designed the layout for future drag-and-drop customization",
    "Ability to switch between dark and light modes"
  ],
},
  
 

  {
  title: "Shelf Scanner — AI-Inspired Book Discovery App",
  tagline: "A full-stack app that analyzes bookshelf images and user preferences to generate personalized book recommendations.",
  category: "web",
  status: "completed",
  tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "API Routes"],
  links: {
    github: "https://github.com/arushigopinath/shelf-scanner",
    docs: "",
    report: "",
    demo: ""
  },
  highlights: [
    "Built a full-stack application with image upload, form handling, and API integration using Next.js",
    "Implemented genre-based recommendation logic to simulate intelligent book suggestions without heavy AI models",
    "Designed a clean, responsive UI with loading states, confidence indicators, and reset functionality",
    "Handled real-world concerns like file validation, structured API responses, and scalable architecture for future AI integration",
  ],
},
  



  
];

// ---- UI logic ----
const gridEl = document.getElementById("projectsGrid");
const searchEl = document.getElementById("projectSearch");
const filterEl = document.getElementById("projectFilter");

function labelForCategory(c) {
  if (c === "docs") return "Docs / Research";
  if (c === "embedded") return "Embedded";
  if (c === "ml") return "ML / Data";
  if (c === "ui") return "UI / Qt";
  if (c === "web") return "Web";
  return "Project";
}

function labelForStatus(s) {
  if (s === "shipped") return "Shipped";
  if (s === "inprogress") return "In progress";
  if (s === "planned") return "Planned";
  if (s === "completed") return "Completed";
  return "";
}

function matches(project, q, category) {
  const query = (q || "").trim().toLowerCase();
  const categoryOk = category === "all" || project.category === category;

  if (!query) return categoryOk;

  const haystack = [
    project.title,
    project.tagline,
    project.category,
    project.status,
    ...(project.tech || []),
    ...(project.highlights || []),
  ]
    .join(" ")
    .toLowerCase();

  return categoryOk && haystack.includes(query);
}

function btn(label, url) {
  if (!url) return "";
  return `<a class="btn small" href="${url}" target="_blank" rel="noreferrer">${label}</a>`;
}

function projectCard(p) {
  const techChips = (p.tech || [])
    .slice(0, 7)
    .map((t) => `<span class="chip">${t}</span>`)
    .join("");

  const highlights = (p.highlights || [])
    .slice(0, 3)
    .map((h) => `<li>${h}</li>`)
    .join("");

  const statusClass = p.status ? `status ${p.status}` : "status";
  const statusLabel = labelForStatus(p.status);

  const links = p.links || {};
  const actions = [
    btn("GitHub", links.github),
    btn("Docs", links.docs),
    btn("Report", links.report),
    btn("Demo", links.demo),
  ].join("");

  return `
    <article class="project-card">
      <div class="project-top">
        <div class="project-title">
          <h3>${p.title}</h3>
          <p class="muted">${p.tagline}</p>
        </div>
        <div class="badge-row">
          <span class="badge">${labelForCategory(p.category)}</span>
          ${statusLabel ? `<span class="badge ${statusClass}">${statusLabel}</span>` : ""}
        </div>
      </div>

      <div class="chip-row">${techChips}</div>
      <ul class="project-bullets">${highlights}</ul>

      <div class="project-actions">
        ${actions || `<span class="muted small">Links coming soon</span>`}
      </div>
    </article>
  `;
}

function render() {
  const q = searchEl?.value || "";
  const category = filterEl?.value || "all";

  const visible = projects.filter((p) => matches(p, q, category));

  if (!visible.length) {
    gridEl.innerHTML = `
      <div class="empty">
        <h3>No matches</h3>
        <p class="muted">Try clearing the search or choosing “All”.</p>
      </div>
    `;
    return;
  }

  gridEl.innerHTML = visible.map(projectCard).join("");
}

searchEl?.addEventListener("input", render);
filterEl?.addEventListener("change", render);
render();