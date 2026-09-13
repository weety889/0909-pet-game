(function () {
  'use strict';

  /* ============================================================
   * ★★★ 配 置 区 ★★★
   * ============================================================ */

  // 【1】角色图片（和 HTML 同目录，直接写文件名）
  const CONFIG_IMG_MIKOTO = 'mikoto.png';
  const CONFIG_IMG_JOHN   = 'john.png';

  // 【2】角色名字
  const CONFIG_NAME_MIKOTO = 'mikoto';
  const CONFIG_NAME_JOHN   = 'john';

  // ============================================================
  // 【3】mikoto 的对话
  // ============================================================
  const MIKOTO_TEXTS_NORMAL = [
    '你好呀~',
    '今天天气不错呢。',
    '我为什么会在这？',
    '不好，昨天的文件还..!'
  ];

  const MIKOTO_TEXTS_ANGRY = [
    '啊，请不要这么做。',
    '....再这样我可是要生气了哦。',
    '你这是什么意思呀...'
  ];

  const MIKOTO_TEXTS_FORGIVE = [
    '诶诶，我也没有生气啦，毕竟对别人发火是不好的事呢。',
    '下次再这样我还是会生气的哦！',
    '嗯，重新和好吧！'
  ];

  // ============================================================
  // 【4】john 的对话
  // ============================================================
  const JOHN_TEXTS_NORMAL = [
    '.....',
    'boku...在哪？',
    '你在做什么？'
  ];

  const JOHN_TEXTS_ANGRY = [
    '臭小鬼！烦死了！',
    '💢💢💢',
    '我要给你点颜色看看'
  ];

  const JOHN_TEXTS_FORGIVE = [
    '......'
  ];

  // ★ mikoto 生气时，john 会自动说的话
  const JOHN_TEXTS_DEFEND = [
    '不要欺负博库！',
    '啊啊啊今天老子就为你大开杀戒！！！',
    '离他远点！'
  ];

  // ============================================================
  // 【5】碰到一起时的对话
  // ============================================================
  const MIKOTO_TEXTS_BUMP = [
    '哎呀！..你是，另一个我？',
    '嘿嘿，你和我长得一模一样呢。',
    '...为什么要做那种事...',
    '噗哧..你的名字听着像狗似的ww'
  ];

  const JOHN_TEXTS_BUMP = [
    'boku..!',
    '我能为你做点什么吗？',
    '对不起...都是我的错。',
    'bokubokubokuboku!!!'
  ];

  // ============================================================
  // 【6】其它参数
  // ============================================================
  const CONFIG_MOVE_STEP = 6;
  const CONFIG_MOVE_INTERVAL = 30;
  const CONFIG_ANGRY_THRESHOLD = 4;
  const CONFIG_ANGER_COOLDOWN = 1500;
  const CONFIG_BUMP_DISTANCE = 90;
  const CONFIG_BUBBLE_DURATION = 2200;

  // 护主生气持续时间（比 john 自己生气的短）
  const CONFIG_DEFEND_ANGER_DURATION = 1500;

  /* ============================================================
   * 配置区结束
   * ============================================================ */

  const screenEl = document.getElementById('screen');
  const charA = document.getElementById('charA');
  const charB = document.getElementById('charB');
  const imgA = document.getElementById('imgA');
  const imgB = document.getElementById('imgB');
  const bubbleA = document.getElementById('bubbleA');
  const bubbleB = document.getElementById('bubbleB');
  const btnSelectA = document.getElementById('btnSelectA');
  const btnSelectB = document.getElementById('btnSelectB');
  const dpadBtns = document.querySelectorAll('.dpad button');
  const resetBtn = document.getElementById('resetBtn');

  btnSelectA.textContent = CONFIG_NAME_MIKOTO;
  btnSelectB.textContent = CONFIG_NAME_JOHN;

  const FALLBACK_IMG_A = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23F5A9B8'/%3E%3Ccircle cx='35' cy='40' r='7' fill='%23333'/%3E%3Ccircle cx='65' cy='40' r='7' fill='%23333'/%3E%3Ccircle cx='35' cy='38' r='2.5' fill='white'/%3E%3Ccircle cx='65' cy='38' r='2.5' fill='white'/%3E%3Cpath d='M38 68 Q50 78 62 68' stroke='%23333' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";
  const FALLBACK_IMG_B = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%237EC8C8'/%3E%3Ccircle cx='35' cy='40' r='7' fill='%23333'/%3E%3Ccircle cx='65' cy='40' r='7' fill='%23333'/%3E%3Ccircle cx='35' cy='38' r='2.5' fill='white'/%3E%3Ccircle cx='65' cy='38' r='2.5' fill='white'/%3E%3Cpath d='M38 68 Q50 78 62 68' stroke='%23333' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";

  function setImage(imgEl, src, fallback) {
    if (!src) { imgEl.src = fallback; return; }
    imgEl.onerror = function () {
      imgEl.onerror = null;
      imgEl.src = fallback;
    };
    imgEl.src = src;
  }
  setImage(imgA, CONFIG_IMG_MIKOTO, FALLBACK_IMG_A);
  setImage(imgB, CONFIG_IMG_JOHN, FALLBACK_IMG_B);

  // ★ 同步 CSS 里的 .character 尺寸（110px）
  const CHAR_SIZE = 110;

  const state = {
    active: 'A',
    pos: { A: { x: 20, y: 20 }, B: { x: 20, y: 20 } },
    char: {
      A: { clickCount: 0, isAngry: false, bubbleTimer: null, angerTimer: null },
      B: { clickCount: 0, isAngry: false, bubbleTimer: null, angerTimer: null }
    },
    bumpCooldown: false,
    pressing: { up: false, down: false, left: false, right: false },
    moveTimer: null
  };

  function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function getScreenSize() { return { w: screenEl.clientWidth, h: screenEl.clientHeight }; }
  function clampPosition(x, y) {
    const { w, h } = getScreenSize();
    return { x: Math.max(0, Math.min(w - CHAR_SIZE, x)), y: Math.max(0, Math.min(h - CHAR_SIZE, y)) };
  }
  function applyPosition(which) {
    const el = which === 'A' ? charA : charB;
    el.style.left = state.pos[which].x + 'px';
    el.style.top = state.pos[which].y + 'px';
  }
  function showBubble(which, text) {
    const bubble = which === 'A' ? bubbleA : bubbleB;
    const st = state.char[which];
    if (st.bubbleTimer) clearTimeout(st.bubbleTimer);
    bubble.textContent = text;
    bubble.classList.add('show');
    st.bubbleTimer = setTimeout(() => {
      bubble.classList.remove('show');
      st.bubbleTimer = null;
    }, CONFIG_BUBBLE_DURATION);
  }

  function getPool(which, type) {
    if (which === 'A') {
      if (type === 'normal')  return MIKOTO_TEXTS_NORMAL;
      if (type === 'angry')   return MIKOTO_TEXTS_ANGRY;
      if (type === 'forgive') return MIKOTO_TEXTS_FORGIVE;
      if (type === 'bump')    return MIKOTO_TEXTS_BUMP;
    } else {
      if (type === 'normal')  return JOHN_TEXTS_NORMAL;
      if (type === 'angry')   return JOHN_TEXTS_ANGRY;
      if (type === 'forgive') return JOHN_TEXTS_FORGIVE;
      if (type === 'bump')    return JOHN_TEXTS_BUMP;
    }
    return ['...'];
  }

  // ============================================================
  // 生气状态控制
  // ============================================================
  function setAngry(which, angry, options) {
    const opts = options || {};
    const el = which === 'A' ? charA : charB;
    const st = state.char[which];

    if (angry) {
      if (st.isAngry) return;

      el.classList.add('angry');
      st.isAngry = true;

      // mikoto 生气 → john 护主
      if (which === 'A') {
        setTimeout(() => {
          showBubble('B', randomItem(JOHN_TEXTS_DEFEND));
        }, 500);
        setTimeout(() => {
          setAngry('B', true, { duration: CONFIG_DEFEND_ANGER_DURATION });
        }, 600);
      }

      const duration = opts.duration || CONFIG_ANGER_COOLDOWN;

      if (st.angerTimer) clearTimeout(st.angerTimer);
      st.angerTimer = setTimeout(() => {
        setAngry(which, false);
        st.clickCount = 0;
        showBubble(which, randomItem(getPool(which, 'forgive')));
      }, duration);
    } else {
      el.classList.remove('angry');
      st.isAngry = false;
      if (st.angerTimer) { clearTimeout(st.angerTimer); st.angerTimer = null; }
    }
  }

  function handleCharClick(which) {
    const st = state.char[which];

    if (st.isAngry) {
      showBubble(which, randomItem(getPool(which, 'angry')));
      if (st.angerTimer) clearTimeout(st.angerTimer);
      st.angerTimer = setTimeout(() => {
        setAngry(which, false);
        st.clickCount = 0;
        showBubble(which, randomItem(getPool(which, 'forgive')));
      }, CONFIG_ANGER_COOLDOWN);
      return;
    }

    st.clickCount += 1;
    if (st.clickCount >= CONFIG_ANGRY_THRESHOLD) {
      setAngry(which, true);
      showBubble(which, randomItem(getPool(which, 'angry')));
    } else {
      showBubble(which, randomItem(getPool(which, 'normal')));
    }
  }

  screenEl.addEventListener('pointerdown', function (e) {
    const rect = screenEl.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const checkA = px >= state.pos.A.x && px <= state.pos.A.x + CHAR_SIZE &&
                   py >= state.pos.A.y && py <= state.pos.A.y + CHAR_SIZE;
    const checkB = px >= state.pos.B.x && px <= state.pos.B.x + CHAR_SIZE &&
                   py >= state.pos.B.y && py <= state.pos.B.y + CHAR_SIZE;
    if (checkA && checkB) handleCharClick('B');
    else if (checkA) handleCharClick('A');
    else if (checkB) handleCharClick('B');
  });

  function selectChar(which) {
    state.active = which;
    btnSelectA.classList.toggle('active', which === 'A');
    btnSelectB.classList.toggle('active', which === 'B');
  }
  btnSelectA.addEventListener('click', () => selectChar('A'));
  btnSelectB.addEventListener('click', () => selectChar('B'));

  function moveActive(dir) {
    const which = state.active;
    const p = state.pos[which];
    let nx = p.x, ny = p.y;
    if (dir === 'up') ny -= CONFIG_MOVE_STEP;
    else if (dir === 'down') ny += CONFIG_MOVE_STEP;
    else if (dir === 'left') nx -= CONFIG_MOVE_STEP;
    else if (dir === 'right') nx += CONFIG_MOVE_STEP;
    const clamped = clampPosition(nx, ny);
    p.x = clamped.x; p.y = clamped.y;
    applyPosition(which);
    checkBump();
  }

  function tickMove() {
    const { up, down, left, right } = state.pressing;
    if (up) moveActive('up');
    if (down) moveActive('down');
    if (left) moveActive('left');
    if (right) moveActive('right');
  }
  function startMoveLoop() {
    if (state.moveTimer) return;
    state.moveTimer = setInterval(tickMove, CONFIG_MOVE_INTERVAL);
  }
  function stopMoveLoopIfIdle() {
    const any = Object.values(state.pressing).some(Boolean);
    if (!any && state.moveTimer) {
      clearInterval(state.moveTimer);
      state.moveTimer = null;
    }
  }

  dpadBtns.forEach(btn => {
    const dir = btn.dataset.dir;
    const press = (e) => {
      e.preventDefault();
      state.pressing[dir] = true;
      btn.classList.add('pressed');
      moveActive(dir);
      startMoveLoop();
    };
    const release = (e) => {
      e.preventDefault();
      state.pressing[dir] = false;
      btn.classList.remove('pressed');
      stopMoveLoopIfIdle();
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });

  const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  document.addEventListener('keydown', (e) => {
    const dir = keyMap[e.key];
    if (!dir) return;
    e.preventDefault();
    if (!state.pressing[dir]) {
      state.pressing[dir] = true;
      moveActive(dir);
      startMoveLoop();
    }
  });
  document.addEventListener('keyup', (e) => {
    const dir = keyMap[e.key];
    if (!dir) return;
    state.pressing[dir] = false;
    stopMoveLoopIfIdle();
  });

  function checkBump() {
    if (state.bumpCooldown) return;
    const a = state.pos.A, b = state.pos.B;
    const dx = (a.x + CHAR_SIZE / 2) - (b.x + CHAR_SIZE / 2);
    const dy = (a.y + CHAR_SIZE / 2) - (b.y + CHAR_SIZE / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < CONFIG_BUMP_DISTANCE) {
      state.bumpCooldown = true;
      showBubble('A', randomItem(MIKOTO_TEXTS_BUMP));
      setTimeout(() => showBubble('B', randomItem(JOHN_TEXTS_BUMP)), 300);
      setTimeout(() => { state.bumpCooldown = false; }, 2500);
    }
  }

  resetBtn.addEventListener('click', () => {
    ['A', 'B'].forEach(which => {
      setAngry(which, false);
      state.char[which].clickCount = 0;
      if (state.char[which].bubbleTimer) clearTimeout(state.char[which].bubbleTimer);
      (which === 'A' ? bubbleA : bubbleB).classList.remove('show');
    });
    const { w, h } = getScreenSize();
    state.pos.A = clampPosition(10, 10);
    state.pos.B = clampPosition(w - CHAR_SIZE - 10, h - CHAR_SIZE - 10);
    applyPosition('A');
    applyPosition('B');
  });

  function init() {
    requestAnimationFrame(() => {
      const { w, h } = getScreenSize();
      state.pos.A = clampPosition(10, 10);
      state.pos.B = clampPosition(w - CHAR_SIZE - 10, h - CHAR_SIZE - 10);
      applyPosition('A');
      applyPosition('B');
    });
  }
  window.addEventListener('resize', () => {
    ['A', 'B'].forEach(which => {
      const p = state.pos[which];
      const clamped = clampPosition(p.x, p.y);
      p.x = clamped.x; p.y = clamped.y;
      applyPosition(which);
    });
  });
  init();
})();