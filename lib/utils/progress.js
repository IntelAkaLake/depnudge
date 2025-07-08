const { colors } = require("./console");
const { t } = require("./lang");

class ProgressBar {
  constructor(total, description = "") {
    this.total = total;
    this.current = 0;
    this.description = description;
    this.startTime = Date.now();
    this.barLength = 40;
    this.isComplete = false;
  }

  update(current, description = null) {
    this.current = current;
    if (description) this.description = description;
    this.render();
  }

  increment(description = null) {
    this.current++;
    if (description) this.description = description;
    this.render();
  }

  render() {
    if (this.isComplete) return;

    const percentage = Math.round((this.current / this.total) * 100);
    const filled = Math.round((this.current / this.total) * this.barLength);
    const empty = this.barLength - filled;

    const filledBar = "█".repeat(filled);
    const emptyBar = "░".repeat(empty);
    const bar = `${colors.green}${filledBar}${colors.dim}${emptyBar}${colors.reset}`;

    const elapsed = Date.now() - this.startTime;
    const rate = this.current / (elapsed / 1000);
    const remaining = this.current > 0 ? (this.total - this.current) / rate : 0;

    const formatTime = (seconds) => {
      if (seconds < 60) return `${Math.round(seconds)}s`;
      return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    };

    process.stdout.write("\r\x1b[K");
    process.stdout.write(
      `${colors.bright}${percentage}%${colors.reset} ${bar} ${colors.cyan}${this.current}/${this.total}${colors.reset} ${colors.dim}${this.description}${colors.reset}`
    );
    
    if (remaining > 0 && remaining < 3600) {
      process.stdout.write(` ${colors.dim}(~${formatTime(remaining)} left)${colors.reset}`);
    }
  }

  async complete(message = null) {
    this.current = this.total;
    this.isComplete = true;
    this.render();
    const finalMessage = message || await t("progress.default_complete");
    console.log(`\n${colors.green}✅ ${finalMessage}${colors.reset}`);
  }

  async fail(message = null) {
    this.isComplete = true;
    process.stdout.write("\r\x1b[K");
    const finalMessage = message || await t("progress.default_failed");
    console.log(`${colors.red}❌ ${finalMessage}${colors.reset}`);
  }
}

class Spinner {
  constructor(message = null) {
    this.message = message;
    this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    this.index = 0;
    this.interval = null;
    this.isSpinning = false;
  }
  async setDefaultMessage() {
    this.message = await t("progress.default_loading");
  }

  start() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    
    this.interval = setInterval(() => {
      process.stdout.write("\r\x1b[K");
      process.stdout.write(`${colors.cyan}${this.frames[this.index]}${colors.reset} ${this.message}`);
      this.index = (this.index + 1) % this.frames.length;
    }, 100);
  }

  update(message) {
    this.message = message;
  }

  stop(message = null, isSuccess = true) {
    if (!this.isSpinning) return;
    
    clearInterval(this.interval);
    this.isSpinning = false;
    process.stdout.write("\r\x1b[K");
    
    if (message) {
      const icon = isSuccess ? "✅" : "❌";
      const color = isSuccess ? colors.green : colors.red;
      console.log(`${color}${icon} ${message}${colors.reset}`);
    }
  }
}

module.exports = { ProgressBar, Spinner }; 