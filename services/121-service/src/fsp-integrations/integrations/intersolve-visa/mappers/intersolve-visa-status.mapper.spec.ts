/**
 * Why test invariants instead of mirroring every row of the CSV?
 *
 * The CSV (`visa-card-121-status-map.csv`) is the source of truth for the
 * status/action mapping. If we wrote tests that simply repeated every expected
 * value from that file, we would only be verifying that the CSV is being read
 * correctly — we would not catch someone accidentally editing the CSV in a way
 * that breaks a business rule (e.g. adding a "close" action to an already-closed
 * card, or adding "pause" to a blocked token).
 *
 * Instead, these tests assert structural rules that must hold regardless of how
 * the CSV evolves
 *
 * This approach means a test failure signals a real business-rule violation,
 * not just a diff in expected output.
 */

import { VisaCardAction } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-action.enum';
import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { VisaCard121Status } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/wallet-status-121.enum';
import { IntersolveVisaStatusMapper } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/mappers/intersolve-visa-status.mapper';

// Card statuses that are permanently closed — close action must never appear on these
const TERMINAL_CARD_STATUSES = [
  IntersolveVisaCardStatus.CardClosed,
  IntersolveVisaCardStatus.CardExpired,
  IntersolveVisaCardStatus.CardClosedDueToFraud,
] as const;

// Card statuses where close IS a valid action
const CLOSEABLE_CARD_STATUSES = [
  IntersolveVisaCardStatus.CardOk,
  IntersolveVisaCardStatus.CardBlocked,
  IntersolveVisaCardStatus.SuspectedFraud,
  IntersolveVisaCardStatus.CardNoRenewal,
  IntersolveVisaCardStatus.CardLost,
  IntersolveVisaCardStatus.CardStolen,
] as const;

// Token statuses that are mapped in the CSV (Active/Inactive have full card status coverage)
const MAPPED_ACTIVE_TOKEN_STATUSES = [
  IntersolveVisaTokenStatus.Active,
  IntersolveVisaTokenStatus.Inactive,
] as const;

const ALL_CARD_STATUSES = Object.values(IntersolveVisaCardStatus);

function getResult({
  walletStatus,
  isTokenBlocked,
  cardStatus,
}: {
  walletStatus: IntersolveVisaTokenStatus;
  isTokenBlocked: boolean;
  cardStatus: IntersolveVisaCardStatus | null;
}) {
  return IntersolveVisaStatusMapper.determineVisaCard121StatusInformation({
    isTokenBlocked,
    walletStatus,
    cardStatus,
  });
}

const terminalCardStatusCases = MAPPED_ACTIVE_TOKEN_STATUSES.flatMap(
  (walletStatus) =>
    [true, false].flatMap((isTokenBlocked) =>
      TERMINAL_CARD_STATUSES.map((cardStatus) => ({
        walletStatus,
        isTokenBlocked,
        cardStatus,
      })),
    ),
);

const substitutedCases = [true, false].flatMap((isTokenBlocked) =>
  ALL_CARD_STATUSES.map((cardStatus) => ({ isTokenBlocked, cardStatus })),
);

const mappedActiveTokenCases = MAPPED_ACTIVE_TOKEN_STATUSES.flatMap(
  (walletStatus) =>
    ALL_CARD_STATUSES.map((cardStatus) => ({ walletStatus, cardStatus })),
);

const allMappedCombinations = MAPPED_ACTIVE_TOKEN_STATUSES.flatMap(
  (walletStatus) =>
    [true, false].flatMap((isTokenBlocked) =>
      ALL_CARD_STATUSES.map((cardStatus) => ({
        walletStatus,
        isTokenBlocked,
        cardStatus,
      })),
    ),
);

const allMappedIncludingSubstituted = [
  ...allMappedCombinations,
  ...[true, false].flatMap((isTokenBlocked) =>
    ALL_CARD_STATUSES.map((cardStatus) => ({
      walletStatus: IntersolveVisaTokenStatus.Substituted,
      isTokenBlocked,
      cardStatus,
    })),
  ),
];

const closeableCardStatusCases = MAPPED_ACTIVE_TOKEN_STATUSES.flatMap(
  (walletStatus) =>
    [true, false].flatMap((isTokenBlocked) =>
      CLOSEABLE_CARD_STATUSES.map((cardStatus) => ({
        walletStatus,
        isTokenBlocked,
        cardStatus,
      })),
    ),
);

describe('IntersolveVisaStatusMapper — CSV mapping invariants', () => {
  it.each(terminalCardStatusCases)(
    'close action never appears on terminal card statuses: $walletStatus / blocked=$isTokenBlocked / $cardStatus',
    ({ walletStatus, isTokenBlocked, cardStatus }) => {
      const { actions } = getResult({
        walletStatus,
        isTokenBlocked,
        cardStatus,
      });

      expect(actions).not.toContain(VisaCardAction.close);
    },
  );

  it.each(substitutedCases)(
    'SUBSTITUTED token status always has no actions: blocked=$isTokenBlocked / $cardStatus',
    ({ isTokenBlocked, cardStatus }) => {
      const { actions } = getResult({
        walletStatus: IntersolveVisaTokenStatus.Substituted,
        isTokenBlocked,
        cardStatus,
      });

      expect(actions).toHaveLength(0);
    },
  );

  it.each(mappedActiveTokenCases)(
    'pause only appears when token is not blocked: $walletStatus / $cardStatus',
    ({ walletStatus, cardStatus }) => {
      const { actions } = getResult({
        walletStatus,
        isTokenBlocked: true,
        cardStatus,
      });

      expect(actions).not.toContain(VisaCardAction.pause);
    },
  );

  it.each(mappedActiveTokenCases)(
    'unpause only appears when token is blocked: $walletStatus / $cardStatus',
    ({ walletStatus, cardStatus }) => {
      const { actions } = getResult({
        walletStatus,
        isTokenBlocked: false,
        cardStatus,
      });

      expect(actions).not.toContain(VisaCardAction.unpause);
    },
  );

  it.each(allMappedCombinations)(
    'pause and unpause never appear together: $walletStatus / blocked=$isTokenBlocked / $cardStatus',
    ({ walletStatus, isTokenBlocked, cardStatus }) => {
      const { actions } = getResult({
        walletStatus,
        isTokenBlocked,
        cardStatus,
      });

      const hasPause = actions.includes(VisaCardAction.pause);
      const hasUnpause = actions.includes(VisaCardAction.unpause);
      expect(hasPause && hasUnpause).toBe(false);
    },
  );

  it.each(allMappedIncludingSubstituted)(
    'all mapped rows resolve to a known status, not Unknown: $walletStatus / blocked=$isTokenBlocked / $cardStatus',
    ({ walletStatus, isTokenBlocked, cardStatus }) => {
      const { status } = getResult({
        walletStatus,
        isTokenBlocked,
        cardStatus,
      });

      expect(status).not.toBe(VisaCard121Status.Unknown);
    },
  );

  it.each(closeableCardStatusCases)(
    'close action appears for non-terminal card statuses: $walletStatus / blocked=$isTokenBlocked / $cardStatus',
    ({ walletStatus, isTokenBlocked, cardStatus }) => {
      const { actions } = getResult({
        walletStatus,
        isTokenBlocked,
        cardStatus,
      });

      expect(actions).toContain(VisaCardAction.close);
    },
  );

  describe('fallback cases', () => {
    it('null cardStatus with a known wallet status returns CardDataMissing with [replace]', () => {
      const result = getResult({
        walletStatus: IntersolveVisaTokenStatus.Active,
        isTokenBlocked: false,
        cardStatus: null,
      });

      expect(result.status).toBe(VisaCard121Status.CardDataMissing);
      expect(result.actions).toEqual([VisaCardAction.replace]);
    });

    it('unmapped token status with a known card status returns Unknown with no actions', () => {
      const result = getResult({
        walletStatus: IntersolveVisaTokenStatus.Redeemed,
        isTokenBlocked: false,
        cardStatus: IntersolveVisaCardStatus.CardOk,
      });

      expect(result.status).toBe(VisaCard121Status.Unknown);
      expect(result.actions).toEqual([]);
    });
  });
});
