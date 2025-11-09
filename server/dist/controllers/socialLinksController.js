"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertSocialLinks = exports.getPublicSocialLinks = exports.getSocialLinks = void 0;
const database_1 = __importDefault(require("../config/database"));
const SUPPORTED_PLATFORMS = ['facebook', 'instagram'];
const sanitizeUrl = (value) => {
    if (value === null || value === undefined) {
        return { url: null };
    }
    if (typeof value !== 'string') {
        return { url: null, error: 'URL invalidă' };
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return { url: null };
    }
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        const parsed = new URL(normalized);
        if (!parsed.hostname) {
            return { url: null, error: 'URL invalidă' };
        }
        return { url: parsed.toString() };
    }
    catch (error) {
        return { url: null, error: 'URL invalidă' };
    }
};
const mapRow = (row) => ({
    id: row.id,
    platform: row.platform,
    url: row.url,
    isActive: !!row.is_active,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
});
const fetchLinks = async (client = database_1.default, includeInactive = true) => {
    const query = includeInactive
        ? 'SELECT id, platform, url, is_active, updated_at, updated_by FROM social_links ORDER BY platform'
        : `SELECT id, platform, url, is_active, updated_at, updated_by
       FROM social_links
       WHERE is_active = TRUE AND url IS NOT NULL AND url <> ''
       ORDER BY platform`;
    const result = await client.query(query);
    return result.rows.map(mapRow);
};
const getSocialLinks = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const links = await fetchLinks(client);
        return res.json({ links });
    }
    catch (error) {
        console.error('getSocialLinks error:', error);
        return res.status(500).json({ error: 'Nu am putut încărca link-urile sociale' });
    }
    finally {
        client.release();
    }
};
exports.getSocialLinks = getSocialLinks;
const getPublicSocialLinks = async (_req, res) => {
    const client = await database_1.default.connect();
    try {
        const links = await fetchLinks(client, false);
        return res.json({ links });
    }
    catch (error) {
        console.error('getPublicSocialLinks error:', error);
        return res.status(500).json({ error: 'Nu am putut încărca link-urile sociale' });
    }
    finally {
        client.release();
    }
};
exports.getPublicSocialLinks = getPublicSocialLinks;
const upsertSocialLinks = async (req, res) => {
    const { links } = req.body ?? {};
    if (!Array.isArray(links)) {
        return res.status(400).json({ error: 'Payload invalid - lipsește lista de link-uri' });
    }
    const normalizedInputs = [];
    for (const rawLink of links) {
        if (!rawLink || typeof rawLink !== 'object') {
            return res.status(400).json({ error: 'Structura unui link social este invalidă' });
        }
        const platform = typeof rawLink.platform === 'string' ? rawLink.platform.trim().toLowerCase() : '';
        if (!SUPPORTED_PLATFORMS.includes(platform)) {
            return res.status(400).json({ error: `Platforma ${rawLink.platform ?? ''} nu este suportată` });
        }
        const { url, error } = sanitizeUrl(rawLink.url);
        if (error && rawLink.url) {
            return res.status(400).json({ error });
        }
        const explicitActive = typeof rawLink.isActive === 'boolean' ? rawLink.isActive : undefined;
        const derivedActive = explicitActive ?? !!url;
        const isActive = url ? derivedActive : false;
        normalizedInputs.push({ platform, url, isActive });
    }
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        for (const input of normalizedInputs) {
            await client.query(`INSERT INTO social_links (platform, url, is_active, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (platform)
         DO UPDATE SET
           url = EXCLUDED.url,
           is_active = EXCLUDED.is_active,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()`, [input.platform, input.url, input.isActive, req.user?.userId ?? null]);
        }
        await client.query('COMMIT');
        const links = await fetchLinks(client);
        return res.json({ links });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('upsertSocialLinks error:', error);
        return res.status(500).json({ error: 'Nu am putut salva link-urile sociale' });
    }
    finally {
        client.release();
    }
};
exports.upsertSocialLinks = upsertSocialLinks;
