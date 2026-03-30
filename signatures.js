/* ================================================
   XOS — Document Signing Engine
   Typed/drawn signatures, stamps, audit trail
   ================================================ */

// Request signature modal (admin)
function requestSignatureModal(projectId) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'sig-request-modal';
  overlay.innerHTML =
    '<div class="modal-card" style="max-width:500px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<h3><i class="fas fa-signature" style="color:var(--navy);margin-right:8px;"></i>Request Signature</h3>' +
        '<button class="btn-icon" onclick="document.getElementById(\'sig-request-modal\').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<div class="form-group">' +
          '<label class="form-label">Document Name</label>' +
          '<input id="sig-doc-name" class="form-input-styled" placeholder="e.g. CCDC 2 — Stipulated Price Contract">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Upload Document (PDF)</label>' +
          '<input type="file" id="sig-doc-file" class="form-input-styled" accept=".pdf" style="padding:8px;">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Signer Name</label>' +
          '<input id="sig-signer-name" class="form-input-styled" placeholder="e.g. TDL Group">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Signer Email</label>' +
          '<input id="sig-signer-email" class="form-input-styled" type="email" placeholder="e.g. ops@tdlgroup.com">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Notes / Instructions</label>' +
          '<textarea id="sig-notes" class="form-input-styled" rows="2" placeholder="What is this document and why does it need to be signed?"></textarea>' +
        '</div>' +
        '<button class="btn btn-accent btn-full btn-lg" onclick="submitSignatureRequest(\'' + projectId + '\')"><i class="fas fa-paper-plane"></i> Send Signature Request</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

function submitSignatureRequest(projectId) {
  var name = document.getElementById('sig-doc-name').value.trim();
  if (!name) { alert('Enter a document name.'); return; }
  var signerName = document.getElementById('sig-signer-name').value.trim();
  if (!signerName) { alert('Enter the signer name.'); return; }

  if (!DEMO_SIGNATURES[projectId]) DEMO_SIGNATURES[projectId] = [];
  DEMO_SIGNATURES[projectId].push({
    id: nextSigId(),
    doc_id: null,
    doc_name: name,
    status: 'pending',
    requested_by: currentUser.full_name,
    requested_at: new Date().toISOString().split('T')[0],
    signer_name: signerName,
    signer_email: document.getElementById('sig-signer-email').value,
    signed_by: null, signed_at: null,
    signature_type: null, signature_text: null,
    ip_address: null, doc_hash: null,
    notes: document.getElementById('sig-notes').value,
  });

  document.getElementById('sig-request-modal').remove();
  switchProjectTab('documents');
}

// Client signing flow
function openSigningFlow(projectId, sigId) {
  var sigs = DEMO_SIGNATURES[projectId] || [];
  var sig = sigs.find(function(s) { return s.id === sigId; });
  if (!sig) return;

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'signing-flow';
  overlay.style.padding = '0';
  overlay.innerHTML =
    '<div style="width:100%;height:100%;display:flex;flex-direction:column;background:var(--card-bg);">' +
      // Header
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid var(--card-border);background:#fff;">' +
        '<div>' +
          '<div style="font-size:16px;font-weight:700;color:var(--navy);">Sign Document</div>' +
          '<div class="text-muted" style="font-size:12px;">' + sig.doc_name + '</div>' +
        '</div>' +
        '<button class="btn btn-outline btn-sm" onclick="document.getElementById(\'signing-flow\').remove()"><i class="fas fa-times"></i> Close</button>' +
      '</div>' +

      // Document preview area
      '<div style="flex:1;overflow:auto;background:#e5e7eb;padding:20px;">' +
        '<div style="max-width:700px;margin:0 auto;background:#fff;border:1px solid var(--card-border);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">' +
          // Simulated document
          '<div style="padding:40px;">' +
            '<div style="text-align:center;margin-bottom:32px;">' +
              '<div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">Document for Signature</div>' +
              '<div style="font-size:20px;font-weight:700;color:var(--navy);margin-top:8px;">' + sig.doc_name + '</div>' +
            '</div>' +

            // Document body placeholder
            '<div style="border:1px solid var(--card-border);border-radius:8px;padding:24px;margin-bottom:24px;background:var(--page-bg);">' +
              '<div style="font-size:12px;color:var(--text-muted);line-height:1.8;">' +
                '<p style="margin-bottom:12px;">This document constitutes a binding agreement between the parties identified herein for the construction works described below.</p>' +
                '<p style="margin-bottom:12px;"><strong>Project:</strong> ' + (function() { var p = DEMO_PROJECTS.find(function(x){ return x.id === projectId; }); return p ? p.name : ''; })() + '</p>' +
                '<p style="margin-bottom:12px;"><strong>Owner:</strong> ' + sig.signer_name + '</p>' +
                '<p style="margin-bottom:12px;"><strong>Contractor:</strong> Trivex Group Corp, Burlington, ON</p>' +
                (sig.notes ? '<p style="margin-bottom:12px;"><strong>Notes:</strong> ' + sig.notes + '</p>' : '') +
                '<p style="margin-bottom:12px;color:var(--text-light);">[Full document content would appear here when a PDF is uploaded. In production, the actual PDF renders here via PDF.js.]</p>' +
              '</div>' +
            '</div>' +

            // Signature block
            '<div style="border:2px dashed var(--orange);border-radius:8px;padding:20px;margin-bottom:20px;" id="signature-block">' +
              '<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--orange);margin-bottom:12px;"><i class="fas fa-signature" style="margin-right:6px;"></i>Your Signature</div>' +

              // Signature type toggle
              '<div style="display:flex;gap:8px;margin-bottom:16px;">' +
                '<button class="btn btn-accent btn-sm" id="sig-type-typed" onclick="switchSigType(\'typed\')"><i class="fas fa-keyboard"></i> Type</button>' +
                '<button class="btn btn-outline btn-sm" id="sig-type-drawn" onclick="switchSigType(\'drawn\')"><i class="fas fa-pen"></i> Draw</button>' +
              '</div>' +

              // Typed signature
              '<div id="sig-typed-area">' +
                '<input id="sig-typed-input" class="form-input-styled" placeholder="Type your full name or title..." style="font-size:18px;font-family:\'Brush Script MT\',cursive;padding:12px 16px;" oninput="updateTypedPreview()">' +
                '<div id="sig-typed-preview" style="margin-top:12px;padding:16px;border:1px solid var(--card-border);border-radius:8px;background:#fff;min-height:60px;display:flex;align-items:center;justify-content:center;">' +
                  '<span class="text-muted" style="font-size:13px;">Signature preview appears here</span>' +
                '</div>' +
              '</div>' +

              // Drawn signature (canvas)
              '<div id="sig-drawn-area" style="display:none;">' +
                '<canvas id="sig-canvas" width="600" height="150" style="width:100%;border:1px solid var(--card-border);border-radius:8px;background:#fff;cursor:crosshair;touch-action:none;"></canvas>' +
                '<div style="display:flex;justify-content:flex-end;margin-top:6px;">' +
                  '<button class="btn btn-outline btn-sm" onclick="clearSignatureCanvas()"><i class="fas fa-eraser"></i> Clear</button>' +
                '</div>' +
              '</div>' +
            '</div>' +

            // Legal text
            '<div style="background:var(--page-bg);border-radius:8px;padding:16px;margin-bottom:20px;font-size:11px;color:var(--text-muted);line-height:1.6;">' +
              '<strong>By signing below, you confirm that:</strong><br>' +
              '1. You have read and understood the document above.<br>' +
              '2. You are authorized to sign on behalf of ' + sig.signer_name + '.<br>' +
              '3. This electronic signature constitutes your legal agreement to the terms described.<br>' +
              '4. A record of this signature including your name, date, time, and IP address will be permanently stored.' +
            '</div>' +

            // Sign buttons
            '<div style="display:flex;gap:10px;">' +
              '<button class="btn btn-accent btn-full btn-lg" onclick="executeSignature(\'' + projectId + '\',\'' + sigId + '\')"><i class="fas fa-pen-nib"></i> Sign Document</button>' +
              '<button class="btn btn-outline btn-full" onclick="declineSignature(\'' + projectId + '\',\'' + sigId + '\')"><i class="fas fa-times"></i> Decline</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  initSignatureCanvas();
}

var _sigType = 'typed';
var _sigCanvasDrawing = false;
var _sigCanvasCtx = null;

function switchSigType(type) {
  _sigType = type;
  document.getElementById('sig-typed-area').style.display = type === 'typed' ? 'block' : 'none';
  document.getElementById('sig-drawn-area').style.display = type === 'drawn' ? 'block' : 'none';
  document.getElementById('sig-type-typed').className = type === 'typed' ? 'btn btn-accent btn-sm' : 'btn btn-outline btn-sm';
  document.getElementById('sig-type-drawn').className = type === 'drawn' ? 'btn btn-accent btn-sm' : 'btn btn-outline btn-sm';
}

function updateTypedPreview() {
  var input = document.getElementById('sig-typed-input');
  var preview = document.getElementById('sig-typed-preview');
  if (input.value.trim()) {
    preview.innerHTML = '<div style="font-family:\'Brush Script MT\',\'Segoe Script\',cursive;font-size:28px;color:var(--navy);letter-spacing:1px;">' + input.value + '</div>';
  } else {
    preview.innerHTML = '<span class="text-muted" style="font-size:13px;">Signature preview appears here</span>';
  }
}

function initSignatureCanvas() {
  setTimeout(function() {
    var canvas = document.getElementById('sig-canvas');
    if (!canvas) return;
    _sigCanvasCtx = canvas.getContext('2d');
    _sigCanvasCtx.strokeStyle = '#1a2744';
    _sigCanvasCtx.lineWidth = 2.5;
    _sigCanvasCtx.lineCap = 'round';
    _sigCanvasCtx.lineJoin = 'round';

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var cx = e.touches ? e.touches[0].clientX : e.clientX;
      var cy = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (cx - rect.left) * (canvas.width / rect.width), y: (cy - rect.top) * (canvas.height / rect.height) };
    }

    canvas.addEventListener('mousedown', function(e) {
      _sigCanvasDrawing = true;
      var p = getPos(e);
      _sigCanvasCtx.beginPath();
      _sigCanvasCtx.moveTo(p.x, p.y);
    });
    canvas.addEventListener('mousemove', function(e) {
      if (!_sigCanvasDrawing) return;
      var p = getPos(e);
      _sigCanvasCtx.lineTo(p.x, p.y);
      _sigCanvasCtx.stroke();
    });
    canvas.addEventListener('mouseup', function() { _sigCanvasDrawing = false; });
    canvas.addEventListener('mouseleave', function() { _sigCanvasDrawing = false; });

    canvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
      _sigCanvasDrawing = true;
      var p = getPos(e);
      _sigCanvasCtx.beginPath();
      _sigCanvasCtx.moveTo(p.x, p.y);
    });
    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      if (!_sigCanvasDrawing) return;
      var p = getPos(e);
      _sigCanvasCtx.lineTo(p.x, p.y);
      _sigCanvasCtx.stroke();
    });
    canvas.addEventListener('touchend', function() { _sigCanvasDrawing = false; });
  }, 100);
}

function clearSignatureCanvas() {
  var canvas = document.getElementById('sig-canvas');
  if (canvas && _sigCanvasCtx) {
    _sigCanvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function executeSignature(projectId, sigId) {
  var sigs = DEMO_SIGNATURES[projectId] || [];
  var sig = sigs.find(function(s) { return s.id === sigId; });
  if (!sig) return;

  var sigText = '';
  if (_sigType === 'typed') {
    var input = document.getElementById('sig-typed-input');
    sigText = input ? input.value.trim() : '';
    if (!sigText) { alert('Please type your name to sign.'); return; }
  } else {
    // Check if canvas has any drawing
    var canvas = document.getElementById('sig-canvas');
    if (canvas) {
      var ctx = canvas.getContext('2d');
      var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      var hasContent = false;
      for (var i = 3; i < data.length; i += 4) {
        if (data[i] > 0) { hasContent = true; break; }
      }
      if (!hasContent) { alert('Please draw your signature on the canvas.'); return; }
      sigText = '[Drawn signature]';
    }
  }

  // Record the signature
  sig.status = 'signed';
  sig.signed_by = currentUser.full_name;
  sig.signed_at = new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  sig.signature_type = _sigType;
  sig.signature_text = sigText;
  sig.ip_address = '192.168.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255);
  sig.doc_hash = Array.from({length: 16}, function() { return Math.floor(Math.random()*16).toString(16); }).join('');

  // Show confirmation
  document.getElementById('signing-flow').remove();
  showSignatureConfirmation(sig, projectId);
}

function showSignatureConfirmation(sig, projectId) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'sig-confirmation';
  overlay.innerHTML =
    '<div class="modal-card" style="max-width:500px;text-align:center;">' +
      '<div style="margin-bottom:20px;">' +
        '<i class="fas fa-check-circle" style="font-size:56px;color:var(--green);margin-bottom:12px;display:block;"></i>' +
        '<h2 style="font-size:20px;font-weight:700;color:var(--navy);margin-bottom:4px;">Document Signed</h2>' +
        '<p class="text-muted" style="font-size:13px;">Your signature has been recorded and cannot be altered.</p>' +
      '</div>' +

      '<div style="background:var(--green-bg);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:16px;margin-bottom:20px;text-align:left;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<i class="fas fa-stamp" style="color:var(--green);font-size:16px;"></i>' +
          '<span style="font-size:14px;font-weight:700;color:var(--green);">Signature Certificate</span>' +
        '</div>' +
        '<div style="font-size:12px;line-height:1.8;color:var(--text);">' +
          '<div><strong>Document:</strong> ' + sig.doc_name + '</div>' +
          '<div><strong>Signed by:</strong> ' + sig.signed_by + '</div>' +
          '<div><strong>Date & Time:</strong> ' + sig.signed_at + ' EST</div>' +
          '<div><strong>Signature:</strong> ' + (sig.signature_type === 'typed' ? sig.signature_text : 'Drawn signature') + '</div>' +
          '<div><strong>IP Address:</strong> ' + sig.ip_address + '</div>' +
          '<div><strong>Document Hash:</strong> ' + sig.doc_hash + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-navy btn-full" onclick="generateSignedPDF(\'' + projectId + '\',\'' + sig.id + '\')"><i class="fas fa-file-pdf"></i> Download Signed PDF</button>' +
        '<button class="btn btn-accent btn-full" onclick="document.getElementById(\'sig-confirmation\').remove(); switchPortalTab(\'documents\');">Done</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

function declineSignature(projectId, sigId) {
  var sigs = DEMO_SIGNATURES[projectId] || [];
  var sig = sigs.find(function(s) { return s.id === sigId; });
  if (!sig) return;

  if (!confirm('Are you sure you want to decline signing this document? Trivex will be notified.')) return;

  sig.status = 'declined';
  sig.signed_at = new Date().toISOString().split('T')[0];
  document.getElementById('signing-flow').remove();
  switchPortalTab('documents');
}

function viewSignedDocument(sigId, projectId) {
  var sigs = DEMO_SIGNATURES[projectId] || [];
  var sig = sigs.find(function(s) { return s.id === sigId; });
  if (!sig || sig.status !== 'signed') return;

  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'view-signed-doc';
  overlay.innerHTML =
    '<div class="modal-card" style="max-width:560px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<h3>' + sig.doc_name + '</h3>' +
        '<button class="btn-icon" onclick="document.getElementById(\'view-signed-doc\').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>' +
      '</div>' +

      // Signed stamp
      '<div style="background:var(--green-bg);border:2px solid var(--green);border-radius:8px;padding:20px;margin-bottom:20px;text-align:center;">' +
        '<div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--green);font-weight:600;margin-bottom:8px;">Digitally Signed</div>' +
        '<div style="font-family:\'Brush Script MT\',\'Segoe Script\',cursive;font-size:32px;color:var(--navy);margin-bottom:8px;">' + (sig.signature_type === 'typed' ? sig.signature_text : sig.signed_by) + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);">' + sig.signed_by + ' · ' + sig.signed_at + ' EST</div>' +
      '</div>' +

      // Audit trail
      '<div style="font-size:12px;line-height:1.8;margin-bottom:20px;">' +
        '<div class="section-title" style="margin-bottom:8px;">Audit Trail</div>' +
        '<div style="padding:8px 12px;background:var(--page-bg);border-radius:var(--radius);">' +
          '<div><span class="text-muted">Document:</span> ' + sig.doc_name + '</div>' +
          '<div><span class="text-muted">Requested by:</span> ' + sig.requested_by + ' on ' + sig.requested_at + '</div>' +
          '<div><span class="text-muted">Signed by:</span> ' + sig.signed_by + '</div>' +
          '<div><span class="text-muted">Signed at:</span> ' + sig.signed_at + ' EST</div>' +
          '<div><span class="text-muted">Method:</span> ' + (sig.signature_type === 'typed' ? 'Typed signature' : 'Drawn signature') + '</div>' +
          '<div><span class="text-muted">IP Address:</span> ' + sig.ip_address + '</div>' +
          '<div><span class="text-muted">Document Hash:</span> <code style="font-size:11px;">' + sig.doc_hash + '</code></div>' +
        '</div>' +
      '</div>' +

      '<button class="btn btn-navy btn-full" onclick="generateSignedPDF(\'' + projectId + '\',\'' + sig.id + '\')"><i class="fas fa-file-pdf"></i> Download Signed PDF</button>' +
    '</div>';
  document.body.appendChild(overlay);
}

function generateSignedPDF(projectId, sigId) {
  var sigs = DEMO_SIGNATURES[projectId] || [];
  var sig = sigs.find(function(s) { return s.id === sigId; });
  if (!sig) return;

  var proj = DEMO_PROJECTS.find(function(p) { return p.id === projectId; });

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + sig.doc_name + ' — Signed</title>' +
    '<style>' +
      'body{font-family:"Helvetica Neue",Arial,sans-serif;font-size:12px;color:#1f2937;margin:0;padding:40px;}' +
      '.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:16px;border-bottom:3px solid #1a2744;}' +
      '.header h1{font-size:24px;font-weight:800;color:#1a2744;margin:0;}' +
      '.header p{font-size:11px;color:#6b7280;margin:2px 0;}' +
      '.doc-title{text-align:center;margin-bottom:32px;}' +
      '.doc-title h2{font-size:18px;color:#1a2744;margin:0 0 8px;}' +
      '.doc-body{border:1px solid #e5e7eb;border-radius:8px;padding:24px;margin-bottom:32px;background:#f9fafb;font-size:12px;line-height:1.8;}' +
      '.sig-block{border:2px solid #22c55e;border-radius:8px;padding:24px;margin-bottom:24px;text-align:center;background:#f0fdf4;}' +
      '.sig-name{font-family:"Brush Script MT","Segoe Script",cursive;font-size:36px;color:#1a2744;margin:12px 0;}' +
      '.sig-details{font-size:11px;color:#6b7280;}' +
      '.audit{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:11px;line-height:1.8;margin-bottom:24px;}' +
      '.audit strong{color:#1a2744;}' +
      '.footer{text-align:center;font-size:10px;color:#9ca3af;margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;}' +
      '@media print{body{padding:20px;}}' +
    '</style></head><body>' +

    '<div class="header">' +
      '<div><h1>TRIVEX GROUP CORP</h1><p>Commercial Construction · Franchise Fit-Outs</p><p>Burlington, ON · trivexgroup.com</p></div>' +
      '<div style="text-align:right;"><div style="font-size:16px;font-weight:700;color:#22c55e;">SIGNED</div><p>Date: ' + sig.signed_at + '</p></div>' +
    '</div>' +

    '<div class="doc-title"><h2>' + sig.doc_name + '</h2></div>' +

    '<div class="doc-body">' +
      '<p><strong>Project:</strong> ' + (proj ? proj.name : '') + '</p>' +
      '<p><strong>Owner:</strong> ' + sig.signer_name + '</p>' +
      '<p><strong>Contractor:</strong> Trivex Group Corp, Burlington, ON</p>' +
      (sig.notes ? '<p><strong>Description:</strong> ' + sig.notes + '</p>' : '') +
      '<p style="color:#9ca3af;margin-top:16px;">[Full document content would be embedded here in production.]</p>' +
    '</div>' +

    '<div class="sig-block">' +
      '<div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#22c55e;font-weight:600;">Digitally Signed</div>' +
      '<div class="sig-name">' + (sig.signature_type === 'typed' ? sig.signature_text : sig.signed_by) + '</div>' +
      '<div class="sig-details">' + sig.signed_by + ' · ' + sig.signed_at + ' EST</div>' +
    '</div>' +

    '<div class="audit">' +
      '<strong>Signature Audit Trail</strong><br>' +
      'Document: ' + sig.doc_name + '<br>' +
      'Requested by: ' + sig.requested_by + ' on ' + sig.requested_at + '<br>' +
      'Signed by: ' + sig.signed_by + '<br>' +
      'Date & Time: ' + sig.signed_at + ' EST<br>' +
      'Method: ' + (sig.signature_type === 'typed' ? 'Typed signature' : 'Drawn signature') + '<br>' +
      'IP Address: ' + sig.ip_address + '<br>' +
      'Document Hash: ' + sig.doc_hash + '<br>' +
      'This signature record is permanent and cannot be altered.' +
    '</div>' +

    '<div class="footer">Trivex Group Corp · Burlington, ON · Signed via XOS · This document is a legal record of digital signature.</div>' +
  '</body></html>';

  var w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.onload = function() { w.print(); };
}
