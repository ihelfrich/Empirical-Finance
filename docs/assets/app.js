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

const progressBar = document.querySelector('.progress-bar');
if (progressBar) {
  const updateProgress = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = height > 0 ? (scrollTop / height) * 100 : 0;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
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
  };

  const prev = () => {
    currentIndex = (currentIndex - 1 + panels.length) % panels.length;
    render();
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
  });
});

const calculators = Array.from(document.querySelectorAll('[data-calc]'));
calculators.forEach((calculator) => {
  const output = calculator.querySelector('[data-calc-output]');
  if (!output) return;
  const inputs = Array.from(calculator.querySelectorAll('input'));

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
    }
    if (calculator.dataset.calc === 'cara') {
      const { mu, rf, alpha, sigma2 } = values;
      if ([mu, rf, alpha, sigma2].some((val) => Number.isNaN(val))) {
        output.textContent = 'Enter all inputs to compute optimal demand.';
        return;
      }
      const demand = (mu - rf) / (alpha * sigma2);
      output.textContent = `Optimal demand x* = ${demand.toFixed(4)}`;
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

  items.forEach((input) => {
    input.addEventListener('change', () => {
      saveState();
      updateProgress();
    });
  });

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      items.forEach((input) => {
        input.checked = false;
      });
      saveState();
      updateProgress();
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
    }
    render();
  };

  const start = () => {
    if (intervalId) return;
    intervalId = window.setInterval(tick, 1000);
  };

  const pause = () => {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
  };

  const reset = () => {
    pause();
    remaining = Math.round(parseMinutes() * 60);
    render();
  };

  if (startButton) startButton.addEventListener('click', start);
  if (pauseButton) pauseButton.addEventListener('click', pause);
  if (resetButton) resetButton.addEventListener('click', reset);
  if (input) input.addEventListener('change', reset);

  render();
});
