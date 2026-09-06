const raw = String(process.env.GIT_SHA || process.env.GITHUB_SHA || 'dev')
export const GIT_SHA = raw
export const GIT_SHORT = raw === 'dev' ? 'dev' : raw.slice(0, 7)
