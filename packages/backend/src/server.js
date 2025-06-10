// Simple Multi-Disease Platform Backend (JavaScript)
// This can run immediately with just Node.js and Express

const express = require('express');
const http = require('http');

const PORT = process.env.PORT || 5000;

// Simple logger
const logger = {
  info: (message, meta = '') => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = '') => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = '') => console.warn(`[WARN] ${message}`, meta),
};

class MultiDiseaseAPI {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Basic middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept-Language');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'Multi-Disease Treatment Platform',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Serve index.html for root route
    const path = require('path');
    const fs = require('fs');
    this.app.get('/', (req, res) => {
      const indexPath = path.join(__dirname, '../../frontend/public/index.html');
      logger.info(`Trying to serve index.html from: ${indexPath}`);
      
      // Check if file exists
      if (fs.existsSync(indexPath)) {
        logger.info('Index.html file exists, serving...');
        res.sendFile(indexPath);
      } else {
        logger.error('Index.html file not found!');
        res.status(404).send('Login page not found');
      }
    });

    // Authentication endpoints
    this.app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body;
      
      // Simple authentication for now
      if (username === 'admin' && password === 'password') {
        // In a real app, you'd generate a proper JWT token
        const token = 'fake-jwt-token-for-admin';
        res.json({
          success: true,
          token,
          user: {
            id: 'admin-001',
            username: 'admin',
            role: 'SUPERADMIN',
            firstName: 'Super',
            lastName: 'Admin',
            email: 'admin@multidisease.com'
          },
          expiresIn: '24h'
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Username or password is incorrect'
        });
      }
    });

    this.app.post('/api/auth/logout', (req, res) => {
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });

    // API information
    this.app.get('/api/version', (req, res) => {
      res.json({
        name: 'Multi-Disease Treatment Platform',
        version: '1.0.0',
        apiVersion: 'v1',
        environment: process.env.NODE_ENV || 'development',
        features: [
          'Multi-Disease Support',
          'Multi-Entity Management', 
          'Multilingual Interface',
          'Role-Based Access Control (6 roles)',
          'Two-Factor Authentication',
          'Questionnaires & Measurement Groups',
          'Organization Management',
          'Treatment Protocols',
          'Real-time Monitoring',
          'Task-Based Workflows'
        ],
        roles: [
          'SUPERADMIN',
          'HEALTHCARE_PROVIDER_ADMIN', 
          'SERVICE_DESK_ADMIN',
          'DOCTOR',
          'SERVICE_DESK_EMPLOYEE',
          'PATIENT'
        ]
      });
    });

    // In-memory storage for demo (in real app, this would be a database)
    this.organizations = [
      {
        id: 'org_001',
        name: 'General Hospital',
        type: 'HOSPITAL',
        address: {
          street: '123 Medical Center Dr',
          city: 'Healthcare City',
          country: 'USA'
        },
        phone: '+1-555-0123',
        email: 'info@generalhospital.com',
        serviceDeskId: 'org_002',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'org_002',
        name: 'Medical Support Desk',
        type: 'SERVICE_DESK',
        address: {
          street: '456 Support Ave',
          city: 'Tech City',
          country: 'USA'
        },
        phone: '+1-555-0456',
        email: 'support@medicaldesk.com',
        serviceDeskId: null,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    // Organizations API
    this.app.get('/api/organizations', (req, res) => {
      const { type, page = 1, limit = 20 } = req.query;
      
      let organizations = [...this.organizations];

      // Filter by type if provided
      if (type && ['HOSPITAL', 'SERVICE_DESK'].includes(type)) {
        organizations = organizations.filter(org => org.type === type);
      }

      res.json({
        organizations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: organizations.length,
          totalPages: Math.ceil(organizations.length / limit)
        }
      });
    });

    // Create organization (SUPERADMIN only)
    this.app.post('/api/organizations', (req, res) => {
      const { name, type, address, phone, email, website, serviceDeskId, treatments } = req.body;
      
      // Basic validation
      if (!name || !type) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Name and type are required'
        });
      }

      if (!['HOSPITAL', 'SERVICE_DESK'].includes(type)) {
        return res.status(400).json({
          error: 'Invalid type',
          message: 'Type must be HOSPITAL or SERVICE_DESK'
        });
      }

      // For hospitals, service desk is required
      if (type === 'HOSPITAL' && !serviceDeskId) {
        return res.status(400).json({
          error: 'Service desk required',
          message: 'Hospitals must be linked to a service desk'
        });
      }

      // Generate new ID
      const newId = `org_${String(this.organizations.length + 1).padStart(3, '0')}`;
      
      const newOrganization = {
        id: newId,
        name,
        type,
        address: address || {},
        phone: phone || null,
        email: email || null,
        website: website || null,
        serviceDeskId: type === 'HOSPITAL' ? serviceDeskId : null,
        treatments: treatments || [],
        isActive: true,
        createdAt: new Date().toISOString()
      };

      this.organizations.push(newOrganization);

      logger.info(`Organization created: ${name} (${type})`);

      res.status(201).json({
        success: true,
        organization: newOrganization,
        message: 'Organization created successfully'
      });
    });

    // Mock Service Desks for hospital assignment
    this.app.get('/api/organizations/service-desks', (req, res) => {
      res.json({
        serviceDesks: [
          {
            id: 'org_002',
            name: 'Medical Support Desk',
            supportedHospitals: 15,
            isActive: true
          },
          {
            id: 'org_004',
            name: 'Regional Support Center',
            supportedHospitals: 8,
            isActive: true
          }
        ]
      });
    });

    // Mock Diseases API
    this.app.get('/api/diseases', (req, res) => {
      res.json({
        diseases: [
          {
            id: 'dis_001',
            name: 'Diabetes Type 2',
            code: 'E11',
            category: 'Endocrine',
            description: 'Type 2 diabetes mellitus',
            symptoms: ['Increased thirst', 'Frequent urination', 'Fatigue'],
            riskFactors: ['Obesity', 'Physical inactivity', 'Family history']
          },
          {
            id: 'dis_002',
            name: 'Hypertension',
            code: 'I10',
            category: 'Cardiovascular',
            description: 'Essential hypertension',
            symptoms: ['Headaches', 'Shortness of breath', 'Chest pain'],
            riskFactors: ['Age', 'Obesity', 'Smoking', 'High sodium diet']
          },
          {
            id: 'dis_003',
            name: 'Chronic Heart Failure',
            code: 'I50',
            category: 'Cardiovascular',
            description: 'Heart failure, unspecified',
            symptoms: ['Shortness of breath', 'Fatigue', 'Swelling'],
            riskFactors: ['Coronary artery disease', 'High blood pressure', 'Diabetes']
          }
        ]
      });
    });

    // Mock Treatments API
    this.app.get('/api/treatments', (req, res) => {
      res.json({
        treatments: [
          {
            id: 'treat_001',
            name: 'Diabetes Management Protocol',
            diseaseId: 'dis_001',
            description: 'Comprehensive diabetes treatment and monitoring plan',
            guidelines: {
              bloodGlucoseTarget: '80-130 mg/dL',
              hba1cTarget: '<7%',
              exerciseRecommendation: '150 min/week moderate activity'
            },
            questionnaires: ['quest_001', 'quest_002'],
            measurementGroups: ['mg_001', 'mg_002']
          },
          {
            id: 'treat_002',
            name: 'Hypertension Control Plan',
            diseaseId: 'dis_002',
            description: 'Blood pressure management and lifestyle modification protocol',
            guidelines: {
              bloodPressureTarget: '<140/90 mmHg',
              sodiumRestriction: '<2300 mg/day',
              exerciseRecommendation: '30 min/day moderate activity'
            },
            questionnaires: ['quest_003'],
            measurementGroups: ['mg_003']
          }
        ]
      });
    });

    // Mock Questionnaires API
    this.app.get('/api/questionnaires', (req, res) => {
      res.json({
        questionnaires: [
          {
            id: 'quest_001',
            title: 'Daily Diabetes Check-in',
            description: 'Daily symptom and medication adherence questionnaire',
            questions: [
              {
                id: 'q1',
                type: 'scale',
                question: 'How are you feeling today? (1-10)',
                required: true
              },
              {
                id: 'q2',
                type: 'boolean',
                question: 'Did you take your medication as prescribed?',
                required: true
              },
              {
                id: 'q3',
                type: 'text',
                question: 'Any symptoms or concerns today?',
                required: false
              }
            ],
            isActive: true,
            createdBy: 'user_admin'
          }
        ]
      });
    });

    // Mock Measurement Groups API
    this.app.get('/api/measurement-groups', (req, res) => {
      res.json({
        measurementGroups: [
          {
            id: 'mg_001',
            name: 'Diabetes Vitals',
            description: 'Essential measurements for diabetes monitoring',
            measurements: [
              {
                name: 'Blood Glucose',
                unit: 'mg/dL',
                type: 'numeric',
                normalRange: '80-130'
              },
              {
                name: 'Blood Pressure',
                unit: 'mmHg',
                type: 'blood_pressure',
                normalRange: '<140/90'
              },
              {
                name: 'Weight',
                unit: 'kg',
                type: 'numeric',
                normalRange: 'varies'
              }
            ],
            isActive: true,
            createdBy: 'user_admin'
          }
        ]
      });
    });

    // Mock Users API
    this.app.get('/api/users/roles', (req, res) => {
      res.json({
        roles: [
          {
            name: 'SUPERADMIN',
            description: 'Full system access and configuration',
            permissions: ['*']
          },
          {
            name: 'HEALTHCARE_PROVIDER_ADMIN',
            description: 'Organization-level healthcare administration',
            permissions: ['manage_providers', 'view_patients', 'create_questionnaires']
          },
          {
            name: 'SERVICE_DESK_ADMIN',
            description: 'Service desk administration and support',
            permissions: ['manage_support', 'create_questionnaires', 'view_organizations']
          },
          {
            name: 'DOCTOR',
            description: 'Patient care and treatment management',
            permissions: ['manage_patients', 'assign_treatments', 'view_data']
          },
          {
            name: 'SERVICE_DESK_EMPLOYEE',
            description: 'Technical support and user assistance',
            permissions: ['provide_support', 'view_tickets']
          },
          {
            name: 'PATIENT',
            description: 'Personal health data and self-monitoring',
            permissions: ['view_own_data', 'submit_responses', 'communicate']
          }
        ]
      });
    });

    // Documentation endpoint
    this.app.get('/docs', (req, res) => {
      res.json({
        title: 'Multi-Disease Treatment Platform API',
        description: 'A comprehensive platform for remote treatment monitoring across multiple diseases',
        version: '1.0.0',
        endpoints: {
          'GET /health': 'System health check',
          'GET /api/version': 'API version and feature information',
          'GET /api/organizations': 'List organizations (hospitals and service desks)',
          'GET /api/organizations/service-desks': 'List available service desks',
          'GET /api/diseases': 'List supported diseases',
          'GET /api/treatments': 'List treatment protocols',
          'GET /api/questionnaires': 'List questionnaires',
          'GET /api/measurement-groups': 'List measurement groups',
          'GET /api/users/roles': 'List user roles and permissions',
          'GET /docs': 'This documentation'
        },
        roleHierarchy: {
          SUPERADMIN: 'Can create organizations, treatments, and manage everything',
          HEALTHCARE_PROVIDER_ADMIN: 'Can manage healthcare providers and create questionnaires',
          SERVICE_DESK_ADMIN: 'Can manage service desk operations and create questionnaires',
          DOCTOR: 'Can manage patients and assign treatments',
          SERVICE_DESK_EMPLOYEE: 'Can provide technical support',
          PATIENT: 'Can submit responses and view personal data'
        }
      });
    });

    // Serve static files from frontend
    const frontendPath = path.join(__dirname, '../../frontend/public');
    logger.info(`Serving static files from: ${frontendPath}`);
    this.app.use(express.static(frontendPath));

    // 404 handler (after static files)
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `${req.method} ${req.originalUrl} not found`,
        availableEndpoints: [
          'GET /health',
          'GET /api/version',
          'GET /api/organizations',
          'GET /api/diseases',
          'GET /api/treatments',
          'GET /api/questionnaires',
          'GET /api/measurement-groups',
          'GET /api/users/roles',
          'GET /docs'
        ]
      });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error.message);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });
  }

  start() {
    this.server.listen(PORT, () => {
      logger.info(`🚀 Multi-Disease Platform API running on port ${PORT}`);
      logger.info(`📚 Health Check: http://localhost:${PORT}/health`);
      logger.info(`📖 Documentation: http://localhost:${PORT}/docs`);
      logger.info(`🔧 API Info: http://localhost:${PORT}/api/version`);
      logger.info(`🏥 Organizations: http://localhost:${PORT}/api/organizations`);
      logger.info(`💊 Diseases: http://localhost:${PORT}/api/diseases`);
      logger.info(`🩺 Treatments: http://localhost:${PORT}/api/treatments`);
      logger.info(`📋 Questionnaires: http://localhost:${PORT}/api/questionnaires`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      this.server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the application
const api = new MultiDiseaseAPI();
api.start(); 