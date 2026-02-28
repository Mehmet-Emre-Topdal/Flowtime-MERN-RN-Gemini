// Shared Firebase mock for all route tests
// Individual tests can override mockCollection behaviour via jest.mocked

export const mockDocGet = jest.fn();
export const mockDocSet = jest.fn();
export const mockDocUpdate = jest.fn();
export const mockDocDelete = jest.fn();
export const mockDocRef = {
    get: mockDocGet,
    set: mockDocSet,
    update: mockDocUpdate,
    delete: mockDocDelete,
    id: 'mock-doc-id',
};

export const mockGet = jest.fn();
export const mockQueryRef = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    get: mockGet,
};

export const mockAdd = jest.fn();
export const mockBatch = {
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
};

export const mockCollection = jest.fn().mockReturnValue({
    ...mockQueryRef,
    doc: jest.fn().mockReturnValue(mockDocRef),
    add: mockAdd,
});

export const adminDb = {
    collection: mockCollection,
    batch: jest.fn().mockReturnValue(mockBatch),
};

export const adminAuth = {
    verifyIdToken: jest.fn(),
};
