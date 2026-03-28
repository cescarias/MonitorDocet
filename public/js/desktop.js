/**
 * Antigravity Monitor OS - World Monitor Style Edition
 */

class WindowManager {
    constructor() {
        this.windows = [];
        this.zIndex = 1000;
        this.windowArea = document.getElementById('window-area');
        this.initWeather();
    }

    async initWeather() {
        try {
            const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=41.5667&longitude=2.0167&current_weather=true');
            const data = await r.json();
            const w = data.current_weather;
            document.getElementById('weather-tray').innerHTML = `<i class="fa-solid fa-cloud-sun"></i> ${w.temperature}°C Terrassa`;
        } catch(e) { console.error('Weathe fail', e); }
    }

    createWindow(id, title, tag, content, pos = null) {
        const win = document.createElement('div');
        win.className = 'os-window'; win.id = `win-${id}`;
        
        if (pos) {
            win.style.width = pos.w || '24.2%';
            win.style.height = pos.h || '340px'; 
            win.style.left = pos.x || '0.5%';
            win.style.top = pos.y || '45px'; // Below the alert banner
            win.dataset.origX = win.style.left;
            win.dataset.origY = win.style.top;
            win.dataset.origW = win.style.width;
            win.dataset.origH = win.style.height;
        }
        
        win.style.zIndex = ++this.zIndex;
        const titleStyle = id === 'ins_santaeulalia' ? 'style="color: #ef4444;"' : '';
        win.innerHTML = `
            <div class="window-header" style="height: 38px; padding-right:0;">
                <div class="window-title" ${titleStyle}>${tag} | ${title}</div>
                <div class="window-controls">
                    <div class="control-btn btn-min" onclick="window.desktop.minimizeWindow('${win.id}')"><i class="fa-solid fa-minus"></i></div>
                    <div class="control-btn btn-max" onclick="window.desktop.maximizeWindow('${win.id}')"><i class="fa-regular fa-square"></i></div>
                    <div class="control-btn btn-close" onclick="window.desktop.closeWindow('${win.id}')"><i class="fa-solid fa-xmark"></i></div>
                </div>
            </div>
            <div class="window-body">${content}</div>
        `;
        this.windowArea.appendChild(win);
        this.makeDraggable(win);
        this.windows.push(win);
        win.addEventListener('mousedown', () => this.bringToFront(win));
        return win;
    }

    bringToFront(win) { win.style.zIndex = ++this.zIndex; }
    closeWindow(winId) { const win = document.getElementById(winId); if (win) { win.remove(); this.windows = this.windows.filter(w => w.id !== winId); } }
    
    maximizeWindow(winId) {
        const win = document.getElementById(winId);
        if (!win) return;
        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            win.style.width = win.dataset.origW; win.style.height = win.dataset.origH;
            win.style.left = win.dataset.origX; win.style.top = win.dataset.origY;
            win.style.borderRadius = '12px';
        } else {
            win.classList.add('maximized');
            win.style.width = '60vw'; win.style.height = 'calc(100vh - 52px)';
            win.style.left = '20vw'; win.style.top = '0';
            win.style.borderRadius = '0 0 12px 12px';
            this.bringToFront(win);
        }
    }

    makeDraggable(win) {
        const header = win.querySelector('.window-header');
        header.onmousedown = (e) => {
            if (win.classList.contains('maximized')) return;
            if (e.target.closest('.control-btn')) return;
            let pos3 = e.clientX, pos4 = e.clientY;
            document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
            document.onmousemove = (e) => {
                let pos1 = pos3 - e.clientX, pos2 = pos4 - e.clientY;
                pos3 = e.clientX; pos4 = e.clientY;
                win.style.top = (win.offsetTop - pos2) + "px";
                win.style.left = (win.offsetLeft - pos1) + "px";
                win.dataset.origX = win.style.left; win.dataset.origY = win.style.top;
            };
        };
    }
}

class Desktop {
    constructor() {
        this.wm = new WindowManager();
        this.initClock();
        // Removed start menu init
        setTimeout(() => this.openApp('edu_monitor'), 800);
    }

    initClock() {
        const clockEl = document.getElementById('clock');
        setInterval(() => clockEl.textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 1000);
    }

    async openApp(appId) {
        if(appId === 'edu_monitor') {
            // Clear existing windows
            document.getElementById('window-area').innerHTML = '';
            this.wm.windows = [];
            await this.openEducationWindows();
        }
    }

    async openEducationWindows() {
        try {
            const res = await fetch('/api/edu-news');
            const data = await res.json();

            // V2 ASYMMETRIC MASONRY LAYOUT
            const renderItem = (item) => `
                <div class="edu-news-item" onclick="window.open('${item.link}', '_blank')">
                    <div class="item-title">${item.title}</div>
                    <div class="item-meta">ORIGEN: ${new URL(item.link).hostname}</div>
                </div>
            `;
            
            const renderTask = (task) => `
                <div class="edu-news-item" style="border-left: 4px solid ${task.urgent ? 'var(--accent-red)' : (task.status === 'done' ? '#22c55e' : 'var(--accent-blue)')}">
                    <div class="item-title" style="${task.status === 'done' ? 'text-decoration:line-through; color:#aaa' : ''}">${task.task}</div>
                    <div class="item-meta">${task.urgent ? 'URGENT' : (task.status === 'done' ? 'COMPLETAT' : 'PENDENT')}</div>
                </div>
            `;

            const renderDogc = (item) => `
                <div class="edu-news-item" onclick="window.open('${item.link}', '_blank')">
                    <div class="item-meta" style="color:#fbbf24; margin-bottom:4px">${item.date} | ${item.type}</div>
                    <div class="item-title" style="font-family:monospace; font-size:0.8em">${item.title}</div>
                </div>
            `;

            // RESPONSIVE 10-WINDOW ASYMMETRIC GRID (3 - 4 - 3 Layout)
            const gap = 1; // 1% gap
            const winH = 'calc(33.3vh - 20px)'; 
            const calcW = (n) => `${(100 - (n + 1) * gap) / n}%`;
            const calcX = (n, idx) => `${gap + idx * (100 / n)}%`;

            const row1Y = '10px';               // 3 items
            const row2Y = 'calc(33.3vh + 5px)'; // 4 items
            const row3Y = 'calc(66.6vh)';       // 3 items

            const renderSocial = (s) => `
                <div class="social-card" onclick="window.open('${s.link}', '_blank')">
                    <img src="${s.thumb || 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?w=100&q=80'}" class="social-thumb" loading="lazy">
                    <div class="social-body"><strong style="color:var(--accent-blue)">${s.platform}:</strong> @${s.user}<br><span style="color:#aaa">${s.comment}</span></div>
                </div>
            `;

            // ROW 1: 3 WINDOWS (High Interest)
            this.wm.createWindow('teacher_links', 'Enllaços Docents', 'INTERÈS', `
                <div class="edu-app">${data.teacher_links.map(renderItem).join('')}</div>
            `, { x: calcX(3, 0), y: row1Y, w: calcW(3), h: winH });

            this.wm.createWindow('personal_tasks', 'Agent Global', 'TASQUES', `
                <div class="edu-app">
                    <div style="padding:4px; font-weight:bold; color:var(--accent-blue); text-transform:uppercase; font-size:0.7em"><i class="fa-solid fa-list-check"></i> Gestió Personal</div>
                    ${data.personal_tasks.map(renderTask).join('')}
                </div>
            `, { x: calcX(3, 1), y: row1Y, w: calcW(3), h: winH });

            this.wm.createWindow('ins_santaeulalia', 'Novetats Institut', 'SANTA EULÀLIA', `
                <div class="edu-app" style="overflow-x:hidden">${data.ins_santaeulalia.map(renderSocial).join('')}</div>
            `, { x: calcX(3, 2), y: row1Y, w: calcW(3), h: winH });

            // ROW 2: 4 WINDOWS (Institutional / Info)
            this.wm.createWindow('edu_gencat_pau', 'Tràmits i PAU', 'GENCAT', `
                <div class="edu-app">${data.gencat.concat(data.pau_info).map(renderItem).join('')}</div>
            `, { x: calcX(4, 0), y: row2Y, w: calcW(4), h: winH });

            this.wm.createWindow('edu_borsa', 'Borsa Docent', 'OPOSICIONS', `
                <div class="edu-app">${data.borsa_docent.map(renderItem).join('')}</div>
            `, { x: calcX(4, 1), y: row2Y, w: calcW(4), h: winH });

            this.wm.createWindow('dogc_feed', 'Diari Oficial', 'D.O.G.C.', `
                <div class="edu-app">${data.dogc_feed.map(renderDogc).join('')}</div>
            `, { x: calcX(4, 2), y: row2Y, w: calcW(4), h: winH });

            this.wm.createWindow('edu_unions', 'Notícies Sindicals', 'SINDICATS', `
                <div class="edu-app">${data.unions.ustec.concat(data.unions.ccoo_ugt).map(renderItem).join('')}</div>
            `, { x: calcX(4, 3), y: row2Y, w: calcW(4), h: winH });

            // ROW 3: 3 WINDOWS (Media / Social)
            this.wm.createWindow('tv_live', 'Televisió', 'EN DIRECTE', `
                <div class="media-box" onclick="window.open('${data.videos.tv[0].link}', '_blank')" style="cursor:pointer">
                    <img src="${data.videos.tv[0].thumb}" class="media-img" loading="eager">
                    <div class="media-overlay">
                        <div style="font-size:0.7em; font-family: monospace; color:var(--accent-red)"><span class="live-indicator"></span> EN VIU | NOTÍCIES | TV3</div>
                        <div style="font-weight:800; font-size:1.1em; color:#fff">${data.videos.tv[0].title}</div>
                    </div>
                </div>
            `, { x: calcX(3, 0), y: row3Y, w: calcW(3), h: winH });

            this.wm.createWindow('yt_stream', 'Plataforma YouTube', 'VÍDEO', `
                <div class="media-box" onclick="window.open('${data.videos.youtube[0].link}', '_blank')" style="cursor:pointer">
                    <img src="${data.videos.youtube[0].thumb}" class="media-img" loading="eager">
                    <div class="media-overlay">
                        <div style="font-size:0.7em; font-family: monospace; color:var(--accent-red)"><span class="live-indicator"></span> YOUTUBE | GENCAT | GENERAL</div>
                        <div style="font-weight:800; font-size:1.1em; color:#fff">${data.videos.youtube[0].title}</div>
                    </div>
                </div>
            `, { x: calcX(3, 1), y: row3Y, w: calcW(3), h: winH });

            this.wm.createWindow('social_feed', 'Comunitat Xarxes', 'SOCIAL', `
                <div class="edu-app" style="overflow-x:hidden">${data.social.map(renderSocial).join('')}</div>
            `, { x: calcX(3, 2), y: row3Y, w: calcW(3), h: winH });

        } catch(e) { console.error(e); }
    }

    closeWindow(id) { this.wm.closeWindow(id); }
    maximizeWindow(id) { this.wm.maximizeWindow(id); }

    minimizeWindow(id) {
        const win = document.getElementById(id);
        if (!win) return;
        const body = win.querySelector('.window-body');
        if (win.classList.contains('minimized')) {
            win.classList.remove('minimized');
            win.style.height = win.dataset.origH;
            body.style.display = 'block';
        } else {
            win.classList.add('minimized');
            win.dataset.origH = win.style.height; // Save original height
            win.style.height = '38px'; // Header height
            body.style.display = 'none';
        }
    }

    createStickyNote() {
        const note = document.createElement('div');
        note.className = 'sticky-note';
        note.style.left = (Math.random() * 40 + 30) + '%';
        note.style.top = (Math.random() * 30 + 30) + '%';
        note.style.zIndex = ++this.wm.zIndex;
        note.innerHTML = `
            <div class="sticky-header">
                <span style="font-size:0.8em; font-weight:bold;">Nota ràpida</span>
                <i class="fa-solid fa-xmark" style="cursor:pointer;" onclick="this.parentElement.parentElement.remove()"></i>
            </div>
            <textarea class="sticky-textarea" placeholder="Escriu alguna nota..." spellcheck="false"></textarea>
        `;
        document.getElementById('desktop').appendChild(note);
        this.wm.makeDraggable(note);
        note.addEventListener('mousedown', () => note.style.zIndex = ++this.wm.zIndex);
    }
}

window.desktop = new Desktop();
