import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { authorizeDb } from '../middleware/authorizeDb'
import { getSocialLinks, upsertSocialLinks } from '../controllers/socialLinksController'

const router = Router()

router.get('/', authenticate, authorizeDb('social_links.view', 'social_links.manage'), getSocialLinks)
router.put('/', authenticate, authorizeDb('social_links.manage'), upsertSocialLinks)

export default router
