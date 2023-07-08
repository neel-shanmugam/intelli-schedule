document.addEventListener("DOMContentLoaded", function() {
  const openCalendarButton = document.getElementById("open-calendar-button");
  openCalendarButton.addEventListener("click", function() {
      chrome.runtime.sendMessage({ action: "openCalendar" });
  });
});

document.addEventListener("click", (event) => {
  if (event.target.id === "open-calendar-button") {
    chrome.runtime.sendMessage({ action: "openCalendar" });
  }
});

document.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "openPopup" });
});

// HTML elements
const taskInput = document.getElementById("task-input");
const addButton = document.getElementById("add-button");
const taskList = document.getElementById("task-list");

// Event listener for the "Add" button
addButton.addEventListener("click", addTask);

// Event listener for the "Enter" key press
taskInput.addEventListener("keypress", function (event) {
  if (event.keyCode === 13) {
    addTask();
  }
});

// Load saved tasks when the extension is opened
document.addEventListener("DOMContentLoaded", loadTasks);

// Function to add a task
function addTask() {
  const task = taskInput.value.trim();
  if (task !== "") {
    const listItem = createTaskItem(task);
    taskList.appendChild(listItem);
    taskInput.value = "";

    saveTask(task);
  }
}

// Function to save a task
function saveTask(task) {
  chrome.storage.sync.get({ tasks: [] }, function (result) {
    const tasks = result.tasks;
    tasks.push(task);
    chrome.storage.sync.set({ tasks: tasks });
  });
}

// Function to load saved tasks
function loadTasks() {
  chrome.storage.sync.get({ tasks: [] }, function (result) {
    const tasks = result.tasks;
    tasks.forEach(function (task) {
      const listItem = createTaskItem(task);
      taskList.appendChild(listItem);
    });
  });
}

// Function to create a task item
function createTaskItem(task) {
  const listItem = document.createElement("li");
  const taskText = document.createElement("span");
  taskText.textContent = task;
  listItem.appendChild(taskText);

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "x";
  deleteButton.className = "delete-button";
  deleteButton.addEventListener("click", function () {
    deleteTask(listItem);
  });

  listItem.appendChild(deleteButton);

  // Show/hide delete button on hover
  listItem.addEventListener("mouseenter", function () {
    deleteButton.style.display = "inline";
  });

  listItem.addEventListener("mouseleave", function () {
    deleteButton.style.display = "none";
  });

  return listItem;
}

// Function to delete a task
function deleteTask(taskItem) {
  taskItem.remove();
  const taskText = taskItem.querySelector("span").textContent;
  chrome.storage.sync.get({ tasks: [] }, function (result) {
    const tasks = result.tasks;
    const index = tasks.indexOf(taskText);
    if (index !== -1) {
      tasks.splice(index, 1);
      chrome.storage.sync.set({ tasks: tasks });
    }
  });
}