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
    console.log('Received message:', request);
    if (request.action === "scheduleTask") {
      console.log('Scheduling task with token:', googleAuthToken);
      scheduleTask(request.data, googleAuthToken);
      sendResponse({ status: 'received' });
    }
  });
  
  chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
    if (!chrome.runtime.lastError) {
      googleAuthToken = token;
      console.log('Token received:', token);
    } else{
      console.log('Get token error:', chrome.runtime.lastError.message);
    }
  });
  
  function scheduleTask(taskData, token) {
    console.log("Scheduling task", taskData, 'with token', token);
    if (!token) {
      console.error('Token not available');
      return;
    }
    listFreeSlots(taskData, token);
  }
  
  function roundToQuarterHour(date) {
    let minutes = date.getMinutes();
    let remainder = minutes % 15;
    date.setMinutes(minutes - remainder);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }

  // function listCalendarIds(token) {
  //   console.log('Listing Calendar IDs with token:', token);
  //   let calendarIds = [];
  
  //   // return a new Promise
  //   return new Promise((resolve, reject) => {
  //     fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Accept': 'application/json'
  //       }
  //     })
  //     .then(response => response.json())
  //     .then(data => {
  //       // data.items.forEach(item => {
  //       //   // Only push to the array if the id does not contain 'group'
  //       //   if (!item.id.includes('import')) {
  //       //     calendarIds.push(item.id);
  //       //   }
  //       // });
  //       console.log('Calendar IDs:', calendarIds);
  //       resolve(calendarIds); // resolve promise with calendarIds
  //     })
  //     .catch(error => {
  //       console.error('Error:', error);
  //       reject(error); // reject promise with error
  //     });
  //   });
  // }

  function listFreeSlots(taskData, token) {
    console.log("Listing free slots with token:", token);
  
    let now = new Date();
    let deadline = new Date(taskData.deadline);
  
    let body = {
      timeMin: now.toISOString(),
      timeMax: deadline.toISOString(),
      items: [
        { id: 'primary' }
      ]
    };
  
    console.log('Body for freeBusy request:', body);
  
    fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(response => {
      console.log('Response from freeBusy:', response);
      return response.json();
    })
    .then(data => {
      console.log('Data from freeBusy:', data);
  
      if (data.calendars && data.calendars.primary) {
        let busyTimes = data.calendars.primary.busy;
        let taskDuration = parseFloat(taskData.time) * 60 * 60 * 1000;
  
        let freeSlots = [];
        let freeSlotStart, freeSlotEnd;
  
        for (let i = 0; i <= busyTimes.length; i++) {
          if(i == 0) {
            freeSlotStart = new Date(body.timeMin);
            freeSlotEnd = busyTimes[i] ? new Date(busyTimes[i].start) : new Date(body.timeMax);
          } else if(i == busyTimes.length) {
            freeSlotStart = new Date(busyTimes[i-1].end);
            freeSlotEnd = new Date(body.timeMax);
          } else {
            freeSlotStart = new Date(busyTimes[i-1].end);
            freeSlotEnd = new Date(busyTimes[i].start);
          }
          
          if (freeSlotStart.getHours() < 9) {
            freeSlotStart.setHours(9, 0, 0, 0);
          }
  
          if (freeSlotEnd.getHours() >= 21) {
            freeSlotEnd.setHours(21, 0, 0, 0);
          }
  
          // Checking if the free slot spans multiple days
          if(freeSlotStart.getDate() !== freeSlotEnd.getDate()) {
            let endOfFirstDay = new Date(freeSlotStart);
            endOfFirstDay.setHours(21, 0, 0, 0);
  
            let startOfSecondDay = new Date(freeSlotEnd);
            startOfSecondDay.setHours(9, 0, 0, 0);
  
            // Adding two free slots
            freeSlots.push({start: freeSlotStart, end: endOfFirstDay});
            freeSlots.push({start: startOfSecondDay, end: freeSlotEnd});
          } else {
            freeSlots.push({start: freeSlotStart, end: freeSlotEnd});
          }
        }
  
        for (let freeSlot of freeSlots) {
          let freeSlotStart = freeSlot.start;
          let freeSlotEnd = freeSlot.end;
  
          console.log(`Checking free slot from ${freeSlotStart.toISOString()} to ${freeSlotEnd.toISOString()}`);
  
          let freeSlotDuration = freeSlotEnd - freeSlotStart;
  
          if (freeSlotDuration >= taskDuration) {
            let currentTime = new Date();
            let eventStart = roundToQuarterHour(new Date(freeSlotStart));
  
            console.log(`Initial event start time: ${eventStart}`);
  
            if (eventStart < currentTime) {
              console.log('Event start time is in the past, moving to the future.');
              eventStart.setMinutes(eventStart.getMinutes() + 15);
            }
  
            console.log(`Event start time after adjustment: ${eventStart}`);
  
            if (eventStart.getTime() + taskDuration > freeSlotEnd.getTime() || eventStart.getTime() < freeSlotStart.getTime()) {
              console.log('Rounded start time is not suitable');
              continue;
            }
  
            let eventEnd = new Date(eventStart.getTime() + taskDuration);
  
            console.log(`Event end time: ${eventEnd}`);
  
            if (eventEnd > deadline) {
              console.log('Rounded end time exceeds the deadline');
              continue;
            }
  
            let event = {
              summary: taskData.task,
              start: {
                dateTime: eventStart.toISOString()
              },
              end: {
                dateTime: eventEnd.toISOString()
              }
            };
  
            console.log('Creating event:', event);
            createEvent(event, token);
            return {status: 'scheduled'};
          }
        }
  
        console.log('No suitable free slot found for task before the deadline.');
        return {status: 'deadline'};
      } else {
        console.log('Data does not contain expected properties', data);
      }
    })
    .catch(error => console.error('Error:', error));
  }
  
  
  

  
  function createEvent(event, token) {
    console.log('Creating event with token:', token);
    
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })
    .then(response => {
      console.log('Response from createEvent:', response);
      return response.json();
    })
    .then(data => {
      console.log('Data from createEvent:', data);
      
      if(data.error) {
        console.error('Error:', data.error.message);
      } else {
        console.log('Event created:', data);
      }
    })
    .catch(error => console.error('Error:', error));
  }
