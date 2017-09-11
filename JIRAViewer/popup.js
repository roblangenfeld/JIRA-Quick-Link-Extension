/* jslint white: true, browser: true*/
/* global localStorage, document, XMLHttpRequest
 */

var readyStatus = 'Your JIRAs';

/**
 * Retrieves the JIRA data and passes it into the displayJIRAS function.
 *
 * @param {function(Object, Object)} displayJIRAS - A callback function is called if data has successfully been retrieved.
 * @param {function(String)} errorCallback - An error callback function that is called if anything went wrong.
 */
function getData(displayJIRAS, errorCallback) {
  "use strict";

  if (localStorage.darkMode === "true") {
    document.getElementsByTagName("body")[0].className += "dark";
  }

  var jira_servers = localStorage.jira_servers;
  JSON.parse(jira_servers).forEach(function (jira_server) {
    if (jira_server.jira_tags.length && jira_server.jira_url && jira_server.jira_user) {
      var searchUrl = jira_server.jira_url,
      user = jira_server.jira_user,
      x = new XMLHttpRequest();
      if (searchUrl === null || searchUrl.length === 0) {
        errorCallback('Please add a valid jira server in the options.');
        return;
      } else {
        if (user === null || user.length === 0) {
          errorCallback('Please speficy a valid username in the options');
          return;
        } else {
          searchUrl = searchUrl + '/rest/api/2/search?jql=';
          if (jira_server.jira_project) {
            searchUrl += `project=${jira_server.jira_project}%20AND%20`;
          }
          if (!jira_server.jira_tags) {
            searchUrl += `assignee=${user}`;
          } else {
            searchUrl += `assignee=${user}%20AND%20status%20in%20(${jira_server.jira_tags.map((jiraTag) => `"${jiraTag}"`).join('%2C%20')})`;
          }
          x.open('GET', searchUrl);
          x.responseType = 'json';
          x.onload = function () {
            // Parse and process the response
            var response = x.response;
            if (!response || !response.issues || response.issues.length === 0) {
              errorCallback('No response from ' + searchUrl);
              return;
            }
            displayJIRAS(response, jira_server);
          };
          x.onerror = function () {
            errorCallback('Network error.');
            return;
          };
          x.send();
        }
      }
    }
  });
}

function insertAfter(el, referenceNode) {
  "use strict";
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

/**
 * Iterates through the organizedJIRAList to see if the passed in JIRA is in the list.
 *
 * @param {Array.<JIRA>} organizedJIRAList - An array of {@link JIRA} to search through.
 * @param {object} jira - The jira to look for.
 *
 * @returns {boolean} True if found, false if not.
 */
function isParentJIRAAlreadyInOrganizedJIRAs(organizedJIRAList, jira) {
  for (var i = 0; i < organizedJIRAList.length; i++) {
    if (organizedJIRAList[i].getData().id == jira.id) {
      return true;
    }
  }
  return false;
}

/**
 * Organizes the passed in jiras into a parent heirarchy where each jira is grouped under a parent.
 *
 * @param {object} jiras - The jiras to organize.
 *
 * @returns {Array.<JIRA>} An array of {@link JIRA} objects.
 */
function organizeJIRAsByParent(jiras) {
  var organizedJIRAList = [];
  for (var i = 0; i < jiras.length; i++) {
    if (!jiras[i].fields.parent) {
      //Since the JIRA we are on qualifies as a parent. Check if it's already been added.
      if (isParentJIRAAlreadyInOrganizedJIRAs(organizedJIRAList, jiras[i])) {
        continue;
      }
      var parentJIRA = new JIRA(jiras[i]);
      organizedJIRAList.push(parentJIRA);
    } else {
      var foundParent = false;
      for (var j = 0; j < organizedJIRAList.length; j++) {
        if (organizedJIRAList[j].getData().id == jiras[i].fields.parent.id) {
          organizedJIRAList[j].addChild(new JIRA(jiras[i]));
          foundParent = true;
          break;
        }
      }
      if (!foundParent) {
        var parentJIRA = new JIRA(jiras[i].fields.parent);
        parentJIRA.addChild(new JIRA(jiras[i]));
        organizedJIRAList.push(parentJIRA);
      }
    }
  }
  return organizedJIRAList;
}

/**
 * Displays the passed in jiras to the user
 *
 * @param {object} jiras - The jiras to display.
 * @param {object} jira_server - The jira_server settings from the options. This will be used to grab the base jira url to create links.
 */
function displayJIRAS(jiras, jira_server) {
  var organizedList = organizeJIRAsByParent(jiras.issues);
  var jiraList = document.getElementById('jira-list');
  var innerDiv,
  childNode;
  organizedList.forEach((issue) => {
    innerDiv = nodeFromIssue(issue.data, jira_server);
    jiraList.appendChild(innerDiv);
    if (localStorage.show_assigned_subtasks === "true" && issue.children.length > 0) {
      issue.children.forEach((child) => {
        childNode = nodeFromIssue(child.data, jira_server);
        childNode.className += " subTask";
        jiraList.appendChild(childNode);
      })
    }
  });
  renderStatus(readyStatus);

}

/**
 * Creates an html element for the passed in issue and jira_server.
 *
 * @param {object} jira - The jira to create a node from.
 * @param {object} jira_server - The jira_server settings from the options. This will be used to grab the base jira url to create links
 * @returns {object} An html element.
 */
function nodeFromIssue(issue, jira_server) {
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
  a.href = jira_server.jira_url + "/browse/" + issue.key;
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
  getData(displayJIRAS, errorCallback);

});
