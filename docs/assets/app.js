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
