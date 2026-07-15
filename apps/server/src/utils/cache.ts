// Dedicated standalone cache store to break circular dependency paths
export const userMembershipsCache = new Map<string, string[]>()
