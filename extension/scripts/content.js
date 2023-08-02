document.addEventListener("click", () => {
  console.log('Document clicked');
  chrome.runtime.sendMessage({ action: "openPopup" });
  loadTasks();
});

const taskInput = document.getElementById("task-input");
const timeInput = document.getElementById("time-input");
const deadlineInput = document.getElementById("deadline-input");
const addButton = document.getElementById("add-button");
const taskList = document.getElementById("task-list");

addButton.addEventListener("click", addTask);

taskInput.addEventListener("keypress", function (event) {
  if (event.keyCode === 13) {
    addTask();
  }
});

document.addEventListener("DOMContentLoaded", loadTasks);

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 0, 0);

  // Pad the month and date with leading zeros if required
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0'); // months are 0-based in JS
  const date = String(tomorrow.getDate()).padStart(2, '0');

  // Pad the hours and minutes with leading zeros if required
  const hours = String(tomorrow.getHours()).padStart(2, '0');
  const minutes = String(tomorrow.getMinutes()).padStart(2, '0');

  // Construct the datetime-local input format YYYY-MM-DDTHH:mm
  return `${tomorrow.getFullYear()}-${month}-${date}T${hours}:${minutes}`;
}

function addTask() {
  const task = taskInput.value.trim();
  const time = timeInput.value.trim();
  const deadline = deadlineInput.value.trim();

  if (isNaN(parseFloat(time))) {
    console.log("Please enter a valid number for the estimated time."); 
    return;
  }

  if (task !== "" && time !== "" && deadline !== "") {
    console.log('Preparing to add task');
    const listItem = createTaskItem(task, time, deadline);
    
    const taskData = {task, time, deadline};
    console.log('Task data:', taskData);

    chrome.runtime.sendMessage({ action: "scheduleTask", data: taskData }, function(response) {
      if (chrome.runtime.lastError) {
        console.log('Message send error:', chrome.runtime.lastError);
      } else {
        console.log('Sent message, received response:', response);
        
        if (response.status === 'scheduled') {
          // The task could be scheduled before the deadline
          taskList.appendChild(listItem);
          taskInput.value = "";
          timeInput.value = "";
          deadlineInput.value = getTomorrowDate(); 
          saveTask(taskData);
        } else if (response.status === 'deadline') {
          // The task could not be scheduled before the deadline
          alert("The task cannot be scheduled before the deadline.");
        }
      }
    });
  }
}


function saveTask(task) {
  console.log('Saving task:', task);
  chrome.storage.local.get({ tasks: [] }, function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting tasks:', chrome.runtime.lastError);
    } else {
      const tasks = result.tasks;
      tasks.push(task);
      chrome.storage.local.set({ tasks: tasks }, function() {
        if (chrome.runtime.lastError) {
          console.log('Error saving tasks:', chrome.runtime.lastError);
        } else {
          console.log('Task saved:', task);
        }
      });
    }
  });
}


function loadTasks() {
  console.log('Loading tasks');
  chrome.storage.local.get({ tasks: [] }, function (result) {
    if (chrome.runtime.lastError) {
      console.log('Error getting tasks:', chrome.runtime.lastError);
    } else {
      const tasks = result.tasks;
      console.log('Retrieved tasks:', tasks);
      tasks.forEach(function (task) {
        console.log('Loading task:', task);
        const listItem = createTaskItem(task.task, task.time, task.deadline);
        taskList.appendChild(listItem);
      });
    }

    // Set initial deadline value to tomorrow's date and current time
    if (deadlineInput) {
      deadlineInput.value = getTomorrowDate();
    }
  });
}
function createTaskItem(task, time, deadline) {
  console.log('Creating task item');

  const listItem = document.createElement("li");
  const taskText = document.createElement("span");
  taskText.textContent = `${task} (Time: ${parseFloat(time)} ${parseFloat(time) == 1 ? 'hour' : 'hours'}, Deadline: ${new Date(deadline).toLocaleString()})`;
  listItem.appendChild(taskText);

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "x";
  deleteButton.className = "delete-button";
  deleteButton.addEventListener("click", function () {
    deleteTask(listItem, task);
  });

  listItem.appendChild(deleteButton);

  listItem.addEventListener("mouseenter", function () {
    deleteButton.style.display = "inline";
  });

  listItem.addEventListener("mouseleave", function () {
    deleteButton.style.display = "none";
  });

  return listItem;
}

function deleteTask(taskItem, taskName) {
  console.log('Deleting task');
  taskItem.remove();
  chrome.storage.local.get({ tasks: [] }, function (result) {
    const tasks = result.tasks;
    const index = tasks.findIndex(task => task.task === taskName);
    if (index !== -1) {
      tasks.splice(index, 1);
      chrome.storage.local.set({ tasks: tasks });
    }
  });
}
