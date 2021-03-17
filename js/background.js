"use strict";

// Fire when ext installed
chrome.runtime.onInstalled.addListener(function(event) {
  initStorage();

  if (event.reason === 'install') {
    chrome.storage.local.set({freshInstalled: true, extUpdated: false}, function() {
      console.log("Extension Installed");
    });
  }
  if (event.reason === 'update') {
    chrome.storage.local.set({extUpdated: true, freshInstalled: false}, function() {
      console.log("Extension Updated");
    })
  }
});

// Fires when the ext starts(very first time) or when user clicks refresh button in extension page
chrome.runtime.onStartup.addListener(function() {
  initStorage();
});

// Fires when user clicks disable / enable button in extension page
window.onload = function() {
  initStorage();
};

function initStorage() {
  console.log("Initializing Storage");
}

//------------------------------------------------------------------------------------------
const BANNER = "60a9b21598df491f87bcaca1457e19d3";
const FULLSCREEN = "d3a2be8f333940c2b4d1ad30e3fdd673";
const MREC = "e0275a339042483c94022b3cdac2c37f"
const NATIVE = "3827643914e14c5b8779c69d736c44e4";
const REWARD = "2058e96bf5ec407ab2715c28dbe6b5cb";

// chrome.webRequest.onBeforeRequest.addListener(function(details) {
  
//   }, 
//   {
//     urls: [
//       "https://app.mopub.com/web-client/api/dsps/creative?id=*&creativeId=*"
//     ]
//   }, 
//   ["responseHeaders", "extraHeaders"]
// );

// Returns a creative object
async function getCreative(url) {
  return new Promise(async (resolve, reject) => {
    const request = { url: url };
    try {
      let result = await http.getRequest(request);
      if (result.statusCode == 200) {
        const creative = JSON.parse(result.responseText);
        resolve(creative);
      } else {
        throw `Invalid Response Code - ${result.statusCode}`;
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Update the bidder with creative
async function updateRickyBidder(creative) {
  return new Promise(async (resolve, reject) => {
    const request = { 
      url: "http://bidder2.datswatsup.com/hackweek_update",
      data: JSON.stringify(creative),
      headers: {"Content-Type": "application/json"}
    };
    try {
      let result = await http.postRequest(request);
      if (result.statusCode == 200) {
        console.log(result.responseText);
        resolve();
      } else {
        throw `Invalid Response Code - ${result.statusCode}`;
      }
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
}


function attachQRCode(details) {
  console.log("getting creative info");

  const url = new URL(details.url);
  const creativeId = url.searchParams.get('creativeId');
  const dspId = url.searchParams.get('id');
  const requestUrl = `https://app.mopub.com/web-client/api/dsps/creative?creativeId=${creativeId}&id=${dspId}`;

  getCreative(requestUrl).then((creative) => {
    const adformat = identifyFormat(creative);
    creative.format = adformat;
    let adUnitId = "";
    let adFormatName = "";

    if (adformat == "banner") {
      adUnitId = BANNER;
      adFormatName = "Banner";
    } else if (adformat == "mrec") {
      adUnitId = MREC;
      adFormatName = "MediumRectangle";
    } else if (adformat == "fullscreen_video") {
      adUnitId = FULLSCREEN;
      adFormatName = "Interstitial";
    } else if (adformat == "fullscreen_html") {
      adUnitId = FULLSCREEN;
      adFormatName = "Interstitial";
    } else if (adformat == "native") {
      adUnitId = NATIVE;
      adFormatName = "Native";
    } else {
      adUnitId = BANNER; // couldn't identify format, use banner then
      adFormatName = "Banner";
    }

    updateRickyBidder(creative).then(() => {
      chrome.tabs.get(details.tabId, function(tab) {
        const currentUrl = tab.url;
        let targetPage;
        if (currentUrl.includes("https://app.mopub.com/staff/creative-preview")) {
          // Creative Preview Page
          targetPage = "CreativePreview";
        } else if (currentUrl.includes("https://analytics.mopub.com")) {
          targetPage = "MoAnalytics";
        } else {
          // MPX Creative Review Page
          targetPage = "MPXCreativeReview";
        }
        chrome.tabs.sendMessage(details.tabId, { 
          type: "draw-event", 
          creative: creative,
          adUnitId: adUnitId,
          adFormatName: adFormatName,
          targetPage: targetPage
        }); 
      });
    });
  }).catch((error) => {
    console.log(error);
  });
}

chrome.webRequest.onCompleted.addListener(function(details) {
    chrome.tabs.sendMessage(details.tabId, { type: "heartbeat-event" }, function(response) {
      if (response !== undefined && response.result === true) {
        console.log("ContentScript already exists");
        attachQRCode(details);
        return;
      }
      console.log("Injecting content script");
      injectContentScript(details.tabId, details.frameId).then(function() {
        attachQRCode(details);
      });
    });
  }, 
  {
    urls: [
      "https://app.mopub.com/web-client/api/dsps/creative?id=*&creativeId=*"
    ]
  }, 
  ["responseHeaders", "extraHeaders"]
);

function injectContentScript(tabId, frameId) {
  return new Promise(function(resolve, reject) {
    chrome.tabs.executeScript(tabId, { file: "lib/qrcode.js", allFrames: true }, function() {
      chrome.tabs.executeScript(tabId, { file: "lib/jquery-3.4.1.min.js", allFrames: true }, function() {
        chrome.tabs.executeScript(tabId, { file: "js/contentScript.js", allFrames: true }, function() {
          console.log("ContentScript injected!");
          resolve();
        });
      });
    });
  });
}

const BANNER_SIZES = [
  "300x50",
  "320x50",
  "468x60",
  "728x90",
  "970x90",
  "970x250",
];

const FULLSCREEN_SIZES = [
  "320x480",
  "320x568",
  "300x600",
  "360x640",
  "768x1024",
  "300x1050",
  "480x320",
  "568x320",
  "640x360",
  "1024x768",
];

const MREC_SIZES = [
  "300x250",
  "336x280"
];

const NATIVE_SIZES = [
  "0x0"
];

function identifyFormat(creative) {
  const creativeSize = `${creative.width}x${creative.height}`;

  let creativeFormat = null;

  if (BANNER_SIZES.includes(creativeSize)) {
    creativeFormat = "banner";
  } else if (MREC_SIZES.includes(creativeSize)) {
    creativeFormat = "mrec";
  } else if (FULLSCREEN_SIZES.includes(creativeSize)) {
    creativeFormat = "fullscreen_temp";
  } else if (NATIVE_SIZES.includes(creativeSize)) {
    creativeFormat = "native";
  } else {
    // do nothing
  }

  if (creativeFormat == "fullscreen_temp") {
    creativeFormat = isVideoCreative(creative.body) ? "fullscreen_video" : "fullscreen_html";
  }

  return creativeFormat;
}

function isVideoCreative(markup) {
  let parser = new DOMParser();
  let xmlDoc = parser.parseFromString(markup, "text/xml");
  let vast = xmlDoc.getElementsByTagName("MediaFiles")[0];
  let vastTag = xmlDoc.getElementsByTagName("VASTAdTagURI")[0];

  if (vast != undefined && typeof vast.querySelector("MediaFile") == "object") {
    return true;
  } else if (vastTag != undefined && typeof vastTag == "object") {
    return true;
  } else {
    return false;
  }
}












