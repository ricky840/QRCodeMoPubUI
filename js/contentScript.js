chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (!message.type.match("draw-event")) { 
    return;
  }

  const creative = message.creative;
  var wrapperDiv = document.createElement("div");
  var qrcodeDiv = document.createElement("div");
  var msgDiv = document.createElement("div");
  msgDiv.innerHTML = "Scan me :)";
  msgDiv.style.marginTop = "5px";
  msgDiv.style.fontSize = "1.3em";
  msgDiv.style.fontWeight = "bold";

  // Determine the format and create load URL
  const loadUrl = [
    `mopub://load?adUnitId=${message.adUnitId}`,
    `format=${message.adFormatName}`,
    `name=${message.adFormatName + "_" + new Date().getTime()}`
  ].join("&");

  var qrcode = new QRCode(qrcodeDiv, loadUrl);
  wrapperDiv.className = "qrcode-wrapper";
  wrapperDiv.append(qrcodeDiv);
  wrapperDiv.append(msgDiv);
  wrapperDiv.style.textAlign = "-webkit-center";
  wrapperDiv.style.marginTop = "0.8em";

  if (message.targetPage == "MPXCreativeReview") {
    // MPX Creative Review Page
    $(".Panel-body").remove(".qrcode-wrapper");
    $(".Panel-body").append(wrapperDiv);
  } else if (message.targetPage == "MoAnalytics") {
    // MoAnalytics
    // $(".segment-bubble .bubble-container .segment-bubble-content").parent().remove(".qrcode-wrapper");
    // $(".segment-bubble .bubble-container .segment-bubble-content").parent().append(wrapperDiv);
  } else {
    // Creative Preview
    $(".TabPanelGroup").parent().remove(".qrcode-wrapper");
    $(".TabPanelGroup").parent().append(wrapperDiv);
  }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (!message.type.match("heartbeat-event")) { 
    return;
  }
  sendResponse({ result: true });
  return true;
});
