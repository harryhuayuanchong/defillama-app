// import Redis from 'ioredis'

let redis = null as null | import('ioredis').Redis

if (typeof window === 'undefined') {
	// Server-side execution
	const { Redis } = require('ioredis') as typeof import('ioredis')
	const REDIS_URL = process.env.REDIS_URL as string
	redis = REDIS_URL ? new Redis(REDIS_URL) : null
}

export const sluggify = (input: string) => {
	const slug = decodeURIComponent(input)
		.toLowerCase()
		.replace(/[^\w\/]+/g, '-')
	return slug.replace(/^-+/, '').replace(/-+$/, '')
}

/**
 * RedisCacheObject is the object stored in Redis
 *
 * @property {string} Body - base64 encoded string of the content, e.g. image, html, etc.
 * @property {string} ContentType - the content type of the content, e.g. image/jpeg, text/html, etc.
 */
export type RedisCacheObject = {
	Body: string
	ContentType: string
}

export const setCache = async (payload: { Key: string; Body: Buffer; ContentType: string }, ttl?: string | number) => {
	if (!redis) {
		return false
	}

	try {
		const cacheObject: RedisCacheObject = {
			Body: payload.Body.toString('base64'),
			ContentType: payload.ContentType
		}
		if (ttl) {
			await redis.set(payload.Key, JSON.stringify(cacheObject), 'EX', ttl)
		} else {
			await redis.set(payload.Key, JSON.stringify(cacheObject))
		}
		return true
	} catch (error) {
		console.error('[error] [cache] [failed to set]', payload.Key)
		console.error(error)
		return false
	}
}

export const getCache = async (Key: string) => {
	if (!redis) {
		return null
	}

	try {
		const res = await redis.get(Key)
		if (res === null) {
			return null
		}
		const cacheObject: RedisCacheObject = JSON.parse(res)
		const payload = {
			Key,
			Body: Buffer.from(cacheObject.Body, 'base64'),
			ContentType: cacheObject.ContentType
		}
		return payload
	} catch (error) {
		console.error('[error] [cache] [failed to get]', Key)
		console.error(error)
		return null
	}
}

export const deleteCache = async (Key: string) => {
	if (!redis) {
		return true
	}

	try {
		await redis.del(Key)
		return true
	} catch (error) {
		console.error('[error] [cache] [failed to delete]', Key)
		console.error(error)
		return false
	}
}