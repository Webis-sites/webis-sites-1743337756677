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
  gray: string;
  orange: string;
  lightGreen: string;
  lightBlue: string;
}

const colors: LoggerColors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m', 
  gray: '\x1b[90m',
  orange: '\x1b[38;5;208m',
  lightGreen: '\x1b[38;5;119m',
  lightBlue: '\x1b[38;5;39m'
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
      console.log(`${colors.blue}${this.prefix}${colors.reset} ${message}`);
    }
  }
  
  /**
   * Output a success message
   */
  public success(message: string): void {
    console.log(`${colors.green}${this.prefix}${colors.reset} ${message}`);
  }
  
  /**
   * Output a warning message
   */
  public warn(message: string): void {
    console.log(`${colors.yellow}${this.prefix}${colors.reset} ${message}`);
  }
  
  /**
   * Output an error message with optional error object
   */
  public error(message: string, error?: unknown): void {
    console.error(`${colors.red}${this.prefix} ERROR${colors.reset} ${message}`);
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
    console.log(`\n${colors.cyan}${this.prefix} 🚀 ${processName}${colors.reset}`);
  }
  
  /**
   * Log the end of a process
   */
  public endProcess(processName: string, projectName?: string): void {
    if (projectName) {
      console.log(`${colors.cyan}${this.prefix} ✅ ${processName} - Complete ${colors.yellow}(${projectName})${colors.reset}\n`);
    } else {
      console.log(`${colors.cyan}${this.prefix} ✅ ${processName} - Complete${colors.reset}\n`);
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
      
      this.info(`${colors.magenta}🤖 Received response:${colors.reset} ${model} (${responseLength} chars, ${colors.lightBlue}${inputTokens} input tokens${colors.reset}, ${colors.orange}${outputTokens} output tokens${colors.reset})`);
    } else {
      this.info(`${colors.magenta}🤖 Received response:${colors.reset} ${model} (${responseLength} chars)`);
    }
  }
  
  /**
   * Log a summary of a completed operation
   */
  public summary(title: string, data: Record<string, unknown>): void {
    console.log(`\n${colors.magenta}${this.prefix} 📋 ${title}${colors.reset}`);
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
    console.log(`${colors.lightGreen}${this.prefix} [${current}/${total}]${colors.reset} ${colors.cyan}Generating component:${colors.reset} ${name}`);
    console.log(`  ${progressBar} ${progress.toFixed(0)}%`);
  }

  /**
   * Log component generation success
   */
  public componentSuccess(current: number, total: number, name: string): void {
    console.log(`${colors.lightGreen}${this.prefix} [${current}/${total}]${colors.reset} ${colors.green}✅ Successfully generated:${colors.reset} ${name}`);
  }

  /**
   * Log component generation failure
   */
  public componentFailure(current: number, total: number, name: string, error?: unknown): void {
    console.log(`${colors.lightGreen}${this.prefix} [${current}/${total}]${colors.reset} ${colors.red}❌ Failed to generate:${colors.reset} ${name}`);
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
    console.log(`  ${colors.blue}📦 Added dependencies:${colors.reset} ${depNames}`);
  }

  /**
   * Log token usage summary
   */
  public tokenSummary(): void {
    console.log(`\n${colors.magenta}${this.prefix} 📊 Token Usage Summary${colors.reset}`);
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
}

// Export a singleton instance
export const logger = new Logger(); 