const { 
	listNotificationOpts,
	markNotificationReadOpts,
	markMessageNotificationReadOpts 
} = require("../schemas/notificationSchemas");

async function notificationRoutes(fastify, options) {
	const { notificationModel } = options;
	const {
		listMessageNotifications,
		listOtherNotifications,
		indirectMarkMessageNotificiationAsRead,
		markMessageNotificationAsRead,
		markNonMessageNotificationAsRead,
		markAllNonMessageNotificationsAsOpened,
	} = require("../controllers/notificationController")(notificationModel);

	fastify.get(
		"/messages",
		{
			preHandler: fastify.authenticate,
			schema: listNotificationOpts.schema,
		},
		listMessageNotifications
	);
	
	fastify.get(
		"/others",
		{
			preHandler: fastify.authenticate,
			schema: listNotificationOpts.schema,
		},
		listOtherNotifications
	);
	
	// Alias for /others (singular)
	fastify.get(
		"/other",
		{
			preHandler: fastify.authenticate,
			schema: listNotificationOpts.schema,
		},
		listOtherNotifications
	);
	
	fastify.patch(
		"/messages/by-chat/:chatId",
		{ 
			preHandler: fastify.authenticate,
			schema: markMessageNotificationReadOpts.schema,
		},
		indirectMarkMessageNotificiationAsRead
	);
	
	// Mark message notification as read by notification ID
	fastify.put(
		"/messages/:notificationId/read",
		{ 
			preHandler: fastify.authenticate,
			schema: markNotificationReadOpts.schema,
		},
		markMessageNotificationAsRead
	);
	
	// Support both PUT and PATCH for marking notifications as read
	fastify.put(
		"/:notificationId/read",
		{ 
			preHandler: fastify.authenticate,
			schema: markNotificationReadOpts.schema,
		},
		markNonMessageNotificationAsRead
	);
	
	fastify.patch(
		"/others/:notificationId",
		{ 
			preHandler: fastify.authenticate,
			schema: markNotificationReadOpts.schema,
		},
		markNonMessageNotificationAsRead
	);
	
	fastify.patch(
		"/others",
		{ preHandler: fastify.authenticate },
		markAllNonMessageNotificationsAsOpened
	);
	
	// Mark all non-message notifications as opened
	fastify.put(
		"/mark-all-opened",
		{ preHandler: fastify.authenticate },
		markAllNonMessageNotificationsAsOpened
	);
}

module.exports = notificationRoutes;
