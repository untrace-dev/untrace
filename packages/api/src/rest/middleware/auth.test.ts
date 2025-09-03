import { eq } from '@untrace/db';
import { db } from '@untrace/db/client';
import { ApiKeys } from '@untrace/db/schema';
import { describe, expect, it, vi } from 'vitest';
import { validateApiKey } from './auth';

// Mock the database
vi.mock('@untrace/db/client', () => ({
  db: {
    query: {
      ApiKeys: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

describe('validateApiKey', () => {
  it('should throw error when authorization header is empty', async () => {
    await expect(validateApiKey('')).rejects.toThrow(
      'Invalid authorization header format',
    );
  });

  it('should throw error when authorization header has invalid format', async () => {
    await expect(validateApiKey('InvalidFormat')).rejects.toThrow(
      'Invalid authorization header format',
    );
  });

  it('should throw error when API key is not found', async () => {
    const mockFindFirst = vi.mocked(db.query.ApiKeys.findFirst);
    mockFindFirst.mockResolvedValue(undefined);

    await expect(validateApiKey('Bearer invalid-key')).rejects.toThrow(
      'Invalid API key',
    );
  });

  it('should throw error when API key is inactive', async () => {
    const mockFindFirst = vi.mocked(db.query.ApiKeys.findFirst);
    mockFindFirst.mockResolvedValue({
      createdAt: new Date(),
      expiresAt: null,
      id: 'ak_test',
      isActive: false,
      key: 'test-key',
      lastUsedAt: null,
      name: 'Test Key',
      orgId: 'org_test',
      projectId: 'proj_test',
      updatedAt: null,
      userId: 'user_test',
    });

    await expect(validateApiKey('Bearer test-key')).rejects.toThrow(
      'API key is inactive',
    );
  });

  it('should throw error when API key has expired', async () => {
    const mockFindFirst = vi.mocked(db.query.ApiKeys.findFirst);
    mockFindFirst.mockResolvedValue({
      createdAt: new Date(),
      expiresAt: new Date('2020-01-01'), // Expired date
      id: 'ak_test',
      isActive: true,
      key: 'test-key',
      lastUsedAt: null,
      name: 'Test Key',
      orgId: 'org_test',
      projectId: 'proj_test',
      updatedAt: null,
      userId: 'user_test',
    });

    await expect(validateApiKey('Bearer test-key')).rejects.toThrow(
      'API key has expired',
    );
  });

  it('should return valid context when API key is valid', async () => {
    const mockFindFirst = vi.mocked(db.query.ApiKeys.findFirst);
    mockFindFirst.mockResolvedValue({
      createdAt: new Date(),
      expiresAt: null,
      id: 'ak_test',
      isActive: true,
      key: 'test-key',
      lastUsedAt: null,
      name: 'Test Key',
      orgId: 'org_test',
      projectId: 'proj_test',
      updatedAt: null,
      userId: 'user_test',
    });

    const result = await validateApiKey('Bearer test-key');

    expect(result).toEqual({
      apiKey: {
        expiresAt: null,
        id: 'ak_test',
        isActive: true,
        key: 'test-key',
        name: 'Test Key',
        orgId: 'org_test',
        projectId: 'proj_test',
        userId: 'user_test',
      },
      auth: {
        orgId: 'org_test',
        projectId: 'proj_test',
        userId: 'user_test',
      },
    });
  });

  it('should extract token from Bearer format', async () => {
    const mockFindFirst = vi.mocked(db.query.ApiKeys.findFirst);
    mockFindFirst.mockResolvedValue({
      createdAt: new Date(),
      expiresAt: null,
      id: 'ak_test',
      isActive: true,
      key: 'test-key',
      lastUsedAt: null,
      name: 'Test Key',
      orgId: 'org_test',
      projectId: 'proj_test',
      updatedAt: null,
      userId: 'user_test',
    });

    await validateApiKey('Bearer test-key');

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: eq(ApiKeys.key, 'test-key'),
    });
  });
});
