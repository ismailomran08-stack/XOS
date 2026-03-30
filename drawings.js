/* ================================================
   XOS — Drawing Viewer & Markup Engine
   Full interactive: drag-to-draw, resize, move, edit, delete, undo
   ================================================ */

let _selectedMarkup = null;
let _dragState = null;
let _drawStart = null;
let _undoStack = [];

function _getSurfaceCoords(e) {
  const s = document.getElementById('drawing-surface');
  if (!s) return { x: 0, y: 0 };
  const r = s.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
  const cy = e.touches ? e.touches[0].clientY : (e.changedTouches ? e.changedTouches[0].clientY : e.clientY);
  return { x: Math.round(cx - r.left), y: Math.round(cy - r.top) };
}

function openDrawingViewer(projectId, drawingId) {
  const drawings = DEMO_DRAWINGS[projectId] || [];
  const d = drawings.find(x => x.id === drawingId);
  if (!d) return;
  activeDrawingId = drawingId;
  _selectedMarkup = null;
  _undoStack = [];
  _dragState = null;
  _drawStart = null;
  const isClient = currentUser.role === 'client';
  markupColor = isClient ? '#f97316' : '#3b82f6';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'drawing-viewer';
  overlay.style.padding = '0';

  overlay.innerHTML = `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;background:var(--card-bg);">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px;border-bottom:1px solid var(--card-border);background:#fff;flex-shrink:0;flex-wrap:wrap;gap:6px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="closeDrawingViewer()"><i class="fas fa-arrow-left"></i></button>
          <div>
            <div style="font-size:14px;font-weight:700;">${d.title}</div>
            <div class="text-muted" style="font-size:11px;">${d.drawing_number} · Rev ${d.revision}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${!isClient && !d.approval ? `<button class="btn btn-accent btn-sm" onclick="requestDrawingApproval('${projectId}','${drawingId}')"><i class="fas fa-stamp"></i> Request Approval</button>` : ''}
          ${!isClient ? `<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;"><input type="checkbox" ${d.shared_with_client ? 'checked' : ''} onchange="toggleDrawingShared('${projectId}','${drawingId}',this.checked)"> Client</label>` : ''}
          <button class="btn btn-outline btn-sm" onclick="closeDrawingViewer()"><i class="fas fa-times"></i></button>
        </div>
      </div>

      <!-- Toolbar -->
      <div style="display:flex;align-items:center;gap:3px;padding:6px 12px;border-bottom:1px solid var(--card-border);background:var(--page-bg);flex-shrink:0;flex-wrap:wrap;" id="markup-toolbar">
        <button class="btn btn-accent btn-sm" onclick="setMarkupMode(null)" id="tool-select" title="Select / Move"><i class="fas fa-mouse-pointer"></i></button>
        <div style="width:1px;height:22px;background:var(--card-border);margin:0 3px;"></div>
        <button class="btn btn-outline btn-sm" onclick="setMarkupMode('rect')" id="tool-rect" title="Rectangle — drag to draw"><i class="far fa-square"></i></button>
        <button class="btn btn-outline btn-sm" onclick="setMarkupMode('circle')" id="tool-circle" title="Circle — drag to draw"><i class="far fa-circle"></i></button>
        <button class="btn btn-outline btn-sm" onclick="setMarkupMode('arrow')" id="tool-arrow" title="Arrow — drag to draw"><i class="fas fa-long-arrow-alt-right"></i></button>
        <button class="btn btn-outline btn-sm" onclick="setMarkupMode('text')" id="tool-text" title="Text — click to place"><i class="fas fa-font"></i></button>
        <button class="btn btn-outline btn-sm" onclick="setMarkupMode('freehand')" id="tool-freehand" title="Freehand — draw freely"><i class="fas fa-pen"></i></button>
        <div style="width:1px;height:22px;background:var(--card-border);margin:0 3px;"></div>
        ${['#ef4444','#f97316','#22c55e','#3b82f6'].map(c => `
          <div onclick="setMarkupColor('${c}','${projectId}','${drawingId}')" id="color-${c.slice(1)}" style="width:22px;height:22px;border-radius:50%;background:${c};cursor:pointer;border:2.5px solid ${c === markupColor ? '#1a2744' : 'transparent'};flex-shrink:0;"></div>
        `).join('')}
        <div style="width:1px;height:22px;background:var(--card-border);margin:0 3px;"></div>
        <button class="btn btn-outline btn-sm" onclick="deleteSelectedMarkup('${projectId}','${drawingId}')" title="Delete selected"><i class="fas fa-trash"></i></button>
        <button class="btn btn-outline btn-sm" onclick="undoMarkup('${projectId}','${drawingId}')" title="Undo"><i class="fas fa-undo"></i></button>
        <div style="width:1px;height:22px;background:var(--card-border);margin:0 3px;"></div>
        <select class="form-input-styled" style="padding:2px 6px;font-size:11px;min-height:28px;" onchange="markupVisibility=this.value; refreshMarkups('${projectId}','${drawingId}');">
          <option value="all">All markup</option>
          <option value="mine">My markup</option>
          <option value="none">Hide</option>
        </select>
        <div style="flex:1;"></div>
        <span id="toolbar-status" class="text-muted" style="font-size:11px;">Select / move</span>
      </div>

      <!-- Main -->
      <div style="flex:1;display:flex;overflow:hidden;">
        <!-- Canvas -->
        <div style="flex:1;overflow:auto;background:#e5e7eb;position:relative;" id="drawing-canvas-area">
          <div id="drawing-surface" style="width:800px;height:600px;margin:20px auto;background:#fff;border:1px solid var(--card-border);position:relative;box-shadow:0 4px 12px rgba(0,0,0,0.1);user-select:none;" onclick="if(!markupMode && event.target.id==='drawing-surface') deselectMarkup('${projectId}','${drawingId}');">
            <!-- Background drawing -->
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0.06;pointer-events:none;">
              <div style="text-align:center;"><i class="${d.file_type === 'pdf' ? 'fas fa-file-pdf' : 'fas fa-image'}" style="font-size:60px;"></i><div style="font-size:18px;font-weight:700;margin-top:4px;">${d.drawing_number} Rev ${d.revision}</div></div>
            </div>
            <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.1;">
              <rect x="60" y="40" width="680" height="520" fill="none" stroke="#1a2744" stroke-width="2"/>
              <rect x="100" y="80" width="200" height="150" fill="none" stroke="#1a2744" stroke-width="1"/>
              <rect x="350" y="80" width="180" height="120" fill="none" stroke="#1a2744" stroke-width="1"/>
              <rect x="100" y="280" width="300" height="200" fill="none" stroke="#1a2744" stroke-width="1"/>
              <rect x="450" y="250" width="200" height="230" fill="none" stroke="#1a2744" stroke-width="1"/>
              <text x="180" y="160" font-size="10" fill="#1a2744">SERVICE</text>
              <text x="410" y="150" font-size="10" fill="#1a2744">KITCHEN</text>
              <text x="220" y="390" font-size="10" fill="#1a2744">DINING</text>
              <text x="520" y="380" font-size="10" fill="#1a2744">STORAGE</text>
            </svg>

            <!-- Markup shapes rendered here -->
            <div id="markup-layer" style="position:absolute;inset:0;z-index:10;"></div>
            <!-- Live draw preview -->
            <svg id="draw-preview-svg" style="position:absolute;inset:0;width:100%;height:100%;z-index:15;pointer-events:none;"></svg>
            <!-- Interaction layer (catches mouse/touch) -->
            <div id="drawing-interaction" style="position:absolute;inset:0;z-index:20;cursor:default;"
              onmousedown="dwgDown(event,'${projectId}','${drawingId}')"
              onmousemove="dwgMove(event,'${projectId}','${drawingId}')"
              onmouseup="dwgUp(event,'${projectId}','${drawingId}')"
              ontouchstart="dwgDown(event,'${projectId}','${drawingId}')"
              ontouchmove="dwgMove(event,'${projectId}','${drawingId}')"
              ontouchend="dwgUp(event,'${projectId}','${drawingId}')">
            </div>
          </div>

          ${d.approval && d.approval.status === 'approved' ? `
          <div style="position:absolute;top:30px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:700;z-index:30;box-shadow:0 4px 12px rgba(0,0,0,0.2);pointer-events:none;">
            <i class="fas fa-stamp" style="margin-right:8px;"></i>APPROVED — ${d.approval.approved_by} — ${d.approval.approved_at}
          </div>` : ''}
        </div>

        <!-- Info panel -->
        <div style="width:280px;border-left:1px solid var(--card-border);overflow-y:auto;padding:16px;flex-shrink:0;" id="drawing-info-panel">
          <!-- Markup editor (shown when markup selected) -->
          <div id="markup-editor" style="display:none;margin-bottom:16px;padding:12px;border:2px solid var(--orange);border-radius:8px;background:var(--orange-light);">
            <div style="font-size:12px;font-weight:700;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
              Edit Markup <button class="btn-icon" onclick="deselectMarkup()" style="font-size:12px;color:var(--text-muted);"><i class="fas fa-times"></i></button>
            </div>
            <div class="form-group" style="margin-bottom:8px;">
              <label class="form-label" style="font-size:11px;">Comment</label>
              <textarea id="edit-markup-text" class="form-input-styled" rows="2" style="padding:5px 8px;font-size:12px;" oninput="liveUpdateMarkupText('${projectId}','${drawingId}',this.value)"></textarea>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:8px;" id="size-inputs">
              <div class="form-group" style="flex:1;">
                <label class="form-label" style="font-size:11px;" id="size-label-w">Width</label>
                <input id="edit-markup-w" type="number" class="form-input-styled" style="padding:4px 6px;font-size:12px;" onchange="liveUpdateMarkupSize('${projectId}','${drawingId}')">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label" style="font-size:11px;" id="size-label-h">Height</label>
                <input id="edit-markup-h" type="number" class="form-input-styled" style="padding:4px 6px;font-size:12px;" onchange="liveUpdateMarkupSize('${projectId}','${drawingId}')">
              </div>
            </div>
            <div style="display:flex;gap:4px;">
              ${['#ef4444','#f97316','#22c55e','#3b82f6'].map(c => `
                <div onclick="recolorSelectedMarkup('${c}','${projectId}','${drawingId}')" style="width:20px;height:20px;border-radius:50%;background:${c};cursor:pointer;border:2px solid transparent;"></div>
              `).join('')}
            </div>
          </div>

          <div class="section-title" style="margin-bottom:6px;">Info</div>
          <div style="font-size:12px;display:flex;flex-direction:column;gap:3px;margin-bottom:14px;">
            <div><span class="text-muted">Title:</span> ${d.title}</div>
            <div><span class="text-muted">Number:</span> ${d.drawing_number} Rev ${d.revision}</div>
            <div><span class="text-muted">Category:</span> ${d.category}</div>
            <div><span class="text-muted">By:</span> ${d.uploaded_by}</div>
            <div><span class="text-muted">Status:</span> <span class="status-badge status-${d.status === 'current' ? 'active' : d.status}">${d.status}</span></div>
          </div>

          ${d.approval ? `
          <div class="section-title" style="margin-bottom:6px;">Approval</div>
          <div style="font-size:12px;padding:8px;border:1px solid var(--card-border);border-radius:8px;margin-bottom:14px;background:${d.approval.status === 'approved' ? 'var(--green-bg)' : 'var(--orange-light)'};">
            <div style="font-weight:600;">${d.approval.number}</div>
            <div class="text-muted" style="font-size:11px;">${d.approval.description || ''}</div>
            <span class="status-badge status-${d.approval.status === 'approved' ? 'accepted' : d.approval.status}" style="margin-top:4px;">${d.approval.status}</span>
            ${d.approval.status === 'approved' ? `<div style="color:var(--green);font-size:11px;margin-top:4px;">by ${d.approval.approved_by}, ${d.approval.approved_at}</div>` : ''}
            ${isClient && d.approval.status === 'pending' ? `
            <div style="display:flex;gap:6px;margin-top:8px;">
              <button class="btn btn-accent btn-sm btn-full" onclick="clientApproveDrawing('${projectId}','${drawingId}')"><i class="fas fa-check"></i> Approve</button>
              <button class="btn btn-outline btn-sm btn-full" onclick="clientRequestChanges('${projectId}','${drawingId}')"><i class="fas fa-redo"></i> Changes</button>
            </div>` : ''}
          </div>` : ''}

          <div class="section-title" style="margin-bottom:6px;">Revisions</div>
          <div style="display:flex;flex-direction:column;gap:2px;font-size:11px;margin-bottom:14px;">
            ${(d.revisions || []).map(r => `<div style="display:flex;justify-content:space-between;padding:3px 6px;border-radius:3px;${r.status === 'current' || r.status === 'approved' ? 'background:var(--orange-light);font-weight:600;' : ''}"><span>Rev ${r.rev}</span><span class="text-muted">${r.date}</span></div>`).join('')}
          </div>

          <div class="section-title" style="margin-bottom:6px;">Markup (${d.markups.length})</div>
          <div id="markup-list" style="display:flex;flex-direction:column;gap:3px;font-size:11px;">
            ${d.markups.map(m => `
              <div style="padding:5px 6px;border-left:3px solid ${m.color};background:var(--page-bg);border-radius:0 4px 4px 0;cursor:pointer;${m.resolved ? 'opacity:0.4;' : ''}" onclick="selectMarkupById('${m.id}','${projectId}','${drawingId}')">
                <div style="font-weight:600;color:${m.color};font-size:10px;">${m.created_by} · ${m.type}</div>
                <div>${m.text || '—'}</div>
              </div>
            `).join('')}
            ${d.markups.length === 0 ? '<div class="text-muted" style="text-align:center;padding:8px;">No markup.</div>' : ''}
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  refreshMarkups(projectId, drawingId);
  // Default to select mode — interaction layer doesn't block clicks on shapes
  markupMode = null;
  const il = document.getElementById('drawing-interaction');
  if (il) il.style.pointerEvents = 'none';
  updateToolbarStatus('Click a shape to select, drag to move, trash to delete');
}

// ---- Render markup elements as interactive DOM ----
function refreshMarkups(pid, did) {
  const drawings = DEMO_DRAWINGS[pid] || [];
  const d = drawings.find(x => x.id === did);
  if (!d) return;
  const layer = document.getElementById('markup-layer');
  if (!layer) return;
  const user = currentUser.full_name;

  layer.innerHTML = d.markups.filter(m => {
    if (markupVisibility === 'none') return false;
    if (markupVisibility === 'mine') return m.created_by === user;
    return true;
  }).map(m => {
    const sel = _selectedMarkup === m.id;
    const canEdit = m.created_by === user;
    const bw = sel ? 3 : 2;
    const glow = sel ? `box-shadow:0 0 0 3px ${m.color}40;` : '';

    if (m.type === 'rect') {
      const w = m.w || 120, h = m.h || 80;
      return `<div data-mkid="${m.id}" style="position:absolute;left:${m.x}px;top:${m.y}px;width:${w}px;height:${h}px;border:${bw}px solid ${m.color};border-radius:4px;${glow}cursor:${canEdit ? 'move' : 'pointer'};z-index:${sel ? 12 : 11};"
        onmousedown="event.stopPropagation();mkDown(event,'${m.id}','${pid}','${did}','move')"
        ontouchstart="event.stopPropagation();mkDown(event,'${m.id}','${pid}','${did}','move')">
        ${sel && canEdit ? resizeHandle(m.id, pid, did) : ''}
      </div>
      ${m.text ? `<div style="position:absolute;left:${m.x}px;top:${m.y + h + 3}px;background:${m.color};color:#fff;font-size:10px;padding:2px 8px;border-radius:3px;max-width:${Math.max(w, 160)}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;z-index:${sel ? 12 : 11};">${m.text}</div>` : ''}`;
    }
    if (m.type === 'circle') {
      const r = m.r || 30;
      return `<div data-mkid="${m.id}" style="position:absolute;left:${m.x - r}px;top:${m.y - r}px;width:${r*2}px;height:${r*2}px;border:${bw}px solid ${m.color};border-radius:50%;${glow}cursor:${canEdit ? 'move' : 'pointer'};z-index:${sel ? 12 : 11};"
        onmousedown="event.stopPropagation();mkDown(event,'${m.id}','${pid}','${did}','move')"
        ontouchstart="event.stopPropagation();mkDown(event,'${m.id}','${pid}','${did}','move')">
        ${sel && canEdit ? resizeHandle(m.id, pid, did) : ''}
      </div>
      ${m.text ? `<div style="position:absolute;left:${m.x - r}px;top:${m.y + r + 3}px;background:${m.color};color:#fff;font-size:10px;padding:2px 8px;border-radius:3px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;z-index:${sel ? 12 : 11};">${m.text}</div>` : ''}`;
    }
    if (m.type === 'arrow') {
      // Arrow with full x,y → x2,y2 support
      const x2 = m.x2 != null ? m.x2 : m.x + (m.len || 70);
      const y2 = m.y2 != null ? m.y2 : m.y;
      const minX = Math.min(m.x, x2) - 10;
      const minY = Math.min(m.y, y2) - 10;
      const svgW = Math.abs(x2 - m.x) + 20;
      const svgH = Math.abs(y2 - m.y) + 20;
      const lx1 = m.x - minX, ly1 = m.y - minY;
      const lx2 = x2 - minX, ly2 = y2 - minY;
      return `<div data-mkid="${m.id}" style="position:absolute;left:${minX}px;top:${minY}px;width:${svgW}px;height:${svgH}px;cursor:${canEdit ? 'move' : 'pointer'};z-index:${sel ? 12 : 11};"
        onmousedown="event.stopPropagation();mkDown(event,'${m.id}','${pid}','${did}','move')"
        ontouchstart="event.stopPropagation();mkDown(event,'${m.id}','${pid}','${did}','move')">
        <svg width="${svgW}" height="${svgH}">
          <defs><marker id="ah-${m.id}" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="${m.color}"/></marker></defs>
          <line x1="${lx1}" y1="${ly1}" x2="${lx2}" y2="${ly2}" stroke="${m.color}" stroke-width="${bw+1}" marker-end="url(#ah-${m.id})" ${sel ? 'filter="drop-shadow(0 0 3px ' + m.color + ')"' : ''}/>
        </svg>
      </div>
      ${m.text ? `<div style="position:absolute;left:${Math.min(m.x, x2)}px;top:${Math.max(m.y, y2) + 4}px;background:${m.color};color:#fff;font-size:10px;padding:2px 8px;border-radius:3px;white-space:nowrap;pointer-events:none;z-index:${sel ? 12 : 11};">${m.text}</div>` : ''}`;
    }
    if (m.type === 'text') {
      return `<div data-mkid="${m.id}" style="position:absolute;left:${m.x}px;top:${m.y}px;background:${m.color};color:#fff;font-size:12px;padding:5px 10px;border-radius:5px;max-width:240px;cursor:${canEdit ? 'move' : 'pointer'};${glow}z-index:${sel ? 12 : 11};${sel ? 'outline:2px solid #1a2744;outline-offset:2px;' : ''}"
        onmousedown="event.stopPropagation();mkDown(event,'${m.id}','${pid}','${did}','move')"
        ontouchstart="event.stopPropagation();mkDown(event,'${m.id}','${pid}','${did}','move')">${m.text || 'Text'}</div>`;
    }
    if (m.type === 'freehand' && m.points && m.points.length > 0) {
      const pts = m.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      // Calculate bounding box for the clickable hit area
      const xs = m.points.map(p => p.x), ys = m.points.map(p => p.y);
      const bx = Math.min(...xs) - 10, by = Math.min(...ys) - 10;
      const bw2 = Math.max(...xs) - bx + 20, bh2 = Math.max(...ys) - by + 20;
      return `<div data-mkid="${m.id}" style="position:absolute;left:${bx}px;top:${by}px;width:${bw2}px;height:${bh2}px;cursor:${canEdit ? 'move' : 'pointer'};z-index:${sel ? 12 : 11};"
        onmousedown="event.stopPropagation();mkDown(event,'${m.id}','${pid}','${did}','move')"
        ontouchstart="event.stopPropagation();mkDown(event,'${m.id}','${pid}','${did}','move')">
        <svg width="${bw2}" height="${bh2}" style="${sel ? 'filter:drop-shadow(0 0 4px '+m.color+');' : ''}">
          <path d="${m.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x - bx},${p.y - by}`).join(' ')}" fill="none" stroke="${m.color}" stroke-width="${bw+1}" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      ${m.text ? `<div style="position:absolute;left:${bx}px;top:${by + bh2 + 2}px;background:${m.color};color:#fff;font-size:10px;padding:2px 8px;border-radius:3px;white-space:nowrap;pointer-events:none;z-index:${sel ? 12 : 11};">${m.text}</div>` : ''}`;
    }
    return '';
  }).join('');
}

function resizeHandle(mkId, pid, did) {
  return `<div style="position:absolute;right:-6px;bottom:-6px;width:14px;height:14px;background:currentColor;border:2px solid #fff;border-radius:3px;cursor:nwse-resize;z-index:13;"
    onmousedown="event.stopPropagation();mkDown(event,'${mkId}','${pid}','${did}','resize')"
    ontouchstart="event.stopPropagation();mkDown(event,'${mkId}','${pid}','${did}','resize')"></div>`;
}

// ---- Mouse/touch on existing markup (move/resize) ----
function mkDown(e, mkId, pid, did, mode) {
  e.preventDefault();
  const drawings = DEMO_DRAWINGS[pid] || [];
  const d = drawings.find(x => x.id === did);
  const m = d ? d.markups.find(mk => mk.id === mkId) : null;
  if (!m) return;

  _selectedMarkup = mkId;
  refreshMarkups(pid, did);
  showMarkupEditor(m, pid, did);

  if (m.created_by !== currentUser.full_name) return; // can't move/resize others'

  const pos = _getSurfaceCoords(e);
  _dragState = {
    mode, id: mkId, startX: pos.x, startY: pos.y,
    origX: m.x, origY: m.y, origW: m.w, origH: m.h, origR: m.r,
    origX2: m.x2, origY2: m.y2, // arrow endpoint
    origPoints: m.points ? m.points.map(p => ({ x: p.x, y: p.y })) : null, // freehand
  };
}

// ---- Interaction layer (drawing new shapes) ----
function dwgDown(e, pid, did) {
  if (e.touches) e.preventDefault();
  const pos = _getSurfaceCoords(e);

  if (!markupMode) {
    // Deselect when clicking empty space
    deselectMarkup(pid, did);
    return;
  }

  _drawStart = { x: pos.x, y: pos.y };
  _dragState = { mode: 'draw' };
  if (markupMode === 'freehand') _dragState.points = [{ x: pos.x, y: pos.y }];
}

function dwgMove(e, pid, did) {
  if (!_dragState) return;
  if (e.touches) e.preventDefault();
  const pos = _getSurfaceCoords(e);
  const svg = document.getElementById('draw-preview-svg');

  // Drawing new shape
  if (_dragState.mode === 'draw' && _drawStart && svg) {
    const x1 = _drawStart.x, y1 = _drawStart.y, x2 = pos.x, y2 = pos.y;
    if (markupMode === 'rect') {
      svg.innerHTML = `<rect x="${Math.min(x1,x2)}" y="${Math.min(y1,y2)}" width="${Math.abs(x2-x1)}" height="${Math.abs(y2-y1)}" fill="${markupColor}10" stroke="${markupColor}" stroke-width="2" stroke-dasharray="6,3" rx="4"/>`;
    } else if (markupMode === 'circle') {
      const r = Math.round(Math.sqrt((x2-x1)**2+(y2-y1)**2));
      svg.innerHTML = `<circle cx="${x1}" cy="${y1}" r="${r}" fill="${markupColor}10" stroke="${markupColor}" stroke-width="2" stroke-dasharray="6,3"/>`;
    } else if (markupMode === 'arrow') {
      svg.innerHTML = `<defs><marker id="ah" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="${markupColor}"/></marker></defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${markupColor}" stroke-width="2" marker-end="url(#ah)"/>`;
    } else if (markupMode === 'freehand' && _dragState.points) {
      _dragState.points.push({ x: pos.x, y: pos.y });
      const pts = _dragState.points.map((p,i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
      svg.innerHTML = `<path d="${pts}" fill="none" stroke="${markupColor}" stroke-width="2" stroke-linecap="round"/>`;
    }
  }

  // Moving existing markup
  if (_dragState.mode === 'move' && _dragState.id) {
    const drawings = DEMO_DRAWINGS[pid] || [];
    const d = drawings.find(x => x.id === did);
    const m = d ? d.markups.find(mk => mk.id === _dragState.id) : null;
    if (m) {
      const dx = pos.x - _dragState.startX;
      const dy = pos.y - _dragState.startY;
      m.x = _dragState.origX + dx;
      m.y = _dragState.origY + dy;
      // Move arrow endpoint too
      if (m.type === 'arrow' && _dragState.origX2 != null) {
        m.x2 = _dragState.origX2 + dx;
        m.y2 = _dragState.origY2 + dy;
      }
      // Move freehand points
      if (m.type === 'freehand' && _dragState.origPoints) {
        m.points = _dragState.origPoints.map(p => ({ x: p.x + dx, y: p.y + dy }));
      }
      refreshMarkups(pid, did);
    }
  }

  // Resizing existing markup
  if (_dragState.mode === 'resize' && _dragState.id) {
    const drawings = DEMO_DRAWINGS[pid] || [];
    const d = drawings.find(x => x.id === did);
    const m = d ? d.markups.find(mk => mk.id === _dragState.id) : null;
    if (m) {
      const dx = pos.x - _dragState.startX, dy = pos.y - _dragState.startY;
      if (m.type === 'rect') {
        m.w = Math.max(30, (_dragState.origW || 120) + dx);
        m.h = Math.max(20, (_dragState.origH || 80) + dy);
      } else if (m.type === 'circle') {
        m.r = Math.max(15, (_dragState.origR || 30) + Math.round((dx + dy) / 2));
      }
      refreshMarkups(pid, did);
      showMarkupEditor(m, pid, did);
    }
  }
}

function dwgUp(e, pid, did) {
  if (!_dragState) return;
  const svg = document.getElementById('draw-preview-svg');
  if (svg) svg.innerHTML = '';

  if (_dragState.mode === 'draw' && _drawStart && markupMode) {
    const pos = _getSurfaceCoords(e);
    const x1 = _drawStart.x, y1 = _drawStart.y, x2 = pos.x, y2 = pos.y;
    const dist = Math.sqrt((x2-x1)**2+(y2-y1)**2);

    if (dist > 5 || markupMode === 'text') {
      const mk = {
        id: 'mk-' + Date.now(), type: markupMode, color: markupColor, text: '',
        created_by: currentUser.full_name, role: currentUser.role === 'client' ? 'client' : 'trivex',
        created_at: new Date().toISOString().split('T')[0], resolved: false,
      };
      if (markupMode === 'rect') {
        mk.x = Math.min(x1,x2); mk.y = Math.min(y1,y2);
        mk.w = Math.max(Math.abs(x2-x1), 30); mk.h = Math.max(Math.abs(y2-y1), 20);
      } else if (markupMode === 'circle') {
        mk.x = x1; mk.y = y1; mk.r = Math.max(Math.round(dist), 15);
      } else if (markupMode === 'arrow') {
        mk.x = x1; mk.y = y1; mk.x2 = x2; mk.y2 = y2;
      } else if (markupMode === 'text') {
        mk.x = x1; mk.y = y1; mk.text = 'Comment';
      } else if (markupMode === 'freehand' && _dragState.points) {
        mk.x = 0; mk.y = 0; mk.points = _dragState.points;
      }

      const drawings = DEMO_DRAWINGS[pid] || [];
      const d = drawings.find(x => x.id === did);
      if (d) {
        _undoStack.push({ action: 'add', markupId: mk.id });
        d.markups.push(mk);
        _selectedMarkup = mk.id;
        refreshMarkups(pid, did);
        showMarkupEditor(mk, pid, did);
        updateToolbarStatus('Created — edit in panel →');
      }
    }
  }
  _dragState = null;
  _drawStart = null;
}

// ---- Editor panel ----
function showMarkupEditor(m, pid, did) {
  const editor = document.getElementById('markup-editor');
  if (!editor || !m) return;
  editor.style.display = 'block';
  editor.style.borderColor = m.color;
  editor.style.background = m.color + '10';
  document.getElementById('edit-markup-text').value = m.text || '';

  const sizeDiv = document.getElementById('size-inputs');
  const wInput = document.getElementById('edit-markup-w');
  const hInput = document.getElementById('edit-markup-h');
  if (m.type === 'rect') {
    sizeDiv.style.display = 'flex';
    document.getElementById('size-label-w').textContent = 'Width';
    document.getElementById('size-label-h').textContent = 'Height';
    wInput.value = m.w || 120; hInput.value = m.h || 80;
    hInput.parentElement.style.display = '';
  } else if (m.type === 'circle') {
    sizeDiv.style.display = 'flex';
    document.getElementById('size-label-w').textContent = 'Radius';
    wInput.value = m.r || 30;
    hInput.parentElement.style.display = 'none';
  } else if (m.type === 'arrow') {
    sizeDiv.style.display = 'none'; // arrow is drawn by dragging, no manual size
  } else {
    sizeDiv.style.display = 'none';
  }
}

function liveUpdateMarkupText(pid, did, text) {
  if (!_selectedMarkup) return;
  const drawings = DEMO_DRAWINGS[pid] || [];
  const d = drawings.find(x => x.id === did);
  const m = d ? d.markups.find(mk => mk.id === _selectedMarkup) : null;
  if (m) { m.text = text; refreshMarkups(pid, did); }
}

function liveUpdateMarkupSize(pid, did) {
  if (!_selectedMarkup) return;
  const drawings = DEMO_DRAWINGS[pid] || [];
  const d = drawings.find(x => x.id === did);
  const m = d ? d.markups.find(mk => mk.id === _selectedMarkup) : null;
  if (!m) return;
  const w = parseInt(document.getElementById('edit-markup-w').value) || 30;
  const h = parseInt(document.getElementById('edit-markup-h').value) || 30;
  if (m.type === 'rect') { m.w = w; m.h = h; }
  else if (m.type === 'circle') { m.r = w; }
  // arrow size is controlled by its endpoints, not manual input
  refreshMarkups(pid, did);
}

function recolorSelectedMarkup(color, pid, did) {
  if (!_selectedMarkup) return;
  const drawings = DEMO_DRAWINGS[pid] || [];
  const d = drawings.find(x => x.id === did);
  const m = d ? d.markups.find(mk => mk.id === _selectedMarkup) : null;
  if (m && m.created_by === currentUser.full_name) {
    m.color = color;
    refreshMarkups(pid, did);
    const editor = document.getElementById('markup-editor');
    if (editor) { editor.style.borderColor = color; editor.style.background = color + '10'; }
  }
}

function deselectMarkup(pid, did) {
  _selectedMarkup = null;
  const editor = document.getElementById('markup-editor');
  if (editor) editor.style.display = 'none';
  if (pid && did) refreshMarkups(pid, did);
}

function selectMarkupById(mkId, pid, did) {
  _selectedMarkup = mkId;
  const drawings = DEMO_DRAWINGS[pid] || [];
  const d = drawings.find(x => x.id === did);
  const m = d ? d.markups.find(mk => mk.id === mkId) : null;
  refreshMarkups(pid, did);
  if (m) showMarkupEditor(m, pid, did);
}

function deleteSelectedMarkup(pid, did) {
  if (!_selectedMarkup) { updateToolbarStatus('Select a markup first'); return; }
  const drawings = DEMO_DRAWINGS[pid] || [];
  const d = drawings.find(x => x.id === did);
  if (!d) return;
  const idx = d.markups.findIndex(m => m.id === _selectedMarkup);
  if (idx >= 0) {
    _undoStack.push({ action: 'delete', markup: { ...d.markups[idx] } });
    d.markups.splice(idx, 1);
    _selectedMarkup = null;
    document.getElementById('markup-editor').style.display = 'none';
    refreshMarkups(pid, did);
    updateToolbarStatus('Deleted');
  }
}

function undoMarkup(pid, did) {
  if (_undoStack.length === 0) { updateToolbarStatus('Nothing to undo'); return; }
  const last = _undoStack.pop();
  const drawings = DEMO_DRAWINGS[pid] || [];
  const d = drawings.find(x => x.id === did);
  if (!d) return;
  if (last.action === 'add') {
    const idx = d.markups.findIndex(m => m.id === last.markupId);
    if (idx >= 0) d.markups.splice(idx, 1);
  } else if (last.action === 'delete') {
    d.markups.push(last.markup);
  }
  _selectedMarkup = null;
  document.getElementById('markup-editor').style.display = 'none';
  refreshMarkups(pid, did);
  updateToolbarStatus('Undone');
}

// ---- Toolbar helpers ----
function setMarkupMode(mode) {
  markupMode = mode;
  _selectedMarkup = null;
  const editor = document.getElementById('markup-editor');
  if (editor) editor.style.display = 'none';

  document.querySelectorAll('#markup-toolbar .btn').forEach(b => { b.classList.remove('btn-accent'); b.classList.add('btn-outline'); });
  const active = mode ? document.getElementById('tool-' + mode) : document.getElementById('tool-select');
  if (active) { active.classList.add('btn-accent'); active.classList.remove('btn-outline'); }

  const il = document.getElementById('drawing-interaction');
  if (il) {
    // In select mode: let clicks pass through to markup shapes
    // In draw mode: capture all mouse events for drawing
    il.style.pointerEvents = mode ? 'auto' : 'none';
    il.style.cursor = mode ? 'crosshair' : 'default';
  }

  const labels = { rect: 'Drag to draw rectangle', circle: 'Drag to draw circle', arrow: 'Drag to draw arrow', text: 'Click to place text', freehand: 'Draw freehand' };
  updateToolbarStatus(mode ? labels[mode] || '' : 'Click a shape to select, drag to move, trash to delete');
}

function setMarkupColor(color, pid, did) {
  markupColor = color;
  ['ef4444','f97316','22c55e','3b82f6'].forEach(c => {
    const el = document.getElementById('color-' + c);
    if (el) el.style.borderColor = '#' + c === color ? '#1a2744' : 'transparent';
  });
}

function updateToolbarStatus(msg) {
  const el = document.getElementById('toolbar-status');
  if (el) el.textContent = msg || '';
}

function closeDrawingViewer() {
  const v = document.getElementById('drawing-viewer');
  if (v) v.remove();
  markupMode = null;
  _dragState = null;
  _selectedMarkup = null;
  document.removeEventListener('keydown', _drawingKeyHandler);
}

// Keyboard handler for delete
function _drawingKeyHandler(e) {
  if (!document.getElementById('drawing-viewer')) return;
  // Don't capture if typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

  if ((e.key === 'Delete' || e.key === 'Backspace') && _selectedMarkup) {
    e.preventDefault();
    // Find the project/drawing from the viewer
    const viewer = document.getElementById('drawing-viewer');
    if (!viewer) return;
    // Get pid/did from any markup element's onclick
    const mkEl = viewer.querySelector('[data-mkid]');
    if (!mkEl) return;
    const onmd = mkEl.getAttribute('onmousedown') || '';
    const match = onmd.match(/mkDown\(event,'[^']+','([^']+)','([^']+)'/);
    if (match) {
      deleteSelectedMarkup(match[1], match[2]);
    }
  }

  if (e.key === 'Escape') {
    deselectMarkup();
    setMarkupMode(null);
  }
}

document.addEventListener('keydown', _drawingKeyHandler);

// ============================================
// DRAWING UPLOAD, SHARE, APPROVAL
// ============================================
function showUploadDrawingModal(projectId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'upload-dwg-modal';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:480px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3><i class="fas fa-upload" style="color:var(--orange);margin-right:8px;"></i>Upload Drawing</h3>
        <button class="btn-icon" onclick="document.getElementById('upload-dwg-modal').remove()" style="color:var(--text-muted);font-size:18px;"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group"><label class="form-label">Drawing Title</label><input id="dwg-title" class="form-input-styled" placeholder="e.g. Floor Plan — Main Level"></div>
        <div style="display:flex;gap:12px;">
          <div class="form-group" style="flex:1;"><label class="form-label">Drawing Number</label><input id="dwg-number" class="form-input-styled" value="${nextDrawingNumber(projectId)}"></div>
          <div class="form-group" style="flex:1;"><label class="form-label">Revision</label><input id="dwg-rev" class="form-input-styled" value="A" maxlength="2"></div>
        </div>
        <div class="form-group"><label class="form-label">Category</label><select id="dwg-category" class="form-input-styled">${DRAWING_CATEGORIES.map(c => '<option>' + c + '</option>').join('')}</select></div>
        <div class="form-group"><label class="form-label">File (PDF, JPG, PNG — max 50MB)</label><input type="file" id="dwg-file" class="form-input-styled" accept=".pdf,.jpg,.jpeg,.png" style="padding:8px;"></div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;"><input type="checkbox" id="dwg-shared" checked> Share with client</label>
        <button class="btn btn-accent btn-full btn-lg" onclick="saveDrawingUpload('${projectId}')"><i class="fas fa-upload"></i> Upload</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function saveDrawingUpload(projectId) {
  const title = document.getElementById('dwg-title').value.trim();
  if (!title) { alert('Enter a drawing title.'); return; }
  if (!DEMO_DRAWINGS[projectId]) DEMO_DRAWINGS[projectId] = [];
  const fileInput = document.getElementById('dwg-file');
  const fileType = fileInput.files[0] ? (fileInput.files[0].type.includes('pdf') ? 'pdf' : 'image') : 'pdf';
  DEMO_DRAWINGS[projectId].push({
    id: 'dwg-' + Date.now(), title,
    drawing_number: document.getElementById('dwg-number').value,
    category: document.getElementById('dwg-category').value,
    revision: document.getElementById('dwg-rev').value.toUpperCase(),
    status: 'current', shared_with_client: document.getElementById('dwg-shared').checked,
    uploaded_by: currentUser.full_name, created_at: new Date().toISOString().split('T')[0],
    file_type: fileType,
    revisions: [{ rev: document.getElementById('dwg-rev').value.toUpperCase(), date: new Date().toISOString().split('T')[0], uploaded_by: currentUser.full_name, status: 'current' }],
    markups: [], approval: null,
  });
  document.getElementById('upload-dwg-modal').remove();
  switchProjectTab('drawings');
}

function toggleDrawingShared(projectId, drawingId, shared) {
  const drawings = DEMO_DRAWINGS[projectId] || [];
  const d = drawings.find(x => x.id === drawingId);
  if (d) d.shared_with_client = shared;
}

function requestDrawingApproval(projectId, drawingId) {
  const inputDiv = document.createElement('div');
  inputDiv.id = 'approval-input-overlay';
  inputDiv.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
  inputDiv.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:24px;max-width:420px;width:95%;box-shadow:0 20px 40px rgba(0,0,0,0.2);">
      <h3 style="margin-bottom:12px;">Request Client Approval</h3>
      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label">What should the client review?</label>
        <textarea id="approval-desc-input" class="form-input-styled" rows="3" placeholder="e.g. Please review the floor layout..."></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-full" onclick="document.getElementById('approval-input-overlay').remove()">Cancel</button>
        <button class="btn btn-accent btn-full" onclick="submitDrawingApproval('${projectId}','${drawingId}')">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(inputDiv);
  setTimeout(() => document.getElementById('approval-desc-input')?.focus(), 50);
}

function submitDrawingApproval(projectId, drawingId) {
  const desc = document.getElementById('approval-desc-input').value.trim();
  if (!desc) { alert('Enter a description.'); return; }
  const drawings = DEMO_DRAWINGS[projectId] || [];
  const d = drawings.find(x => x.id === drawingId);
  if (!d) return;
  d.approval = { id: 'apr-' + Date.now(), number: nextApprovalNumber(), status: 'pending', requested_by: currentUser.full_name, requested_at: new Date().toISOString().split('T')[0], description: desc };
  document.getElementById('approval-input-overlay').remove();
  closeDrawingViewer();
  openDrawingViewer(projectId, drawingId);
}

function clientApproveDrawing(projectId, drawingId) {
  const drawings = DEMO_DRAWINGS[projectId] || [];
  const d = drawings.find(x => x.id === drawingId);
  if (!d || !d.approval) return;
  d.approval.status = 'approved';
  d.approval.approved_by = currentUser.full_name;
  d.approval.approved_at = new Date().toISOString().split('T')[0];
  d.status = 'approved';
  closeDrawingViewer();
  openDrawingViewer(projectId, drawingId);
}

function clientRequestChanges(projectId, drawingId) {
  const inputDiv = document.createElement('div');
  inputDiv.id = 'changes-input-overlay';
  inputDiv.style.cssText = 'position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
  inputDiv.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:24px;max-width:420px;width:95%;box-shadow:0 20px 40px rgba(0,0,0,0.2);">
      <h3 style="margin-bottom:12px;">Request Changes</h3>
      <div class="form-group" style="margin-bottom:16px;">
        <label class="form-label">What changes do you need?</label>
        <textarea id="changes-desc-input" class="form-input-styled" rows="3" placeholder="Describe changes..."></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-full" onclick="document.getElementById('changes-input-overlay').remove()">Cancel</button>
        <button class="btn btn-accent btn-full" onclick="submitDrawingChanges('${projectId}','${drawingId}')">Submit</button>
      </div>
    </div>
  `;
  document.body.appendChild(inputDiv);
  setTimeout(() => document.getElementById('changes-desc-input')?.focus(), 50);
}

function submitDrawingChanges(projectId, drawingId) {
  const comment = document.getElementById('changes-desc-input').value.trim();
  if (!comment) { alert('Describe the changes.'); return; }
  const drawings = DEMO_DRAWINGS[projectId] || [];
  const d = drawings.find(x => x.id === drawingId);
  if (!d || !d.approval) return;
  d.approval.status = 'changes_requested';
  d.markups.push({ id: 'mk-' + Date.now(), type: 'text', x: 400, y: 30, color: '#f97316', text: 'CHANGES REQUESTED: ' + comment, created_by: currentUser.full_name, role: 'client', created_at: new Date().toISOString().split('T')[0], resolved: false });
  document.getElementById('changes-input-overlay').remove();
  closeDrawingViewer();
  openDrawingViewer(projectId, drawingId);
}
