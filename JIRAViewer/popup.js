/* jslint white: true, browser: true*/
/* global localStorage, document, XMLHttpRequest, fetch */

var readyStatus = 'Your JIRAs';

/**
 * Retrieves the JIRA data and passes it into the displayJIRAS function.
 *
 * @param {function(Object, Object)} displayJIRAS - A callback function is called if data has successfully been retrieved.
 * @param {function(String)} errorCallback - An error callback function that is called if anything went wrong.
 */
async function getData(displayJiras, errorCallback) {
  if (localStorage.darkMode === "true") {
    document.querySelector('body').classList.add('dark');
  }

  displayJiras();
}

function insertAfter(el, referenceNode) {
  referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

/**
 * Displays the current status in the header as well as ad the options link to the footer.
 *
 * @param {string} statusText - The text to display as the status.
 */
function renderStatus(statusText) {
  "use strict";

  var status = document.getElementById('status');
  status.textContent = statusText;

  if (!document.contains(document.getElementById("options"))) {
	var optionsLink = document.createElement('a');
    optionsLink.onclick = function openOptions() {
      browser.tabs.create({
        'url': "/options.html"
      });
    };
    optionsLink.id = "options";
    optionsLink.textContent = "Options";
    var footer = document.getElementsByTagName("FOOTER")[0];
    footer.appendChild(optionsLink);
  }
  
  if (statusText === readyStatus) {
    browser.browserAction.setBadgeBackgroundColor({
      color: [0, 0, 0, 0]
    });
    browser.browserAction.setBadgeText({
      text: "" + document.getElementById("jira-list").childElementCount
    });
  } else {
    browser.browserAction.setBadgeText({
      text: "X"
    });
    browser.browserAction.setBadgeBackgroundColor({
      color: "#f11"
    });
  }
}

function loadJIRAs() {
  const jira_servers = localStorage.jira_servers;
  try {
    return JSON.parse(jira_servers).map(jira_server => new JIRAServer(jira_server));
  } catch (e) {
    return [];
  }
}

/**
 * Displays the passed in jiras to the user
 */
async function displayJiras() {
  const jiraList = document.getElementById('jira-list');
  // pull cached data
  const servers = loadJIRAs();

  const nodes = [];
  servers.forEach((server) => {
    server.issues.forEach((issue) => {
      const innerDiv = nodeFromIssue(issue.data, server.url);
      nodes.push(innerDiv);
      if (localStorage.show_assigned_subtasks === 'true') {
        issue.children.forEach((child) => {
          childNode = nodeFromIssue(child.data, server.url);
          childNode.className += " subTask";
          nodes.push(childNode);
        });
      }
    });
  });
  jiraList.append(...nodes);
  renderStatus(readyStatus);
}

/**
 * Creates an html element for the passed in issue and jira_server.
 *
 * @param {object} jira - The jira to create a node from.
 * @param {object} jira_server - The jira_server settings from the options. This will be used to grab the base jira url to create links
 * @returns {object} An html element.
 */
function nodeFromIssue(issue, jira_url) {
  var i,
  issue,
  innerDiv,
  a,
  title,
  linkText,
  priority,
  priorityUrl,
  prioritySVGUse,
  typ,
  status;
  innerDiv = document.createElement('div');
  innerDiv.className = 'jira-block';

  priorityUrl = issue.fields.priority.iconUrl;

  if (/\.svg/ig.test(priorityUrl)) {
    //it's an svg
    priority = document.createElement('img');
    priority.src = issue.fields.priority.iconUrl;
    priority.setAttribute('height', "16px");
    priority.setAttribute('width', '16px');

    // <object data="image.svg" type="image/svg+xml"></object>
  } else {
    //whatever else
    priority = document.createElement('img');
    priority.src = issue.fields.priority.iconUrl;
  }

  priority.className = 'priority'

    status = document.createElement('span');
  status.textContent = issue.fields.status.name;
  status.className += "tag";

  switch (issue.fields.status.name.toLowerCase()) {
  case "open":
  case "reopened":
    status.className += " open";
    break;
  case "closed":
    status.className += " reopened";
    break;
  case "in progress":
    status.className += " inProgress";
    break;
  default:
    break;
  }

  a = document.createElement('a');
  title = issue.key + ' ' + issue.fields.summary;
  linkText = document.createElement('span');
  linkText.textContent = title;
  linkText.className += "title";
  a.appendChild(priority);
  a.appendChild(status);
  a.appendChild(linkText);
  a.target = "_blank";
  a.title = title;
  a.href = jira_url + "/browse/" + issue.key;
  innerDiv.appendChild(a);
  return innerDiv;
}

/**
 * Displays the passed in error status in the header.
 *
 * @param {string} errorMessage - The text to display as the error.
 */
function errorCallback(errorMessage) {
  "use strict";

  renderStatus('Cannot display jiras. ' + errorMessage);
}

document.addEventListener('DOMContentLoaded', function () {
  "use strict";

  renderStatus('Getting Jiras');
  getData(displayJiras, errorCallback);
});
