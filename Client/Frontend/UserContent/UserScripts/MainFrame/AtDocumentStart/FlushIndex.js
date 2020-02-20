import React from "react";
import ReactDOM from "react-dom";

const FlushIndex = () => {
    return <div id="divSupported">
        Gutscheine verfügbar:<br/>
        <button id="buttonSupported">Robins holen</button>
    </div>
        ;
};
const classNameFlush = "___flush_css";

function initializeStyleSheet() {
    var noImageCSS = "#divSupported{position:fixed;top:0px;width:100%;background-color:#000;color:#fff;text-align:center;size:25px;height:90px;z-index:9999999999;padding:10px;}#buttonSupported{-moz-box-shadow: 0px 1px 0px 0px #fff6af;    -webkit-box-shadow: 0px 1px 0px 0px #fff6af;    box-shadow: 0px 1px 0px 0px #fff6af;    background:-webkit-gradient(linear, left top, left bottom, color-stop(0.05, #ffec64), color-stop(1, #ffab23));    background:-moz-linear-gradient(top, #ffec64 5%, #ffab23 100%);    background:-webkit-linear-gradient(top, #ffec64 5%, #ffab23 100%);    background:-o-linear-gradient(top, #ffec64 5%, #ffab23 100%);    background:-ms-linear-gradient(top, #ffec64 5%, #ffab23 100%);    background:linear-gradient(to bottom, #ffec64 5%, #ffab23 100%);    filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffec64', endColorstr='#ffab23',GradientType=0);    background-color:#ffec64;    -moz-border-radius:6px;    -webkit-border-radius:6px;    border-radius:6px;    border:1px solid #ffaa22;    display:inline-block;    cursor:pointer;    color:#333333;    font-family:Arial;    font-size:15px;    font-weight:bold;    padding:6px 24px;    text-decoration:none;    text-shadow:0px 1px 0px #ffee66;z-index:9999999999999999999;margin-top:10px;}";
    var newCss = document.getElementById(classNameFlush);
    if (!newCss) {
        var cssStyle = document.createElement("style");
        cssStyle.type = "text/css";
        cssStyle.id = classNameFlush;
        cssStyle.appendChild(document.createTextNode(noImageCSS));
        document.documentElement.appendChild(cssStyle);
    } else {
        newCss.innerHTML = noImageCSS;
    }
}

window.addEventListener("DOMContentLoaded", function (event) {

    initializeStyleSheet();

    let elm = document.createElement("div");
    document.documentElement.appendChild(elm);
    ReactDOM.render(<FlushIndex />, elm);


});