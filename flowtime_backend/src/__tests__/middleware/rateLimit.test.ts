import { checkRateLimit, incrementUsage } from '../../middleware/rateLimit';

// Reset the in-memory map between tests by re-importing via jest module cache clearing
beforeEach(() => {
    jest.resetModules();
});

// Because the usageMap is module-level, we need a fresh import per describe block.
// To keep tests isolated we use jest.isolateModules.

describe('rateLimit', () => {
    const userId = 'user-abc';

    it('allows a new user (full remaining)', () => {
        jest.isolateModules(() => {
            const { checkRateLimit: check } = require('../../middleware/rateLimit');
            const result = check(userId);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(20);
        });
    });

    it('decrements remaining after incrementUsage', () => {
        jest.isolateModules(() => {
            const { checkRateLimit: check, incrementUsage: inc } = require('../../middleware/rateLimit');
            inc(userId);
            inc(userId);
            const result = check(userId);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(18);
        });
    });

    it('blocks after 20 usages', () => {
        jest.isolateModules(() => {
            const { checkRateLimit: check, incrementUsage: inc } = require('../../middleware/rateLimit');
            for (let i = 0; i < 20; i++) inc(userId);
            const result = check(userId);
            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
        });
    });

    it('resets when date changes', () => {
        jest.isolateModules(() => {
            const { checkRateLimit: check, incrementUsage: inc } = require('../../middleware/rateLimit');

            // Exhaust today's limit
            for (let i = 0; i < 20; i++) inc(userId);
            expect(check(userId).allowed).toBe(false);

            // Simulate tomorrow by shifting Date
            const RealDate = Date;
            const tomorrow = new RealDate();
            tomorrow.setDate(tomorrow.getDate() + 1);
            jest.spyOn(global, 'Date').mockImplementation((arg?: unknown) => {
                if (arg === undefined) return tomorrow as unknown as Date;
                return new RealDate(arg as string | number | Date) as unknown as Date;
            });
            (global.Date as unknown as typeof RealDate).now = RealDate.now;

            // On the new "date", the user should be allowed again
            expect(check(userId).allowed).toBe(true);
            expect(check(userId).remaining).toBe(20);

            jest.restoreAllMocks();
        });
    });

    it('independent users do not share counts', () => {
        jest.isolateModules(() => {
            const { checkRateLimit: check, incrementUsage: inc } = require('../../middleware/rateLimit');
            for (let i = 0; i < 15; i++) inc('user-A');
            expect(check('user-A').remaining).toBe(5);
            expect(check('user-B').remaining).toBe(20);
        });
    });
});
