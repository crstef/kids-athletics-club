"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRequest = exports.rejectRequest = exports.approveRequest = exports.getAllApprovalRequests = void 0;
const database_1 = __importDefault(require("../config/database"));
const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth)
        return null;
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime()))
        return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
const determineCategory = (age) => {
    if (age === null || age < 0)
        return null;
    if (age < 6)
        return 'U6';
    if (age < 8)
        return 'U8';
    if (age < 10)
        return 'U10';
    if (age < 12)
        return 'U12';
    if (age < 14)
        return 'U14';
    if (age < 16)
        return 'U16';
    return 'U18';
};
const parseApprovalMetadata = (raw) => {
    if (!raw) {
        return { message: null, profile: null };
    }
    if (typeof raw !== 'string') {
        return { message: String(raw), profile: null };
    }
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            const message = typeof parsed.message === 'string' ? parsed.message : null;
            const profile = parsed.profile && typeof parsed.profile === 'object'
                ? parsed.profile
                : null;
            if (profile?.dateOfBirth) {
                const derivedAge = calculateAge(profile.dateOfBirth);
                const derivedCategory = determineCategory(derivedAge);
                profile.age = derivedAge ?? undefined;
                profile.category = derivedCategory ?? undefined;
            }
            return { message, profile };
        }
    }
    catch (_error) {
        // fall back to string value below
    }
    return { message: raw, profile: null };
};
const getAllApprovalRequests = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const authUser = req.user;
        const query = `
      SELECT 
        ar.id,
        ar.user_id,
        ar.requested_role,
        ar.status,
        ar.request_date,
        ar.response_date,
        ar.approved_by,
        ar.rejection_reason,
        COALESCE(ar.coach_id, fallback.coach_id) AS effective_coach_id,
        COALESCE(ar.athlete_id, fallback.athlete_id) AS effective_athlete_id,
        COALESCE(ar.child_name, fallback.child_name) AS effective_child_name,
        COALESCE(ar.approval_notes, fallback.approval_notes) AS effective_approval_notes
      FROM approval_requests ar
      LEFT JOIN LATERAL (
        SELECT 
          access_requests.coach_id,
          access_requests.athlete_id,
          CONCAT_WS(' ', athletes.first_name, athletes.last_name) AS child_name,
          access_requests.message AS approval_notes
        FROM access_requests
        LEFT JOIN athletes ON athletes.id = access_requests.athlete_id
        WHERE access_requests.parent_id = ar.user_id
          AND access_requests.status = 'pending'
        ORDER BY access_requests.request_date DESC
        LIMIT 1
      ) AS fallback ON true
      ORDER BY ar.request_date DESC
    `;
        const result = await client.query(query);
        let mapped = result.rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            coachId: r.effective_coach_id,
            athleteId: r.effective_athlete_id,
            requestedRole: r.requested_role,
            status: r.status,
            requestDate: r.request_date,
            responseDate: r.response_date,
            approvedBy: r.approved_by,
            rejectionReason: r.rejection_reason,
            childName: r.effective_child_name,
            ...(() => {
                const meta = parseApprovalMetadata(r.effective_approval_notes);
                return {
                    approvalNotes: meta.message,
                    athleteProfile: meta.profile || undefined
                };
            })()
        }));
        if (authUser?.role === 'coach') {
            mapped = mapped.filter(request => request.coachId === authUser.userId && (request.requestedRole === 'parent' || request.requestedRole === 'athlete'));
        }
        else if (authUser?.role && authUser.role !== 'superadmin') {
            mapped = mapped.filter(request => request.userId === authUser.userId);
        }
        res.json(mapped);
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.getAllApprovalRequests = getAllApprovalRequests;
const approveRequest = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        const authUser = req.user;
        const requestId = req.params.id;
        const requestResult = await client.query(`SELECT 
         ar.*,
         COALESCE(ar.coach_id, fallback.coach_id) AS effective_coach_id,
         COALESCE(ar.athlete_id, fallback.athlete_id) AS effective_athlete_id,
         COALESCE(ar.child_name, fallback.child_name) AS effective_child_name,
         COALESCE(ar.approval_notes, fallback.approval_notes) AS effective_approval_notes
       FROM approval_requests ar
       LEFT JOIN LATERAL (
         SELECT 
           access_requests.coach_id,
           access_requests.athlete_id,
           CONCAT_WS(' ', athletes.first_name, athletes.last_name) AS child_name,
           access_requests.message AS approval_notes
         FROM access_requests
         LEFT JOIN athletes ON athletes.id = access_requests.athlete_id
         WHERE access_requests.parent_id = ar.user_id
           AND access_requests.status = 'pending'
         ORDER BY access_requests.request_date DESC
         LIMIT 1
       ) AS fallback ON true
       WHERE ar.id = $1
       FOR UPDATE`, [requestId]);
        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }
        const request = requestResult.rows[0];
        if (request.status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Request already processed' });
        }
        const approverId = authUser?.userId || null;
        const effectiveCoachId = request.effective_coach_id;
        const effectiveAthleteId = request.effective_athlete_id;
        const approvalMetadata = parseApprovalMetadata(request.effective_approval_notes);
        switch (request.requested_role) {
            case 'parent': {
                if (authUser?.role !== 'superadmin' && authUser?.userId !== effectiveCoachId) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'Not authorized to approve this request' });
                }
                await client.query('UPDATE users SET is_active = true, needs_approval = false, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2', [approverId, request.user_id]);
                if (effectiveAthleteId && effectiveCoachId) {
                    const updateAccess = await client.query(`UPDATE access_requests
             SET status = 'approved', response_date = CURRENT_TIMESTAMP
             WHERE parent_id = $1 AND athlete_id = $2 AND coach_id = $3`, [request.user_id, effectiveAthleteId, effectiveCoachId]);
                    if (updateAccess.rowCount === 0) {
                        await client.query(`INSERT INTO access_requests (parent_id, athlete_id, coach_id, status, response_date, message)
               VALUES ($1, $2, $3, 'approved', CURRENT_TIMESTAMP, $4)`, [
                            request.user_id,
                            effectiveAthleteId,
                            effectiveCoachId,
                            approvalMetadata.message ?? request.effective_approval_notes ?? null
                        ]);
                    }
                }
                break;
            }
            case 'athlete': {
                if (authUser?.role !== 'superadmin' && authUser?.userId !== effectiveCoachId) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'Not authorized to approve this request' });
                }
                const userResult = await client.query('SELECT first_name, last_name FROM users WHERE id = $1 FOR UPDATE', [request.user_id]);
                if (userResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(404).json({ error: 'User not found for approval request' });
                }
                const userRow = userResult.rows[0];
                const profile = approvalMetadata.profile;
                if (!profile?.dateOfBirth || !profile.gender) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'Missing athlete profile data for approval' });
                }
                const derivedAge = calculateAge(profile.dateOfBirth);
                const derivedCategory = determineCategory(derivedAge);
                if (derivedAge === null || derivedAge < 4 || derivedAge > 18 || !derivedCategory) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'Invalid athlete age or category' });
                }
                const athleteInsert = await client.query(`INSERT INTO athletes (first_name, last_name, age, category, gender, date_of_birth, date_joined, coach_id)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
           RETURNING id`, [
                    userRow.first_name,
                    userRow.last_name,
                    derivedAge,
                    derivedCategory,
                    profile.gender,
                    profile.dateOfBirth,
                    effectiveCoachId
                ]);
                const createdAthleteId = athleteInsert.rows[0]?.id;
                await client.query('UPDATE users SET athlete_id = $1, is_active = true, needs_approval = false, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3', [createdAthleteId, approverId, request.user_id]);
                await client.query('UPDATE approval_requests SET athlete_id = $1 WHERE id = $2', [createdAthleteId, request.id]);
                break;
            }
            case 'coach': {
                if (authUser?.role !== 'superadmin') {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'Not authorized to approve this request' });
                }
                await client.query('UPDATE users SET is_active = true, needs_approval = false, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2', [approverId, request.user_id]);
                break;
            }
            default: {
                if (authUser?.role !== 'superadmin') {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'Not authorized to approve this request' });
                }
                await client.query('UPDATE users SET is_active = true, needs_approval = false, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2', [approverId, request.user_id]);
            }
        }
        await client.query(`UPDATE approval_requests
       SET status = 'approved', response_date = CURRENT_TIMESTAMP, approved_by = $1
       WHERE id = $2`, [approverId, requestId]);
        await client.query('COMMIT');
        res.json({ message: 'Request approved successfully' });
    }
    catch (_error) {
        await client.query('ROLLBACK');
        // Surface the underlying issue for easier debugging in development
        console.error('approveRequest error', _error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.approveRequest = approveRequest;
const rejectRequest = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        const authUser = req.user;
        const requestId = req.params.id;
        const { reason } = req.body;
        const requestResult = await client.query(`SELECT 
         ar.*,
         COALESCE(ar.coach_id, fallback.coach_id) AS effective_coach_id,
         COALESCE(ar.athlete_id, fallback.athlete_id) AS effective_athlete_id,
         COALESCE(ar.approval_notes, fallback.approval_notes) AS effective_approval_notes
       FROM approval_requests ar
       LEFT JOIN LATERAL (
         SELECT 
           access_requests.coach_id,
           access_requests.athlete_id,
           access_requests.message AS approval_notes
         FROM access_requests
         WHERE access_requests.parent_id = ar.user_id
           AND access_requests.status = 'pending'
         ORDER BY access_requests.request_date DESC
         LIMIT 1
       ) AS fallback ON true
       WHERE ar.id = $1
       FOR UPDATE`, [requestId]);
        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }
        const request = requestResult.rows[0];
        if (request.status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Request already processed' });
        }
        const effectiveCoachId = request.effective_coach_id;
        const effectiveAthleteId = request.effective_athlete_id;
        switch (request.requested_role) {
            case 'parent': {
                if (authUser?.role !== 'superadmin' && authUser?.userId !== effectiveCoachId) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'Not authorized to reject this request' });
                }
                if (effectiveAthleteId && effectiveCoachId) {
                    await client.query(`UPDATE access_requests
             SET status = 'rejected', response_date = CURRENT_TIMESTAMP
             WHERE parent_id = $1 AND athlete_id = $2 AND coach_id = $3`, [request.user_id, effectiveAthleteId, effectiveCoachId]);
                }
                break;
            }
            case 'athlete': {
                if (authUser?.role !== 'superadmin' && authUser?.userId !== effectiveCoachId) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'Not authorized to reject this request' });
                }
                break;
            }
            case 'coach': {
                if (authUser?.role !== 'superadmin') {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'Not authorized to reject this request' });
                }
                break;
            }
            default: {
                if (authUser?.role !== 'superadmin') {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ error: 'Not authorized to reject this request' });
                }
            }
        }
        await client.query(`UPDATE approval_requests
       SET status = 'rejected', response_date = CURRENT_TIMESTAMP,
           approved_by = $1, rejection_reason = $2
       WHERE id = $3`, [authUser?.userId || null, reason || null, requestId]);
        await client.query('COMMIT');
        res.json({ message: 'Request rejected successfully' });
    }
    catch (_error) {
        await client.query('ROLLBACK');
        console.error('rejectRequest error', _error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.rejectRequest = rejectRequest;
const deleteRequest = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('DELETE FROM approval_requests WHERE id = $1', [req.params.id]);
        res.json({ message: 'Request deleted successfully' });
    }
    catch (_error) {
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
};
exports.deleteRequest = deleteRequest;
