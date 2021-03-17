$(".version").html(`v${chrome.runtime.getManifest().version}`);

$(document).ready(function() {

	let html = `
	<div class="qrcode-wrapper">
	</div>
	`;
	let html2 = $.parseHTML(html);

	let div = document.createElement("div");
	let qrcode = new QRCode(div, "mopub://load?adUnitId=this_is_id");



	let div2 = document.createElement("div");

	div2.append(div);

	// $(html2).append(div);

	$("#qrcode").html(div2);

});