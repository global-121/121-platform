import {
  TrackingAction,
  TrackingCategory,
  TrackingEvent,
} from '~/services/tracking.service';

type ProgramStep = 1 | 2 | 3;
type CompletionMode = 'create' | 'duplicate';

const stepTimeSpentAction: Record<ProgramStep, TrackingAction> = {
  1: TrackingAction.createNewProgramStep1TotalTimeSpent,
  2: TrackingAction.createNewProgramStep2TotalTimeSpent,
  3: TrackingAction.createNewProgramStep3TotalTimeSpent,
};

export interface CreateNewProgramTracker {
  enterStep: (step: ProgramStep) => void;
  leaveStep: () => void;
  goBack: () => void;
  complete: (mode: CompletionMode) => TrackingEvent[];
  stop: () => TrackingEvent[];
}

export const createNewProgramTracker = ({
  now = () => Date.now(),
}: {
  now?: () => number;
}): CreateNewProgramTracker => {
  const secondsPerStep = new Map<ProgramStep, number>();

  let flowStartedAt: number | undefined;
  let activeStep: ProgramStep | undefined;
  let activeStepStartedAt: number | undefined;
  let backButtonClicks = 0;

  const enterStep = (step: ProgramStep): void => {
    flowStartedAt ??= now();
    activeStep = step;
    activeStepStartedAt = now();
  };

  const leaveStep = (): void => {
    if (activeStep === undefined || activeStepStartedAt === undefined) {
      return;
    }

    const seconds = Math.max(
      0,
      Math.round((now() - activeStepStartedAt) / 1000),
    );
    secondsPerStep.set(
      activeStep,
      (secondsPerStep.get(activeStep) ?? 0) + seconds,
    );

    activeStep = undefined;
    activeStepStartedAt = undefined;
  };

  const stepTimeEvents = (): TrackingEvent[] =>
    [...secondsPerStep].map(([step, value]) => ({
      category: TrackingCategory.createNewProgram,
      action: stepTimeSpentAction[step],
      value,
    }));

  const goBack = (): void => {
    backButtonClicks += 1;
  };

  const backButtonClicksEvent = (): TrackingEvent => ({
    category: TrackingCategory.createNewProgram,
    action: TrackingAction.createNewProgramBackButtonClicks,
    value: backButtonClicks,
  });

  const reset = (): void => {
    secondsPerStep.clear();
    flowStartedAt = undefined;
    backButtonClicks = 0;
  };

  const complete = (mode: CompletionMode): TrackingEvent[] => {
    leaveStep();
    const events = stepTimeEvents();

    if (flowStartedAt !== undefined) {
      events.push({
        category: TrackingCategory.createNewProgram,
        action: TrackingAction.createNewProgramTotalTimeSpent,
        name:
          mode === 'duplicate'
            ? 'Duplicate program completed'
            : 'Create program completed',
        value: Math.round((now() - flowStartedAt) / 1000),
      });
    }

    events.push(backButtonClicksEvent());

    reset();
    return events;
  };

  const stop = (): TrackingEvent[] => {
    leaveStep();
    const events = stepTimeEvents();

    events.push({
      category: TrackingCategory.createNewProgram,
      action: TrackingAction.createNewProgramCloseDialog,
    });

    events.push(backButtonClicksEvent());

    reset();
    return events;
  };

  return {
    enterStep,
    leaveStep,
    goBack,
    complete,
    stop,
  };
};
