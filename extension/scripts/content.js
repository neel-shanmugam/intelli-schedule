document.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "openPopup" });
});

// HTML elements
const taskInput = document.getElementById("task-input");
const timeInput = document.getElementById("time-input");
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
  const time = timeInput.value.trim();
  if (isNaN(time)) {
    alert("Please enter a valid number for the estimated time.");
    return;
  }
  if (task !== "" && time !== "") {
    const listItem = createTaskItem(task, time);
    taskList.appendChild(listItem);
    taskInput.value = "";
    timeInput.value = "";

    saveTask({task, time});
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
      const listItem = createTaskItem(task.task, task.time);
      taskList.appendChild(listItem);
    });
  });
}

// Function to create a task item
function createTaskItem(task, time) {
  const listItem = document.createElement("li");
  const taskText = document.createElement("span");
  taskText.textContent = `${task} (Time: ${time} ${time == 1 ? 'hour' : 'hours'})`;
  listItem.appendChild(taskText);

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "x";
  deleteButton.className = "delete-button";
  deleteButton.addEventListener("click", function () {
    deleteTask(listItem, task);
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
function deleteTask(taskItem, taskName) {
  taskItem.remove();
  chrome.storage.sync.get({ tasks: [] }, function (result) {
    const tasks = result.tasks;
    const index = tasks.findIndex(task => task.task === taskName);
    if (index !== -1) {
      tasks.splice(index, 1);
      chrome.storage.sync.set({ tasks: tasks });
    }
  });
}
