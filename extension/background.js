let googleAuthToken = '';

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "openPopup",
      title: "Open Popup",
      contexts: ["action"]
    });
  });
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openPopup") {
      chrome.windows.create({
        type: "popup",
        url: chrome.runtime.getURL("popup.html"),
        width: 800,
        height: 600
      });
    }
  });
  
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "scheduleTask") {
      scheduleTask(request.data, googleAuthToken);
    }
  });
  
  chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
    if (!chrome.runtime.lastError) {
      googleAuthToken = token;
    }
  });
  
  function scheduleTask(taskData, token) {
    if (!token) {
      console.error('Token not available');
      return;
    }
    listFreeSlots(taskData, token);
  }
  
  function listFreeSlots(taskData, token) {
    let now = new Date();
    let nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
  
    let body = {
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      items: [
        { id: 'primary' }
      ]
    };
  
    fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
      if (data.calendars && data.calendars.primary) {
        let busyTimes = data.calendars.primary.busy;
        let taskDuration = parseInt(taskData.time) * 60 * 60 * 1000; 
        for (let i = 0; i < busyTimes.length - 1; i++) {
          let freeSlotStart = new Date(busyTimes[i].end);
          let freeSlotEnd = new Date(busyTimes[i+1].start);
          let freeSlotDuration = freeSlotEnd - freeSlotStart;
  
          if (freeSlotDuration >= taskDuration) {
            let event = {
              summary: taskData.task,
              start: {
                dateTime: freeSlotStart.toISOString()
              },
              end: {
                dateTime: (new Date(freeSlotStart.getTime() + taskDuration)).toISOString()
              }
            };
  
            createEvent(event, token);
            break;
          }
        }
      } else {
        console.log('Data does not contain expected properties', data);
      }
    })
    .catch(error => console.error('Error:', error));
  }  
  
  function createEvent(event, token) {
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })
    .then(response => response.json())
    .then(data => {
      if(data.error) {
        console.error('Error:', data.error.message);
      } else {
        console.log('Event created:', data);
      }
    })
    .catch(error => console.error('Error:', error));
  }
  
    