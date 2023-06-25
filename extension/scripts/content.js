
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

// Function to add a task
function addTask() {
  const task = taskInput.value;
  if (task.trim() !== "") {
    const listItem = document.createElement("li");
    listItem.textContent = task;
    taskList.appendChild(listItem);
    taskInput.value = "";
  }
}
