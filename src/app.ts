import express from 'express';
const router = express.Router();

import cors from 'cors';
import config from './config';
import { errorHandler, jsonParseErrorHandler, methodNotAllowedErrorHandler, notFoundErrorHandler, payloadTooLargeErrorHandler, uuidErrorHandler } from './middleware/error_middleware';
import { errorLogger, requestLogger } from './middleware/logging_middleware';

// Import controllers
import health from './routes/health';
import resource from './routes/resource';
import test from './routes/testing_resources';
import admin_resource from './routes/v1/admin_resource';
import village_resource from './routes/v1/village_resource';
import village_detail from './routes/v1/village_detail';
import users_resource from './routes/v1/users_resource';
import resident_resource from './routes/v1/resident_resource';
import visit_resource from './routes/v1/visit_resource';
import announcement_detail from './routes/v1/announcement_detail';
import announcement_resource from './routes/v1/announcement_resource';
import visitor_resource from './routes/v1/visitor_resource';

const createServer = (app) => {
    app.disable('x-powered-by');
    // Enable all cors requests
    app.use(cors());
    app.use(requestLogger);
    app.use(express.json({ limit: config.storage.requestBodyPayloadSizeLimit }));
    app.use(jsonParseErrorHandler);
    app.use(express.urlencoded({ limit: config.storage.requestBodyPayloadSizeLimit, extended: false }));
    app.use(payloadTooLargeErrorHandler);

    // Health checks
    app.use('/health', health, router.all('/', methodNotAllowedErrorHandler));

    // Only load test route if in development or tests
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        app.use('/test', test, router.all('/', methodNotAllowedErrorHandler));
    }

    // Set routes
    app.use('/index', resource, router.all('/', methodNotAllowedErrorHandler));

    // Admin routes
    app.use('/api/v1/admin', admin_resource, router.all('/', methodNotAllowedErrorHandler));
    // village routes
    app.use('/api/v1/village/:villageId', village_detail, router.all('/', methodNotAllowedErrorHandler));
    app.use('/api/v1/village', village_resource, router.all('/', methodNotAllowedErrorHandler));
    // User routes
    app.use('/api/v1/users', users_resource, router.all('/', methodNotAllowedErrorHandler));
    // Resident routes
    app.use('/api/v1/resident', resident_resource, router.all('/', methodNotAllowedErrorHandler));
    // Visit routes
    app.use('/api/v1/visit', visit_resource, router.all('/', methodNotAllowedErrorHandler));
    // Announcement routes
    app.use('/api/v1/announcement/:announcementId', announcement_detail, router.all('/', methodNotAllowedErrorHandler));
    app.use('/api/v1/announcement', announcement_resource, router.all('/', methodNotAllowedErrorHandler));
    // Visitor routes
    app.use('/api/v1/visitor', visitor_resource, router.all('/', methodNotAllowedErrorHandler));

    // Middleware error handlers
    app.use(notFoundErrorHandler);
    app.use(errorLogger);
    app.use(uuidErrorHandler);
    app.use(errorHandler);
};

export default createServer;
