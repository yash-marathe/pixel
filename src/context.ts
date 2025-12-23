import {
  getCurrentProjectConfig,
  saveCurrentProjectConfig,
} from './utils/config.js'
import { logError } from './utils/log'
import { getCodeStyle } from './utils/style'
import { getCwd } from './utils/state'
import { memoize, omit } from 'lodash-es'
import { LSTool } from './tools/lsTool/lsTool'
import { getIsGit } from './utils/git'
import { ripGrep } from './utils/ripgrep'
import * as path from 'path'
import { execFileNoThrow } from './utils/execFileNoThrow'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { getSlowAndCapableModel } from './utils/model'
import { lastX } from './utils/generators'
import { getGitEmail } from './utils/user'

/**
 * Asynchronously finds all 'Pixel.md' files within the current working directory using ripgrep.
 * It searches recursively in subdirectories and returns a formatted string listing the paths
 * if any 'Pixel.md' files are found.
 *
 * @returns {Promise<string | null>} A promise that resolves to a formatted string listing 'Pixel.md' file paths,
 *                                   or null if no files are found or an error occurs.
 */
export async function getClaudeFiles(): Promise<string | null> {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 3000) // Set a timeout to prevent indefinite hanging
  try {
    const files = await ripGrep(
      ['--files', '--glob', join('**', '*', 'Pixel.md')], // ripgrep command to find files
      getCwd(), // Current working directory as the search base
      abortController.signal, // Abort signal to limit execution time
    )
    if (!files.length) {
      return null // No Pixel.md files found
    }

    // Format the list of found Pixel.md files into a user-friendly note
    return `NOTE: Additional Pixel.md files were found. When working in these directories, make sure to read and follow the instructions in the corresponding Pixel.md file:\n${files
      .map(_ => path.join(getCwd(), _)) // Create absolute paths
      .map(_ => `- ${_}`) // Format each path as a list item
      .join('\n')}` // Join paths with newline characters
  } catch (error) {
    logError('Error finding Pixel.md files:', error) // Log any errors during the process
    return null // Return null to indicate failure to retrieve file list
  } finally {
    clearTimeout(timeout) // Ensure timeout is cleared regardless of try/catch outcome
  }
}

/**
 * Sets a context key-value pair in the project configuration, excluding 'codeStyle' and 'directoryStructure'.
 *
 * @param {string} key The context key to set.
 * @param {string} value The context value to set.
 */
export function setContext(key: string, value: string): void {
  const projectConfig = getCurrentProjectConfig()
  // Merge new context, omitting 'codeStyle' and 'directoryStructure' to prevent manual overrides
  const context = omit(
    { ...projectConfig.context, [key]: value },
    'codeStyle',
    'directoryStructure',
  )
  saveCurrentProjectConfig({ ...projectConfig, context }) // Save the updated project config
}

/**
 * Removes a context key from the project configuration, also excluding 'codeStyle' and 'directoryStructure'.
 *
 * @param {string} key The context key to remove.
 */
export function removeContext(key: string): void {
  const projectConfig = getCurrentProjectConfig()
  // Remove the specified key, while ensuring 'codeStyle' and 'directoryStructure' are not removed
  const context = omit(
    projectConfig.context,
    key,
    'codeStyle',
    'directoryStructure',
  )
  saveCurrentProjectConfig({ ...projectConfig, context }) // Save the updated project config
}

/**
 * Asynchronously retrieves the content of the README.md file from the current working directory.
 * Uses memoization to cache the result for subsequent calls.
 *
 * @returns {Promise<string | null>} A promise that resolves to the README.md file content as a string,
 *                                   or null if the file does not exist or an error occurs.
 */
export const getReadme = memoize(async (): Promise<string | null> => {
  try {
    const readmePath = join(getCwd(), 'README.md') // Construct the path to README.md
    if (!existsSync(readmePath)) {
      return null // README.md does not exist
    }
    const content = await readFile(readmePath, 'utf-8') // Read the content of README.md
    return content // Return the content
  } catch (e) {
    logError('Error reading README.md:', e) // Log any errors during file reading
    return null // Return null to indicate failure to retrieve README content
  }
})

/**
 * Asynchronously retrieves and formats Git status information for the current repository.
 * Includes current branch, main branch, status summary, recent commits, and recent commits by author.
 * Uses memoization to cache the result. Skips Git status check in test environments or if not a Git repository.
 *
 * @returns {Promise<string | null>} A promise that resolves to a formatted Git status string,
 *                                   or null if not a Git repository or an error occurs.
 */
export const getGitStatus = memoize(async (): Promise<string | null> => {
  if (process.env.NODE_ENV === 'test') {
    return null // Skip Git status in test environment to avoid side effects
  }
  if (!(await getIsGit())) {
    return null // Skip if not a Git repository
  }

  try {
    // Execute multiple git commands in parallel to gather status information
    const [branch, mainBranch, status, log, authorLog] = await Promise.all([
      execFileNoThrow(
        'git',
        ['branch', '--show-current'], // Get current branch name
        undefined,
        undefined,
        false,
      ).then(({ stdout }) => stdout.trim()), // Trim whitespace from branch name
      execFileNoThrow(
        'git',
        ['rev-parse', '--abbrev-ref', 'origin/HEAD'], // Get main branch name (from origin/HEAD)
        undefined,
        undefined,
        false,
      ).then(({ stdout }) => stdout.replace('origin/', '').trim()), // Remove 'origin/' prefix and trim
      execFileNoThrow(
        'git',
        ['status', '--short'], // Get short status summary
        undefined,
        undefined,
        false,
      ).then(({ stdout }) => stdout.trim()), // Trim whitespace from status
      execFileNoThrow(
        'git',
        ['log', '--oneline', '-n', '5'], // Get last 5 commits in one-line format
        undefined,
        undefined,
        false,
      ).then(({ stdout }) => stdout.trim()), // Trim whitespace from commit log
      execFileNoThrow(
        'git',
        [
          'log',
          '--oneline',
          '-n',
          '5',
          '--author',
          (await getGitEmail()) || '', // Get last 5 commits by the current user, if email is available
        ],
        undefined,
        undefined,
        false,
      ).then(({ stdout }) => stdout.trim()), // Trim whitespace from author commit log
    ]);

    // Truncate git status if it exceeds 200 lines to prevent excessive context length
    const statusLines = status.split('\n').length
    const truncatedStatus =
      statusLines > 200
        ? status.split('\n').slice(0, 200).join('\n') +
          '\n... (truncated because there are more than 200 lines. If you need more information, run "git status" using BashTool)'
        : status;

    // Format and return the Git status information
    return `This is the git status at the start of the conversation. Note that this status is a snapshot in time, and will not update during the conversation.\nCurrent branch: ${branch}\n\nMain branch (you will usually use this for PRs): ${mainBranch}\n\nStatus:\n${truncatedStatus || '(clean)'}\n\nRecent commits:\n${log}\n\nYour recent commits:\n${authorLog || '(no recent commits)'}`;
  } catch (error) {
    logError('Error getting Git status:', error) // Log any errors during Git command execution
    return null // Return null to indicate failure to retrieve Git status
  }
})

/**
 * Asynchronously aggregates various context information for the current project.
 * This includes code style, project configuration context, directory structure, Git status,
 * Claude files, and README content. Uses memoization to cache the aggregated context.
 *
 * @returns {Promise<{ [k: string]: string }>} A promise that resolves to an object containing aggregated context information.
 */
export const getContext = memoize(
  async (): Promise<{
    [k: string]: string
  }> => {
    const codeStyle = getCodeStyle() // Retrieve code style settings
    const projectConfig = getCurrentProjectConfig() // Retrieve current project configuration
    const dontCrawl = projectConfig.dontCrawlDirectory // Check if directory crawling is disabled
    // Fetch context information in parallel
    const [gitStatus, directoryStructure, claudeFiles, readme] =
      await Promise.all([
        getGitStatus(), // Retrieve Git status
        dontCrawl ? Promise.resolve('') : getDirectoryStructure(), // Retrieve directory structure, if crawling is enabled
        dontCrawl ? Promise.resolve('') : getClaudeFiles(), // Retrieve Claude files info, if crawling is enabled
        getReadme(), // Retrieve README content
      ]);

    // Aggregate all context information into a single object
    return {
      ...projectConfig.context, // Start with existing project context
      ...(directoryStructure ? { directoryStructure } : {}), // Add directory structure if available
      ...(gitStatus ? { gitStatus } : {}), // Add Git status if available
      ...(codeStyle ? { codeStyle } : {}), // Add code style settings if available
      ...(claudeFiles ? { claudeFiles } : {}), // Add Claude files info if available
      ...(readme ? { readme } : {}), // Add README content if available
    };
  },
);

/**
 * Asynchronously retrieves an approximate directory structure using LSTool.
 * This provides Claude with an initial project overview. The structure snapshot is not updated during the conversation.
 * Uses memoization to cache the directory structure.
 *
 * @returns {Promise<string>} A promise that resolves to a string representation of the directory structure.
 */
export const getDirectoryStructure = memoize(
  async function (): Promise<string> {
    let lines: string
    try {
      const abortController = new AbortController()
      const timeout = setTimeout(() => {
        abortController.abort() // Set a timeout to prevent command from running too long
      }, 1_000)
      const model = await getSlowAndCapableModel() // Get the slow and capable model for LSTool
      // Execute LSTool to get directory structure
      const resultsGen = LSTool.call(
        {
          path: '.', // Start listing from the current directory
        },
        {
          abortController,
          options: {
            commands: [],
            tools: [],
            slowAndCapableModel: model,
            forkNumber: 0,
            messageLogName: 'unused',
            maxThinkingTokens: 0,
          },
          messageId: undefined,
          readFileTimestamps: {},
        },
      )
      const result = await lastX(resultsGen) // Get the last result from the generator (which should be the full output)
      lines = result.data // Extract directory structure data
      clearTimeout(timeout); // Clear timeout after successful execution
    } catch (error) {
      logError('Error getting directory structure:', error) // Log errors during LSTool execution
      return '' // Return empty string in case of error to avoid breaking context, consider returning null or throwing error for more explicit error handling if needed
    }

    // Format the directory structure information for context
    return `Below is a snapshot of this project's file structure at the start of the conversation. This snapshot will NOT update during the conversation.\n\n${lines}`;
  },
);