# JIRA-Quick-Link-Extension

## To install:
1. Go to chrome://extensions
2. Enable Developer mode
3. Click "Load unpacked extensions..." and then select the JIRAViewer folder.
4. Once the extension is loaded, turn off Developer mode.

## Initial setup:
1. Go to the options page for the extension and click "New JIRA Server"
2. Fill in the fields. You will not be required to save. The plugin automatically saves after every keystroke.

## Usage
Simply click the button and get a complete list of jiras!


## Building for Firefox

Install web-ex https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext

Run the following commands from the same folder the manifest.json is in:
```
web-ext build
web-ext sign --api-key=$AMO_JWT_ISSUER --api-secret=$AMO_JWT_SECRET
```
Where $AMO_JWT_ISSUER is your mozzila JWT issuer key and $AMO_JWT_SECRET is the JWT secret key

The plugin will be outputed into /web-ext-artifacts. You can now directly install this into Firefox.

#### WARNING
If the plugin has already been released please make sure to update the version in the manifest.json first before running the build and sign.

#### Reminder for Robert
After you do the initial release build, make sure to checkin the .web-extension-id!!!
