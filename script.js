// Character Stats State (Points invested)
let points = {
    hp: 0,
    atk: 0,
    speed: 0,
    size: 0,
    cooldown: 0
};

// Base Values
const BASE_STATS = { hp: 100, atk: 5, speed: 5, size: 30 };
const MIN_STATS = { hp: 100, atk: 5, speed: 0, size: 10 };
const MAX_STATS = { speed: 30, size_larger: 100, size_smaller: 10 };

let followerBonus = 0;
let totalBudget = 0;
let remainingPoints = 0;

// 1. Sync Follower Data
async function syncFollowerData() {
    const coreStatus = document.getElementById('core-status');
    try {
        const response = await fetch('/api/followers');
        const data = await response.json();
        followerBonus = data.followers || 0; 
        
        coreStatus.innerText = `● SYNCED: ${followerBonus.toLocaleString()} 에너지 충전됨 (@ball_tournament)`;
        coreStatus.style.color = "var(--neon-blue)";
        
        totalBudget = followerBonus;
        initBudget();
    } catch (err) {
        coreStatus.innerText = "● OFFLINE: 데이터 동기화 실패";
        coreStatus.style.color = "#ff4757";
        totalBudget = 0;
        initBudget();
    }
}

// 2. Budget 관리
function initBudget() {
    const spent = Object.values(points).reduce((a, b) => a + b, 0);
    remainingPoints = totalBudget - spent;
    updateUI();
}

function changeStat(statName, delta) {
    // 30% Limit for Speed and Size (if totalBudget > 0)
    if (totalBudget > 0 && (statName === 'speed' || statName === 'size')) {
        const limit = totalBudget * 0.3;
        if (delta > 0 && points[statName] + delta > limit) {
            alert(`해당 능력치는 전체 에너지의 30% (${Math.floor(limit).toLocaleString()}P)까지만 투자할 수 있습니다.`);
            return;
        }
    }

    // Cost Check
    if (delta > 0 && remainingPoints < delta) {
        alert("에너지가 부족합니다!");
        return;
    }

    // Min Check
    if (delta < 0 && points[statName] + delta < 0) {
        return;
    }

    points[statName] += delta;
    initBudget();
}

function updateUI() {
    // 1. Speed Calculation (0% -> 5, 30% -> 30)
    let speedVal = BASE_STATS.speed;
    if (totalBudget > 0) {
        const speedRatio = points.speed / (totalBudget * 0.3);
        speedVal = BASE_STATS.speed + (speedRatio * (MAX_STATS.speed - BASE_STATS.speed));
    }
    document.getElementById('speed-display').innerText = Math.min(30, speedVal.toFixed(1));

    // 2. Size Calculation (0% -> 30, 30% -> 10 or 100)
    let sizeVal = BASE_STATS.size;
    const sizeDir = document.querySelector('input[name="size-dir"]:checked').value;
    if (totalBudget > 0) {
        const sizeRatio = points.size / (totalBudget * 0.3);
        if (sizeDir === 'smaller') {
            sizeVal = BASE_STATS.size - (sizeRatio * (BASE_STATS.size - MAX_STATS.size_smaller));
        } else {
            sizeVal = BASE_STATS.size + (sizeRatio * (MAX_STATS.size_larger - BASE_STATS.size));
        }
    }
    document.getElementById('size-display').innerText = Math.round(sizeVal);

    // 3. HP/ATK Basic
    document.getElementById('hp-val').innerText = BASE_STATS.hp + points.hp;
    document.getElementById('atk-val').innerText = BASE_STATS.atk + Math.floor(points.atk / 20);

    // 4. Cooldown (Show points)
    document.getElementById('cooldown-points').innerText = points.cooldown.toLocaleString() + "P";

    // 5. Budget Display
    const budgetEl = document.getElementById('budget-val');
    budgetEl.innerText = remainingPoints.toLocaleString();
    budgetEl.style.color = remainingPoints < 0 ? "#ff4757" : "#fff";
}

// 3. View Management
function setView(mode) {
    const submitView = document.getElementById('submit-view');
    const adminView = document.getElementById('admin-view');
    const submitBtn = document.getElementById('submit-mode-btn');
    const adminBtn = document.getElementById('admin-mode-btn');

    if (mode === 'submit') {
        submitView.style.display = 'block';
        adminView.style.display = 'none';
        submitBtn.classList.add('active');
        adminBtn.classList.remove('active');
    } else {
        submitView.style.display = 'none';
        adminView.style.display = 'block';
        submitBtn.classList.remove('active');
        adminBtn.classList.add('active');
        renderAdminMessage();
    }
}

// 4. Form Submission
async function submitForm() {
    const name = document.getElementById('name-input').value;
    const instaId = document.getElementById('insta-input').value;
    const skillDesc = document.getElementById('skill-desc').value;
    const sizeDir = document.querySelector('input[name="size-dir"]:checked').value;
    
    if (!name || !instaId) {
        alert("활동명과 인스타 계정을 입력해 주세요.");
        return;
    }

    // Final calculations for storage
    const speedRatio = totalBudget > 0 ? points.speed / (totalBudget * 0.3) : 0;
    const speedVal = (BASE_STATS.speed + (speedRatio * (MAX_STATS.speed - BASE_STATS.speed))).toFixed(2);
    
    const sizeRatio = totalBudget > 0 ? points.size / (totalBudget * 0.3) : 0;
    let sizeVal = BASE_STATS.size;
    if (sizeDir === 'smaller') {
        sizeVal = BASE_STATS.size - (sizeRatio * (BASE_STATS.size - MAX_STATS.size_smaller));
    } else {
        sizeVal = BASE_STATS.size + (sizeRatio * (MAX_STATS.size_larger - BASE_STATS.size));
    }

    const formData = new FormData();
    formData.append("활동명", name);
    formData.append("인스타그램ID", instaId);
    formData.append("대회계정_팔로워수", followerBonus);
    formData.append("최종_HP", BASE_STATS.hp + points.hp);
    formData.append("최종_ATK", BASE_STATS.atk + Math.floor(points.atk / 20));
    formData.append("최종_SPEED", speedVal);
    formData.append("최종_SIZE", Math.round(sizeVal));
    formData.append("SIZE_방향", sizeDir);
    formData.append("쿨타임_투자포인트", points.cooldown);
    formData.append("스킬설명", skillDesc);

    try {
        const response = await fetch('https://formspree.io/f/mwvnqprn', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            alert("기체 등록 완료! 감사합니다.");
            location.reload();
        } else {
            alert("등록 실패.");
        }
    } catch (err) {
        alert("서버 오류.");
    }
}

function renderAdminMessage() {
    const list = document.getElementById('submissions-list');
    list.innerHTML = `
        <div class="card" style="text-align: center; border-left-color: var(--gold);">
            <div class="panel-label">COMMAND CENTER</div>
            <p class="skill-text">모든 데이터는 Formspree에서 확인하세요.</p>
            <br>
            <button onclick="window.open('https://formspree.io/forms/mwvnqprn/submissions', '_blank')">데이터 확인하기</button>
        </div>
    `;
}

syncFollowerData();
updateUI();
