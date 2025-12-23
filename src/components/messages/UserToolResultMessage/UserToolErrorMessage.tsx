import { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs'
import { Box, Text } from 'ink'
import * as React from 'react'
import { getTheme } from '../../../utils/theme'

const MAX_RENDERED_LINES = 10

type Props = {
  param: ToolResultBlockParam
  verbose: boolean
}

export function UserToolErrorMessage({
  param,
  verbose,
}: Props): React.ReactNode {
  const theme = getTheme()
  const errorContent = param.content
  const defaultErrorMessage = 'Error'

  // Ensure error is a string and trim whitespace, otherwise use default error message
  const error = typeof errorContent === 'string' ? errorContent.trim() : defaultErrorMessage

  const errorLines = error.split('\n')
  const isLongError = errorLines.length > MAX_RENDERED_LINES
  const renderedError = verbose ? error : errorLines.slice(0, MAX_RENDERED_LINES).join('\n')

  return (
    <Box flexDirection="row" width="100%">
      <Text>  ⎿  </Text>
      <Box flexDirection="column">
        <Text color={theme.error}>
          {renderedError || ''}
        </Text>
        {!verbose && isLongError && (
          <Text color={theme.secondaryText}>
            ... (+{errorLines.length - MAX_RENDERED_LINES} lines)
          </Text>
        )}
      </Box>
    </Box>
  )
}