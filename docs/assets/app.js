const revealItems = Array.from(document.querySelectorAll('.reveal'));

revealItems.forEach((el, index) => {
  const delay = el.dataset.delay ? Number(el.dataset.delay) : index * 90;
  el.style.transitionDelay = `${delay}ms`;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((el) => observer.observe(el));

const emitCompanion = (type, detail = {}) => {
  window.dispatchEvent(new CustomEvent(`companion:${type}`, { detail }));
};

const progressBar = document.querySelector('.progress-bar');
if (progressBar) {
  let lastMilestone = 0;
  const updateProgress = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = height > 0 ? (scrollTop / height) * 100 : 0;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
    const milestone = Math.floor(progress / 25) * 25;
    if (milestone >= 25 && milestone !== lastMilestone) {
      lastMilestone = milestone;
      emitCompanion('progress', { progress: milestone });
    }
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress);
}

const modeButtons = Array.from(document.querySelectorAll('[data-mode-toggle]'));
if (modeButtons.length > 0) {
  const setMode = (mode) => {
    document.body.dataset.mode = mode;
    modeButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.modeToggle === mode);
    });
    emitCompanion('mode', { mode });
  };
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.modeToggle));
  });
  setMode(document.body.dataset.mode || 'learn');
}

const accordionButtons = Array.from(document.querySelectorAll('[data-accordion-toggle]'));
accordionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.accordion-item');
    if (!item) return;
    const isOpen = item.classList.toggle('is-open');
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const icon = button.querySelector('[data-accordion-icon]');
    if (icon) {
      icon.textContent = isOpen ? '-' : '+';
    }
    emitCompanion('accordion', { open: isOpen });
  });
});

const steppers = Array.from(document.querySelectorAll('[data-stepper]'));
steppers.forEach((stepper) => {
  const panels = Array.from(stepper.querySelectorAll('[data-step]'));
  const indexEl = stepper.querySelector('[data-stepper-index]');
  let currentIndex = 0;

  const render = () => {
    panels.forEach((panel, index) => {
      const isActive = index === currentIndex;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
    if (indexEl) {
      indexEl.textContent = `${currentIndex + 1} / ${panels.length}`;
    }
  };

  const next = () => {
    currentIndex = (currentIndex + 1) % panels.length;
    render();
    emitCompanion('step', { direction: 'next', index: currentIndex + 1, total: panels.length });
  };

  const prev = () => {
    currentIndex = (currentIndex - 1 + panels.length) % panels.length;
    render();
    emitCompanion('step', { direction: 'prev', index: currentIndex + 1, total: panels.length });
  };

  const nextButton = stepper.querySelector('[data-stepper-action="next"]');
  const prevButton = stepper.querySelector('[data-stepper-action="prev"]');
  if (nextButton) nextButton.addEventListener('click', next);
  if (prevButton) prevButton.addEventListener('click', prev);

  render();
});

const drillBanks = Array.from(document.querySelectorAll('[data-drill-bank]'));
drillBanks.forEach((bank) => {
  const dataId = bank.dataset.drillBank;
  const dataEl = document.getElementById(dataId);
  if (!dataEl) return;
  let drills = [];
  try {
    drills = JSON.parse(dataEl.textContent);
  } catch (error) {
    return;
  }
  const output = bank.querySelector('[data-drill-output]');
  const button = bank.querySelector('[data-drill-button]');
  if (!output || !button || drills.length === 0) return;

  const render = (drill) => {
    output.innerHTML = `
      <h4>${drill.title}</h4>
      <p>${drill.prompt}</p>
      <div class="chip-row">${drill.tags.map((tag) => `<span class="chip">${tag}</span>`).join('')}</div>
    `;
  };

  render(drills[0]);
  button.addEventListener('click', () => {
    const random = drills[Math.floor(Math.random() * drills.length)];
    render(random);
    emitCompanion('drill', { title: random.title });
  });
});

const calculators = Array.from(document.querySelectorAll('[data-calc]'));
calculators.forEach((calculator) => {
  const output = calculator.querySelector('[data-calc-output]');
  if (!output) return;
  const inputs = Array.from(calculator.querySelectorAll('input'));
  let lastOutput = '';

  const compute = () => {
    const values = Object.fromEntries(inputs.map((input) => [input.name, parseFloat(input.value)]));
    if (calculator.dataset.calc === 'capm') {
      const { rf, muM, varM, cov } = values;
      if ([rf, muM, varM, cov].some((val) => Number.isNaN(val))) {
        output.textContent = 'Enter all inputs to compute beta and expected return.';
        return;
      }
      const beta = cov / varM;
      const expected = rf + beta * (muM - rf);
      output.textContent = `beta = ${beta.toFixed(3)} | E[R_i] = ${expected.toFixed(4)}`;
      if (output.textContent !== lastOutput) {
        lastOutput = output.textContent;
        emitCompanion('calc', { type: 'capm', beta, expected });
      }
    }
    if (calculator.dataset.calc === 'cara') {
      const { mu, rf, alpha, sigma2 } = values;
      if ([mu, rf, alpha, sigma2].some((val) => Number.isNaN(val))) {
        output.textContent = 'Enter all inputs to compute optimal demand.';
        return;
      }
      const demand = (mu - rf) / (alpha * sigma2);
      output.textContent = `Optimal demand x* = ${demand.toFixed(4)}`;
      if (output.textContent !== lastOutput) {
        lastOutput = output.textContent;
        emitCompanion('calc', { type: 'cara', demand });
      }
    }
  };

  inputs.forEach((input) => input.addEventListener('input', compute));
  compute();
});

const checklistGroups = Array.from(document.querySelectorAll('[data-checklist]'));
checklistGroups.forEach((group) => {
  const key = `checklist:${group.dataset.checklist || 'default'}`;
  const items = Array.from(group.querySelectorAll('input[type="checkbox"]'));
  const resetButton = group.querySelector('[data-checklist-reset]');
  const progress = group.querySelector('[data-checklist-progress]');

  const loadState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      items.forEach((input, index) => {
        input.checked = Boolean(saved[index]);
      });
    } catch (error) {
      items.forEach((input) => {
        input.checked = false;
      });
    }
  };

  const saveState = () => {
    const state = items.map((input) => input.checked);
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      return;
    }
  };

  const updateProgress = () => {
    if (!progress) return;
    const done = items.filter((input) => input.checked).length;
    progress.textContent = `${done} / ${items.length} checkpoints`;
  };

  const emitProgress = () => {
    const done = items.filter((input) => input.checked).length;
    emitCompanion('checklist', { done, total: items.length });
  };

  items.forEach((input) => {
    input.addEventListener('change', () => {
      saveState();
      updateProgress();
      emitProgress();
    });
  });

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      items.forEach((input) => {
        input.checked = false;
      });
      saveState();
      updateProgress();
      emitProgress();
    });
  }

  loadState();
  updateProgress();
});

const timers = Array.from(document.querySelectorAll('[data-timer]'));
timers.forEach((timer) => {
  const display = timer.querySelector('[data-timer-display]');
  const input = timer.querySelector('[data-timer-input]');
  const startButton = timer.querySelector('[data-timer-action="start"]');
  const pauseButton = timer.querySelector('[data-timer-action="pause"]');
  const resetButton = timer.querySelector('[data-timer-action="reset"]');

  const parseMinutes = () => {
    const fallback = Number(timer.dataset.timerMinutes || 15);
    if (!input) return Number.isFinite(fallback) ? fallback : 15;
    const value = Number(input.value);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };

  let remaining = Math.round(parseMinutes() * 60);
  let intervalId = null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.max(seconds % 60, 0);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const render = () => {
    if (display) display.textContent = formatTime(remaining);
  };

  const tick = () => {
    remaining -= 1;
    if (remaining <= 0) {
      remaining = 0;
      clearInterval(intervalId);
      intervalId = null;
      emitCompanion('timer', { action: 'end' });
    }
    render();
  };

  const start = () => {
    if (intervalId) return;
    intervalId = window.setInterval(tick, 1000);
    emitCompanion('timer', { action: 'start', minutes: remaining / 60 });
  };

  const pause = () => {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
    emitCompanion('timer', { action: 'pause', minutes: remaining / 60 });
  };

  const reset = () => {
    pause();
    remaining = Math.round(parseMinutes() * 60);
    render();
    emitCompanion('timer', { action: 'reset', minutes: remaining / 60 });
  };

  if (startButton) startButton.addEventListener('click', start);
  if (pauseButton) pauseButton.addEventListener('click', pause);
  if (resetButton) resetButton.addEventListener('click', reset);
  if (input) input.addEventListener('change', reset);

  render();
});

const initCompanion = () => {
  if (window.__companionInit) return;
  window.__companionInit = true;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isHidden = localStorage.getItem('companion:hidden') === 'true';
  if (isHidden) return;

  const shell = document.createElement('div');
  shell.className = 'companion-shell';
  shell.innerHTML = `
    <div class="companion-bubble" aria-live="polite" data-companion-bubble></div>
    <div class="companion-header">
      <span class="companion-title">Study Buddy</span>
      <div class="companion-actions">
        <button type="button" data-companion-minimize>Min</button>
        <button type="button" data-companion-hide>Hide</button>
      </div>
    </div>
    <canvas class="companion-canvas" data-companion-canvas></canvas>
    <div class="companion-panel">
      <div class="companion-status">
        <span data-companion-status>Ready</span>
        <span data-companion-mood-label>Focus</span>
      </div>
      <div class="companion-meter"><span data-companion-mood></span></div>
      <div class="companion-controls">
        <button type="button" data-companion-action="cheer">Cheer</button>
        <button type="button" data-companion-action="focus">Focus</button>
        <button type="button" data-companion-action="break">Break</button>
      </div>
    </div>
  `;
  document.body.appendChild(shell);

  const bubble = shell.querySelector('[data-companion-bubble]');
  const statusEl = shell.querySelector('[data-companion-status]');
  const moodLabel = shell.querySelector('[data-companion-mood-label]');
  const moodMeter = shell.querySelector('[data-companion-mood]');
  const canvas = shell.querySelector('[data-companion-canvas]');
  const minimizeButton = shell.querySelector('[data-companion-minimize]');
  const hideButton = shell.querySelector('[data-companion-hide]');
  const actionButtons = Array.from(shell.querySelectorAll('[data-companion-action]'));

  const applyMinimized = (isMinimized) => {
    shell.classList.toggle('is-minimized', isMinimized);
    localStorage.setItem('companion:minimized', isMinimized ? 'true' : 'false');
  };

  const initialMinimized = localStorage.getItem('companion:minimized') === 'true';
  applyMinimized(initialMinimized);

  if (minimizeButton) {
    minimizeButton.addEventListener('click', () => {
      applyMinimized(!shell.classList.contains('is-minimized'));
    });
  }

  if (hideButton) {
    hideButton.addEventListener('click', () => {
      shell.remove();
      localStorage.setItem('companion:hidden', 'true');
    });
  }

  const lexicon = {
    openers: [
      'Good.', 'Nice.', 'Solid.', 'Steady.', 'Clean.', 'Strong.',
      'Keep going.', 'Hold the line.', 'Stay sharp.', 'Good pace.'
    ],
    verbs: [
      'finish', 'lock in', 'tighten', 'justify', 'clean up', 'write',
      'pin down', 'check', 'control', 'clarify', 'organize'
    ],
    targets: [
      'the algebra', 'the covariance step', 'the FOC', 'the market clearing',
      'the intuition', 'the next line', 'the price formula', 'the beta',
      'the risk premium', 'the definition', 'the assumption'
    ],
    closers: [
      'No gaps.', 'Stay precise.', 'You are on track.', 'You are safe.',
      'This is the core.', 'Do not rush.', 'Write it clean.', 'Trust the structure.'
    ],
    encouragements: [
      'You are doing the hard part.', 'This is exactly the right pace.',
      'Keep it tight and explicit.', 'That line is the fulcrum.',
      'You are building proof-grade muscle.'
    ],
    breaks: [
      'Take 60 seconds. Then come back with the next line.',
      'Small reset. Then write the FOC.',
      'Short breath. Then keep moving.',
      'Water, then one clean equation.'
    ],
    celebrations: [
      'That is a full derivation.', 'You just cleared a qualifier step.',
      'Yes. That is exactly how it is graded.',
      'You just earned a point on the exam.'
    ]
  };

  const templates = [
    '{open} {verb} {target}. {close}',
    '{open} Now {verb} {target}. {close}',
    '{open} {verb} {target} and move. {close}',
    '{open} {verb} {target} with care. {close}',
    '{open} {verb} {target}. {encouragement}'
  ];

  const state = {
    mood: 0.62,
    energy: 0.7,
    focus: 0.65,
    lastMessageAt: 0,
    lastEventAt: Date.now(),
    pulse: null,
    quiet: false
  };

  const setMood = (delta) => {
    state.mood = Math.min(1, Math.max(0, state.mood + delta));
    if (moodMeter) {
      moodMeter.style.width = `${Math.round(state.mood * 100)}%`;
    }
    if (moodLabel) {
      moodLabel.textContent = state.mood > 0.75 ? 'Bright' : state.mood > 0.5 ? 'Focused' : 'Steady';
    }
  };

  setMood(0);
  window.setTimeout(() => {
    speak('Start with the setup. Then write the certainty equivalent.');
  }, 1200);

  const speak = (text, { force = false } = {}) => {
    const now = Date.now();
    if (state.quiet || (!force && now - state.lastMessageAt < 3500)) return;
    state.lastMessageAt = now;
    if (bubble) {
      bubble.textContent = text;
      bubble.classList.add('is-visible');
      window.setTimeout(() => bubble.classList.remove('is-visible'), 3600);
    }
  };

  const formatTemplate = (template) => {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    return template
      .replace('{open}', pick(lexicon.openers))
      .replace('{verb}', pick(lexicon.verbs))
      .replace('{target}', pick(lexicon.targets))
      .replace('{close}', pick(lexicon.closers))
      .replace('{encouragement}', pick(lexicon.encouragements));
  };

  const pulse = (type) => {
    state.pulse = { type, start: performance.now() };
  };

  const react = (type, detail = {}) => {
    state.lastEventAt = Date.now();
    if (statusEl) {
      const label = type === 'timer' && detail.action ? `timer ${detail.action}` : type;
      statusEl.textContent = label.replace(/^\w/, (char) => char.toUpperCase());
    }
    let line = '';
    switch (type) {
      case 'step':
        line = `${formatTemplate(templates[1])} Step ${detail.index}/${detail.total}.`;
        setMood(0.015);
        pulse('bounce');
        break;
      case 'drill':
        line = `New drill: ${detail.title}. Write it clean.`;
        setMood(0.02);
        pulse('spin');
        break;
      case 'calc':
        line = 'Numbers are consistent. Now explain why.';
        setMood(0.01);
        pulse('nod');
        break;
      case 'checklist':
        if (detail.done === detail.total) {
          line = lexicon.celebrations[Math.floor(Math.random() * lexicon.celebrations.length)];
          setMood(0.08);
          pulse('celebrate');
        } else {
          line = `Checkpoint ${detail.done}/${detail.total}. Keep moving.`;
          setMood(0.01);
        }
        break;
      case 'timer':
        if (detail.action === 'start') {
          line = 'Timer on. Clean lines only.';
          setMood(0.01);
          pulse('focus');
        }
        if (detail.action === 'pause') {
          line = 'Paused. Read the last line and check units.';
        }
        if (detail.action === 'reset') {
          line = 'Reset. Write the objective and go.';
        }
        if (detail.action === 'end') {
          line = lexicon.celebrations[Math.floor(Math.random() * lexicon.celebrations.length)];
          setMood(0.06);
          pulse('celebrate');
          speak(line, { force: true });
          return;
        }
        break;
      case 'progress':
        line = `You are ${detail.progress}% in. Keep the structure tight.`;
        setMood(0.01);
        break;
      case 'mode':
        line = detail.mode === 'exam'
          ? 'Exam mode. No hints. You have this.'
          : 'Learn mode. Take the long route.';
        break;
      case 'cheer':
        line = lexicon.encouragements[Math.floor(Math.random() * lexicon.encouragements.length)];
        setMood(0.05);
        pulse('celebrate');
        break;
      case 'focus':
        line = formatTemplate(templates[0]);
        setMood(0.03);
        pulse('focus');
        break;
      case 'break':
        line = lexicon.breaks[Math.floor(Math.random() * lexicon.breaks.length)];
        setMood(0.02);
        pulse('nod');
        break;
      case 'accordion':
        line = 'Good. Read the full solution once, then close it and reproduce it.';
        break;
      case 'idle':
        line = formatTemplate(templates[Math.floor(Math.random() * templates.length)]);
        break;
      default:
        line = formatTemplate(templates[0]);
    }
    if (line) speak(line);
  };

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.companionAction;
      react(action);
    });
  });

  const events = [
    'step', 'drill', 'calc', 'checklist', 'timer',
    'progress', 'mode', 'accordion'
  ];
  events.forEach((eventName) => {
    window.addEventListener(`companion:${eventName}`, (event) => {
      react(eventName, event.detail || {});
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      applyMinimized(true);
    }
  });

  const idleCheck = () => {
    const now = Date.now();
    if (now - state.lastEventAt > 60000) {
      react('idle');
      state.lastEventAt = now;
    }
  };
  window.setInterval(idleCheck, 20000);

  const loadScript = (url) =>
    new Promise((resolve, reject) => {
      if (window.THREE) return resolve(window.THREE);
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve(window.THREE);
      script.onerror = reject;
      document.head.appendChild(script);
    });

  const initScene = (THREE) => {
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.6, 3.2);

    const group = new THREE.Group();
    scene.add(group);

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xd05a2b,
      roughness: 0.45,
      metalness: 0.15
    });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const glowMaterial = new THREE.MeshStandardMaterial({ color: 0x1f7a6b, emissive: 0x1f7a6b, emissiveIntensity: 0.4 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), bodyMaterial);
    body.position.y = 0.1;
    group.add(body);

    const face = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), bodyMaterial.clone());
    face.position.set(0, 0.4, 0.35);
    group.add(face);

    const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyeMaterial);
    eyeLeft.position.set(-0.16, 0.45, 0.74);
    const eyeRight = eyeLeft.clone();
    eyeRight.position.x = 0.16;
    group.add(eyeLeft, eyeRight);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 16, 60), glowMaterial);
    halo.position.set(0, 1.05, 0);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(1.5, 2, 3);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener('resize', resize);

    let pointerX = 0;
    let pointerY = 0;
    let isPointerDown = false;

    canvas.addEventListener('pointerdown', () => {
      isPointerDown = true;
      react('cheer');
    });
    canvas.addEventListener('pointerup', () => {
      isPointerDown = false;
    });
    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      if (isPointerDown) {
        react('focus');
      }
    });

    const clock = new THREE.Clock();
    let nextBlink = 0;
    let blinkUntil = 0;

    const animate = () => {
      if (!document.body.contains(shell)) return;
      requestAnimationFrame(animate);

      const t = clock.getElapsedTime();
      const now = performance.now();
      if (now > nextBlink) {
        blinkUntil = now + 140;
        nextBlink = now + 2500 + Math.random() * 2500;
      }
      const isBlinking = now < blinkUntil;
      eyeLeft.scale.y = isBlinking ? 0.1 : 1;
      eyeRight.scale.y = isBlinking ? 0.1 : 1;

      const breath = prefersReducedMotion ? 0.01 : 0.04;
      body.scale.y = 1 + breath * Math.sin(t * 2.1);
      body.scale.x = 1 + breath * Math.sin(t * 2.1 + 1.3);
      group.position.y = 0.05 * Math.sin(t * 1.2);
      group.rotation.y = pointerX * 0.25;
      group.rotation.x = pointerY * 0.15;

      if (state.pulse) {
        const progress = Math.min((now - state.pulse.start) / 700, 1);
        if (state.pulse.type === 'bounce') {
          group.position.y += Math.sin(progress * Math.PI) * 0.18;
        }
        if (state.pulse.type === 'spin') {
          group.rotation.y += progress * Math.PI * 2;
        }
        if (state.pulse.type === 'celebrate') {
          group.rotation.z = Math.sin(progress * Math.PI * 2) * 0.3;
        }
        if (state.pulse.type === 'focus') {
          halo.scale.setScalar(1 + 0.2 * Math.sin(progress * Math.PI));
        }
        if (progress >= 1) {
          state.pulse = null;
          group.rotation.z = 0;
          halo.scale.setScalar(1);
        }
      }

      const warm = new THREE.Color(0xd05a2b);
      const calm = new THREE.Color(0x1f7a6b);
      bodyMaterial.color.copy(calm).lerp(warm, state.mood);

      renderer.render(scene, camera);
    };

    animate();
  };

  loadScript('https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js')
    .then(initScene)
    .catch(() => {
      if (statusEl) statusEl.textContent = 'Companion offline';
    });
};

initCompanion();
