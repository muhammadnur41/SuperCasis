// ===== FREE KECERMATAN SEQUENTIAL MODE =====
// Replicates premium Tes Angka Hilang experience exactly

let fkSeqPkgs = [], fkSeqIdx = 0, fkAccCorrect = 0, fkAccTotal = 0;
let fkSubName = '', fkSpeed = 0, fkAutoInt = null, fkAutoCountInt = null;
let fkAutoDur = 60, fkCountVal = 0, fkIsSeq = false, fkPkgResults = [];

function launchFreeKecermatanSequential(subName, folder, total) {
    fkSubName = subName;
    fkSpeed = 0;
    fkAutoDur = 60;
    // Show speed selection modal
    const ex = document.getElementById('fkSpeedModal');
    if (ex) ex.remove();
    const m = document.createElement('div');
    m.id = 'fkSpeedModal';
    m.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.8);backdrop-filter:blur(15px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.3s ease;';
    m.innerHTML = `
    <div style="background:linear-gradient(145deg,#141927,#1a2035);border:1px solid rgba(255,255,255,0.12);border-radius:28px;max-width:480px;width:100%;padding:40px 36px;box-shadow:0 30px 80px rgba(0,0,0,0.6);text-align:center;animation:slideUp 0.4s cubic-bezier(0.23,1,0.32,1);">
        <div style="width:68px;height:68px;border-radius:20px;background:linear-gradient(135deg,#3b82f6,#06b6d4);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:1.8rem;color:white;box-shadow:0 10px 30px rgba(59,130,246,0.35);"><i class="fas fa-stopwatch"></i></div>
        <h3 style="font-size:1.3rem;font-weight:800;margin-bottom:6px;color:#f1f5f9;">Tes Kecermatan</h3>
        <p style="color:#94a3b8;font-size:0.85rem;margin-bottom:20px;line-height:1.6;">${fkSubName} — <strong style="color:#f1f5f9;">10 Paket Soal</strong> (acak)</p>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:22px;">
            <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:14px;padding:14px;"><div style="font-size:1.6rem;font-weight:900;color:#3b82f6;">60</div><div style="font-size:0.7rem;color:#94a3b8;margin-top:2px;">Detik / Paket</div></div>
            <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:14px;padding:14px;"><div style="font-size:1.6rem;font-weight:900;color:#10b981;">10</div><div style="font-size:0.7rem;color:#94a3b8;margin-top:2px;">Total Paket</div></div>
        </div>
        <p style="color:#cbd5e1;font-size:0.82rem;font-weight:600;margin-bottom:12px;"><i class="fas fa-tachometer-alt" style="color:#f59e0b;"></i> Pilih Kecepatan Pergantian Soal:</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:24px;">
            ${[1,2,3,4,5].map(s=>`<button onclick="fkSelectSpeed(${s})" id="fkSpdBtn${s}" style="width:58px;height:58px;border-radius:16px;background:rgba(255,255,255,0.04);border:2px solid rgba(255,255,255,0.1);color:white;font-size:1.2rem;font-weight:800;cursor:pointer;transition:all 0.3s;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">${s}<span style="font-size:0.55rem;font-weight:500;opacity:0.5;">detik</span></button>`).join('')}
        </div>
        <button onclick="fkConfirm()" id="fkConfirmBtn" style="width:100%;padding:15px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:white;font-weight:700;font-size:0.95rem;cursor:pointer;border:none;opacity:0.4;pointer-events:none;transition:all 0.3s;box-shadow:0 8px 25px rgba(59,130,246,0.3);display:flex;align-items:center;justify-content:center;gap:10px;font-family:inherit;"><i class="fas fa-play"></i> Mulai Tes</button>
        <button onclick="fkCancel()" style="width:100%;padding:12px;border-radius:16px;background:transparent;color:#64748b;font-weight:600;font-size:0.85rem;cursor:pointer;border:1px solid rgba(255,255,255,0.08);transition:all 0.3s;margin-top:10px;font-family:inherit;">Batal</button>
    </div>`;
    document.body.appendChild(m);

    // Generate 10 random from 20
    const indices = Array.from({length: total}, (_, i) => i + 1);
    for (let i = indices.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [indices[i], indices[j]] = [indices[j], indices[i]]; }
    const slug = subName.toLowerCase().replace(/\s+/g, '-');
    fkSeqPkgs = indices.slice(0, 10).map((n, di) => ({
        file: `app/psikotes/kecermatan/${slug}${n}/${slug}${n}.html`,
        num: n, display: di + 1
    }));
}

function fkSelectSpeed(s) {
    fkSpeed = s;
    for (let i = 1; i <= 5; i++) {
        const b = document.getElementById('fkSpdBtn' + i);
        if (!b) continue;
        if (i === s) { b.style.background = 'linear-gradient(135deg,#f59e0b,#f97316)'; b.style.borderColor = '#f59e0b'; b.style.transform = 'scale(1.1)'; b.style.boxShadow = '0 8px 25px rgba(245,158,11,0.4)'; }
        else { b.style.background = 'rgba(255,255,255,0.04)'; b.style.borderColor = 'rgba(255,255,255,0.1)'; b.style.transform = 'scale(1)'; b.style.boxShadow = 'none'; }
    }
    const cb = document.getElementById('fkConfirmBtn');
    if (cb) { cb.style.opacity = '1'; cb.style.pointerEvents = 'auto'; }
}

function fkConfirm() {
    if (fkSpeed <= 0) return;
    fkAutoDur = 60;
    const m = document.getElementById('fkSpeedModal');
    if (m) m.remove();
    fkStartSession();
}

function fkCancel() {
    fkSpeed = 0; fkIsSeq = false;
    const m = document.getElementById('fkSpeedModal');
    if (m) m.remove();
}

function fkStartSession() {
    fkSeqIdx = 0; fkAccCorrect = 0; fkAccTotal = 0; fkPkgResults = []; fkIsSeq = true;
    document.getElementById('testOverlay').style.display = 'flex';
    const ani = document.getElementById('freeAutoNextIndicator');
    const tmr = document.getElementById('freeTimerTag');
    if (ani) ani.style.display = 'flex';
    if (tmr) tmr.style.display = 'none';
    window.removeEventListener('message', fkHandleMsg);
    window.addEventListener('message', fkHandleMsg);
    fkAddProgressBar();
    fkLoadPackage(0);
}

function fkHandleMsg(e) {
    if (!fkIsSeq || !e.data || e.data.type !== 'packageDone') return;
    fkPkgResults.push({ correct: e.data.correct || 0, total: e.data.total || 0 });
    fkAccCorrect += (e.data.correct || 0);
    fkAccTotal += (e.data.total || 0);
    if (fkSeqIdx < fkSeqPkgs.length - 1) { fkSeqIdx++; fkLoadPackage(fkSeqIdx); }
    else { window.removeEventListener('message', fkHandleMsg); fkShowFinalResult(); }
}

function fkAddProgressBar() {
    const ex = document.getElementById('fkProgBar');
    if (ex) ex.remove();
    const p = document.createElement('div');
    p.id = 'fkProgBar';
    p.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2100;display:flex;flex-direction:column;align-items:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);padding:10px 20px;border-bottom:1px solid rgba(255,255,255,0.1);';
    p.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;width:100%;max-width:800px;gap:15px;">
        <button onclick="fkCloseTest()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:white;padding:6px 14px;border-radius:30px;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;gap:6px;font-family:inherit;flex-shrink:0;"><i class="fas fa-times"></i> Keluar</button>
        <div style="flex:1;text-align:center;">
            <div style="font-weight:700;font-size:0.95rem;color:#f1f5f9;" id="fkSeqTitle">${fkSubName}</div>
            <div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;" id="fkSeqInfo">Paket 1 / ${fkSeqPkgs.length}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <div style="font-size:0.72rem;color:#06b6d4;"><i class="fas fa-clock"></i> 60s/Paket</div>
            <div style="font-size:0.72rem;color:#f59e0b;"><i class="fas fa-forward"></i> ${fkSpeed}s/Soal</div>
        </div>
    </div>
    <div style="width:100%;max-width:800px;margin-top:8px;">
        <div style="display:flex;gap:4px;" id="fkSeqDots">
            ${fkSeqPkgs.map((_, i) => `<div class="fk-dot" data-idx="${i}" style="flex:1;height:6px;border-radius:3px;background:${i === 0 ? 'linear-gradient(135deg,#3b82f6,#06b6d4)' : 'rgba(255,255,255,0.1)'};transition:background 0.3s;"></div>`).join('')}
        </div>
    </div>`;
    document.body.appendChild(p);
}

function fkUpdateProgress(idx) {
    const info = document.getElementById('fkSeqInfo');
    if (info) info.textContent = `Paket ${idx + 1} / ${fkSeqPkgs.length}`;
    document.querySelectorAll('.fk-dot').forEach((d, i) => {
        d.style.background = i < idx ? '#10b981' : i === idx ? 'linear-gradient(135deg,#3b82f6,#06b6d4)' : 'rgba(255,255,255,0.1)';
    });
}

function fkLoadPackage(idx) {
    const pkg = fkSeqPkgs[idx];
    if (!pkg) return;
    fkStopAutoNext();
    document.getElementById('testTitle').textContent = `${fkSubName} — Paket ${idx + 1}/${fkSeqPkgs.length}`;
    document.getElementById('testCat').textContent = 'Kecermatan · Gratis';
    const tn = document.querySelector('#testOverlay .test-nav');
    if (tn) tn.style.display = 'none';
    fkUpdateProgress(idx);
    fkShowTransition(idx, () => {
        const iframe = document.getElementById('testIframe');
        const sep = pkg.file.includes('?') ? '&' : '?';
        iframe.src = pkg.file + sep + 'packageTime=60&questionSpeed=' + fkSpeed;
        iframe.onload = function() { setTimeout(() => fkInjectIframe(iframe), 100); };
    });
}

function fkShowTransition(idx, cb) {
    const ex = document.getElementById('fkTransition');
    if (ex) ex.remove();
    const o = document.createElement('div');
    o.id = 'fkTransition';
    o.style.cssText = 'position:fixed;inset:0;z-index:2050;background:rgba(0,0,0,0.9);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease;';
    const isFirst = idx === 0;
    const title = isFirst ? 'Tes Dimulai!' : `Paket ${idx + 1}`;
    const sub = isFirst ? `${fkSubName} — ${fkSeqPkgs.length} Paket` : `${fkSubName} — ${fkSeqPkgs.length - idx} paket tersisa`;
    o.innerHTML = `
    <div style="text-align:center;animation:slideUp 0.4s cubic-bezier(0.23,1,0.32,1);">
        <div style="width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,#3b82f6,#06b6d4);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:2rem;color:white;box-shadow:0 15px 40px rgba(59,130,246,0.4);"><i class="fas ${isFirst ? 'fa-play' : 'fa-arrow-right'}"></i></div>
        <h2 style="font-size:2rem;font-weight:800;color:#f1f5f9;margin-bottom:8px;">${title}</h2>
        <p style="color:#94a3b8;font-size:0.95rem;margin-bottom:6px;">${sub}</p>
        <p style="color:#64748b;font-size:0.8rem;">Kecepatan: <span style="color:#06b6d4;font-weight:700;">${fkSpeed} detik</span> per soal</p>
        <div style="margin-top:20px;display:flex;gap:4px;justify-content:center;">
            ${fkSeqPkgs.map((_, i) => `<div style="width:24px;height:4px;border-radius:2px;background:${i < idx ? '#10b981' : i === idx ? '#3b82f6' : 'rgba(255,255,255,0.15)'};"></div>`).join('')}
        </div>
    </div>`;
    document.body.appendChild(o);
    setTimeout(() => { o.style.opacity = '0'; o.style.transition = 'opacity 0.2s'; setTimeout(() => { o.remove(); if (cb) cb(); }, 200); }, 400);
}

function fkInjectIframe(iframe) {
    try {
        const win = iframe.contentWindow;
        if (!win || !win.quizData || !win.showResult) return;
        const style = win.document.createElement('style');
        style.textContent = '.sidebar-numbers,#sidebar-nav{display:none!important}.nav-buttons{display:none!important}#finish-quiz-btn{display:none!important}#back-to-result-btn{display:none!important}#result-screen{display:none!important}.main-wrapper{justify-content:center}.quiz-container{max-width:900px;margin:0 auto}';
        win.document.head.appendChild(style);
        win.selectAnswer = function(i) { if (win.isReviewMode) return; win.userAnswers[win.currentIdx] = i; win.showQuestion(); };
        win.showResult = function() {};
        win.renderStatus = function() {};
        fkStartAutoNext(win);
    } catch(e) { console.log('FK inject skipped:', e.message); }
}

function fkStartAutoNext(win) {
    fkCountVal = fkAutoDur;
    fkUpdateCountdown(fkCountVal);
    fkResetBar();
    fkAutoCountInt = setInterval(() => { fkCountVal--; fkUpdateCountdown(Math.max(0, fkCountVal)); }, 1000);
    fkAutoInt = setInterval(() => {
        try {
            if (!win || win.closed) { fkStopAutoNext(); return; }
            if (win.isReviewMode) { fkStopAutoNext(); return; }
            if (win.currentIdx < win.quizData.length - 1) {
                win.currentIdx++; win.showQuestion();
                fkCountVal = fkAutoDur; fkUpdateCountdown(fkCountVal); fkResetBar();
            } else {
                fkStopAutoNext();
                fkAccumulateScores(win);
                if (fkSeqIdx < fkSeqPkgs.length - 1) { fkSeqIdx++; fkLoadPackage(fkSeqIdx); }
                else { fkShowFinalResult(); }
            }
        } catch(e) { fkStopAutoNext(); }
    }, fkAutoDur * 1000);
}

function fkStopAutoNext() {
    if (fkAutoInt) { clearInterval(fkAutoInt); fkAutoInt = null; }
    if (fkAutoCountInt) { clearInterval(fkAutoCountInt); fkAutoCountInt = null; }
    const ind = document.getElementById('freeAutoNextIndicator');
    if (ind) ind.style.display = 'none';
}

function fkUpdateCountdown(s) {
    const el = document.getElementById('freeAutoNextCountdown');
    if (el) el.textContent = s + 's';
}

function fkResetBar() {
    const fill = document.getElementById('freeAutoNextFill');
    if (!fill) return;
    fill.style.transition = 'none'; fill.style.width = '0%';
    fill.offsetWidth;
    fill.style.transition = `width ${fkAutoDur}s linear`; fill.style.width = '100%';
}

function fkAccumulateScores(win) {
    try {
        let correct = 0;
        const total = win.quizData.length;
        win.userAnswers.forEach((ans, i) => { if (ans === win.quizData[i].a) correct++; });
        fkPkgResults.push({ correct, total });
        fkAccCorrect += correct;
        fkAccTotal += total;
    } catch(e) {}
}

function fkShowFinalResult() {
    const score = fkAccTotal > 0 ? Math.round((fkAccCorrect / fkAccTotal) * 100) : 0;
    const wrong = fkAccTotal - fkAccCorrect;
    let gc, gt, gi;
    if (score >= 90) { gc = '#10b981'; gt = 'Sangat Baik'; gi = 'fa-trophy'; }
    else if (score >= 75) { gc = '#3b82f6'; gt = 'Baik'; gi = 'fa-medal'; }
    else if (score >= 60) { gc = '#f59e0b'; gt = 'Cukup'; gi = 'fa-star-half-alt'; }
    else { gc = '#ef4444'; gt = 'Perlu Latihan'; gi = 'fa-redo'; }

    const pb = document.getElementById('fkProgBar'); if (pb) pb.remove();
    document.getElementById('testOverlay').style.display = 'none';
    document.getElementById('testIframe').src = 'about:blank';
    const tn = document.querySelector('#testOverlay .test-nav'); if (tn) tn.style.display = 'flex';
    fkStopAutoNext();
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    const tmr = document.getElementById('freeTimerTag'); if (tmr) tmr.style.display = 'flex';

    // Build per-package chart data
    const pkgLabels = fkPkgResults.map((_, i) => 'P' + (i + 1));
    const pkgData = fkPkgResults.map(p => p.correct);

    // Per-package summary HTML
    const pkgSummaryHtml = fkPkgResults.map((p, i) => {
        const pct = p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0;
        const dotColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
        return `<div style="text-align:center;padding:6px 8px;background:rgba(255,255,255,0.03);
            border-radius:10px;border:1px solid rgba(255,255,255,0.06);min-width:50px;">
            <div style="font-size:0.65rem;color:#64748b;margin-bottom:2px;">P${i+1}</div>
            <div style="font-size:0.85rem;font-weight:800;color:${dotColor};">${p.correct}</div>
        </div>`;
    }).join('');

    const rm = document.createElement('div');
    rm.id = 'fkFinalResult';
    rm.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.85);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.3s ease;overflow-y:auto;';
    rm.innerHTML = `
    <div style="display:flex;gap:24px;max-width:960px;width:100%;align-items:stretch;
        animation:slideUp 0.5s cubic-bezier(0.23,1,0.32,1);flex-wrap:wrap;justify-content:center;">
        
        <!-- LEFT: Score Card -->
        <div style="background:linear-gradient(145deg,#141927,#1a2035);border:1px solid rgba(255,255,255,0.12);border-radius:32px;flex:1;min-width:300px;max-width:380px;padding:40px 32px;box-shadow:0 30px 80px rgba(0,0,0,0.6),0 0 50px rgba(59,130,246,0.1);text-align:center;display:flex;flex-direction:column;align-items:center;">
            
            <!-- Icon -->
            <div style="width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,${gc},${gc}88);display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:2rem;color:white;box-shadow:0 12px 35px ${gc}55;"><i class="fas ${gi}"></i></div>
            
            <!-- Title -->
            <h2 style="font-size:1.4rem;font-weight:800;color:#f1f5f9;margin-bottom:4px;">Tes Selesai!</h2>
            <p style="color:#94a3b8;font-size:0.82rem;margin-bottom:24px;">${fkSubName} — 10 Paket</p>
            
            <!-- Score Circle -->
            <div style="position:relative;width:130px;height:130px;margin-bottom:20px;">
                <svg width="130" height="130" style="transform:rotate(-90deg);"><circle cx="65" cy="65" r="55" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/><circle cx="65" cy="65" r="55" fill="none" stroke="${gc}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${Math.round(score*3.46)} 346" style="transition:stroke-dasharray 1.5s cubic-bezier(0.23,1,0.32,1);"/></svg>
                <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:2.2rem;font-weight:900;color:${gc};">${score}</span><span style="font-size:0.65rem;color:#64748b;font-weight:600;">/ 100</span></div>
            </div>
            
            <!-- Grade Badge -->
            <div style="background:${gc}22;color:${gc};padding:7px 18px;border-radius:50px;font-weight:700;font-size:0.82rem;border:1px solid ${gc}44;margin-bottom:24px;">${gt}</div>
            
            <!-- Stats -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;width:100%;background:rgba(255,255,255,0.05);border-radius:18px;overflow:hidden;margin-bottom:24px;">
                <div style="background:#141927;padding:16px 10px;"><div style="font-size:1.4rem;font-weight:800;color:#10b981;">${fkAccCorrect}</div><div style="font-size:0.68rem;color:#64748b;margin-top:2px;">Benar</div></div>
                <div style="background:#141927;padding:16px 10px;"><div style="font-size:1.4rem;font-weight:800;color:#ef4444;">${wrong}</div><div style="font-size:0.68rem;color:#64748b;margin-top:2px;">Salah</div></div>
                <div style="background:#141927;padding:16px 10px;"><div style="font-size:1.4rem;font-weight:800;color:#3b82f6;">${fkAccTotal}</div><div style="font-size:0.68rem;color:#64748b;margin-top:2px;">Total Soal</div></div>
            </div>
            
            <!-- Button -->
            <button onclick="fkCloseResult()" style="width:100%;padding:14px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:white;font-weight:700;font-size:0.95rem;cursor:pointer;border:none;font-family:inherit;box-shadow:0 8px 25px rgba(59,130,246,0.3);display:flex;align-items:center;justify-content:center;gap:10px;"><i class="fas fa-check-circle"></i> Kembali ke Menu</button>
        </div>
        
        <!-- RIGHT: Chart Panel -->
        <div style="background:linear-gradient(145deg,#141927,#1a2035);border:1px solid rgba(255,255,255,0.12);border-radius:32px;flex:1.2;min-width:340px;max-width:540px;padding:36px 32px;box-shadow:0 30px 80px rgba(0,0,0,0.6),0 0 50px rgba(59,130,246,0.1);display:flex;flex-direction:column;">
            
            <!-- Chart Title -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
                <i class="fas fa-chart-line" style="color:#8b5cf6;font-size:1.1rem;"></i>
                <span style="font-size:1rem;font-weight:700;color:#e2e8f0;">Grafik Jawaban Benar per Paket</span>
            </div>
            
            <!-- Chart Container -->
            <div style="flex:1;position:relative;min-height:250px;background:rgba(0,0,0,0.15);border-radius:20px;padding:20px;">
                <canvas id="fkFinalChart"></canvas>
            </div>
            
            <!-- Per-package summary -->
            <div style="display:flex;gap:6px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
                ${pkgSummaryHtml}
            </div>
        </div>
    </div>`;
    document.body.appendChild(rm);

    // Render Chart.js line chart
    const _fkChartLabels = pkgLabels;
    const _fkChartData = pkgData;
    const _fkChartPkgResults = JSON.parse(JSON.stringify(fkPkgResults));
    const _fkChartMax = fkPkgResults.length > 0 ? Math.max(Math.max(...fkPkgResults.map(p => p.total)), 50) : 50;

    setTimeout(function() {
        const canvas = document.getElementById('fkFinalChart');
        if (!canvas || typeof Chart === 'undefined') return;
        
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: _fkChartLabels,
                datasets: [{
                    label: 'Jawaban Benar',
                    data: _fkChartData,
                    borderColor: '#8b5cf6',
                    backgroundColor: function(context) {
                        var chart = context.chart;
                        var ca = chart.chartArea;
                        if (!ca) return 'rgba(139,92,246,0.1)';
                        var gradient = chart.ctx.createLinearGradient(0, ca.bottom, 0, ca.top);
                        gradient.addColorStop(0, 'rgba(139,92,246,0.02)');
                        gradient.addColorStop(1, 'rgba(139,92,246,0.15)');
                        return gradient;
                    },
                    borderWidth: 3,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#1a2035',
                    pointBorderWidth: 3,
                    pointRadius: 7,
                    pointHoverRadius: 10,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(139,92,246,0.3)',
                        borderWidth: 1,
                        cornerRadius: 12,
                        padding: 12,
                        callbacks: {
                            label: function(c) {
                                var pkg = _fkChartPkgResults[c.dataIndex];
                                return pkg ? 'Benar: ' + pkg.correct + ' / ' + pkg.total : 'Benar: ' + c.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: _fkChartMax,
                        ticks: { color: '#64748b', font: { size: 11 }, stepSize: 10 },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8', font: { size: 12, weight: 'bold' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }, 200);

    fkIsSeq = false;
}

function fkCloseResult() {
    const m = document.getElementById('fkFinalResult');
    if (m) { m.style.opacity = '0'; m.style.transition = 'opacity 0.3s'; setTimeout(() => m.remove(), 300); }
    fkSeqIdx = 0; fkAccCorrect = 0; fkAccTotal = 0;
    const tn = document.querySelector('#testOverlay .test-nav'); if (tn) tn.style.display = 'flex';
    // Back to kecermatan sub menu
    if (typeof showPsiSub === 'function' && currentPsiGroup !== null) showPsiSub(currentPsiGroup);
}

function fkCloseTest() {
    const wasSeq = fkIsSeq;
    fkStopAutoNext();
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    document.getElementById('testOverlay').style.display = 'none';
    document.getElementById('testIframe').src = 'about:blank';
    const pb = document.getElementById('fkProgBar'); if (pb) pb.remove();
    const tn = document.querySelector('#testOverlay .test-nav'); if (tn) tn.style.display = 'flex';
    const tmr = document.getElementById('freeTimerTag'); if (tmr) tmr.style.display = 'flex';
    const ani = document.getElementById('freeAutoNextIndicator'); if (ani) ani.style.display = 'none';
    fkIsSeq = false; fkSeqIdx = 0; fkAccCorrect = 0; fkAccTotal = 0;
    if (wasSeq && typeof showPsiSub === 'function' && currentPsiGroup !== null) showPsiSub(currentPsiGroup);
}
