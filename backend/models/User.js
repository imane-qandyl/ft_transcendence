const bcrypt = require("bcrypt");
const CustomError = require("../errors");
const speakeasy = require("speakeasy"); // For TOTP 2FA
const qrcode = require("qrcode"); // For QR code generation
const db = require('../db'); // Import knex instance
const { escapeHtml, sanitizeUrl } = require('../utils/sanitize');

class User {
    constructor(dbInstance) {
        this.db = dbInstance || db; // Use passed instance or fallback
    }

    async createUser(username, email, password) {
        const userEmailExists = await this.db("users")
            .where({ email })
            .first();
        if (userEmailExists) {
            throw new CustomError.BadRequestError("Email already in use");
        }

        const sanitizedUsername = escapeHtml(username);

        const userUsernameExists = await this.db("users")
            .where({ username: sanitizedUsername })
            .first();
        if (userUsernameExists) {
            throw new CustomError.BadRequestError("Username already in use");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [{ id }] = await this.db("users")
            .insert({
                username: sanitizedUsername,
                email,
                password_hash: hashedPassword,
            })
            .returning("id"); // SQLite returns id automatically
        return { id, username: sanitizedUsername, email };
    }

    async loginUser(emailOrUsername, password) {
        // Try to find user by email OR username
        const user = await this.db("users")
            .where({ email: emailOrUsername })
            .orWhere({ username: emailOrUsername })
            .first();

        if (!user) {
            throw new CustomError.UnauthorizedError("Invalid username/email or password");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new CustomError.UnauthorizedError("Invalid username/email or password");
        }

        // Only return user data, not token
        return { id: user.id, username: user.username, email: user.email };
    }

    async enable2FA(userId) {
        const secret = speakeasy.generateSecret({ name: "ft_transcendance" });
        await this.db("users")
            .where({ id: userId })
            .update({ twofa_secret: secret.base32, twofa_enabled: true });
        const qr = await qrcode.toDataURL(secret.otpauth_url);
        return { otpauth_url: secret.otpauth_url, qr };
    }

    async verify2FA(userId, token) {
        const user = await this.db("users").where({ id: userId }).first();
        if (!user || !user.twofa_secret) throw new CustomError.UnauthorizedError("2FA not enabled");
        const verified = speakeasy.totp.verify({
            secret: user.twofa_secret,
            encoding: "base32",
            token,
        });
        if (!verified) throw new CustomError.UnauthorizedError("Invalid 2FA code");
        return true;
    }

    async disable2FA(userId) {
        await this.db("users")
            .where({ id: userId })
            .update({ twofa_secret: null, twofa_enabled: false });
    }

    static async findOrCreateGoogleUser(googleProfile) {
        try {
            // Use the same db instance for consistency
            const dbInstance = db;
            
            // Validate required fields
            if (!googleProfile || !googleProfile.id) {
                throw new Error('Invalid Google profile: missing ID');
            }
            
            if (!googleProfile.emails || !googleProfile.emails[0] || !googleProfile.emails[0].value) {
                throw new Error('Invalid Google profile: missing email');
            }
            
            // First check if google_id column exists BEFORE any queries
            const hasGoogleId = await dbInstance.schema.hasColumn('users', 'google_id');
            if (!hasGoogleId) {
                await dbInstance.schema.alterTable('users', function(table) {
                    table.string('google_id', 255).unique().nullable();
                });
            }

            // Now it's safe to query with google_id
            let user = await dbInstance('users')
                .where('google_id', googleProfile.id)
                .first();

            if (user) {
                return user;
            }

            // Check if user exists with this email
            user = await dbInstance('users')
                .where('email', googleProfile.emails[0].value)
                .first();

            if (user) {
                // Update existing user with google_id
                await dbInstance('users')
                    .where('id', user.id)
                    .update({ google_id: googleProfile.id });
                return { ...user, google_id: googleProfile.id };
            }

            // Create new user
            const rawUsername = googleProfile.displayName || googleProfile.emails[0].value.split('@')[0];
            const rawAvatarUrl = googleProfile.photos && googleProfile.photos[0] ? googleProfile.photos[0].value : null;

            const insertData = {
                username: escapeHtml(rawUsername),
                email: googleProfile.emails[0].value,
                google_id: googleProfile.id,
                avatar_url: sanitizeUrl(rawAvatarUrl),
                created_at: new Date(),
                updated_at: new Date()
            };

            const [newUserId] = await dbInstance('users').insert(insertData);
            return await dbInstance('users').where('id', newUserId).first();
            
        } catch (error) {
            console.error('Error in findOrCreateGoogleUser:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const users = await this.db("users")
                .select('id', 'username', 'email', 'created_at')
                .orderBy('created_at', 'desc');
            return users;
        } catch (error) {
            console.error('Error fetching all users:', error);
            throw error;
        }
    }

    async deleteUser(request, reply) {
        const userId = request.params.id;
        const user = await this.db("users").where({ id: userId }).first();
        if (!user) {
            throw new CustomError.NotFoundError("User not found");
        }
        await this.db("users")
            .where({ id: userId })
            .del();
        reply.code(204).send();
    }

    async updateUser(request, reply) {
        try {
            const allowedFields = ['username', 'avatar_url', 'bio'];
            const updateData = {};
            for (const field of allowedFields) {
                if (request.body.hasOwnProperty(field)) {
                    updateData[field] = request.body[field];
                }
            }
            if (Object.keys(updateData).length === 0) {
                return reply.code(400).send({ error: 'No valid fields to update' });
            }

            // Sanitize text fields to prevent stored XSS
            if (updateData.username) {
                updateData.username = escapeHtml(updateData.username);
            }
            if (updateData.bio) {
                updateData.bio = escapeHtml(updateData.bio);
            }
            if (updateData.avatar_url) {
                const safeUrl = sanitizeUrl(updateData.avatar_url);
                if (!safeUrl) {
                    return reply.code(400).send({ error: 'Invalid avatar URL: only http, https, and data:image/ URLs are allowed' });
                }
                updateData.avatar_url = safeUrl;
            }

            updateData.updated_at = new Date();
            const updatedUser = await this.db("users")
                .where({ id: request.params.id })
                .update(updateData)
                .returning("*");
            if (updatedUser && updatedUser[0]) {
                const { password_hash, twofa_secret, ...safeUser } = updatedUser[0];
                reply.send(safeUser);
            } else {
                reply.send(updatedUser);
            }
        }
        catch (error) {
            reply.code(500).send({ error: 'Failed to update user' });
        }
    }

    async getUserById(request, reply) {
        const userId = request.params.id;
        const user = await this.db("users")
            .where({ id: userId })
            .select('id', 'username', 'email', 'avatar_url', 'bio', 'twofa_enabled', 'created_at', 'updated_at')
            .first();
        if (!user)
            throw new CustomError.NotFoundError("User not found");
        reply.send(user);
    }

    async searchUsers(query, currentUserId) {
        
        if (!query || query.trim().length < 1) {
            return [];
        }

        // Escape LIKE wildcards to prevent wildcard injection
        const sanitizedQuery = query.replace(/[%_\\]/g, '\\$&');

        let queryBuilder = this.db("users")
            .where('username', 'like', `%${sanitizedQuery}%`)
            .select('id', 'username')
            .limit(10);

        // Only exclude current user if we have a valid ID
        if (currentUserId) {
            queryBuilder = queryBuilder.andWhere('id', '!=', currentUserId);
            
            // Also exclude users who have blocked the current user
            // A user who has blocked the current user should not appear in search results
            queryBuilder = queryBuilder.whereNotIn('id', 
                this.db('blocks')
                    .where('blocker_id', '!=', currentUserId)
                    .andWhere('blocked_id', currentUserId)
                    .select('blocker_id')
            );
        }

        const users = await queryBuilder;
        return users;
    }

    /**
     * Find user by email, optionally checking Google ID too
     */
    async findByEmail(email, googleId = null) {
        try {
            let query = this.db("users").where({ email });
            
            if (googleId) {
                query = query.orWhere({ google_id: googleId });
            }
            
            return await query.first();
        } catch (error) {
            console.error("Error finding user by email:", error);
            throw error;
        }
    }

    /**
     * Create a new user from Google OAuth
     */
    async createGoogleUser({ googleId, email, username }) {
        try {
            const userData = {
                username: escapeHtml(username),
                email,
                google_id: googleId,
                created_at: new Date(),
                updated_at: new Date()
            };

            const [newUserId] = await this.db("users").insert(userData);
            return { id: newUserId, username: escapeHtml(username), email, google_id: googleId };
        } catch (error) {
            console.error("Error creating Google user:", error);
            throw error;
        }
    }
}

module.exports = User;