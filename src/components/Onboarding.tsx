import React, { useState, useCallback } from 'react';
import { PRODUCT_NAME } from '../constants/product';
import { Box, Newline, Text, useInput } from 'ink';
import {
  saveGlobalConfig,
  DEFAULT_GLOBAL_CONFIG,
  ThemeNames,
} from '../utils/config.js';
import { OrderedList } from '@inkjs/ui';
import { useExitOnCtrlCD } from '../hooks/useExitOnCtrlCD';
import { MIN_LOGO_WIDTH } from './Logo';
import { Select } from './CustomSelect/select';
import { StructuredDiff } from './StructuredDiff';
import { getTheme } from '../utils/theme';
import { clearTerminal } from '../utils/terminal';
import { PressEnterToContinue } from './PressEnterToContinue';
import { ModelSelector } from './ModelSelector';

// Define types for StepId and OnboardingStep for better type safety and readability
type StepId = 'theme' | 'usage' | 'providers' | 'model';

interface OnboardingStep {
  id: StepId;
  component: React.ReactNode;
}

type Props = {
  onDone(): void;
};

// Define onboarding steps configuration outside the component for performance and clarity.
// This avoids re-creation on every render and makes the steps easily configurable.
const onboardingStepsConfig: OnboardingStep[] = [
  { id: 'theme', component: null }, // Component will be set dynamically in Onboarding component
  { id: 'usage', component: null }, // Component will be set dynamically in Onboarding component
  { id: 'model', component: null }, // Component will be set dynamically in Onboarding component
];

// Theme Step Component - Encapsulates the theme selection logic and UI.
const ThemeStep: React.FC<{
  onThemeSelection: (theme: ThemeNames) => void;
  onThemePreview: (theme: ThemeNames) => void;
  selectedTheme: ThemeNames;
}> = ({ onThemeSelection, onThemePreview, selectedTheme }) => {
  const theme = getTheme();
  return (
    <Box flexDirection="column" gap={1} paddingLeft={1}>
      <Text>Let's get started.</Text>
      <Box flexDirection="column">
        <Text bold>Choose the option that looks best when you select it:</Text>
        <Text dimColor>To change this later, run /config</Text>
      </Box>
      <Select
        options={[
          { label: 'Light text', value: 'dark' },
          { label: 'Dark text', value: 'light' },
          {
            label: 'Light text (colorblind-friendly)',
            value: 'dark-daltonized',
          },
          {
            label: 'Dark text (colorblind-friendly)',
            value: 'light-daltonized',
          },
        ]}
        onFocus={onThemePreview}
        onChange={onThemeSelection}
      />
      <Box flexDirection="column">
        <Box
          paddingLeft={1}
          marginRight={1}
          borderStyle="round"
          borderColor="gray"
          flexDirection="column"
        >
          <StructuredDiff
            patch={{
              oldStart: 1,
              newStart: 1,
              oldLines: 3,
              newLines: 3,
              lines: [
                'function greet() {',
                '-  console.log("Hello, World!");',
                '+  console.log("Hello, pixel!");',
                '}',
              ],
            }}
            dim={false}
            width={40}
            overrideTheme={selectedTheme}
          />
        </Box>
      </Box>
    </Box>
  );
};

// Usage Step Component - Explains how to use the product effectively.
const UsageStep: React.FC = () => {
  const theme = getTheme();
  return (
    <Box flexDirection="column" gap={1} paddingLeft={1}>
      <Text bold>Using {PRODUCT_NAME} effectively:</Text>
      <Box flexDirection="column" width={70}>
        <OrderedList children={[]}>
          <OrderedList.Item children={[]}>
            <Text>
              Start in your project directory
              <Newline />
              <Text color={theme.secondaryText}>
                Files are automatically added to context when needed.
              </Text>
              <Newline />
            </Text>
          </OrderedList.Item>
          <OrderedList.Item children={[]}>
            <Text>
              Use {PRODUCT_NAME} as a development partner
              <Newline />
              <Text color={theme.secondaryText}>
                Get help with file analysis, editing, bash commands,
                <Newline />
                and git history.
                <Newline />
              </Text>
            </Text>
          </OrderedList.Item>
          <OrderedList.Item children={[]}>
            <Text>
              Provide clear context
              <Newline />
              <Text color={theme.secondaryText}>
                Be as specific as you would with another engineer. <Newline />
                The better the context, the better the results. <Newline />
              </Text>
            </Text>
          </OrderedList.Item>
        </OrderedList>
      </Box>
      <PressEnterToContinue />
    </Box>
  );
};

// Model Step Component - Guides the user to the model configuration.
const ModelStep: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  const theme = getTheme();
  return (
    <Box flexDirection="column" gap={1} paddingLeft={1}>
      <Text bold>Configure your models:</Text>
      <Box flexDirection="column" width={70}>
        <Text>
          You can customize which models {PRODUCT_NAME} uses for different tasks.
          <Newline />
          <Text color={theme.secondaryText}>
            Let's set up your preferred models for large and small tasks.
          </Text>
        </Text>
        <Box marginTop={1}>
          <Text>
            Press <Text color={theme.suggestion}>Enter</Text> to continue to the
            model selection screen.
          </Text>
        </Box>
      </Box>
      <PressEnterToContinue onContinue={onContinue} />
    </Box>
  );
};

// Onboarding Component - Manages the onboarding flow and step transitions.
export function Onboarding({ onDone }: Props): React.ReactNode {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeNames>(DEFAULT_GLOBAL_CONFIG.theme);

  const exitState = useExitOnCtrlCD(() => process.exit(0));

  // useCallback for optimized function memoization, prevents unnecessary re-renders.
  const goToNextStep = useCallback(() => {
    setCurrentStepIndex((prevIndex) => Math.min(prevIndex + 1, onboardingStepsConfig.length - 1));
  }, []);

  const handleThemeSelection = useCallback((newTheme: string) => {
    saveGlobalConfig({
      theme: newTheme as ThemeNames,
    });
    setSelectedTheme(newTheme as ThemeNames); // Update local state for preview
    goToNextStep();
  }, [goToNextStep]);

  const handleThemePreview = useCallback((newTheme: string) => {
    setSelectedTheme(newTheme as ThemeNames);
  }, []);

  // Note: handleProviderSelectionDone is defined but appears to be unused in the current step flow.
  // If provider selection is now handled within ModelSelector, this callback might be obsolete.
  // Keeping it for now, in case provider selection logic needs to be explicitly handled later.
  const handleProviderSelectionDone = useCallback(() => {
    goToNextStep();
  }, [goToNextStep]);

  const handleModelSelectionDone = useCallback(() => {
    onDone();
  }, [onDone]);

  // useInput hook to handle user input for navigation within onboarding steps.
  useInput(async (_, key) => {
    const currentStep = onboardingStepsConfig[currentStepIndex];
    if (key.return && currentStep) {
      switch (currentStep.id) {
        case 'model':
          setShowModelSelector(true);
          break;
        case 'usage':
        case 'providers': // Assuming provider selection is handled within ModelSelector now.
          await clearTerminal();
          goToNextStep();
          break;
        default:
          await clearTerminal(); // For theme step for example
          goToNextStep();
      }
    }
  }, [currentStepIndex, goToNextStep]);

  // Instantiate steps with their corresponding components based on stepConfig.id.
  // This dynamic component assignment keeps the rendering logic clean and manageable.
  const steps = onboardingStepsConfig.map(stepConfig => {
    let component;
    switch (stepConfig.id) {
      case 'theme':
        component = (
          <ThemeStep
            onThemeSelection={handleThemeSelection}
            onThemePreview={handleThemePreview}
            selectedTheme={selectedTheme}
          />
        );
        break;
      case 'usage':
        component = <UsageStep />;
        break;
      case 'model':
        component = <ModelStep onContinue={goToNextStep} />;
        break;
      default:
        component = <Text>Step Not Defined</Text>; // Fallback component for undefined steps.
    }
    return { ...stepConfig, component };
  });

  // Conditionally render ModelSelector if showModelSelector is true, otherwise render the current onboarding step.
  if (showModelSelector) {
    return <ModelSelector onDone={handleModelSelectionDone} />;
  }

  return (
    <Box flexDirection="column" gap={1}>
      <>
        <Box flexDirection="column" gap={1}>
          <Text bold>
            {PRODUCT_NAME} {exitState.pending ? `(press ${exitState.keyName} again to exit)` : ''}
          </Text>
          {steps[currentStepIndex]?.component}
        </Box>
      </>
    </Box>
  );
}

// WelcomeBox Component -  Displays a welcome message.
export function WelcomeBox(): React.ReactNode {
  const theme = getTheme();
  return (
    <Box
      borderColor={theme.pixel}
      borderStyle="round"
      paddingX={1}
      width={MIN_LOGO_WIDTH}
    >
      <Text>
        <Text color={theme.pixel}>✻</Text> Welcome to{' '}
        <Text bold>{PRODUCT_NAME}</Text>
      </Text>
    </Box>
  );
}