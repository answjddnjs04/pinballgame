// Character Stats State
let stats = {
    hp: 100,
    atk: 5,
    spd: 5,
    size: 20 // 25에서 20으로 수정 (MIN_STATS와 동일하게)
};

const MIN_STATS = { hp: 100, atk: 5, spd: 5, size: 20 };
const MAX_SPD = 15;

const STAT_COSTS = {
    hp: 1,
    atk: 20,
    spd: 50,
    size: 10
};

let baseBudget = 0; // 기본 스탯 1000 제거 -> 0으로 설정
let followerBonus = 0;
let totalBudget = 0;
let remainingPoints = 0;

// 1. Cloudflare Functions를 통해 실시간 팔로워 데이터 가져오기
async function syncFollowerData() {
    const coreStatus = document.getElementById('core-status');
    const TARGET_ID = 'ball_tournament';
    
    try {
        // 백엔드 함수 (/api/followers) 호출
        const response = await fetch('/api/followers');
        const data = await response.json();
        
        // 실제 인스타그램 팔로워 수 반영
        followerBonus = data.followers || 0; 
        
        coreStatus.innerText = `● SYNCED: ${followerBonus.toLocaleString()} 에너지 충전됨 (@${TARGET_ID})`;
        coreStatus.style.color = "var(--neon-blue)";
        
        totalBudget = baseBudget + followerBonus;
        initBudget();
    } catch (err) {
        console.error("동기화 실패:", err);
        coreStatus.innerText = "● OFFLINE: 데이터 동기화 실패";
        coreStatus.style.color = "#ff4757";
        
        totalBudget = 0;
        initBudget();
    }
}

// 2. Budget 관리 및 UI 업데이트
function initBudget() {
    // 사용한 포인트 계산
    const spent = 
        (stats.hp - MIN_STATS.hp) * STAT_COSTS.hp +
        (stats.atk - MIN_STATS.atk) * STAT_COSTS.atk +
        (stats.spd - MIN_STATS.spd) * STAT_COSTS.spd +
        (stats.size - MIN_STATS.size) * STAT_COSTS.size;
        
    remainingPoints = totalBudget - spent;
    updateUI();
}

function changeStat(statName, delta) {
    const costPerUnit = STAT_COSTS[statName];
    const totalCost = delta * costPerUnit;

    if (delta > 0 && remainingPoints < totalCost) {
        alert("에너지가 부족합니다! ball_tournament 팔로워 수만큼만 스탯을 찍을 수 있습니다.");
        return;
    }

    if (delta < 0 && stats[statName] + delta < MIN_STATS[statName]) {
        return;
    }

    if (statName === 'spd' && delta > 0 && stats.spd + delta > MAX_SPD) {
        alert("속도는 최대 15까지만 가능합니다!");
        return;
    }

    stats[statName] += delta;
    remainingPoints -= totalCost;
    updateUI();
}

function updateUI() {
    document.getElementById('hp-val').innerText = stats.hp;
    document.getElementById('atk-val').innerText = stats.atk;
    document.getElementById('spd-val').innerText = stats.spd;
    document.getElementById('size-val').innerText = stats.size;
    
    const budgetEl = document.getElementById('budget-val');
    budgetEl.innerText = remainingPoints.toLocaleString();
    
    if (remainingPoints < 0) {
        budgetEl.style.color = "#ff4757";
    } else {
        budgetEl.style.color = "#fff";
    }
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
    
    if (!name || !instaId) {
        alert("활동명과 본인의 인스타 계정을 입력해 주세요.");
        return;
    }

    if (remainingPoints < 0) {
        alert("포인트를 초과 사용했습니다.");
        return;
    }

    const formData = new FormData();
    formData.append("활동명", name);
    formData.append("인스타그램ID", instaId);
    formData.append("대회계정_팔로워수", followerBonus);
    formData.append("HP", stats.hp);
    formData.append("ATK", stats.atk);
    formData.append("SPD", stats.spd);
    formData.append("SIZE", stats.size);
    formData.append("스킬설명", skillDesc);

    try {
        const response = await fetch('https://formspree.io/f/mwvnqprn', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            alert("감사합니다. 캐릭터 심사 후 제작이 완료되어 출전이 확정되면 DM으로 연락드리겠습니다!");
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
            <div class="panel-label">관리자 대시보드</div>
            <p class="skill-text">제출된 캐릭터 정보는 Formspree에서 확인하세요.</p>
            <br>
            <button onclick="window.open('https://formspree.io/forms/mwvnqprn/submissions', '_blank')">데이터 확인하기</button>
        </div>
    `;
}

// 5. Initialize
syncFollowerData();
updateUI();
