import PluginManager from 'src/plugin-system/plugin.manager.js';

import { ProCustomerReviews } from './plugin/pro-customer-reviews.plugin.js';

PluginManager.register('ProGoogleReviews', ProCustomerReviews, '[data-pro-customer-reviews]');
