const listNotificationOpts = {
	schema: {
		querystring: {
			type: "object",
			properties: {
				page: {
					type: "integer",
					minimum: 1,
					default: 1,
				},
				limit: {
					type: "integer",
					minimum: 1,
					maximum: 100,
					default: 20,
				},
			},
		},
	},
};

const markNotificationReadOpts = {
	schema: {
		params: {
			type: "object",
			properties: {
				notificationId: {
					type: "integer",
					minimum: 1,
				},
			},
			required: ["notificationId"],
		},
	},
};

const markMessageNotificationReadOpts = {
	schema: {
		params: {
			type: "object",
			properties: {
				chatId: {
					type: "integer",
					minimum: 1,
				},
			},
			required: ["chatId"],
		},
	},
};

const markMessageNotificationByIdReadOpts = {
	schema: {
		params: {
			type: "object",
			properties: {
				messageId: {
					type: "integer",
					minimum: 1,
				},
			},
			required: ["messageId"],
		},
	},
};

module.exports = {
	listNotificationOpts,
	markNotificationReadOpts,
	markMessageNotificationReadOpts,
};
