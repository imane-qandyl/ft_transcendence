const User = require("../models/User");
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createJWT = (fastify, payload, expiresIn) => {
    return fastify.jwt.sign(payload, { expiresIn });
};

const attachCookiesToReply = (fastify, reply, user, refreshTokenId) => {
    const accessToken = createJWT(fastify, { user }, "5m");
    reply.setCookie("accessToken", accessToken, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true,
        signed: true,
        expires: new Date(Date.now() + 5 * 60 * 1000),
    });

    const refreshToken = createJWT(fastify, { user, refreshTokenId }, "15m");
    reply.setCookie("refreshToken", refreshToken, {
        path: "/api/v1/auth/refresh",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true,
        signed: true,
        expires: new Date(Date.now() + 15 * 60 * 1000),
    });
};

async function loginHandler(fastify, request, reply) {
    const { email, username, password, deviceId } = request.body;
    const emailOrUsername = email || username; // Accept either email or username
    const userModel = new User(fastify.knex);
    const user = await userModel.loginUser(emailOrUsername, password);

    // ⬇ NEW: Check device token
    const existingToken = await fastify.knex("refresh_tokens")
        .where({ user_id: user.id, device_id: deviceId, is_valid: true })
        .first();

    if (existingToken) {
        await fastify.knex("refresh_tokens")
            .update({ is_valid: false })
            .where({ id: existingToken.id });
    }

    // ⬇ NEW: Generate real refresh token & save
    const refreshTokenId = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    await fastify.knex("refresh_tokens").insert({
        refresh_token_id: refreshTokenId,
        ip: request.ip,
        user_agent: request.headers["user-agent"],
        user_id: user.id,
        device_id: deviceId,
        is_valid: true,
        expires_at: expiresAt
    });

    const userPayload = { id: user.id, username: user.username };
    const accessToken = createJWT(fastify, { user: userPayload }, "5m");
    attachCookiesToReply(fastify, reply, userPayload, refreshTokenId);
    reply.send({ token: accessToken, user: userPayload });
}

async function googleAuthHandler(fastify, request, reply) {
    try {
        const { token, deviceId } = request.body;
        const userModel = new User(fastify.knex);

        if (!token || !deviceId) {
            return reply.code(400).send({ 
                error: "Bad Request",
                message: "Google ID token and deviceId are required" 
            });
        }

        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const googlePayload = ticket.getPayload();
        const googleId = googlePayload.sub;
        const email = googlePayload.email;
        const username = googlePayload.name;

        // Find or create user
        let user = await userModel.findByEmail(email, googleId);
        if (!user) {
            user = await userModel.createGoogleUser({ googleId, email, username });
        }

        // Handle refresh tokens
        const existingToken = await fastify.knex("refresh_tokens")
            .where({ user_id: user.id, device_id: deviceId, is_valid: true })
            .first();

        if (existingToken) {
            await fastify.knex("refresh_tokens")
                .update({ is_valid: false })
                .where({ id: existingToken.id });
        }

        const refreshTokenId = crypto.randomBytes(40).toString("hex");
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        await fastify.knex("refresh_tokens").insert({
            refresh_token_id: refreshTokenId,
            ip: request.ip,
            user_agent: request.headers["user-agent"],
            user_id: user.id,
            device_id: deviceId,
            is_valid: true,
            expires_at: expiresAt
        });

        // Create user payload and tokens
        const userPayload = { id: user.id, username: user.username, email: user.email };
        const accessToken = createJWT(fastify, userPayload, "1h"); // Fixed: removed wrapping in { user: ... }
        
        // Set cookies
        attachCookiesToReply(fastify, reply, userPayload, refreshTokenId);
        
        reply.send({ 
            token: accessToken, 
            user: userPayload,
            message: "Google authentication successful"
        });
    } catch (error) {
        console.error('💥 Google auth error:', error);
        
        if (error.message && error.message.includes('Token used too early')) {
            return reply.code(400).send({
                error: "Bad Request",
                message: "Invalid Google token: token used too early"
            });
        }
        
        return reply.code(500).send({
            error: "Internal Server Error",
            message: "Google authentication failed: " + error.message
        });
    }
}

async function refreshTokenHandler(fastify, request, reply) {
    const { refreshToken, deviceId } = request.body;
    
    if (!refreshToken || !deviceId) {
        return reply.code(400).send({
            error: 'Bad Request',
            message: 'Refresh token and device ID are required'
        });
    }
    
    try {
        // Verify the refresh token JWT
        const decoded = fastify.jwt.verify(refreshToken);
        const { user, refreshTokenId } = decoded;
        
        // Check if refresh token exists and is valid in database
        const tokenRecord = await fastify.knex("refresh_tokens")
            .where({
                refresh_token_id: refreshTokenId,
                user_id: user.id,
                device_id: deviceId,
                is_valid: true
            })
            .where('expires_at', '>', new Date())
            .first();
            
        if (!tokenRecord) {
            return reply.code(401).send({
                error: 'Unauthorized',
                message: 'Invalid or expired refresh token'
            });
        }
        
        // Invalidate the old refresh token
        await fastify.knex("refresh_tokens")
            .update({ is_valid: false })
            .where({ id: tokenRecord.id });
        
        // Generate new tokens
        const newRefreshTokenId = crypto.randomBytes(40).toString("hex");
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        // Store new refresh token
        await fastify.knex("refresh_tokens").insert({
            refresh_token_id: newRefreshTokenId,
            ip: request.ip,
            user_agent: request.headers["user-agent"],
            user_id: user.id,
            device_id: deviceId,
            is_valid: true,
            expires_at: expiresAt
        });
        
        // Generate new access token and refresh token
        const accessToken = createJWT(fastify, { user }, "5m");
        const newRefreshToken = createJWT(fastify, { user, refreshTokenId: newRefreshTokenId }, "15m");
        
        // Set cookies if using cookie-based auth
        if (request.headers.cookie) {
            attachCookiesToReply(fastify, reply, user, newRefreshTokenId);
        }
        
        reply.send({
            accessToken,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return reply.code(401).send({
                error: 'Unauthorized',
                message: 'Invalid refresh token'
            });
        }
        throw error;
    }
}

module.exports = (userModel) => {
    const authMethods = {
        register: async (request, reply) => {
            try {
                const { username, email, password } = request.body;
                const user = await userModel.createUser(username, email, password);

                // Don't auto-create character - let user choose their character class
                // Character will be created via the CharacterCreate component

                reply.send(user);
            } catch (error) {
                console.error('Registration error:', error);
                reply.code(400).send({ error: error.message });
            }
        },

        login: async (request, reply) => {
            try {
                const { email, username, password, twoFactorToken } = request.body;
                const emailOrUsername = email || username; // Accept either email or username

                const user = await userModel.loginUser(emailOrUsername, password);

                // Check if user has 2FA enabled
                const fullUser = await request.server.knex('users').where('id', user.id).first();
                
                if (fullUser.twofa_enabled) {
                    if (!twoFactorToken) {
                        // 2FA is required but not provided
                        return reply.code(200).send({
                            requires2FA: true,
                            tempUserId: user.id,
                            message: "2FA token required"
                        });
                    }
                    
                    // Verify 2FA token
                    try {
                        await userModel.verify2FA(user.id, twoFactorToken);
                    } catch (error) {
                        return reply.code(401).send({
                            statusCode: 401,
                            error: "Unauthorized",
                            message: "Invalid 2FA token"
                        });
                    }
                }

                // Generate JWT token if fastify.jwt is available
                if (request.server.jwt) {
                    const token = request.server.jwt.sign({
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }, { expiresIn: '1h' });

                    reply.send({
                        user,
                        token,
                        message: "Login successful"
                    });
                } else {
                    reply.send(user);
                }
            } catch (error) {
                console.error('Login error details:', error);
                reply.code(401).send({
                    statusCode: 401,
                    error: "Unauthorized",
                    message: "Invalid username/email or password"
                });
            }
        }
    };

    return authMethods;
};

// Add these missing methods to your User model
async function findByEmail(email, googleId = null) {
    if (googleId) {
        return await this.db("users")
            .where({ email })
            .orWhere({ google_id: googleId })
            .first();
    }
    return await this.db("users").where({ email }).first();
}

async function createGoogleUser({ googleId, email, username }) {
    const [{ id }] = await this.db("users")
        .insert({
            username,
            email,
            google_id: googleId,
            created_at: new Date(),
            updated_at: new Date()
        })
        .returning("id");
    return { id, username, email, google_id: googleId };
}

// Export advanced functions separately
module.exports.loginHandler = loginHandler;
module.exports.googleAuthHandler = googleAuthHandler;
module.exports.attachCookiesToReply = attachCookiesToReply;
module.exports.refreshTokenHandler = refreshTokenHandler;
