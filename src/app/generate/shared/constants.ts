/**
 * Constants for the site generator
 */

/**
 * Available file types for the generator
 */
export enum FILE_TYPES {
  COMPONENT = 'component',
  PAGE = 'page',
  STYLE = 'style',
  UTILITY = 'utility',
  CONFIG = 'config'
}

/**
 * Supported AI models for generation
 */
export enum AI_MODELS {
  CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-20250219',
  CLAUDE_3_7_SONNET_THINKING = 'claude-3-7-sonnet-thinking-20250211',
  CLAUDE_3_OPUS = 'claude-3-opus-latest',
  GPT_4_O = 'gpt-4o',
} 