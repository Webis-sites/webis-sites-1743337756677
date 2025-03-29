/**
 * Simple logger utility for the generator
 */

interface LoggerColors {
  reset: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  gray: string;
  orange: string;
  lightGreen: string;
  lightBlue: string;
  black: string;
  bgBlack: string;
  bgRed: string;
  bgGreen: string;
  bgYellow: string;
  bgBlue: string;
  bgMagenta: string;
  bgCyan: string;
  bgWhite: string;
  bright: string;
  dim: string;
  italic: string;
  underline: string;
}

const colors: LoggerColors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  orange: '\x1b[38;5;208m',
  lightGreen: '\x1b[38;5;119m',
  lightBlue: '\x1b[38;5;39m',
  black: '\x1b[30m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m'
};

/**
 * Logger class for consistent output formatting
 */
class Logger {
  private isVerbose: boolean = true;
  private prefix: string = '[Generator]';
  public tokenInfo: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    requests: number;
  } = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    requests: 0
  };
  
  /**
   * Enable or disable verbose logging
   */
  public setVerbose(isVerbose: boolean): void {
    this.isVerbose = isVerbose;
  }
  
  /**
   * Output an informational message
   */
  public info(message: string): void {
    if (this.isVerbose) {
      const timestamp = this.getFormattedTimestamp();
      console.log(`${colors.blue}${this.prefix}${colors.reset} ${timestamp} ${message}`);
    }
  }
  
  /**
   * Output a success message
   */
  public success(message: string): void {
    const timestamp = this.getFormattedTimestamp();
    console.log(`${colors.green}${this.prefix}${colors.reset} ${timestamp} ${message}`);
  }
  
  /**
   * Output a warning message
   */
  public warn(message: string): void {
    const timestamp = this.getFormattedTimestamp();
    console.log(`${colors.yellow}${this.prefix}${colors.reset} ${timestamp} ${message}`);
  }
  
  /**
   * Output an error message with optional error object
   */
  public error(message: string, error?: unknown): void {
    const timestamp = this.getFormattedTimestamp();
    console.error(`${colors.red}${this.prefix} ERROR${colors.reset} ${timestamp} ${message}`);
    if (error && error instanceof Error) {
      console.error(`${colors.red}${error.stack || error.message}${colors.reset}`);
    } else if (error) {
      console.error(error);
    }
  }
  
  /**
   * Log when a file is created
   */
  public fileCreated(filePath: string): void {
    this.info(`${colors.green}Created${colors.reset} ${filePath}`);
  }
  
  /**
   * Log the start of a process
   */
  public startProcess(processName: string): void {
    const timestamp = this.getFormattedTimestamp();
    console.log(`\n${colors.cyan}${this.prefix} 🚀 ${timestamp} ${processName}${colors.reset}`);
  }
  
  /**
   * Log the end of a process
   */
  public endProcess(processName: string, projectName?: string): void {
    if (projectName) {
      const timestamp = this.getFormattedTimestamp();
      console.log(`${colors.cyan}${this.prefix} ✅ ${timestamp} ${processName} - Complete ${colors.yellow}(${projectName})${colors.reset}\n`);
    } else {
      const timestamp = this.getFormattedTimestamp();
      console.log(`${colors.cyan}${this.prefix} ✅ ${timestamp} ${processName} - Complete${colors.reset}\n`);
    }
  }
  
  /**
   * Log when making a call to an AI service
   */
  public aiCall(model: string): void {
    this.info(`${colors.magenta}🤖 Calling AI model:${colors.reset} ${model}`);
  }
  
  /**
   * Log when receiving a response from an AI service with token information
   */
  public aiResponse(model: string, responseLength: number, inputTokens?: number, outputTokens?: number): void {
    if (inputTokens && outputTokens) {
      this.tokenInfo.totalInputTokens += inputTokens;
      this.tokenInfo.totalOutputTokens += outputTokens;
      this.tokenInfo.totalTokens += (inputTokens + outputTokens);
      this.tokenInfo.requests += 1;
      
      const timestamp = this.getFormattedTimestamp();
      this.info(`${colors.magenta}🤖 Received response:${colors.reset} ${model} (${responseLength} chars, ${colors.lightBlue}${inputTokens} input tokens${colors.reset}, ${colors.orange}${outputTokens} output tokens${colors.reset})`);
    } else {
      this.info(`${colors.magenta}🤖 Received response:${colors.reset} ${model} (${responseLength} chars)`);
    }
  }
  
  /**
   * Log a summary of a completed operation
   */
  public summary(title: string, data: Record<string, unknown>): void {
    const timestamp = this.getFormattedTimestamp();
    console.log(`\n${colors.magenta}${this.prefix} 📋 ${timestamp} ${title}${colors.reset}`);
    Object.entries(data).forEach(([key, value]) => {
      console.log(`  ${colors.gray}${key}:${colors.reset} ${value}`);
    });
    console.log('');
  }

  /**
   * Log component generation progress
   */
  public componentProgress(current: number, total: number, name: string): void {
    const progress = (current / total) * 100;
    const progressBar = this.createProgressBar(progress);
    const timestamp = this.getFormattedTimestamp();
    console.log(`${colors.lightGreen}${this.prefix} [${timestamp}] [${current}/${total}]${colors.reset} ${colors.cyan}Generating component:${colors.reset} ${name}`);
    console.log(`  ${progressBar} ${progress.toFixed(0)}%`);
  }

  /**
   * Log component generation success
   */
  public componentSuccess(current: number, total: number, name: string): void {
    const timestamp = this.getFormattedTimestamp();
    console.log(`${colors.lightGreen}${this.prefix} [${timestamp}] [${current}/${total}]${colors.reset} ${colors.green}✅ Successfully generated:${colors.reset} ${name}`);
  }

  /**
   * Log component generation failure
   */
  public componentFailure(current: number, total: number, name: string, error?: unknown): void {
    const timestamp = this.getFormattedTimestamp();
    console.log(`${colors.lightGreen}${this.prefix} [${timestamp}] [${current}/${total}]${colors.reset} ${colors.red}❌ Failed to generate:${colors.reset} ${name}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`  ${colors.red}${error.message}${colors.reset}`);
      } else {
        console.error(`  ${colors.red}${error}${colors.reset}`);
      }
    }
  }

  /**
   * Log dependencies added for a component
   */
  public componentDependencies(name: string, dependencies: Array<{name: string, version: string}>): void {
    if (dependencies.length === 0) return;
    
    const depNames = dependencies.map(d => `${d.name}@${d.version}`).join(', ');
    const timestamp = this.getFormattedTimestamp();
    console.log(`${timestamp}  ${colors.blue}📦 Added dependencies:${colors.reset} ${depNames}`);
  }

  /**
   * Log token usage summary
   */
  public tokenSummary(): void {
    const timestamp = this.getFormattedTimestamp();
    console.log(`\n${colors.magenta}${this.prefix} 📊 Token Usage Summary${colors.reset} ${timestamp}`);
    console.log(`  ${colors.gray}Total Requests:${colors.reset} ${this.tokenInfo.requests}`);
    console.log(`  ${colors.gray}Total Input Tokens:${colors.reset} ${colors.lightBlue}${this.tokenInfo.totalInputTokens.toLocaleString()}${colors.reset}`);
    console.log(`  ${colors.gray}Total Output Tokens:${colors.reset} ${colors.orange}${this.tokenInfo.totalOutputTokens.toLocaleString()}${colors.reset}`);
    console.log(`  ${colors.gray}Total Tokens:${colors.reset} ${this.tokenInfo.totalTokens.toLocaleString()}`);
    console.log('');
  }

  /**
   * Create a text-based progress bar
   */
  private createProgressBar(percent: number, length: number = 20): string {
    const filled = Math.floor((percent / 100) * length);
    const empty = length - filled;
    
    const filledBar = colors.green + '█'.repeat(filled);
    const emptyBar = colors.gray + '█'.repeat(empty);
    
    return `[${filledBar}${emptyBar}${colors.reset}]`;
  }

  /**
   * Reset token counters
   */
  public resetTokens(): void {
    this.tokenInfo = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      requests: 0
    };
  }

  private getFormattedTimestamp(): string {
    const now = new Date();
    
    // פורמט של תאריך dd-mm-yyyy
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    
    // פורמט של שעה hh:mm:ss
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }
}

// Export a singleton instance
export const logger = new Logger();

// קטגוריות של לוגים עם צבעים שונים
const logCategories = {
  INFO: { prefix: "ℹ️ INFO:", color: colors.blue },
  SUCCESS: { prefix: "✅ SUCCESS:", color: colors.green },
  WARNING: { prefix: "⚠️ WARNING:", color: colors.yellow },
  ERROR: { prefix: "❌ ERROR:", color: colors.red },
  PROCESS: { prefix: "🔄 PROCESS:", color: colors.magenta },
  AI: { prefix: "🤖 AI:", color: colors.cyan },
  COMPONENT: { prefix: "🧩 COMPONENT:", color: colors.green },
  NETWORK: { prefix: "🌐 NETWORK:", color: colors.blue },
  FILESYSTEM: { prefix: "📁 FILESYSTEM:", color: colors.yellow },
  DEBUG: { prefix: "🔍 DEBUG:", color: colors.dim + colors.white },
};

// פונקציה שמחזירה טקסט צבעוני
function colorize(text: string, category: keyof typeof logCategories) {
  const { color, prefix } = logCategories[category];
  const timestamp = new Date().toISOString();
  return `${color}[${timestamp}] ${prefix} ${text}${colors.reset}`;
}

// מייצא פונקציות לוג מוכנות לשימוש
export const colorLogger = {
  info: (message: string) => console.log(colorize(message, "INFO")),
  success: (message: string) => console.log(colorize(message, "SUCCESS")),
  warning: (message: string) => console.log(colorize(message, "WARNING")),
  error: (message: string) => console.error(colorize(message, "ERROR")),
  process: (message: string) => console.log(colorize(message, "PROCESS")),
  ai: (message: string) => console.log(colorize(message, "AI")),
  component: (message: string) => console.log(colorize(message, "COMPONENT")),
  network: (message: string) => console.log(colorize(message, "NETWORK")),
  filesystem: (message: string) => console.log(colorize(message, "FILESYSTEM")),
  debug: (message: string) => console.log(colorize(message, "DEBUG")),
  
  // פונקציות עזר נוספות
  startProcess: (processName: string) => {
    console.log(`
    ${colors.bright}${colors.bgBlue}${colors.white}╔═════════════════════════════════════════════════════════════════════════╗${colors.reset}
    ${colors.bright}${colors.bgBlue}${colors.white}║                                                                         ║${colors.reset}
    ${colors.bright}${colors.bgBlue}${colors.white}║                    🚀 ${processName} 🚀                                ${colors.reset}
    ${colors.bright}${colors.bgBlue}${colors.white}║                                                                         ║${colors.reset}
    ${colors.bright}${colors.bgBlue}${colors.white}╚═════════════════════════════════════════════════════════════════════════╝${colors.reset}
    `);
  },
  
  endProcess: (processName: string) => {
    console.log(`
    ${colors.bright}${colors.bgGreen}${colors.black}╔═════════════════════════════════════════════════════════════════════════╗${colors.reset}
    ${colors.bright}${colors.bgGreen}${colors.black}║                                                                         ║${colors.reset}
    ${colors.bright}${colors.bgGreen}${colors.black}║                    ✅ ${processName} הושלם בהצלחה ✅                 ${colors.reset}
    ${colors.bright}${colors.bgGreen}${colors.black}║                                                                         ║${colors.reset}
    ${colors.bright}${colors.bgGreen}${colors.black}╚═════════════════════════════════════════════════════════════════════════╝${colors.reset}
    `);
  },
  
  // פונקציה להדפסת טבלה צבעונית
  table: (data: any[], title?: string) => {
    if (title) {
      console.log(`${colors.bright}${colors.underline}${colors.cyan}${title}${colors.reset}`);
    }
    console.table(data);
  },
  
  fileCreated: (filePath: string) => {
    console.log(`${colors.green}[✓] Created file: ${filePath}${colors.reset}`);
  }
}; 