import { type Category, type Deal, getDeal, searchDeals, type SearchFilters } from './search-bridge'

export type Me = {
  deviceId: string
  plan: 'free' | 'plus'
  limit: number
  used: number
  freeLimit: number
  plusLimit: number
  plusPrice: string
  telegram: { configured: boolean; linked: boolean; username: string | null }
}

export type WatchDto = {
  id: string
  productId?: string | null
  title: string
  query?: string | null
  category?: string | null
  targetPrice: number
  telegram?: string | null
  notify: string
  createdAt: string
}

function headers(): HeadersInit {
  const id = deviceIdSafe()
  return { 'Content-Type': 'application/json', 'X-Device-Id': id }
}

function deviceIdSafe() {
  try {
    return localStorage.getItem('cercatrova.device.v1') || ''
  } catch {
    return ''
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { ...headers(), ...(init?.headers || {}) } })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string }
  if (!res.ok) {
    const err = new Error(data.message || data.error || res.statusText)
    ;(err as Error & { status: number }).status = res.status
    throw err
  }
  return data
}

export async function apiHealth() {
  return req<{ ok: boolean; telegram: boolean }>('/api/health')
}

export async function apiSearch(filters: SearchFilters): Promise<Deal[]> {
  try {
    const max = filters.maxPrice == null ? '' : `&maxPrice=${filters.maxPrice}`
    const data = await req<{ results: Deal[] }>(
      `/api/search?q=${encodeURIComponent(filters.query)}&category=${filters.category}&mode=${filters.mode}&onlyFree=${filters.onlyFree ? 1 : 0}${max}`,
    )
    return data.results
  } catch {
    return searchDeals(filters)
  }
}

export async function apiProduct(id: string): Promise<Deal | undefined> {
  try {
    const data = await req<{ product: Deal }>(`/api/products/${encodeURIComponent(id)}`)
    return data.product
  } catch {
    return getDeal(id)
  }
}

export async function apiRefresh(id: string): Promise<Deal | undefined> {
  try {
    const data = await req<{ product: Deal }>(`/api/products/${encodeURIComponent(id)}/refresh`, {
      method: 'POST',
    })
    return data.product
  } catch {
    return getDeal(id)
  }
}

export async function apiMe(): Promise<Me | null> {
  try {
    return await req<Me>('/api/me')
  } catch {
    return null
  }
}

export async function apiWatches(): Promise<WatchDto[]> {
  try {
    const data = await req<{ watches: WatchDto[] }>('/api/watches')
    return data.watches
  } catch {
    return []
  }
}

export async function apiAddWatch(body: {
  productId?: string
  title: string
  query?: string
  category?: Category | 'all' | string
  targetPrice: number
  telegram?: string
  notify?: string
}) {
  return req<{ ok: boolean; watch: WatchDto }>('/api/watches', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function apiRemoveWatch(id: string) {
  return req<{ ok: boolean }>(`/api/watches/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function apiTelegramLink() {
  return req<{ url: string; configured: boolean; already: boolean }>('/api/telegram/link', {
    method: 'POST',
  })
}

export async function apiUnlockPlus(key: string) {
  return req<{ ok: boolean; plan: string }>(`/api/plus`, {
    method: 'POST',
    body: JSON.stringify({ key }),
  })
}
