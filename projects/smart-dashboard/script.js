const clockEl = document.getElementById("clock");
const dateEl = document.getElementById("date");
const themeToggle = document.getElementById("themeToggle");
const greetingEl = document.getElementById("greeting");

const todoInput = document.getElementById("todoInput");
const addTodoBtn = document.getElementById("addTodoBtn");
const todoList = document.getElementById("todoList");

const notesArea = document.getElementById("notesArea");
const weatherContent = document.getElementById("weatherContent");
const dashboard = document.querySelector(".dashboard");

// CLOCK
function updateClock() {
  const now = new Date();

  clockEl.textContent = now.toLocaleTimeString();
  dateEl.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// GREETING
function updateGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    greetingEl.textContent = "Good morning.";
  } else if (hour < 18) {
    greetingEl.textContent = "Good afternoon.";
  } else {
    greetingEl.textContent = "Good evening.";
  }
}

// THEME
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  } else {
    themeToggle.textContent = "🌙";
  }
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");

  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// TODOS
let todos = JSON.parse(localStorage.getItem("todos")) || [];

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function renderTodos() {
  todoList.innerHTML = "";

  if (todos.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No tasks yet.";
    emptyMessage.classList.add("empty-state");
    todoList.appendChild(emptyMessage);
    return;
  }

  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.classList.add("todo-item");

    const leftDiv = document.createElement("div");
    leftDiv.classList.add("todo-left");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;

    checkbox.addEventListener("change", () => {
      todos[index].completed = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const span = document.createElement("span");
    span.textContent = todo.text;

    if (todo.completed) {
      span.classList.add("completed");
    }

    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(span);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");

    deleteBtn.addEventListener("click", () => {
      todos.splice(index, 1);
      saveTodos();
      renderTodos();
    });

    li.appendChild(leftDiv);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });
}

function addTodo() {
  const task = todoInput.value.trim();

  if (task === "") return;

  todos.push({
    text: task,
    completed: false
  });

  saveTodos();
  renderTodos();
  todoInput.value = "";
}

addTodoBtn.addEventListener("click", addTodo);

todoInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTodo();
  }
});

// NOTES
function loadNotes() {
  const savedNotes = localStorage.getItem("notes");
  if (savedNotes) {
    notesArea.value = savedNotes;
  }
}

notesArea.addEventListener("input", () => {
  localStorage.setItem("notes", notesArea.value);
});

// WEATHER
async function getWeather() {
  try {
    weatherContent.innerHTML = "<p>Loading weather...</p>";

    const lat = 43.6532;
    const lon = -79.3832;

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
    );

    if (!response.ok) {
      throw new Error("Weather request failed");
    }

    const data = await response.json();
    const current = data.current;
    const weatherText = getWeatherDescription(current.weather_code);

    weatherContent.innerHTML = `
      <div class="weather-info">
        <p class="weather-temp">${current.temperature_2m}°C</p>
        <p class="weather-desc">${weatherText}</p>
        <p class="weather-wind">Wind: ${current.wind_speed_10m} km/h</p>
        <p class="weather-location">Toronto</p>
      </div>
    `;
  } catch (error) {
    weatherContent.innerHTML = "<p>Unable to load weather.</p>";
    console.error(error);
  }
}

function getWeatherDescription(code) {
  const weatherCodes = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm"
  };

  return weatherCodes[code] || "Unknown weather";
}

// DRAG AND DROP
let draggedCard = null;

function saveLayout() {
  const order = [...document.querySelectorAll(".card")].map((card) => {
    if (card.classList.contains("clock-card")) return "clock-card";
    if (card.classList.contains("todo-card")) return "todo-card";
    if (card.classList.contains("notes-card")) return "notes-card";
    if (card.classList.contains("weather-card")) return "weather-card";
    return "";
  });

  localStorage.setItem("layout", JSON.stringify(order));
}

function loadLayout() {
  const savedLayout = JSON.parse(localStorage.getItem("layout"));
  if (!savedLayout) return;

  savedLayout.forEach((className) => {
    const card = document.querySelector(`.${className}`);
    if (card) {
      dashboard.appendChild(card);
    }
  });
}

function setupDragAndDrop() {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    card.addEventListener("dragstart", () => {
      draggedCard = card;
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      saveLayout();
    });
  });

  dashboard.addEventListener("dragover", (e) => {
    e.preventDefault();

    const afterElement = getDragAfterElement(dashboard, e.clientX);
    const dragging = document.querySelector(".dragging");

    if (!dragging) return;

    if (afterElement == null) {
      dashboard.appendChild(dragging);
    } else {
      dashboard.insertBefore(dragging, afterElement);
    }
  });
}

function getDragAfterElement(container, x) {
  const elements = [...container.querySelectorAll(".card:not(.dragging)")];

  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// INIT
setInterval(updateClock, 1000);
updateClock();
updateGreeting();
loadTheme();
loadNotes();
renderTodos();
getWeather();
loadLayout();
setupDragAndDrop();