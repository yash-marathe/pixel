import * as React from 'react'
import { getTheme } from '../utils/theme'
import { Text } from 'ink'

export function FallbackToolUseRejectedMessage(): React.ReactNode {
  return (
    <Text>
      &nbsp;&nbsp;⎿ &nbsp;
      <Text color={getTheme().error}>
        No (tell Pixel what to do differently)
      </Text>
    </Text>
  )
}
