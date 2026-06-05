const express = require('express');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Page HTML ---
const HTML_PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SIGMET Generator GMMM</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#080c14;color:#e2e8f0;height:100vh;overflow:hidden}
header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#0d1117;border-bottom:1px solid rgba(51,65,85,0.5)}
.logo{display:flex;align-items:center;gap:12px}
.icon{width:32px;height:32px;border-radius:8px;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.2);display:flex;align-items:center;justify-content:center}
h1{font-size:14px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase}
.sub{font-size:10px;color:#64748b}
.badge{font-size:10px;padding:2px 8px;border:1px solid #334155;border-radius:4px;color:#94a3b8}
.container{display:flex;height:calc(100vh - 60px)}
#map{flex:1;background:#0a0e1a;position:relative}
.sidebar{width:360px;background:#0d1117;border-left:1px solid rgba(51,65,85,0.5);padding:16px;overflow-y:auto;font-size:12px}
.section{background:#161b22;border:1px solid rgba(51,65,85,0.5);border-radius:6px;padding:12px;margin-bottom:12px}
.title{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px}
.row{display:flex;gap:8px;margin-bottom:8px}
.col{flex:1}
label{display:block;font-size:11px;color:#64748b;margin-bottom:4px}
input,select{width:100%;padding:6px 8px;background:#161b22;border:1px solid #334155;color:#e2e8f0;border-radius:4px;font-size:12px;font-family:inherit}
input:focus,select:focus{outline:none;border-color:#0e7490}
button{padding:8px 16px;background:#0e7490;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:500}
button:hover{background:#0891b2}
button.active{background:rgba(14,165,233,0.2);color:#22d3ee;border:1px solid rgba(14,165,233,0.3)}
textarea{width:100%;min-height:140px;background:#161b22;border:1px solid #334155;color:#e2e8f0;border-radius:4px;padding:8px;font-family:monospace;font-size:11px;line-height:1.6;resize:none}
.empty{min-height:140px;border:1px dashed #334155;border-radius:4px;display:flex;align-items:center;justify-content:center;text-align:center;color:#64748b;font-size:11px}
.lightning{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.dot{width:8px;height:8px;border-radius:50%}
.dot.yellow{background:#fbbf24}
.dot.red{background:#ef4444}
.status{font-size:10px;color:#64748b}
.sigmet-num{display:flex;gap:6px;align-items:center;margin-bottom:12px;padding:8px;background:rgba(14,165,233,0.05);border:1px solid rgba(14,165,233,0.2);border-radius:6px}
.sigmet-num span{padding:4px 8px;background:#0f1525;border:1px solid #334155;border-radius:4px;color:#22d3ee;font-family:monospace;font-size:12px;font-weight:bold}
.controls{position:absolute;top:16px;left:16px;z-index:1000;display:flex;gap:8px}
.legend{position:absolute;bottom:16px;left:16px;background:rgba(15,21,37,0.9);border:1px solid #334155;border-radius:8px;padding:12px;font-size:11px;z-index:1000}
.legend-item{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.legend-line{width:16px;height:0;border-top:2px dashed #38bdf8}
.footer{text-align:center;padding:8px;font-size:10px;color:#475569;border-top:1px solid rgba(51,65,85,0.5)}
.info{color:#f59e0b;font-size:10px;margin-top:4px}
</style>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</head>
<body>
<header>
  <div class="logo">
    <div class="icon">✈</div>
    <div>
      <h1>SIGMET Generator</h1>
      <div class="sub">Casablanca FIR — GMMM</div>
    </div>
  </div>
  <div style="display:flex;gap:8px">
    <span class="badge" style="display:flex;align-items:center;gap:6px"><span class="dot" style="background:#22c55e;width:6px;height:6px"></span> En ligne</span>
    <span class="badge">GMMM</span>
  </div>
</header>

<div class="container">
  <div id="map">
    <div class="controls">
      <button id="drawBtn" onclick="toggleDraw()">✏️ Dessiner</button>
      <button id="clearBtn" onclick="clearDraw()" style="display:none;background:#7f1d1d;color:#fca5a5">🗑 Effacer</button>
   
