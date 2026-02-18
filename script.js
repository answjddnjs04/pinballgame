// Character Stats State
let stats = {
    hp: 100,
    atk: 5,
    spd: 5,
    size: 25
};

const MIN_STATS = { hp: 100, atk: 5, spd: 5, size: 20 };
const MAX_SPD = 15;

const STAT_COSTS = {
    hp: 1,    // 1 point per 1 HP
    atk: 20,  // 20 points per 1 ATK
    spd: 50,  // 50 points per 1 SPD
    size: 10  // 10 points per 1 SIZE
};

let totalBudget = 1000;
let remainingPoints = 1000;

// Initialize Budget based on Followers
function initBudget() {
    const followers = parseInt(document.getElementById('follower-input').value) || 0;
    
    // Base 1000 + 1 point per follower
    totalBudget = 1000 + followers;
    
    // Calculate spent points
    const spent = 
        (stats.hp - MIN_STATS.hp) * STAT_COSTS.hp +
        (stats.atk - MIN_STATS.atk) * STAT_COSTS.atk +
        (stats.spd - MIN_STATS.spd) * STAT_COSTS.spd +
        (stats.size - MIN_STATS.size) * STAT_COSTS.size;
        
    remainingPoints = totalBudget - spent;
    updateUI();
}

// Change Stat Logic
function changeStat(statName, delta) {
    const costPerUnit = STAT_COSTS[statName];
    const totalCost = delta * costPerUnit;

    // Check if enough budget for increase
    if (delta > 0 && remainingPoints < totalCost) {
        alert("포인트가 부족합니다!");
        return;
    }

    // Check minimum requirements for decrease
    if (delta < 0 && stats[statName] + delta < MIN_STATS[statName]) {
        return;
    }

    // Special case for SPD max
    if (statName === 'spd' && delta > 0 && stats.spd + delta > MAX_SPD) {
        alert("속도는 최대 15까지만 가능합니다!");
        return;
    }

    // Update stat and budget
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
    
    // Alert if over budget (shouldn't happen with button logic but good for safety)
    if (remainingPoints < 0) {
        budgetEl.style.color = "#ff4757";
    } else {
        budgetEl.style.color = "#fff";
    }
}

// View Management
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

// Form Submission to Formspree
async function submitForm() {
    const name = document.getElementById('name-input').value;
    const instaId = document.getElementById('insta-input').value;
    const followers = parseInt(document.getElementById('follower-input').value) || 0;
    const skillDesc = document.getElementById('skill-desc').value;
    
    if (!name || !instaId) {
        alert("이름과 인스타 계정을 입력해 주세요.");
        return;
    }

    if (remainingPoints < 0) {
        alert("포인트 한도를 초과했습니다. 스탯을 조정해 주세요.");
        return;
    }

    const formData = new FormData();
    formData.append("활동명", name);
    formData.append("인스타그램ID", instaId);
    formData.append("팔로워수", followers);
    formData.append("HP", stats.hp);
    formData.append("ATK", stats.atk);
    formData.append("SPD", stats.spd);
    formData.append("SIZE", stats.size);
    formData.append("남은포인트", remainingPoints);
    formData.append("스킬설명", skillDesc);

    try {
        const response = await fetch('https://formspree.io/f/mwvnqprn', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            alert("감사합니다. 캐릭터 심사 후 제작이 완료되어 출전이 확정되면 DM으로 연락드리겠습니다!");
            location.reload(); // Reset everything
        } else {
            alert("등록에 실패했습니다. 다시 시도해 주세요.");
        }
    } catch (err) {
        console.error(err);
        alert("서버 연결에 실패했습니다.");
    }
}

function renderAdminMessage() {
    const list = document.getElementById('submissions-list');
    list.innerHTML = `
        <div class="card" style="text-align: center; border-left-color: var(--gold);">
            <div class="panel-label">관리자 대시보드</div>
            <p class="skill-text">제출된 모든 캐릭터 정보는 아래 링크에서 확인하세요.</p>
            <br>
            <button onclick="window.open('https://formspree.io/forms/mwvnqprn/submissions', '_blank')">FORMSPREE 데이터 확인하기</button>
        </div>
    `;
}

// Initialize
updateUI();
