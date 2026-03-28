const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const osUtils = require('os-utils');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// API: System Info
app.get('/api/sys-info', (req, res) => {
    osUtils.cpuUsage((v) => {
        res.json({
            cpu: (v * 100).toFixed(2),
            memFree: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
            memTotal: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
            uptime: Math.floor(os.uptime()),
            platform: os.platform(),
            architecture: os.arch()
        });
    });
});

// API: List Files
app.get('/api/files', (req, res) => {
    fs.readdir('.', (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to read directory' });
        
        const fileList = files.map(file => {
            const stats = fs.statSync(file);
            return {
                name: file,
                isDirectory: stats.isDirectory(),
                size: stats.size,
                mtime: stats.mtime
            };
        });
        res.json(fileList);
    });
});

// API: Create File
app.post('/api/files', (req, res) => {
    const { filename, content } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename is required' });
    
    fs.writeFile(filename, content || '', (err) => {
        if (err) return res.status(500).json({ error: 'Failed to create file' });
        res.json({ success: true, message: `File ${filename} created.` });
    });
});

// API: Delete File
app.delete('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    if (!filename) return res.status(400).json({ error: 'Filename is required' });
    
    // Security check: prevents deleting things outside root or sensitive files
    if (filename === 'server.js' || filename === 'package.json') {
        return res.status(403).json({ error: 'Protection: Sensitive files cannot be deleted.' });
    }

    fs.unlink(filename, (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete file' });
        res.json({ success: true, message: `File ${filename} deleted.` });
    });
});

// API: Education News (Cataluña)
app.get('/api/edu-news', (req, res) => {
    res.json({
        gencat: [
            { type: 'Notícia', title: 'Nou Calendari Escolar 2026-27', link: 'https://educacio.gencat.cat/ca/departament/publicacions/colleccions/calendari-escolar/' },
            { type: 'Tràmit', title: 'Preinscripció 2026: Dates Oficials ESO', link: 'https://preinscripcio.gencat.cat/ca/estudis/eso/informat/calendari/' }
        ],
        unions: {
            ustec: [
                { title: 'Resum reunió condicions laborals', link: 'https://www.sindicat.net/2026/03/27/resum-de-la-reunio-amb-el-conseller-dalmau-el-dijous-26-de-marc/' }
            ],
            ccoo_ugt: [
                { title: 'Dictamen crític calendari escolar', link: 'https://www.ccoo.cat/educacio/noticies/consell-deducacio-de-catalunya-un-dictamen-sobre-lordre-de-calendari-que-no-compartim/' }
            ]
        },
        pau_info: [
            { title: 'Dates PAU 2026: 9, 10 i 11 de juny', link: 'https://universitats.gencat.cat/ca/pau/dia-prova/' },
            { title: 'PAU 2026: Horari Detallat (PDF Oficial)', link: 'https://www.gencat.cat/recercaiuniversitats/accesuniversitat/centres/PAU_2026_horari.pdf' }
        ],
        scholarships: [
            { title: 'Portal Ajuts i Beques Gencat', link: 'https://educacio.gencat.cat/ca/serveis-tramits/beques/' },
            { title: 'Ajuts Menjador Municipal', link: 'https://www.edubcn.cat/ca/alumnat_i_familia/beques_ajuts_i_subvencions/ajuts_de_menjador' }
        ],
        inclusion_info: [
            { title: 'Reforç Inclusiva - Millora de ràtios', link: 'https://www.ccoo.cat/educacio/' },
            { title: 'Atenció a la Diversitat (NEAE)', link: 'https://xtec.gencat.cat/ca/centres/procediments/atencio-diversitat/' }
        ],
        social: [
            { platform: 'Twitter', user: '@educaciocat', comment: 'Calendari confirmat: El curs 26-27 començarà el 8 de setembre.', thumb: 'https://educacio.gencat.cat/web/resources/fwk/comuns/img/avatar.jpg', link: 'https://twitter.com/educaciocat' },
            { platform: 'USTEC', user: 'USTEC-STEs', comment: 'Reunió amb el conseller. Vagues...', thumb: 'https://www.sindicat.net/wp-content/uploads/2023/06/comunicat-megafon-3d.png', link: 'https://www.sindicat.net/2026/03/27/resum-de-la-reunio-amb-el-conseller-dalmau-el-dijous-26-de-marc/' },
            { platform: 'CCOO', user: 'CCOO Educació', comment: 'Critica ordre de nou calendari escolar.', thumb: 'https://www.ccoo.cat/educacio/wp-content/uploads/sites/139/2026/03/postals-2025-20261.png', link: 'https://www.ccoo.cat/educacio/noticies/consell-deducacio-de-catalunya-un-dictamen-sobre-lordre-de-calendari-que-no-compartim/' }
        ],
        borsa_docent: [
            { title: 'Obertura Borsa Treball 2026-2027', desc: 'Consulta requisits formatius per a l\'ingrés excepcional.', link: 'https://educacio.gencat.cat/ca/arees-actuacio/professors-personal-centres/' },
            { title: 'Adjudicacions d\'estiu provisionals', desc: 'Resolució d\'assignacions al juliol 2026.', link: 'https://educacio.gencat.cat/ca/arees-actuacio/professors-personal-centres/' },
            { title: 'Concurs Oposició 2026: Resultats', desc: 'Consulta els tribunals i els aspirants seleccionats.', link: 'https://educacio.gencat.cat/ca/arees-actuacio/professors-personal-centres/' }
        ],
        teacher_links: [
            { title: 'Portal ATRI Gencat', desc: 'Gestió de nòmines, baixes i currículum informatiu.', link: 'https://atri.gencat.cat/' },
            { title: 'Gestió Esfera Educació', desc: 'Avaluacions, actes, SAGA i currículum.', link: 'https://esfera.educacio.gencat.cat/' },
            { title: 'Odissea XTEC', desc: 'Plataforma de formació per als claustres i docents.', link: 'https://odissea.xtec.cat/' },
            { title: 'Correu i Apps XTEC', desc: 'Accés al GSuite i a la bústia electrònica corporativa.', link: 'https://xtec.gencat.cat/' }
        ],
        dogc_feed: [
            { date: 'VUI 09:00', title: 'RESOLUCIÓ EDU/1042/2026 - Convocatòria de plantilles docents.', type: 'PERSONAL', link: 'https://dogc.gencat.cat/' },
            { date: 'DIV 14:30', title: 'ORDRE EDU/921/2026 - Aprovació de les proves PAU i currículum de Batxillerat.', type: 'NORMATIVA', link: 'https://dogc.gencat.cat/' },
            { date: 'DIM 10:15', title: 'RESOLUCIÓ EDU/890/2026 - Subvencions per a l\'escola rural.', type: 'PRESSUPOST', link: 'https://dogc.gencat.cat/' }
        ],
        personal_tasks: [
            { task: 'Avaluar expedients de 2n Batxillerat', status: 'pending', urgent: true },
            { task: 'Revisar actes de la reunió de departament', status: 'pending', urgent: false },
            { task: 'Tancar notes T3 al sistema Esfera', status: 'done', urgent: false },
            { task: 'Preparar documentació de preinscripció', status: 'done', urgent: false }
        ],
        ins_santaeulalia: [
            { platform: 'Instagram', user: '@ins_santaeulalia', comment: 'Gran dia de portes obertes 26/27! Veniu a conèixer el nostre projecte.', link: 'https://www.instagram.com/ins_santaeulalia/' },
            { platform: 'X', user: '@santaeulaliains', comment: 'Els nostres alumnes de 4t d\'ESO guanyen el premi d\'innovació científica STEAM a Terrassa!', link: 'https://twitter.com/santaeulaliains' },
            { platform: 'Facebook', user: 'INS Santa Eulàlia', comment: 'Avui claustre extraordinari amb l\'AFA per debatre les millores de pati aprovades.', link: 'https://www.facebook.com/instsantaeulalia' }
        ],
        videos: {
            tv: [
                { title: '3Cat: Notícies d\'Educació Catalunya', link: 'https://www.3cat.cat/3catinfo/educacio/', thumb: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80' }
            ],
            youtube: [
                { title: 'Canal Oficial YouTube Educació', link: 'https://www.youtube.com/results?search_query=educaci%C3%B3', thumb: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80' }
            ]
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
