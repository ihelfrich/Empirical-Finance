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
    <div class="companion-header" data-companion-drag>
      <span class="companion-title">Study Cat</span>
      <div class="companion-actions">
        <button type="button" data-companion-minimize>Min</button>
        <button type="button" data-companion-hide>Hide</button>
      </div>
    </div>
    <canvas class="companion-canvas" data-companion-canvas></canvas>
    <div class="companion-panel">
      <div class="companion-status">
        <span data-companion-status>Ready</span>
        <span data-companion-mood-label>Calm</span>
      </div>
      <div class="companion-meter-group">
        <div class="companion-meter"><span data-companion-mood></span></div>
        <div class="companion-meter energy"><span data-companion-energy></span></div>
        <div class="companion-meter focus"><span data-companion-focus></span></div>
      </div>
      <div class="companion-legend">
        <span>Mood</span>
        <span>Energy</span>
        <span>Focus</span>
      </div>
      <div class="companion-controls">
        <button type="button" data-companion-action="pet">Pet</button>
        <button type="button" data-companion-action="treat">Treat</button>
        <button type="button" data-companion-action="focus">Focus</button>
        <button type="button" data-companion-action="stretch">Stretch</button>
        <button type="button" data-companion-action="break">Break</button>
        <button type="button" data-companion-action="quiet">Quiet</button>
      </div>
    </div>
  `;
  document.body.appendChild(shell);

  const bubble = shell.querySelector('[data-companion-bubble]');
  const statusEl = shell.querySelector('[data-companion-status]');
  const moodLabel = shell.querySelector('[data-companion-mood-label]');
  const moodMeter = shell.querySelector('[data-companion-mood]');
  const energyMeter = shell.querySelector('[data-companion-energy]');
  const focusMeter = shell.querySelector('[data-companion-focus]');
  const canvas = shell.querySelector('[data-companion-canvas]');
  const minimizeButton = shell.querySelector('[data-companion-minimize]');
  const hideButton = shell.querySelector('[data-companion-hide]');
  const dragHandle = shell.querySelector('[data-companion-drag]');
  const actionButtons = Array.from(shell.querySelectorAll('[data-companion-action]'));
  const quietButton = shell.querySelector('[data-companion-action="quiet"]');

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

  const savedPosition = localStorage.getItem('companion:pos');
  if (savedPosition) {
    try {
      const { x, y } = JSON.parse(savedPosition);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        shell.style.left = `${x}px`;
        shell.style.top = `${y}px`;
        shell.style.right = 'auto';
        shell.style.bottom = 'auto';
      }
    } catch (error) {
      // ignore corrupt saved position
    }
  }

  if (dragHandle) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMove = (event) => {
      if (!dragging) return;
      const x = Math.min(window.innerWidth - 60, Math.max(10, event.clientX - offsetX));
      const y = Math.min(window.innerHeight - 60, Math.max(10, event.clientY - offsetY));
      shell.style.left = `${x}px`;
      shell.style.top = `${y}px`;
      shell.style.right = 'auto';
      shell.style.bottom = 'auto';
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      const rect = shell.getBoundingClientRect();
      localStorage.setItem('companion:pos', JSON.stringify({ x: rect.left, y: rect.top }));
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    dragHandle.addEventListener('pointerdown', (event) => {
      dragging = true;
      const rect = shell.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }

  const lexicon = {
    openers: [
      'Good.', 'Nice.', 'Solid.', 'Steady.', 'Clean.', 'Strong.',
      'Keep going.', 'Hold the line.', 'Stay sharp.', 'Good pace.',
      'You are here.', 'We are fine.'
    ],
    verbs: [
      'finish', 'lock in', 'tighten', 'justify', 'clean up', 'write',
      'pin down', 'check', 'control', 'clarify', 'organize', 'anchor',
      'confirm', 'label'
    ],
    targets: [
      'the algebra', 'the covariance step', 'the FOC', 'the market clearing',
      'the intuition', 'the next line', 'the price formula', 'the beta',
      'the risk premium', 'the definition', 'the assumption', 'the objective'
    ],
    closers: [
      'No gaps.', 'Stay precise.', 'You are on track.', 'You are safe.',
      'This is the core.', 'Do not rush.', 'Write it clean.',
      'Trust the structure.', 'One line at a time.', 'Slow is fine.'
    ],
    encouragements: [
      'You are doing the hard part.', 'This is exactly the right pace.',
      'Keep it tight and explicit.', 'That line is the fulcrum.',
      'You are building proof-grade muscle.', 'Your structure is solid.',
      'The logic is yours.', 'You are allowed to take time.'
    ],
    breaks: [
      'Take 60 seconds. Then come back with the next line.',
      'Small reset. Then write the FOC.',
      'Short breath. Then keep moving.',
      'Water, then one clean equation.',
      'Stand up for a moment. Then return to the objective.',
      'Drop the shoulders. Then write the next line.'
    ],
    celebrations: [
      'That is a full derivation.', 'You just cleared a qualifier step.',
      'Yes. That is exactly how it is graded.',
      'You just earned a point on the exam.',
      'That is a complete solution.', 'Good. You closed the loop.'
    ],
    care: [
      'Keep it gentle. One line at a time.',
      'You are not behind. You are building.',
      'If the page feels heavy, shrink the step.',
      'It is okay to pause. We keep going when ready.',
      'You are safe here. Focus on the next line.'
    ],
    purrs: [
      'Purr. That is clean work.',
      'Soft paws, sharp logic.',
      'Purr. Nice control.',
      'Cat approved. Keep going.'
    ],
    treats: [
      'Treat received. Focus restored.',
      'Snack time. Back to the FOC.',
      'Treat accepted. Your pace is good.'
    ],
    stretches: [
      'Stretch. Then write the next line.',
      'Long back. Calm mind. Keep moving.',
      'Stretch done. Resume.'
    ],
    quietOn: [
      'Quiet mode on. I will stay nearby.',
      'Silent paws. I am here if needed.'
    ],
    quietOff: [
      'Quiet mode off. Ready to coach.',
      'Back online. Let us go.'
    ]
  };

  const templates = [
    '{open} {verb} {target}. {close}',
    '{open} Now {verb} {target}. {close}',
    '{open} {verb} {target} and move. {close}',
    '{open} {verb} {target} with care. {close}',
    '{open} {verb} {target}. {encouragement}',
    '{open} Start with {target}. {close}',
    '{open} Keep the line tight: {verb} {target}. {close}',
    '{open} You only need the next line. {verb} {target}.'
  ];

  const state = {
    mood: 0.62,
    energy: 0.72,
    focus: 0.68,
    calm: 0.6,
    affection: 0.5,
    lastMessageAt: 0,
    lastEventAt: Date.now(),
    pulse: null,
    quiet: localStorage.getItem('companion:quiet') === 'true'
  };

  const clamp01 = (value) => Math.min(1, Math.max(0, value));

  const setMeter = (value, meter) => {
    if (!meter) return;
    meter.style.width = `${Math.round(value * 100)}%`;
  };

  const setMood = (delta) => {
    state.mood = clamp01(state.mood + delta);
    setMeter(state.mood, moodMeter);
    if (moodLabel) {
      moodLabel.textContent = state.mood > 0.78 ? 'Bright' : state.mood > 0.55 ? 'Focused' : 'Calm';
    }
  };

  const setEnergy = (delta) => {
    state.energy = clamp01(state.energy + delta);
    setMeter(state.energy, energyMeter);
  };

  const setFocus = (delta) => {
    state.focus = clamp01(state.focus + delta);
    setMeter(state.focus, focusMeter);
  };

  const setCalm = (delta) => {
    state.calm = clamp01(state.calm + delta);
  };

  setMood(0);
  setEnergy(0);
  setFocus(0);
  window.setTimeout(() => {
    speak('Start with the setup. Then write the certainty equivalent.');
  }, 1200);

  if (quietButton) {
    quietButton.textContent = state.quiet ? 'Talk' : 'Quiet';
  }

  let lastCareAt = 0;
  const drift = () => {
    setEnergy(-0.01);
    setFocus(-0.008);
    const now = Date.now();
    if (now - lastCareAt > 90000) {
      if (state.energy < 0.3 || state.focus < 0.28) {
        speak(lexicon.care[Math.floor(Math.random() * lexicon.care.length)]);
        lastCareAt = now;
      }
    }
  };
  window.setInterval(drift, 20000);

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

  const guideBreath = () => {
    const steps = ['In 4', 'Hold 4', 'Out 6', 'Soft reset'];
    steps.forEach((step, index) => {
      window.setTimeout(() => {
        speak(step, { force: true });
      }, index * 1200);
    });
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
          setFocus(0.05);
          pulse('focus');
        }
        if (detail.action === 'pause') {
          line = 'Paused. Read the last line and check units.';
        }
        if (detail.action === 'reset') {
          line = 'Reset. Write the objective and go.';
          setFocus(0.02);
        }
        if (detail.action === 'end') {
          line = lexicon.celebrations[Math.floor(Math.random() * lexicon.celebrations.length)];
          setMood(0.06);
          setEnergy(0.04);
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
        setEnergy(0.03);
        pulse('celebrate');
        break;
      case 'focus':
        line = formatTemplate(templates[0]);
        setMood(0.03);
        setFocus(0.05);
        pulse('focus');
        break;
      case 'pet':
        line = lexicon.purrs[Math.floor(Math.random() * lexicon.purrs.length)];
        setMood(0.05);
        setCalm(0.06);
        pulse('purr');
        break;
      case 'treat':
        line = lexicon.treats[Math.floor(Math.random() * lexicon.treats.length)];
        setEnergy(0.08);
        setMood(0.04);
        pulse('treat');
        break;
      case 'stretch':
        line = lexicon.stretches[Math.floor(Math.random() * lexicon.stretches.length)];
        setEnergy(0.05);
        setCalm(0.05);
        pulse('stretch');
        break;
      case 'break':
        line = lexicon.breaks[Math.floor(Math.random() * lexicon.breaks.length)];
        setMood(0.02);
        setCalm(0.05);
        pulse('nod');
        guideBreath();
        break;
      case 'quiet':
        state.quiet = !state.quiet;
        line = state.quiet
          ? lexicon.quietOn[Math.floor(Math.random() * lexicon.quietOn.length)]
          : lexicon.quietOff[Math.floor(Math.random() * lexicon.quietOff.length)];
        localStorage.setItem('companion:quiet', state.quiet ? 'true' : 'false');
        if (quietButton) {
          quietButton.textContent = state.quiet ? 'Talk' : 'Quiet';
        }
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

    const furMaterial = new THREE.MeshStandardMaterial({
      color: 0xd3925c,
      roughness: 0.55,
      metalness: 0.12
    });
    const innerEarMaterial = new THREE.MeshStandardMaterial({ color: 0xf3c2a1, roughness: 0.7 });
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xd97b6c, roughness: 0.5 });
    const collarMaterial = new THREE.MeshStandardMaterial({ color: 0x1f7a6b, roughness: 0.35, metalness: 0.25 });
    const bellMaterial = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.3, metalness: 0.4 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.78, 32, 32), furMaterial);
    body.scale.set(1.05, 0.9, 1);
    body.position.y = 0.12;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 32), furMaterial.clone());
    head.position.set(0, 0.62, 0.28);
    group.add(head);

    const earLeft = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 24), furMaterial);
    earLeft.position.set(-0.26, 1.05, 0.18);
    earLeft.rotation.z = Math.PI / 10;
    earLeft.rotation.x = Math.PI / 18;
    const earRight = earLeft.clone();
    earRight.position.x = 0.26;
    earRight.rotation.z = -Math.PI / 10;
    group.add(earLeft, earRight);

    const innerEarLeft = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 16), innerEarMaterial);
    innerEarLeft.position.set(-0.26, 1.02, 0.24);
    innerEarLeft.rotation.z = Math.PI / 10;
    innerEarLeft.rotation.x = Math.PI / 18;
    const innerEarRight = innerEarLeft.clone();
    innerEarRight.position.x = 0.26;
    innerEarRight.rotation.z = -Math.PI / 10;
    group.add(innerEarLeft, innerEarRight);

    const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), eyeMaterial);
    eyeLeft.position.set(-0.18, 0.66, 0.78);
    const eyeRight = eyeLeft.clone();
    eyeRight.position.x = 0.18;
    const pupilLeft = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), pupilMaterial);
    pupilLeft.position.set(-0.18, 0.66, 0.84);
    const pupilRight = pupilLeft.clone();
    pupilRight.position.x = 0.18;
    group.add(eyeLeft, eyeRight, pupilLeft, pupilRight);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), noseMaterial);
    nose.position.set(0, 0.56, 0.9);
    group.add(nose);

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.05, 16, 60), collarMaterial);
    collar.position.set(0, 0.38, 0.1);
    collar.rotation.x = Math.PI / 2;
    group.add(collar);

    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), bellMaterial);
    bell.position.set(0, 0.28, 0.46);
    group.add(bell);

    const pawGeometry = new THREE.SphereGeometry(0.14, 16, 16);
    const pawFrontLeft = new THREE.Mesh(pawGeometry, furMaterial);
    pawFrontLeft.position.set(-0.28, -0.28, 0.38);
    const pawFrontRight = pawFrontLeft.clone();
    pawFrontRight.position.x = 0.28;
    const pawBackLeft = pawFrontLeft.clone();
    pawBackLeft.position.set(-0.32, -0.3, -0.2);
    const pawBackRight = pawBackLeft.clone();
    pawBackRight.position.x = 0.32;
    group.add(pawFrontLeft, pawFrontRight, pawBackLeft, pawBackRight);

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.9, 16), furMaterial);
    tail.position.set(-0.6, 0.25, -0.35);
    tail.rotation.z = Math.PI / 3;
    tail.rotation.x = Math.PI / 6;
    group.add(tail);

    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), furMaterial);
    tailTip.position.set(-0.88, 0.7, -0.35);
    group.add(tailTip);

    const whiskerMaterial = new THREE.LineBasicMaterial({ color: 0x3b2a1a });
    const whiskers = new THREE.Group();
    const whiskerPoints = [
      [new THREE.Vector3(-0.1, 0.57, 0.87), new THREE.Vector3(-0.45, 0.62, 0.9)],
      [new THREE.Vector3(-0.1, 0.54, 0.88), new THREE.Vector3(-0.44, 0.54, 0.92)],
      [new THREE.Vector3(-0.1, 0.51, 0.87), new THREE.Vector3(-0.43, 0.46, 0.9)],
      [new THREE.Vector3(0.1, 0.57, 0.87), new THREE.Vector3(0.45, 0.62, 0.9)],
      [new THREE.Vector3(0.1, 0.54, 0.88), new THREE.Vector3(0.44, 0.54, 0.92)],
      [new THREE.Vector3(0.1, 0.51, 0.87), new THREE.Vector3(0.43, 0.46, 0.9)]
    ];
    whiskerPoints.forEach((points) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, whiskerMaterial);
      whiskers.add(line);
    });
    group.add(whiskers);

    const sparkleMaterial = new THREE.MeshStandardMaterial({ color: 0xf6d365, emissive: 0xf6d365, emissiveIntensity: 0.6 });
    const sparkle1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), sparkleMaterial);
    const sparkle2 = sparkle1.clone();
    const sparkle3 = sparkle1.clone();
    sparkle1.position.set(-0.3, 1.0, 0.2);
    sparkle2.position.set(0.3, 0.95, 0.1);
    sparkle3.position.set(0, 1.1, -0.1);
    const sparkles = new THREE.Group();
    sparkles.add(sparkle1, sparkle2, sparkle3);
    sparkles.visible = false;
    group.add(sparkles);

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

    let lastPetAt = 0;
    canvas.addEventListener('pointerdown', () => {
      isPointerDown = true;
      react('pet');
      lastPetAt = performance.now();
    });
    canvas.addEventListener('pointerup', () => {
      isPointerDown = false;
    });
    canvas.addEventListener('dblclick', () => {
      react('treat');
    });
    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      if (isPointerDown) {
        const now = performance.now();
        if (now - lastPetAt > 1200) {
          react('pet');
          lastPetAt = now;
        }
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
      pupilLeft.scale.y = isBlinking ? 0.1 : 1;
      pupilRight.scale.y = isBlinking ? 0.1 : 1;

      const breath = prefersReducedMotion ? 0.008 : 0.035;
      body.scale.y = 1 + breath * Math.sin(t * 2.1);
      body.scale.x = 1 + breath * Math.sin(t * 2.1 + 1.3);
      head.position.y = 0.62 + 0.03 * Math.sin(t * 1.8);
      group.position.y = 0.04 * Math.sin(t * 1.2);
      group.rotation.y = pointerX * 0.25;
      group.rotation.x = pointerY * 0.12;
      tail.rotation.z = Math.PI / 3 + 0.18 * Math.sin(t * 2.4 + state.mood);
      tail.rotation.x = Math.PI / 6 + 0.12 * Math.sin(t * 1.7);
      tailTip.position.y = 0.7 + 0.05 * Math.sin(t * 2.4 + 1.2);
      earLeft.rotation.z = Math.PI / 10 + 0.05 * Math.sin(t * 3.2 + 0.5);
      earRight.rotation.z = -Math.PI / 10 - 0.05 * Math.sin(t * 3.2 + 0.5);

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
          sparkles.visible = true;
          sparkles.children.forEach((spark, index) => {
            spark.position.y = 0.9 + 0.2 * Math.sin(progress * Math.PI + index);
          });
        }
        if (state.pulse.type === 'focus') {
          body.scale.y += 0.08 * Math.sin(progress * Math.PI);
        }
        if (state.pulse.type === 'purr') {
          body.scale.x += 0.06 * Math.sin(progress * Math.PI * 2);
          body.scale.y += 0.04 * Math.sin(progress * Math.PI * 2);
        }
        if (state.pulse.type === 'treat') {
          tail.rotation.z += 0.4 * Math.sin(progress * Math.PI);
        }
        if (state.pulse.type === 'stretch') {
          body.scale.y += 0.15 * Math.sin(progress * Math.PI);
          head.position.y += 0.08 * Math.sin(progress * Math.PI);
        }
        if (progress >= 1) {
          state.pulse = null;
          group.rotation.z = 0;
          sparkles.visible = false;
        }
      }

      const warm = new THREE.Color(0xd3925c);
      const calm = new THREE.Color(0x7bb4a5);
      furMaterial.color.copy(calm).lerp(warm, state.mood);

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
