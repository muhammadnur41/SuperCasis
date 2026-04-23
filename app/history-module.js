// ========== RIWAYAT NILAI MODULE (Override) ==========

function getCategoryBadgeColor(item) {
    const pc = item.parentCategory;
    if (pc === 'kecerdasan') return '#a78bfa';
    if (pc === 'kecermatan') return '#60a5fa';
    if (pc === 'kepribadian') return '#34d399';
    if (pc === 'tryout') return '#fb923c';
    if (pc === 'akademik') {
        const c = (item.category || '').toLowerCase();
        if (c.includes('matematika')) return '#a78bfa';
        if (c.includes('inggris')) return '#60a5fa';
        if (c.includes('umum')) return '#34d399';
        if (c.includes('wawasan')) return '#fb923c';
    }
    return '#94a3b8';
}

function getFilteredHistory(history, activeFilter) {
    const psikotesCats = ['kecerdasan','kecermatan','kepribadian','tryout'];
    if (activeFilter === 'semua') return history;
    if (activeFilter === 'psikotes') return history.filter(h => psikotesCats.includes(h.parentCategory));
    if (activeFilter === 'akademik') return history.filter(h => h.parentCategory === 'akademik');
    if (psikotesCats.includes(activeFilter)) return history.filter(h => h.parentCategory === activeFilter);
    if (activeFilter === 'matematika') return history.filter(h => h.parentCategory === 'akademik' && (h.category||'').toLowerCase().includes('matematika'));
    if (activeFilter === 'inggris') return history.filter(h => h.parentCategory === 'akademik' && (h.category||'').toLowerCase().includes('inggris'));
    if (activeFilter === 'umum') return history.filter(h => h.parentCategory === 'akademik' && (h.category||'').toLowerCase().includes('umum'));
    if (activeFilter === 'wawasan') return history.filter(h => h.parentCategory === 'akademik' && (h.category||'').toLowerCase().includes('wawasan'));
    return history;
}

function showScoreHistory(activeFilter) {
    activeFilter = activeFilter || 'semua';
    const history = getScoreHistory();
    const existing = document.getElementById('scoreHistoryModal');
    if (existing) existing.remove();
    if (window._kecermatanChartInstance) { window._kecermatanChartInstance.destroy(); window._kecermatanChartInstance = null; }

    const filtered = getFilteredHistory(history, activeFilter);
    let mainTab = 'semua';
    if (['psikotes','kecerdasan','kecermatan','kepribadian','tryout'].includes(activeFilter)) mainTab = 'psikotes';
    if (['akademik','matematika','inggris','umum','wawasan'].includes(activeFilter)) mainTab = 'akademik';

    const sT = filtered.length;
    const sA = sT > 0 ? Math.round(filtered.reduce((a,b) => a+b.score, 0) / sT) : 0;
    const sM = sT > 0 ? Math.max(...filtered.map(h => h.score)) : 0;

    let tRows = '';
    if (sT === 0) {
        tRows = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:12px;opacity:0.5;"></i>Belum ada riwayat tes.</td></tr>';
    } else {
        filtered.forEach((item, idx) => {
            const d = new Date(item.date);
            const ds = d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'});
            const ts = d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
            const sc = item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444';
            const cc = getCategoryBadgeColor(item);
            const catLabel = item.category || 'Lainnya';
            const hd = item.packageResults && item.packageResults.length > 0;
            const db = hd ? `<button onclick="showKecermatanDetailChart(${idx},'${activeFilter}')" style="background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:white;border:none;padding:5px 12px;border-radius:50px;font-size:0.7rem;font-weight:600;cursor:pointer;font-family:inherit;"><i class="fas fa-chart-line"></i> Detail</button>` : '<span style="color:#475569;font-size:0.72rem;">—</span>';
            tRows += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);" onmouseenter="this.style.background='rgba(139,92,246,0.06)'" onmouseleave="this.style.background='transparent'">
                <td class="rn-td rn-td-date">${ds}<br><span style="color:#64748b;font-size:0.7rem;">${ts}</span></td>
                <td class="rn-td rn-td-name">${item.testName}</td>
                <td class="rn-td"><span style="background:${cc}18;color:${cc};padding:3px 10px;border-radius:50px;font-size:0.7rem;font-weight:600;border:1px solid ${cc}30;white-space:nowrap;">${catLabel}</span></td>
                <td class="rn-td" style="text-align:center;color:#94a3b8;">${item.correct}/${item.total}</td>
                <td class="rn-td" style="text-align:center;"><span style="background:${sc};color:white;padding:4px 12px;border-radius:50px;font-weight:800;font-size:0.82rem;min-width:40px;display:inline-block;">${item.score}</span></td>
                <td class="rn-td" style="text-align:center;">${db}</td></tr>`;
        });
    }

    const mainTabs = [{key:'semua',label:'Semua',icon:'fa-list'},{key:'psikotes',label:'Psikotes',icon:'fa-puzzle-piece'},{key:'akademik',label:'Akademik',icon:'fa-graduation-cap'}];

    let subHtml = '';
    if (mainTab === 'psikotes') {
        const s = [{key:'psikotes',label:'Semua',icon:'fa-layer-group'},{key:'kecerdasan',label:'Kecerdasan',icon:'fa-brain'},{key:'kecermatan',label:'Kecermatan',icon:'fa-eye'},{key:'kepribadian',label:'Kepribadian',icon:'fa-user-check'}];
        subHtml = buildSubTabs(s, activeFilter, '#8b5cf6');
    } else if (mainTab === 'akademik') {
        const s = [{key:'akademik',label:'Semua',icon:'fa-layer-group'},{key:'matematika',label:'Matematika',icon:'fa-calculator'},{key:'inggris',label:'B. Inggris',icon:'fa-language'},{key:'umum',label:'Peng. Umum',icon:'fa-globe'},{key:'wawasan',label:'Wawasan',icon:'fa-flag'}];
        subHtml = buildSubTabs(s, activeFilter, '#3b82f6');
    }

    const m = document.createElement('div');
    m.id = 'scoreHistoryModal';
    m.className = 'rn-modal-overlay';
    m.onclick = function(e) { if (e.target === m) closeScoreHistory(); };

    m.innerHTML = `<style>
.rn-modal-overlay{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:12px;animation:fadeIn .3s}
.rn-modal{background:linear-gradient(145deg,#141927,#1a2035);border:1px solid rgba(255,255,255,0.1);border-radius:24px;max-width:820px;width:100%;max-height:90vh;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.5),0 0 40px rgba(139,92,246,0.08);animation:slideUp .4s cubic-bezier(.23,1,.32,1);display:flex;flex-direction:column}
.rn-header{background:linear-gradient(135deg,rgba(139,92,246,0.18),rgba(59,130,246,0.18));padding:22px 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.rn-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.05);flex-shrink:0}
.rn-stat{background:#141927;padding:14px;text-align:center}
.rn-stat-val{font-size:1.3rem;font-weight:800}
.rn-stat-lbl{font-size:0.68rem;color:#64748b;margin-top:2px}
.rn-tabs{padding:12px 20px 6px;flex-shrink:0;display:flex;gap:6px;overflow-x:auto}
.rn-tab{padding:7px 16px;border-radius:50px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#64748b;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .3s;display:flex;align-items:center;gap:6px;font-family:inherit}
.rn-tab.active{border-color:rgba(139,92,246,0.5);background:linear-gradient(135deg,rgba(139,92,246,0.22),rgba(59,130,246,0.22));color:#c4b5fd}
.rn-subtabs{padding:4px 20px 10px;flex-shrink:0;display:flex;gap:5px;overflow-x:auto}
.rn-subtab{padding:5px 12px;border-radius:50px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);color:#64748b;font-size:0.72rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .3s;display:flex;align-items:center;gap:5px;font-family:inherit}
.rn-subtab.active{background:rgba(139,92,246,0.18);border-color:rgba(139,92,246,0.35);color:#c4b5fd}
.rn-table-wrap{overflow-y:auto;flex:1;padding:0 4px}
.rn-table{width:100%;border-collapse:collapse}
.rn-th{padding:11px 12px;text-align:left;font-size:0.68rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.rn-th-c{text-align:center}
.rn-td{padding:12px;font-size:0.8rem}
.rn-td-date{white-space:nowrap}
.rn-td-name{font-weight:600}
.rn-close{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:white;width:36px;height:36px;border-radius:11px;cursor:pointer;font-size:.95rem;display:flex;align-items:center;justify-content:center;transition:all .3s}
.rn-close:hover{background:#ef4444;border-color:#ef4444}
@media(max-width:600px){
 .rn-modal{border-radius:18px;max-height:95vh}
 .rn-header{padding:16px 16px}
 .rn-tabs,.rn-subtabs{padding-left:14px;padding-right:14px}
 .rn-td{padding:8px 6px;font-size:0.72rem}
 .rn-th{padding:8px 6px;font-size:0.62rem}
 .rn-td-name{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .rn-stat-val{font-size:1.1rem}
}
</style>
<div class="rn-modal">
 <div class="rn-header">
  <div style="display:flex;align-items:center;gap:12px;">
   <div style="width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:1.1rem;box-shadow:0 8px 20px rgba(139,92,246,0.3);"><i class="fas fa-chart-line"></i></div>
   <div><h3 style="font-size:1.15rem;font-weight:800;margin:0;">Riwayat Nilai</h3><p style="color:#94a3b8;font-size:0.75rem;margin:3px 0 0;">${history.length} hasil tes tercatat</p></div>
  </div>
  <button onclick="closeScoreHistory()" class="rn-close"><i class="fas fa-times"></i></button>
 </div>
 ${sT > 0 ? `<div class="rn-stats">
  <div class="rn-stat"><div class="rn-stat-val" style="color:#10b981;">${sT}</div><div class="rn-stat-lbl">Total Tes</div></div>
  <div class="rn-stat"><div class="rn-stat-val" style="color:#3b82f6;">${sA}</div><div class="rn-stat-lbl">Rata-rata</div></div>
  <div class="rn-stat"><div class="rn-stat-val" style="color:#f59e0b;">${sM}</div><div class="rn-stat-lbl">Skor Tertinggi</div></div>
 </div>` : ''}
 <div class="rn-tabs">${mainTabs.map(t => `<button onclick="showScoreHistory('${t.key}')" class="rn-tab ${mainTab===t.key?'active':''}"><i class="fas ${t.icon}" style="font-size:0.7rem;"></i> ${t.label}</button>`).join('')}</div>
 ${subHtml}
 <div class="rn-table-wrap">
  <table class="rn-table"><thead><tr style="border-bottom:2px solid rgba(255,255,255,0.08);position:sticky;top:0;background:#141927;z-index:1;">
   <th class="rn-th">Tanggal</th><th class="rn-th">Nama Tes</th><th class="rn-th">Kategori</th><th class="rn-th rn-th-c">B/S</th><th class="rn-th rn-th-c">Skor</th><th class="rn-th rn-th-c">Detail</th>
  </tr></thead><tbody>${tRows}</tbody></table>
 </div>
</div>`;

    document.body.appendChild(m);
    document.body.style.overflow = 'hidden';
}

function buildSubTabs(tabs, activeFilter, color) {
    return `<div class="rn-subtabs">${tabs.map(s => `<button onclick="showScoreHistory('${s.key}')" class="rn-subtab ${s.key===activeFilter?'active':''}"><i class="fas ${s.icon}" style="font-size:0.62rem;"></i> ${s.label}</button>`).join('')}</div>`;
}
