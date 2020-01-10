'use strict';
/* jslint white: true, browser: true*/

function loadJIRAs() {
  const jira_servers = JSON.parse(localStorage.jira_servers || '[]');
  try {
    const servers = jira_servers.map(jira_server => new JIRAServer(jira_server));
    return servers;
  } catch (e) {
    // console.error(e);
    return [];
  }
}

const update = async () => {
  let count = 0;
  const servers = loadJIRAs();
  for (let server of servers) {
    await server.loadIssues();
    server.issues.forEach(issue => {
      count++;
      if (localStorage.show_assigned_subtasks === 'true') {
        issue.children.forEach(child => {
          count++;
        });
      }
    });
  }
  
  chrome.browserAction.setBadgeBackgroundColor({
    color: [0, 0, 0, 0],
  });
  chrome.browserAction.setBadgeText({
    text: `${count}`,
  });
};

setInterval(update, 60000);
update();
