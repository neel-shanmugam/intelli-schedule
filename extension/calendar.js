// TODO(developer): Set to client ID from the Developer Console
const CLIENT_ID = '850211610149-449f2shg2loo9o5p4eqsnpoglhpaho42.apps.googleusercontent.com';
const REDIRECT_URL = chrome.identity.getRedirectURL('provider_cb');
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy'
];

function handleAuthClick() {
  chrome.identity.getAuthToken({interactive: true, 'scopes': SCOPES }, token => {
    if(chrome.runtime.lastError){
      console.log(chrome.runtime.lastError.message);
      return;
    }
    document.getElementById('authorize_button').textContent = 'Refresh';
    document.getElementById('signout_button').style.display = 'block';
    listUpcomingEvents(token);
  });
}

document.addEventListener('DOMContentLoaded', function () {
    var authButton = document.getElementById('authorize_button');

    authButton.addEventListener('click', function () {
        chrome.identity.getAuthToken({ 'interactive': true, 'scopes': SCOPES}, function(token) {
            if (chrome.runtime.lastError) {
                alert(chrome.runtime.lastError.message);
            } 
        });
    });
});

function handleSignoutClick() {
  chrome.identity.getAuthToken({ 'interactive': false, 'scopes': SCOPES }, function(current_token) {
    if (!chrome.runtime.lastError && current_token) {

      chrome.identity.removeCachedAuthToken({ token: current_token }, function() {});
      fetch(`https://accounts.google.com/o/oauth2/revoke?token=${current_token}`);
      
    }
    document.getElementById('authorize_button').textContent = 'Authorize';
    document.getElementById('signout_button').style.display = 'none';
  });
}

document.getElementById('authorize_button').addEventListener('click', handleAuthClick);
document.getElementById('signout_button').addEventListener('click', handleSignoutClick);

function listUpcomingEvents(token) {
  fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=${(new Date()).toISOString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    let events = data.items;
    if (events.length > 0) {
      for (i = 0; i < events.length; i++) {
        let event = events[i];
        let when = event.start.dateTime;
        if (!when) {
          when = event.start.date;
        }
      }
    } else {
      alert('No upcoming events found.');
    }
  })
  .catch(error => console.error('Error:', error));
}

