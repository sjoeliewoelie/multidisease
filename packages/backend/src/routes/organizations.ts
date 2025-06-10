import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { OrganizationService } from '../services/organizationService';
import { requireRole } from '../middleware/roleCheck';
import { UserRoleType } from '@prisma/client';
import { logger } from '../utils/logger';

const router = Router();
const organizationService = new OrganizationService();

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get organizations with filtering and pagination
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [HOSPITAL, SERVICE_DESK]
 *         description: Filter by organization type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of organizations per page
 *     responses:
 *       200:
 *         description: List of organizations
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', 
  [
    query('type').optional().isIn(['HOSPITAL', 'SERVICE_DESK']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, page = 1, limit = 20 } = req.query;
      const result = await organizationService.getOrganizations({
        type: type as string,
        page: Number(page),
        limit: Number(limit),
      });

      res.json(result);
    } catch (error) {
      logger.error('Error fetching organizations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create a new organization (SUPERADMIN only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [HOSPITAL, SERVICE_DESK]
 *               address:
 *                 type: object
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               website:
 *                 type: string
 *               serviceDeskId:
 *                 type: string
 *                 description: Required when type is HOSPITAL
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 */
router.post('/',
  requireRole([UserRoleType.SUPERADMIN]),
  [
    body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
    body('type').isIn(['HOSPITAL', 'SERVICE_DESK']),
    body('address').isObject(),
    body('phone').optional().isMobilePhone('any'),
    body('email').optional().isEmail(),
    body('website').optional().isURL(),
    body('serviceDeskId').custom((value, { req }) => {
      if (req.body.type === 'HOSPITAL' && !value) {
        throw new Error('Service desk is required for hospitals');
      }
      return true;
    }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const organization = await organizationService.createOrganization(req.body);
      
      logger.info(`Organization created: ${organization.name}`, {
        organizationId: organization.id,
        type: organization.type,
        createdBy: req.user?.id,
      });

      res.status(201).json(organization);
    } catch (error) {
      logger.error('Error creating organization:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization details
 *       404:
 *         description: Organization not found
 */
router.get('/:id',
  [param('id').isString().notEmpty()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const organization = await organizationService.getOrganizationById(req.params.id);
      
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      res.json(organization);
    } catch (error) {
      logger.error('Error fetching organization:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /api/organizations/{id}:
 *   put:
 *     summary: Update organization (SUPERADMIN only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: object
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               website:
 *                 type: string
 *               serviceDeskId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *       404:
 *         description: Organization not found
 */
router.put('/:id',
  requireRole([UserRoleType.SUPERADMIN]),
  [
    param('id').isString().notEmpty(),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('address').optional().isObject(),
    body('phone').optional().isMobilePhone('any'),
    body('email').optional().isEmail(),
    body('website').optional().isURL(),
    body('serviceDeskId').optional().isString(),
    body('isActive').optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const organization = await organizationService.updateOrganization(
        req.params.id,
        req.body
      );

      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      logger.info(`Organization updated: ${organization.name}`, {
        organizationId: organization.id,
        updatedBy: req.user?.id,
      });

      res.json(organization);
    } catch (error) {
      logger.error('Error updating organization:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /api/organizations/service-desks:
 *   get:
 *     summary: Get all service desks for hospital assignment
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of service desk organizations
 */
router.get('/service-desks',
  requireRole([UserRoleType.SUPERADMIN]),
  async (req: Request, res: Response) => {
    try {
      const serviceDesks = await organizationService.getServiceDesks();
      res.json(serviceDesks);
    } catch (error) {
      logger.error('Error fetching service desks:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router; 