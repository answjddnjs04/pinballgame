// 캐릭터 스탯 상태
let points = { hp: 0, atk: 0, speed: 0, size: 0, cooldown: 0 };
const BASE_STATS = { hp: 100, atk: 10, speed: 5, size: 30 };
const MIN_STATS = { hp: 100, atk: 10, speed: 0, size: 10 };
const MAX_STATS = { speed: 30, size_larger: 100, size_smaller: 10 };

let followerCount = 0;
let totalBudget = 0;
let remainingPoints = 0;
let currentSort = 'latest';
let sessionLiked = new Set(); // 현재 세션에서 좋아요를 누른 캐릭터 ID 저장

// [DB 관리]
function getSubmissions() {
    const saved = localStorage.getItem('bt_submissions');
    return saved ? JSON.parse(saved) : [];
}

function saveSubmission(data) {
    const subs = getSubmissions();
    subs.push({
        ...data,
        id: Date.now(),
        likes: 0,
        comments: [],
        produced: false, // 기본값은 미제작
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('bt_submissions', JSON.stringify(subs));
}

// 1. Sync Follower Data (기존 유지)
async function syncFollowerData() {
    const coreStatus = document.getElementById('core-status');
    try {
        const response = await fetch('/api/followers');
        const data = await response.json();
        followerCount = data.followers || 0;
        totalBudget = followerCount * 10; 
        coreStatus.innerText = `● SYNCED: ${followerCount.toLocaleString()} 에너지 충전됨 (@ball_tournament)`;
        coreStatus.style.color = "var(--neon-blue)";
        initBudget();
    } catch (err) {
        coreStatus.innerText = "● OFFLINE: 데이터 동기화 실패";
        coreStatus.style.color = "#ff4757";
        totalBudget = 0; initBudget();
    }
}

function initBudget() {
    const spent = Object.values(points).reduce((a, b) => a + b, 0);
    remainingPoints = totalBudget - spent;
    updateUI();
}

function changeStat(statName, delta) {
    if (totalBudget > 0 && (statName === 'speed' || statName === 'size')) {
        const limit = totalBudget * 0.3;
        if (delta > 0 && (points[statName] + delta) > limit) {
            alert(`해당 능력치는 전체 에너지의 30% (${limit.toFixed(1)}P)까지만 투자할 수 있습니다!`);
            return;
        }
    }
    if (delta > 0 && remainingPoints < delta) { alert("에너지가 부족합니다!"); return; }
    if (delta < 0 && points[statName] + delta < 0) return;
    points[statName] += delta;
    initBudget();
}

function updateUI() {
    let speedVal = BASE_STATS.speed;
    const speedLimit = totalBudget * 0.3;
    if (totalBudget > 0) speedVal = BASE_STATS.speed + ((points.speed / (speedLimit || 1)) * (MAX_STATS.speed - BASE_STATS.speed));
    document.getElementById('speed-display').innerText = Math.min(30, speedVal.toFixed(1));

    let sizeVal = BASE_STATS.size;
    const sizeDir = document.querySelector('input[name="size-dir"]:checked').value;
    const sizeLimit = totalBudget * 0.3;
    if (totalBudget > 0) {
        const sizeRatio = points.size / (sizeLimit || 1);
        if (sizeDir === 'smaller') sizeVal = BASE_STATS.size - (sizeRatio * (BASE_STATS.size - MAX_STATS.size_smaller));
        else sizeVal = BASE_STATS.size + (sizeRatio * (MAX_STATS.size_larger - BASE_STATS.size));
    }
    document.getElementById('size-display').innerText = Math.round(sizeVal);
    document.getElementById('hp-val').innerText = BASE_STATS.hp + points.hp;
    document.getElementById('atk-val').innerText = (BASE_STATS.atk + (points.atk * 0.1)).toFixed(1);
    const budgetEl = document.getElementById('budget-val');
    budgetEl.innerText = remainingPoints.toLocaleString();
}

function setView(mode) {
    const views = ['submit-view', 'gallery-view', 'admin-view'];
    views.forEach(v => document.getElementById(v).style.display = v.startsWith(mode) ? 'block' : 'none');
    
    document.querySelectorAll('.view-toggle button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${mode}-mode-btn`).classList.add('active');
    
    if (mode === 'gallery') renderGallery();
}

// [관리자 인증]
function checkAdminPw() {
    const pw = document.getElementById('admin-pw').value;
    if (pw === '2004Moon0820!') {
        document.getElementById('admin-login-box').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        renderAdminList();
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
}

// [갤러리 렌더링]
function renderGallery() {
    const producedList = document.getElementById('produced-list');
    const proposedList = document.getElementById('proposed-list');
    let subs = getSubmissions();
    
    // 정렬
    if (currentSort === 'latest') subs.sort((a, b) => b.id - a.id);
    else subs.sort((a, b) => b.likes - a.likes);

    const produced = subs.filter(s => s.produced);
    const proposed = subs.filter(s => !s.produced);

    producedList.innerHTML = produced.length ? produced.map(sub => renderCard(sub)).join('') : '<p style="text-align:center; opacity:0.5;">제작 완료된 챔피언이 없습니다.</p>';
    proposedList.innerHTML = proposed.length ? proposed.map(sub => renderCard(sub)).join('') : '<p style="text-align:center; opacity:0.5;">제작 대기 중인 신청작이 없습니다.</p>';
}

function renderCard(sub) {
    const isLiked = sessionLiked.has(sub.id);
    return `
        <div class="card" style="border-left-color: ${sub.produced ? 'var(--gold)' : 'var(--neon-blue)'}">
            ${sub.produced ? '<div class="produced-badge">PRODUCED</div>' : ''}
            <div class="card-header">
                <div>
                    <div class="char-name">${sub.활동명}</div>
                    <div class="char-insta">${sub.인스타그램ID}</div>
                </div>
            </div>
            <div class="stat-row-display">
                <span class="stat-tag">❤️ HP ${sub.최종_HP}</span>
                <span class="stat-tag">⚔️ ATK ${sub.최종_ATK}</span>
                <span class="stat-tag">⚡ SPD ${sub.최종_SPEED}</span>
                <span class="stat-tag">📏 SIZE ${sub.최종_SIZE}</span>
            </div>
            <div class="skill-desc-box">${sub.스킬설명 || "설명이 없습니다."}</div>
            <div class="interaction-bar">
                <button class="like-btn ${isLiked ? 'disabled' : ''}" onclick="addLike(${sub.id})">🔥 LIKE ${sub.likes}</button>
                <div class="comment-count">💬 댓글 ${sub.comments.length}개</div>
            </div>
            <div class="comment-section">
                <div class="comment-list">${sub.comments.map(c => `<div class="comment-item">● ${c}</div>`).join('')}</div>
                <div class="comment-input-row">
                    <input type="text" id="cmt-${sub.id}" class="comment-input" placeholder="댓글 입력...">
                    <button class="sort-btn" onclick="addComment(${sub.id})">등록</button>
                </div>
            </div>
        </div>
    `;
}

// [관리자 리스트 렌더링]
function renderAdminList() {
    const list = document.getElementById('admin-submission-list');
    let subs = getSubmissions();
    subs.sort((a, b) => b.id - a.id);

    list.innerHTML = subs.map(sub => `
        <div class="card admin-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div class="char-name">${sub.활동명} (${sub.인스타그램ID})</div>
                    <p style="font-size: 11px; opacity: 0.6; margin: 5px 0;">신청일: ${new Date(sub.timestamp).toLocaleString()}</p>
                </div>
                <label style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 8px; cursor: pointer;">
                    <input type="checkbox" ${sub.produced ? 'checked' : ''} onchange="toggleProduced(${sub.id})"> 제작 완료
                </label>
            </div>
            <div class="skill-desc-box" style="margin-top: 10px;">${sub.스킬설명}</div>
            <button onclick="deleteSubmission(${sub.id})" style="background:#ff4757; border:none; color:white; padding:5px 10px; border-radius:4px; font-size:11px; cursor:pointer;">데이터 삭제</button>
        </div>
    `).join('');
}

function toggleProduced(id) {
    let subs = getSubmissions();
    const target = subs.find(s => s.id === id);
    if (target) {
        target.produced = !target.produced;
        localStorage.setItem('bt_submissions', JSON.stringify(subs));
        renderAdminList();
    }
}

function deleteSubmission(id) {
    if (confirm("정말 이 데이터를 삭제하시겠습니까?")) {
        let subs = getSubmissions();
        subs = subs.filter(s => s.id !== id);
        localStorage.setItem('bt_submissions', JSON.stringify(subs));
        renderAdminList();
    }
}

function sortGallery(type) {
    currentSort = type;
    document.querySelectorAll('.sort-btn').forEach(btn => {
        if (btn.innerText.includes('순')) btn.classList.remove('active');
    });
    event.target.classList.add('active');
    renderGallery();
}

function addLike(id) {
    if (sessionLiked.has(id)) return;
    let subs = getSubmissions();
    const target = subs.find(s => s.id === id);
    if (target) {
        target.likes++;
        sessionLiked.add(id);
        localStorage.setItem('bt_submissions', JSON.stringify(subs));
        renderGallery();
    }
}

function addComment(id) {
    const input = document.getElementById(`cmt-${id}`);
    if (!input.value.trim()) return;
    let subs = getSubmissions();
    const target = subs.find(s => s.id === id);
    if (target) {
        target.comments.push(input.value.trim());
        localStorage.setItem('bt_submissions', JSON.stringify(subs));
        renderGallery();
    }
}

async function submitForm() {
    const name = document.getElementById('name-input').value;
    const instaId = document.getElementById('insta-input').value;
    const skillDesc = document.getElementById('skill-desc').value;
    if (!name || !instaId) { alert("이름과 인스타 계정을 입력해 주세요."); return; }

    const speedLimit = totalBudget * 0.3;
    const speedVal = (BASE_STATS.speed + ((points.speed / (speedLimit || 1)) * (MAX_STATS.speed - BASE_STATS.speed))).toFixed(1);
    
    const sizeLimit = totalBudget * 0.3;
    let sizeVal = BASE_STATS.size;
    const sizeRatio = points.size / (sizeLimit || 1);
    if (document.querySelector('input[name="size-dir"]:checked').value === 'smaller') sizeVal = BASE_STATS.size - (sizeRatio * (BASE_STATS.size - MAX_STATS.size_smaller));
    else sizeVal = BASE_STATS.size + (sizeRatio * (MAX_STATS.size_larger - BASE_STATS.size));

    const data = { 활동명: name, 인스타그램ID: instaId, 최종_HP: BASE_STATS.hp + points.hp, 최종_ATK: (BASE_STATS.atk + (points.atk * 0.1)).toFixed(1), 최종_SPEED: speedVal, 최종_SIZE: Math.round(sizeVal), 스킬설명: skillDesc };
    saveSubmission(data);
    alert("캐릭터 제작 신청이 완료되었습니다!");
    setView('gallery');
}

syncFollowerData();
updateUI();
