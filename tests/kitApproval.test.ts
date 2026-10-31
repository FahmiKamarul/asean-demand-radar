import { kitActions } from '@/lib/kitApproval';

test('locks copying and the link until approved', () => {
  expect(kitActions(false)).toEqual({ canCopy: false, showLink: false });
});

test('unlocks copying and the link once approved', () => {
  expect(kitActions(true)).toEqual({ canCopy: true, showLink: true });
});
